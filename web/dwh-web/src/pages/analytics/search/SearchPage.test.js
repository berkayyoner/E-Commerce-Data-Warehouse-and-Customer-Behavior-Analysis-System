import { fireEvent, screen, waitFor, within } from '@testing-library/react'

import { searchProducts, suggestProducts } from '../../../api/searchApi'
import { ADMIN_USER, renderWithProviders } from '../../../test-utils'
import SearchPage from './SearchPage'

jest.mock('../../../api/searchApi', () => ({
  searchProducts: jest.fn(),
  suggestProducts: jest.fn(),
}))

const HITS = [
  {
    id: 10,
    name: 'Laptop Pro 14',
    price: 1299,
    category: 'Electronics',
    categoryLabel: 'Electronics',
    brand: 'Acme',
    score: 2.1,
  },
  {
    id: 11,
    name: 'Desk Lamp',
    price: 89.5,
    category: 'Home and Kitchen',
    categoryLabel: 'Home and Kitchen',
    brand: 'Lumo',
    score: 1.2,
  },
]

function resultPage(overrides = {}) {
  return {
    content: HITS,
    total: 2,
    page: 0,
    size: 20,
    facets: {
      categories: [
        { value: 'Electronics', count: 1 },
        { value: 'Home and Kitchen', count: 1 },
      ],
      brands: [
        { value: 'Acme', count: 1 },
        { value: 'Lumo', count: 1 },
      ],
      price: { min: 89.5, max: 1299 },
    },
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  searchProducts.mockResolvedValue(resultPage())
  suggestProducts.mockResolvedValue([
    { text: 'Laptop Pro 14', type: 'PRODUCT' },
    { text: 'Laptops', type: 'CATEGORY' },
  ])
})

test('the page lists the products of the first search with localized category labels and prices', async () => {
  renderWithProviders(<SearchPage />, { user: ADMIN_USER })

  const list = await screen.findByRole('list', { name: 'Products' })
  expect(within(list).getByText('Laptop Pro 14')).toBeInTheDocument()
  expect(within(list).getByText('TRY 1,299.00')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('2 products found')
  expect(searchProducts).toHaveBeenCalledWith(expect.objectContaining({ query: '', language: 'en', page: 0 }))
})

test('the typeahead waits for the typing to pause, then moves with the arrow keys and runs the chosen suggestion', async () => {
  renderWithProviders(<SearchPage />, { user: ADMIN_USER })
  await screen.findByRole('list', { name: 'Products' })
  const box = screen.getByRole('combobox', { name: 'Search products' })

  fireEvent.change(box, { target: { value: 'Lap' } })

  expect(await screen.findByRole('listbox', { name: 'Suggestions' })).toBeInTheDocument()
  expect(suggestProducts).toHaveBeenCalledWith(expect.objectContaining({ query: 'Lap', language: 'en' }))

  fireEvent.keyDown(box, { key: 'ArrowDown' })
  fireEvent.keyDown(box, { key: 'ArrowDown' })
  expect(screen.getByRole('option', { name: /Laptops/ })).toHaveAttribute('aria-selected', 'true')
  expect(box).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-1$/))

  fireEvent.keyDown(box, { key: 'ArrowUp' })
  fireEvent.keyDown(box, { key: 'Enter' })

  await waitFor(() => expect(searchProducts).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'Laptop Pro 14' })))
  expect(box).toHaveValue('Laptop Pro 14')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

test('Escape closes the suggestion list without running a search', async () => {
  renderWithProviders(<SearchPage />, { user: ADMIN_USER })
  await screen.findByRole('list', { name: 'Products' })
  const box = screen.getByRole('combobox', { name: 'Search products' })
  fireEvent.change(box, { target: { value: 'La' } })
  await screen.findByRole('listbox')
  const searches = searchProducts.mock.calls.length

  fireEvent.keyDown(box, { key: 'Escape' })

  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  expect(searchProducts.mock.calls.length).toBe(searches)
})

test('a search runs with the typed text when the form is submitted', async () => {
  renderWithProviders(<SearchPage />, { user: ADMIN_USER })
  await screen.findByRole('list', { name: 'Products' })

  fireEvent.change(screen.getByRole('combobox', { name: 'Search products' }), { target: { value: '  lamp ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Search' }))

  await waitFor(() => expect(searchProducts).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'lamp' })))
})

