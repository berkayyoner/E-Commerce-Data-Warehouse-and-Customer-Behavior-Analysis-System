import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import AccessDeniedPage from '../pages/AccessDeniedPage'
import { hasPageAccess } from './roles'

/**
 * Everything under the application needs a signed-in person. A visitor is sent to the login page with the address
 * they asked for, so that the sign-in can return them there. Each page then checks its own roles (RequireRole).
 */
export default function RequireAuth() {
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)

  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }
  if (!hasPageAccess(user.roles)) {
    return <AccessDeniedPage variant="console" />
  }
  return <Outlet />
}
