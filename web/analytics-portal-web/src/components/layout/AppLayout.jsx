import { Outlet } from 'react-router-dom'

import useT from '../../hooks/useT'
import Navbar from './Navbar'

/** The frame around every page: the navbar on top and the page content below it. */
export default function AppLayout() {
  const { t } = useT()

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t('common.skipToContent')}
      </a>
      <Navbar />
      <main id="main-content" className="app-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}
