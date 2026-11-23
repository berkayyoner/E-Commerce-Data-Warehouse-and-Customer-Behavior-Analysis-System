import { tokenClient } from '../api/httpClient'
import tokenStore from '../api/tokenStore'
import config from '../config/env'
import { buildAuthorizeUrl, challengeFor, randomState, randomVerifier } from './pkce'

/** Session storage key for the verifier and state while the browser is away at the authorization server. */
const PENDING_KEY = 'dwh.admin.pkce'

export function redirectUri() {
  return `${window.location.origin}/callback`
}

/** An error with a short code that the screen translates: denied, stateMismatch or failed. */
export function signInError(code) {
  const error = new Error(code)
  error.code = code
  return error
}

function takePending() {
  const raw = window.sessionStorage.getItem(PENDING_KEY)
  window.sessionStorage.removeItem(PENDING_KEY)
  return raw ? JSON.parse(raw) : null
}

/** Sends the browser to the authorization server with a PKCE challenge and a state value. */
export async function startSignIn() {
  const verifier = randomVerifier()
  const state = randomState()
  const challenge = await challengeFor(verifier)
  window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ verifier, state }))
  window.location.assign(
    buildAuthorizeUrl({
      authBase: config.services.auth,
      clientId: config.clientId,
      redirectUri: redirectUri(),
      scope: config.scopes,
      challenge,
      state,
    }),
  )
}

/** Finishes the redirect: checks the state, exchanges the code for tokens and keeps them. */
export async function completeSignIn(search) {
  const params = new URLSearchParams(search)
  if (params.get('error')) {
    takePending()
    throw signInError('denied')
  }
  const pending = takePending()
  if (!pending || params.get('state') !== pending.state) {
    throw signInError('stateMismatch')
  }
  const code = params.get('code')
  if (!code) {
    throw signInError('failed')
  }
  const response = await tokenClient.post(
    `${config.services.auth}/oauth2/token`,
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: config.clientId,
      code_verifier: pending.verifier,
    }),
  )
  tokenStore.set({
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
  })
  return response.data
}
