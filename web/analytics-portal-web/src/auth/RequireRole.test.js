import { screen } from '@testing-library/react'

import { ADMIN_USER, renderWithProviders } from '../test-utils'
import RequireRole from './RequireRole'

test('renders the page when the role is allowed for the path', () => {
  renderWithProviders(
    <RequireRole path="/search">
      <p>Search page body</p>
    </RequireRole>,
    { user: ADMIN_USER },
  )

  expect(screen.getByText('Search page body')).toBeInTheDocument()
})

test('shows the access denied page for a path that no role may open', () => {
  renderWithProviders(
    <RequireRole path="/unknown">
      <p>Hidden body</p>
    </RequireRole>,
    { user: ADMIN_USER },
  )

  expect(screen.queryByText('Hidden body')).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
})
