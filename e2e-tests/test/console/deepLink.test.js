const assert = require('node:assert/strict')
const { By } = require('selenium-webdriver')

const config = require('../../config')
const { useBrowser } = require('../../support/browserSuite')
const { signIn } = require('../../pages/SignInFlow')
const { waitFor, waitForUrl, textOf } = require('../../support/waits')

describe('Console: deep link after sign-in', function () {
  const browser = useBrowser()

  before(async function () {
    this.timeout(120000)
    await signIn(browser.driver)
  })

  it('opens /orders directly and stays on it after the silent sign-in', async function () {
    const driver = browser.driver
    // A direct load of the page: the tab keeps its refresh token, so the app restores the session silently.
    await driver.get(`${config.baseUrl}/orders`)

    await waitForUrl(driver, /\/orders$/)
    await waitFor(
      driver,
      async (d) => (await d.findElements(By.css('.navbar-username'))).length > 0,
      'the silent sign-in to finish',
      config.timeouts.login,
    )
    assert.equal(await textOf(driver, By.css('main h1')), 'Orders')
    assert.equal(await driver.getCurrentUrl(), `${config.baseUrl}/orders`)
  })
})
