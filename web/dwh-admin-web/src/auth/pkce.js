/** Characters allowed in a PKCE code verifier (RFC 7636, section 4.1). */
const VERIFIER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

/** Random verifier of the given length. Bytes outside an even split of the alphabet are skipped (no bias). */
export function randomVerifier(length = 64) {
  const limit = 256 - (256 % VERIFIER_CHARS.length)
  const result = []
  while (result.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length))
    for (const byte of bytes) {
      if (byte < limit && result.length < length) {
        result.push(VERIFIER_CHARS[byte % VERIFIER_CHARS.length])
      }
    }
  }
  return result.join('')
}

/** Base64url without padding, the encoding PKCE uses for the challenge and the state. */
export function base64UrlEncode(buffer) {
  let binary = ''
  new Uint8Array(buffer).forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** S256 code challenge: base64url(SHA-256(verifier)). */
export async function challengeFor(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64UrlEncode(digest)
}

/** Opaque value that ties the redirect back to this browser. */
export function randomState() {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)))
}

/** The authorization request URL of the authorization code flow with PKCE. */
export function buildAuthorizeUrl({ authBase, clientId, redirectUri, scope, challenge, state }) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  })
  return `${authBase}/oauth2/authorize?${params.toString()}`
}
