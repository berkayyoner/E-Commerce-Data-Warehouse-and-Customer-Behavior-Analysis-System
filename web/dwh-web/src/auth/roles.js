export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  ANALYST: 'ANALYST',
  VIEWER: 'VIEWER',
})

/** Roles that may open the console pages. A viewer may only open the analytics pages. */
export const CONSOLE_ROLES = Object.freeze([ROLES.ADMIN, ROLES.ANALYST])

/** Roles that may open at least one page. Each page lists its own roles in navigation/navItems.js. */
export const PAGE_ROLES = Object.freeze([ROLES.ADMIN, ROLES.ANALYST, ROLES.VIEWER])

/** Roles that also see the customer widgets of the sales overview, which describe individual customers. */
export const CUSTOMER_ROLES = Object.freeze([ROLES.ADMIN, ROLES.ANALYST])

/** True when the person holds at least one of the allowed roles. */
export function hasAnyRole(userRoles, allowedRoles) {
  return Array.isArray(userRoles) && allowedRoles.some((role) => userRoles.includes(role))
}

export function isConsoleUser(userRoles) {
  return hasAnyRole(userRoles, CONSOLE_ROLES)
}

/** True when the person may sign in to the application and open at least one of its pages. */
export function hasPageAccess(userRoles) {
  return hasAnyRole(userRoles, PAGE_ROLES)
}
