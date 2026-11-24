const { By } = require('selenium-webdriver')
const config = require('../config')
const { LoginPage } = require('./LoginPage')
const { waitFor } = require('../support/waits')

/**
 * Signs in through the sign-in page of the web application and waits until the navigation bar shows the signed-in
 * person. The default credentials are the administrator of the local stack.
 */
async function signIn(driver, credentials = config.admin) {
  const loginPage = new LoginPage(driver)
  await loginPage.open()
  await loginPage.fillAndSubmit(credentials)
  await waitFor(
    driver,
    async (d) => (await d.findElements(By.css('.navbar-username'))).length > 0,
    'the signed-in navigation bar',
    config.timeouts.login,
  )
}

module.exports = { signIn }
