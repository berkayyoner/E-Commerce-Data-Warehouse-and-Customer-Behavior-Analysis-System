const assert = require('node:assert/strict')
const { By } = require('selenium-webdriver')

const config = require('../../config')
const { useBrowser } = require('../../support/browserSuite')
const { signIn } = require('../../pages/SignInFlow')
const { ProductsPage } = require('../../pages/ProductsPage')
const { AppShell } = require('../../pages/AppShell')
const { DataTable } = require('../../pages/DataTable')
const { uniqueName } = require('../../support/testData')
const { waitFor, waitForVisible, textOf, clearField } = require('../../support/waits')

/** Parses a formatted price such as "TRY 1,234" (English) or "1.234 TL" (Turkish) into a number. */
function priceValue(text) {
  const digits = text.replace(/[^\d.,]/g, '')
  const normalised = digits.includes(',') && digits.lastIndexOf(',') > digits.lastIndexOf('.')
    ? digits.replace(/\./g, '').replace(',', '.')
    : digits.replace(/,/g, '')
  return Number(normalised)
}

describe('Console: products (ADMIN)', function () {
  const browser = useBrowser()
  let products
  let table

  before(async function () {
    this.timeout(120000)
    await signIn(browser.driver)
    products = new ProductsPage(browser.driver)
    table = new DataTable(browser.driver)
    await products.openFromSidebar()
    await table.search('')
    await table.waitForRowCount((count) => count > 0, 'the catalog rows')
  })

  it('searches the catalog and sorts it by price in both directions', async function () {
    const firstName = (await table.columnValues('Name'))[0]
    await table.search(firstName)
    await waitFor(
      browser.driver,
      async () => {
        const names = await table.columnValues('Name')
        return names.length > 0 && names.every((name) => name.includes(firstName))
      },
      'the catalog to be filtered by the name',
    )
    await table.search('')

    await table.sort('Price')
    await waitFor(browser.driver, async () => (await table.ariaSort('Price')) === 'ascending', 'ascending price')
    const low = (await table.columnValues('Price')).map(priceValue)
    assert.ok(low.every((value, index) => index === 0 || low[index - 1] <= value), `ascending: ${low.join(', ')}`)

    await table.sort('Price')
    await waitFor(browser.driver, async () => (await table.ariaSort('Price')) === 'descending', 'descending price')
    const high = (await table.columnValues('Price')).map(priceValue)
    assert.ok(high.every((value, index) => index === 0 || high[index - 1] >= value), `descending: ${high.join(', ')}`)
  })

  it('creates a product through the modal and deletes it again', async function () {
    const name = uniqueName('e2e-prod')
    try {
      await products.openCreateModal()
      await products.fillProduct({ name, price: '19.99', category: 'E2E Category', brand: 'E2E Brand' })
      await products.submitModal('Create')
      await products.waitForToast('success', 'Saved successfully.')
      await products.waitForModalClosed()

      await table.search(name)
      await table.waitForRowWith(name)
      await products.clickDeleteOnRow(name)
      await products.confirmDelete()
      await products.waitForToast('success', 'Deleted successfully.')
      await table.waitForNoRowWith(name)
    } finally {
      await table.search(name)
      await table.waitForSearchOutcome(name).catch(() => {})
      const rows = await browser.driver.findElements(By.xpath(`//section[contains(@class,"data-table")]//tbody/tr[contains(., "${name}")]`))
      if (rows.length > 0) {
        await products.clickDeleteOnRow(name)
        await products.confirmDelete()
        await table.waitForNoRowWith(name)
      }
    }
  })

  it('refuses to delete a product that is used in orders', async function () {
    await products.openFromSidebar()
    await table.search('')
    await table.waitForRowCount((count) => count > 0, 'the catalog rows')
    const usedProductName = (await table.columnValues('Name'))[0]
    await table.search(usedProductName)
    await table.waitForSearchOutcome(usedProductName)
    await products.clickDeleteOnRow(usedProductName)
    await products.confirmDelete()
    await products.waitForToast('error', 'This product appears in orders, so it cannot be deleted.')
    await table.waitForRowWith(usedProductName)
    await table.search('')
  })

  it('shows smart search results with a category facet, typeahead suggestions and a Turkish category label', async function () {
    await products.selectView('Smart search')
    await products.runSearch('kitchen')
    const summary = await products.resultsSummaryText()
    assert.match(summary, /products found/)
    await waitFor(browser.driver, async () => (await products.facetCategoryNames()).length > 0, 'category facet values')

    const box = await products.searchInput()
    await clearField(box)
    await box.sendKeys('zch')
    await waitFor(browser.driver, async () => (await products.suggestionTexts()).length > 0, 'typeahead suggestions')
    await clearField(box)

    const shell = new AppShell(browser.driver)
    await shell.chooseLanguage('tr')
    try {
      await products.runSearch('mutfak')
      await waitFor(
        browser.driver,
        async () => (await products.facetCategoryNames()).includes('Ev ve Mutfak'),
        'the Turkish category label "Ev ve Mutfak"',
      )
    } finally {
      await shell.chooseLanguage('en')
    }
  })
})
