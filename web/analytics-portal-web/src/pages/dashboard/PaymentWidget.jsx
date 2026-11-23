import { analyticsApi } from '../../api/analyticsApi'
import BarList from '../../components/charts/BarList'
import useCachedResource from '../../hooks/useCachedResource'
import useT from '../../hooks/useT'
import { formatCurrency, formatPercent } from '../../utils/format'
import WidgetCard from './WidgetCard'
import queryKey from './queryKey'

/** Revenue per payment method. Each bar says whether the method is paid online or offline in words. */
export default function PaymentWidget({ range }) {
  const { t, language } = useT()
  const query = useCachedResource(queryKey('payments', range), () => analyticsApi.payments(range))

  return (
    <WidgetCard title={t('dashboard.payments.title')} query={query} lines={4}>
      {(rows) => {
        const sorted = [...rows].sort((a, b) => Number(b.revenue) - Number(a.revenue))
        return (
          <BarList
            title={t('dashboard.payments.title')}
            summary={
              sorted.length
                ? t('dashboard.payments.summary', {
                    count: sorted.length,
                    name: sorted[0].paymentMethod,
                    share: formatPercent(sorted[0].share, language),
                  })
                : ''
            }
            items={sorted.map((row) => ({
              key: row.paymentMethod,
              label: row.paymentMethod,
              detail: row.isOnline ? t('dashboard.payments.online') : t('dashboard.payments.offline'),
              value: Number(row.revenue) || 0,
              share: Number(row.share) || 0,
            }))}
            formatValue={(value) => formatCurrency(value, language)}
            emptyText={t('dashboard.chart.empty')}
            tableHeaders={[
              t('dashboard.payments.method'),
              t('dashboard.payments.channel'),
              t('dashboard.payments.revenue'),
              t('dashboard.payments.share'),
            ]}
          />
        )
      }}
    </WidgetCard>
  )
}
