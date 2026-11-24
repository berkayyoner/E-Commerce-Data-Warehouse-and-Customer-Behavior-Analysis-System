import useT from '../../hooks/useT'
import ErrorState from './ErrorState'
import Skeleton from './Skeleton'

/**
 * Shows the state of one query: a placeholder while it loads, an error with a retry button when it failed, a note
 * when there is nothing to load yet, or the children once the data is there. Every widget uses it, so one failing
 * call never takes the rest of the page down.
 */
export default function QueryState({ query, children, idleText, lines = 4 }) {
  const { t } = useT()

  if (query.idle) {
    return <p className="empty-note">{idleText}</p>
  }
  if (query.loading) {
    return <Skeleton lines={lines} />
  }
  if (query.error) {
    return <ErrorState message={t('common.error.widget')} onRetry={query.retry} />
  }
  return children(query.data)
}
