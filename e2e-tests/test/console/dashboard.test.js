const assert = require('node:assert/strict')
const { By } = require('selenium-webdriver')

const config = require('../../config')
const { useBrowser } = require('../../support/browserSuite')
const { signIn } = require('../../pages/SignInFlow')
const { AppShell } = require('../../pages/ConsoleShell')
const { ConsoleDashboardPage } = require('../../pages/ConsoleDashboardPage')
const { waitForUrl } = require('../../support/waits')

describe('Console: sign-in and dashboard (ADMIN)', function () {
  const browser = useBrowser()

  before(async function () {
    this.timeout(120000)
    await signIn(browser.driver, config.consoleUrl)
  })

  it('signs in and lands on the dashboard with the signed-in name and role', async function () {
    await waitForUrl(browser.driver, /\/dashboard$/)
    const shell = new AppShell(browser.driver)
    assert.equal(await shell.signedInUsername(), config.admin.username)
    assert.deepEqual(await shell.roleBadges(), ['Administrator'])
    assert.equal(await shell.pageTitle(), 'Dashboard')
  })

  it('shows non-empty revenue and order KPI cards', async function () {
    const dashboard = new ConsoleDashboardPage(browser.driver)
    await dashboard.waitForKpis()
    const kpis = await dashboard.kpiValues()
    const digits = (text) => Number(String(text || '').replace(/[^\d]/g, ''))
    assert.ok(digits(kpis.Revenue) > 0, `revenue value ${kpis.Revenue}`)
    assert.ok(digits(kpis.Orders) > 0, `orders value ${kpis.Orders}`)
  })

  it('shows the monthly chart, the RFM segment cards and the latest ETL run status', async function () {
    const dashboard = new ConsoleDashboardPage(browser.driver)
    await dashboard.monthlyChartSection()
    assert.ok((await dashboard.segmentCardCount()) > 0, 'segment cards')
    assert.ok((await dashboard.lastRunStatusText()).trim().length > 0, 'last run status')
  })
})
