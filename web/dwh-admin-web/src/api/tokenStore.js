const REFRESH_KEY = 'dwh.admin.refreshToken'

let accessToken = null
const listeners = new Set()

function readRefresh() {
  try {
    return window.sessionStorage.getItem(REFRESH_KEY)
  } catch {
    return null
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

  set({ accessToken: nextAccessToken, refreshToken }) {
    accessToken = nextAccessToken
    if (refreshToken) {
      writeRefresh(refreshToken)
    }
  },

  clear() {
    accessToken = null
    writeRefresh(null)
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
