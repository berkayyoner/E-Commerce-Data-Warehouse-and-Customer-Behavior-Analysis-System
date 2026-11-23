import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes } from 'react-router-dom'

import RequireAuth from './auth/RequireAuth'
import RequireRole from './auth/RequireRole'
import AppLayout from './components/layout/AppLayout'
import Splash from './components/ui/Splash'
import useT from './hooks/useT'
import CallbackPage from './pages/CallbackPage'
import CustomersPage from './pages/customers/CustomersPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import EtlRunsPage from './pages/etl/EtlRunsPage'
import OrdersPage from './pages/orders/OrdersPage'
import ProductsPage from './pages/products/ProductsPage'
import SegmentsPage from './pages/segments/SegmentsPage'
import SignInPage from './pages/SignInPage'
import UsersPage from './pages/users/UsersPage'
import WarehousesPage from './pages/warehouses/WarehousesPage'
import { restoreSession } from './store/authSlice'

/** "/" shows the sign-in card to a visitor and the dashboard to a person who is signed in. */
function HomeRoute() {
  const { user, status } = useSelector((state) => state.auth)
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  if (status === 'restoring') {
    return <Splash />
  }
  return <SignInPage />
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
            path="/dashboard"
            element={
              <RequireRole path="/dashboard">
                <DashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/customers"
            element={
              <RequireRole path="/customers">
                <CustomersPage />
              </RequireRole>
            }
          />
          <Route
            path="/products"
            element={
              <RequireRole path="/products">
                <ProductsPage />
              </RequireRole>
            }
          />
          <Route
            path="/warehouses"
            element={
              <RequireRole path="/warehouses">
                <WarehousesPage />
              </RequireRole>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireRole path="/orders">
                <OrdersPage />
              </RequireRole>
            }
          />
          <Route
            path="/etl"
            element={
              <RequireRole path="/etl">
                <EtlRunsPage />
              </RequireRole>
            }
          />
          <Route
            path="/segments"
            element={
              <RequireRole path="/segments">
                <SegmentsPage />
              </RequireRole>
            }
          />
          <Route
            path="/users"
            element={
              <RequireRole path="/users">
                <UsersPage />
              </RequireRole>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
