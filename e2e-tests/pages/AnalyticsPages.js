const { By } = require('selenium-webdriver')
const config = require('../config')
const { AppShell } = require('./AppShell')
const { literal } = require('../support/finders')
const { waitFor, waitForVisible, waitForAbsent, clearField } = require('../support/waits')

/** Sales overview page (/analytics/sales), open to every role. */
class SalesOverviewPage {
  constructor(driver) {
    this.driver = driver
  }

  async open() {
    await this.driver.get(`${config.baseUrl}/analytics/sales`)
    await waitForVisible(this.driver, By.xpath("//main//h1[normalize-space(.)='Sales overview']"))
  }

  async waitForKpis() {
    return waitFor(
      this.driver,
      async () => (await this.driver.findElements(By.css('.kpi-grid .kpi-card .kpi-value'))).length >= 4,
      'the KPI cards',
    )
  }

  /** Map of KPI label to its displayed value. */
  async kpiValues() {
    const cards = await this.driver.findElements(By.css('.kpi-grid .kpi-card'))
    const result = {}
    for (const card of cards) {
      const label = (await (await card.findElement(By.css('.kpi-label'))).getText()).trim()
      result[label] = (await (await card.findElement(By.css('.kpi-value'))).getText()).trim()
    }
    return result
  }

  async waitForRevenueChange(previous) {
    return waitFor(
      this.driver,
      async () => {
        const revenue = (await this.kpiValues()).Revenue
        return revenue && revenue !== previous ? revenue : false
      },
      `the revenue KPI to change from ${previous}`,
    )
  }

  async choosePreset(label) {
    const button = await waitForVisible(
      this.driver,
      By.xpath(`//div[contains(@class,'filter-fields')]//div[@role='group']//button[normalize-space(.)=${literal(label)}]`),
    )
    await button.click()
    await waitFor(this.driver, async () => (await button.getAttribute('aria-pressed')) === 'true', `${label} to be pressed`)
  }

  async chooseGranularity(label) {
    const button = await waitForVisible(
      this.driver,
      By.xpath(`//div[@role='group'][@aria-label='Granularity']//button[normalize-space(.)=${literal(label)}]`),
    )
    await button.click()
    await waitFor(this.driver, async () => (await button.getAttribute('aria-pressed')) === 'true', `${label} granularity`)
  }

  async trendSummary() {
    return waitFor(
      this.driver,
      async () => {
        const matches = await this.driver.findElements(By.xpath("//section[contains(@class,'widget')][.//h2[normalize-space(.)='Sales trend']]//*[contains(@aria-label,'Revenue by')]"))
        return matches.length > 0 ? matches[0].getAttribute('aria-label') : false
      },
      'the sales trend summary',
    )
  }

  async widgetTitles() {
    const titles = await this.driver.findElements(By.css('.widget-title'))
    return Promise.all(titles.map((title) => title.getText()))
  }

  async waitForWidgetTitle(title) {
    return waitFor(this.driver, async () => (await this.widgetTitles()).includes(title), `widget "${title}"`)
  }

  async toggleChartTable() {
    const toggle = await waitForVisible(this.driver, By.css('.chart-table-toggle'))
    await toggle.click()
  }
}

/** Product search page (/analytics/search), open to every role. */
class ProductSearchPage {
  constructor(driver) {
    this.driver = driver
    this.shell = new AppShell(driver)
  }

  async open() {
    await this.driver.get(`${config.baseUrl}/analytics/search`)
    await waitForVisible(this.driver, By.xpath("//main//h1[normalize-space(.)='Product search']"))
  }

  async openFromNavigation() {
    const link = await waitForVisible(this.driver, By.xpath("//nav[contains(@class,'sidebar')]//a[normalize-space(.)='Product search']"))
    await link.click()
    await waitForVisible(this.driver, By.xpath("//main//h1[normalize-space(.)='Product search']"))
  }

  async box() {
    return waitForVisible(this.driver, By.css('form[role="search"] input[role="combobox"]'))
  }

  async search(text) {
    const box = await this.box()
    await clearField(box)
    await box.sendKeys(text)
    await (await waitForVisible(this.driver, By.xpath("//form[@role='search']//button[@type='submit']"))).click()
  }

  async totalText() {
    return waitFor(
      this.driver,
      async () => {
        const counts = await this.driver.findElements(By.css('.results-count'))
        if (counts.length === 0) {
          return false
        }
        const text = (await counts[0].getText()).trim()
        return text.length > 0 ? text : false
      },
      'the result count',
    )
  }

  async totalNumber() {
    const text = await this.totalText()
    return Number(text.replace(/[^\d]/g, ''))
  }

  async waitForTotalChange(previous) {
    return waitFor(this.driver, async () => (await this.totalNumber()) !== previous, `total to change from ${previous}`)
  }

  async resultPrices() {
    const prices = await this.driver.findElements(By.css('.results .result-price'))
    return Promise.all(prices.map((price) => price.getText()))
  }

  async facetCheckboxes() {
    return this.driver.findElements(By.css('aside.facets input[type="checkbox"]'))
  }

  async setPriceRange(min, max) {
    const minInput = await waitForVisible(this.driver, By.xpath("//aside[contains(@class,'facets')]//div[contains(@class,'form-field')][label[normalize-space(.)='Minimum']]//input"))
    const maxInput = await waitForVisible(this.driver, By.xpath("//aside[contains(@class,'facets')]//div[contains(@class,'form-field')][label[normalize-space(.)='Maximum']]//input"))
    await clearField(minInput)
    await minInput.sendKeys(String(min))
    await clearField(maxInput)
    await maxInput.sendKeys(String(max))
    await (await waitForVisible(this.driver, By.xpath("//aside[contains(@class,'facets')]//button[normalize-space(.)='Apply price']"))).click()
  }

  /** Removes every filter when the clear button is shown (it is absent while no filter is applied). */
  async clearFilters() {
    const buttons = await this.driver.findElements(
      By.xpath("//aside[contains(@class,'facets')]//button[contains(normalize-space(.),'Clear filters')]"),
    )
    if (buttons.length > 0) {
      await this.driver.executeScript("arguments[0].scrollIntoView({ block: 'center' });", buttons[0])
      await buttons[0].click()
    }
  }

  async suggestionOptions() {
    return this.driver.findElements(By.css('ul[role="listbox"] [role="option"]'))
  }
}

module.exports = { SalesOverviewPage, ProductSearchPage, waitForAbsent }
