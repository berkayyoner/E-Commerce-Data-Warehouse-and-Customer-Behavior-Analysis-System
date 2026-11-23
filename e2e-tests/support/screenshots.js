const fs = require('node:fs')
const path = require('node:path')
const config = require('../config')

/** Saves a PNG of the browser into the screenshots folder, named after the test that failed. */
async function saveFailureScreenshot(driver, testTitle) {
  if (!driver) {
    return null
  }
  fs.mkdirSync(config.screenshotDir, { recursive: true })
  const safeName = testTitle.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 120)
  const file = path.join(config.screenshotDir, `${safeName}.png`)
  const png = await driver.takeScreenshot()
  fs.writeFileSync(file, png, 'base64')
  return file
}

module.exports = { saveFailureScreenshot }
