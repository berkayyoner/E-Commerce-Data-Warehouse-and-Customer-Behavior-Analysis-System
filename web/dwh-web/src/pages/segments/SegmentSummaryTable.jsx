import useT from '../../hooks/useT'
import { formatCurrency, formatDecimal, formatNumber, formatPercent } from '../../utils/format'
import WidgetCard from '../dashboard/WidgetCard'

/** One row per RFM segment: its size, its share of the customers, its averages and its total revenue. */
export default function SegmentSummaryTable({ resource }) {
  const { t, language } = useT()
  const rows = resource.data || []

  return (
    <WidgetCard
      title={t('segments.summary.title')}
      loading={resource.loading}
      error={resource.error}
      onRetry={resource.reload}
      wide
    >
      {rows.length === 0 ? (
        <p className="empty-note">{t('segments.summary.empty')}</p>
      ) : (
        <div className="data-table-scroll">
          <table className="plain-table">
            <caption className="sr-only">{t('segments.summary.title')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('segments.summary.columns.segment')}</th>
                <th scope="col">{t('segments.summary.columns.customers')}</th>
                <th scope="col">{t('segments.summary.columns.share')}</th>
                <th scope="col">{t('segments.summary.columns.recency')}</th>
                <th scope="col">{t('segments.summary.columns.frequency')}</th>
                <th scope="col">{t('segments.summary.columns.monetary')}</th>
                <th scope="col">{t('segments.summary.columns.revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.segment}>
                  <th scope="row">{row.segment}</th>
                  <td>{formatNumber(row.customers, language)}</td>
                  <td>{formatPercent(row.share, language)}</td>
                  <td>{formatDecimal(row.averageRecencyDays, language)}</td>
                  <td>{formatDecimal(row.averageFrequency, language)}</td>
                  <td>{formatCurrency(row.averageMonetary, language)}</td>
                  <td>{formatCurrency(row.totalRevenue, language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WidgetCard>
  )
}
