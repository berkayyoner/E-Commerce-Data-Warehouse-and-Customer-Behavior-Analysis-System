import { useState } from 'react'

import { analyticsApi } from '../../api/analyticsApi'
import BarList from '../../components/charts/BarList'
import useCachedResource from '../../hooks/useCachedResource'
import useT from '../../hooks/useT'
import { formatCurrency, formatNumber } from '../../utils/format'
import WidgetCard from './WidgetCard'
import queryKey from './queryKey'

const MEASURES = ['revenue', 'units']

/** The ten best-selling products, ranked by revenue or by units. The category filter applies here. */
export default function TopProductsWidget({ range, category }) {
  const { t, language } = useT()
  const [by, setBy] = useState('revenue')
  const query = useCachedResource(queryKey('products', range, by, category), () =>
    analyticsApi.topProducts(range, { by, limit: 10, category }),
  )
  const format = by === 'units' ? (value) => formatNumber(value, language) : (value) => formatCurrency(value, language)

  return (
    <WidgetCard
      title={t('dashboard.products.title')}
      query={query}
      lines={6}
      headerActions={
        <div className="segmented segmented-compact" role="group" aria-label={t('dashboard.products.by')}>
          {MEASURES.map((measure) => (
            <button
              key={measure}
              type="button"
              className="segmented-option"
              aria-pressed={by === measure}
              onClick={() => setBy(measure)}
            >
              {t(`dashboard.products.${measure}`)}
            </button>
          ))}
        </div>
      }
    >
      {(rows) => (
        <BarList
          title={t('dashboard.products.title')}
          summary={
            rows.length
              ? t('dashboard.products.summary', {
                  count: rows.length,
                  measure: t(`dashboard.products.measure.${by}`),
                  name: rows[0].name,
                })
              : ''
          }
          items={rows.map((row) => ({
            key: String(row.productId),
            label: row.name,
            detail: `${row.category} · ${row.brand}`,
            value: Number(by === 'units' ? row.units : row.revenue) || 0,
          }))}
          formatValue={format}
          emptyText={t('dashboard.chart.empty')}
          tableHeaders={[
            t('dashboard.products.name'),
            t('dashboard.products.categoryBrand'),
            t(`dashboard.products.${by}`),
            '',
          ]}
        />
      )}
    </WidgetCard>
  )
}
