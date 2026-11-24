const { By } = require('selenium-webdriver')
const { waitForVisible, waitForText, waitFor } = require('../support/waits')
const { literal } = require('../support/finders')

/** Navigation bar, sidebar and language choice shared by every page of the web application. */
class AppShell {
  constructor(driver) {
    this.driver = driver
  }

  async signedInUsername() {
    const element = await waitForVisible(this.driver, By.css('.navbar-username'))
    return (await element.getText()).trim()
  }

  async roleBadges() {
    const badges = await this.driver.findElements(By.css('.navbar-user .badge'))
    return Promise.all(badges.map((badge) => badge.getText()))
  }

  async selectedLanguage() {
    const select = await waitForVisible(this.driver, By.css('.language-dropdown select'))
    return select.getAttribute('value')
  }

  async chooseLanguage(code) {
    const select = await waitForVisible(this.driver, By.css('.language-dropdown select'))
    await select.findElement(By.css(`option[value="${code}"]`)).click()
    await waitFor(
      this.driver,
      async () => (await select.getAttribute('value')) === code,
      `language ${code} to be selected`,
    )
  }

  async signOut() {
    const button = await waitForVisible(this.driver, By.css('.navbar-actions button.button-ghost'))
    await button.click()
  }

  async pageTitle() {
    const heading = await waitForVisible(this.driver, By.css('main h1, .page-title h1'))
    return (await heading.getText()).trim()
  }

  async hasHomepageControl() {
    const matches = await this.driver.findElements(
      By.xpath(
        "//a[contains(translate(normalize-space(.), 'HOMEPAGE', 'homepage'), 'homepage') or contains(translate(normalize-space(.), 'HOME', 'home'), 'back to home')] | //button[contains(translate(normalize-space(.), 'HOMEPAGE', 'homepage'), 'homepage') or contains(translate(normalize-space(.), 'HOME', 'home'), 'back to home')]",
      ),
    )
    return matches.length > 0
  }

  /** Sidebar entries of the console (empty when the sidebar is not rendered). */
  async sidebarLabels() {
    const links = await this.driver.findElements(By.css('.sidebar .sidebar-link span'))
    return Promise.all(links.map((link) => link.getText()))
  }

  /** The sidebar link with the label, once it is visible (the sidebar slides in and out on narrow screens). */
  async sidebarLinkByLabel(label) {
    return waitForVisible(this.driver, By.xpath(`//nav[contains(@class,'sidebar')]//a[normalize-space(.)=${literal(label)}]`))
  }

  async toggleMenu() {
    const toggle = await waitForVisible(this.driver, By.css('.navbar-menu'))
    await toggle.click()
  }

  /** Closes any dialog that a failed step left open, so the next page can be used. */
  async closeDialogs() {
    const close = await this.driver.findElements(By.css('.modal[role="dialog"] .modal-header button[aria-label="Close"]'))
    if (close.length === 0) {
      return
    }
    await close[0].click()
    await waitFor(this.driver, async (d) => (await d.findElements(By.css('.modal[role="dialog"]'))).length === 0, 'dialog to close')
  }

  async waitForLanguageText(text) {
    return waitForText(this.driver, By.css('main'), text)
  }
}

module.exports = { AppShell }
