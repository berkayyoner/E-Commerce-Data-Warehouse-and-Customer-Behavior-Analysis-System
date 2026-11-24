import { daysInRange, granularityFor, isValidRange, presetRange, toIsoDate } from './dateRange'

const TODAY = new Date(2026, 10, 23) // 23 November 2026, local time

test('dates are written as yyyy-MM-dd', () => {
  expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
})

test('the last 30 days include today and the 29 days before it', () => {
  expect(presetRange('last30Days', TODAY)).toEqual({ from: '2026-10-25', to: '2026-11-23' })
  expect(daysInRange('2026-10-25', '2026-11-23')).toBe(30)
})

test('the last 12 months start on the first day of the month eleven months back', () => {
  expect(presetRange('last12Months', TODAY)).toEqual({ from: '2025-12-01', to: '2026-11-23' })
})

test('the last 12 months wrap around the year end correctly for a January date', () => {
  expect(presetRange('last12Months', new Date(2026, 0, 15))).toEqual({ from: '2025-02-01', to: '2026-01-15' })
})

test('all time is an empty range, which means no filter', () => {
  expect(presetRange('allTime', TODAY)).toEqual({ from: '', to: '' })
})

test('a custom period has no preset values', () => {
  expect(presetRange('custom', TODAY)).toBeNull()
})

test('an open bound is valid and a start after the end is not', () => {
  expect(isValidRange('', '')).toBe(true)
  expect(isValidRange('2026-01-01', '')).toBe(true)
  expect(isValidRange('2026-02-01', '2026-01-01')).toBe(false)
  expect(isValidRange('2026-01-01', '2026-01-01')).toBe(true)
})

test('a 30-day period is shown per day', () => {
  expect(granularityFor('2026-10-25', '2026-11-23')).toBe('day')
})

test('a twelve-month period is shown per week', () => {
  expect(granularityFor('2025-12-01', '2026-11-23')).toBe('week')
})

test('all time is shown per month', () => {
  expect(granularityFor('', '')).toBe('month')
  expect(granularityFor(undefined, undefined)).toBe('month')
})

test('a period of about ten years is shown per month and a period of forty years per year', () => {
  expect(granularityFor('2016-01-01', '2026-01-01')).toBe('month')
  expect(granularityFor('1980-01-01', '2026-01-01')).toBe('year')
})

test('a range with only one bound has no length, so it is shown per month', () => {
  expect(daysInRange('2026-01-01', '')).toBeNull()
})
