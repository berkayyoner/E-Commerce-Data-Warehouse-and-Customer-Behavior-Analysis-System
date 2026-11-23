import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatDecimal,
  formatMonth,
  formatNumber,
  formatPercent,
} from './format'

test('numbers follow the separator conventions of the language', () => {
  expect(formatNumber(1234567, 'en')).toBe('1,234,567')
  expect(formatNumber(1234567, 'tr')).toBe('1.234.567')
})

test('a missing number is shown as zero', () => {
  expect(formatNumber(null, 'en')).toBe('0')
  expect(formatNumber(undefined, 'tr')).toBe('0')
})

test('currency is Turkish lira, whole lira by default and two decimals on request', () => {
  expect(formatCurrency(1234.6, 'en')).toContain('1,235')
  expect(formatCurrency(1234.6, 'tr')).toContain('1.235')
  expect(formatCurrency(1234.6, 'en', 2)).toContain('1,234.60')
})

test('shares given as fractions are shown as percentages', () => {
  expect(formatPercent(0.853, 'en')).toBe('85.3%')
  expect(formatPercent(0.5, 'tr', 0)).toBe('%50')
})

test('averages keep one decimal place', () => {
  expect(formatDecimal(4.26, 'en')).toBe('4.3')
  expect(formatDecimal(4, 'en')).toBe('4')
})

test('large values are shortened for axis ticks', () => {
  expect(formatCompact(1200000, 'en')).toBe('1.2M')
  expect(formatCompact(950, 'en')).toBe('950')
})

test('an ISO date is shown as a month, day and year without a time zone shift', () => {
  expect(formatDate('2026-03-14', 'en')).toBe('Mar 14, 2026')
  expect(formatDate('2026-01-01', 'en')).toBe('Jan 1, 2026')
})

test('a value that is not an ISO date is returned unchanged', () => {
  expect(formatDate('2026-W11', 'en')).toBe('2026-W11')
})

test('a month key such as 2026-10 is shown as a month name', () => {
  expect(formatMonth('2026-10', 'en')).toBe('Oct 2026')
  expect(formatMonth('Q1', 'en')).toBe('Q1')
})
