const assert = require('node:assert/strict')
const { By } = require('selenium-webdriver')

const { useBrowser } = require('../../support/browserSuite')
const { signIn } = require('../../pages/SignInFlow')
const { SalesOverviewPage } = require('../../pages/AnalyticsPages')
const { waitFor, textOf } = require('../../support/waits')

function numeric(text) {
  return Number(text.replace(/[^\d]/g, ''))
}

describe('Sales overview (ADMIN)', function () {
  const browser = useBrowser()
  let salesPage

  before(async function () {
    this.timeout(120000)
    await signIn(browser.driver)
    salesPage = new SalesOverviewPage(browser.driver)
    await salesPage.open()
    await salesPage.waitForKpis()
  })

  it('shows non-empty KPI cards for the default period', async function () {
    const kpis = await salesPage.kpiValues()
    assert.ok(kpis.Revenue, 'revenue card')
    assert.ok(kpis.Orders && numeric(kpis.Orders) > 0, `orders value ${kpis.Orders}`)
  })

  it('changes the revenue KPI when the period preset changes', async function () {
    await salesPage.choosePreset('Last 30 days')
    await salesPage.waitForKpis()
    const recent = (await salesPage.kpiValues()).Revenue
    await salesPage.choosePreset('All time')
    const allTime = await salesPage.waitForRevenueChange(recent)
    assert.notEqual(allTime, recent)
  })

  it('switches the sales trend granularity', async function () {
    await salesPage.chooseGranularity('Week')
    assert.match(await salesPage.trendSummary(), /Revenue by week/)
    await salesPage.chooseGranularity('Year')
    await waitFor(browser.driver, async () => /Revenue by year/.test(await salesPage.trendSummary().catch(() => '')), 'year summary')
    await salesPage.chooseGranularity('Month')
    await waitFor(browser.driver, async () => /Revenue by month/.test(await salesPage.trendSummary().catch(() => '')), 'month summary')
  })

  it('shows the trend values as a table when asked', async function () {
    await salesPage.toggleChartTable()
    await waitFor(browser.driver, async () => (await browser.driver.findElements(By.css('.chart-table-wrap table tbody tr'))).length > 0, 'the table rows')
    assert.equal(await textOf(browser.driver, By.css('.chart-table-toggle')), 'Hide table')
    await salesPage.toggleChartTable()
  })

  it('shows the top products and the category bars', async function () {
    await salesPage.waitForWidgetTitle('Top products')
    await salesPage.waitForWidgetTitle('Revenue by category')
    assert.ok((await browser.driver.findElements(By.css('.bar-list'))).length >= 2, 'bar lists for products and categories')
  })

  it('shows the customer value widgets to an administrator', async function () {
    await salesPage.waitForWidgetTitle('Customer value')
    await salesPage.waitForWidgetTitle('Top customers')
  })
})
