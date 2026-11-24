const assert = require('node:assert/strict')
const { By } = require('selenium-webdriver')

const config = require('../../config')
const { useBrowser } = require('../../support/browserSuite')
const { signIn } = require('../../pages/SignInFlow')
const { LoginPage } = require('../../pages/LoginPage')
const { AppShell } = require('../../pages/AppShell')
const { fieldByLabel } = require('../../support/finders')
const { waitFor, waitForUrl, waitForVisible } = require('../../support/waits')

describe('Sign-in page', function () {
  const browser = useBrowser()

  it('shows labelled username and password fields and one sign-in button', async function () {
    const loginPage = new LoginPage(browser.driver)
    await loginPage.open()
    const user = await waitForVisible(browser.driver, fieldByLabel('Username'))
    const pass = await waitForVisible(browser.driver, fieldByLabel('Password'))
    assert.equal(await user.getAttribute('type'), 'text')
    assert.equal(await pass.getAttribute('type'), 'password')
    assert.ok(await waitForVisible(browser.driver, By.xpath("//form[contains(@class,'login-form')]//button[@type='submit'][normalize-space(.)='Sign in']")))
  })

  it('shows the invalid credentials message after a wrong password', async function () {
    const loginPage = new LoginPage(browser.driver)
    await loginPage.open()
    await loginPage.fillAndSubmit({ username: config.admin.username, password: 'Wrong-Password-2026' })
    await waitFor(browser.driver, async () => (await loginPage.alertText()) === 'The username or password is not correct.', 'the invalid credentials message')
    assert.equal((await browser.driver.findElements(By.css('.navbar-username'))).length, 0, 'not signed in')
  })

  it('returns to the sign-in page after signing out', async function () {
    await signIn(browser.driver)
    await new AppShell(browser.driver).signOut()
    await waitForUrl(browser.driver, /\/login$/)
    await waitForVisible(browser.driver, fieldByLabel('Username'))
  })
})
