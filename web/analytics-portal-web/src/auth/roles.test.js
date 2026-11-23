import { canSeeCustomers, hasAnyRole, isPortalUser } from './roles'

test('ADMIN, ANALYST and VIEWER may open the portal', () => {
  expect(isPortalUser(['ADMIN'])).toBe(true)
  expect(isPortalUser(['ANALYST'])).toBe(true)
  expect(isPortalUser(['VIEWER'])).toBe(true)
})

test('a person with an unknown role or no role gets no portal access', () => {
  expect(isPortalUser(['GUEST'])).toBe(false)
  expect(isPortalUser([])).toBe(false)
  expect(isPortalUser(undefined)).toBe(false)
})

test('only ADMIN and ANALYST see the customer widgets', () => {
  expect(canSeeCustomers(['ADMIN'])).toBe(true)
  expect(canSeeCustomers(['ANALYST'])).toBe(true)
  expect(canSeeCustomers(['VIEWER'])).toBe(false)
})

test('a role check is true when the person holds at least one allowed role', () => {
  expect(hasAnyRole(['VIEWER', 'ANALYST'], ['ANALYST'])).toBe(true)
  expect(hasAnyRole(['VIEWER'], ['ADMIN', 'ANALYST'])).toBe(false)
  expect(hasAnyRole(null, ['ADMIN'])).toBe(false)
})
