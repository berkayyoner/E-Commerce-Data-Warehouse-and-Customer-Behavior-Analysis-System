import { everyNth, niceTicks, targetIndex } from './chartMath'

test('ticks start at zero and reach the largest value with round steps', () => {
  expect(niceTicks(1234, 4)).toEqual([0, 500, 1000, 1500])
  expect(niceTicks(87, 4)).toEqual([0, 50, 100])
})

test('a series without positive values gets a unit scale', () => {
  expect(niceTicks(0, 4)).toEqual([0, 1])
  expect(niceTicks(-5, 4)).toEqual([0, 1])
})

test('every tick is an exact multiple of its step, without floating point noise', () => {
  const ticks = niceTicks(0.3, 3)
  expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(0.3)
  expect(ticks.every((tick) => String(tick).length <= 6)).toBe(true)
})

test('labels are thinned so that at most the given number is drawn', () => {
  expect(everyNth(8, 8)).toBe(1)
  expect(everyNth(30, 8)).toBe(4)
  expect(everyNth(0, 8)).toBe(1)
})

test('arrow keys, Home and End move the focus between points and clamp at the ends', () => {
  expect(targetIndex('ArrowRight', 2, 5)).toBe(3)
  expect(targetIndex('ArrowLeft', 2, 5)).toBe(1)
  expect(targetIndex('ArrowRight', 4, 5)).toBe(4)
  expect(targetIndex('ArrowLeft', 0, 5)).toBe(0)
  expect(targetIndex('Home', 3, 5)).toBe(0)
  expect(targetIndex('End', 1, 5)).toBe(4)
})

test('other keys do not move the focus', () => {
  expect(targetIndex('a', 2, 5)).toBeNull()
})
