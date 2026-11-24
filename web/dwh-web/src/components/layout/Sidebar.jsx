import { useId } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'

import useRoles from '../../auth/useRoles'
import useT from '../../hooks/useT'
import { NAV_ITEMS } from '../../navigation/navItems'
import { setSidebar } from '../../store/uiSlice'
import Icon from '../ui/Icon'

const MOBILE_BREAKPOINT = 900

/** Menu on the left. Only the entries the person's roles allow are listed. Collapses on narrow screens. */
export default function Sidebar() {
  const { t } = useT()
  const dispatch = useDispatch()
  const open = useSelector((state) => state.ui.sidebarOpen)
  const { hasAnyRole } = useRoles()
  const groupHeadingId = useId()
  const items = NAV_ITEMS.filter((item) => hasAnyRole(item.roles))
  const pageItems = items.filter((item) => !item.group)
  const groupedItems = items.filter((item) => item.group)

  function closeOnNarrowScreen() {
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      dispatch(setSidebar(false))
    }
  }

  function renderLinks(list) {
    return list.map((item) => (
      <li key={item.path}>
        <NavLink
          to={item.path}
          className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
          tabIndex={open ? 0 : -1}
          onClick={closeOnNarrowScreen}
        >
          <Icon name={item.icon} />
          <span>{t(item.labelKey)}</span>
        </NavLink>
      </li>
    ))
  }

  return (
    <nav
      className={`sidebar${open ? ' is-open' : ''}`}
      aria-label={t('common.sidebar.label')}
      aria-hidden={!open}
    >
      <ul className="sidebar-list">{renderLinks(pageItems)}</ul>
      {groupedItems.length > 0 && (
        <section className="sidebar-group" aria-labelledby={groupHeadingId}>
          <h2 id={groupHeadingId} className="sidebar-group-title">
            {t('navigation.groups.analytics')}
          </h2>
          <ul className="sidebar-list">{renderLinks(groupedItems)}</ul>
        </section>
      )}
    </nav>
  )
}
