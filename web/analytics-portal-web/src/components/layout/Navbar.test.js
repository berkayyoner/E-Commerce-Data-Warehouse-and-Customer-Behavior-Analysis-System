import { fireEvent, screen } from '@testing-library/react'

import { ADMIN_USER, VIEWER_USER, renderWithProviders } from '../../test-utils'
import Navbar from './Navbar'

test('a visitor sees the brand and the language choice but no navigation or menu', () => {
  renderWithProviders(<Navbar />, { user: null })

  expect(screen.getByText('Shop Analytics Portal')).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Language' })).toBeInTheDocument()
  expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument()
})

test('the menu button expands and collapses the navigation on narrow screens', () => {
  renderWithProviders(<Navbar />, { user: ADMIN_USER })
  const toggle = screen.getByRole('button', { name: 'Open menu' })
  const nav = screen.getByRole('navigation', { name: 'Main navigation' })

  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(nav).not.toHaveClass('is-open')

  fireEvent.click(toggle)

  expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true')
  expect(nav).toHaveClass('is-open')
})

test('choosing a page closes the expanded navigation', () => {
  const { store } = renderWithProviders(<Navbar />, { user: ADMIN_USER })
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))

  fireEvent.click(screen.getByRole('link', { name: 'Product search' }))

  expect(store.getState().ui.menuOpen).toBe(false)
  expect(screen.getByRole('navigation', { name: 'Main navigation' })).not.toHaveClass('is-open')
})

test('a VIEWER gets both pages in the navigation with their icons and labels', () => {
  renderWithProviders(<Navbar />, { user: VIEWER_USER })

  const nav = screen.getByRole('navigation', { name: 'Main navigation' })
  expect(nav).toHaveTextContent('Dashboard')
  expect(nav).toHaveTextContent('Product search')
  expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/')
  expect(screen.getByRole('link', { name: 'Product search' })).toHaveAttribute('href', '/search')
})

test('the signed-in person and the translated role are shown', () => {
  renderWithProviders(<Navbar />, { user: ADMIN_USER })

  expect(screen.getByText('admin')).toBeInTheDocument()
  expect(screen.getByText('Administrator')).toBeInTheDocument()
})

test('signing out clears the person from the store', () => {
  const { store } = renderWithProviders(<Navbar />, { user: ADMIN_USER })

  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

  expect(store.getState().auth.user).toBeNull()
})

test('the language choice is remembered in the store', () => {
  const { store } = renderWithProviders(<Navbar />, { user: null })

  fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: 'tr' } })

  expect(store.getState().language.selectedLanguage).toBe('tr')
  expect(screen.getByText('Mağaza Analitik Portalı')).toBeInTheDocument()
})
