import { fireEvent, screen, waitFor, within } from '@testing-library/react'

import { shopApi } from '../../api/resources'
import { ANALYST_USER, renderWithProviders } from '../../test-utils'
import Toasts from '../../components/ui/Toasts'
import WarehousesPage from './WarehousesPage'

jest.mock('../../api/resources', () => ({
  shopApi: {
    warehouses: { list: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
  },
}))

const WAREHOUSES = [
  { id: 1, name: 'Central', city: 'Istanbul', state: 'IS', region: 'Marmara', tax: 0.1, ytd: 500000 },
  { id: 2, name: 'Coastal', city: 'Izmir', state: 'IZ', region: 'Ege', tax: 0.08, ytd: 120000 },
]

beforeEach(() => {
  shopApi.warehouses.list.mockResolvedValue({ content: WAREHOUSES, total: 2, page: 0, size: 20 })
  shopApi.warehouses.create.mockResolvedValue({ id: 3 })
  shopApi.warehouses.update.mockResolvedValue({})
  shopApi.warehouses.remove.mockResolvedValue(undefined)
})

test('lists the warehouses with their tax rate and year-to-date sales', async () => {
  renderWithProviders(<WarehousesPage />)

  const row = (await screen.findByText('Central')).closest('tr')
  expect(within(row).getByText('10%')).toBeInTheDocument()
  expect(within(row).getByText(/500,000/)).toBeInTheDocument()
})

test('the search box is at the top left and the create button at the top right', async () => {
  renderWithProviders(<WarehousesPage />)
  await screen.findByText('Central')

  const toolbar = document.querySelector('.data-table-toolbar')
  expect(toolbar.firstElementChild).toHaveClass('search-box')
  expect(toolbar.lastElementChild).toContainElement(screen.getByRole('button', { name: 'Create warehouse' }))
})

test('clicking the name header sorts the warehouses on the server', async () => {
  renderWithProviders(<WarehousesPage />)
  await screen.findByText('Central')

  fireEvent.click(screen.getByRole('button', { name: 'Name' }))

  await waitFor(() =>
    expect(shopApi.warehouses.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort: { key: 'name', direction: 'asc' } }),
    ),
  )
})

test('a name longer than 10 characters is refused before the request', async () => {
  renderWithProviders(<WarehousesPage />)
  await screen.findByText('Central')

  fireEvent.click(screen.getByRole('button', { name: 'Create warehouse' }))
  const dialog = await screen.findByRole('dialog', { name: 'New warehouse' })
  fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: 'Very long name' } })
  fireEvent.change(within(dialog).getByLabelText('City'), { target: { value: 'Ankara' } })
  fireEvent.change(within(dialog).getByLabelText('Region'), { target: { value: 'Ic Anadolu' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }))

  expect(await within(dialog).findByText('Use at most 10 characters.')).toBeInTheDocument()
  expect(shopApi.warehouses.create).not.toHaveBeenCalled()
})

test('creating a warehouse sends the trimmed name, city and region', async () => {
  renderWithProviders(<WarehousesPage />)
  await screen.findByText('Central')

  fireEvent.click(screen.getByRole('button', { name: 'Create warehouse' }))
  const dialog = await screen.findByRole('dialog', { name: 'New warehouse' })
  fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: ' Kadikoy ' } })
  fireEvent.change(within(dialog).getByLabelText('City'), { target: { value: 'Istanbul' } })
  fireEvent.change(within(dialog).getByLabelText('Region'), { target: { value: 'Marmara' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }))

  await waitFor(() =>
    expect(shopApi.warehouses.create).toHaveBeenCalledWith({ name: 'Kadikoy', city: 'Istanbul', region: 'Marmara' }),
  )
})

test('deleting a warehouse that still has customers shows the clear conflict message', async () => {
  shopApi.warehouses.remove.mockRejectedValue(
    Object.assign(new Error('Conflict'), {
      response: { status: 409, data: { detail: 'Warehouse 2 has customers or orders and cannot be deleted' } },
    }),
  )
  renderWithProviders(
    <>
      <WarehousesPage />
      <Toasts />
    </>,
  )
  const row = (await screen.findByText('Coastal')).closest('tr')

  fireEvent.click(within(row).getByRole('button', { name: 'Delete warehouse' }))
  const dialog = await screen.findByRole('dialog', { name: 'Delete record' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

  await waitFor(() => expect(shopApi.warehouses.remove).toHaveBeenCalledWith(2))
  expect(
    await screen.findByText('This warehouse still has customers or orders, so it cannot be deleted.'),
  ).toBeInTheDocument()
  expect(screen.queryByRole('dialog', { name: 'Delete record' })).not.toBeInTheDocument()
})

test('analysts see the warehouses without any change actions', async () => {
  renderWithProviders(<WarehousesPage />, { user: ANALYST_USER })
  await screen.findByText('Central')

  expect(screen.queryByRole('button', { name: 'Create warehouse' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Edit warehouse' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Delete warehouse' })).not.toBeInTheDocument()
})
