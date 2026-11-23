const { By, Key } = require('selenium-webdriver')
const { AppShell } = require('./ConsoleShell')
const { DataTable } = require('./DataTable')
const { buttonByText, fieldByLabel, literal } = require('../support/finders')
const { waitForVisible, waitForAbsent, waitFor, clearField } = require('../support/waits')

/** Products page of the console: the catalog view and the smart search view. */
class ProductsPage {
  constructor(driver) {
    this.driver = driver
    this.table = new DataTable(driver)
    this.shell = new AppShell(driver)
  }

  async openFromSidebar() {
    const link = await this.shell.sidebarLinkByLabel('Products')
    await link.click()
    await waitForVisible(this.driver, By.xpath("//h1[normalize-space(.)='Products']"))
  }

  async selectView(label) {
    const button = await waitForVisible(
      this.driver,
      By.xpath(`//div[contains(@class,'segmented')]//button[normalize-space(.)=${literal(label)}]`),
    )
    await button.click()
    await waitFor(
      this.driver,
      async () => (await button.getAttribute('aria-pressed')) === 'true',
      `${label} view to be selected`,
    )
  }

  /** Opens the create dialog. The button is pressed again until the dialog appears, as the page may still be loading. */
  async openCreateModal() {
    await waitFor(
      this.driver,
      async () => {
        if ((await this.driver.findElements(By.css('.modal[role="dialog"]'))).length > 0) {
          return true
        }
        await (await this.table.createButton()).click()
        return false
      },
      'the create dialog to open',
    )
    return waitForVisible(this.driver, By.css('.modal[role="dialog"]'))
  }

  async fillProduct({ name, price, category, brand }) {
    await (await waitForVisible(this.driver, fieldByLabel('Name'))).sendKeys(name)
    await (await waitForVisible(this.driver, fieldByLabel('Price'))).sendKeys(price)
    await (await waitForVisible(this.driver, fieldByLabel('Category'))).sendKeys(category)
    await (await waitForVisible(this.driver, fieldByLabel('Brand'))).sendKeys(brand)
  }

  async submitModal(label) {
    const button = await waitForVisible(
      this.driver,
      By.xpath(`//div[@role="dialog"]//button[@type="submit"][normalize-space(.)=${literal(label)}]`),
    )
    await button.click()
  }

  async waitForModalClosed() {
    return waitForAbsent(this.driver, By.css('.modal[role="dialog"]'))
  }

  async waitForToast(kind, text) {
    return waitFor(
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
  }

  async clickDeleteOnRow(text) {
    const row = await this.table.waitForRowWith(text)
    await row.findElement(By.css('button[aria-label="Delete product"]')).click()
    const confirm = await waitForVisible(this.driver, By.xpath('//div[@role="dialog"]//button[contains(@class,"button-danger")]'))
    return confirm
  }

  async confirmDelete() {
    const confirm = await waitForVisible(this.driver, By.xpath('//div[@role="dialog"]//button[contains(@class,"button-danger")]'))
    await confirm.click()
  }

  async cancelDialog() {
    const cancel = await waitForVisible(this.driver, By.xpath('//div[@role="dialog"]//button[normalize-space(.)="Cancel"]'))
    await cancel.click()
  }

  /** Smart search view. */
  async searchInput() {
    return waitForVisible(this.driver, By.css('input[role="combobox"]'))
  }

  /** Runs a search by pressing Enter in the box, which works in every language. */
  async runSearch(text) {
    const box = await this.searchInput()
    await clearField(box)
    await box.sendKeys(text, Key.ENTER)
  }

  async suggestionTexts() {
    const options = await this.driver.findElements(By.css('ul[role="listbox"] [role="option"]'))
    return Promise.all(options.map((option) => option.getText()))
  }

  async facetCategoryNames() {
    const labels = await this.driver.findElements(
      By.xpath("(//aside[contains(@class,'facet-panel')]//fieldset)[1]//label/span[not(contains(@class,'facet-count'))]"),
    )
    return Promise.all(labels.map((label) => label.getText()))
  }

  async resultsSummaryText() {
    return waitFor(
      this.driver,
      async () => {
        const matches = await this.driver.findElements(
          By.xpath("//div[contains(@class,'smart-results')]//*[contains(normalize-space(.),'products found') or contains(normalize-space(.),'No products match')]"),
        )
        return matches.length > 0 ? (await matches[0].getText()) : false
      },
      'search results summary',
    )
  }
}

module.exports = { ProductsPage }
