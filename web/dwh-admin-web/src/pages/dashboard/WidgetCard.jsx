import { useId } from 'react'

import ErrorState from '../../components/ui/ErrorState'
import useT from '../../hooks/useT'

/**
 * Frame of one dashboard widget. While loading it shows a skeleton, when the call failed it shows an error with
 * a retry button, and otherwise the widget's content. Each widget is its own frame, so one failure stays local.
 */
export default function WidgetCard({ title, loading, error, onRetry, wide = false, children }) {
  const { t } = useT()
  const titleId = useId()

  return (
    <section className={`panel widget${wide ? ' widget-wide' : ''}`} aria-labelledby={titleId} aria-busy={loading}>
      <h2 id={titleId} className="widget-title">
        {title}
      </h2>
      {loading && (
        <div className="skeleton" aria-hidden="true">
          <span className="skeleton-line" />
          <span className="skeleton-line" />
          <span className="skeleton-line short" />
        </div>
      )}
      {!loading && error && <ErrorState message={t('common.error.widget')} onRetry={onRetry} />}
      {!loading && !error && children}
    </section>
  )
}
