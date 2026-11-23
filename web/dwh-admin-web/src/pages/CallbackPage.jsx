import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate } from 'react-router-dom'

import PageTitle from '../components/layout/PageTitle'
import Splash from '../components/ui/Splash'
import useT from '../hooks/useT'
import { finishSignIn } from '../store/authSlice'

const KNOWN_ERRORS = ['denied', 'stateMismatch', 'failed']

/** Landing page of the authorization redirect: completes the sign-in and then opens the dashboard. */
export default function CallbackPage() {
  const { t } = useT()
  const dispatch = useDispatch()
  const { user, error } = useSelector((state) => state.auth)
  const started = useRef(false)

  useEffect(() => {
    // The authorization code can be used once, so the exchange starts only once even in development mode.
    if (started.current) {
      return
    }
    started.current = true
    dispatch(finishSignIn(window.location.search))
  }, [dispatch])

  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  if (error) {
    const code = KNOWN_ERRORS.includes(error) ? error : 'failed'
    return (
      <div className="page">
        <PageTitle title={t('auth.callback.failedTitle')} />
        <section className="panel sign-in-card">
          <p className="form-alert" role="alert">
            {t(`auth.callback.errors.${code}`)}
          </p>
          <Link to="/" className="button button-primary">
            <span>{t('common.actions.signIn')}</span>
          </Link>
        </section>
      </div>
    )
  }
  return <Splash />
}
