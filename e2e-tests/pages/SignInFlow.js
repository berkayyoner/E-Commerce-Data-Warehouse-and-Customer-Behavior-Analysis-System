const { By } = require('selenium-webdriver')
const config = require('../config')
const { AuthServerLoginPage } = require('./AuthServerLoginPage')
const { buttonByText } = require('../support/finders')
const { waitFor, waitForVisible } = require('../support/waits')

/**
 * Signs in to one of the two web apps through the authorization server. A browser profile that already has an
 * authorization session skips the login form, so the form is filled only when it is shown.
 */
async function signIn(driver, appUrl, credentials = config.admin) {
  await driver.get(`${appUrl}/`)
  const startButton = await waitForVisible(driver, buttonByText('Sign in'))
  await startButton.click()

  const loginPage = new AuthServerLoginPage(driver)
  const reached = await waitFor(
    driver,
    async (d) => {
      if (await loginPage.isShown()) {
        return 'login'
      }
      const signedIn = (await d.findElements(By.css('.navbar-username'))).length > 0
      return signedIn ? 'app' : false
    },
    'the authorization server login form or the signed-in application',
    config.timeouts.login,
  )
  if (reached === 'login') {
    await loginPage.logIn(credentials)
  }

  await waitFor(
    driver,
    async (d) => (await d.findElements(By.css('.navbar-username'))).length > 0,
    'the signed-in navigation bar',
    config.timeouts.login,
  )
}

module.exports = { signIn }
