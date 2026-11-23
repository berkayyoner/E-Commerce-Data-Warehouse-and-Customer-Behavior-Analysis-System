export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  ANALYST: 'ANALYST',
  VIEWER: 'VIEWER',
})

/** Roles that may open the portal. A person with any other role signs in and sees the "no access" page. */
export const PORTAL_ROLES = Object.freeze([ROLES.ADMIN, ROLES.ANALYST, ROLES.VIEWER])

/** Roles that also see the customer widgets, which describe individual customers. */
export const CUSTOMER_ROLES = Object.freeze([ROLES.ADMIN, ROLES.ANALYST])

/** True when the person holds at least one of the allowed roles. */
export function hasAnyRole(userRoles, allowedRoles) {
  return Array.isArray(userRoles) && allowedRoles.some((role) => userRoles.includes(role))
}

export function isPortalUser(userRoles) {
  return hasAnyRole(userRoles, PORTAL_ROLES)
}

export function canSeeCustomers(userRoles) {
  return hasAnyRole(userRoles, CUSTOMER_ROLES)
}
