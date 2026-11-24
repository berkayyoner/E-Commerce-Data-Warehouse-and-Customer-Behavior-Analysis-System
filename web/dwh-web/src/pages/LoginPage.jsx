import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'

import PageTitle from '../components/layout/PageTitle'
import FormField from '../components/ui/FormField'
import Icon from '../components/ui/Icon'
import { isConsoleUser } from '../auth/roles'
import useT from '../hooks/useT'
import { clearError, signIn } from '../store/authSlice'

const DEFAULT_PAGE = '/dashboard'
const ANALYTICS_PAGE = '/analytics/sales'

/**
 * The page to open after sign in: the one the visitor asked for, if it is a path of this application. Without one,
 * console staff land on the dashboard and the other roles on the sales overview.
 */
export function returnPathFrom(state, roles) {
  const from = state && state.from
  const usable = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login')
  if (usable) {
    return from
  }
  return roles && !isConsoleUser(roles) ? ANALYTICS_PAGE : DEFAULT_PAGE
}

/** Centred card with the title, username and password fields and one sign-in button. */
export default function LoginPage() {
  const { t } = useT()
  const dispatch = useDispatch()
  const location = useLocation()
  const { user, status, error } = useSelector((state) => state.auth)
  const [values, setValues] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  if (user) {
    return <Navigate to={returnPathFrom(location.state, user.roles)} replace />
  }

  const busy = status === 'loading'

  function update(field) {
    return (event) => {
      setValues((previous) => ({ ...previous, [field]: event.target.value }))
      if (error) {
        dispatch(clearError())
      }
    }
  }

  function submit(event) {
    event.preventDefault()
    const found = {}
    if (!values.username.trim()) {
      found.username = t('common.validation.required')
    }
    if (!values.password) {
      found.password = t('common.validation.required')
    }
    setFieldErrors(found)
    if (Object.keys(found).length > 0) {
      return
    }
    dispatch(signIn({ username: values.username.trim(), password: values.password }))
  }

  return (
    <div className="login-page">
      <section className="panel login-card">
        <PageTitle title={t('auth.login.title')} subtitle={t('auth.login.subtitle')} />

        <form className="login-form" onSubmit={submit} noValidate>
          {error && (
            <p className="form-alert" role="alert">
              {t(`auth.login.errors.${error}`)}
            </p>
          )}

          <FormField label={t('auth.login.username')} error={fieldErrors.username}>
            {(props) => (
              <input
                {...props}
                type="text"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={values.username}
                onChange={update('username')}
              />
            )}
          </FormField>

          <FormField label={t('auth.login.password')} error={fieldErrors.password}>
            {(props) => (
              <div className="password-field">
                <input
                  {...props}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={values.password}
                  onChange={update('password')}
                />
                <button
                  type="button"
                  className="icon-button password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                  aria-pressed={showPassword}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            )}
          </FormField>

          <button type="submit" className="button button-primary button-block" disabled={busy}>
            {busy ? t('auth.login.submitting') : t('auth.login.submit')}
          </button>
        </form>
      </section>
    </div>
  )
}
