import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

import Splash from '../components/ui/Splash'
import AccessDeniedPage from '../pages/AccessDeniedPage'
import { isPortalUser } from './roles'

/** Every page under the portal needs a signed-in person who holds a portal role. */
export default function RequireAuth() {
  const { user, status } = useSelector((state) => state.auth)

  if (status === 'restoring') {
    return <Splash />
  }
  if (!user) {
    return <Navigate to="/" replace />
  }
  if (!isPortalUser(user.roles)) {
    return <AccessDeniedPage variant="console" />
  }
  return <Outlet />
}
