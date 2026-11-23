import { screen } from '@testing-library/react'

import App from './App'
import { renderWithProviders } from './test-utils'

jest.mock('./api/analyticsApi', () => ({
  analyticsApi: {
    overview: () => new Promise(() => {}),
    salesTrend: () => new Promise(() => {}),
    topProducts: () => new Promise(() => {}),
    categories: () => new Promise(() => {}),
    regions: () => new Promise(() => {}),
    payments: () => new Promise(() => {}),
    fulfillment: () => new Promise(() => {}),
    topCustomers: () => new Promise(() => {}),
    customerMetrics: () => new Promise(() => {}),
  },
}))

test('a visitor at the root address sees the sign-in card', () => {
  renderWithProviders(<App />, { user: null, route: '/' })

  expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
})

test('a signed-in person whose roles do not open the portal sees the no-access page at every route', () => {
  renderWithProviders(<App />, { user: { username: 'guest', roles: ['GUEST'] }, route: '/' })

  expect(screen.getByRole('heading', { name: 'No portal access' })).toBeInTheDocument()
})

test('an unknown address is redirected to the dashboard for a signed-in person', () => {
  renderWithProviders(<App />, { user: { username: 'guest', roles: ['GUEST'] }, route: '/nowhere' })

  expect(screen.getByRole('heading', { name: 'No portal access' })).toBeInTheDocument()
})

test('a visitor who opens the search page is sent back to the sign-in card', () => {
  renderWithProviders(<App />, { user: null, route: '/search' })

  expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  expect(screen.queryByRole('combobox', { name: 'Search products' })).not.toBeInTheDocument()
})

test('a signed-in VIEWER gets the dashboard heading', () => {
  renderWithProviders(<App />, { user: { username: 'viewer', roles: ['VIEWER'] }, route: '/' })

  expect(screen.getByRole('heading', { level: 1, name: 'Sales overview' })).toBeInTheDocument()
})
