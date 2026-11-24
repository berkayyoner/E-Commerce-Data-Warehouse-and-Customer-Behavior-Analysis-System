/** Quick choices of the dashboard period. "custom" keeps whatever the two date fields hold. */
export const PRESETS = Object.freeze(['last30Days', 'last12Months', 'allTime', 'custom'])

/** Granularities of the sales trend, from the finest to the coarsest. */
export const GRANULARITIES = Object.freeze(['day', 'week', 'month', 'year'])

const DAY_MS = 24 * 60 * 60 * 1000

/** A local date as yyyy-MM-dd, the format of the analytics filters. */
export function toIsoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/**
 * The from and to values of a preset, counted from today. The last 30 days include today; the last 12 months
 * start on the first day of the month eleven months back. All time is an empty range (no filter).
 */
export function presetRange(preset, today = new Date()) {
  switch (preset) {
    case 'last30Days':
      return { from: toIsoDate(addDays(today, -29)), to: toIsoDate(today) }
    case 'last12Months':
      return { from: toIsoDate(new Date(today.getFullYear(), today.getMonth() - 11, 1)), to: toIsoDate(today) }
    case 'allTime':
      return { from: '', to: '' }
    default:
      return null
  }
}

/** An open bound is always valid; two bounds are valid when the start is not after the end. */
export function isValidRange(from, to) {
  return !from || !to || from <= to
}

/** Number of days in an inclusive range, or null when either bound is missing. */
export function daysInRange(from, to) {
  if (!from || !to) {
    return null
  }
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1
}

/**
 * The granularity that keeps a trend at or below about 400 points: days for up to two months, weeks up to about
 * two years, months up to thirty years, years beyond. A range without both bounds (all time) gets months.
 */
export function granularityFor(from, to) {
  const days = daysInRange(from, to)
  if (days === null) {
    return 'month'
  }
  if (days <= 62) {
    return 'day'
  }
  if (days <= 800) {
    return 'week'
  }
  if (days <= 365 * 30) {
    return 'month'
  }
  return 'year'
}
