const { By } = require('selenium-webdriver')

/** An XPath string literal for any text, including text that contains quotes. */
function literal(text) {
  if (!text.includes('"')) {
    return `"${text}"`
  }
  if (!text.includes("'")) {
    return `'${text}'`
  }
  return `concat("${text.split('"').join('", \'"\', "')}")`
}

/** A button whose visible text is exactly the given text. */
function buttonByText(text) {
  return By.xpath(`//button[normalize-space(.)=${literal(text)}]`)
}

/** A link whose visible text is exactly the given text. */
function linkByText(text) {
  return By.xpath(`//a[normalize-space(.)=${literal(text)}]`)
}

/** The form control (input, select or textarea) of the form field whose label has exactly the given text. */
function fieldByLabel(label, tag = 'input') {
  return By.xpath(
    `//div[contains(concat(' ', normalize-space(@class), ' '), ' form-field ')][label[normalize-space(.)=${literal(label)}]]//${tag}`,
  )
}

/** Any element containing the text (use for messages). */
function elementWithText(tag, text) {
  return By.xpath(`//${tag}[contains(normalize-space(.), ${literal(text)})]`)
}

/** The table row that contains the given text. */
function rowWithText(text) {
  return By.xpath(`//table/tbody/tr[contains(normalize-space(.), ${literal(text)})]`)
}

/** The sortable column header button whose title (Sort by ...) is given. */
function sortButton(column) {
  return By.css(`button[title="Sort by ${column}"]`)
}

module.exports = {
  literal,
  buttonByText,
  linkByText,
  fieldByLabel,
  elementWithText,
  rowWithText,
  sortButton,
}
