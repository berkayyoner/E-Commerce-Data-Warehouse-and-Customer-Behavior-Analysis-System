const assert = require('node:assert/strict')
const { By } = require('selenium-webdriver')

const config = require('../../config')
const { useBrowser } = require('../../support/browserSuite')
const { signIn } = require('../../pages/SignInFlow')
const { PortalDashboardPage } = require('../../pages/PortalPages')
const { waitFor } = require('../../support/waits')

/** Phone size of the portal: 375 by 812 CSS pixels. */
describe('Portal: phone layout (375 x 812)', function () {
  const browser = useBrowser({ window: config.mobileWindow })
  let dashboard

  before(async function () {
    this.timeout(120000)
    await signIn(browser.driver, config.portalUrl)
    dashboard = new PortalDashboardPage(browser.driver)
    await dashboard.waitForKpis()
  })

  it('does not scroll the page sideways', async function () {
    const widths = await browser.driver.executeScript(
      'return { page: document.documentElement.scrollWidth, window: window.innerWidth };',
    )
    assert.ok(widths.page <= widths.window, `page ${widths.page}px wider than ${widths.window}px`)
  })

  it('opens and closes the navigation with the menu button', async function () {
    const toggle = await browser.driver.findElement(By.css('.navbar-menu-toggle'))
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
    await toggle.click()
    await waitFor(browser.driver, async () => (await toggle.getAttribute('aria-expanded')) === 'true', 'menu open')
    assert.ok((await browser.driver.findElements(By.css('.primary-nav.is-open'))).length === 1, 'navigation is open')

    await toggle.click()
    await waitFor(browser.driver, async () => (await toggle.getAttribute('aria-expanded')) === 'false', 'menu closed')
  })

  it('stacks the KPI cards in one column', async function () {
    const lefts = await browser.driver.executeScript(
      "return Array.from(document.querySelectorAll('.kpi-grid .kpi-card')).map((card) => Math.round(card.getBoundingClientRect().left));",
    )
    assert.ok(lefts.length >= 4, 'KPI cards are shown')
    assert.ok(lefts.every((left) => left === lefts[0]), `left offsets ${lefts.join(', ')}`)
  })

  it('folds the filters behind a button and opens them again', async function () {
    const toggle = await browser.driver.findElement(By.css('.filter-toggle'))
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
    await toggle.click()
    await waitFor(browser.driver, async () => (await toggle.getAttribute('aria-expanded')) === 'true', 'filters open')
    assert.ok((await browser.driver.findElements(By.css('.filter-fields.is-open'))).length === 1)
    await toggle.click()
    await waitFor(browser.driver, async () => (await toggle.getAttribute('aria-expanded')) === 'false', 'filters closed')
  })

  it('makes buttons, links and inputs in the content at least 44 pixels high', async function () {
    const heights = await browser.driver.executeScript(`
      const controls = Array.from(document.querySelectorAll('main button, main a[href], main input, main select'));
      return controls
        .filter((el) => el.offsetParent !== null && !el.classList.contains('sr-only') && el.type !== 'hidden')
        .map((el) => ({ text: (el.innerText || el.getAttribute('aria-label') || el.name || el.type || el.tagName).trim().slice(0, 40),
                        height: Math.round(el.getBoundingClientRect().height) }));
    `)
    const small = heights.filter((item) => item.height < 44)
    assert.deepEqual(small, [], `controls under 44px: ${JSON.stringify(small)}`)
  })
})
