import { fireEvent, screen, waitFor, within } from '@testing-library/react'

import { analyticsApi, etlApi, segmentationApi } from '../../api/resources'
import { renderWithProviders } from '../../test-utils'
import DashboardPage from './DashboardPage'

jest.mock('../../api/resources', () => ({
  analyticsApi: { overview: jest.fn(), salesTrend: jest.fn(), categories: jest.fn() },
  segmentationApi: { segments: jest.fn() },
  etlApi: { listRuns: jest.fn() },
}))

const OVERVIEW = {
  revenue: 1500000,
  orders: 4200,
  units: 9000,
  customers: 3100,
  averageOrderValue: 357.14,
  deliveredShare: 0.82,
  averageDeliveryDays: 3.1,
}
const TREND = [
  { period: '2026-08', revenue: 900000, orders: 2500, units: 5000 },
  { period: '2026-09', revenue: 600000, orders: 1700, units: 4000 },
]
const CATEGORIES = [
  { category: 'Furniture', revenue: 800000, units: 1200, share: 0.53 },
  { category: 'Decor', revenue: 700000, units: 1100, share: 0.47 },
]
const SEGMENTS = [{ segment: 'Champions', customers: 300, share: 0.1 }]
const LAST_RUN = {
  id: 7,
  runType: 'INCREMENTAL',
  status: 'SUCCESS',
  startedAt: '2026-11-20T08:00:00Z',
  finishedAt: '2026-11-20T08:04:30Z',
  rowsLoaded: 12000,
  rowsRejected: 3,
}

beforeEach(() => {
  analyticsApi.overview.mockResolvedValue(OVERVIEW)
  analyticsApi.salesTrend.mockResolvedValue(TREND)
  analyticsApi.categories.mockResolvedValue(CATEGORIES)
  segmentationApi.segments.mockResolvedValue(SEGMENTS)
  etlApi.listRuns.mockResolvedValue({ content: [LAST_RUN], total: 1, page: 0, size: 1 })
})

test('shows the headline figures, the chart, categories, segments and the last run', async () => {
  renderWithProviders(<DashboardPage />)

  expect(await screen.findByText('Furniture')).toBeInTheDocument()
  expect(screen.getByText('4,200')).toBeInTheDocument()
  expect(screen.getByText('82%')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /Monthly revenue for 2 months/ })).toBeInTheDocument()
  expect(screen.getByText('Champions')).toBeInTheDocument()
  expect(screen.getByText('Succeeded')).toBeInTheDocument()
})

test('a failing service shows an error only in its own widget', async () => {
  segmentationApi.segments.mockRejectedValue(new Error('segmentation down'))
  renderWithProviders(<DashboardPage />)

  expect(await screen.findByText('This section could not be loaded.')).toBeInTheDocument()
  expect(screen.getByText('Furniture')).toBeInTheDocument()
  expect(screen.getByText('4,200')).toBeInTheDocument()
})

test('retry loads a failed widget again and shows its content', async () => {
  segmentationApi.segments.mockRejectedValueOnce(new Error('temporary')).mockResolvedValueOnce(SEGMENTS)
  renderWithProviders(<DashboardPage />)
  const errorBox = await screen.findByRole('alert')

  fireEvent.click(within(errorBox.parentElement).getByRole('button', { name: 'Retry' }))

  expect(await screen.findByText('Champions')).toBeInTheDocument()
  expect(segmentationApi.segments).toHaveBeenCalledTimes(2)
})

test('the revenue chart can be switched to the same numbers as a table', async () => {
  renderWithProviders(<DashboardPage />)
  await screen.findByRole('img', { name: /Monthly revenue/ })

  fireEvent.click(screen.getByRole('button', { name: 'Show as table' }))

  await waitFor(() => expect(screen.queryByRole('img', { name: /Monthly revenue/ })).not.toBeInTheDocument())
  expect(screen.getByRole('button', { name: 'Show as chart' })).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'Revenue' })).toBeInTheDocument()
})
