import { configureStore } from '@reduxjs/toolkit'

import { setLanguageProvider } from '../api/httpClient'
import tokenStore from '../api/tokenStore'
import authReducer, { sessionEnded } from './authSlice'
import cacheReducer from './cacheSlice'
import languageReducer from './languageSlice'
import uiReducer from './uiSlice'

export function createAppStore(preloadedState) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      cache: cacheReducer,
      language: languageReducer,
      ui: uiReducer,
    },
    preloadedState,
  })

  setLanguageProvider(() => store.getState().language.selectedLanguage)
  tokenStore.onSessionEnded(() => store.dispatch(sessionEnded()))

  return store
}

const store = createAppStore()

export default store
