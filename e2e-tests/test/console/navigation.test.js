const assert = require('node:assert/strict')
const { By } = require('selenium-webdriver')

const config = require('../../config')
const { useBrowser } = require('../../support/browserSuite')
const { signIn } = require('../../pages/SignInFlow')
const { AppShell } = require('../../pages/AppShell')
const { waitFor, waitForUrl, textOf } = require('../../support/waits')

/** Every sidebar entry of the application (console pages, then the analytics group) with the title its page shows. */
const PAGES = [
  { label: 'Dashboard', path: '/dashboard', title: 'Dashboard' },
  { label: 'Customers', path: '/customers', title: 'Customers' },
  { label: 'Products', path: '/products', title: 'Products' },
  { label: 'Warehouses', path: '/warehouses', title: 'Warehouses' },
  { label: 'Orders', path: '/orders', title: 'Orders' },
  { label: 'ETL Runs', path: '/etl', title: 'ETL Runs' },
  { label: 'Segments', path: '/segments', title: 'Customer segments' },
  { label: 'Users', path: '/users', title: 'Personnel accounts' },
  { label: 'Sales overview', path: '/analytics/sales', title: 'Sales overview' },
  { label: 'Product search', path: '/analytics/search', title: 'Product search' },
]

/**
 * Horizontal offset between the centre of the title text and the centre of the content area. Zero means centred.
 */
async function titleCentreOffset(driver) {
  return driver.executeScript(`
    const heading = document.querySelector('main h1');
    const main = document.querySelector('main#main-content');
    const range = document.createRange();
    range.selectNodeContents(heading);
    const text = range.getBoundingClientRect();
    const area = main.getBoundingClientRect();
    return (text.left + text.right) / 2 - (area.left + area.right) / 2;
  `)
}

describe('Console: navigation and page titles (ADMIN)', function () {
  const browser = useBrowser()

  before(async function () {
    this.timeout(120000)
    await signIn(browser.driver)
    await waitForUrl(browser.driver, /\/dashboard$/)
  })

  it('lists every page in the sidebar for an administrator', async function () {
    const labels = await new AppShell(browser.driver).sidebarLabels()
    assert.deepEqual(labels, PAGES.map((page) => page.label))
  })

  for (const page of PAGES) {
    it(`opens ${page.label} with a centred title and no homepage link`, async function () {
      const shell = new AppShell(browser.driver)
      const link = await shell.sidebarLinkByLabel(page.label)
      await link.click()
      await waitForUrl(browser.driver, new RegExp(`${page.path}$`))
      await waitFor(browser.driver, async (d) => (await textOf(d, By.css('main h1'))) === page.title, `title ${page.title}`)

      const offset = await titleCentreOffset(browser.driver)
      assert.ok(Math.abs(offset) <= 8, `title is ${offset.toFixed(1)}px away from the centre`)
      assert.equal(await shell.hasHomepageControl(), false, 'no "return to homepage" control')
    })
  }
})
