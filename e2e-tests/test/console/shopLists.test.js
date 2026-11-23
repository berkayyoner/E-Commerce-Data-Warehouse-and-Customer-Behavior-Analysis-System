const assert = require('node:assert/strict')
const { By } = require('selenium-webdriver')

const config = require('../../config')
const { useBrowser } = require('../../support/browserSuite')
const { signIn } = require('../../pages/SignInFlow')
const { DataTable } = require('../../pages/DataTable')
const { AppShell } = require('../../pages/ConsoleShell')
const { CustomersPage, OrdersPage, WarehousesPage } = require('../../pages/ListPages')
const { waitFor, waitForVisible } = require('../../support/waits')

describe('Console: customers, orders and warehouses (ADMIN)', function () {
  const browser = useBrowser()

  before(async function () {
    this.timeout(120000)
    await signIn(browser.driver, config.consoleUrl)
  })

  describe('Customers', function () {
    let customers
    let table

    before(async function () {
      customers = new CustomersPage(browser.driver)
      table = new DataTable(browser.driver)
      await customers.openFromSidebar()
      await table.waitForRowCount((count) => count > 0, 'customer rows')
    })

    it('filters the customers by warehouse', async function () {
      const options = (await customers.filterOptionTexts('Warehouse')).filter((text) => text !== 'All warehouses')
      assert.ok(options.length > 0, 'warehouses in the filter')
      await customers.selectFilter('Warehouse', options[0])
      await waitFor(browser.driver, async () => (await customers.filterValue('Warehouse')) !== '', 'warehouse filter set')
      await table.waitForRowCount((count) => count > 0, 'customers of the warehouse')
      assert.equal(await customers.filterValue('Warehouse') !== '', true)
      await customers.selectFilter('Warehouse', 'All warehouses')
    })

    it('searches the customers by last name', async function () {
      const lastName = (await table.columnValues('Last name'))[0]
      await table.search(lastName)
      await waitFor(
        browser.driver,
        async () => {
          const names = await table.columnValues('Last name')
          return names.length > 0 && names.every((name) => name === lastName)
        },
        `customers named ${lastName}`,
      )
      await table.search('')
    })

    it('sorts the customers by balance in both directions', async function () {
      await table.sort('Balance')
      await waitFor(browser.driver, async () => (await table.ariaSort('Balance')) === 'ascending', 'ascending balance')
      await table.sort('Balance')
      await waitFor(browser.driver, async () => (await table.ariaSort('Balance')) === 'descending', 'descending balance')
    })

    it('opens the edit dialog and closes it without saving', async function () {
      await customers.openEditForFirstRow()
      await customers.closeDialog()
      assert.equal(await customers.dialogCount(), 0)
    })
  })

  describe('Orders', function () {
    let orders
    let table

    before(async function () {
      orders = new OrdersPage(browser.driver)
      table = new DataTable(browser.driver)
      await orders.openFromSidebar()
      await table.waitForRowCount((count) => count > 0, 'order rows')
    })

    it('filters the orders by warehouse and by an order date range', async function () {
      const options = (await orders.filterOptionTexts('Warehouse')).filter((text) => text !== 'All warehouses')
      await orders.selectFilter('Warehouse', options[0])
      await table.waitForRowCount((count) => count > 0, 'orders of the warehouse')

      await orders.setDate('Ordered from', '2020-01-01')
      await orders.setDate('Ordered to', '2030-12-31')
      await table.waitForRowCount((count) => count > 0, 'orders in the range')
      assert.equal(await orders.dateValue('Ordered from'), '2020-01-01')
      await orders.selectFilter('Warehouse', 'All warehouses')
    })

    it('shows a range error when the end date is before the start date', async function () {
      await orders.setDate('Ordered from', '2026-01-01')
      await orders.setDate('Ordered to', '2025-01-01')
      await waitFor(
        browser.driver,
        async () => (await browser.driver.findElements(By.xpath("//*[contains(normalize-space(.),'The end date cannot be before the start date.')]"))).length > 0,
        'the range error',
      )
      await orders.setDate('Ordered from', '')
      await orders.setDate('Ordered to', '')
    })

    it('opens an order and shows its lines table', async function () {
      await orders.openFirstOrderRow()
      await waitForVisible(browser.driver, By.xpath("//div[@role='dialog']//h3[normalize-space(.)='Order lines']"))
      const headers = await browser.driver.findElements(By.xpath("//div[@role='dialog']//h3[normalize-space(.)='Order lines']/following::table[1]//th"))
      const texts = await Promise.all(headers.map((header) => header.getText()))
      assert.ok(texts.some((text) => text.toLowerCase() === 'product'), `line columns: ${texts.join(', ')}`)
      await browser.driver.findElement(By.css('.modal[role="dialog"] .modal-header button[aria-label="Close"]')).click()
    })
  })

  describe('Warehouses', function () {
    let warehouses
    let table

    before(async function () {
      await new AppShell(browser.driver).closeDialogs()
      warehouses = new WarehousesPage(browser.driver)
      table = new DataTable(browser.driver)
      await warehouses.openFromSidebar()
    })

    it('lists the ten seeded shop warehouses first, by ID', async function () {
      await table.waitForRowCount((count) => count >= 10, 'the warehouse rows')
      const ids = (await table.columnValues('ID')).slice(0, 10).map(Number)
      assert.deepEqual(ids, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    })

    it('validates the create warehouse form and cancels it', async function () {
      await warehouses.openCreate()
      await warehouses.submitCreateEmpty()
      await warehouses.waitForFieldError('Name', 'This field is required.')
      assert.equal(await warehouses.fieldError('City'), 'This field is required.')
      assert.equal(await warehouses.fieldError('Region'), 'This field is required.')
      await warehouses.cancelDialog()
      assert.equal(await warehouses.dialogCount(), 0)
    })
  })
})
