import { useState } from 'react'

import { startSignIn } from '../auth/oauth'
import PageTitle from '../components/layout/PageTitle'
import Icon from '../components/ui/Icon'
import useT from '../hooks/useT'

/** Start screen for a visitor who is not signed in: a small centred card with one sign-in button. */
export default function SignInPage() {
  const { t } = useT()
  const [failed, setFailed] = useState(false)
  const [starting, setStarting] = useState(false)

  function handleSignIn() {
    setStarting(true)
    startSignIn().catch(() => {
      setFailed(true)
      setStarting(false)
    })
  }

  return (
    <div className="sign-in-page">
      <section className="panel sign-in-card">
        <span className="sign-in-mark" aria-hidden="true">
          <Icon name="database" size={36} />
        </span>
        <PageTitle title={t('common.appName')} subtitle={t('auth.signIn.subtitle')} />
        <button type="button" className="button button-primary button-block" onClick={handleSignIn} disabled={starting}>
          <span>{t('auth.signIn.button')}</span>
        </button>
        {failed && (
          <p className="form-alert" role="alert">
            {t('auth.signIn.failed')}
          </p>
        )}
      </section>
    </div>
  )
}
