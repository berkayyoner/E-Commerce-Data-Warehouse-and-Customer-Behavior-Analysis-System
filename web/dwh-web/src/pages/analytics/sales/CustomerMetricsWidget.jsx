import { analyticsApi } from '../../../api/analyticsApi'
import useCachedResource from '../../../hooks/useCachedResource'
import useT from '../../../hooks/useT'
import { formatCurrency, formatDecimal, formatNumber, formatPercent } from '../../../utils/format'
import WidgetCard from './WidgetCard'
import queryKey from './queryKey'

/** Repeat purchases, orders per customer and the average value of a customer, for ADMIN and ANALYST. */
export default function CustomerMetricsWidget({ range }) {
  const { t, language } = useT()
  const query = useCachedResource(queryKey('customerMetrics', range), () => analyticsApi.customerMetrics(range))

  return (
    <WidgetCard title={t('analytics.customers.metricsTitle')} query={query} lines={3}>
      {(data) => (
        <dl className="metric-grid">
          <div className="metric">
            <dt>{t('analytics.customers.repeatRate')}</dt>
            <dd>{formatPercent(data.repeatPurchaseRate, language)}</dd>
            <dd className="metric-note">
              {t('analytics.customers.repeatCount', {
                repeat: formatNumber(data.repeatCustomers, language),
                total: formatNumber(data.customersWithOrders, language),
              })}
            </dd>
          </div>
          <div className="metric">
            <dt>{t('analytics.customers.ordersPerCustomer')}</dt>
            <dd>{formatDecimal(data.averageOrdersPerCustomer, language)}</dd>
          </div>
          <div className="metric">
            <dt>{t('analytics.customers.lifetimeValue')}</dt>
            <dd>{formatCurrency(data.averageLifetimeValue, language)}</dd>
          </div>
        </dl>
      )}
    </WidgetCard>
  )
}
