import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { logout, login, sessionFrom } from '../api/authApi'
import { refreshSession } from '../api/httpClient'
import tokenStore from '../api/tokenStore'

const initialState = {
  /** { username, displayName, roles } once signed in, otherwise null. */
  user: null,
  /** restoring: a stored refresh token is being exchanged on page load; idle, loading and ready otherwise. */
  status: tokenStore.getRefreshToken() ? 'restoring' : 'idle',
  /** Code of the last failed sign-in: invalidCredentials, tooManyAttempts or unavailable. */
  error: null,
}

/** Maps a failed login request to the message code the login page shows. */
function loginFailureCode(error) {
  const status = error.response && error.response.status
  const code = error.response && error.response.data && error.response.data.error
  if (code === 'invalid_grant' || status === 401) {
    return 'invalidCredentials'
  }
  if (code === 'too_many_requests' || status === 429) {
    return 'tooManyAttempts'
  }
  return 'unavailable'
}

export const signIn = createAsyncThunk('auth/signIn', async ({ username, password }, { rejectWithValue }) => {
  try {
    const tokens = await login(username, password)
    const session = sessionFrom(tokens)
    tokenStore.set({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token })
    return session
  } catch (error) {
    return rejectWithValue(loginFailureCode(error))
  }
})

/** Brings the session back on page load by exchanging the stored refresh token. */
export const restoreSession = createAsyncThunk('auth/restore', async (_, { rejectWithValue }) => {
  try {
    const tokens = await refreshSession()
    return sessionFrom(tokens)
  } catch {
    tokenStore.clear()
    return rejectWithValue('expired')
  }
})

/**
 * Ends the session: the local tokens are cleared at once, and the auth service is told to revoke the refresh
 * token in the background. A failed revoke does not matter to the person, because the tokens are gone already.
 */
export const signOut = () => (dispatch) => {
  const refreshToken = tokenStore.getRefreshToken()
  tokenStore.clear()
  dispatch(sessionEnded())
  if (refreshToken) {
    logout(refreshToken).catch(() => {})
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionEnded() {
      return { user: null, status: 'idle', error: null }
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signIn.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = 'ready'
      })
      .addCase(signIn.rejected, (state, action) => {
        state.status = 'idle'
        state.error = action.payload || 'unavailable'
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = 'ready'
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null
        state.status = 'idle'
      })
  },
})

export const { sessionEnded, clearError } = authSlice.actions

export default authSlice.reducer
