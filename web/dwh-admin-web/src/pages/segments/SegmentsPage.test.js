import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'

import { segmentationApi } from '../../api/resources'
import Toasts from '../../components/ui/Toasts'
import { ANALYST_USER, renderWithProviders } from '../../test-utils'
import SegmentsPage from './SegmentsPage'

jest.mock('../../api/resources', () => ({
  segmentationApi: {
    segments: jest.fn(),
    rfmGrid: jest.fn(),
    clusters: jest.fn(),
    customers: jest.fn(),
    startRun: jest.fn(),
    getRun: jest.fn(),
  },
}))

const SEGMENTS = [
  {
    segment: 'Champions',
    customers: 300,
    share: 0.1,
    averageRecencyDays: 12.4,
    averageFrequency: 8.2,
    averageMonetary: 950,
    totalRevenue: 285000,
  },
  {
    segment: 'Lost',
    customers: 120,
    share: 0.04,
    averageRecencyDays: 300,
    averageFrequency: 1.2,
    averageMonetary: 120,
    totalRevenue: 14400,
  },
]

const GRID = [
  { recencyScore: 5, frequencyScore: 5, customers: 40, averageMonetary: 1000 },
  { recencyScore: 3, frequencyScore: 2, customers: 12, averageMonetary: 200 },
  { recencyScore: 1, frequencyScore: 1, customers: 7, averageMonetary: 50 },
]

const CLUSTERS = {
  clusters: [
    {
      clusterId: 0,
      label: 'Loyal big spenders',
      customers: 200,
      share: 0.5,
      averageRecencyDays: 10,
      averageFrequency: 6,
      averageMonetary: 800,
    },
    {
      clusterId: 1,
      label: 'Dormant',
      customers: 200,
      share: 0.5,
      averageRecencyDays: 200,
      averageFrequency: 1,
      averageMonetary: 90,
    },
  ],
  elbow: [
    { k: 2, inertia: 900 },
    { k: 3, inertia: 500 },
    { k: 4, inertia: 420 },
  ],
  chosenK: 3,
}

const CUSTOMERS = {
  content: [
    {
      customerId: '1-3-120',
      name: 'Ayse Demir',
      region: 'Marmara',
      recencyDays: 12,
      frequency: 8,
      monetary: 950,
      rScore: 5,
      fScore: 5,
      mScore: 5,
      segment: 'Champions',
      clusterId: 0,
      clusterLabel: 'Loyal big spenders',
    },
  ],
  total: 1,
  page: 0,
  size: 20,
}

const RUN_RUNNING = { id: 9, status: 'RUNNING', startedAt: '2026-11-22T08:00:00Z', customersScored: null, chosenK: null }
const RUN_DONE = { ...RUN_RUNNING, status: 'SUCCESS', customersScored: 950, chosenK: 3 }

beforeEach(() => {
  segmentationApi.segments.mockResolvedValue(SEGMENTS)
  segmentationApi.rfmGrid.mockResolvedValue(GRID)
  segmentationApi.clusters.mockResolvedValue(CLUSTERS)
  segmentationApi.customers.mockResolvedValue(CUSTOMERS)
  segmentationApi.startRun.mockResolvedValue(RUN_RUNNING)
  segmentationApi.getRun.mockImplementation(() => Promise.resolve({ run: { ...RUN_DONE }, elbow: [], clusters: [] }))
})

afterEach(() => {
  jest.useRealTimers()
})

test('the summary table gives each segment its customers, share and revenue', async () => {
  renderWithProviders(<SegmentsPage />)

  const table = await screen.findByRole('table', { name: 'Segment summary' })
  const champions = within(table).getByText('Champions').closest('tr')
  expect(within(champions).getByText('300')).toBeInTheDocument()
  expect(within(champions).getByText('10%')).toBeInTheDocument()
  expect(within(champions).getByText('12.4')).toBeInTheDocument()
})

