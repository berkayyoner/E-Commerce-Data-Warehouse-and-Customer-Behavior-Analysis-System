import { useState } from 'react'

import { shopApi } from '../../api/resources'
import PageTitle from '../../components/layout/PageTitle'
import DataTable from '../../components/ui/DataTable'
import ErrorState from '../../components/ui/ErrorState'
import FormField from '../../components/ui/FormField'
import useServerTable from '../../components/ui/useServerTable'
import useT from '../../hooks/useT'
import { formatCurrency, formatDateTime, formatNumber } from '../../utils/format'
import useWarehouses from '../shop/useWarehouses'
import DeliveryBadge from './DeliveryBadge'
import OrderDetailModal from './OrderDetailModal'
import { isRangeValid, orderIdentifier } from './orderView'

const INITIAL_SORT = { key: 'orderDate', direction: 'desc' }
const INITIAL_FILTERS = { warehouseId: '', from: '', to: '' }

/**
 * Orders placed in the shop. Read only: there is no create action. A row opens the order with its lines. An end date
 * before the start date is shown as an error and is not sent to the service until it is corrected.
 */
export default function OrdersPage() {
  const { t, language } = useT()
  const { warehouses } = useWarehouses()
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [selected, setSelected] = useState(null)
  const rangeValid = isRangeValid(filters.from, filters.to)
  const table = useServerTable(shopApi.orders.list, {
    initialSort: INITIAL_SORT,
    filters: {
      warehouseId: filters.warehouseId,
      from: filters.from,
      to: rangeValid ? filters.to : '',
    },
  })

  function updateFilter(field, value) {
    setFilters((previous) => ({ ...previous, [field]: value }))
  }

  const columns = [
    { key: 'orderId', label: t('orders.columns.id'), sortKey: 'orderId', render: orderIdentifier },
    { key: 'customerName', label: t('orders.columns.customerName'), sortKey: 'customerName' },
    {
      key: 'orderDate',
      label: t('orders.columns.orderDate'),
      sortKey: 'orderDate',
      render: (row) => formatDateTime(row.orderDate, language),
    },
    { key: 'paymentMethod', label: t('orders.columns.paymentMethod') },
    {
      key: 'lineCount',
      label: t('orders.columns.lineCount'),
      sortKey: 'lineCount',
      render: (row) => formatNumber(row.lineCount, language),
    },
    {
      key: 'totalAmount',
      label: t('orders.columns.totalAmount'),
      sortKey: 'totalAmount',
      render: (row) => formatCurrency(row.totalAmount, language),
    },
    { key: 'delivered', label: t('orders.columns.delivered'), render: (row) => <DeliveryBadge delivered={row.delivered} /> },
  ]

  return (
    <div className="page">
      <PageTitle title={t('orders.title')} subtitle={t('orders.subtitle')} />

      {table.error && <ErrorState message={t('common.error.page')} onRetry={table.reload} />}

      <div className="filter-bar">
        <FormField label={t('shop.warehouseFilter')}>
          {(props) => (
            <select
              {...props}
              value={filters.warehouseId}
              onChange={(event) => updateFilter('warehouseId', event.target.value)}
            >
              <option value="">{t('shop.allWarehouses')}</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField label={t('orders.filters.from')}>
          {(props) => (
            <input
              {...props}
              type="date"
              value={filters.from}
              onChange={(event) => updateFilter('from', event.target.value)}
            />
          )}
        </FormField>

        <FormField label={t('orders.filters.to')} error={rangeValid ? undefined : t('orders.filters.rangeError')}>
          {(props) => (
            <input
              {...props}
              type="date"
              value={filters.to}
              onChange={(event) => updateFilter('to', event.target.value)}
            />
          )}
        </FormField>
      </div>

      <DataTable
        {...table.tableProps}
        columns={columns}
        rowKey={orderIdentifier}
        searchPlaceholder={t('orders.search.placeholder')}
        onRowClick={setSelected}
      />

      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
