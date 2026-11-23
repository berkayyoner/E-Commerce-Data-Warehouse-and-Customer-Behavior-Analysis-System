import tokenStore from '../api/tokenStore'
import { peekReturnTo } from './oauth'

const RETURN_KEY = 'dwh.admin.returnTo'

beforeEach(() => {
  window.sessionStorage.clear()
  tokenStore.clear()
})

describe('remembering a signed in tab', () => {
  test('a stored token pair marks the tab as signed in', () => {
    expect(tokenStore.wasSignedIn()).toBe(false)

    tokenStore.set({ accessToken: 'access-1' })

    expect(tokenStore.wasSignedIn()).toBe(true)
  })

  test('clearing the tokens forgets the tab, so a sign out is not undone by a silent sign in', () => {
    tokenStore.set({ accessToken: 'access-1' })

    tokenStore.clear()

    expect(tokenStore.wasSignedIn()).toBe(false)
  })

  test('the marker survives in session storage for a reload of the same tab', () => {
    tokenStore.set({ accessToken: 'access-1' })

    expect(window.sessionStorage.getItem('dwh.admin.signedIn')).toBe('1')
  })
})

describe('the page to return to after sign in', () => {
  test('a path of this application is accepted', () => {
    window.sessionStorage.setItem(RETURN_KEY, '/search?q=kitchen')

    expect(peekReturnTo()).toBe('/search?q=kitchen')
  })

  test.each(['https://example.org/phish', '//example.org', 'search', '/callback?code=1'])(
    'the value %s is refused',
    (value) => {
      window.sessionStorage.setItem(RETURN_KEY, value)

      expect(peekReturnTo()).toBeNull()
    },
  )

  test('nothing is returned when no page was stored', () => {
    expect(peekReturnTo()).toBeNull()
  })
})
