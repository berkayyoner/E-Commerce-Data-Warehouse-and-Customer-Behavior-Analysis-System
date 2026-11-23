import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

import Splash from '../components/ui/Splash'
import AccessDeniedPage from '../pages/AccessDeniedPage'
import { isConsoleUser } from './roles'

/** Everything under the console needs a signed-in person who holds a console role. */
export default function RequireAuth() {
  const { user, status } = useSelector((state) => state.auth)

  if (status === 'restoring') {
    return <Splash />
  }
  if (!user) {
    return <Navigate to="/" replace />
  }
  if (!isConsoleUser(user.roles)) {
    return <AccessDeniedPage variant="console" />
  }
  return <Outlet />
}
