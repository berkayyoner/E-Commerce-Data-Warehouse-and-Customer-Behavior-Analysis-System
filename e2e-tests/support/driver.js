const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { Builder } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

const config = require('../config')

/**
 * Starts a Chrome session with its own temporary profile, so no login cookie leaks from one test file to the next.
 * The profile folder is removed when the session is closed.
 */
async function createDriver({ window = config.window } = {}) {
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-chrome-'))
  const options = new chrome.Options()
  if (!config.headed) {
    options.addArguments('--headless=new')
  }
  options.addArguments(
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--lang=en-US',
    `--user-data-dir=${profileDir}`,
    `--window-size=${window.width},${window.height}`,
  )
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build()
  await driver.manage().setTimeouts({ implicit: 0, pageLoad: config.timeouts.page, script: config.timeouts.page })
  await driver.manage().window().setRect({ width: window.width, height: window.height })
  // Desktop Chrome keeps a minimum window width, so the viewport is set explicitly to the requested size.
  await driver.sendDevToolsCommand('Emulation.setDeviceMetricsOverride', {
    width: window.width,
    height: window.height,
    deviceScaleFactor: 1,
    mobile: window.width < 768,
  })
  driver.e2eProfileDir = profileDir
  return driver
}

async function closeDriver(driver) {
  if (!driver) {
    return
  }
  const profileDir = driver.e2eProfileDir
  await driver.quit().catch(() => {})
  if (profileDir) {
    fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 3 })
  }
}

module.exports = { createDriver, closeDriver }
