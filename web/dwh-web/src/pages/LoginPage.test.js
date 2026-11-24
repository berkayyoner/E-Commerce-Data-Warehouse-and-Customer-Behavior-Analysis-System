import { fireEvent, screen, waitFor } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'

import * as authApi from '../api/authApi'
import { renderWithProviders, tokenFor } from '../test-utils'
import LoginPage, { returnPathFrom } from './LoginPage'

afterEach(() => {
  jest.restoreAllMocks()
})

/** Shows the page the browser is on, so the tests can see where a sign in leads. */
function CurrentPage() {
  const location = useLocation()
  return <p>{`on ${location.pathname}`}</p>
}

function renderLogin({ language = 'en', from } = {}) {
  const route = { pathname: '/login', state: from ? { from } : undefined }
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<CurrentPage />} />
    </Routes>,
    { user: null, language, route },
  )
}

function rejectWith(status, data) {
  return jest.spyOn(authApi, 'login').mockRejectedValue(Object.assign(new Error('failed'), { response: { status, data } }))
}

test('the username and password fields have visible labels', () => {
  renderLogin()

  expect(screen.getByLabelText('Username')).toHaveAttribute('type', 'text')
  expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
})

test('the page offers no link back to a homepage', () => {
  renderLogin()

  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

test('empty fields are flagged and nothing is sent to the auth service', () => {
  const login = jest.spyOn(authApi, 'login')
  renderLogin()

  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

  expect(screen.getAllByText('This field is required.')).toHaveLength(2)
  expect(login).not.toHaveBeenCalled()
})

test('the password can be shown and hidden again', () => {
  renderLogin()
  const password = screen.getByLabelText('Password')

  fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
  expect(password).toHaveAttribute('type', 'text')

  fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
  expect(password).toHaveAttribute('type', 'password')
})

test('wrong credentials show the invalid credentials message', async () => {
  rejectWith(401, { error: 'invalid_grant' })
  renderLogin()

  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

  expect(await screen.findByText('The username or password is not correct.')).toBeInTheDocument()
})

test('too many attempts show the rate limit message', async () => {
  rejectWith(429, { error: 'too_many_requests' })
  renderLogin()

  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

  expect(await screen.findByText('Too many attempts. Wait a few minutes and try again.')).toBeInTheDocument()
})

test('an unreachable service shows the service unavailable message in Turkish', async () => {
  jest.spyOn(authApi, 'login').mockRejectedValue(new Error('Network Error'))
  renderLogin({ language: 'tr' })

  fireEvent.change(screen.getByLabelText('Kullanıcı adı'), { target: { value: 'admin' } })
  fireEvent.change(screen.getByLabelText('Şifre'), { target: { value: 'secret' } })
  fireEvent.click(screen.getByRole('button', { name: 'Giriş yap' }))

  expect(
    await screen.findByText('Giriş servisine şu anda ulaşılamıyor. Lütfen daha sonra tekrar deneyin.'),
  ).toBeInTheDocument()
})

test('a successful sign in opens the page the visitor asked for', async () => {
  jest.spyOn(authApi, 'login').mockResolvedValue({
    access_token: tokenFor({ sub: 'analyst1', name: 'Ayse Demir', roles: ['ANALYST'] }),
    refresh_token: 'refresh-1',
  })
  renderLogin({ from: '/customers' })

  fireEvent.change(screen.getByLabelText('Username'), { target: { value: '  analyst1 ' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

  await waitFor(() => expect(screen.getByText('on /customers')).toBeInTheDocument())
  expect(authApi.login).toHaveBeenCalledWith('analyst1', 'secret')
})

test('a sign in without a requested page opens the dashboard', async () => {
  jest.spyOn(authApi, 'login').mockResolvedValue({
    access_token: tokenFor({ sub: 'admin', roles: ['ADMIN'] }),
    refresh_token: 'refresh-1',
  })
  renderLogin()

  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

  await waitFor(() => expect(screen.getByText('on /dashboard')).toBeInTheDocument())
})

describe('the page to return to after sign in', () => {
  test('a path of this console is used', () => {
    expect(returnPathFrom({ from: '/customers?page=2' })).toBe('/customers?page=2')
  })

  test.each([
    ['an outside address', 'https://example.org/phish'],
    ['a protocol-relative address', '//example.org'],
    ['a relative path', 'customers'],
    ['the login page itself', '/login'],
  ])('%s is replaced by the dashboard', (_, from) => {
    expect(returnPathFrom({ from })).toBe('/dashboard')
  })

  test('the dashboard is used when no page was requested', () => {
    expect(returnPathFrom(null)).toBe('/dashboard')
    expect(returnPathFrom(undefined)).toBe('/dashboard')
  })
})
