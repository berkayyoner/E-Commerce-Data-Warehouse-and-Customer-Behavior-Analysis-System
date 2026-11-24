import { translate } from '../../hooks/useT'
import {
  INITIAL_CRITERIA,
  buildSearchParams,
  nextPriceSort,
  priceRangeError,
  reindexMessage,
  stepIndex,
  toggleValue,
} from './smartSearch'

const t = (key, params) => translate('en', key, params)

test('the arrow keys wrap around the suggestions and start from the first or the last one', () => {
  expect(stepIndex(-1, 1, 3)).toBe(0)
  expect(stepIndex(-1, -1, 3)).toBe(2)
  expect(stepIndex(2, 1, 3)).toBe(0)
  expect(stepIndex(0, -1, 3)).toBe(2)
  expect(stepIndex(0, 1, 0)).toBe(-1)
})

test('a facet value is added when it is missing and removed when it is there', () => {
  expect(toggleValue(['Decor'], 'Furniture')).toEqual(['Decor', 'Furniture'])
  expect(toggleValue(['Decor', 'Furniture'], 'Decor')).toEqual(['Furniture'])
})

test('the search parameters leave out the filters that are not set and join the categories', () => {
  expect(buildSearchParams({ ...INITIAL_CRITERIA, q: 'chair' }, 'en')).toEqual({
    q: 'chair',
    lang: 'en',
    sort: 'relevance',
    page: 0,
    size: 12,
  })

  expect(
    buildSearchParams(
      { ...INITIAL_CRITERIA, categories: ['Furniture', 'Decor'], brand: 'Nordic', minPrice: '0', maxPrice: '99.5' },
      'tr',
    ),
  ).toEqual({
    q: '',
    lang: 'tr',
    sort: 'relevance',
    page: 0,
    size: 12,
    category: 'Furniture,Decor',
    brand: 'Nordic',
    minPrice: '0',
    maxPrice: '99.5',
  })
})

test('a lowest price above the highest price is an error only when both are set', () => {
  expect(priceRangeError({ minPrice: '50', maxPrice: '10' })).toBe('products.errors.priceRange')
  expect(priceRangeError({ minPrice: '10', maxPrice: '10' })).toBeNull()
  expect(priceRangeError({ minPrice: '50', maxPrice: '' })).toBeNull()
})

test('the price header switches between the two price orders', () => {
  expect(nextPriceSort('relevance')).toBe('priceAsc')
  expect(nextPriceSort('priceAsc')).toBe('priceDesc')
  expect(nextPriceSort('priceDesc')).toBe('priceAsc')
})

test('the reindex message follows the state of the rebuild', () => {
  expect(reindexMessage(null, false, t, 'en')).toBeNull()
  expect(reindexMessage({ state: 'RUNNING', indexed: 1200, total: 4000 }, false, t, 'en')).toBe(
    'Indexed 1,200 of 4,000 products.',
  )
  expect(reindexMessage({ state: 'SUCCESS', indexed: 4000, total: 4000 }, false, t, 'en')).toBe(
    'The search index was rebuilt with 4,000 products.',
  )
  expect(reindexMessage({ state: 'RUNNING', indexed: 1, total: 4 }, true, t, 'en')).toBe(
    'The search index could not be rebuilt.',
  )
})