test('the category facet is sent as a comma-separated list and the brand facet as one value', async () => {
  renderWithProviders(<SearchPage />, { user: ADMIN_USER })
  await screen.findByRole('list', { name: 'Products' })

  fireEvent.click(screen.getByRole('checkbox', { name: /Electronics/ }))
  await waitFor(() =>
    expect(searchProducts).toHaveBeenLastCalledWith(expect.objectContaining({ categories: ['Electronics'], page: 0 })),
  )

  fireEvent.click(screen.getByRole('checkbox', { name: /Home and Kitchen/ }))
  await waitFor(() =>
    expect(searchProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ categories: ['Electronics', 'Home and Kitchen'] }),
    ),
  )

  fireEvent.click(screen.getByRole('button', { name: /Acme/ }))
  await waitFor(() => expect(searchProducts).toHaveBeenLastCalledWith(expect.objectContaining({ brand: 'Acme' })))
  expect(screen.getByRole('button', { name: /Acme/ })).toHaveAttribute('aria-pressed', 'true')
})

test('a valid price range is applied and an inverted one is refused with a message', async () => {
  renderWithProviders(<SearchPage />, { user: ADMIN_USER })
  await screen.findByRole('list', { name: 'Products' })

  fireEvent.change(screen.getByLabelText('Minimum'), { target: { value: '500' } })
  fireEvent.change(screen.getByLabelText('Maximum'), { target: { value: '100' } })
  fireEvent.click(screen.getByRole('button', { name: 'Apply price' }))

  expect(screen.getByText('The minimum price must not be higher than the maximum.')).toBeInTheDocument()
  expect(searchProducts.mock.calls.some(([request]) => request.minPrice === 500)).toBe(false)

  fireEvent.change(screen.getByLabelText('Maximum'), { target: { value: '2000' } })
  fireEvent.click(screen.getByRole('button', { name: 'Apply price' }))

  await waitFor(() =>
    expect(searchProducts).toHaveBeenLastCalledWith(expect.objectContaining({ minPrice: 500, maxPrice: 2000 })),
  )
})

test('the sort choice is sent to the service and a new sort returns to the first page', async () => {
  renderWithProviders(<SearchPage />, { user: ADMIN_USER })
  await screen.findByRole('list', { name: 'Products' })

  fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'priceAsc' } })

  await waitFor(() => expect(searchProducts).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'priceAsc', page: 0 })))
})

test('the language of the page is sent as the language of the search', async () => {
  renderWithProviders(<SearchPage />, { user: ADMIN_USER, language: 'tr' })

  await screen.findByRole('list', { name: 'Ürünler' })
  expect(searchProducts).toHaveBeenCalledWith(expect.objectContaining({ language: 'tr' }))
  expect(screen.getByText('2 ürün bulundu')).toBeInTheDocument()
})

test('a search without matches shows the empty message', async () => {
  searchProducts.mockResolvedValue(resultPage({ content: [], total: 0 }))
  renderWithProviders(<SearchPage />, { user: ADMIN_USER })

  expect(
    await screen.findByText('No products match your search. Try other words or clear the filters.'),
  ).toBeInTheDocument()
  expect(screen.queryByRole('navigation', { name: 'Result pages' })).not.toBeInTheDocument()
})

test('a failed search shows an error with a retry button that asks again', async () => {
  searchProducts.mockRejectedValueOnce(new Error('shop unavailable'))
  renderWithProviders(<SearchPage />, { user: ADMIN_USER })

  expect(await screen.findByText('The products could not be loaded.')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

  expect(await screen.findByRole('list', { name: 'Products' })).toBeInTheDocument()
  expect(searchProducts).toHaveBeenCalledTimes(2)
})

test('the next page is requested and the page number is shown', async () => {
  searchProducts.mockResolvedValue(resultPage({ total: 45 }))
  renderWithProviders(<SearchPage />, { user: ADMIN_USER })
  await screen.findByRole('list', { name: 'Products' })

  expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()

  fireEvent.click(screen.getByRole('button', { name: 'Next' }))

  await waitFor(() => expect(searchProducts).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })))
  expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
})
