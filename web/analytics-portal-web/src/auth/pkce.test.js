import { createHash } from 'crypto'

import { base64UrlEncode, buildAuthorizeUrl, challengeFor, randomState, randomVerifier } from './pkce'

const SAMPLE_VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'

describe('PKCE helpers', () => {
  test('a verifier has 64 characters by default', () => {
    expect(randomVerifier()).toHaveLength(64)
  })

  test('a verifier uses only unreserved characters', () => {
    expect(randomVerifier()).toMatch(/^[A-Za-z0-9._~-]+$/)
  })

  test('two verifiers are different', () => {
    expect(randomVerifier()).not.toEqual(randomVerifier())
  })

  test('the challenge equals the base64url SHA-256 digest computed by Node', async () => {
    const expected = createHash('sha256').update(SAMPLE_VERIFIER).digest('base64url')
    await expect(challengeFor(SAMPLE_VERIFIER)).resolves.toBe(expected)
  })

  test('the challenge contains no padding and no standard base64 characters', async () => {
    const challenge = await challengeFor(randomVerifier())
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  test('base64UrlEncode replaces + and / and drops the padding', () => {
    expect(base64UrlEncode(new Uint8Array([251, 255]).buffer)).toBe('-_8')
  })

  test('the state is url-safe, 43 characters and different on every call', () => {
    const state = randomState()
    expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(randomState()).not.toEqual(state)
  })

  test('the authorize URL carries the PKCE and state parameters', () => {
    const url = new URL(
      buildAuthorizeUrl({
        authBase: 'http://localhost:9000',
        clientId: 'analytics-portal',
        redirectUri: 'http://localhost:3001/callback',
        scope: 'openid profile dwh.read',
        challenge: 'challenge-value',
        state: 'state-value',
      }),
    )
    expect(`${url.origin}${url.pathname}`).toBe('http://localhost:9000/oauth2/authorize')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('client_id')).toBe('analytics-portal')
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3001/callback')
    expect(url.searchParams.get('scope')).toBe('openid profile dwh.read')
    expect(url.searchParams.get('code_challenge')).toBe('challenge-value')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('state')).toBe('state-value')
  })
})
