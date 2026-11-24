import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'

import { etlApi } from '../../api/resources'
import { ANALYST_USER, renderWithProviders } from '../../test-utils'
import EtlRunsPage from './EtlRunsPage'

jest.mock('../../api/resources', () => ({
  etlApi: { listRuns: jest.fn(), getRun: jest.fn(), startRun: jest.fn() },
}))

const RUNS = [
  {
    id: 2,
    runType: 'INCREMENTAL',
    status: 'FAILED',
    startedAt: '2026-11-21T08:00:00Z',
    finishedAt: '2026-11-21T08:00:30Z',
    rowsLoaded: 0,
    rowsRejected: 4,
  },
  {
    id: 1,
    runType: 'FULL',
    status: 'SUCCESS',
    startedAt: '2026-11-20T08:00:00Z',
    finishedAt: '2026-11-20T08:02:05Z',
    rowsLoaded: 900,
    rowsRejected: 0,
  },
]

const RUNNING = {
  id: 3,
  runType: 'FULL',
  status: 'RUNNING',
  startedAt: '2026-11-22T08:00:00Z',
  finishedAt: null,
  rowsLoaded: 100,
  rowsRejected: 0,
}

beforeEach(() => {
  etlApi.listRuns.mockResolvedValue({ content: RUNS, total: 2, page: 0, size: 20 })
  etlApi.startRun.mockResolvedValue({ id: 4 })
  etlApi.getRun.mockResolvedValue({
    run: RUNS[1],
    steps: [{ stepName: 'load_orders', rowsRead: 900, rowsLoaded: 900, durationMs: 65000 }],
    qualityChecks: [
      { checkName: 'no_null_keys', passed: true, detail: 'ok' },
      { checkName: 'row_count', passed: false, detail: '4 rows rejected' },
    ],
  })
})

test('lists the runs newest first with durations shown as mm:ss', async () => {
  renderWithProviders(<EtlRunsPage />)
  await screen.findByText('Failed')

  const rows = screen.getAllByRole('row').slice(1)
  expect(within(rows[0]).getByText('Failed')).toBeInTheDocument()
  expect(within(rows[1]).getByText('02:05')).toBeInTheDocument()
  expect(within(rows[0]).getByText('00:30')).toBeInTheDocument()
})

test('the search box narrows the loaded runs by type or status', async () => {
  renderWithProviders(<EtlRunsPage />)
  await screen.findByText('Failed')

  fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'full' } })

  expect(screen.queryByText('Failed')).not.toBeInTheDocument()
  expect(screen.getByText('Succeeded')).toBeInTheDocument()
})

test('only administrators see the start run button', async () => {
  const { unmount } = renderWithProviders(<EtlRunsPage />)
  await screen.findByText('Failed')
  expect(screen.getByRole('button', { name: 'Start run' })).toBeInTheDocument()
  unmount()

  renderWithProviders(<EtlRunsPage />, { user: ANALYST_USER })
  await screen.findByText('Failed')
  expect(screen.queryByRole('button', { name: 'Start run' })).not.toBeInTheDocument()
})

test('starting a run sends the chosen run type', async () => {
  renderWithProviders(<EtlRunsPage />)
  await screen.findByText('Failed')

  fireEvent.click(screen.getByRole('button', { name: 'Start run' }))
  const dialog = await screen.findByRole('dialog', { name: 'Start an ETL run' })
  fireEvent.click(within(dialog).getByRole('radio', { name: /^Full/ }))
  fireEvent.click(within(dialog).getByRole('button', { name: 'Start run' }))

  await waitFor(() => expect(etlApi.startRun).toHaveBeenCalledWith('FULL'))
})

test('clicking a run opens its steps and quality checks, with text as well as icons', async () => {
  renderWithProviders(<EtlRunsPage />)
  await screen.findByText('Failed')

  fireEvent.click(screen.getByText('Succeeded').closest('tr'))

  const dialog = await screen.findByRole('dialog', { name: 'ETL run 1' })
  expect(await within(dialog).findByText('load_orders')).toBeInTheDocument()
  expect(within(dialog).getByText('01:05')).toBeInTheDocument()
  expect(within(dialog).getByText('Passed')).toBeInTheDocument()
  expect(within(dialog).getByText('Failed')).toBeInTheDocument()
})

test('while a run is active the list reloads every 5 seconds', async () => {
  etlApi.listRuns.mockResolvedValue({ content: [RUNNING], total: 1, page: 0, size: 20 })
  jest.useFakeTimers()
  try {
    renderWithProviders(<EtlRunsPage />)
    await act(async () => {})
    expect(etlApi.listRuns).toHaveBeenCalledTimes(1)

    await act(async () => {
      jest.advanceTimersByTime(5000)
    })
    expect(etlApi.listRuns).toHaveBeenCalledTimes(2)
  } finally {
    jest.useRealTimers()
  }
})
