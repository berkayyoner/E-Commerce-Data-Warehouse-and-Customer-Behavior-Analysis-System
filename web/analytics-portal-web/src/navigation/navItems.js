import { PORTAL_ROLES } from '../auth/roles'

/**
 * Navigation entries. Adding a page is one line: its route, icon name, translation key of its label and the
 * roles allowed to open it. The route itself is registered in App.js with the same path.
 */
export const NAV_ITEMS = Object.freeze([
  { path: '/', icon: 'dashboard', labelKey: 'navigation.items.dashboard', roles: PORTAL_ROLES },
  { path: '/search', icon: 'search', labelKey: 'navigation.items.search', roles: PORTAL_ROLES },
])

/** Roles allowed to open a path. An unknown path allows nobody. */
export function allowedRolesFor(path) {
  const item = NAV_ITEMS.find((entry) => entry.path === path)
  return item ? item.roles : []
}
