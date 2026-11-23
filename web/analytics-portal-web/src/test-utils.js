import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

import { createAppStore } from './store/store'

export const ADMIN_USER = { username: 'admin', roles: ['ADMIN'] }
export const ANALYST_USER = { username: 'analyst', roles: ['ANALYST'] }
export const VIEWER_USER = { username: 'viewer', roles: ['VIEWER'] }

/**
 * Renders a component inside a fresh store and router. Pass { user: null } to render signed out.
 * The store is returned so tests can read the state the component changed.
 */
export function renderWithProviders(ui, { user = ADMIN_USER, language = 'en', route = '/' } = {}) {
  const store = createAppStore({
    auth: { user, status: user ? 'ready' : 'idle', error: null },
    language: { selectedLanguage: language },
    ui: { menuOpen: false },
  })
  const result = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>,
  )
  return { store, ...result }
}
