const { By } = require('selenium-webdriver')
const { DataTable } = require('./DataTable')
const { waitForVisible, waitFor } = require('../support/waits')
const { buttonByText } = require('../support/finders')

/** ETL runs page: the list of runs and the run detail modal. */
class EtlRunsPage {
  constructor(driver) {
    this.driver = driver
    this.table = new DataTable(driver)
  }

  async startRunButtons() {
    return this.driver.findElements(buttonByText('Start run'))
  }

  async openFirstRowWithStatus(status) {
    const row = await this.table.waitForRowWith(status)
    await row.click()
    return waitForVisible(this.driver, By.css('.modal[role="dialog"]'))
  }

  async detailTable(heading) {
    return waitForVisible(
      this.driver,
      By.xpath(`//div[@role='dialog']//h3[normalize-space(.)='${heading}']/following::table[1]`),
    )
  }

  async detailRows(heading) {
    const table = await this.detailTable(heading)
    const rows = await table.findElements(By.css('tbody tr'))
    const result = []
    for (const row of rows) {
      const cells = await row.findElements(By.css('th, td'))
      result.push(await Promise.all(cells.map((cell) => cell.getText())))
    }
    return result
  }

  async closeDetail() {
    const close = await waitForVisible(this.driver, By.css('.modal[role="dialog"] .modal-header button[aria-label="Close"]'))
    await close.click()
    await waitFor(
      this.driver,
      async () => (await this.driver.findElements(By.css('.modal[role="dialog"]'))).length === 0,
      'run detail to close',
    )
  }
}

module.exports = { EtlRunsPage }
