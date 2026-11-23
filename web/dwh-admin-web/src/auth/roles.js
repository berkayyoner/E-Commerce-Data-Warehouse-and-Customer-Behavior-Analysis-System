export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  ANALYST: 'ANALYST',
  VIEWER: 'VIEWER',
})

/** Roles that may open the console. A viewer signs in but sees the "no access" page. */
export const CONSOLE_ROLES = Object.freeze([ROLES.ADMIN, ROLES.ANALYST])

/** True when the person holds at least one of the allowed roles. */
export function hasAnyRole(userRoles, allowedRoles) {
  return Array.isArray(userRoles) && allowedRoles.some((role) => userRoles.includes(role))
}

export function isConsoleUser(userRoles) {
  return hasAnyRole(userRoles, CONSOLE_ROLES)
}
