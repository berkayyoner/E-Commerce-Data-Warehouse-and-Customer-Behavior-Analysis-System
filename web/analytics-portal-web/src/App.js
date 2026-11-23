import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes } from 'react-router-dom'

import RequireAuth from './auth/RequireAuth'
import RequireRole from './auth/RequireRole'
import { isPortalUser } from './auth/roles'
import AppLayout from './components/layout/AppLayout'
import Splash from './components/ui/Splash'
import useT from './hooks/useT'
import AccessDeniedPage from './pages/AccessDeniedPage'
import CallbackPage from './pages/CallbackPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import SearchPage from './pages/search/SearchPage'
import SignInPage from './pages/SignInPage'
import { restoreSession } from './store/authSlice'

/**
 * "/" is the dashboard for a person with a portal role, the sign-in card for a visitor and the no-access page for a
 * person whose roles do not open the portal.
 */
function HomeRoute() {
  const { user, status } = useSelector((state) => state.auth)
  if (status === 'restoring') {
    return <Splash />
  }
  if (!user) {
    return <SignInPage />
  }
  if (!isPortalUser(user.roles)) {
    return <AccessDeniedPage variant="console" />
  }
  return (
    <RequireRole path="/">
      <DashboardPage />
    </RequireRole>
  )
}

export default function App() {
  const dispatch = useDispatch()
  const { t } = useT()
  const status = useSelector((state) => state.auth.status)

  useEffect(() => {
    document.title = t('common.appName')
  }, [t])

  useEffect(() => {
    // The callback page completes its own sign-in; restoring an older session there would race with it.
    if (status === 'restoring' && window.location.pathname !== '/callback') {
      dispatch(restoreSession())
    }
  }, [dispatch, status])

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route element={<RequireAuth />}>
          <Route
            path="/search"
            element={
              <RequireRole path="/search">
                <SearchPage />
              </RequireRole>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
