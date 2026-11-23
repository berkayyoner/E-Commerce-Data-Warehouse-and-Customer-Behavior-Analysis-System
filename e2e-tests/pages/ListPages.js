const { By } = require('selenium-webdriver')
const { AppShell } = require('./ConsoleShell')
const { DataTable } = require('./DataTable')
const { buttonByText, fieldByLabel, literal } = require('../support/finders')
const { waitForVisible, waitForAbsent, waitFor } = require('../support/waits')

/** Helpers shared by the console list pages that open from the sidebar. */
class ListPage {
  constructor(driver, sidebarLabel, heading) {
    this.driver = driver
    this.shell = new AppShell(driver)
    this.table = new DataTable(driver)
    this.sidebarLabel = sidebarLabel
    this.heading = heading
  }

  async openFromSidebar() {
    const link = await this.shell.sidebarLinkByLabel(this.sidebarLabel)
    await link.click()
    await this.waitForHeading()
  }

  async waitForHeading() {
    return waitForVisible(this.driver, By.xpath(`//h1[normalize-space(.)=${literal(this.heading)}]`))
  }

  async selectFilter(label, optionText) {
    const select = await waitForVisible(this.driver, fieldByLabel(label, 'select'))
    await select.findElement(By.xpath(`./option[normalize-space(.)=${literal(optionText)}]`)).click()
    return select
  }

  async filterValue(label) {
    const select = await waitForVisible(this.driver, fieldByLabel(label, 'select'))
    return select.getAttribute('value')
  }

  async dateValue(label) {
    const input = await waitForVisible(this.driver, fieldByLabel(label, 'input'))
    return input.getAttribute('value')
  }

  async filterOptionTexts(label) {
    const select = await waitForVisible(this.driver, fieldByLabel(label, 'select'))
    const options = await select.findElements(By.css('option'))
    return Promise.all(options.map((option) => option.getText()))
  }

  async openCreate() {
    await (await this.table.createButton()).click()
    return waitForVisible(this.driver, By.css('.modal[role="dialog"]'))
  }

  async cancelDialog() {
    await (await waitForVisible(this.driver, By.xpath('//div[@role="dialog"]//button[normalize-space(.)="Cancel"]'))).click()
    await waitForAbsent(this.driver, By.css('.modal[role="dialog"]'))
  }

  async waitForDialogTitle(title) {
    return waitForVisible(this.driver, By.xpath(`//div[@role="dialog"][.//h2[normalize-space(.)=${literal(title)}]]`))
  }

  async submitButton(label) {
    return waitForVisible(this.driver, By.xpath(`//div[@role="dialog"]//button[@type="submit"][normalize-space(.)=${literal(label)}]`))
  }

  async fieldError(label) {
    const found = await this.driver.findElements(
      By.xpath(`//div[contains(@class,'form-field')][label[normalize-space(.)=${literal(label)}]]//span[contains(@class,'field-error')]`),
    )
    return found.length ? found[0].getText() : ''
  }

  async dialogCount() {
    return (await this.driver.findElements(By.css('.modal[role="dialog"]'))).length
  }

  async waitForFieldError(label, text) {
    return waitFor(this.driver, async () => (await this.fieldError(label)).includes(text), `error "${text}" below ${label}`)
  }
}

class CustomersPage extends ListPage {
  constructor(driver) {
    super(driver, 'Customers', 'Customers')
  }

  /** Opens the edit dialog of the first customer row. The rows are read again on every attempt, as the table reloads. */
  async openEditForFirstRow() {
    await waitFor(
      this.driver,
      async () => {
        if ((await this.dialogCount()) > 0) {
          return true
        }
        const rows = await this.table.dataRows()
        if (rows.length === 0) {
          return false
        }
        await rows[0].findElement(By.css('button[aria-label="Edit customer"]')).click()
        return false
      },
      'the edit dialog of the first customer',
    )
    return this.waitForDialogTitle('Edit customer')
  }

  async closeDialog() {
    await (await waitForVisible(this.driver, By.css('.modal[role="dialog"] .modal-header button[aria-label="Close"]'))).click()
    await waitForAbsent(this.driver, By.css('.modal[role="dialog"]'))
  }
}

class WarehousesPage extends ListPage {
  constructor(driver) {
    super(driver, 'Warehouses', 'Warehouses')
  }

  async submitCreateEmpty() {
    await (await this.submitButton('Create')).click()
  }
}

class OrdersPage extends ListPage {
  constructor(driver) {
    super(driver, 'Orders', 'Orders')
  }

  async setDate(label, value) {
    const input = await waitForVisible(this.driver, fieldByLabel(label, 'input'))
    await this.driver.executeScript(
      `const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
       setter.call(arguments[0], arguments[1]);
       arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
       arguments[0].dispatchEvent(new Event('change', { bubbles: true }));`,
      input,
      value,
    )
    await waitFor(this.driver, async () => (await input.getAttribute('value')) === value, `date ${value} in ${label}`)
  }

  async openFirstOrderRow() {
    const rows = await this.table.dataRows()
    await rows[0].click()
    return waitForVisible(this.driver, By.css('.modal[role="dialog"]'))
  }
}

class SegmentsPage extends ListPage {
  constructor(driver) {
    super(driver, 'Segments', 'Customer segments')
  }

  async runButtons() {
    return this.driver.findElements(buttonByText('Run segmentation'))
  }
}

module.exports = { CustomersPage, WarehousesPage, OrdersPage, SegmentsPage }
