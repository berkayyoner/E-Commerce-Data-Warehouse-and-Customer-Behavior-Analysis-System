import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import useT from '../../hooks/useT'
import { signOut } from '../../store/authSlice'
import { toggleSidebar } from '../../store/uiSlice'
import Icon from '../ui/Icon'
import LanguageDropdown from './LanguageDropdown'

/**
 * Always visible. Left: menu button (when signed in), logo and application name. Right: the signed-in person's
 * name and role, the sign-out button, and the language dropdown.
 */
export default function Navbar() {
  const { t } = useT()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen)

  function handleSignOut() {
    dispatch(signOut())
    navigate('/login', { replace: true })
  }

  return (
    <header className="navbar">
      <div className="navbar-brand">
        {user && (
          <button
            type="button"
            className="icon-button navbar-menu"
            onClick={() => dispatch(toggleSidebar())}
            aria-label={sidebarOpen ? t('common.sidebar.close') : t('common.sidebar.open')}
            aria-expanded={sidebarOpen}
          >
            <Icon name="menu" size={22} />
          </button>
        )}
        <span className="navbar-logo" aria-hidden="true">
          <Icon name="database" size={22} />
        </span>
        <span className="navbar-title">{t('common.appName')}</span>
      </div>

      <div className="navbar-actions">
        {user && (
          <>
            <span className="navbar-user" title={t('common.user.signedInAs', { name: user.displayName })}>
              <span className="navbar-username">{user.displayName}</span>
              {user.roles.map((role) => (
                <span key={role} className="badge badge-info">
                  {t(`common.roles.${role}`)}
                </span>
              ))}
            </span>
            <button type="button" className="button button-ghost" onClick={handleSignOut}>
              <Icon name="logout" size={16} />
              <span>{t('common.actions.signOut')}</span>
            </button>
          </>
        )}
        <LanguageDropdown />
      </div>
    </header>
  )
}
