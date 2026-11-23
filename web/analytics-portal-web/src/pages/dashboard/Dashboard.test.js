import { fireEvent, screen, waitFor, within } from '@testing-library/react'

import { analyticsApi } from '../../api/analyticsApi'
import { ADMIN_USER, ANALYST_USER, VIEWER_USER, renderWithProviders } from '../../test-utils'
import { presetRange } from '../../utils/dateRange'
import DashboardPage from './DashboardPage'

jest.mock('../../api/analyticsApi', () => ({
  analyticsApi: {
    overview: jest.fn(),
    salesTrend: jest.fn(),
    topProducts: jest.fn(),
    categories: jest.fn(),
    regions: jest.fn(),
    payments: jest.fn(),
    fulfillment: jest.fn(),
    topCustomers: jest.fn(),
    customerMetrics: jest.fn(),
  },
}))

const OVERVIEW = {
  revenue: 1234567,
  orders: 4200,
  units: 9100,
  customers: 1800,
  averageOrderValue: 293.9,
  deliveredShare: 0.85,
  averageDeliveryDays: 4.26,
}
const TREND = [
  { period: '2026-11-01', revenue: 100, orders: 1, units: 1 },
  { period: '2026-11-02', revenue: 300, orders: 2, units: 3 },
]
const PRODUCTS = [
  { productId: 1, name: 'Laptop Pro 14', category: 'Electronics', brand: 'Acme', revenue: 400000, units: 40 },
  { productId: 2, name: 'Desk Lamp', category: 'Home and Kitchen', brand: 'Lumo', revenue: 90000, units: 300 },
]
const CATEGORIES = [
  { category: 'Electronics', revenue: 700000, units: 50, share: 0.57 },
  { category: 'Books', revenue: 534567, units: 900, share: 0.43 },
]
const REGIONS = [
  { region: 'Marmara', city: 'Istanbul', revenue: 800000, orders: 100, units: 10, share: 0.65 },
  { region: 'Marmara', city: 'Bursa', revenue: 100000, orders: 20, units: 2, share: 0.08 },
  { region: 'Aegean', city: 'Izmir', revenue: 334567, orders: 80, units: 8, share: 0.27 },
]
const PAYMENTS = [
  { paymentMethod: 'CREDIT_CARD', isOnline: true, revenue: 900000, orders: 3000, share: 0.73 },
  { paymentMethod: 'CASH', isOnline: false, revenue: 334567, orders: 1200, share: 0.27 },
]
const FULFILLMENT = {
  placed: 4200,
  delivered: 3570,
  pending: 630,
  deliveredShare: 0.85,
  averageDeliveryDays: 4.26,
  byWarehouse: [{ city: 'Istanbul', region: 'Marmara', placed: 2000, delivered: 1700, averageDeliveryDays: 3.9 }],
}
const CUSTOMERS = [
  {
    customerId: '1-2-3',
    name: 'Ayse Demir',
    region: 'Marmara',
    orders: 12,
    revenue: 45000,
    firstOrderDate: '2025-01-02',
    lastOrderDate: '2026-10-30',
  },
  {
    customerId: '1-2-4',
    name: 'Mehmet Kaya',
    region: 'Aegean',
    orders: 3,
    revenue: 9000,
    firstOrderDate: '2026-02-01',
    lastOrderDate: '2026-03-01',
  },
]
const METRICS = {
  customersWithOrders: 1800,
  repeatCustomers: 900,
  repeatPurchaseRate: 0.5,
  averageOrdersPerCustomer: 2.3,
  averageLifetimeValue: 1234.5,
}

function answerAllReports() {
  analyticsApi.overview.mockResolvedValue(OVERVIEW)
  analyticsApi.salesTrend.mockResolvedValue(TREND)
  analyticsApi.topProducts.mockResolvedValue(PRODUCTS)
  analyticsApi.categories.mockResolvedValue(CATEGORIES)
  analyticsApi.regions.mockResolvedValue(REGIONS)
  analyticsApi.payments.mockResolvedValue(PAYMENTS)
  analyticsApi.fulfillment.mockResolvedValue(FULFILLMENT)
  analyticsApi.topCustomers.mockResolvedValue(CUSTOMERS)
  analyticsApi.customerMetrics.mockResolvedValue(METRICS)
}

beforeEach(() => {
  jest.clearAllMocks()
  answerAllReports()
})

