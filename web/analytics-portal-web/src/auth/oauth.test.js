import { tokenClient } from '../api/httpClient'
import tokenStore from '../api/tokenStore'
import { completeSignIn, startSignIn } from './oauth'

const PENDING_KEY = 'dwh.portal.pkce'
const ORIGINAL_LOCATION = window.location

beforeEach(() => {
  delete window.location
  window.location = { origin: 'http://localhost:3001', assign: jest.fn() }
})

afterEach(() => {
  window.location = ORIGINAL_LOCATION
  jest.restoreAllMocks()
})

describe('sign-in redirect', () => {
  test('startSignIn stores the verifier and state, then redirects with the challenge', async () => {
    await startSignIn()

    const pending = JSON.parse(window.sessionStorage.getItem(PENDING_KEY))
    expect(pending.verifier).toHaveLength(64)
    const target = new URL(window.location.assign.mock.calls[0][0])
    expect(target.searchParams.get('state')).toBe(pending.state)
    expect(target.searchParams.get('code_challenge_method')).toBe('S256')
    expect(target.searchParams.get('redirect_uri')).toBe('http://localhost:3001/callback')
  })

  test('completeSignIn exchanges the code with the verifier and keeps the tokens', async () => {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ verifier: 'verifier-value', state: 'state-1' }))
    const post = jest.spyOn(tokenClient, 'post').mockResolvedValue({
      data: { access_token: 'access-1', refresh_token: 'refresh-1' },
    })

    await completeSignIn('?code=code-1&state=state-1')

    const body = post.mock.calls[0][1]
    expect(body.get('grant_type')).toBe('authorization_code')
    expect(body.get('code')).toBe('code-1')
    expect(body.get('code_verifier')).toBe('verifier-value')
    expect(body.get('client_id')).toBe('analytics-portal')
    expect(tokenStore.getAccessToken()).toBe('access-1')
    expect(tokenStore.getRefreshToken()).toBe('refresh-1')
    expect(window.sessionStorage.getItem(PENDING_KEY)).toBeNull()
  })

  test('completeSignIn rejects a state value that does not match', async () => {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ verifier: 'v', state: 'expected' }))
    const post = jest.spyOn(tokenClient, 'post')

    await expect(completeSignIn('?code=c&state=other')).rejects.toMatchObject({ code: 'stateMismatch' })
    expect(post).not.toHaveBeenCalled()
  })

  test('completeSignIn reports a sign-in that the person denied', async () => {
    await expect(completeSignIn('?error=access_denied')).rejects.toMatchObject({ code: 'denied' })
  })
})
