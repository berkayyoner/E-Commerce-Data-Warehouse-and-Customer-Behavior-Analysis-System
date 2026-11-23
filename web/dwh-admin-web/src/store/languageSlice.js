import { createSlice } from '@reduxjs/toolkit'

import config from '../config/env'
import locales from '../locales'

const STORAGE_KEY = 'dwh.admin.language'

export const SUPPORTED_LANGUAGES = Object.freeze(Object.keys(locales))

function readStored() {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function getInitialLanguage() {
  const stored = readStored()
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
    return stored
  }
  return SUPPORTED_LANGUAGES.includes(config.defaultLanguage) ? config.defaultLanguage : 'en'
}

const languageSlice = createSlice({
  name: 'language',
  initialState: { selectedLanguage: getInitialLanguage() },
  reducers: {
    setLanguage(state, action) {
      if (!SUPPORTED_LANGUAGES.includes(action.payload)) {
        return
      }
      state.selectedLanguage = action.payload
      try {
        window.localStorage.setItem(STORAGE_KEY, action.payload)
      } catch {
        // Remembering the choice is a convenience only.
      }
    },
  },
})

export const { setLanguage } = languageSlice.actions

export default languageSlice.reducer
