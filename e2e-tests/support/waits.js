const { until, By, Key } = require('selenium-webdriver')
const config = require('../config')

/** Waits until the condition returns a truthy value and returns that value. */
function waitFor(driver, condition, message, timeout = config.timeouts.element) {
  return driver.wait(
    async () => {
      try {
        const value = await condition(driver)
        return value || false
      } catch (error) {
        return false
      }
    },
    timeout,
    message,
    config.timeouts.poll,
  )
}

async function waitForUrl(driver, pattern, timeout = config.timeouts.page) {
  return waitFor(
    driver,
    async (d) => {
      const url = await d.getCurrentUrl()
      return pattern.test(url) ? url : false
    },
    `URL to match ${pattern}`,
    timeout,
  )
}

async function waitForVisible(driver, locator, timeout = config.timeouts.element) {
  const element = await driver.wait(until.elementLocated(locator), timeout, `Element ${locator} to exist`)
  await driver.wait(until.elementIsVisible(element), timeout, `Element ${locator} to be visible`)
  return element
}

async function waitForAbsent(driver, locator, timeout = config.timeouts.element) {
  return waitFor(
    driver,
    async (d) => (await d.findElements(locator)).length === 0,
    `Element ${locator} to disappear`,
    timeout,
  )
}

async function waitForText(driver, locator, text, timeout = config.timeouts.element) {
  return waitFor(
    driver,
    async (d) => {
      const elements = await d.findElements(locator)
      for (const element of elements) {
        if ((await element.getText()).includes(text)) {
          return element
        }
      }
      return false
    },
    `Text "${text}" in ${locator}`,
    timeout,
  )
}

async function waitForPageText(driver, text, timeout = config.timeouts.element) {
  return waitForText(driver, By.css('body'), text, timeout)
}

async function waitForEnabled(element, driver, timeout = config.timeouts.element) {
  return driver.wait(async () => element.isEnabled(), timeout, 'Element to be enabled')
}

module.exports = {
  waitFor,
  waitForUrl,
  waitForVisible,
  waitForAbsent,
  waitForText,
  waitForPageText,
  waitForEnabled,
}

/** Text of the first element that matches, read again if the page re-renders while it is being read. */
async function textOf(driver, locator, timeout = config.timeouts.element) {
  return waitFor(
    driver,
    async (d) => {
      const text = (await (await d.findElement(locator)).getText()).trim()
      return text.length > 0 ? text : false
    },
    `text of ${locator}`,
    timeout,
  )
}

module.exports.textOf = textOf

/**
 * Empties a text field with real key presses. Selenium's clear() does not fire the input events that React listens
 * to, so the application would keep the old value.
 */
async function clearField(element) {
  await element.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.BACK_SPACE)
}

module.exports.clearField = clearField
