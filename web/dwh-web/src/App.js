import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes } from 'react-router-dom'

import RequireAuth from './auth/RequireAuth'
import RequireRole from './auth/RequireRole'
import { isConsoleUser } from './auth/roles'
import AppLayout from './components/layout/AppLayout'
import Splash from './components/ui/Splash'
import useT from './hooks/useT'
import SalesOverviewPage from './pages/analytics/sales/SalesOverviewPage'
import SearchPage from './pages/analytics/search/SearchPage'
import CustomersPage from './pages/customers/CustomersPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import EtlRunsPage from './pages/etl/EtlRunsPage'
import LoginPage from './pages/LoginPage'
import OrdersPage from './pages/orders/OrdersPage'
import ProductsPage from './pages/products/ProductsPage'
import SegmentsPage from './pages/segments/SegmentsPage'
import UsersPage from './pages/users/UsersPage'
import WarehousesPage from './pages/warehouses/WarehousesPage'
import { restoreSession } from './store/authSlice'

/** "/" opens the operational dashboard for console staff and the sales overview for the other roles. */
function HomeRedirect() {
  const roles = useSelector((state) => state.auth.user?.roles)
  return <Navigate to={isConsoleUser(roles) ? '/dashboard' : '/analytics/sales'} replace />
}

export default function App() {
  const dispatch = useDispatch()
  const { t } = useT()
  const status = useSelector((state) => state.auth.status)

  useEffect(() => {
    document.title = t('common.appName')
  }, [t])

  useEffect(() => {
    if (status === 'restoring') {
      dispatch(restoreSession())
    }
  }, [dispatch, status])

  // Nothing is shown until the stored session has been checked, so no page flashes before the answer is known.
  if (status === 'restoring') {
    return <Splash />
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/login" element={<LoginPage />} />
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
            path="/analytics/sales"
            element={
              <RequireRole path="/analytics/sales">
                <SalesOverviewPage />
              </RequireRole>
            }
          />
          <Route
            path="/analytics/search"
            element={
              <RequireRole path="/analytics/search">
                <SearchPage />
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
          <Route path="/" element={<HomeRedirect />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
