import axios from 'axios'

import config from '../config/env'
import { refreshTokens } from './authApi'
import tokenStore from './tokenStore'

let languageProvider = () => config.defaultLanguage

/** Lets the store tell the clients which language to request (sent as Accept-Language). */
export function setLanguageProvider(provider) {
  languageProvider = provider
}

let refreshing = null

/**
 * Exchanges the stored refresh token for a new pair and keeps it. Concurrent callers share one request, because
 * the refresh token is rotated and a second use of the old one would be refused. Resolves with the token response.
 */
export function refreshSession() {
  const refreshToken = tokenStore.getRefreshToken()
  if (!refreshToken) {
    return Promise.reject(new Error('No refresh token'))
  }
  if (!refreshing) {
    refreshing = refreshTokens(refreshToken)
      .then((body) => {
        tokenStore.set({ accessToken: body.access_token, refreshToken: body.refresh_token })
        return body
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

/** Retries a request once after a refresh. A second 401, or a failed refresh, ends the session. */
async function recoverFromUnauthorised(client, error) {
  const original = error.config
  const unauthorised = error.response && error.response.status === 401
  if (!unauthorised || !original) {
    return Promise.reject(error)
  }
  if (original.retried) {
    tokenStore.endSession()
    return Promise.reject(error)
  }
  original.retried = true
  try {
    await refreshSession()
  } catch {
    tokenStore.endSession()
    return Promise.reject(error)
  }
  return client(original)
}

/** Axios client for one service: adds the bearer token and the language to each request. */
export function createApiClient(baseURL) {
  const client = axios.create({ baseURL, timeout: 30000 })

  client.interceptors.request.use((request) => {
    const token = tokenStore.getAccessToken()
    if (token) {
      request.headers.Authorization = `Bearer ${token}`
    }
    request.headers['Accept-Language'] = languageProvider()
    return request
  })

  client.interceptors.response.use(
    (response) => response,
    (error) => recoverFromUnauthorised(client, error),
  )

  return client
}

/** One client per back-end service. The paths carry their /api/<service> prefix, so a gateway works unchanged. */
export const apiClients = Object.freeze({
  auth: createApiClient(config.services.auth),
  etl: createApiClient(config.services.etl),
  analytics: createApiClient(config.services.analytics),
  shop: createApiClient(config.services.shop),
  segmentation: createApiClient(config.services.segmentation),
})
