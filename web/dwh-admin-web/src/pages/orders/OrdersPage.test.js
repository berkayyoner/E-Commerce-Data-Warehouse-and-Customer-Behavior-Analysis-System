import { fireEvent, screen, waitFor, within } from '@testing-library/react'

import { shopApi } from '../../api/resources'
import { renderWithProviders } from '../../test-utils'
import OrdersPage from './OrdersPage'

jest.mock('../../api/resources', () => ({
  shopApi: {
    orders: { list: jest.fn(), get: jest.fn() },
    warehouses: { list: jest.fn() },
  },
}))

const ORDERS = [
  {
    warehouseId: 1,
    districtId: 3,
    orderId: 3001,
    customerId: 120,
    customerName: 'Ayse Demir',
    orderDate: '2026-10-01T09:30:00',
    paymentMethod: 'CC',
    lineCount: 2,
    totalAmount: 1234.5,
    delivered: true,
  },
  {
    warehouseId: 2,
    districtId: 7,
    orderId: 55,
    customerId: 4,
    customerName: 'Mehmet Kaya',
    orderDate: '2026-09-15T12:00:00',
    paymentMethod: 'CASH',
    lineCount: 1,
    totalAmount: 99,
    delivered: false,
  },
]

const DETAIL = {
  ...ORDERS[0],
  lines: [
    {
      lineNumber: 1,
      itemId: 10,
      productName: 'Oak Chair',
      quantity: 2,
      amount: 1000,
      deliveryDate: '2026-10-03T10:00:00',
    },
    {
      lineNumber: 2,
      itemId: 11,
      productName: 'Desk Lamp',
      quantity: 1,
      amount: 234.5,
      deliveryDate: null,
    },
  ],
}

beforeEach(() => {
  shopApi.orders.list.mockResolvedValue({ content: ORDERS, total: 2, page: 0, size: 20 })
  shopApi.orders.get.mockResolvedValue(DETAIL)
  shopApi.warehouses.list.mockResolvedValue({
    content: [
      { id: 1, name: 'Central' },
      { id: 2, name: 'Coastal' },
    ],
    total: 2,
    page: 0,
    size: 100,
  })
})

function lastListQuery() {
  return shopApi.orders.list.mock.calls[shopApi.orders.list.mock.calls.length - 1][0]
}

test('lists the orders under their identifier with the delivery state written as text', async () => {
  renderWithProviders(<OrdersPage />)

  expect(await screen.findByText('1-3-3001')).toBeInTheDocument()
  expect(screen.getByText('2-7-55')).toBeInTheDocument()
  expect(screen.getByText('Delivered')).toBeInTheDocument()
  expect(screen.getByText('Not delivered')).toBeInTheDocument()
})

test('the orders page is read only: it has no create action', async () => {
  renderWithProviders(<OrdersPage />)
  await screen.findByText('1-3-3001')

  expect(screen.queryByRole('button', { name: /create/i })).not.toBeInTheDocument()
  const toolbar = document.querySelector('.data-table-toolbar')
  expect(toolbar.firstElementChild).toHaveClass('search-box')
  expect(toolbar.childElementCount).toBe(1)
})

test('the search box searches the customer names on the server', async () => {
  renderWithProviders(<OrdersPage />)
  await screen.findByText('1-3-3001')

  fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'mehmet' } })

  await waitFor(() => expect(lastListQuery()).toEqual(expect.objectContaining({ search: 'mehmet' })))
})

test('the warehouse and the date filters are sent to the server', async () => {
  renderWithProviders(<OrdersPage />)
  await screen.findByText('1-3-3001')

  fireEvent.change(await screen.findByLabelText('Warehouse', { selector: '.filter-bar select' }), {
    target: { value: '2' },
  })
  await waitFor(() => expect(lastListQuery()).toEqual(expect.objectContaining({ warehouseId: '2' })))

  fireEvent.change(screen.getByLabelText('Ordered from'), { target: { value: '2026-09-01' } })
  fireEvent.change(screen.getByLabelText('Ordered to'), { target: { value: '2026-09-30' } })

  await waitFor(() =>
    expect(lastListQuery()).toEqual(expect.objectContaining({ from: '2026-09-01', to: '2026-09-30' })),
  )
})

test('an end date before the start date is shown and is not sent until it is corrected', async () => {
  renderWithProviders(<OrdersPage />)
  await screen.findByText('1-3-3001')

  fireEvent.change(screen.getByLabelText('Ordered from'), { target: { value: '2026-10-10' } })
  fireEvent.change(screen.getByLabelText('Ordered to'), { target: { value: '2026-10-01' } })

  expect(await screen.findByText('The end date cannot be before the start date.')).toBeInTheDocument()
  await waitFor(() => expect(lastListQuery()).toEqual(expect.objectContaining({ from: '2026-10-10' })))
  expect(lastListQuery().to).toBeFalsy()
})

test('clicking the total header sorts the orders on the server', async () => {
  renderWithProviders(<OrdersPage />)
  await screen.findByText('1-3-3001')

  fireEvent.click(screen.getByRole('button', { name: 'Total' }))

  await waitFor(() =>
    expect(lastListQuery()).toEqual(expect.objectContaining({ sort: { key: 'totalAmount', direction: 'asc' } })),
  )
})

test('clicking an order opens its header and its lines in order', async () => {
  renderWithProviders(<OrdersPage />)
  const row = (await screen.findByText('1-3-3001')).closest('tr')

  fireEvent.click(row)

  const dialog = await screen.findByRole('dialog', { name: 'Order 1-3-3001' })
  expect(await within(dialog).findByText('Oak Chair')).toBeInTheDocument()
  expect(shopApi.orders.get).toHaveBeenCalledWith(ORDERS[0])
  expect(within(dialog).getByText('Desk Lamp')).toBeInTheDocument()
  expect(within(dialog).getByText('Delivered')).toBeInTheDocument()
  const lineRows = within(within(dialog).getByRole('table')).getAllByRole('row').slice(1)
  expect(lineRows).toHaveLength(2)
  expect(within(lineRows[1]).getByText('Desk Lamp')).toBeInTheDocument()
})

test('an order without lines says so', async () => {
  shopApi.orders.get.mockResolvedValue({ ...DETAIL, lines: [] })
  renderWithProviders(<OrdersPage />)
  fireEvent.click((await screen.findByText('1-3-3001')).closest('tr'))

  const dialog = await screen.findByRole('dialog', { name: 'Order 1-3-3001' })
  expect(await within(dialog).findByText('This order has no lines.')).toBeInTheDocument()
})

test('a failed order detail can be retried', async () => {
  shopApi.orders.get.mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce(DETAIL)
  renderWithProviders(<OrdersPage />)
  fireEvent.click((await screen.findByText('1-3-3001')).closest('tr'))

  const dialog = await screen.findByRole('dialog', { name: 'Order 1-3-3001' })
  const alert = await within(dialog).findByRole('alert')
  expect(alert).toHaveTextContent('The order could not be loaded.')
  fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }))

  expect(await within(dialog).findByText('Oak Chair')).toBeInTheDocument()
})
