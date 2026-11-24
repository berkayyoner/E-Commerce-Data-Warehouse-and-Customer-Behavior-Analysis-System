const config = require('../config')
const { By } = require('selenium-webdriver')
const { fieldByLabel } = require('../support/finders')
const { waitForVisible, clearField } = require('../support/waits')

/** The sign-in page of the web application, reached at /login. */
class LoginPage {
  constructor(driver) {
    this.driver = driver
  }

  async open() {
    await this.driver.get(`${config.baseUrl}/login`)
    await waitForVisible(this.driver, fieldByLabel('Username'))
  }

  async fillAndSubmit({ username, password }) {
    const user = await waitForVisible(this.driver, fieldByLabel('Username'))
    await clearField(user)
    await user.sendKeys(username)
    const pass = await waitForVisible(this.driver, fieldByLabel('Password'))
    await clearField(pass)
    await pass.sendKeys(password)
    const submit = await waitForVisible(this.driver, By.xpath("//form[contains(@class,'login-form')]//button[@type='submit']"))
    await submit.click()
  }

  /** The message shown above the form after a failed sign in, or an empty string. */
  async alertText() {
    const alerts = await this.driver.findElements(By.css('.login-form .form-alert'))
    return alerts.length > 0 ? (await alerts[0].getText()).trim() : ''
  }
}

module.exports = { LoginPage }
