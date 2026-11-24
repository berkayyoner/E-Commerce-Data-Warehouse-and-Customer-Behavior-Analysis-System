import tokenStore from './tokenStore'

const REFRESH_KEY = 'dwh.console.refreshToken'

afterEach(() => {
  tokenStore.clear()
  jest.restoreAllMocks()
})

test('the access token stays in memory and the refresh token goes to sessionStorage', () => {
  tokenStore.set({ accessToken: 'access-1', refreshToken: 'refresh-1' })

  expect(tokenStore.getAccessToken()).toBe('access-1')
  expect(window.sessionStorage.getItem(REFRESH_KEY)).toBe('refresh-1')
  expect(tokenStore.getRefreshToken()).toBe('refresh-1')
})

test('the access token is never written to sessionStorage', () => {
  tokenStore.set({ accessToken: 'access-1', refreshToken: 'refresh-1' })

  const stored = Object.keys(window.sessionStorage).map((key) => window.sessionStorage.getItem(key))
  expect(stored.join(' ')).not.toContain('access-1')
})

test('clear removes both tokens', () => {
  tokenStore.set({ accessToken: 'access-1', refreshToken: 'refresh-1' })

  tokenStore.clear()

  expect(tokenStore.getAccessToken()).toBeNull()
  expect(tokenStore.getRefreshToken()).toBeNull()
})

test('setting tokens without a new refresh token keeps the stored one', () => {
  tokenStore.set({ accessToken: 'access-1', refreshToken: 'refresh-1' })

  tokenStore.set({ accessToken: 'access-2' })

  expect(tokenStore.getAccessToken()).toBe('access-2')
  expect(tokenStore.getRefreshToken()).toBe('refresh-1')
})

test('endSession clears the tokens and tells every subscriber', () => {
  const listener = jest.fn()
  const unsubscribe = tokenStore.onSessionEnded(listener)
  tokenStore.set({ accessToken: 'access-1', refreshToken: 'refresh-1' })

  tokenStore.endSession()

  expect(listener).toHaveBeenCalledTimes(1)
  expect(tokenStore.getAccessToken()).toBeNull()
  expect(tokenStore.getRefreshToken()).toBeNull()
  unsubscribe()
})

test('an unsubscribed listener is not called when the session ends', () => {
  const listener = jest.fn()
  const unsubscribe = tokenStore.onSessionEnded(listener)
  unsubscribe()

  tokenStore.endSession()

  expect(listener).not.toHaveBeenCalled()
})

test('storage failures are ignored so that sign-in keeps working in private mode', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota exceeded')
  })

  expect(() => tokenStore.set({ accessToken: 'access-1', refreshToken: 'refresh-1' })).not.toThrow()
  expect(tokenStore.getAccessToken()).toBe('access-1')
})
