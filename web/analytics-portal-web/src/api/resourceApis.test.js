import { analyticsApi, rangeParams } from './analyticsApi'
import { apiClients } from './httpClient'
import { searchProducts, suggestProducts } from './searchApi'

afterEach(() => {
  jest.restoreAllMocks()
})

test('the date range becomes query parameters and empty bounds are left out', () => {
  expect(rangeParams({ from: '2026-01-01', to: '' })).toEqual({ from: '2026-01-01' })
  expect(rangeParams({ from: '', to: '' })).toEqual({})
  expect(rangeParams(null)).toEqual({})
})

test('the sales trend asks for its granularity together with the date range', async () => {
  const get = jest.spyOn(apiClients.analytics, 'get').mockResolvedValue({ data: [] })

  await analyticsApi.salesTrend({ from: '2026-01-01', to: '2026-03-31' }, 'week')

  expect(get).toHaveBeenCalledWith('/api/analytics/sales/trend', {
    params: { from: '2026-01-01', to: '2026-03-31', granularity: 'week' },
  })
})

test('the top products call sends the measure, the limit and the category only when one is chosen', async () => {
  const get = jest.spyOn(apiClients.analytics, 'get').mockResolvedValue({ data: [] })

  await analyticsApi.topProducts({ from: '', to: '' }, { by: 'units', limit: 10, category: '' })

  expect(get).toHaveBeenCalledWith('/api/analytics/products/top', {
    params: { by: 'units', limit: 10 },
  })
})

test('searching sends the categories as one comma-separated value and leaves out empty filters', async () => {
  const get = jest.spyOn(apiClients.shop, 'get').mockResolvedValue({ data: { content: [] } })

  await searchProducts({
    query: 'lamp',
    language: 'tr',
    categories: ['Electronics', 'Books'],
    brand: '',
    minPrice: 10,
    sort: 'priceAsc',
    page: 1,
    size: 20,
  })

  expect(get).toHaveBeenCalledWith('/api/shop/search/products', {
    params: {
      q: 'lamp',
      lang: 'tr',
      category: 'Electronics,Books',
      minPrice: 10,
      sort: 'priceAsc',
      page: 1,
      size: 20,
    },
  })
})

test('a search without a text sends an empty query and no category', async () => {
  const get = jest.spyOn(apiClients.shop, 'get').mockResolvedValue({ data: {} })

  await searchProducts({ query: '', language: 'en' })

  expect(get.mock.calls[0][1].params).toEqual({ lang: 'en', page: 0, size: 20 })
})

test('typeahead suggestions use the suggest endpoint with the language', async () => {
  const get = jest.spyOn(apiClients.shop, 'get').mockResolvedValue({ data: [] })

  await suggestProducts({ query: 'la', language: 'en' })

  expect(get).toHaveBeenCalledWith('/api/shop/search/suggest', { params: { q: 'la', lang: 'en', size: 8 } })
})
