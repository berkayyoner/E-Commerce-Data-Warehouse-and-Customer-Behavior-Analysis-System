const assert = require('node:assert/strict')
const { By } = require('selenium-webdriver')

const config = require('../../config')
const { useBrowser } = require('../../support/browserSuite')
const { signIn } = require('../../pages/SignInFlow')
const { AppShell } = require('../../pages/ConsoleShell')
const { DataTable } = require('../../pages/DataTable')
const { UsersPage } = require('../../pages/UsersPage')
const { uniqueName } = require('../../support/testData')
const { waitFor, waitForVisible, clearField } = require('../../support/waits')

const GOOD_PASSWORD = 'E2e-Pass-2026'

describe('Console: personnel accounts (ADMIN)', function () {
  const browser = useBrowser()
  let users
  let table

  before(async function () {
    this.timeout(120000)
    await signIn(browser.driver, config.consoleUrl)
    users = new UsersPage(browser.driver)
    table = new DataTable(browser.driver)
    await users.openFromSidebar()
    await table.waitForRowCount((count) => count > 0, 'the users table to load')
  })

  it('loads the table with the signed-in administrator among the accounts', async function () {
    await table.waitForRowWith(config.admin.username)
    const names = await table.columnValues('Username')
    assert.ok(names.includes(config.admin.username))
  })

  it('sorts by username in both directions', async function () {
    // A second account guarantees that the two directions show different first rows, whatever else exists.
    const extra = uniqueName('e2e-sort')
    await users.openCreateModal()
    await users.fillForm({ username: extra, displayName: 'E2E Sort User', role: 'VIEWER', password: GOOD_PASSWORD })
    await users.submitModal('Create')
    await users.waitForModalClosed()
    try {
      await table.sort('Username')
      await waitFor(browser.driver, async () => (await table.ariaSort('Username')) === 'descending', 'descending sort')
      const descending = await table.columnValues('Username')

      await table.sort('Username')
      await waitFor(browser.driver, async () => (await table.ariaSort('Username')) === 'ascending', 'ascending sort')
      const ascending = await table.columnValues('Username')

      assert.notEqual(ascending[0], descending[0], 'the first row changes with the direction')
      assert.equal(ascending[0].toLowerCase() <= descending[0].toLowerCase(), true)
    } finally {
      await users.deleteUserIfPresent(extra)
      await table.search('')
    }
  })

  it('filters the table with the search box above the table on the left', async function () {
    await table.search(config.admin.username)
    await waitFor(
      browser.driver,
      async () => {
        const names = await table.columnValues('Username')
        return names.length > 0 && names.every((name) => name.includes(config.admin.username))
      },
      'only matching accounts',
    )

    const layout = await table.searchBoxPosition()
    assert.ok(layout.searchLeft < layout.tableCenter, 'search box is on the left half')
    assert.ok(layout.searchBottom <= layout.tableTop + 1, 'search box is above the table')
    assert.ok(layout.createCenter > layout.tableCenter, 'create button is on the right half')
    assert.ok(layout.createTop <= layout.tableTop, 'create button is above the table')
    assert.ok((await browser.driver.findElements(By.css('.data-table-toolbar .search-box svg'))).length > 0, 'magnifier icon')
    await table.search('')
  })

  it('creates, conflicts, and deletes a personnel account', async function () {
    const username = uniqueName('e2e-user')
    try {
      await users.openCreateModal()
      await users.fillForm({ username, displayName: 'E2E Test User', password: 'short' })
      await users.submitModal('Create')
      await users.waitForFieldError('Password', 'Use between 8 and 72 characters.')

      const password = await waitForVisible(browser.driver, By.xpath("//div[@role='dialog']//input[@type='password']"))
      await clearField(password)
      await password.sendKeys(GOOD_PASSWORD)
      await users.submitModal('Create')
      await users.waitForToast('success', 'Saved successfully.')
      await users.waitForModalClosed()

      await table.search(username)
      await table.waitForRowWith(username)

      await users.openCreateModal()
      await users.fillForm({ username, displayName: 'E2E Duplicate', password: GOOD_PASSWORD })
      await users.submitModal('Create')
      await users.waitForToast('error', 'is already in use')
      await users.cancelModal()
    } finally {
      await users.deleteUserIfPresent(username)
    }
  })
})
