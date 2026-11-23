import { NAV_ITEMS, allowedRolesFor } from '../navigation/navItems'
import { ROLES, hasAnyRole, isConsoleUser } from './roles'

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

test('the personnel accounts page is for administrators only', () => {
  expect(allowedRolesFor('/users')).toEqual([ROLES.ADMIN])
})

test('an unknown path allows nobody', () => {
  expect(allowedRolesFor('/reports')).toEqual([])
})

test('an analyst sees every page except the personnel accounts', () => {
  const visible = NAV_ITEMS.filter((item) => hasAnyRole(['ANALYST'], item.roles)).map((item) => item.path)
  expect(visible).toEqual([
    '/dashboard',
    '/customers',
    '/products',
    '/warehouses',
    '/orders',
    '/etl',
    '/segments',
  ])
})
