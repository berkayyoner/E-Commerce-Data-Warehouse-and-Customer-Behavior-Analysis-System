import { fireEvent, screen, waitFor } from '@testing-library/react'

import { completeSignIn, startSignIn } from '../auth/oauth'
import { VIEWER_USER, renderWithProviders } from '../test-utils'
import AccessDeniedPage from './AccessDeniedPage'
import CallbackPage from './CallbackPage'
import SignInPage from './SignInPage'

jest.mock('../auth/oauth', () => ({
  startSignIn: jest.fn(),
  completeSignIn: jest.fn(),
}))

afterEach(() => {
  jest.clearAllMocks()
})

test('the sign-in button starts the authorization redirect', async () => {
  startSignIn.mockResolvedValue(undefined)
  renderWithProviders(<SignInPage />, { user: null })

  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

  await waitFor(() => expect(startSignIn).toHaveBeenCalledTimes(1))
})

test('a callback whose state does not match shows the verification message', async () => {
  completeSignIn.mockRejectedValue(Object.assign(new Error('stateMismatch'), { code: 'stateMismatch' }))
  const { store } = renderWithProviders(<CallbackPage />, { user: null, route: '/callback?code=c&state=x' })

  expect(
    await screen.findByText('The sign-in response could not be verified. Please try again.'),
  ).toBeInTheDocument()
  expect(store.getState().auth.user).toBeNull()
})

test('a person without a portal role sees the no-access page and can sign out from it', () => {
  const { store } = renderWithProviders(<AccessDeniedPage variant="console" />, {
    user: { username: 'guest', roles: ['GUEST'] },
  })

  expect(screen.getByRole('heading', { name: 'No portal access' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

  expect(store.getState().auth.user).toBeNull()
})

test('a VIEWER is not blocked by the no-access page of the console variant', () => {
  renderWithProviders(<AccessDeniedPage variant="page" />, { user: VIEWER_USER })

  expect(screen.getByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
})
