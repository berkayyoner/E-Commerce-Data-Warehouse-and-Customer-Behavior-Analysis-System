const { By } = require('selenium-webdriver')
const { waitForVisible, waitFor, waitForText } = require('../support/waits')

/** Dashboard of the personnel console. */
class ConsoleDashboardPage {
  constructor(driver) {
    this.driver = driver
  }

  async waitForKpis() {
    return waitFor(
      this.driver,
      async () => (await this.driver.findElements(By.css('.kpi-card .kpi-value'))).length === 6,
      'six KPI cards',
    )
  }

  /** Map of KPI label to shown value, for example { Revenue: 'TRY 1,234' }. */
  async kpiValues() {
    const cards = await this.driver.findElements(By.css('.kpi-card'))
    const result = {}
    for (const card of cards) {
      const label = (await (await card.findElement(By.css('.kpi-label'))).getText()).trim()
      result[label] = (await (await card.findElement(By.css('.kpi-value'))).getText()).trim()
    }
    return result
  }

  async widgetTitles() {
    const titles = await this.driver.findElements(By.css('.dashboard-grid .widget-title'))
    return Promise.all(titles.map((title) => title.getText()))
  }

  async waitForWidget(title) {
    return waitForText(this.driver, By.css('.dashboard-grid'), title)
  }

  async segmentCardCount() {
    return (await this.driver.findElements(By.css('.segment-card'))).length
  }

  async lastRunStatusText() {
    const cell = await waitForVisible(
      this.driver,
      By.xpath("//section[contains(@class,'widget')][.//h2[normalize-space(.)='Latest ETL run']]//dd[.//span[contains(@class,'badge')]]"),
    )
    return cell.getText()
  }

  async monthlyChartSection() {
    return waitForVisible(
      this.driver,
      By.xpath("//section[contains(@class,'widget')][.//h2[normalize-space(.)='Monthly revenue']]"),
    )
  }
}

module.exports = { ConsoleDashboardPage }
