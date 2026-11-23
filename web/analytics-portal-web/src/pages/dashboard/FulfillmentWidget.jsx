import { analyticsApi } from '../../api/analyticsApi'
import useCachedResource from '../../hooks/useCachedResource'
import useT from '../../hooks/useT'
import { formatDecimal, formatNumber, formatPercent } from '../../utils/format'
import WidgetCard from './WidgetCard'
import queryKey from './queryKey'

const dash = (value, format) => (value === null || value === undefined ? '-' : format(value))

/** Orders placed, delivered and pending, the delivered share, and the delivery times per warehouse. */
export default function FulfillmentWidget({ range }) {
  const { t, language } = useT()
  const query = useCachedResource(queryKey('fulfillment', range), () => analyticsApi.fulfillment(range))

  return (
    <WidgetCard wide title={t('dashboard.fulfillment.title')} query={query} lines={6}>
      {(data) => {
        const deliveredPercent = Math.round((Number(data.deliveredShare) || 0) * 100)
        const days = (value) => dash(value, (v) => `${formatDecimal(v, language)} ${t('dashboard.kpi.days')}`)
        return (
          <div className="fulfillment">
            <p className="fulfillment-summary">
              {t('dashboard.fulfillment.summary', {
                delivered: formatNumber(data.delivered, language),
                placed: formatNumber(data.placed, language),
                pending: formatNumber(data.pending, language),
              })}
            </p>
            <dl className="fulfillment-stats">
              <div>
                <dt>{t('dashboard.fulfillment.placed')}</dt>
                <dd>{formatNumber(data.placed, language)}</dd>
              </div>
              <div>
                <dt>{t('dashboard.fulfillment.delivered')}</dt>
                <dd>{formatNumber(data.delivered, language)}</dd>
              </div>
              <div>
                <dt>{t('dashboard.fulfillment.pending')}</dt>
                <dd>{formatNumber(data.pending, language)}</dd>
              </div>
              <div>
                <dt>{t('dashboard.fulfillment.averageDeliveryDays')}</dt>
                <dd>{days(data.averageDeliveryDays)}</dd>
              </div>
            </dl>
            <div className="share-meter">
              <div className="share-meter-head">
                <span>{t('dashboard.fulfillment.deliveredShare')}</span>
                <strong>{dash(data.deliveredShare, (v) => formatPercent(v, language))}</strong>
              </div>
              <div
                className="share-meter-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={deliveredPercent}
                aria-label={t('dashboard.fulfillment.shareBar', { percent: deliveredPercent })}
              >
                <div className="share-meter-fill" style={{ width: `${deliveredPercent}%` }} />
              </div>
            </div>
            <div className="table-scroll">
              <table className="plain-table">
                <caption>{t('dashboard.fulfillment.byWarehouse')}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('dashboard.fulfillment.city')}</th>
                    <th scope="col">{t('dashboard.fulfillment.region')}</th>
                    <th scope="col">{t('dashboard.fulfillment.placed')}</th>
                    <th scope="col">{t('dashboard.fulfillment.delivered')}</th>
                    <th scope="col">{t('dashboard.fulfillment.averageDeliveryDays')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byWarehouse.map((warehouse) => (
                    <tr key={`${warehouse.region}-${warehouse.city}`}>
                      <th scope="row" data-label={t('dashboard.fulfillment.city')}>
                        {warehouse.city}
                      </th>
                      <td data-label={t('dashboard.fulfillment.region')}>{warehouse.region}</td>
                      <td data-label={t('dashboard.fulfillment.placed')}>{formatNumber(warehouse.placed, language)}</td>
                      <td data-label={t('dashboard.fulfillment.delivered')}>
                        {formatNumber(warehouse.delivered, language)}
                      </td>
                      <td data-label={t('dashboard.fulfillment.averageDeliveryDays')}>
                        {days(warehouse.averageDeliveryDays)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }}
    </WidgetCard>
  )
}
