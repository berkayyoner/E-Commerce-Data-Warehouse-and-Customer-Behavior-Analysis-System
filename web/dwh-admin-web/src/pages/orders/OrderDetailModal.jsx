import { useEffect, useState } from 'react'

import { shopApi } from '../../api/resources'
import ErrorState from '../../components/ui/ErrorState'
import Modal from '../../components/ui/Modal'
import useT from '../../hooks/useT'
import { formatCurrency, formatDateTime, formatNumber } from '../../utils/format'
import DeliveryBadge from './DeliveryBadge'
import { orderIdentifier } from './orderView'

/** The header and the lines of one order. The lines are read in their stored order. */
export default function OrderDetailModal({ order, onClose }) {
  const { t, language } = useT()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ detail: null, error: null, loading: true })

  useEffect(() => {
    let current = true
    setState((previous) => ({ ...previous, loading: true, error: null }))
    shopApi.orders
      .get(order)
      .then((detail) => {
        if (current) {
          setState({ detail, error: null, loading: false })
        }
      })
      .catch((error) => {
        if (current) {
          setState({ detail: null, error, loading: false })
        }
      })
    return () => {
      current = false
    }
  }, [order, attempt])

  const { detail, error, loading } = state

  return (
    <Modal title={t('orders.detail.title', { id: orderIdentifier(order) })} onClose={onClose} size="large">
      {loading && <p className="empty-note">{t('common.table.loading')}</p>}

      {!loading && error && (
        <ErrorState message={t('orders.detail.loadFailed')} onRetry={() => setAttempt((value) => value + 1)} />
      )}

      {!loading && detail && (
        <>
          <h3 className="detail-heading">{t('orders.detail.summary')}</h3>
          <dl className="detail-list two-columns">
            <div>
              <dt>{t('orders.detail.customer')}</dt>
              <dd>{detail.customerName || '-'}</dd>
            </div>
            <div>
              <dt>{t('orders.detail.orderDate')}</dt>
              <dd>{formatDateTime(detail.orderDate, language)}</dd>
            </div>
            <div>
              <dt>{t('orders.detail.paymentMethod')}</dt>
              <dd>{detail.paymentMethod || '-'}</dd>
            </div>
            <div>
              <dt>{t('orders.detail.total')}</dt>
              <dd>{formatCurrency(detail.totalAmount, language)}</dd>
            </div>
            <div>
              <dt>{t('orders.detail.status')}</dt>
              <dd>
                <DeliveryBadge delivered={detail.delivered} />
              </dd>
            </div>
          </dl>

          <h3 className="detail-heading">{t('orders.detail.lines')}</h3>
          {detail.lines.length === 0 ? (
            <p className="empty-note">{t('orders.detail.noLines')}</p>
          ) : (
            <div className="data-table-scroll">
              <table className="plain-table">
                <thead>
                  <tr>
                    <th scope="col">{t('orders.detail.lineNumber')}</th>
                    <th scope="col">{t('orders.detail.product')}</th>
                    <th scope="col">{t('orders.detail.quantity')}</th>
                    <th scope="col">{t('orders.detail.amount')}</th>
                    <th scope="col">{t('orders.detail.deliveryDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.lines.map((line) => (
                    <tr key={line.lineNumber}>
                      <td>{line.lineNumber}</td>
                      <td>{line.productName || '-'}</td>
                      <td>{formatNumber(line.quantity, language)}</td>
                      <td>{formatCurrency(line.amount, language)}</td>
                      <td>{formatDateTime(line.deliveryDate, language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
