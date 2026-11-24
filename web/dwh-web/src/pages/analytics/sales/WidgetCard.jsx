import { useId } from 'react'

import QueryState from '../../../components/ui/QueryState'
import useT from '../../../hooks/useT'

/** A sales card with a heading. The body shows the state of its query and then the children with the data. */
export default function WidgetCard({ title, query, children, wide = false, lines = 5, headerActions }) {
  const { t } = useT()
  const headingId = useId()

  return (
    <section className={`panel widget${wide ? ' widget-wide' : ''}`} aria-labelledby={headingId}>
      <header className="widget-header">
        <h2 id={headingId} className="widget-title">
          {title}
        </h2>
        {headerActions}
      </header>
      <QueryState query={query} lines={lines} idleText={t('analytics.filters.idle')}>
        {children}
      </QueryState>
    </section>
  )
}
