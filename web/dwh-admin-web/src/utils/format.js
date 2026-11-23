const LOCALES = Object.freeze({ en: 'en-US', tr: 'tr-TR' })

export function localeFor(language) {
  return LOCALES[language] || LOCALES.en
}

export function formatNumber(value, language) {
  return new Intl.NumberFormat(localeFor(language)).format(Number(value) || 0)
}

/** Turkish lira without decimals, for example 1.234.567 TL in Turkish and TRY 1,234,567 in English. */
export function formatCurrency(value, language) {
  return new Intl.NumberFormat(localeFor(language), {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

/** A fraction (0.85) shown as a percentage (85%). */
export function formatPercent(fraction, language) {
  return new Intl.NumberFormat(localeFor(language), { style: 'percent', maximumFractionDigits: 1 }).format(
    Number(fraction) || 0,
  )
}

export function formatDateTime(value, language) {
  if (!value) {
    return '-'
  }
  return new Intl.DateTimeFormat(localeFor(language), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

/** A calendar day such as "2026-10-01" (no time of day). The day is shown as written, whatever the time zone. */
export function formatDate(value, language) {
  if (!value) {
    return '-'
  }
  return new Intl.DateTimeFormat(localeFor(language), { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${String(value).slice(0, 10)}T00:00:00Z`),
  )
}

/** A number with at most one decimal, for averages such as 12.3 days. */
export function formatDecimal(value, language) {
  return new Intl.NumberFormat(localeFor(language), { maximumFractionDigits: 1 }).format(Number(value) || 0)
}

/** A score with at most two decimals, for example a relevance score of 7.4312 shown as 7.43. */
export function formatScore(value, language) {
  return new Intl.NumberFormat(localeFor(language), { maximumFractionDigits: 2 }).format(Number(value) || 0)
}

/** "2026-10" becomes "Oct 2026" (or the Turkish equivalent). Other values are returned unchanged. */
export function formatMonth(period, language) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(period))
  if (!match) {
    return String(period)
  }
  return new Intl.DateTimeFormat(localeFor(language), { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 15)),
  )
}

/** Milliseconds as mm:ss. Minutes keep counting past 59. */
export function formatDuration(milliseconds) {
  if (milliseconds === null || milliseconds === undefined || Number.isNaN(milliseconds)) {
    return '-'
  }
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
