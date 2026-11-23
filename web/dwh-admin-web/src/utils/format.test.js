import { formatCurrency, formatDuration, formatMonth, formatNumber, formatPercent } from './format'

test('durations are shown as minutes and seconds, and minutes keep counting past an hour', () => {
  expect(formatDuration(0)).toBe('00:00')
  expect(formatDuration(65400)).toBe('01:05')
  expect(formatDuration(3725000)).toBe('62:05')
})

test('a missing duration is shown as a dash', () => {
  expect(formatDuration(null)).toBe('-')
  expect(formatDuration(undefined)).toBe('-')
})

test('currency is Turkish lira without decimals in both languages', () => {
  expect(formatCurrency(1234.6, 'en')).toContain('1,235')
  expect(formatCurrency(1234.6, 'tr')).toContain('1.235')
})

test('shares given as fractions are shown as percentages', () => {
  expect(formatPercent(0.853, 'en')).toBe('85.3%')
})

test('numbers follow the separator conventions of the language', () => {
  expect(formatNumber(1234567, 'en')).toBe('1,234,567')
  expect(formatNumber(1234567, 'tr')).toBe('1.234.567')
})

test('a month key such as 2026-10 is shown as a month name', () => {
  expect(formatMonth('2026-10', 'en')).toBe('Oct 2026')
  expect(formatMonth('Q1', 'en')).toBe('Q1')
})
