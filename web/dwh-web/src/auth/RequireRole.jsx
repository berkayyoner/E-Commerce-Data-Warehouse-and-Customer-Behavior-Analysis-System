import useRoles from './useRoles'
import AccessDeniedPage from '../pages/AccessDeniedPage'
import { allowedRolesFor } from '../navigation/navItems'

/** Renders the page only when the person's roles allow the path (see navigation/navItems.js). */
export default function RequireRole({ path, children }) {
  const { hasAnyRole } = useRoles()
  if (!hasAnyRole(allowedRolesFor(path))) {
    return <AccessDeniedPage variant="page" />
  }
  return children
}
