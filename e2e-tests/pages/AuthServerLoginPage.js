const { By } = require('selenium-webdriver')
const { waitForVisible, clearField } = require('../support/waits')

/** The sign-in form of the authorization server (Spring Security's default login page). */
class AuthServerLoginPage {
  constructor(driver) {
    this.driver = driver
  }

  async isShown() {
    return (await this.driver.findElements(By.name('username'))).length > 0
  }

  async logIn({ username, password }) {
    const user = await waitForVisible(this.driver, By.name('username'))
    await clearField(user)
    await user.sendKeys(username)
    const pass = await waitForVisible(this.driver, By.name('password'))
    await clearField(pass)
    await pass.sendKeys(password)
    const submit = await waitForVisible(this.driver, By.xpath('//button[@type="submit" or @type="button"][normalize-space(.)="Sign in"] | //input[@type="submit"]'))
    await submit.click()
  }
}

module.exports = { AuthServerLoginPage }
