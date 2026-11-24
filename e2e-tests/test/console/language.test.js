const assert = require('node:assert/strict')
const { By } = require('selenium-webdriver')

const config = require('../../config')
const { useBrowser } = require('../../support/browserSuite')
const { signIn } = require('../../pages/SignInFlow')
const { AppShell } = require('../../pages/AppShell')
const { waitFor, textOf } = require('../../support/waits')

describe('Console: language switch (ADMIN)', function () {
  const browser = useBrowser()
  let shell

  before(async function () {
    this.timeout(120000)
    await signIn(browser.driver)
    shell = new AppShell(browser.driver)
  })

  afterEach(async function () {
    await shell.chooseLanguage('en').catch(() => {})
  })

  it('switches the titles and the navigation to Turkish and remembers the choice after a reload', async function () {
    await shell.chooseLanguage('tr')
    await waitFor(browser.driver, async (d) => (await textOf(d, By.css('main h1'))) === 'Gösterge Paneli', 'Turkish dashboard title')

    const labels = await shell.sidebarLabels()
    assert.ok(labels.includes('ETL Çalıştırmaları'), `Turkish sidebar: ${labels.join(', ')}`)
    assert.ok(labels.includes('Kullanıcılar'), 'Turkish users entry')

    await browser.driver.navigate().refresh()
    await waitFor(browser.driver, async () => (await shell.selectedLanguage()) === 'tr', 'Turkish after reload')
    assert.equal(await textOf(browser.driver, By.css('main h1')), 'Gösterge Paneli')
  })

  it('switches back to English', async function () {
    await shell.chooseLanguage('en')
    await waitFor(browser.driver, async (d) => (await textOf(d, By.css('main h1'))) === 'Dashboard', 'English dashboard title')
    const labels = await shell.sidebarLabels()
    assert.ok(labels.includes('ETL Runs'), `English sidebar: ${labels.join(', ')}`)
  })
})
