import { screen } from '@testing-library/react'

import Sidebar from '../components/layout/Sidebar'
import { ADMIN_USER, ANALYST_USER, renderWithProviders } from '../test-utils'
import { ROLES } from '../auth/roles'
import { NAV_ITEMS, allowedRolesFor } from './navItems'

test('the sidebar lists the pages in the agreed order', () => {
  expect(NAV_ITEMS.map((item) => item.path)).toEqual([
    '/dashboard',
    '/customers',
    '/products',
    '/warehouses',
    '/orders',
    '/etl',
    '/segments',
    '/users',
  ])
})

test('only administrators may open the personnel accounts, and both console roles may open the shop pages', () => {
  const shopPaths = ['/customers', '/products', '/warehouses', '/orders', '/segments']

  expect(allowedRolesFor('/users')).toEqual([ROLES.ADMIN])
  shopPaths.forEach((path) => {
    expect(allowedRolesFor(path)).toEqual([ROLES.ADMIN, ROLES.ANALYST])
  })
})

test('an analyst sees the shop pages and no personnel accounts entry', () => {
  renderWithProviders(<Sidebar />, { user: ANALYST_USER })

  expect(screen.getByRole('link', { name: 'Customers' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Segments' })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument()
})

test('an administrator sees every entry in the agreed labels', () => {
  renderWithProviders(<Sidebar />, { user: ADMIN_USER })

  const labels = screen.getAllByRole('link').map((link) => link.textContent)
  expect(labels).toEqual([
    'Dashboard',
    'Customers',
    'Products',
    'Warehouses',
    'Orders',
    'ETL Runs',
    'Segments',
    'Users',
  ])
})
