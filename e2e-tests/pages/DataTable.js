const { By } = require('selenium-webdriver')
const { waitForVisible, waitFor, clearField } = require('../support/waits')
const { literal, sortButton } = require('../support/finders')

/** Helpers for the shared DataTable component (toolbar, sortable headers, rows and footer). */
class DataTable {
  constructor(driver, root = '.data-table') {
    this.driver = driver
    this.root = root
  }

  async searchBox() {
    return waitForVisible(this.driver, By.css(`${this.root} .data-table-toolbar input[type="search"]`))
  }

  async search(text) {
    const box = await this.searchBox()
    await clearField(box)
    if (text) {
      await box.sendKeys(text)
    }
  }

  async searchBoxPosition() {
    return this.driver.executeScript(
      `const box = arguments[0].querySelector('.data-table-toolbar .search-box');
       const table = arguments[0].querySelector('table');
       const create = arguments[0].querySelector('.data-table-toolbar-right');
       const b = box.getBoundingClientRect(), t = table.getBoundingClientRect();
       const c = create ? create.getBoundingClientRect() : null;
       return { searchLeft: b.left, searchTop: b.top, searchBottom: b.bottom, tableTop: t.top,
                createRight: c ? c.right : null, createTop: c ? c.top : null, tableRight: t.right,
                tableLeft: t.left, createCenter: c ? (c.left + c.right) / 2 : null,
                tableCenter: (t.left + t.right) / 2 };`,
      await waitForVisible(this.driver, By.css(this.root)),
    )
  }

  async createButton() {
    return this.driver.findElement(By.css(`${this.root} .data-table-toolbar-right button`))
  }

  async hasCreateButton() {
    return (await this.driver.findElements(By.css(`${this.root} .data-table-toolbar-right button`))).length > 0
  }

  async headerButton(column) {
    return waitForVisible(this.driver, sortButton(column))
  }

  async ariaSort(column) {
    const button = await this.headerButton(column)
    const header = await button.findElement(By.xpath('./ancestor::th'))
    return header.getAttribute('aria-sort')
  }

  async sort(column) {
    const button = await this.headerButton(column)
    await button.click()
  }

  /** Text of every cell of the given column (by its header label) for the rows currently shown. */
  async columnValues(label) {
    const headers = await this.driver.findElements(By.css(`${this.root} thead th`))
    const headerTexts = await Promise.all(headers.map((h) => h.getText()))
    const index = headerTexts.findIndex((text) => text.trim().toLowerCase() === label.toLowerCase())
    if (index < 0) {
      throw new Error(`No column "${label}" in ${headerTexts.join(', ')}`)
    }
    const rows = await this.dataRows()
    const values = []
    for (const row of rows) {
      const cells = await row.findElements(By.css('td'))
      values.push((await cells[index].getText()).trim())
    }
    return values
  }

  async dataRows() {
    const rows = await this.driver.findElements(By.css(`${this.root} tbody tr`))
    const result = []
    for (const row of rows) {
      const cls = await row.findElements(By.css('td.table-message'))
      if (cls.length === 0) {
        result.push(row)
      }
    }
    return result
  }

  async rowCount() {
    return (await this.dataRows()).length
  }

  async rowWith(text) {
    return this.driver.findElement(
      By.xpath(`//section[contains(@class,"data-table")]//tbody/tr[contains(normalize-space(.), ${literal(text)})]`),
    )
  }

  async footerText() {
    const footer = await waitForVisible(this.driver, By.css(`${this.root} .data-table-footer > span`))
    return footer.getText()
  }

  async waitForRowCount(predicate, description) {
    return waitFor(this.driver, async () => predicate(await this.rowCount()), description)
  }

  /** Waits until the search has been applied: "match" when the rows contain the text, "none" when the table is empty. */
  async waitForSearchOutcome(text) {
    return waitFor(
      this.driver,
      async () => {
        const rows = await this.dataRows()
        if (rows.length > 0) {
          const texts = await Promise.all(rows.map((row) => row.getText()))
          return texts.every((value) => value.includes(text)) ? "match" : false
        }
        const messages = await this.driver.findElements(By.css(`${this.root} tbody td.table-message`))
        if (messages.length > 0 && (await messages[0].getText()).includes("No records found")) {
          return "none"
        }
        return false
      },
      `search for "${text}" to settle`,
    )
  }

  async waitForRowWith(text) {
    return waitFor(
      this.driver,
      async () => {
        const rows = await this.dataRows()
        for (const row of rows) {
          if ((await row.getText()).includes(text)) {
            return row
          }
        }
        return false
      },
      `a row containing "${text}"`,
    )
  }

  async waitForNoRowWith(text) {
    return waitFor(
      this.driver,
      async () => {
        const rows = await this.dataRows()
        for (const row of rows) {
          if ((await row.getText()).includes(text)) {
            return false
          }
        }
        return true
      },
      `no row containing "${text}"`,
    )
  }
}

module.exports = { DataTable }
