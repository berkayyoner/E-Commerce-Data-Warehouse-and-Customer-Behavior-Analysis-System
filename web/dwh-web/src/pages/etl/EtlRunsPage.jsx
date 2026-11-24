import { useMemo, useState } from 'react'

import { ROLES } from '../../auth/roles'
import useRoles from '../../auth/useRoles'
import PageTitle from '../../components/layout/PageTitle'
import DataTable from '../../components/ui/DataTable'
import ErrorState from '../../components/ui/ErrorState'
import useT from '../../hooks/useT'
import { formatDateTime, formatDuration, formatNumber } from '../../utils/format'
import RunDetailModal from './RunDetailModal'
import RunStatusBadge from './RunStatusBadge'
import StartRunModal from './StartRunModal'
import { filterRuns, runDurationMs, sortRuns } from './etlRuns'
import useRunList, { RUN_PAGE_SIZE } from './useRunList'

const INITIAL_SORT = { key: 'startedAt', direction: 'desc' }

/** Runs of the ETL pipeline, newest first. Administrators can start a run; analysts can read the history. */
export default function EtlRunsPage() {
  const { t, language } = useT()
  const { hasAnyRole } = useRoles()
  const canStart = hasAnyRole([ROLES.ADMIN])
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState(INITIAL_SORT)
  const [starting, setStarting] = useState(false)
  const [selectedRunId, setSelectedRunId] = useState(null)
  const list = useRunList(page)

  const rows = useMemo(() => sortRuns(filterRuns(list.rows, search, t), sort), [list.rows, search, sort, t])
  // Durations of runs in progress count up to the moment of this render; the list re-renders while polling.
  const now = Date.now()

  const columns = [
    { key: 'id', label: t('etl.columns.id'), sortKey: 'id' },
    {
      key: 'runType',
      label: t('etl.columns.runType'),
      sortKey: 'runType',
      render: (run) => t(`etl.runTypes.${run.runType}`),
    },
    {
      key: 'status',
      label: t('etl.columns.status'),
      sortKey: 'status',
      render: (run) => <RunStatusBadge status={run.status} />,
    },
    {
      key: 'startedAt',
      label: t('etl.columns.startedAt'),
      sortKey: 'startedAt',
      render: (run) => formatDateTime(run.startedAt, language),
    },
    {
      key: 'duration',
      label: t('etl.columns.duration'),
      sortKey: 'durationMs',
      render: (run) => formatDuration(runDurationMs(run, now)),
    },
    {
      key: 'rowsLoaded',
      label: t('etl.columns.rowsLoaded'),
      sortKey: 'rowsLoaded',
      render: (run) => formatNumber(run.rowsLoaded, language),
    },
    {
      key: 'rowsRejected',
      label: t('etl.columns.rowsRejected'),
      sortKey: 'rowsRejected',
      render: (run) => formatNumber(run.rowsRejected, language),
    },
  ]

  function handleStarted() {
    setStarting(false)
    list.reload()
  }

  return (
    <div className="page">
      <PageTitle title={t('etl.title')} subtitle={t('etl.pollingNote')} />

      {list.error && <ErrorState message={t('common.error.page')} onRetry={list.reload} />}

      <DataTable
        columns={columns}
        rows={rows}
        loading={list.loading}
        total={list.total}
        page={page}
        size={RUN_PAGE_SIZE}
        onPageChange={setPage}
        sort={sort}
        onSortChange={setSort}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('etl.search.placeholder')}
        createLabel={t('etl.startRun')}
        onCreate={canStart ? () => setStarting(true) : undefined}
        onRowClick={(run) => setSelectedRunId(run.id)}
      />

      {starting && <StartRunModal onClose={() => setStarting(false)} onStarted={handleStarted} />}
      {selectedRunId !== null && <RunDetailModal runId={selectedRunId} onClose={() => setSelectedRunId(null)} />}
    </div>
  )
}
