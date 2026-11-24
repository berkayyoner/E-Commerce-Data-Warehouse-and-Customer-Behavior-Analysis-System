import * as authApi from '../api/authApi'
import tokenStore from '../api/tokenStore'
import { tokenFor } from '../test-utils'
import { createAppStore } from './store'
import { restoreSession, signIn, signOut } from './authSlice'

const ADMIN_TOKEN = tokenFor({ sub: 'admin', name: 'Admin User', roles: ['ADMIN'] })

afterEach(() => {
  tokenStore.clear()
  jest.restoreAllMocks()
})

test('restoring a session exchanges the refresh token and loads the person from the new token', async () => {
  tokenStore.set({ accessToken: 'access-1', refreshToken: 'refresh-1' })
  jest.spyOn(authApi, 'refreshTokens').mockResolvedValue({
    access_token: ADMIN_TOKEN,
    refresh_token: 'refresh-2',
    display_name: 'Admin User',
  })
  const store = createAppStore()

  await store.dispatch(restoreSession())

  expect(store.getState().auth).toMatchObject({
    user: { username: 'admin', displayName: 'Admin User', roles: ['ADMIN'] },
    status: 'ready',
  })
  expect(tokenStore.getRefreshToken()).toBe('refresh-2')
})

test('a failed restore leaves the person signed out and forgets the refresh token', async () => {
  tokenStore.set({ accessToken: 'access-1', refreshToken: 'refresh-1' })
  jest.spyOn(authApi, 'refreshTokens').mockRejectedValue(new Error('invalid_grant'))
  const store = createAppStore()

  await store.dispatch(restoreSession())

  expect(store.getState().auth).toMatchObject({ user: null, status: 'idle' })
  expect(tokenStore.getRefreshToken()).toBeNull()
})

test('a stored refresh token starts the application in the restoring state', () => {
  window.sessionStorage.setItem('dwh.console.refreshToken', 'refresh-1')
  let reducer
  jest.isolateModules(() => {
    reducer = require('./authSlice').default
  })

  expect(reducer(undefined, { type: 'init' }).status).toBe('restoring')
})

test('a successful sign in keeps the tokens and the person from the claims', async () => {
  jest.spyOn(authApi, 'login').mockResolvedValue({
    access_token: ADMIN_TOKEN,
    refresh_token: 'refresh-1',
    display_name: 'Admin User',
    role: 'ADMIN',
  })
  const store = createAppStore({ auth: { user: null, status: 'idle', error: null } })

  await store.dispatch(signIn({ username: 'admin', password: 'secret' }))

  expect(store.getState().auth).toMatchObject({
    user: { username: 'admin', displayName: 'Admin User', roles: ['ADMIN'] },
    status: 'ready',
    error: null,
  })
  expect(tokenStore.getAccessToken()).toBe(ADMIN_TOKEN)
  expect(tokenStore.getRefreshToken()).toBe('refresh-1')
})

test.each([
  ['a wrong password', 401, { error: 'invalid_grant' }, 'invalidCredentials'],
  ['too many attempts', 429, { error: 'too_many_requests' }, 'tooManyAttempts'],
  ['an unreachable service', undefined, undefined, 'unavailable'],
  ['a server error', 500, {}, 'unavailable'],
])('a failed sign in with %s shows the matching message code', async (_, status, data, code) => {
  const failure = status ? Object.assign(new Error('failed'), { response: { status, data } }) : new Error('Network Error')
  jest.spyOn(authApi, 'login').mockRejectedValue(failure)
  const store = createAppStore({ auth: { user: null, status: 'idle', error: null } })

  await store.dispatch(signIn({ username: 'admin', password: 'wrong' }))

  expect(store.getState().auth).toMatchObject({ user: null, status: 'idle', error: code })
  expect(tokenStore.getAccessToken()).toBeNull()
})

test('signing out clears the tokens and the person, and revokes the refresh token', () => {
  tokenStore.set({ accessToken: 'access-1', refreshToken: 'refresh-1' })
  const logout = jest.spyOn(authApi, 'logout').mockResolvedValue({ status: 204 })
  const store = createAppStore({
    auth: { user: { username: 'admin', displayName: 'Admin', roles: ['ADMIN'] }, status: 'ready', error: null },
  })

  store.dispatch(signOut())

  expect(store.getState().auth.user).toBeNull()
  expect(tokenStore.getAccessToken()).toBeNull()
  expect(tokenStore.getRefreshToken()).toBeNull()
  expect(logout).toHaveBeenCalledWith('refresh-1')
})

test('signing out still ends the local session when the auth service cannot be reached', async () => {
  tokenStore.set({ accessToken: 'access-1', refreshToken: 'refresh-1' })
  jest.spyOn(authApi, 'logout').mockRejectedValue(new Error('Network Error'))
  const store = createAppStore({
    auth: { user: { username: 'admin', displayName: 'Admin', roles: ['ADMIN'] }, status: 'ready', error: null },
  })

  store.dispatch(signOut())
  await new Promise((resolve) => setTimeout(resolve, 0))

  expect(store.getState().auth.user).toBeNull()
  expect(tokenStore.getRefreshToken()).toBeNull()
})
