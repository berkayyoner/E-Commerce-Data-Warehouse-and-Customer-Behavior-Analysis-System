import { useState } from 'react'

import Icon from '../../components/ui/Icon'
import useT from '../../hooks/useT'
import { formatCurrency, formatPercent } from '../../utils/format'
import WidgetCard from '../dashboard/WidgetCard'

/**
 * Revenue per segment as horizontal bars, largest first. The same numbers can be shown as a table, like the
 * monthly revenue chart on the dashboard.
 */
export default function SegmentRevenueChart({ resource }) {
  const { t, language } = useT()
  const [showTable, setShowTable] = useState(false)
  const rows = [...(resource.data || [])].sort((a, b) => b.totalRevenue - a.totalRevenue)
  const total = rows.reduce((sum, row) => sum + Number(row.totalRevenue || 0), 0)
  const largest = rows.length > 0 ? Math.max(0, ...rows.map((row) => Number(row.totalRevenue) || 0)) : 0
  const summary = t('segments.summary.chartSummary', { count: rows.length, total: formatCurrency(total, language) })

  return (
    <WidgetCard
      title={t('segments.summary.chartTitle')}
      loading={resource.loading}
      error={resource.error}
      onRetry={resource.reload}
      wide
    >
      {rows.length === 0 ? (
        <p className="empty-note">{t('segments.summary.empty')}</p>
      ) : (
        <>
          <div className="widget-toolbar">
            <button type="button" className="button button-ghost" onClick={() => setShowTable((value) => !value)}>
              <Icon name={showTable ? 'chart' : 'table'} size={16} />
              <span>{t(showTable ? 'segments.summary.showChart' : 'segments.summary.showTable')}</span>
            </button>
          </div>

          {showTable ? (
            <div className="data-table-scroll">
              <table className="plain-table">
                <caption className="sr-only">{summary}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('segments.summary.columns.segment')}</th>
                    <th scope="col">{t('segments.summary.columns.revenue')}</th>
                    <th scope="col">{t('segments.summary.columns.share')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.segment}>
                      <th scope="row">{row.segment}</th>
                      <td>{formatCurrency(row.totalRevenue, language)}</td>
                      <td>{formatPercent(total > 0 ? row.totalRevenue / total : 0, language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ul className="share-list" aria-label={summary}>
              {rows.map((row) => {
                const width = largest > 0 ? Math.min(100, ((Number(row.totalRevenue) || 0) / largest) * 100) : 0
                return (
                  <li key={row.segment} className="share-row">
                    <div className="share-head">
                      <span className="share-name">{row.segment}</span>
                      <span>{formatCurrency(row.totalRevenue, language)}</span>
                    </div>
                    <div className="share-track" aria-hidden="true">
                      <span className="share-fill" style={{ width: `${width}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </WidgetCard>
  )
}
