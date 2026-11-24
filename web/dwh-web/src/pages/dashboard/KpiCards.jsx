import Icon from '../../components/ui/Icon'
import useCachedResource from '../../hooks/useCachedResource'
import useT from '../../hooks/useT'
import { analyticsApi } from '../../api/analyticsApi'
import { formatCurrency, formatNumber, formatPercent } from '../../utils/format'
import WidgetCard from './WidgetCard'

const KPIS = [
  { key: 'revenue', icon: 'wallet', format: formatCurrency },
  { key: 'orders', icon: 'cart', format: formatNumber },
  { key: 'units', icon: 'package', format: formatNumber },
  { key: 'customers', icon: 'users', format: formatNumber },
  { key: 'averageOrderValue', icon: 'receipt', format: formatCurrency },
  { key: 'deliveredShare', icon: 'truck', format: formatPercent },
]

const loadOverview = () => analyticsApi.overview()

/** Six headline figures from the analytics overview. */
export default function KpiCards() {
  const { t, language } = useT()
  const { data, error, loading, retry } = useCachedResource('overview', loadOverview)

  return (
    <WidgetCard title={t('dashboard.kpi.title')} loading={loading} error={error} onRetry={retry} wide>
      {data && (
        <ul className="kpi-grid">
          {KPIS.map((kpi) => (
            <li key={kpi.key} className="kpi-card">
              <span className="kpi-icon">
                <Icon name={kpi.icon} size={20} />
              </span>
              <span className="kpi-label">{t(`dashboard.kpi.${kpi.key}`)}</span>
              <strong className="kpi-value">{kpi.format(data[kpi.key], language)}</strong>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}
