import { fireEvent, screen, waitFor, within } from '@testing-library/react'

import { searchApi, shopApi } from '../../api/resources'
import Toasts from '../../components/ui/Toasts'
import { ANALYST_USER, renderWithProviders } from '../../test-utils'
import ProductsPage from './ProductsPage'

jest.mock('../../api/resources', () => ({
  shopApi: {
    products: { list: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
  },
  searchApi: {
    products: jest.fn(),
    suggest: jest.fn(),
    startReindex: jest.fn(),
    reindexStatus: jest.fn(),
  },
}))

const PRODUCTS = [
  { id: 101, name: 'Kettle', price: 19.9, category: 'Kitchen', brand: 'Brewmaster' },
  { id: 102, name: 'Blender', price: 89, category: 'Kitchen', brand: 'Mixwell' },
]

const EMPTY_SEARCH = { content: [], total: 0, page: 0, size: 12, facets: { categories: [], brands: [], price: {} } }

beforeEach(() => {
  shopApi.products.list.mockResolvedValue({ content: PRODUCTS, total: 2, page: 0, size: 20 })
  shopApi.products.create.mockResolvedValue({ id: 103 })
  shopApi.products.update.mockResolvedValue({})
  shopApi.products.remove.mockResolvedValue(undefined)
  searchApi.products.mockResolvedValue(EMPTY_SEARCH)
  searchApi.suggest.mockResolvedValue([])
})

test('the catalog starts selected and lists the products with their price', async () => {
  renderWithProviders(<ProductsPage />)

  expect(await screen.findByText('Kettle')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Catalog' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'Smart search' })).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByText('Brewmaster')).toBeInTheDocument()
})

test('the segmented control switches to the smart search and back', async () => {
  renderWithProviders(<ProductsPage />)
  await screen.findByText('Kettle')

  fireEvent.click(screen.getByRole('button', { name: 'Smart search' }))
  expect(screen.getByRole('button', { name: 'Smart search' })).toHaveAttribute('aria-pressed', 'true')
  expect(await screen.findByRole('combobox', { name: 'Search products, categories or brands' })).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Catalog' }))
  expect(await screen.findByText('Kettle')).toBeInTheDocument()
})

test('the catalog search box is top left and the create button top right', async () => {
  renderWithProviders(<ProductsPage />)
  await screen.findByText('Kettle')

  const toolbar = document.querySelector('.data-table-toolbar')
  expect(toolbar.firstElementChild).toHaveClass('search-box')
  expect(toolbar.lastElementChild).toContainElement(screen.getByRole('button', { name: 'Create product' }))
})

test('sorting by price asks the server for the price order', async () => {
  renderWithProviders(<ProductsPage />)
  await screen.findByText('Kettle')

  fireEvent.click(screen.getByRole('button', { name: 'Price' }))

  await waitFor(() =>
    expect(shopApi.products.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort: { key: 'price', direction: 'asc' } }),
    ),
  )
})

test('the create form reports the four required fields and sends nothing', async () => {
  renderWithProviders(<ProductsPage />)
  await screen.findByText('Kettle')

  fireEvent.click(screen.getByRole('button', { name: 'Create product' }))
  const dialog = await screen.findByRole('dialog', { name: 'New product' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }))

  expect(await within(dialog).findAllByText('This field is required.')).toHaveLength(4)
  expect(shopApi.products.create).not.toHaveBeenCalled()
})

test('a price with three decimals or above 999.99 is refused', async () => {
  renderWithProviders(<ProductsPage />)
  await screen.findByText('Kettle')

  fireEvent.click(screen.getByRole('button', { name: 'Create product' }))
  const dialog = await screen.findByRole('dialog', { name: 'New product' })
  fireEvent.change(within(dialog).getByLabelText('Price'), { target: { value: '1000' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }))

  expect(
    await within(dialog).findByText('Enter a price from 0.01 to 999.99 with at most two decimals.'),
  ).toBeInTheDocument()
  expect(shopApi.products.create).not.toHaveBeenCalled()
})

test('creating a product sends the price as a number and the trimmed texts', async () => {
  renderWithProviders(<ProductsPage />)
  await screen.findByText('Kettle')

  fireEvent.click(screen.getByRole('button', { name: 'Create product' }))
  const dialog = await screen.findByRole('dialog', { name: 'New product' })
  fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: ' Toaster ' } })
  fireEvent.change(within(dialog).getByLabelText('Price'), { target: { value: '19.9' } })
  fireEvent.change(within(dialog).getByLabelText('Category'), { target: { value: 'Kitchen' } })
  fireEvent.change(within(dialog).getByLabelText('Brand'), { target: { value: 'Mixwell' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }))

  await waitFor(() =>
    expect(shopApi.products.create).toHaveBeenCalledWith({
      name: 'Toaster',
      price: 19.9,
      category: 'Kitchen',
      brand: 'Mixwell',
    }),
  )
})

test('editing opens the form filled with the product and saves the change', async () => {
  renderWithProviders(<ProductsPage />)
  const row = (await screen.findByText('Blender')).closest('tr')

  fireEvent.click(within(row).getByRole('button', { name: 'Edit product' }))
  const dialog = await screen.findByRole('dialog', { name: 'Edit product' })
  expect(within(dialog).getByLabelText('Name')).toHaveValue('Blender')
  fireEvent.change(within(dialog).getByLabelText('Price'), { target: { value: '79.5' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  await waitFor(() =>
    expect(shopApi.products.update).toHaveBeenCalledWith(102, {
      name: 'Blender',
      price: 79.5,
      category: 'Kitchen',
      brand: 'Mixwell',
    }),
  )
})

test('deleting a product that is in orders shows the clear conflict message', async () => {
  shopApi.products.remove.mockRejectedValue(
    Object.assign(new Error('Conflict'), { response: { status: 409, data: { detail: 'Product 101 appears' } } }),
  )
  renderWithProviders(
    <>
      <ProductsPage />
      <Toasts />
    </>,
  )
  const row = (await screen.findByText('Kettle')).closest('tr')

  fireEvent.click(within(row).getByRole('button', { name: 'Delete product' }))
  const dialog = await screen.findByRole('dialog', { name: 'Delete record' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

  await waitFor(() => expect(shopApi.products.remove).toHaveBeenCalledWith(101))
  expect(
    await screen.findByText('This product appears in orders, so it cannot be deleted.'),
  ).toBeInTheDocument()
})

test('deleting an unused product asks for confirmation and then reloads the list', async () => {
  renderWithProviders(<ProductsPage />)
  const row = (await screen.findByText('Kettle')).closest('tr')

  fireEvent.click(within(row).getByRole('button', { name: 'Delete product' }))
  const dialog = await screen.findByRole('dialog', { name: 'Delete record' })
  expect(shopApi.products.remove).not.toHaveBeenCalled()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

  await waitFor(() => expect(shopApi.products.remove).toHaveBeenCalledWith(101))
  await waitFor(() => expect(shopApi.products.list).toHaveBeenCalledTimes(2))
})

test('analysts see the catalog without create, edit or delete actions', async () => {
  renderWithProviders(<ProductsPage />, { user: ANALYST_USER })
  await screen.findByText('Kettle')

  expect(screen.queryByRole('button', { name: 'Create product' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Edit product' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Delete product' })).not.toBeInTheDocument()
})
