import { translate } from '../../hooks/useT'
import { buildHeatGrid, heatLevel } from './rfmGrid'
import { runMessage } from './runStatus'

const t = (key, params) => translate('en', key, params)

test('the grid always has five rows from recency 5 to 1 and five cells from frequency 1 to 5', () => {
  const grid = buildHeatGrid([{ recencyScore: 2, frequencyScore: 4, customers: 9, averageMonetary: 10 }])

  expect(grid.map((row) => row[0].recency)).toEqual([5, 4, 3, 2, 1])
  expect(grid.every((row) => row.length === 5)).toBe(true)
  expect(grid[3].map((cell) => cell.frequency)).toEqual([1, 2, 3, 4, 5])
  expect(grid[3][3]).toEqual({ recency: 2, frequency: 4, customers: 9 })
})

test('combinations without customers count zero in the grid', () => {
  const grid = buildHeatGrid([])

  expect(grid.flat().map((cell) => cell.customers)).toEqual(Array(25).fill(0))
})

test('the shade of a cell grows with its share of the fullest cell and is never empty for a customer', () => {
  expect(heatLevel(0, 40)).toBe(0)
  expect(heatLevel(0, 0)).toBe(0)
  expect(heatLevel(1, 40)).toBe(1)
  expect(heatLevel(12, 40)).toBe(2)
  expect(heatLevel(30, 40)).toBe(3)
  expect(heatLevel(40, 40)).toBe(4)
})

test('the run message says whether the run is running, finished or failed', () => {
  expect(runMessage(null, t, 'en')).toBeNull()
  expect(runMessage({ id: 4, status: 'RUNNING' }, t, 'en')).toBe('Segmentation run 4 is running. The results refresh when it finishes.')
  expect(runMessage({ id: 4, status: 'SUCCESS', customersScored: 1234 }, t, 'en')).toBe(
    'Segmentation run 4 finished. 1,234 customers were scored.',
  )
  expect(runMessage({ id: 5, status: 'FAILED', errorMessage: 'warehouse unreachable' }, t, 'en')).toBe(
    'Segmentation run 5 failed: warehouse unreachable',
  )
  expect(runMessage({ id: 6, status: 'FAILED', errorMessage: null }, t, 'en')).toBe('Segmentation run 6 failed: -')
})
