import { analyticsApi } from '../../api/analyticsApi'
import useCachedResource from '../../hooks/useCachedResource'
import useT from '../../hooks/useT'
import { formatCurrency, formatPercent } from '../../utils/format'
import WidgetCard from './WidgetCard'

const loadCategories = () => analyticsApi.categories()

/** Revenue per product category as horizontal bars, labelled with the amount and the share. */
export default function CategoryShares() {
  const { t, language } = useT()
  const { data, error, loading, retry } = useCachedResource('categories', loadCategories)
  const rows = data || []

  return (
    <WidgetCard title={t('dashboard.categories.title')} loading={loading} error={error} onRetry={retry}>
      {rows.length === 0 ? (
        <p className="empty-note">{t('dashboard.categories.empty')}</p>
      ) : (
        <ul className="share-list">
          {rows.map((row) => {
            const width = Math.min(100, Math.max(0, Number(row.share) * 100))
            return (
              <li key={row.category} className="share-row">
                <div className="share-head">
                  <span className="share-name">{row.category}</span>
                  <span>
                    {formatCurrency(row.revenue, language)} ({t('dashboard.categories.share', { share: formatPercent(row.share, language) })})
                  </span>
                </div>
                <div className="share-track" aria-hidden="true">
                  <span className="share-fill" style={{ width: `${width}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </WidgetCard>
  )
}
