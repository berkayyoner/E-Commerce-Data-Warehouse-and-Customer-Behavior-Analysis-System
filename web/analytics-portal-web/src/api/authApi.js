import { apiClients } from './httpClient'

/** The signed-in person as the auth service describes them: { username, roles }. */
export async function fetchCurrentUser() {
  const response = await apiClients.auth.get('/api/auth/me')
  return { username: response.data.username, roles: response.data.roles || [] }
}
