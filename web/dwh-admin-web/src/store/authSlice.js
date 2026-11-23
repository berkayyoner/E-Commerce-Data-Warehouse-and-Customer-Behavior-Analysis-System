import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { fetchCurrentUser } from '../api/authApi'
import { refreshSession } from '../api/httpClient'
import tokenStore from '../api/tokenStore'
import { completeSignIn } from '../auth/oauth'

const initialState = {
  /** { username, roles } once signed in, otherwise null. */
  user: null,
  /** restoring: a stored refresh token is being exchanged; signingIn: the redirect is being completed. */
  status: tokenStore.getRefreshToken() ? 'restoring' : 'idle',
  /** Code of the last failed sign-in (denied, stateMismatch or failed). */
  error: null,
}

/** Exchanges the stored refresh token on page load and loads the person. */
export const restoreSession = createAsyncThunk('auth/restore', async (_, { rejectWithValue }) => {
  try {
    await refreshSession()
    return await fetchCurrentUser()
  } catch {
    tokenStore.clear()
    return rejectWithValue('expired')
  }
})

/** Completes the redirect back from the authorization server. */
export const finishSignIn = createAsyncThunk('auth/finishSignIn', async (search, { rejectWithValue }) => {
  try {
    await completeSignIn(search)
    return await fetchCurrentUser()
  } catch (error) {
    tokenStore.clear()
    return rejectWithValue(error.code || 'failed')
  }
})

/** Clears the tokens locally. The authorization server keeps no session the console must end. */
export const signOut = () => (dispatch) => {
  tokenStore.clear()
  dispatch(sessionEnded())
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionEnded() {
      return { ...initialState, status: 'idle' }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = 'ready'
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null
        state.status = 'idle'
      })
      .addCase(finishSignIn.pending, (state) => {
        state.status = 'signingIn'
        state.error = null
      })
      .addCase(finishSignIn.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = 'ready'
      })
      .addCase(finishSignIn.rejected, (state, action) => {
        state.user = null
        state.status = 'idle'
        state.error = action.payload || 'failed'
      })
  },
})

export const { sessionEnded } = authSlice.actions

export default authSlice.reducer
