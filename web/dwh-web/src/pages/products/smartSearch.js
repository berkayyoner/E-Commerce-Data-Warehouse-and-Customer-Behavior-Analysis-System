import { formatNumber } from '../../utils/format'

export const RESULT_PAGE_SIZE = 12
export const SUGGESTION_COUNT = 8
export const SUGGEST_DEBOUNCE_MS = 250
export const REINDEX_POLL_MS = 2000
export const SORT_KEYS = Object.freeze(['relevance', 'priceAsc', 'priceDesc', 'nameAsc'])

export const INITIAL_CRITERIA = Object.freeze({
  q: '',
  categories: Object.freeze([]),
  brand: '',
  minPrice: '',
  maxPrice: '',
  sort: 'relevance',
  page: 0,
})

/**
 * Query parameters of GET /api/shop/search/products. Empty filters are left out. Categories are sent as one
 * comma-separated value, which is how the service reads several categories.
 */
export function buildSearchParams(criteria, lang) {
  const params = { q: criteria.q, lang, sort: criteria.sort, page: criteria.page, size: RESULT_PAGE_SIZE }
  if (criteria.categories.length > 0) {
    params.category = criteria.categories.join(',')
  }
  if (criteria.brand) {
    params.brand = criteria.brand
  }
  if (criteria.minPrice !== '') {
    params.minPrice = criteria.minPrice
  }
  if (criteria.maxPrice !== '') {
    params.maxPrice = criteria.maxPrice
  }
  return params
}

/** Translation key of the message when the lowest price is above the highest one, otherwise null. */
export function priceRangeError(criteria) {
  if (criteria.minPrice === '' || criteria.maxPrice === '') {
    return null
  }
  return Number(criteria.minPrice) > Number(criteria.maxPrice) ? 'products.errors.priceRange' : null
}

/** The list without the value when it is there, or with it added at the end. */
export function toggleValue(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

/**
 * Index of the option that the arrow keys reach next. The index wraps at both ends; -1 means no option is
 * highlighted yet, so the first press of the down arrow highlights the first option.
 */
export function stepIndex(current, step, count) {
  if (count === 0) {
    return -1
  }
  if (current < 0) {
    return step > 0 ? 0 : count - 1
  }
  return (current + step + count) % count
}

/** The sort the price header switches to: low to high, then high to low. */
export function nextPriceSort(sort) {
  return sort === 'priceAsc' ? 'priceDesc' : 'priceAsc'
}

/** Status line of a reindex: running counts, success, or failure. Null before any rebuild. */
export function reindexMessage(status, unreachable, t, language) {
  if (unreachable || (status && status.state === 'FAILED')) {
    return t('products.smart.reindex.failed')
  }
  if (!status) {
    return null
  }
  if (status.state === 'RUNNING') {
    return t('products.smart.reindex.running', {
      indexed: formatNumber(status.indexed, language),
      total: formatNumber(status.total, language),
    })
  }
  if (status.state === 'SUCCESS') {
    return t('products.smart.reindex.success', { indexed: formatNumber(status.indexed, language) })
  }
  return null
}
