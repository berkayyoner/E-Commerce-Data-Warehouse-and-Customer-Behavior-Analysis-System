import { ROLES } from '../auth/roles'

/**
 * Sidebar entries. Adding a page is one line: its route, icon name, translation key of its label and the
 * roles allowed to open it. The route itself is registered in App.js with the same path.
 */
const CONSOLE = [ROLES.ADMIN, ROLES.ANALYST]

export const NAV_ITEMS = Object.freeze([
  { path: '/dashboard', icon: 'dashboard', labelKey: 'navigation.items.dashboard', roles: CONSOLE },
  { path: '/customers', icon: 'customers', labelKey: 'navigation.items.customers', roles: CONSOLE },
  { path: '/products', icon: 'package', labelKey: 'navigation.items.products', roles: CONSOLE },
  { path: '/warehouses', icon: 'warehouse', labelKey: 'navigation.items.warehouses', roles: CONSOLE },
  { path: '/orders', icon: 'receipt', labelKey: 'navigation.items.orders', roles: CONSOLE },
  { path: '/etl', icon: 'workflow', labelKey: 'navigation.items.etlRuns', roles: CONSOLE },
  { path: '/segments', icon: 'segments', labelKey: 'navigation.items.segments', roles: CONSOLE },
  { path: '/users', icon: 'users', labelKey: 'navigation.items.users', roles: [ROLES.ADMIN] },
])

/** Roles allowed to open a path. An unknown path allows nobody. */
export function allowedRolesFor(path) {
  const item = NAV_ITEMS.find((entry) => entry.path === path)
  return item ? item.roles : []
}