test('the revenue per segment is drawn as bars and can be shown as a table', async () => {
  renderWithProviders(<SegmentsPage />)
  await screen.findByRole('table', { name: 'Segment summary' })

  expect(screen.getByRole('list', { name: /Total revenue of 2 segments/ })).toBeInTheDocument()
  const revenueSection = screen.getByRole('heading', { name: 'Revenue per segment' }).closest('section')
  fireEvent.click(within(revenueSection).getByRole('button', { name: 'Show as table' }))

  const revenueTable = screen.getByRole('table', { name: /Total revenue of 2 segments/ })
  expect(within(revenueTable).getByText('Lost')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Show as chart' })).toBeInTheDocument()
})

test('the RFM heat grid has one cell per score pair, with the customer counts printed in place', async () => {
  renderWithProviders(<SegmentsPage />)

  const grid = await screen.findByRole('table', { name: 'Customers by recency score and frequency score' })
  const rows = within(grid).getAllByRole('row').slice(1)
  const values = rows.map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent))

  expect(values).toEqual([
    ['0', '0', '0', '0', '40'],
    ['0', '0', '0', '0', '0'],
    ['0', '12', '0', '0', '0'],
    ['0', '0', '0', '0', '0'],
    ['7', '0', '0', '0', '0'],
  ])
  expect(within(grid).getAllByRole('cell')).toHaveLength(25)
})

test('the heat grid has real headers for recency and frequency and shades by customer count', async () => {
  renderWithProviders(<SegmentsPage />)
  const grid = await screen.findByRole('table', { name: 'Customers by recency score and frequency score' })

  expect(within(grid).getByRole('columnheader', { name: /Frequency score 3/ })).toBeInTheDocument()
  expect(within(grid).getByRole('rowheader', { name: /Recency score 5/ })).toBeInTheDocument()

  const fullest = within(grid).getByRole('cell', { name: '40' })
  const middle = within(grid).getByRole('cell', { name: '12' })
  const smallest = within(grid).getByRole('cell', { name: '7' })
  const empty = within(grid).getAllByRole('cell', { name: '0' })[0]
  expect(fullest).toHaveClass('heat-4')
  expect(middle).toHaveClass('heat-2')
  expect(smallest).toHaveClass('heat-1')
  expect(empty).toHaveClass('heat-0')
})

test('the clusters table lists each cluster and the elbow chart marks the chosen k', async () => {
  const { container } = renderWithProviders(<SegmentsPage />)

  const clusters = await screen.findByRole('table', { name: 'K-Means clusters' })
  expect(within(clusters).getByText('Loyal big spenders')).toBeInTheDocument()
  expect(screen.getByText('Chosen k: 3')).toBeInTheDocument()

  const chart = screen.getByRole('img', { name: 'Inertia for k from 2 to 4. The chosen k is 3.' })
  expect(chart.querySelectorAll('.elbow-point')).toHaveLength(3)
  expect(container.querySelectorAll('.elbow-point.is-chosen')).toHaveLength(1)
  expect(chart.querySelector('.elbow-point.is-chosen')).toBeInTheDocument()
})

test('the elbow values can be shown as a table with the chosen k highlighted', async () => {
  renderWithProviders(<SegmentsPage />)
  await screen.findByRole('table', { name: 'K-Means clusters' })

  const elbowSection = screen.getByRole('heading', { name: 'Elbow method' }).closest('section')
  fireEvent.click(within(elbowSection).getByRole('button', { name: 'Show as table' }))

  const elbowTable = screen.getByRole('table', { name: 'Inertia by k' })
  const chosenRow = within(elbowTable).getByText('500').closest('tr')
  expect(chosenRow).toHaveClass('is-chosen-row')
  expect(within(chosenRow).getByText('500')).toBeInTheDocument()
})

test('the customers table shows the scores, segment and cluster of each customer', async () => {
  renderWithProviders(<SegmentsPage />)

  const section = (await screen.findByRole('heading', { name: 'Customers' })).closest('section')
  const row = within(section).getByText('Ayse Demir').closest('tr')
  expect(within(row).getByText('5 / 5 / 5')).toBeInTheDocument()
  expect(within(row).getByText('Champions')).toBeInTheDocument()
  expect(within(row).getByText('Loyal big spenders')).toBeInTheDocument()
  expect(segmentationApi.customers).toHaveBeenCalledWith(
    expect.objectContaining({ sort: { key: 'monetary', direction: 'desc' } }),
  )
})

