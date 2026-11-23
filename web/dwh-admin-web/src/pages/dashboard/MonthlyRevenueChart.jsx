import { useState } from 'react'

import { analyticsApi } from '../../api/resources'
import BarChart from '../../components/ui/BarChart'
import Icon from '../../components/ui/Icon'
import useCachedResource from '../../hooks/useCachedResource'
import useT from '../../hooks/useT'
import { formatCurrency, formatMonth, formatNumber } from '../../utils/format'
import WidgetCard from './WidgetCard'

const loadTrend = () => analyticsApi.salesTrend('month')

/** Monthly revenue as columns, with a switch that shows the same numbers as a table. */
export default function MonthlyRevenueChart() {
  const { t, language } = useT()
  const { data, error, loading, retry } = useCachedResource('salesTrend', loadTrend)
  const [showTable, setShowTable] = useState(false)

  const rows = data || []
  const total = rows.reduce((sum, row) => sum + Number(row.revenue || 0), 0)
  const summary = t('dashboard.revenue.summary', { count: rows.length, total: formatCurrency(total, language) })
  const points = rows.map((row) => ({ label: formatMonth(row.period, language), values: { revenue: row.revenue } }))
  const series = [{ key: 'revenue', name: t('dashboard.revenue.revenue'), className: 'bar-primary' }]

  return (
    <WidgetCard title={t('dashboard.revenue.title')} loading={loading} error={error} onRetry={retry} wide>
      {rows.length === 0 ? (
        <p className="empty-note">{t('dashboard.revenue.empty')}</p>
      ) : (
        <>
          <div className="widget-toolbar">
            <button type="button" className="button button-ghost" onClick={() => setShowTable((value) => !value)}>
              <Icon name={showTable ? 'chart' : 'table'} size={16} />
              <span>{t(showTable ? 'dashboard.revenue.showChart' : 'dashboard.revenue.showTable')}</span>
            </button>
          </div>
          {showTable ? (
            <div className="data-table-scroll">
              <table className="plain-table">
                <caption className="sr-only">{summary}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('dashboard.revenue.period')}</th>
                    <th scope="col">{t('dashboard.revenue.revenue')}</th>
                    <th scope="col">{t('dashboard.revenue.orders')}</th>
                    <th scope="col">{t('dashboard.revenue.units')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.period}>
                      <th scope="row">{formatMonth(row.period, language)}</th>
                      <td>{formatCurrency(row.revenue, language)}</td>
                      <td>{formatNumber(row.orders, language)}</td>
                      <td>{formatNumber(row.units, language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <BarChart points={points} series={series} title={summary} periodLabel={t('dashboard.revenue.period')} />
          )}
        </>
      )}
    </WidgetCard>
  )
}
