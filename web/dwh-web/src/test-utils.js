import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

import { createAppStore } from './store/store'

export const ADMIN_USER = { username: 'admin', displayName: 'Admin User', roles: ['ADMIN'] }
export const ANALYST_USER = { username: 'analyst', displayName: 'Analyst User', roles: ['ANALYST'] }
export const VIEWER_USER = { username: 'viewer', displayName: 'Viewer User', roles: ['VIEWER'] }

/** An unsigned JWT with the given claims, enough for the console to read sub, name and roles. */
export function tokenFor(claims) {
  const encode = (value) => btoa(JSON.stringify(value)).replace(/=+$/, '')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`
}

/**
 * Renders a component inside a fresh store and router. Pass { user: null } to render signed out.
 * The store is returned so tests can read the state the component changed.
 */
export function renderWithProviders(ui, { user = ADMIN_USER, language = 'en', route = '/' } = {}) {
  const store = createAppStore({
    auth: { user, status: user ? 'ready' : 'idle', error: null },
    language: { selectedLanguage: language },
    ui: { sidebarOpen: true, toasts: [] },
  })
  const result = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>,
  )
  return { store, ...result }
}

/** A list response as the services return it: { content, total, page, size }. */
export function pageOf(content, { total = content.length, page = 0, size = 20 } = {}) {
  return { content, total, page, size }
}
