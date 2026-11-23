const { By } = require('selenium-webdriver')
const { AppShell } = require('./ConsoleShell')
const { DataTable } = require('./DataTable')
const { buttonByText, fieldByLabel, elementWithText, literal } = require('../support/finders')
const { waitForVisible, waitForAbsent, waitFor } = require('../support/waits')

/** The console debounces its search input by 300 ms; wait a little longer than that. */
const SEARCH_DEBOUNCE_MS = 500

/** Personnel accounts page (administrators only). */
class UsersPage {
  constructor(driver) {
    this.driver = driver
    this.table = new DataTable(driver)
    this.shell = new AppShell(driver)
  }

  async openFromSidebar() {
    const link = await this.shell.sidebarLinkByLabel('Users')
    await link.click()
    await waitForVisible(this.driver, By.xpath("//h1[normalize-space(.)='Personnel accounts']"))
  }

  async createButton() {
    return this.table.createButton()
  }

  async openCreateModal() {
    const button = await this.table.createButton()
    await button.click()
    return waitForVisible(this.driver, By.css('.modal[role="dialog"]'))
  }

  async modalShows(title) {
    return (await this.driver.findElements(By.xpath(`//div[@role="dialog"][.//h2[normalize-space(.)=${literal(title)}]]`))).length > 0
  }

  async fillForm({ username, displayName, email, role, password }) {
    if (username !== undefined) {
      await (await waitForVisible(this.driver, fieldByLabel('Username'))).sendKeys(username)
    }
    if (displayName !== undefined) {
      await (await waitForVisible(this.driver, fieldByLabel('Display name'))).sendKeys(displayName)
    }
    if (email !== undefined) {
      await (await waitForVisible(this.driver, fieldByLabel('E-mail (optional)'))).sendKeys(email)
    }
    if (role !== undefined) {
      const select = await waitForVisible(this.driver, fieldByLabel('Role', 'select'))
      await select.findElement(By.css(`option[value="${role}"]`)).click()
    }
    if (password !== undefined) {
      await (await waitForVisible(this.driver, fieldByLabel('Password'))).sendKeys(password)
    }
  }

  async submitModal(label) {
    const button = await waitForVisible(this.driver, By.xpath(`//div[@role="dialog"]//button[@type="submit"][normalize-space(.)=${literal(label)}]`))
    await button.click()
  }

  async cancelModal() {
    const button = await waitForVisible(this.driver, By.xpath('//div[@role="dialog"]//button[normalize-space(.)="Cancel"]'))
    await button.click()
    await waitForAbsent(this.driver, By.css('.modal[role="dialog"]'))
  }

  async fieldError(label) {
    const elements = await this.driver.findElements(
      By.xpath(`//div[contains(@class,'form-field')][label[normalize-space(.)=${literal(label)}]]//span[contains(@class,'field-error')]`),
    )
    return elements.length ? elements[0].getText() : ''
  }

  async waitForFieldError(label, text) {
    return waitFor(this.driver, async () => (await this.fieldError(label)).includes(text), `error "${text}" under ${label}`)
  }

  async toastText(kind = 'success') {
    const toast = await waitForVisible(this.driver, By.css(`.toast-${kind}`))
    return toast.getText()
  }

  async waitForToast(kind, text) {
    try {
      return await waitFor(
        this.driver,
        async () => {
          for (const toast of await this.driver.findElements(By.css(`.toast-${kind}`))) {
            if ((await toast.getText()).includes(text)) {
              return true
            }
          }
          return false
        },
        `${kind} toast "${text}"`,
      )
    } catch (error) {
      const shown = await this.driver.findElements(By.css('.toast'))
      const texts = await Promise.all(shown.map((toast) => toast.getText()))
      throw new Error(`${error.message}; toasts shown: ${JSON.stringify(texts)}`)
    }
  }

  async waitForModalClosed() {
    return waitForAbsent(this.driver, By.css('.modal[role="dialog"]'))
  }

  async deleteUser(username) {
    await this.table.search(username)
    const row = await this.table.waitForRowWith(username)
    await row.findElement(By.css('button[aria-label="Delete account"]')).click()
    const confirm = await waitForVisible(this.driver, buttonByText('Delete'))
    await confirm.click()
    await this.table.waitForNoRowWith(username)
  }

  /** Removes the account if it exists. Used for cleanup after a test; closes a dialog left open by a failed step. */
  async deleteUserIfPresent(username) {
    if ((await this.dialogCount()) > 0) {
      await this.closeDialog()
    }
    // The table keeps the "No records found" message of the previous search until the debounced new search has
    // answered, so an empty result is trusted only when it is still empty after the debounce time has passed.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.table.search(username)
      const outcome = await this.table.waitForSearchOutcome(username)
      if (outcome === "match") {
        await this.deleteUser(username)
        return true
      }
      await this.driver.sleep(SEARCH_DEBOUNCE_MS)
    }
    return false
  }

  async dialogCount() {
    return (await this.driver.findElements(By.css('.modal[role="dialog"]'))).length
  }

  async closeDialog() {
    const close = await this.driver.findElement(By.css('.modal[role="dialog"] .modal-header button[aria-label="Close"]'))
    await close.click()
    await waitForAbsent(this.driver, By.css('.modal[role="dialog"]'))
  }

  async rowNames() {
    return this.table.columnValues('Username')
  }

  async sortButtonRowFirst() {
    return (await this.table.columnValues('Username'))[0]
  }
}

module.exports = { UsersPage, elementWithText }
