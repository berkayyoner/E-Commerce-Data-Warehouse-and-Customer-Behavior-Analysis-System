import axios from 'axios'

import config from '../config/env'

/**
 * Plain client for the auth service's token endpoints. It has no interceptors, so a refresh can never trigger
 * another refresh.
 */
export const authClient = axios.create({ baseURL: config.services.auth, timeout: 30000 })

/** Reads the payload of a JWT. The signature is checked by the services on every call, not here. */
export function decodeAccessToken(token) {
  const payload = token.split('.')[1]
  const normalised = payload.replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(
    atob(normalised)
      .split('')
      .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join(''),
  )
  return JSON.parse(json)
}

/** The signed-in person from a token response: username (sub), display name, and roles from the claims. */
export function sessionFrom(tokens) {
  const claims = decodeAccessToken(tokens.access_token)
  const roles = Array.isArray(claims.roles) ? claims.roles : tokens.role ? [tokens.role] : []
  return {
    username: claims.sub,
    displayName: tokens.display_name || claims.name || claims.sub,
    roles,
  }
}

/** Exchanges a username and password for a token pair. */
export async function login(username, password) {
  const response = await authClient.post('/auth/login', { username, password })
  return response.data
}

/** Exchanges a refresh token for a new pair. The refresh token is rotated, so the old one stops working. */
export async function refreshTokens(refreshToken) {
  const response = await authClient.post('/auth/refresh', { refresh_token: refreshToken })
  return response.data
}

/** Asks the auth service to revoke the refresh token. */
export function logout(refreshToken) {
  return authClient.post('/auth/logout', { refresh_token: refreshToken })
}
