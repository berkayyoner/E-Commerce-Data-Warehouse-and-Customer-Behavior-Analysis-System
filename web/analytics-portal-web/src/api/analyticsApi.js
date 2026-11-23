import { apiClients } from './httpClient'

const body = (response) => response.data

/** The optional date filter as query parameters. Empty bounds are left out of the query string. */
export function rangeParams(range) {
  const { from, to } = range || {}
  const params = {}
  if (from) {
    params.from = from
  }
  if (to) {
    params.to = to
  }
  return params
}

function get(path, range, extra = {}) {
  return apiClients.analytics.get(path, { params: { ...rangeParams(range), ...extra } }).then(body)
}

/** Read-only calls of the analytics service. Every report accepts the same { from, to } date range. */
export const analyticsApi = {
  overview: (range) => get('/api/analytics/overview', range),
  salesTrend: (range, granularity) => get('/api/analytics/sales/trend', range, { granularity }),
  topProducts: (range, { by = 'revenue', limit = 10, category } = {}) =>
    get('/api/analytics/products/top', range, { by, limit, category: category || undefined }),
  categories: (range) => get('/api/analytics/categories', range),
  regions: (range) => get('/api/analytics/regions', range),
  payments: (range) => get('/api/analytics/payments', range),
  fulfillment: (range) => get('/api/analytics/fulfillment', range),
  topCustomers: (range, limit = 20) => get('/api/analytics/customers/top', range, { limit }),
  customerMetrics: (range) => get('/api/analytics/customers/metrics', range),
}
