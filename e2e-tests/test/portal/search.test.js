const assert = require('node:assert/strict')
const { By, Key } = require('selenium-webdriver')

const config = require('../../config')
const { useBrowser } = require('../../support/browserSuite')
const { signIn } = require('../../pages/SignInFlow')
const { PortalSearchPage } = require('../../pages/PortalPages')
const { AppShell } = require('../../pages/ConsoleShell')
const { waitFor, clearField } = require('../../support/waits')

/** The price shown in English, for example "TRY 1,234.50", as a number. */
function priceNumber(text) {
  return Number(text.replace(/[^\d.]/g, ''))
}

describe('Portal: product search (ADMIN)', function () {
  const browser = useBrowser()
  let search

  before(async function () {
    this.timeout(120000)
    await signIn(browser.driver, config.portalUrl)
    search = new PortalSearchPage(browser.driver)
    await search.openFromNavigation()
  })

  it('finds kitchen products and shows the facets', async function () {
    await search.search('kitchen')
    const total = await search.totalNumber()
    assert.ok(total > 0, `results for kitchen: ${total}`)
    assert.ok((await search.facetCheckboxes()).length > 0, 'facet checkboxes')
  })

  it('narrows the results with a category facet', async function () {
    const kitchenTotal = await search.totalNumber()
    await search.search('')
    await search.waitForTotalChange(kitchenTotal)
    const before = await search.totalNumber()
    const boxes = await search.facetCheckboxes()
    await boxes[0].click()
    await search.waitForTotalChange(before)
    const after = await search.totalNumber()
    assert.ok(after > 0 && after < before, `facet narrowed the total from ${before} to ${after}`)
    await browser.driver.findElement(By.xpath("//aside[contains(@class,'facets')]//button[contains(normalize-space(.),'Clear filters')]")).click()
    await search.search('kitchen')
  })

  it('narrows the results with a price range', async function () {
    const before = await search.totalNumber()
    await search.setPriceRange(100, 200)
    await waitFor(
      browser.driver,
      async () => {
        const prices = await search.resultPrices()
        return prices.length > 0 && prices.every((price) => priceNumber(price) >= 100 && priceNumber(price) <= 200)
      },
      'results within 100 to 200',
    )
    assert.ok((await search.totalNumber()) <= before)
    await browser.driver.findElement(By.xpath("//aside[contains(@class,'facets')]//button[contains(normalize-space(.),'Clear filters')]")).click()
    await search.search('kitchen')
  })

  it('moves through the typeahead suggestions with the arrow keys', async function () {
    const box = await search.box()
    await clearField(box)
    await box.sendKeys('zch')
    await waitFor(browser.driver, async () => (await search.suggestionOptions()).length > 0, 'suggestions')
    await box.sendKeys(Key.ARROW_DOWN)
    const suggestion = await (await search.suggestionOptions())[0].getText()
    await box.sendKeys(Key.ENTER)
    await waitFor(browser.driver, async () => (await box.getAttribute('aria-expanded')) === 'false', 'the suggestion list to close')
    assert.notEqual(await box.getAttribute('value'), 'zch', `the box now holds the chosen suggestion (${suggestion})`)
    assert.ok((await search.totalNumber()) > 0)
  })

  it('shows Turkish category labels after switching the language', async function () {
    const shell = new AppShell(browser.driver)
    await shell.chooseLanguage('tr')
    try {
      await search.search('mutfak')
      await waitFor(
        browser.driver,
        async () => (await browser.driver.findElements(By.xpath("//aside[contains(@class,'facets')]//label[contains(., 'Ev ve Mutfak')]"))).length > 0,
        'the Turkish category label',
      )
    } finally {
      await shell.chooseLanguage('en')
    }
  })
})