test('the KPI cards show the headline figures of the period in the language of the page', async () => {
  renderWithProviders(<DashboardPage />, { user: ADMIN_USER })

  expect(await screen.findByText('TRY 1,234,567')).toBeInTheDocument()
  expect(screen.getAllByText('4,200')[0]).toBeInTheDocument()
  expect(screen.getAllByText('85%')[0]).toBeInTheDocument()
  expect(screen.getAllByText('4.3 days')[0]).toBeInTheDocument()
})

test('every widget renders its data from the mocked services', async () => {
  renderWithProviders(<DashboardPage />, { user: ADMIN_USER })

  expect(await screen.findByRole('heading', { name: 'Sales trend' })).toBeInTheDocument()
  expect(await screen.findByRole('img', { name: /Revenue by week over 2 periods/ })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Top products' })).toBeInTheDocument()
  expect(screen.getByText('Laptop Pro 14')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Revenue by category' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Revenue by region and city' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /^Marmara/ })).toBeInTheDocument()
  expect(screen.getByText('Online')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: '85% of orders delivered' })).toHaveAttribute('aria-valuenow', '85')
  expect(screen.getByRole('heading', { name: 'Fulfillment' })).toBeInTheDocument()
})

test('a VIEWER sees no customer widgets and the customer reports are never requested', async () => {
  renderWithProviders(<DashboardPage />, { user: VIEWER_USER })

  expect(await screen.findByText('TRY 1,234,567')).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Top customers' })).not.toBeInTheDocument()
  expect(screen.queryByText('Repeat purchase rate')).not.toBeInTheDocument()
  expect(analyticsApi.topCustomers).not.toHaveBeenCalled()
  expect(analyticsApi.customerMetrics).not.toHaveBeenCalled()
})

test('an ANALYST sees the customer metrics and the top customers table', async () => {
  renderWithProviders(<DashboardPage />, { user: ANALYST_USER })

  expect(await screen.findByText('Repeat purchase rate')).toBeInTheDocument()
  expect(screen.getByText('50%')).toBeInTheDocument()
  const table = await screen.findByRole('table', { name: 'Top customers' })
  expect(within(table).getByText('Ayse Demir')).toBeInTheDocument()
})

test('the top customers table sorts on the client when a column header is pressed', async () => {
  renderWithProviders(<DashboardPage />, { user: ADMIN_USER })
  const table = await screen.findByRole('table', { name: 'Top customers' })

  expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Ayse Demir')

  fireEvent.click(within(table).getByRole('button', { name: 'Orders' }))
  fireEvent.click(within(table).getByRole('button', { name: 'Orders' }))

  expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Mehmet Kaya')
  expect(within(table).getByRole('columnheader', { name: /Orders/ })).toHaveAttribute('aria-sort', 'ascending')
})

test('the period presets pass their from and to values to every report', async () => {
  renderWithProviders(<DashboardPage />, { user: ADMIN_USER })
  await screen.findByText('TRY 1,234,567')

  fireEvent.click(screen.getByRole('button', { name: 'Last 12 months' }))

  const expected = presetRange('last12Months')
  await waitFor(() => expect(analyticsApi.overview).toHaveBeenLastCalledWith(expected))
  expect(analyticsApi.salesTrend).toHaveBeenLastCalledWith(expected, 'week')
  expect(analyticsApi.topProducts).toHaveBeenLastCalledWith(expected, { by: 'revenue', limit: 10, category: '' })
  expect(analyticsApi.regions).toHaveBeenLastCalledWith(expected)
  expect(analyticsApi.payments).toHaveBeenLastCalledWith(expected)
  expect(analyticsApi.fulfillment).toHaveBeenLastCalledWith(expected)
  expect(analyticsApi.categories).toHaveBeenLastCalledWith(expected)
  expect(screen.getByRole('button', { name: 'Last 12 months' })).toHaveAttribute('aria-pressed', 'true')
})

test('the all time preset sends an empty range, which means no date filter', async () => {
  renderWithProviders(<DashboardPage />, { user: ADMIN_USER })
  await screen.findByText('TRY 1,234,567')

  fireEvent.click(screen.getByRole('button', { name: 'All time' }))

  await waitFor(() => expect(analyticsApi.overview).toHaveBeenLastCalledWith({ from: '', to: '' }))
  expect(analyticsApi.salesTrend).toHaveBeenLastCalledWith({ from: '', to: '' }, 'month')
})

