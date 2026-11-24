import { translate } from '../../hooks/useT'
import { filterRuns, runDurationMs, sortRuns } from './etlRuns'

const RUNS = [
  {
    id: 1,
    runType: 'FULL',
    status: 'SUCCESS',
    startedAt: '2026-10-01T10:00:00Z',
    finishedAt: '2026-10-01T10:02:00Z',
    rowsLoaded: 500,
    rowsRejected: 2,
  },
  {
    id: 2,
    runType: 'INCREMENTAL',
    status: 'FAILED',
    startedAt: '2026-10-02T10:00:00Z',
    finishedAt: '2026-10-02T10:00:30Z',
    rowsLoaded: 10,
    rowsRejected: 0,
  },
  {
    id: 3,
    runType: 'INCREMENTAL',
    status: 'RUNNING',
    startedAt: '2026-10-03T10:00:00Z',
    finishedAt: null,
    rowsLoaded: 0,
    rowsRejected: 0,
  },
]

const english = (key) => translate('en', key)

test('the duration of a finished run is the time between its start and finish', () => {
  expect(runDurationMs(RUNS[0])).toBe(120000)
})

test('a run in progress counts up to the given moment', () => {
  expect(runDurationMs(RUNS[2], Date.parse('2026-10-03T10:00:45Z'))).toBe(45000)
})

test('sorting by duration puts the longest finished run first in descending order', () => {
  const descending = sortRuns([RUNS[0], RUNS[1]], { key: 'durationMs', direction: 'desc' })
  const ascending = sortRuns([RUNS[0], RUNS[1]], { key: 'durationMs', direction: 'asc' })

  expect(descending.map((run) => run.id)).toEqual([1, 2])
  expect(ascending.map((run) => run.id)).toEqual([2, 1])
})

test('sorting by start time works in both directions and keeps the original list intact', () => {
  const descending = sortRuns(RUNS, { key: 'startedAt', direction: 'desc' })

  expect(descending.map((run) => run.id)).toEqual([3, 2, 1])
  expect(RUNS.map((run) => run.id)).toEqual([1, 2, 3])
  expect(sortRuns(RUNS, { key: 'startedAt', direction: 'asc' }).map((run) => run.id)).toEqual([1, 2, 3])
})

test('search matches the run type or status, raw or translated, ignoring case', () => {
  expect(filterRuns(RUNS, 'succeeded', english).map((run) => run.id)).toEqual([1])
  expect(filterRuns(RUNS, 'incremental', english).map((run) => run.id)).toEqual([2, 3])
  expect(filterRuns(RUNS, '  ', english)).toHaveLength(3)
})
