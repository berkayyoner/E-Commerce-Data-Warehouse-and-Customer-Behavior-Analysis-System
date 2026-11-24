const assert = require('node:assert/strict')
const { By } = require('selenium-webdriver')

const { createDriver, closeDriver } = require('../../support/driver')
const { createUser, deleteUserIfPresent } = require('../../support/authApi')
const { signIn } = require('../../pages/SignInFlow')
const { SalesOverviewPage, ProductSearchPage } = require('../../pages/AnalyticsPages')
const { uniqueName } = require('../../support/testData')
const { waitForVisible, textOf } = require('../../support/waits')

const PASSWORD = 'E2e-Pass-2026'

describe('VIEWER role on the analytics pages', function () {
  const viewer = { username: uniqueName('e2e-viewer'), displayName: 'E2E Analytics Viewer', role: 'VIEWER' }
  let viewerDriver

  before(async function () {
    this.timeout(180000)
    await createUser({ ...viewer, password: PASSWORD })
    viewerDriver = await createDriver()
    await signIn(viewerDriver, { username: viewer.username, password: PASSWORD })
  })

  after(async function () {
    this.timeout(120000)
    await closeDriver(viewerDriver)
    await deleteUserIfPresent(viewer.username)
  })

  it('shows the sales overview without the customer widgets', async function () {
    const salesPage = new SalesOverviewPage(viewerDriver)
    await salesPage.open()
    await salesPage.waitForKpis()
    await salesPage.waitForWidgetTitle('Top products')
    const titles = await salesPage.widgetTitles()
    assert.ok(!titles.includes('Customer value'), 'no customer value widget')
    assert.ok(!titles.includes('Top customers'), 'no top customers widget')
    assert.equal((await viewerDriver.findElements(By.css('section[aria-label="Customer value"]'))).length, 0)
  })

  it('lists only the analytics pages in the navigation for a viewer', async function () {
    const links = await viewerDriver.findElements(By.xpath("//nav[contains(@class,'sidebar')]//a"))
    const labels = await Promise.all(links.map((link) => link.getText()))
    assert.deepEqual(labels, ['Sales overview', 'Product search'])
    await waitForVisible(viewerDriver, By.css('.navbar-username'))
  })

  it('opens the product search page', async function () {
    const search = new ProductSearchPage(viewerDriver)
    await search.open()
    assert.equal(await textOf(viewerDriver, By.css('main h1')), 'Product search')
  })
})
