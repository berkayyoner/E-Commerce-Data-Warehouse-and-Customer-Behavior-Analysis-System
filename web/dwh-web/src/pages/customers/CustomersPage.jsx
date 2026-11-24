import { useState } from 'react'

import { shopApi } from '../../api/resources'
import useRoles from '../../auth/useRoles'
import PageTitle from '../../components/layout/PageTitle'
import DataTable from '../../components/ui/DataTable'
import ErrorState from '../../components/ui/ErrorState'
import FormField from '../../components/ui/FormField'
import Icon from '../../components/ui/Icon'
import useServerTable from '../../components/ui/useServerTable'
import useT from '../../hooks/useT'
import { formatCurrency, formatDate } from '../../utils/format'
import useWarehouses from '../shop/useWarehouses'
import CustomerFormModal from './CustomerFormModal'
import { customerIdentifier } from './customerForm'

const INITIAL_SORT = { key: 'lastName', direction: 'asc' }

/**
 * Customers of the shop. Everyone who may open the console can read them; only administrators create and edit.
 * Customers are never deleted, so there is no delete action.
 */
export default function CustomersPage() {
  const { t, language } = useT()
  const { isAdmin } = useRoles()
  const { warehouses } = useWarehouses()
  const [warehouseId, setWarehouseId] = useState('')
  const table = useServerTable(shopApi.customers.list, {
    initialSort: INITIAL_SORT,
    filters: { warehouseId },
  })
  const [editing, setEditing] = useState(null) // { customer: null } to create, { customer } to edit

  const columns = [
    { key: 'id', label: t('customers.columns.id'), sortKey: 'id', render: customerIdentifier },
    { key: 'firstName', label: t('customers.columns.firstName'), sortKey: 'firstName' },
    { key: 'lastName', label: t('customers.columns.lastName'), sortKey: 'lastName' },
    { key: 'email', label: t('customers.columns.email') },
    { key: 'city', label: t('customers.columns.city'), sortKey: 'city' },
    { key: 'region', label: t('customers.columns.region'), sortKey: 'region' },
    {
      key: 'since',
      label: t('customers.columns.since'),
      sortKey: 'since',
      render: (row) => formatDate(row.since, language),
    },
    {
      key: 'balance',
      label: t('customers.columns.balance'),
      sortKey: 'balance',
      render: (row) => formatCurrency(row.balance, language),
    },
  ]

  function renderRowActions(row) {
    return (
      <span className="row-actions">
        <button
          type="button"
          className="icon-button"
          aria-label={t('customers.rowActions.edit')}
          title={t('customers.rowActions.edit')}
          onClick={() => setEditing({ customer: row })}
        >
          <Icon name="edit" size={16} />
        </button>
      </span>
    )
  }

  return (
    <div className="page">
      <PageTitle title={t('customers.title')} subtitle={t('customers.subtitle')} />

      {table.error && <ErrorState message={t('common.error.page')} onRetry={table.reload} />}

      <div className="filter-bar">
        <FormField label={t('shop.warehouseFilter')}>
          {(props) => (
            <select {...props} value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>
              <option value="">{t('shop.allWarehouses')}</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      <DataTable
        {...table.tableProps}
        columns={columns}
        rowKey={customerIdentifier}
        searchPlaceholder={t('customers.search.placeholder')}
        createLabel={t('customers.createLabel')}
        onCreate={isAdmin ? () => setEditing({ customer: null }) : undefined}
        rowActions={isAdmin ? renderRowActions : undefined}
      />

      {editing && (
        <CustomerFormModal
          customer={editing.customer}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            table.reload()
          }}
        />
      )}
    </div>
  )
}
