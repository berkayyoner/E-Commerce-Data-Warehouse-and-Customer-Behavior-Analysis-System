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

/**
 * listParams plus the resource specific filters that have a value. Empty filters are left out, so the query
 * string only carries what the person chose.
 */
function withFilters(query, names) {
  const params = listParams(query)
  names.forEach((name) => {
    const value = query[name]
    if (value !== undefined && value !== null && value !== '') {
      params[name] = value
    }
  })
  return params
}

export const shopApi = {
  customers: {
    list: (query) => apiClients.shop.get('/api/shop/customers', { params: withFilters(query, ['warehouseId']) }).then(body),
    create: (payload) => apiClients.shop.post('/api/shop/customers', payload).then(body),
    update: ({ warehouseId, districtId, customerId }, payload) =>
      apiClients.shop.put(`/api/shop/customers/${warehouseId}/${districtId}/${customerId}`, payload).then(body),
  },
  warehouses: {
    list: (query) => apiClients.shop.get('/api/shop/warehouses', { params: listParams(query) }).then(body),
    create: (payload) => apiClients.shop.post('/api/shop/warehouses', payload).then(body),
    update: (id, payload) => apiClients.shop.put(`/api/shop/warehouses/${id}`, payload).then(body),
    remove: (id) => apiClients.shop.delete(`/api/shop/warehouses/${id}`).then(body),
  },
  products: {
    list: (query) => apiClients.shop.get('/api/shop/products', { params: listParams(query) }).then(body),
    create: (payload) => apiClients.shop.post('/api/shop/products', payload).then(body),
    update: (id, payload) => apiClients.shop.put(`/api/shop/products/${id}`, payload).then(body),
    remove: (id) => apiClients.shop.delete(`/api/shop/products/${id}`).then(body),
  },
  orders: {
    list: (query) =>
      apiClients.shop.get('/api/shop/orders', { params: withFilters(query, ['warehouseId', 'from', 'to']) }).then(body),
    get: ({ warehouseId, districtId, orderId }) =>
      apiClients.shop.get(`/api/shop/orders/${warehouseId}/${districtId}/${orderId}`).then(body),
  },
}

export const searchApi = {
  products: (params) => apiClients.shop.get('/api/shop/search/products', { params }).then(body),
  suggest: (params) => apiClients.shop.get('/api/shop/search/suggest', { params }).then(body),
  startReindex: () => apiClients.shop.post('/api/shop/search/reindex').then(body),
  reindexStatus: () => apiClients.shop.get('/api/shop/search/reindex').then(body),
}

export const segmentationApi = {
  segments: () => apiClients.segmentation.get('/api/segmentation/segments').then(body),
  rfmGrid: () => apiClients.segmentation.get('/api/segmentation/rfm-grid').then(body),
  clusters: () => apiClients.segmentation.get('/api/segmentation/clusters').then(body),
  customers: (query) =>
    apiClients.segmentation
      .get('/api/segmentation/customers', { params: withFilters(query, ['segment', 'cluster']) })
      .then(body),
  startRun: () => apiClients.segmentation.post('/api/segmentation/runs').then(body),
  getRun: (id) => apiClients.segmentation.get(`/api/segmentation/runs/${id}`).then(body),
}
