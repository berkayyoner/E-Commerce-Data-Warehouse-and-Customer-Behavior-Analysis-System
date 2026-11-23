const assert = require('node:assert/strict')
const { By } = require('selenium-webdriver')

const config = require('../../config')
const { useBrowser } = require('../../support/browserSuite')
const { signIn } = require('../../pages/SignInFlow')
const { PortalDashboardPage } = require('../../pages/PortalPages')
const { waitFor, textOf } = require('../../support/waits')

function numeric(text) {
  return Number(text.replace(/[^\d]/g, ''))
}

describe('Portal: sales dashboard (ADMIN)', function () {
  const browser = useBrowser()
  let dashboard

  before(async function () {
    this.timeout(120000)
    await signIn(browser.driver, config.portalUrl)
    dashboard = new PortalDashboardPage(browser.driver)
    await dashboard.waitForKpis()
  })

  it('shows non-empty KPI cards for the default period', async function () {
    const kpis = await dashboard.kpiValues()
    assert.ok(kpis.Revenue, 'revenue card')
    assert.ok(kpis.Orders && numeric(kpis.Orders) > 0, `orders value ${kpis.Orders}`)
  })

  it('changes the revenue KPI when the period preset changes', async function () {
    await dashboard.choosePreset('Last 30 days')
    await dashboard.waitForKpis()
    const recent = (await dashboard.kpiValues()).Revenue
    await dashboard.choosePreset('All time')
    const allTime = await dashboard.waitForRevenueChange(recent)
    assert.notEqual(allTime, recent)
  })

  it('switches the sales trend granularity', async function () {
    await dashboard.chooseGranularity('Week')
    assert.match(await dashboard.trendSummary(), /Revenue by week/)
    await dashboard.chooseGranularity('Year')
    await waitFor(browser.driver, async () => /Revenue by year/.test(await dashboard.trendSummary().catch(() => '')), 'year summary')
    await dashboard.chooseGranularity('Month')
    await waitFor(browser.driver, async () => /Revenue by month/.test(await dashboard.trendSummary().catch(() => '')), 'month summary')
  })

  it('shows the trend values as a table when asked', async function () {
    await dashboard.toggleChartTable()
    await waitFor(browser.driver, async () => (await browser.driver.findElements(By.css('.chart-table-wrap table tbody tr'))).length > 0, 'the table rows')
    assert.equal(await textOf(browser.driver, By.css('.chart-table-toggle')), 'Hide table')
    await dashboard.toggleChartTable()
  })

  it('shows the top products and the category bars', async function () {
    await dashboard.waitForWidgetTitle('Top products')
    await dashboard.waitForWidgetTitle('Revenue by category')
    assert.ok((await browser.driver.findElements(By.css('.bar-list'))).length >= 2, 'bar lists for products and categories')
  })

  it('shows the customer value widgets to an administrator', async function () {
    await dashboard.waitForWidgetTitle('Customer value')
    await dashboard.waitForWidgetTitle('Top customers')
  })
})
