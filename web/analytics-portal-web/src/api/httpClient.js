import axios from 'axios'

import config from '../config/env'
import tokenStore from './tokenStore'

let languageProvider = () => config.defaultLanguage

/** Lets the store tell the clients which language to request (sent as Accept-Language). */
export function setLanguageProvider(provider) {
  languageProvider = provider
}

/** Plain client for the OAuth token endpoint. It has no interceptors, so a refresh can never recurse. */
export const tokenClient = axios.create({ timeout: 30000 })

let reauthenticate = null

/** Registers what to do when the access token is gone and cannot be refreshed. */
export function setReauthenticationHandler(handler) {
  reauthenticate = handler
}

let refreshing = null

/** Exchanges the stored refresh token for a new pair. Concurrent callers share one request. */
export function refreshSession() {
  const refreshToken = tokenStore.getRefreshToken()
  if (!refreshToken) {
    return Promise.reject(new Error('No refresh token'))
  }
  if (!refreshing) {
    refreshing = tokenClient
      .post(
        `${config.services.auth}/oauth2/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: config.clientId,
          refresh_token: refreshToken,
        }),
      )
      .then((response) => {
        tokenStore.set({
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
        })
        return response.data
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

/**
 * Without a usable refresh token a signed in person is sent through a silent sign in (the page is left, so the
 * returned promise never settles); anybody else is signed out.
 */
function signInAgain(error) {
  if (reauthenticate && tokenStore.wasSignedIn()) {
    reauthenticate()
    return new Promise(() => {})
  }
  tokenStore.endSession()
  return Promise.reject(error)
}

/** Retries a request once after a refresh. A second 401, or a failed refresh, ends the session. */
async function recoverFromUnauthorised(client, error) {
  const original = error.config
  const unauthorised = error.response && error.response.status === 401
  if (!unauthorised || !original) {
    return Promise.reject(error)
  }
  if (original.retried || !tokenStore.getRefreshToken()) {
    return signInAgain(error)
  }
  original.retried = true
  try {
    await refreshSession()
  } catch {
    return signInAgain(error)
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
  analytics: createApiClient(config.services.analytics),
  shop: createApiClient(config.services.shop),
})
