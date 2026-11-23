import { ROLES } from '../auth/roles'

/**
 * Sidebar entries. Adding a page is one line: its route, icon name, translation key of its label and the
 * roles allowed to open it. The route itself is registered in App.js with the same path.
 */
export const NAV_ITEMS = Object.freeze([
  { path: '/dashboard', icon: 'dashboard', labelKey: 'navigation.items.dashboard', roles: [ROLES.ADMIN, ROLES.ANALYST] },
  { path: '/etl', icon: 'workflow', labelKey: 'navigation.items.etlRuns', roles: [ROLES.ADMIN, ROLES.ANALYST] },
  { path: '/users', icon: 'users', labelKey: 'navigation.items.users', roles: [ROLES.ADMIN] },
])

/** Roles allowed to open a path. An unknown path allows nobody. */
export function allowedRolesFor(path) {
  const item = NAV_ITEMS.find((entry) => entry.path === path)
  return item ? item.roles : []
}
