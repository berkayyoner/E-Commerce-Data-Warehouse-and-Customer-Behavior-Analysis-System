import { fireEvent, screen } from '@testing-library/react'

import { VIEWER_USER, renderWithProviders } from '../test-utils'
import AccessDeniedPage from './AccessDeniedPage'

test('a viewer sees the no-access page and can sign out from it', () => {
  const { store } = renderWithProviders(<AccessDeniedPage variant="console" />, { user: VIEWER_USER })

  expect(screen.getByRole('heading', { name: 'No console access' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

  expect(store.getState().auth.user).toBeNull()
})

test('the page variant for a page outside the roles has its own heading', () => {
  renderWithProviders(<AccessDeniedPage variant="page" />, { user: VIEWER_USER })

  expect(screen.getByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
})
