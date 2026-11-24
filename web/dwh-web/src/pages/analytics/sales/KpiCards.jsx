import useCachedResource from '../../../hooks/useCachedResource'
import useT from '../../../hooks/useT'
import { analyticsApi } from '../../../api/analyticsApi'
import ErrorState from '../../../components/ui/ErrorState'
import Icon from '../../../components/ui/Icon'
import Skeleton from '../../../components/ui/Skeleton'
import { formatCurrency, formatDecimal, formatNumber, formatPercent } from '../../../utils/format'
import queryKey from './queryKey'

const dash = (value, format) => (value === null || value === undefined ? '-' : format(value))

/** Headline figures of the selected period. Each figure is a card; the row loads as one request. */
export default function KpiCards({ range }) {
  const { t, language } = useT()
  const query = useCachedResource(queryKey('overview', range), () => analyticsApi.overview(range))

  if (query.idle) {
    return null
  }
  if (query.loading) {
    return (
      <section className="kpi-grid" aria-label={t('analytics.kpi.label')}>
        <div className="panel kpi-card">
          <Skeleton lines={3} />
        </div>
      </section>
    )
  }
  if (query.error) {
    return (
      <section className="kpi-grid kpi-grid-message" aria-label={t('analytics.kpi.label')}>
        <ErrorState message={t('common.error.widget')} onRetry={query.retry} />
      </section>
    )
  }

  const overview = query.data
  const cards = [
    { key: 'revenue', icon: 'wallet', value: dash(overview.revenue, (v) => formatCurrency(v, language)) },
    { key: 'orders', icon: 'receipt', value: dash(overview.orders, (v) => formatNumber(v, language)) },
    { key: 'units', icon: 'package', value: dash(overview.units, (v) => formatNumber(v, language)) },
    { key: 'customers', icon: 'users', value: dash(overview.customers, (v) => formatNumber(v, language)) },
    {
      key: 'averageOrderValue',
      icon: 'cart',
      value: dash(overview.averageOrderValue, (v) => formatCurrency(v, language)),
    },
    {
      key: 'deliveredShare',
      icon: 'truck',
      value: dash(overview.deliveredShare, (v) => formatPercent(v, language)),
    },
    {
      key: 'averageDeliveryDays',
      icon: 'clock',
      value: dash(overview.averageDeliveryDays, (v) => `${formatDecimal(v, language)} ${t('analytics.kpi.days')}`),
    },
  ]

  return (
    <section className="kpi-grid" aria-label={t('analytics.kpi.label')}>
      {cards.map((card) => (
        <article className="panel kpi-card" key={card.key}>
          <span className="kpi-icon" aria-hidden="true">
            <Icon name={card.icon} size={18} />
          </span>
          <span className="kpi-label">{t(`analytics.kpi.${card.key}`)}</span>
          <strong className="kpi-value">{card.value}</strong>
        </article>
      ))}
    </section>
  )
}
