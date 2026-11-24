import * as authApi from './authApi'
import { createApiClient, refreshSession, setLanguageProvider } from './httpClient'
import tokenStore from './tokenStore'

/** Adapter answer for a request that succeeded. */
function ok(config, data) {
  return Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config })
}

/** Adapter answer for a request whose token was rejected. */
function unauthorised(config) {
  const error = new Error('Request failed with status code 401')
  error.config = config
  error.response = { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config }
  return Promise.reject(error)
}

afterEach(() => {
  jest.restoreAllMocks()
  setLanguageProvider(() => 'en')
  tokenStore.clear()
})

test('each request carries the bearer token and the language', async () => {
  tokenStore.set({ accessToken: 'token-1', refreshToken: 'refresh-1' })
  setLanguageProvider(() => 'tr')
  const client = createApiClient('http://api.test')
  client.defaults.adapter = jest.fn((config) => ok(config, {}))

  await client.get('/api/auth/users')

  const sent = client.defaults.adapter.mock.calls[0][0]
  expect(sent.headers.Authorization).toBe('Bearer token-1')
  expect(sent.headers['Accept-Language']).toBe('tr')
})

test('concurrent 401 responses share one refresh and both requests are retried', async () => {
  tokenStore.set({ accessToken: 'stale', refreshToken: 'refresh-1' })
  const refresh = jest.spyOn(authApi, 'refreshTokens').mockImplementation(async () => {
    await new Promise((resolve) => setTimeout(resolve, 5))
    return { access_token: 'fresh', refresh_token: 'refresh-2' }
  })
  const client = createApiClient('http://api.test')
  client.defaults.adapter = jest.fn((config) =>
    config.headers.Authorization === 'Bearer fresh' ? ok(config, { ok: true }) : unauthorised(config),
  )

  const [first, second] = await Promise.all([client.get('/first'), client.get('/second')])

  expect(first.data).toEqual({ ok: true })
  expect(second.data).toEqual({ ok: true })
  expect(refresh).toHaveBeenCalledTimes(1)
  expect(refresh).toHaveBeenCalledWith('refresh-1')
  expect(tokenStore.getAccessToken()).toBe('fresh')
  expect(tokenStore.getRefreshToken()).toBe('refresh-2')
})

test('a failed refresh ends the session and rejects the request', async () => {
  tokenStore.set({ accessToken: 'stale', refreshToken: 'refresh-1' })
  jest.spyOn(authApi, 'refreshTokens').mockRejectedValue(new Error('invalid_grant'))
  const listener = jest.fn()
  const unsubscribe = tokenStore.onSessionEnded(listener)
  const client = createApiClient('http://api.test')
  client.defaults.adapter = jest.fn(unauthorised)

  await expect(client.get('/protected')).rejects.toMatchObject({ response: { status: 401 } })

  expect(listener).toHaveBeenCalledTimes(1)
  expect(tokenStore.getAccessToken()).toBeNull()
  expect(tokenStore.getRefreshToken()).toBeNull()
  unsubscribe()
})

test('a second 401 after a successful refresh ends the session instead of looping', async () => {
  tokenStore.set({ accessToken: 'stale', refreshToken: 'refresh-1' })
  const refresh = jest
    .spyOn(authApi, 'refreshTokens')
    .mockResolvedValue({ access_token: 'fresh', refresh_token: 'refresh-2' })
  const listener = jest.fn()
  const unsubscribe = tokenStore.onSessionEnded(listener)
  const client = createApiClient('http://api.test')
  client.defaults.adapter = jest.fn(unauthorised)

  await expect(client.get('/protected')).rejects.toMatchObject({ response: { status: 401 } })

  expect(refresh).toHaveBeenCalledTimes(1)
  expect(client.defaults.adapter).toHaveBeenCalledTimes(2)
  expect(listener).toHaveBeenCalledTimes(1)
  unsubscribe()
})

test('a 401 without a refresh token ends the session without calling the auth service', async () => {
  tokenStore.clear()
  const refresh = jest.spyOn(authApi, 'refreshTokens')
  const client = createApiClient('http://api.test')
  client.defaults.adapter = jest.fn(unauthorised)

  await expect(client.get('/protected')).rejects.toMatchObject({ response: { status: 401 } })
  expect(refresh).not.toHaveBeenCalled()
})

test('refreshSession stores the rotated pair and resolves with the token response', async () => {
  tokenStore.set({ accessToken: 'stale', refreshToken: 'refresh-1' })
  jest.spyOn(authApi, 'refreshTokens').mockResolvedValue({ access_token: 'fresh', refresh_token: 'refresh-2' })

  const body = await refreshSession()

  expect(body.access_token).toBe('fresh')
  expect(tokenStore.getAccessToken()).toBe('fresh')
  expect(tokenStore.getRefreshToken()).toBe('refresh-2')
})

test('refreshSession rejects when there is no refresh token', async () => {
  tokenStore.clear()

  await expect(refreshSession()).rejects.toThrow('No refresh token')
})
