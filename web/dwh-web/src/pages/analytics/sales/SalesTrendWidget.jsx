import { useState } from 'react'

import { analyticsApi } from '../../../api/analyticsApi'
import LineChart from '../../../components/charts/LineChart'
import useCachedResource from '../../../hooks/useCachedResource'
import useT from '../../../hooks/useT'
import { GRANULARITIES, granularityFor } from '../../../utils/dateRange'
import { formatCompact, formatCurrency } from '../../../utils/format'
import WidgetCard from './WidgetCard'
import queryKey from './queryKey'
import { periodLabel } from './periods'

/** Revenue per period as a line chart. The granularity follows the period unless the reader picks one. */
export default function SalesTrendWidget({ range }) {
  const { t, language } = useT()
  const [choice, setChoice] = useState('auto')
  const granularity = choice === 'auto' ? granularityFor(range && range.from, range && range.to) : choice
  const query = useCachedResource(queryKey('trend', range, granularity), () =>
    analyticsApi.salesTrend(range, granularity),
  )

  const granularityOptions = ['auto', ...GRANULARITIES]

  return (
    <WidgetCard
      wide
      title={t('analytics.trend.title')}
      query={query}
      lines={8}
      headerActions={
        <div className="segmented segmented-compact" role="group" aria-label={t('analytics.trend.granularity')}>
          {granularityOptions.map((option) => (
            <button
              key={option}
              type="button"
              className="segmented-option"
              aria-pressed={choice === option}
              onClick={() => setChoice(option)}
            >
              {t(`analytics.trend.${option}`)}
            </button>
          ))}
        </div>
      }
    >
      {(rows) => {
        const points = rows.map((row) => ({
          key: row.period,
          label: periodLabel(row.period, granularity, language, t),
          value: Number(row.revenue) || 0,
        }))
        const first = points.length ? points[0].label : ''
        const last = points.length ? points[points.length - 1].label : ''
        return (
          <LineChart
            title={t('analytics.trend.title')}
            summary={t('analytics.trend.summary', {
              granularity: t(`analytics.trend.${granularity}`).toLowerCase(),
              count: points.length,
              first,
              last,
            })}
            points={points}
            formatValue={(value) => formatCurrency(value, language, 2)}
            formatTick={(value) => formatCompact(value, language)}
            yTitle={t('analytics.trend.axisRevenue')}
            xTitle={t('analytics.trend.axisPeriod')}
            emptyText={t('analytics.chart.empty')}
            tableHeaders={[t('analytics.trend.axisPeriod'), t('analytics.trend.axisRevenue')]}
          />
        )
      }}
    </WidgetCard>
  )
}
