import { useDispatch, useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'

import useT from '../../hooks/useT'
import { setSidebar } from '../../store/uiSlice'
import Toasts from '../ui/Toasts'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

/** The frame around every page: navbar on top, sidebar on the left once signed in, content in the middle. */
export default function AppLayout() {
  const { t } = useT()
  const dispatch = useDispatch()
  const signedIn = useSelector((state) => Boolean(state.auth.user))
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen)

  return (
    <div className={`app-shell${signedIn && sidebarOpen ? ' sidebar-open' : ''}`}>
      <a className="skip-link" href="#main-content">
        {t('common.skipToContent')}
      </a>
      <Navbar />
      <div className="app-body">
        {signedIn && <Sidebar />}
        {signedIn && sidebarOpen && (
          <button
            type="button"
            className="sidebar-scrim"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => dispatch(setSidebar(false))}
          />
        )}
        <main id="main-content" className="app-content">
          <Outlet />
        </main>
      </div>
      <Toasts />
    </div>
  )
}
