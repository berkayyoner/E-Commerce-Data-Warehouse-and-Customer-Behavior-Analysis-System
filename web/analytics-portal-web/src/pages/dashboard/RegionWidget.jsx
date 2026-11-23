import { useMemo } from 'react'

import { analyticsApi } from '../../api/analyticsApi'
import BarList from '../../components/charts/BarList'
import useCachedResource from '../../hooks/useCachedResource'
import useT from '../../hooks/useT'
import { formatCurrency, formatPercent } from '../../utils/format'
import WidgetCard from './WidgetCard'
import queryKey from './queryKey'

/** Groups the warehouse cities under their region. Regions and the cities inside them are ordered by revenue. */
export function groupByRegion(rows) {
  const groups = new Map()
  rows.forEach((row) => {
    const group = groups.get(row.region) || { region: row.region, revenue: 0, share: 0, cities: [] }
    group.revenue += Number(row.revenue) || 0
    group.share += Number(row.share) || 0
    group.cities.push(row)
    groups.set(row.region, group)
  })
  return [...groups.values()]
    .map((group) => ({
      ...group,
      cities: [...group.cities].sort((a, b) => Number(b.revenue) - Number(a.revenue)),
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

function RegionGroups({ rows }) {
  const { t, language } = useT()
  const groups = useMemo(() => groupByRegion(rows), [rows])

  if (groups.length === 0) {
    return <p className="chart-empty">{t('dashboard.chart.empty')}</p>
  }
  return groups.map((group) => (
    <div className="region-group" key={group.region}>
      <h3 className="region-title">
        <span>{group.region}</span>
        <span className="region-total">
          {formatCurrency(group.revenue, language)} ({formatPercent(group.share, language)})
        </span>
      </h3>
      <BarList
        title={group.region}
        summary={t('dashboard.regions.summary', { region: group.region, count: group.cities.length })}
        items={group.cities.map((city) => ({
          key: `${city.region}-${city.city}`,
          label: city.city,
          value: Number(city.revenue) || 0,
          share: Number(city.share) || 0,
        }))}
        formatValue={(value) => formatCurrency(value, language)}
        emptyText={t('dashboard.chart.empty')}
        tableHeaders={[t('dashboard.regions.city'), '', t('dashboard.regions.revenue'), t('dashboard.regions.share')]}
      />
    </div>
  ))
}

/** Revenue of the warehouse cities, one bar group per region. */
export default function RegionWidget({ range }) {
  const { t } = useT()
  const query = useCachedResource(queryKey('regions', range), () => analyticsApi.regions(range))

  return (
    <WidgetCard title={t('dashboard.regions.title')} query={query} lines={6}>
      {(rows) => <RegionGroups rows={rows} />}
    </WidgetCard>
  )
}
