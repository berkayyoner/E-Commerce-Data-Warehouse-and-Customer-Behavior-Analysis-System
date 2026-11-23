import { setReauthenticationHandler, tokenClient } from '../api/httpClient'
import tokenStore from '../api/tokenStore'
import config from '../config/env'
import { buildAuthorizeUrl, challengeFor, randomState, randomVerifier } from './pkce'

/** Session storage key for the verifier and state while the browser is away at the authorization server. */
const PENDING_KEY = 'dwh.portal.pkce'
/** Where to return after the redirect, so a reload or an expired token does not lose the open page. */
const RETURN_KEY = 'dwh.portal.returnTo'

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

/** The page to open after sign in: only paths of this application are accepted. */
export function peekReturnTo() {
  try {
    const value = window.sessionStorage.getItem(RETURN_KEY)
    return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/callback') ? value : null
  } catch {
    return null
  }
}

function rememberReturnTo(path) {
  try {
    if (path) {
      window.sessionStorage.setItem(RETURN_KEY, path)
    } else {
      window.sessionStorage.removeItem(RETURN_KEY)
    }
  } catch {
    // The visitor then lands on the start page after sign in.
  }
}

/** Sends the browser to the authorization server with a PKCE challenge and a state value. */
export async function startSignIn(returnTo = null) {
  rememberReturnTo(returnTo)
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

function currentPath() {
  return `${window.location.pathname}${window.location.search}`
}

// An expired access token is replaced by a new sign in that the authorization server answers without a prompt.
setReauthenticationHandler(() => startSignIn(currentPath()))
