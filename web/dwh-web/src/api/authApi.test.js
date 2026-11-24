import { authClient, decodeAccessToken, login, logout, refreshTokens, sessionFrom } from './authApi'
import { tokenFor } from '../test-utils'

/** Adapter answer for a request that succeeded. */
function answer(config, data, status = 200) {
  return Promise.resolve({ data, status, statusText: 'OK', headers: {}, config })
}

test('decodeAccessToken reads the payload of a JWT', () => {
  const token = tokenFor({ sub: 'admin', roles: ['ADMIN'] })

  expect(decodeAccessToken(token)).toEqual({ sub: 'admin', roles: ['ADMIN'] })
})

test('sessionFrom takes the username, name and roles from the token claims', () => {
  const session = sessionFrom({
    access_token: tokenFor({ sub: 'analyst1', name: 'Ayse Demir', roles: ['ANALYST'] }),
  })

  expect(session).toEqual({ username: 'analyst1', displayName: 'Ayse Demir', roles: ['ANALYST'] })
})

test('sessionFrom prefers the display name of the response and uses the role of the response without a roles claim', () => {
  const session = sessionFrom({
    access_token: tokenFor({ sub: 'viewer1' }),
    display_name: 'Viewer One',
    role: 'VIEWER',
  })

  expect(session).toEqual({ username: 'viewer1', displayName: 'Viewer One', roles: ['VIEWER'] })
})

test('login posts the credentials as JSON and returns the token response', async () => {
  authClient.defaults.adapter = jest.fn((config) =>
    answer(config, { access_token: 'access-1', refresh_token: 'refresh-1', display_name: 'Admin' }),
  )

  const body = await login('admin', 'secret')

  const sent = authClient.defaults.adapter.mock.calls[0][0]
  expect(sent.method).toBe('post')
  expect(sent.url).toBe('/auth/login')
  expect(JSON.parse(sent.data)).toEqual({ username: 'admin', password: 'secret' })
  expect(body.refresh_token).toBe('refresh-1')
})

test('refreshTokens sends the refresh token as JSON', async () => {
  authClient.defaults.adapter = jest.fn((config) => answer(config, { access_token: 'access-2', refresh_token: 'refresh-2' }))

  const body = await refreshTokens('refresh-1')

  const sent = authClient.defaults.adapter.mock.calls[0][0]
  expect(sent.url).toBe('/auth/refresh')
  expect(JSON.parse(sent.data)).toEqual({ refresh_token: 'refresh-1' })
  expect(body.refresh_token).toBe('refresh-2')
})

test('logout sends the refresh token to be revoked', async () => {
  authClient.defaults.adapter = jest.fn((config) => answer(config, '', 204))

  await logout('refresh-1')

  const sent = authClient.defaults.adapter.mock.calls[0][0]
  expect(sent.url).toBe('/auth/logout')
  expect(JSON.parse(sent.data)).toEqual({ refresh_token: 'refresh-1' })
})
