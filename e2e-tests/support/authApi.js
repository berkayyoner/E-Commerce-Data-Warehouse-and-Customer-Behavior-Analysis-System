const config = require('../config')

/** Sends a JSON request to the auth service and returns the status and the parsed body (or null). */
async function authRequest(method, path, { token, body } = {}) {
  const headers = { Accept: 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  const response = await fetch(`${config.authUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  return { status: response.status, body: text ? JSON.parse(text) : null }
}

/** An access token for the administrator, obtained from the sign-in endpoint of the auth service. */
async function adminToken() {
  const { status, body } = await authRequest('POST', '/auth/login', {
    body: { username: config.admin.username, password: config.admin.password },
  })
  if (status !== 200 || !body || !body.access_token) {
    throw new Error(`administrator sign-in failed with status ${status}`)
  }
  return body.access_token
}

/** Creates a personnel account through the user API. Returns the created account. */
async function createUser({ username, displayName, role, password }) {
  const token = await adminToken()
  const { status, body } = await authRequest('POST', '/api/auth/users', {
    token,
    body: { username, displayName, role, password },
  })
  if (status !== 201) {
    throw new Error(`creating ${username} failed with status ${status}`)
  }
  return body
}

/** Removes a personnel account by its username. Does nothing when the account does not exist. */
async function deleteUserIfPresent(username) {
  const token = await adminToken()
  const search = await authRequest('GET', `/api/auth/users?search=${encodeURIComponent(username)}&size=100`, { token })
  const match = ((search.body && search.body.content) || []).find((user) => user.username === username)
  if (!match) {
    return false
  }
  const removed = await authRequest('DELETE', `/api/auth/users/${match.id}`, { token })
  if (removed.status !== 204) {
    throw new Error(`deleting ${username} failed with status ${removed.status}`)
  }
  return true
}

module.exports = { adminToken, createUser, deleteUserIfPresent }
