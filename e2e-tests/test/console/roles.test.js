const assert = require('node:assert/strict')
const { By } = require('selenium-webdriver')

const config = require('../../config')
const { useBrowser } = require('../../support/browserSuite')
const { createDriver, closeDriver } = require('../../support/driver')
const { signIn } = require('../../pages/SignInFlow')
const { AppShell } = require('../../pages/ConsoleShell')
const { UsersPage } = require('../../pages/UsersPage')
const { DataTable } = require('../../pages/DataTable')
const { ProductsPage } = require('../../pages/ProductsPage')
const { CustomersPage, WarehousesPage } = require('../../pages/ListPages')
const { EtlRunsPage } = require('../../pages/EtlRunsPage')
const { uniqueName } = require('../../support/testData')
const { textOf, waitForVisible, waitForUrl } = require('../../support/waits')

const PASSWORD = 'E2e-Pass-2026'

describe('Console: role restrictions', function () {
  const accounts = {
    analyst: { username: uniqueName('e2e-analyst'), role: 'ANALYST', displayName: 'E2E Analyst' },
    viewer: { username: uniqueName('e2e-viewer'), role: 'VIEWER', displayName: 'E2E Viewer' },
  }

  // Registered before the browser hooks so that the accounts are removed while the administrator session is open.
  after(async function () {
    this.timeout(120000)
    const users = new UsersPage(admin.driver)
    await users.openFromSidebar()
    for (const account of Object.values(accounts)) {
      await users.deleteUserIfPresent(account.username)
    }
  })

  const admin = useBrowser()

  before(async function () {
    this.timeout(120000)
    await signIn(admin.driver, config.consoleUrl)
    const users = new UsersPage(admin.driver)
    await users.openFromSidebar()
    for (const account of Object.values(accounts)) {
      await users.openCreateModal()
      await users.fillForm({ username: account.username, displayName: account.displayName, role: account.role, password: PASSWORD })
      await users.submitModal('Create')
      await users.waitForModalClosed()
    }
  })

  describe('ANALYST', function () {
    let driver

    before(async function () {
      this.timeout(120000)
      driver = await createDriver()
      await signIn(driver, config.consoleUrl, { username: accounts.analyst.username, password: PASSWORD })
    })

    after(async function () {
      await closeDriver(driver)
    })

    it('does not list the Users page in the sidebar', async function () {
      const labels = await new AppShell(driver).sidebarLabels()
      assert.ok(!labels.includes('Users'), `sidebar: ${labels.join(', ')}`)
      assert.ok(labels.includes('Customers') && labels.includes('ETL Runs'), 'analyst pages are listed')
    })

    it('does not open the Users page by its address', async function () {
      await driver.get(`${config.consoleUrl}/users`)
      await waitForVisible(driver, By.css('.access-denied'))
      const heading = await textOf(driver, By.css('main h1'))
      assert.notEqual(heading, 'Personnel accounts')
    })

    it('shows no create buttons on customers, products and warehouses', async function () {
      const customers = new CustomersPage(driver)
      await customers.openFromSidebar()
      assert.equal(await new DataTable(driver).hasCreateButton(), false, 'customers create button')

      const products = new ProductsPage(driver)
      await products.openFromSidebar()
      assert.equal(await new DataTable(driver).hasCreateButton(), false, 'products create button')

      const warehouses = new WarehousesPage(driver)
      await warehouses.openFromSidebar()
      assert.equal(await new DataTable(driver).hasCreateButton(), false, 'warehouses create button')
    })

    it('shows no start run button on the ETL runs page', async function () {
      await new AppShell(driver).sidebarLinkByLabel('ETL Runs').then((link) => link.click())
      await waitForUrl(driver, /\/etl$/)
      const etl = new EtlRunsPage(driver)
      await new DataTable(driver).waitForRowWith('Succeeded')
      assert.equal((await etl.startRunButtons()).length, 0)
    })
  })

  describe('VIEWER', function () {
    let driver

    before(async function () {
      this.timeout(120000)
      driver = await createDriver()
      await signIn(driver, config.consoleUrl, { username: accounts.viewer.username, password: PASSWORD })
    })

    after(async function () {
      await closeDriver(driver)
    })

    it('sees the no access page with a sign-out button and no navigation', async function () {
      await waitForVisible(driver, By.css('.access-denied'))
      assert.equal(await textOf(driver, By.css('main h1')), 'No console access')
      const signOut = await waitForVisible(driver, By.xpath("//section[contains(@class,'access-denied')]//button[normalize-space(.)='Sign out']"))
      assert.ok(signOut, 'sign-out button')
      assert.deepEqual(await new AppShell(driver).sidebarLabels(), [])
    })
  })
})
