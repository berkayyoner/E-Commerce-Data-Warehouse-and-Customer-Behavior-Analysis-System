/** Duration of a run in milliseconds. A run that is still in progress counts up to the given time. */
export function runDurationMs(run, now = Date.now()) {
  if (!run || !run.startedAt) {
    return null
  }
  const started = Date.parse(run.startedAt)
  const finished = run.finishedAt ? Date.parse(run.finishedAt) : now
  if (Number.isNaN(started) || Number.isNaN(finished)) {
    return null
  }
  return Math.max(0, finished - started)
}

const SORT_VALUES = {
  id: (run) => run.id,
  runType: (run) => run.runType,
  status: (run) => run.status,
  startedAt: (run) => Date.parse(run.startedAt) || 0,
  durationMs: (run) => runDurationMs(run) || 0,
  rowsLoaded: (run) => run.rowsLoaded || 0,
  rowsRejected: (run) => run.rowsRejected || 0,
}

/** Sorts the runs of one page. The server does not sort run lists, so the sort happens here. */
export function sortRuns(runs, sort) {
  const valueOf = SORT_VALUES[sort.key]
  if (!valueOf) {
    return runs
  }
  const direction = sort.direction === 'asc' ? 1 : -1
  return [...runs].sort((left, right) => {
    const a = valueOf(left)
    const b = valueOf(right)
    if (a === b) {
      return 0
    }
    return (a < b ? -1 : 1) * direction
  })
}

/** Keeps the runs whose type or status (raw or translated) contains the query, ignoring case. */
export function filterRuns(runs, query, translate) {
  const needle = query.trim().toLowerCase()
  if (!needle) {
    return runs
  }
  return runs.filter((run) =>
    [run.runType, run.status, translate(`etl.runTypes.${run.runType}`), translate(`etl.statuses.${run.status}`)].some(
      (text) => String(text).toLowerCase().includes(needle),
    ),
  )
}
