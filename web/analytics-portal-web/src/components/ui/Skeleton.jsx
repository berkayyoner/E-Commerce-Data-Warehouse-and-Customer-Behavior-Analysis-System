import useT from '../../hooks/useT'

/** Placeholder lines shown while a widget loads. The screen reader hears one "Loading" message. */
export default function Skeleton({ lines = 4 }) {
  const { t } = useT()
  return (
    <div className="skeleton" role="status" aria-busy="true">
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} className={`skeleton-line${index === lines - 1 ? ' short' : ''}`} aria-hidden="true" />
      ))}
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  )
}
