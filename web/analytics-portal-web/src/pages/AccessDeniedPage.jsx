import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import PageTitle from '../components/layout/PageTitle'
import Icon from '../components/ui/Icon'
import useT from '../hooks/useT'
import { signOut } from '../store/authSlice'

/**
 * Shown instead of a page the person may not use. variant "console" is for a signed-in person without a console
 * role; variant "page" is for a page outside the person's roles. The only action is to sign out.
 */
export default function AccessDeniedPage({ variant = 'page' }) {
  const { t } = useT()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  function handleSignOut() {
    dispatch(signOut())
    navigate('/', { replace: true })
  }

  return (
    <div className="page">
      <PageTitle title={t(`auth.accessDenied.${variant}.title`)} />
      <section className="panel access-denied">
        <Icon name="shield" size={36} />
        <p>{t(`auth.accessDenied.${variant}.message`)}</p>
        <button type="button" className="button button-primary" onClick={handleSignOut}>
          <Icon name="logout" size={16} />
          <span>{t('common.actions.signOut')}</span>
        </button>
      </section>
    </div>
  )
}
