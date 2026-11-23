import { isPriceRangeValid, parsePrice } from './searchState'

test('a typed price is read as a number, with a comma accepted as the decimal sign', () => {
  expect(parsePrice('12.5')).toBe(12.5)
  expect(parsePrice('12,5')).toBe(12.5)
  expect(parsePrice(' 40 ')).toBe(40)
})

test('an empty, negative or non-numeric price counts as no price', () => {
  expect(parsePrice('')).toBeUndefined()
  expect(parsePrice('   ')).toBeUndefined()
  expect(parsePrice('-3')).toBeUndefined()
  expect(parsePrice('abc')).toBeUndefined()
  expect(parsePrice(undefined)).toBeUndefined()
})

test('a price range is valid when the minimum is not above the maximum or one side is open', () => {
  expect(isPriceRangeValid(10, 20)).toBe(true)
  expect(isPriceRangeValid(20, 20)).toBe(true)
  expect(isPriceRangeValid(30, 20)).toBe(false)
  expect(isPriceRangeValid(undefined, 20)).toBe(true)
  expect(isPriceRangeValid(30, undefined)).toBe(true)
})
