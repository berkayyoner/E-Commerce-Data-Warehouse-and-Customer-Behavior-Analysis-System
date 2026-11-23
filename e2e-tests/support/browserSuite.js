const { createDriver, closeDriver } = require('./driver')
const { saveFailureScreenshot } = require('./screenshots')

/**
 * Gives a mocha suite its own Chrome session. The session is created before the first test, a screenshot is saved
 * when a test fails, and the browser is closed after the last test. Call it inside a describe block.
 *
 * Returns an object whose driver property is the session of the suite.
 */
function useBrowser(options = {}) {
  const handle = {
    driver: null,
    async open(overrides = {}) {
      await closeDriver(handle.driver)
      handle.driver = await createDriver({ ...options, ...overrides })
      return handle.driver
    },
  }

  before(async function () {
    this.timeout(120000)
    await handle.open()
  })

  afterEach(async function () {
    if (this.currentTest && this.currentTest.state === 'failed') {
      await saveFailureScreenshot(handle.driver, this.currentTest.fullTitle()).catch(() => {})
    }
  })

  after(async function () {
    await closeDriver(handle.driver)
    handle.driver = null
  })

  return handle
}

module.exports = { useBrowser }
