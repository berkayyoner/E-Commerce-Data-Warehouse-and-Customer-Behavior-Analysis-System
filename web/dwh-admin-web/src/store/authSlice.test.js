import * as authApi from '../api/authApi'
import { tokenClient } from '../api/httpClient'
import tokenStore from '../api/tokenStore'
import { createAppStore } from './store'
import { restoreSession, signOut } from './authSlice'

afterEach(() => {
  jest.restoreAllMocks()
})

test('restoring a session exchanges the refresh token and then loads the person', async () => {
  tokenStore.set({ accessToken: 'access-1', refreshToken: 'refresh-1' })
  jest.spyOn(tokenClient, 'post').mockResolvedValue({ data: { access_token: 'access-2', refresh_token: 'refresh-2' } })
  jest.spyOn(authApi, 'fetchCurrentUser').mockResolvedValue({ username: 'admin', roles: ['ADMIN'] })
  const store = createAppStore()

  await store.dispatch(restoreSession())

  expect(store.getState().auth).toMatchObject({ user: { username: 'admin', roles: ['ADMIN'] }, status: 'ready' })
})

test('a failed restore leaves the person signed out and forgets the refresh token', async () => {
  tokenStore.set({ accessToken: 'access-1', refreshToken: 'refresh-1' })
  jest.spyOn(tokenClient, 'post').mockRejectedValue(new Error('invalid_grant'))
  const store = createAppStore()

  await store.dispatch(restoreSession())

  expect(store.getState().auth).toMatchObject({ user: null, status: 'idle' })
  expect(tokenStore.getRefreshToken()).toBeNull()
})

test('signing out clears the tokens and the signed-in person', () => {
  tokenStore.set({ accessToken: 'access-1', refreshToken: 'refresh-1' })
  const store = createAppStore({
    auth: { user: { username: 'admin', roles: ['ADMIN'] }, status: 'ready', error: null },
  })

  store.dispatch(signOut())

  expect(store.getState().auth.user).toBeNull()
  expect(tokenStore.getRefreshToken()).toBeNull()
})
