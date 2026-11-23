import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'

import { searchApi } from '../../api/resources'
import { ANALYST_USER, renderWithProviders } from '../../test-utils'
import SmartSearchView from './SmartSearchView'

jest.mock('../../api/resources', () => ({
  searchApi: {
    products: jest.fn(),
    suggest: jest.fn(),
    startReindex: jest.fn(),
    reindexStatus: jest.fn(),
  },
}))

const HITS = [
  {
    id: 1,
    name: 'Oak Chair',
    price: 120,
    category: 'Furniture',
    categoryLabel: 'Mobilya',
    brand: 'Nordic',
    score: 7.4312,
  },
  {
    id: 2,
    name: 'Desk Lamp',
    price: 45.5,
    category: 'Decor',
    categoryLabel: 'Dekorasyon',
    brand: 'Lumen',
    score: 3.1,
  },
]

const RESULT = {
  content: HITS,
  total: 2,
  page: 0,
  size: 12,
  facets: {
    categories: [
      { value: 'Furniture', count: 2 },
      { value: 'Decor', count: 1 },
    ],
    brands: [
      { value: 'Nordic', count: 1 },
      { value: 'Lumen', count: 1 },
    ],
    price: { min: 45.5, max: 120 },
  },
}

const SUGGESTIONS = [
  { text: 'Oak Chair', type: 'PRODUCT' },
  { text: 'Furniture', type: 'CATEGORY' },
]

beforeEach(() => {
  searchApi.products.mockResolvedValue(RESULT)
  searchApi.suggest.mockResolvedValue(SUGGESTIONS)
})

afterEach(() => {
  jest.useRealTimers()
})

function lastSearchParams() {
  return searchApi.products.mock.calls[searchApi.products.mock.calls.length - 1][0]
}

test('results show the localized category, the price and the relevance score', async () => {
  renderWithProviders(<SmartSearchView />)

  expect(await screen.findByText('Oak Chair')).toBeInTheDocument()
  expect(screen.getByText('Mobilya')).toBeInTheDocument()
  expect(screen.getByText('7.43')).toBeInTheDocument()
  expect(screen.getByText('2 products found')).toBeInTheDocument()
  expect(searchApi.products).toHaveBeenCalledWith(expect.objectContaining({ q: '', lang: 'en', page: 0 }))
})

test('the language of the console is the language of the search', async () => {
  renderWithProviders(<SmartSearchView />, { language: 'tr' })
  await screen.findByText('Oak Chair')

  expect(lastSearchParams()).toEqual(expect.objectContaining({ lang: 'tr' }))
  fireEvent.change(screen.getByRole('combobox', { name: 'Ürün, kategori veya marka ara' }), {
    target: { value: 'masa' },
  })
  await waitFor(() => expect(searchApi.suggest).toHaveBeenLastCalledWith({ q: 'masa', lang: 'tr', size: 8 }))
})

test('typing shows suggestions after a short pause, each with its type', async () => {
  renderWithProviders(<SmartSearchView />)
  await screen.findByText('Oak Chair')

  fireEvent.change(screen.getByRole('combobox', { name: 'Search products, categories or brands' }), {
    target: { value: 'oak' },
  })

  const listbox = await screen.findByRole('listbox', { name: 'Suggestions' })
  expect(within(listbox).getAllByRole('option')).toHaveLength(2)
  expect(within(listbox).getByText('Product')).toBeInTheDocument()
  expect(within(listbox).getByText('Category')).toBeInTheDocument()
  expect(searchApi.suggest).toHaveBeenCalledWith({ q: 'oak', lang: 'en', size: 8 })
})

