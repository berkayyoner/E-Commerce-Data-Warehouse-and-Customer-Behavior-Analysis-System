import { createSlice } from '@reduxjs/toolkit'

import { sessionEnded } from './authSlice'

/** A value loaded less than this long ago is reused instead of calling the service again. */
export const CACHE_TTL_MS = 60 * 1000

export function isFresh(entry, now = Date.now()) {
  return Boolean(entry) && now - entry.storedAt < CACHE_TTL_MS
}

/** Dashboard values keyed by name. The cache is emptied when the person signs out. */
const cacheSlice = createSlice({
  name: 'cache',
  initialState: { entries: {} },
  reducers: {
    cacheStored: {
      reducer(state, action) {
        state.entries[action.payload.key] = { data: action.payload.data, storedAt: action.payload.storedAt }
      },
      prepare(key, data) {
        return { payload: { key, data, storedAt: Date.now() } }
      },
    },
  },
  extraReducers: (builder) => {
    builder.addCase(sessionEnded, () => ({ entries: {} }))
  },
})

export const { cacheStored } = cacheSlice.actions

export default cacheSlice.reducer
