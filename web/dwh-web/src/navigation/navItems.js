import { ROLES, CONSOLE_ROLES, PAGE_ROLES } from '../auth/roles'

/**
 * Sidebar entries. Adding a page is one line: its route, icon name, translation key of its label and the
 * roles allowed to open it. The route itself is registered in App.js with the same path. Entries with a group
 * are listed under that group's heading.
 */
export const NAV_ITEMS = Object.freeze([
  { path: '/dashboard', icon: 'dashboard', labelKey: 'navigation.items.dashboard', roles: CONSOLE_ROLES },
  { path: '/customers', icon: 'customers', labelKey: 'navigation.items.customers', roles: CONSOLE_ROLES },
  { path: '/products', icon: 'package', labelKey: 'navigation.items.products', roles: CONSOLE_ROLES },
  { path: '/warehouses', icon: 'warehouse', labelKey: 'navigation.items.warehouses', roles: CONSOLE_ROLES },
  { path: '/orders', icon: 'receipt', labelKey: 'navigation.items.orders', roles: CONSOLE_ROLES },
  { path: '/etl', icon: 'workflow', labelKey: 'navigation.items.etlRuns', roles: CONSOLE_ROLES },
  { path: '/segments', icon: 'segments', labelKey: 'navigation.items.segments', roles: CONSOLE_ROLES },
  { path: '/users', icon: 'users', labelKey: 'navigation.items.users', roles: [ROLES.ADMIN] },
  {
    path: '/analytics/sales',
    icon: 'chart',
    labelKey: 'navigation.items.salesOverview',
    roles: PAGE_ROLES,
    group: 'analytics',
  },
  {
    path: '/analytics/search',
    icon: 'search',
    labelKey: 'navigation.items.productSearch',
    roles: PAGE_ROLES,
    group: 'analytics',
  },
])

/** Roles allowed to open a path. An unknown path allows nobody. */
export function allowedRolesFor(path) {
  const item = NAV_ITEMS.find((entry) => entry.path === path)
  return item ? item.roles : []
}
