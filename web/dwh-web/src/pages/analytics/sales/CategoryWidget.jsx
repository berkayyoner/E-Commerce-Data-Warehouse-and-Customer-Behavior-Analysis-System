import { analyticsApi } from '../../../api/analyticsApi'
import BarList from '../../../components/charts/BarList'
import useCachedResource from '../../../hooks/useCachedResource'
import useT from '../../../hooks/useT'
import { formatCurrency, formatPercent } from '../../../utils/format'
import WidgetCard from './WidgetCard'
import queryKey from './queryKey'

/** Revenue of each category, largest first, with the share of the total. */
export default function CategoryWidget({ range }) {
  const { t, language } = useT()
  const query = useCachedResource(queryKey('categories', range), () => analyticsApi.categories(range))

  return (
    <WidgetCard title={t('analytics.categories.title')} query={query} lines={6}>
      {(rows) => {
        const sorted = [...rows].sort((a, b) => Number(b.revenue) - Number(a.revenue))
        return (
          <BarList
            title={t('analytics.categories.title')}
            summary={
              sorted.length
                ? t('analytics.categories.summary', {
                    count: sorted.length,
                    name: sorted[0].category,
                    share: formatPercent(sorted[0].share, language),
                  })
                : ''
            }
            items={sorted.map((row) => ({
              key: row.category,
              label: row.category,
              value: Number(row.revenue) || 0,
              share: Number(row.share) || 0,
            }))}
            formatValue={(value) => formatCurrency(value, language)}
            emptyText={t('analytics.chart.empty')}
            tableHeaders={[
              t('analytics.categories.category'),
              '',
              t('analytics.categories.revenue'),
              t('analytics.categories.share'),
            ]}
          />
        )
      }}
    </WidgetCard>
  )
}
