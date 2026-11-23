import useT from '../../hooks/useT'

/** Placeholder shown while the session is being restored, so that no page flashes before the check ends. */
export default function Splash() {
  const { t } = useT()
  return (
    <div className="splash" role="status" aria-busy="true">
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  )
}
