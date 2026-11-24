import { NAV_ITEMS, allowedRolesFor } from '../navigation/navItems'
import { ROLES, hasAnyRole, hasPageAccess, isConsoleUser } from './roles'

test('hasAnyRole is true when one of the allowed roles is held', () => {
  expect(hasAnyRole(['ANALYST'], [ROLES.ADMIN, ROLES.ANALYST])).toBe(true)
})

test('hasAnyRole is false without the allowed roles or without any roles', () => {
  expect(hasAnyRole(['VIEWER'], [ROLES.ADMIN])).toBe(false)
  expect(hasAnyRole(undefined, [ROLES.ADMIN])).toBe(false)
})

test('console access belongs to administrators and analysts, not to viewers', () => {
  expect(isConsoleUser(['ADMIN'])).toBe(true)
  expect(isConsoleUser(['ANALYST'])).toBe(true)
  expect(isConsoleUser(['VIEWER'])).toBe(false)
})

test('every role may sign in to open at least one page, but a person without a role may not', () => {
  expect(hasPageAccess(['VIEWER'])).toBe(true)
  expect(hasPageAccess(['ADMIN'])).toBe(true)
  expect(hasPageAccess([])).toBe(false)
})

test('the personnel accounts page is for administrators only', () => {
  expect(allowedRolesFor('/users')).toEqual([ROLES.ADMIN])
})

test('an unknown path allows nobody', () => {
  expect(allowedRolesFor('/reports')).toEqual([])
})

test('an analyst sees every console page except the personnel accounts, and the analytics pages', () => {
  const visible = NAV_ITEMS.filter((item) => hasAnyRole(['ANALYST'], item.roles)).map((item) => item.path)
  expect(visible).toEqual([
    '/dashboard',
    '/customers',
    '/products',
    '/warehouses',
    '/orders',
    '/etl',
    '/segments',
    '/analytics/sales',
    '/analytics/search',
  ])
})

test('a viewer may open only the analytics pages', () => {
  const visible = NAV_ITEMS.filter((item) => hasAnyRole(['VIEWER'], item.roles)).map((item) => item.path)
  expect(visible).toEqual(['/analytics/sales', '/analytics/search'])
})
