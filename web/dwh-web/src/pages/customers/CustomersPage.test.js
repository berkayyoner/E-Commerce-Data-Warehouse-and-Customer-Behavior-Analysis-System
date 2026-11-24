import { fireEvent, screen, waitFor, within } from '@testing-library/react'

import { shopApi } from '../../api/resources'
import { ANALYST_USER, renderWithProviders } from '../../test-utils'
import CustomersPage from './CustomersPage'

jest.mock('../../api/resources', () => ({
  shopApi: {
    customers: { list: jest.fn(), create: jest.fn(), update: jest.fn() },
    warehouses: { list: jest.fn() },
  },
}))

const CUSTOMERS = [
  {
    warehouseId: 1,
    districtId: 3,
    customerId: 120,
    firstName: 'Ayse',
    lastName: 'Demir',
    email: 'ayse@example.test',
    city: 'Istanbul',
    state: 'IS',
    region: 'Marmara',
    since: '2026-10-01',
    credit: 'GC',
    creditLimit: 5000,
    balance: 1500,
    discount: 0.1,
  },
  {
    warehouseId: 2,
    districtId: 7,
    customerId: 4,
    firstName: 'Mehmet',
    lastName: 'Kaya',
    email: 'mehmet@example.test',
    city: 'Ankara',
    state: 'AN',
    region: 'Ic Anadolu',
    since: '2026-09-15',
    credit: 'BC',
    creditLimit: 2000,
    balance: -20,
    discount: 0.02,
  },
]

const WAREHOUSES = [
  { id: 1, name: 'Central', city: 'Istanbul', state: 'IS', region: 'Marmara', tax: 0.1, ytd: 500000 },
  { id: 2, name: 'Coastal', city: 'Izmir', state: 'IZ', region: 'Ege', tax: 0.08, ytd: 120000 },
]

beforeEach(() => {
  shopApi.customers.list.mockResolvedValue({ content: CUSTOMERS, total: 2, page: 0, size: 20 })
  shopApi.customers.create.mockResolvedValue({})
  shopApi.customers.update.mockResolvedValue({})
  shopApi.warehouses.list.mockResolvedValue({ content: WAREHOUSES, total: 2, page: 0, size: 100 })
})

function fillCustomerForm(dialog, values) {
  fireEvent.change(within(dialog).getByLabelText('Warehouse'), { target: { value: values.warehouseId } })
  fireEvent.change(within(dialog).getByLabelText('District (1 to 10)'), { target: { value: values.districtId } })
  fireEvent.change(within(dialog).getByLabelText('First name'), { target: { value: values.firstName } })
  fireEvent.change(within(dialog).getByLabelText('Last name'), { target: { value: values.lastName } })
  fireEvent.change(within(dialog).getByLabelText('E-mail'), { target: { value: values.email } })
  fireEvent.change(within(dialog).getByLabelText('City'), { target: { value: values.city } })
  fireEvent.change(within(dialog).getByLabelText('Region'), { target: { value: values.region } })
}

test('lists customers under their warehouse-district-customer identifier', async () => {
  renderWithProviders(<CustomersPage />)

  expect(await screen.findByText('1-3-120')).toBeInTheDocument()
  expect(screen.getByText('2-7-4')).toBeInTheDocument()
  expect(screen.getByText('Ayse')).toBeInTheDocument()
  expect(screen.getByText('ayse@example.test')).toBeInTheDocument()
})

test('the search box sits at the top left of the table and the create button at the top right', async () => {
  renderWithProviders(<CustomersPage />)
  await screen.findByText('1-3-120')

  const toolbar = document.querySelector('.data-table-toolbar')
  expect(toolbar.firstElementChild).toHaveClass('search-box')
  expect(toolbar.querySelector('.search-box svg')).toBeInTheDocument()
  expect(toolbar.lastElementChild).toContainElement(screen.getByRole('button', { name: 'Create customer' }))
})

test('clicking a column header asks the server for the sorted list', async () => {
  renderWithProviders(<CustomersPage />)
  await screen.findByText('Ayse')

  fireEvent.click(screen.getByRole('button', { name: 'First name' }))

  await waitFor(() =>
    expect(shopApi.customers.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort: { key: 'firstName', direction: 'asc' } }),
    ),
  )
})

