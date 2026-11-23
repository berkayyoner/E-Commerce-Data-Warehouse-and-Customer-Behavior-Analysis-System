const REFRESH_KEY = 'dwh.portal.refreshToken'
const SIGNED_IN_KEY = 'dwh.portal.signedIn'

let accessToken = null
const listeners = new Set()

function readRefresh() {
  try {
    return window.sessionStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

function readFlag() {
  try {
    return window.sessionStorage.getItem(SIGNED_IN_KEY) === '1'
  } catch {
    return false
  }
}

function writeFlag(on) {
  try {
    if (on) {
      window.sessionStorage.setItem(SIGNED_IN_KEY, '1')
    } else {
      window.sessionStorage.removeItem(SIGNED_IN_KEY)
    }
  } catch {
    // Without storage the visitor simply signs in again after a reload.
  }
}

function writeRefresh(value) {
  try {
    if (value) {
      window.sessionStorage.setItem(REFRESH_KEY, value)
    } else {
      window.sessionStorage.removeItem(REFRESH_KEY)
    }
  } catch {
    // Storage can be unavailable (private mode); the session then ends when the page is reloaded.
  }
}

/**
 * Holds the OAuth tokens. The short-lived access token lives in memory only. The refresh token is kept in
 * sessionStorage so that a reload inside the same tab does not force a new sign-in.
 */
const tokenStore = {
  getAccessToken() {
    return accessToken
  },

  getRefreshToken() {
    return readRefresh()
  },

  /**
   * True while this browser tab holds a session. The authorization server issues no refresh tokens to public
   * clients, so after a reload or an expired access token the application signs in again silently: the server
   * still knows the person and answers the redirect at once.
   */
  wasSignedIn() {
    return readFlag()
  },

  set({ accessToken: nextAccessToken, refreshToken }) {
    accessToken = nextAccessToken
    writeFlag(true)
    if (refreshToken) {
      writeRefresh(refreshToken)
    }
  },

  clear() {
    accessToken = null
    writeRefresh(null)
    writeFlag(false)
  },

  /** Registers a callback for a session that ended. Returns the function that removes it again. */
  onSessionEnded(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  /** Clears the tokens and tells the application that the person is signed out. */
  endSession() {
    tokenStore.clear()
    listeners.forEach((listener) => listener())
  },
}

export default tokenStore
