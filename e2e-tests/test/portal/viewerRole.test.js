const assert = require('node:assert/strict')
const { By } = require('selenium-webdriver')

const config = require('../../config')
const { createDriver, closeDriver } = require('../../support/driver')
const { signIn } = require('../../pages/SignInFlow')
const { UsersPage } = require('../../pages/UsersPage')
const { PortalDashboardPage } = require('../../pages/PortalPages')
const { uniqueName } = require('../../support/testData')
const { waitForVisible } = require('../../support/waits')

const PASSWORD = 'E2e-Pass-2026'

describe('Portal: VIEWER role', function () {
  const viewer = { username: uniqueName('e2e-portal'), displayName: 'E2E Portal Viewer', role: 'VIEWER' }
  let adminDriver
  let viewerDriver

  before(async function () {
    this.timeout(180000)
    adminDriver = await createDriver()
    await signIn(adminDriver, config.consoleUrl)
    const users = new UsersPage(adminDriver)
    await users.openFromSidebar()
    await users.openCreateModal()
    await users.fillForm({ username: viewer.username, displayName: viewer.displayName, role: viewer.role, password: PASSWORD })
    await users.submitModal('Create')
    await users.waitForModalClosed()

    viewerDriver = await createDriver()
    await signIn(viewerDriver, config.portalUrl, { username: viewer.username, password: PASSWORD })
  })

  after(async function () {
    this.timeout(120000)
    await closeDriver(viewerDriver)
    if (adminDriver) {
      const users = new UsersPage(adminDriver)
      await users.openFromSidebar()
      await users.deleteUserIfPresent(viewer.username)
    }
    await closeDriver(adminDriver)
  })

  it('shows the sales dashboard without the customer widgets', async function () {
    const dashboard = new PortalDashboardPage(viewerDriver)
    await dashboard.waitForKpis()
    await dashboard.waitForWidgetTitle('Top products')
    const titles = await dashboard.widgetTitles()
    assert.ok(!titles.includes('Customer value'), 'no customer value widget')
    assert.ok(!titles.includes('Top customers'), 'no top customers widget')
    assert.equal((await viewerDriver.findElements(By.css('section[aria-label="Customer value"]'))).length, 0)
  })

  it('lists only the portal pages in the navigation for a viewer', async function () {
    const links = await viewerDriver.findElements(By.xpath("//nav[@id='primary-navigation']//a"))
    const labels = await Promise.all(links.map((link) => link.getText()))
    assert.deepEqual(labels, ['Dashboard', 'Product search'])
    await waitForVisible(viewerDriver, By.css('.navbar-username'))
  })
})