test('the arrow keys move the highlight and Enter searches for the highlighted suggestion', async () => {
  renderWithProviders(<SmartSearchView />)
  await screen.findByText('Oak Chair')
  const input = screen.getByRole('combobox', { name: 'Search products, categories or brands' })

  fireEvent.change(input, { target: { value: 'oak' } })
  const options = within(await screen.findByRole('listbox')).getAllByRole('option')

  fireEvent.keyDown(input, { key: 'ArrowDown' })
  expect(input).toHaveAttribute('aria-activedescendant', options[0].id)
  expect(options[0]).toHaveAttribute('aria-selected', 'true')

  fireEvent.keyDown(input, { key: 'ArrowDown' })
  expect(input).toHaveAttribute('aria-activedescendant', options[1].id)

  fireEvent.keyDown(input, { key: 'ArrowUp' })
  expect(input).toHaveAttribute('aria-activedescendant', options[0].id)

  fireEvent.keyDown(input, { key: 'ArrowDown' })
  fireEvent.keyDown(input, { key: 'ArrowDown' })
  expect(input).toHaveAttribute('aria-activedescendant', options[0].id)

  fireEvent.keyDown(input, { key: 'ArrowDown' })
  fireEvent.keyDown(input, { key: 'Enter' })

  await waitFor(() => expect(lastSearchParams()).toEqual(expect.objectContaining({ q: 'Furniture', page: 0 })))
  expect(input).toHaveValue('Furniture')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

test('Escape closes the suggestions and keeps the typed text', async () => {
  renderWithProviders(<SmartSearchView />)
  await screen.findByText('Oak Chair')
  const input = screen.getByRole('combobox', { name: 'Search products, categories or brands' })

  fireEvent.change(input, { target: { value: 'oak' } })
  await screen.findByRole('listbox')
  fireEvent.keyDown(input, { key: 'Escape' })

  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  expect(input).toHaveValue('oak')
})

test('submitting the search box searches for the typed text', async () => {
  renderWithProviders(<SmartSearchView />)
  await screen.findByText('Oak Chair')

  fireEvent.change(screen.getByRole('combobox', { name: 'Search products, categories or brands' }), { target: { value: 'lamp' } })
  fireEvent.click(screen.getByRole('button', { name: 'Search' }))

  await waitFor(() => expect(lastSearchParams()).toEqual(expect.objectContaining({ q: 'lamp' })))
})

test('checking category facets sends them as one comma-separated filter', async () => {
  renderWithProviders(<SmartSearchView />)
  await screen.findByText('Oak Chair')

  fireEvent.click(screen.getByRole('checkbox', { name: /Furniture/ }))
  await waitFor(() => expect(lastSearchParams()).toEqual(expect.objectContaining({ category: 'Furniture' })))

  fireEvent.click(screen.getByRole('checkbox', { name: /Decor/ }))
  await waitFor(() => expect(lastSearchParams()).toEqual(expect.objectContaining({ category: 'Furniture,Decor' })))

  fireEvent.click(screen.getByRole('checkbox', { name: /Furniture/ }))
  await waitFor(() => expect(lastSearchParams()).toEqual(expect.objectContaining({ category: 'Decor' })))
})

test('a brand replaces the brand chosen before, because the service takes one brand', async () => {
  renderWithProviders(<SmartSearchView />)
  await screen.findByText('Oak Chair')

  fireEvent.click(screen.getByRole('checkbox', { name: /Nordic/ }))
  await waitFor(() => expect(lastSearchParams()).toEqual(expect.objectContaining({ brand: 'Nordic' })))

  fireEvent.click(screen.getByRole('checkbox', { name: /Lumen/ }))
  await waitFor(() => expect(lastSearchParams()).toEqual(expect.objectContaining({ brand: 'Lumen' })))
  expect(screen.getByRole('checkbox', { name: /Nordic/ })).not.toBeChecked()
  expect(lastSearchParams().brand).toBe('Lumen')
})

test('the price range is sent, and a lowest price above the highest is refused without a search', async () => {
  renderWithProviders(<SmartSearchView />)
  await screen.findByText('Oak Chair')

  fireEvent.change(screen.getByLabelText('Lowest price'), { target: { value: '50' } })
  await waitFor(() => expect(lastSearchParams()).toEqual(expect.objectContaining({ minPrice: '50' })))

  const calls = searchApi.products.mock.calls.length
  fireEvent.change(screen.getByLabelText('Highest price'), { target: { value: '10' } })

  expect(screen.getByRole('alert')).toHaveTextContent('The lowest price cannot be higher than the highest price.')
  expect(searchApi.products).toHaveBeenCalledTimes(calls)
})

test('sorting by name or by price changes the sort sent to the service', async () => {
  renderWithProviders(<SmartSearchView />)
  await screen.findByText('Oak Chair')

  fireEvent.click(screen.getByRole('button', { name: 'Price' }))
  await waitFor(() => expect(lastSearchParams()).toEqual(expect.objectContaining({ sort: 'priceAsc' })))

  fireEvent.click(screen.getByRole('button', { name: 'Price' }))
  await waitFor(() => expect(lastSearchParams()).toEqual(expect.objectContaining({ sort: 'priceDesc' })))

  fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'nameAsc' } })
  await waitFor(() => expect(lastSearchParams()).toEqual(expect.objectContaining({ sort: 'nameAsc', page: 0 })))
})

