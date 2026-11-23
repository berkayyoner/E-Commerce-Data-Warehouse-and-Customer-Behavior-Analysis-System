const LOCALES = Object.freeze({ en: 'en-US', tr: 'tr-TR' })

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const ISO_MONTH = /^(\d{4})-(\d{2})$/

export function localeFor(language) {
  return LOCALES[language] || LOCALES.en
}

function utcDate(year, month, day) {
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
}

export function formatNumber(value, language) {
  return new Intl.NumberFormat(localeFor(language)).format(Number(value) || 0)
}

/** One decimal place, for averages such as 4.2 days. */
export function formatDecimal(value, language) {
  return new Intl.NumberFormat(localeFor(language), { maximumFractionDigits: 1 }).format(Number(value) || 0)
}

/** Turkish lira. Whole lira by default; pass two fraction digits for the exact amount in a tooltip. */
export function formatCurrency(value, language, fractionDigits = 0) {
  return new Intl.NumberFormat(localeFor(language), {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value) || 0)
}

/** Shortened number for axis ticks, such as 1.2 thousand or 3.4 million in the language's words. */
export function formatCompact(value, language) {
  return new Intl.NumberFormat(localeFor(language), { notation: 'compact', maximumFractionDigits: 1 }).format(
    Number(value) || 0,
  )
}

/** A fraction (0.85) shown as a percentage (85%). */
export function formatPercent(fraction, language, fractionDigits = 1) {
  return new Intl.NumberFormat(localeFor(language), {
    style: 'percent',
    maximumFractionDigits: fractionDigits,
  }).format(Number(fraction) || 0)
}

/** "2026-03-14" shown as a date such as "14 Mar 2026". Other values are returned unchanged. */
export function formatDate(value, language) {
  const match = ISO_DATE.exec(String(value))
  if (!match) {
    return String(value)
  }
  return new Intl.DateTimeFormat(localeFor(language), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(utcDate(match[1], match[2], match[3]))
}

/** "2026-10" shown as a month such as "Oct 2026". Other values are returned unchanged. */
export function formatMonth(value, language) {
  const match = ISO_MONTH.exec(String(value))
  if (!match) {
    return String(value)
  }
  return new Intl.DateTimeFormat(localeFor(language), { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    utcDate(match[1], match[2], 15),
  )
}