test('the segment and cluster filters and the search are sent to the server', async () => {
  renderWithProviders(<SegmentsPage />)
  const section = (await screen.findByRole('heading', { name: 'Customers' })).closest('section')

  fireEvent.change(within(section).getByLabelText('Segment'), { target: { value: 'Champions' } })
  await waitFor(() =>
    expect(segmentationApi.customers).toHaveBeenLastCalledWith(expect.objectContaining({ segment: 'Champions' })),
  )

  fireEvent.change(within(section).getByLabelText('Cluster'), { target: { value: '1' } })
  await waitFor(() =>
    expect(segmentationApi.customers).toHaveBeenLastCalledWith(
      expect.objectContaining({ segment: 'Champions', cluster: '1' }),
    ),
  )

  fireEvent.change(within(section).getByLabelText('Search'), { target: { value: 'ayse' } })
  await waitFor(() =>
    expect(segmentationApi.customers).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'ayse' })),
  )
})

test('clicking the recency header sorts the customers on the server', async () => {
  renderWithProviders(<SegmentsPage />)
  await screen.findByText('Ayse Demir')

  fireEvent.click(screen.getByRole('button', { name: 'Recency (days)' }))

  await waitFor(() =>
    expect(segmentationApi.customers).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort: { key: 'recencyDays', direction: 'asc' } }),
    ),
  )
})

test('administrators see the run button and analysts do not', async () => {
  const { unmount } = renderWithProviders(<SegmentsPage />)
  await screen.findByRole('table', { name: 'Segment summary' })
  expect(screen.getByRole('button', { name: 'Run segmentation' })).toBeInTheDocument()
  unmount()

  renderWithProviders(<SegmentsPage />, { user: ANALYST_USER })
  await screen.findByRole('table', { name: 'Segment summary' })
  expect(screen.queryByRole('button', { name: 'Run segmentation' })).not.toBeInTheDocument()
})

test('a run is followed every three seconds and the results load again when it finishes', async () => {
  jest.useFakeTimers()
  segmentationApi.getRun.mockResolvedValueOnce({ run: { ...RUN_RUNNING }, elbow: [], clusters: [] })
  renderWithProviders(<SegmentsPage />)
  await act(async () => {})

  fireEvent.click(screen.getByRole('button', { name: 'Run segmentation' }))
  await act(async () => {})
  expect(screen.getByRole('status')).toHaveTextContent('Segmentation run 9 is running.')
  expect(screen.getByRole('button', { name: 'Run segmentation' })).toBeDisabled()

  await act(async () => {
    jest.advanceTimersByTime(3000)
  })
  await act(async () => {})
  expect(segmentationApi.getRun).toHaveBeenCalledWith(9)
  expect(screen.getByRole('status')).toHaveTextContent('Segmentation run 9 is running.')

  await act(async () => {
    jest.advanceTimersByTime(3000)
  })
  await act(async () => {})
  expect(screen.getByRole('status')).toHaveTextContent('Segmentation run 9 finished. 950 customers were scored.')
  expect(segmentationApi.segments).toHaveBeenCalledTimes(2)
  expect(segmentationApi.clusters).toHaveBeenCalledTimes(2)
  expect(segmentationApi.rfmGrid).toHaveBeenCalledTimes(2)
  expect(segmentationApi.customers).toHaveBeenCalledTimes(2)
  expect(screen.getByRole('button', { name: 'Run segmentation' })).toBeEnabled()
})

test('a run that is refused because one is already running says so in plain words', async () => {
  segmentationApi.startRun.mockRejectedValue(
    Object.assign(new Error('Conflict'), { response: { status: 409, data: { detail: 'already running' } } }),
  )
  renderWithProviders(
    <>
      <SegmentsPage />
      <Toasts />
    </>,
  )
  await screen.findByRole('table', { name: 'Segment summary' })

  fireEvent.click(screen.getByRole('button', { name: 'Run segmentation' }))

  expect(await screen.findByText('A segmentation run is already in progress.')).toBeInTheDocument()
  expect(segmentationApi.getRun).not.toHaveBeenCalled()
})
