import { segmentationApi } from '../../api/resources'
import useCachedResource from '../../hooks/useCachedResource'
import useT from '../../hooks/useT'
import { formatNumber, formatPercent } from '../../utils/format'
import WidgetCard from './WidgetCard'

const loadSegments = () => segmentationApi.segments()

/** RFM customer segments: one card per segment with its customer count and share. */
export default function SegmentCards() {
  const { t, language } = useT()
  const { data, error, loading, retry } = useCachedResource('segments', loadSegments)
  const rows = data || []

  return (
    <WidgetCard title={t('dashboard.segments.title')} loading={loading} error={error} onRetry={retry}>
      {rows.length === 0 ? (
        <p className="empty-note">{t('dashboard.segments.empty')}</p>
      ) : (
        <ul className="segment-grid">
          {rows.map((row) => (
            <li key={row.segment} className="segment-card">
              <strong>{row.segment}</strong>
              <span>{t('dashboard.segments.customers', { count: formatNumber(row.customers, language) })}</span>
              <span className="segment-share">{t('dashboard.segments.share', { share: formatPercent(row.share, language) })}</span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}
