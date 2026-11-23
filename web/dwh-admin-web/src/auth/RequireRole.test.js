import { screen } from '@testing-library/react'

import { ADMIN_USER, ANALYST_USER, renderWithProviders } from '../test-utils'
import RequireRole from './RequireRole'

test('renders the page when the role is allowed', () => {
  renderWithProviders(
    <RequireRole path="/users">
      <p>Account list</p>
    </RequireRole>,
    { user: ADMIN_USER },
  )

  expect(screen.getByText('Account list')).toBeInTheDocument()
})

test('shows the access denied page when the role is not allowed', () => {
  renderWithProviders(
    <RequireRole path="/users">
      <p>Account list</p>
    </RequireRole>,
    { user: ANALYST_USER },
  )

  expect(screen.queryByText('Account list')).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
})