test('the search text is sent to the server after the typing pauses', async () => {
  renderWithProviders(<CustomersPage />)
  await screen.findByText('Ayse')

  fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'ankara' } })

  await waitFor(() =>
    expect(shopApi.customers.list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'ankara', page: 0 })),
  )
})

test('choosing a warehouse filters the customers on the server', async () => {
  renderWithProviders(<CustomersPage />)
  await screen.findByText('Ayse')
  const filter = await screen.findByLabelText('Warehouse', { selector: '.filter-bar select' })

  fireEvent.change(filter, { target: { value: '2' } })

  await waitFor(() =>
    expect(shopApi.customers.list).toHaveBeenLastCalledWith(expect.objectContaining({ warehouseId: '2' })),
  )
})

test('the create form reports every required field and sends nothing', async () => {
  renderWithProviders(<CustomersPage />)
  await screen.findByText('Ayse')

  fireEvent.click(screen.getByRole('button', { name: 'Create customer' }))
  const dialog = await screen.findByRole('dialog', { name: 'New customer' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }))

  expect(await within(dialog).findAllByText('This field is required.')).toHaveLength(7)
  expect(shopApi.customers.create).not.toHaveBeenCalled()
})

test('a district outside 1 to 10 is refused with its own message', async () => {
  renderWithProviders(<CustomersPage />)
  await screen.findByText('Ayse')

  fireEvent.click(screen.getByRole('button', { name: 'Create customer' }))
  const dialog = await screen.findByRole('dialog', { name: 'New customer' })
  fillCustomerForm(dialog, {
    warehouseId: '1',
    districtId: '11',
    firstName: 'Ayse',
    lastName: 'Demir',
    email: 'ayse@example.test',
    city: 'Istanbul',
    region: 'Marmara',
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }))

  expect(await within(dialog).findByText('Use a district number from 1 to 10.')).toBeInTheDocument()
  expect(shopApi.customers.create).not.toHaveBeenCalled()
})

test('creating a customer sends the warehouse, district and trimmed details', async () => {
  renderWithProviders(<CustomersPage />)
  await screen.findByText('Ayse')

  fireEvent.click(screen.getByRole('button', { name: 'Create customer' }))
  const dialog = await screen.findByRole('dialog', { name: 'New customer' })
  await within(dialog).findByRole('option', { name: 'Coastal' })
  fillCustomerForm(dialog, {
    warehouseId: '2',
    districtId: '5',
    firstName: ' Zeynep ',
    lastName: 'Arslan',
    email: 'zeynep@example.test',
    city: 'Izmir',
    region: 'Ege',
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }))

  await waitFor(() =>
    expect(shopApi.customers.create).toHaveBeenCalledWith({
      warehouseId: 2,
      districtId: 5,
      firstName: 'Zeynep',
      lastName: 'Arslan',
      email: 'zeynep@example.test',
      city: 'Izmir',
      region: 'Ege',
    }),
  )
})

test('editing keeps the key and sends only the editable details', async () => {
  renderWithProviders(<CustomersPage />)
  const row = (await screen.findByText('Ayse')).closest('tr')

  fireEvent.click(within(row).getByRole('button', { name: 'Edit customer' }))
  const dialog = await screen.findByRole('dialog', { name: 'Edit customer' })
  expect(within(dialog).getByLabelText('District (1 to 10)')).toBeDisabled()
  fireEvent.change(within(dialog).getByLabelText('City'), { target: { value: 'Izmir' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  await waitFor(() =>
    expect(shopApi.customers.update).toHaveBeenCalledWith(
      expect.objectContaining({ warehouseId: 1, districtId: 3, customerId: 120 }),
      { firstName: 'Ayse', lastName: 'Demir', email: 'ayse@example.test', city: 'Izmir', region: 'Marmara' },
    ),
  )
})

test('analysts read the customers but see no create or edit actions', async () => {
  renderWithProviders(<CustomersPage />, { user: ANALYST_USER })
  await screen.findByText('Ayse')

  expect(screen.queryByRole('button', { name: 'Create customer' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Edit customer' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
})
