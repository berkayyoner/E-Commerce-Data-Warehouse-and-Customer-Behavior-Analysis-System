const assert = require('node:assert/strict')
const { By } = require('selenium-webdriver')

const config = require('../../config')
const { useBrowser } = require('../../support/browserSuite')
const { signIn } = require('../../pages/SignInFlow')
const { AppShell } = require('../../pages/AppShell')
const { UsersPage } = require('../../pages/UsersPage')
const { waitFor } = require('../../support/waits')

/** Tablet size of the console: 768 by 1024 CSS pixels. */
describe('Console: tablet layout (768 x 1024)', function () {
  const browser = useBrowser({ window: config.tabletWindow })

  before(async function () {
    this.timeout(120000)
    await signIn(browser.driver)
  })

  it('collapses the sidebar behind the menu button and opens it again', async function () {
    const driver = browser.driver
    const shell = new AppShell(driver)
    await waitFor(driver, async () => (await driver.findElements(By.css('.sidebar.is-open'))).length === 0, 'sidebar collapsed')
    await shell.toggleMenu()
    await waitFor(driver, async () => (await driver.findElements(By.css('.sidebar.is-open'))).length === 1, 'sidebar open')
    await shell.toggleMenu()
    await waitFor(driver, async () => (await driver.findElements(By.css('.sidebar.is-open'))).length === 0, 'sidebar closed again')
  })

  it('keeps the users table inside its card without widening the page', async function () {
    const driver = browser.driver
    const users = new UsersPage(driver)
    await new AppShell(driver).toggleMenu()
    await waitFor(driver, async () => (await driver.findElements(By.css('.sidebar.is-open'))).length === 1, 'sidebar open')
    await users.openFromSidebar()
    await waitFor(driver, async () => (await driver.findElements(By.css('.data-table tbody tr'))).length > 0, 'users rows')

    const measures = await driver.executeScript(`
      const scroller = document.querySelector('.data-table-scroll');
      return {
        page: document.documentElement.scrollWidth,
        window: window.innerWidth,
        overflowX: getComputedStyle(scroller).overflowX,
        scrollerWidth: scroller.clientWidth,
        tableWidth: scroller.querySelector('table').scrollWidth,
      };
    `)
    assert.ok(measures.page <= measures.window, `page ${measures.page}px wider than ${measures.window}px`)
    assert.ok(['auto', 'scroll'].includes(measures.overflowX), `table container overflow ${measures.overflowX}`)
  })
})
