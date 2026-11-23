import { useState } from 'react'
import { useDispatch } from 'react-redux'

import { shopApi } from '../../api/resources'
import useRoles from '../../auth/useRoles'
import PageTitle from '../../components/layout/PageTitle'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DataTable from '../../components/ui/DataTable'
import ErrorState from '../../components/ui/ErrorState'
import Icon from '../../components/ui/Icon'
import useServerTable from '../../components/ui/useServerTable'
import useNotify from '../../hooks/useNotify'
import useT from '../../hooks/useT'
import { formatCurrency, formatPercent } from '../../utils/format'
import { isConflict } from '../shop/conflict'
import { pushToast } from '../../store/uiSlice'
import WarehouseFormModal from './WarehouseFormModal'

const INITIAL_SORT = { key: 'id', direction: 'asc' }

/** Warehouses of the shop (administrators change them; analysts read them). */
export default function WarehousesPage() {
  const { t, language } = useT()
  const dispatch = useDispatch()
  const notify = useNotify()
  const { isAdmin } = useRoles()
  const table = useServerTable(shopApi.warehouses.list, { initialSort: INITIAL_SORT })
  const [editing, setEditing] = useState(null) // { warehouse: null } to create, { warehouse } to edit
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const columns = [
    { key: 'id', label: t('warehouses.columns.id'), sortKey: 'id' },
    { key: 'name', label: t('warehouses.columns.name'), sortKey: 'name' },
    { key: 'city', label: t('warehouses.columns.city'), sortKey: 'city' },
    { key: 'region', label: t('warehouses.columns.region'), sortKey: 'region' },
    { key: 'tax', label: t('warehouses.columns.tax'), render: (row) => formatPercent(row.tax, language) },
    { key: 'ytd', label: t('warehouses.columns.ytd'), render: (row) => formatCurrency(row.ytd, language) },
  ]

  function renderRowActions(row) {
    return (
      <span className="row-actions">
        <button
          type="button"
          className="icon-button"
          aria-label={t('warehouses.rowActions.edit')}
          title={t('warehouses.rowActions.edit')}
          onClick={() => setEditing({ warehouse: row })}
        >
          <Icon name="edit" size={16} />
        </button>
        <button
          type="button"
          className="icon-button is-danger"
          aria-label={t('warehouses.rowActions.delete')}
          title={t('warehouses.rowActions.delete')}
          onClick={() => setDeleting(row)}
        >
          <Icon name="delete" size={16} />
        </button>
      </span>
    )
  }

  function confirmDelete() {
    setBusy(true)
    shopApi.warehouses
      .remove(deleting.id)
      .then(() => {
        notify.success('common.toast.deleted')
        setDeleting(null)
        table.reload()
      })
      .catch((error) => {
        setDeleting(null)
        if (isConflict(error)) {
          dispatch(pushToast('error', 'shop.conflict.warehouseInUse'))
        } else {
          notify.failure(error)
        }
      })
      .finally(() => setBusy(false))
  }

  return (
    <div className="page">
      <PageTitle title={t('warehouses.title')} subtitle={t('warehouses.subtitle')} />

      {table.error && <ErrorState message={t('common.error.page')} onRetry={table.reload} />}

      <DataTable
        {...table.tableProps}
        columns={columns}
        searchPlaceholder={t('warehouses.search.placeholder')}
        createLabel={t('warehouses.createLabel')}
        onCreate={isAdmin ? () => setEditing({ warehouse: null }) : undefined}
        rowActions={isAdmin ? renderRowActions : undefined}
      />

      {editing && (
        <WarehouseFormModal
          warehouse={editing.warehouse}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            table.reload()
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          name={deleting.name}
          busy={busy}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}