test('the next page is requested with the page number', async () => {
  searchApi.products.mockResolvedValue({ ...RESULT, total: 30 })
  renderWithProviders(<SmartSearchView />)
  await screen.findByText('Oak Chair')

  fireEvent.click(screen.getByRole('button', { name: 'Next' }))

  await waitFor(() => expect(lastSearchParams()).toEqual(expect.objectContaining({ page: 1 })))
  expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
})

test('an empty answer says that no product matches', async () => {
  searchApi.products.mockResolvedValue({ ...RESULT, content: [], total: 0 })
  renderWithProviders(<SmartSearchView />)

  expect(await screen.findByText('No products match these filters.')).toBeInTheDocument()
})

test('a failed search offers a retry that asks the service again', async () => {
  searchApi.products.mockRejectedValueOnce(new Error('search down')).mockResolvedValueOnce(RESULT)
  renderWithProviders(<SmartSearchView />)

  const alert = await screen.findByRole('alert')
  fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }))

  expect(await screen.findByText('Oak Chair')).toBeInTheDocument()
  expect(searchApi.products).toHaveBeenCalledTimes(2)
})

test('administrators rebuild the index and see its progress until it succeeds', async () => {
  jest.useFakeTimers()
  searchApi.startReindex.mockResolvedValue({ state: 'RUNNING', indexed: 0, total: 500 })
  searchApi.reindexStatus
    .mockResolvedValueOnce({ state: 'RUNNING', indexed: 200, total: 500 })
    .mockResolvedValueOnce({ state: 'SUCCESS', indexed: 500, total: 500 })
  renderWithProviders(<SmartSearchView />)
  await act(async () => {})

  fireEvent.click(screen.getByRole('button', { name: 'Rebuild search index' }))
  await act(async () => {})
  expect(screen.getByRole('status')).toHaveTextContent('Indexed 0 of 500 products.')
  expect(screen.getByRole('button', { name: 'Rebuild search index' })).toBeDisabled()

  await act(async () => {
    jest.advanceTimersByTime(2000)
  })
  expect(screen.getByRole('status')).toHaveTextContent('Indexed 200 of 500 products.')

  await act(async () => {
    jest.advanceTimersByTime(2000)
  })
  expect(screen.getByRole('status')).toHaveTextContent('The search index was rebuilt with 500 products.')
  expect(searchApi.reindexStatus).toHaveBeenCalledTimes(2)
  expect(screen.getByRole('button', { name: 'Rebuild search index' })).toBeEnabled()
})

test('a failed reindex is reported as a failure', async () => {
  jest.useFakeTimers()
  searchApi.startReindex.mockResolvedValue({ state: 'RUNNING', indexed: 0, total: 500 })
  searchApi.reindexStatus.mockResolvedValueOnce({ state: 'FAILED', indexed: 10, total: 500 })
  renderWithProviders(<SmartSearchView />)
  await act(async () => {})

  fireEvent.click(screen.getByRole('button', { name: 'Rebuild search index' }))
  await act(async () => {})
  await act(async () => {
    jest.advanceTimersByTime(2000)
  })

  expect(screen.getByRole('status')).toHaveTextContent('The search index could not be rebuilt.')
})

test('analysts search and filter but cannot rebuild the index', async () => {
  renderWithProviders(<SmartSearchView />, { user: ANALYST_USER })

  expect(await screen.findByText('Oak Chair')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Rebuild search index' })).not.toBeInTheDocument()
  expect(searchApi.startReindex).not.toHaveBeenCalled()
})