test('typing a custom start date switches to a custom period and keeps the end date', async () => {
  renderWithProviders(<DashboardPage />, { user: ADMIN_USER })
  await screen.findByText('TRY 1,234,567')
  const today = presetRange('last12Months').to

  fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-01' } })

  await waitFor(() => expect(analyticsApi.overview).toHaveBeenLastCalledWith({ from: '2026-09-01', to: today }))
  expect(screen.getByLabelText('From')).toHaveValue('2026-09-01')
})

test('an inverted period is reported in the filter bar and no report is requested for it', async () => {
  renderWithProviders(<DashboardPage />, { user: ADMIN_USER })
  await screen.findByText('TRY 1,234,567')
  const calls = analyticsApi.overview.mock.calls.length

  fireEvent.change(screen.getByLabelText('From'), { target: { value: '2099-01-01' } })

  expect(screen.getByText('The start date must not be after the end date.')).toBeInTheDocument()
  expect(analyticsApi.overview.mock.calls.length).toBe(calls)
  analyticsApi.overview.mock.calls.forEach(([range]) => expect(range.from <= range.to).toBe(true))
})

test('the trend granularity follows the period and a manual choice overrides it', async () => {
  renderWithProviders(<DashboardPage />, { user: ADMIN_USER })
  await screen.findByRole('img', { name: /Revenue by week/ })
  expect(analyticsApi.salesTrend).toHaveBeenCalledWith(expect.anything(), 'week')

  fireEvent.click(screen.getByRole('button', { name: 'Year' }))

  await waitFor(() => expect(analyticsApi.salesTrend).toHaveBeenLastCalledWith(expect.anything(), 'year'))
  expect(screen.getByRole('button', { name: 'Year' })).toHaveAttribute('aria-pressed', 'true')
})

test('a category chosen in the filter bar is sent to the top products report', async () => {
  renderWithProviders(<DashboardPage />, { user: ADMIN_USER })
  const select = await screen.findByLabelText('Category')
  await waitFor(() => expect(within(select).getByRole('option', { name: 'Books' })).toBeInTheDocument())

  fireEvent.change(select, { target: { value: 'Electronics' } })

  await waitFor(() =>
    expect(analyticsApi.topProducts).toHaveBeenLastCalledWith(expect.anything(), {
      by: 'revenue',
      limit: 10,
      category: 'Electronics',
    }),
  )
})

test('the top products widget switches between revenue and units', async () => {
  renderWithProviders(<DashboardPage />, { user: ADMIN_USER })
  await screen.findByText('Laptop Pro 14')

  fireEvent.click(screen.getByRole('button', { name: 'Units' }))

  await waitFor(() =>
    expect(analyticsApi.topProducts).toHaveBeenLastCalledWith(expect.anything(), {
      by: 'units',
      limit: 10,
      category: '',
    }),
  )
})

test('one failing report shows its own error with a retry button and leaves the other widgets in place', async () => {
  analyticsApi.regions.mockRejectedValueOnce(new Error('warehouse unavailable'))
  renderWithProviders(<DashboardPage />, { user: ADMIN_USER })

  expect(await screen.findByText('This section could not be loaded.')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Revenue by category' })).toBeInTheDocument()
  expect(screen.getByText('Laptop Pro 14')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

  expect(await screen.findByRole('heading', { name: /^Marmara/ })).toBeInTheDocument()
  expect(screen.queryByText('This section could not be loaded.')).not.toBeInTheDocument()
  expect(analyticsApi.regions).toHaveBeenCalledTimes(2)
})

test('the turkish page uses turkish titles and lira formatting', async () => {
  renderWithProviders(<DashboardPage />, { user: ADMIN_USER, language: 'tr' })

  expect(await screen.findByRole('heading', { name: 'Satış trendi' })).toBeInTheDocument()
  expect(await screen.findByText(/1\.234\.567/)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Kategoriye göre ciro' })).toBeInTheDocument()
})

test('every chart offers the same numbers as a table', async () => {
  renderWithProviders(<DashboardPage />, { user: ADMIN_USER })
  await screen.findByText('Laptop Pro 14')

  const toggles = screen.getAllByRole('button', { name: 'Show as table' })
  expect(toggles.length).toBeGreaterThanOrEqual(5)

  fireEvent.click(toggles[0])

  expect(screen.getByRole('table', { name: 'Sales trend' })).toBeInTheDocument()
})
