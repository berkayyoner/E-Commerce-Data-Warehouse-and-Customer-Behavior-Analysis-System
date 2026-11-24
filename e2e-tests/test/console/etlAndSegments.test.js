const assert = require('node:assert/strict')
const { By } = require('selenium-webdriver')

const config = require('../../config')
const { useBrowser } = require('../../support/browserSuite')
const { signIn } = require('../../pages/SignInFlow')
const { DataTable } = require('../../pages/DataTable')
const { EtlRunsPage } = require('../../pages/EtlRunsPage')
const { SegmentsPage } = require('../../pages/ListPages')
const { AppShell } = require('../../pages/AppShell')
const { waitFor, waitForVisible } = require('../../support/waits')

describe('Console: ETL runs and segments (ADMIN)', function () {
  const browser = useBrowser()

  before(async function () {
    this.timeout(120000)
    await signIn(browser.driver)
  })

  describe('ETL runs', function () {
    let etl
    let table

    before(async function () {
      etl = new EtlRunsPage(browser.driver)
      table = new DataTable(browser.driver)
      await browser.driver.get(`${config.baseUrl}/etl`)
      await waitForVisible(browser.driver, By.xpath("//h1[normalize-space(.)='ETL Runs']"))
      await table.waitForRowWith('Succeeded')
    })

    it('lists the runs and offers the Start run button to an administrator', async function () {
      assert.ok((await table.rowCount()) > 0, 'run rows')
      assert.ok((await etl.startRunButtons()).length > 0, 'Start run button')
    })

    it('opens a successful run with its steps and quality checks all passing', async function () {
      await etl.openFirstRowWithStatus('Succeeded')
      await waitForVisible(browser.driver, By.xpath("//div[@role='dialog']//h2[starts-with(normalize-space(.), 'ETL run ')]"))

      const steps = await etl.detailRows('Steps')
      const stepNames = steps.map((cells) => cells[0])
      assert.ok(stepNames.some((name) => name.toLowerCase() === 'load sales facts'), `steps: ${stepNames.join(', ')}`)

      const checks = await etl.detailRows('Quality checks')
      assert.ok(checks.length > 0, 'quality checks are recorded')
      for (const cells of checks) {
        assert.equal(cells[1].toLowerCase(), 'passed', `check "${cells[0]}"`)
      }
      await etl.closeDetail()
    })
  })

  describe('Segments', function () {
    let segments

    before(async function () {
      await new AppShell(browser.driver).closeDialogs()
      segments = new SegmentsPage(browser.driver)
      await segments.openFromSidebar()
      await waitFor(browser.driver, async () => (await browser.driver.findElements(By.css('table'))).length > 0, 'segment tables')
    })

    it('shows the segment summary with seven segments and the RFM heat grid with five rows', async function () {
      await waitFor(
        browser.driver,
        async () => (await browser.driver.findElements(By.xpath("//table[caption[normalize-space(.)='Segment summary']]/tbody/tr"))).length > 0,
        'the segment summary rows',
      )
      const summaryRows = await browser.driver.findElements(
        By.xpath("//table[caption[normalize-space(.)='Segment summary']]/tbody/tr"),
      )
      assert.equal(summaryRows.length, 7)

      const gridRows = await browser.driver.findElements(
        By.xpath("//table[caption[normalize-space(.)='Customers by recency score and frequency score']]/tbody/tr"),
      )
      assert.equal(gridRows.length, 5)
    })

    it('shows the K-Means clusters table', async function () {
      await browser.driver.findElement(By.xpath("//table[caption[normalize-space(.)='K-Means clusters']]"))
    })

    it('filters the segment customers to the Champions segment', async function () {
      const select = await waitForVisible(browser.driver, By.xpath("//div[contains(@class,'form-field')][label[normalize-space(.)='Segment']]//select"))
      await select.findElement(By.xpath("./option[normalize-space(.)='Champions']")).click()
      await waitFor(
        browser.driver,
        async () => (await browser.driver.findElements(By.xpath("//section[contains(@class,'segment-customers')]//table/tbody/tr[not(.//td[contains(@class,'table-message')])]"))).length > 0,
        'Champions customers',
      )
    })

    it('shows the run segmentation button to an administrator without starting a run', async function () {
      assert.ok((await segments.runButtons()).length > 0, 'Run segmentation button')
    })
  })
})
