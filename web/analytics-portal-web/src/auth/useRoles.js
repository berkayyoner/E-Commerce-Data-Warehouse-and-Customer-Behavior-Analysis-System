import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { CUSTOMER_ROLES, ROLES, hasAnyRole } from './roles'

/** The signed-in person's roles and the checks the screens need. */
export default function useRoles() {
  const roles = useSelector((state) => state.auth.user?.roles)
  return useMemo(() => {
    const list = roles || []
    return {
      roles: list,
      isAdmin: list.includes(ROLES.ADMIN),
      canSeeCustomers: hasAnyRole(list, CUSTOMER_ROLES),
      hasAnyRole: (allowedRoles) => hasAnyRole(list, allowedRoles),
    }
  }, [roles])
}
