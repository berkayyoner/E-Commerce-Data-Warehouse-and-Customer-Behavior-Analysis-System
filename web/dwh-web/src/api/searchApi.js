import { apiClients } from './httpClient'

const body = (response) => response.data

/** Drops the empty values so that they never reach the query string. */
function withoutEmpty(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

/**
 * Product search of the shop service. Several categories travel as one comma-separated value; the brand is a
 * single value.
 */
export function searchProducts({
  query = '',
  language,
  categories = [],
  brand,
  minPrice,
  maxPrice,
  sort,
  page = 0,
  size = 20,
}) {
  return apiClients.shop
    .get('/api/shop/search/products', {
      params: withoutEmpty({
        q: query,
        lang: language,
        category: categories.length > 0 ? categories.join(',') : undefined,
        brand,
        minPrice,
        maxPrice,
        sort,
        page,
        size,
      }),
    })
    .then(body)
}

/** Typeahead suggestions of the shop service. */
export function suggestProducts({ query, language, size = 8 }) {
  return apiClients.shop
    .get('/api/shop/search/suggest', { params: withoutEmpty({ q: query, lang: language, size }) })
    .then(body)
}
