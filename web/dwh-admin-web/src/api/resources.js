import { apiClients } from './httpClient'

const body = (response) => response.data

/**
 * Query parameters of the list endpoints: zero-based page, page size, search text and a sort column with a
 * direction. Empty values are left out so they do not reach the query string.
 */
export function listParams({ page = 0, size = 20, search = '', sort }) {
  const params = { page, size }
  if (search) {
    params.search = search
  }
  if (sort && sort.key) {
    params.sort = sort.key
    params.direction = sort.direction === 'desc' ? 'desc' : 'asc'
  }
  return params
}

export const usersApi = {
  list: (query) => apiClients.auth.get('/api/auth/users', { params: listParams(query) }).then(body),
  create: (payload) => apiClients.auth.post('/api/auth/users', payload).then(body),
  update: (id, payload) => apiClients.auth.put(`/api/auth/users/${id}`, payload).then(body),
  remove: (id) => apiClients.auth.delete(`/api/auth/users/${id}`).then(body),
}

export const etlApi = {
  listRuns: ({ page = 0, size = 20 } = {}) => apiClients.etl.get('/api/etl/runs', { params: { page, size } }).then(body),
  getRun: (id) => apiClients.etl.get(`/api/etl/runs/${id}`).then(body),
  startRun: (runType) => apiClients.etl.post('/api/etl/runs', { runType }).then(body),
}

export const analyticsApi = {
  overview: () => apiClients.analytics.get('/api/analytics/overview').then(body),
  salesTrend: (granularity = 'month') =>
    apiClients.analytics.get('/api/analytics/sales/trend', { params: { granularity } }).then(body),
  categories: () => apiClients.analytics.get('/api/analytics/categories').then(body),
}

export const segmentationApi = {
  segments: () => apiClients.segmentation.get('/api/segmentation/segments').then(body),
}
