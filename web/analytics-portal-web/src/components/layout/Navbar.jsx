import { useDispatch, useSelector } from 'react-redux'
import { NavLink, useNavigate } from 'react-router-dom'

import useRoles from '../../auth/useRoles'
import useT from '../../hooks/useT'
import { NAV_ITEMS } from '../../navigation/navItems'
import { signOut } from '../../store/authSlice'
import { closeMenu, toggleMenu } from '../../store/uiSlice'
import Icon from '../ui/Icon'
import LanguageDropdown from './LanguageDropdown'

/**
 * Top bar of the portal. The navigation sits in the bar from the tablet width up; on phones a menu button expands it
 * underneath. The right side holds the signed-in person, the sign-out button and the language choice.
 */
export default function Navbar() {
  const { t } = useT()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { hasAnyRole } = useRoles()
  const user = useSelector((state) => state.auth.user)
  const menuOpen = useSelector((state) => state.ui.menuOpen)
  const items = NAV_ITEMS.filter((item) => hasAnyRole(item.roles))

  function handleSignOut() {
    dispatch(signOut())
    navigate('/', { replace: true })
  }

  return (
    <header className="navbar">
      <div className="navbar-bar">
        <div className="navbar-brand">
          <span className="navbar-logo" aria-hidden="true">
            <Icon name="chart" size={22} />
          </span>
          <span className="navbar-title">{t('common.appName')}</span>
        </div>

        {user && (
          <button
            type="button"
            className="icon-button navbar-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            aria-label={menuOpen ? t('common.menu.close') : t('common.menu.open')}
            onClick={() => dispatch(toggleMenu())}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
          </button>
        )}

        {user && (
          <nav
            id="primary-navigation"
            className={`primary-nav${menuOpen ? ' is-open' : ''}`}
            aria-label={t('common.menu.label')}
          >
            <ul className="primary-nav-list">
              {items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
                    onClick={() => dispatch(closeMenu())}
                  >
                    <Icon name={item.icon} size={18} />
                    <span>{t(item.labelKey)}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="navbar-actions">
          {user && (
            <span className="navbar-user" title={t('common.user.signedInAs', { name: user.username })}>
              <span className="navbar-username">{user.username}</span>
              {user.roles.map((role) => (
                <span key={role} className="badge badge-info">
                  {t(`common.roles.${role}`)}
                </span>
              ))}
            </span>
          )}
          <LanguageDropdown />
          {user && (
            <button type="button" className="button button-ghost navbar-signout" onClick={handleSignOut}>
              <Icon name="logout" size={16} />
              <span>{t('common.actions.signOut')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
