import { useState } from 'react'
import { useDispatch } from 'react-redux'

import { shopApi } from '../../api/resources'
import useRoles from '../../auth/useRoles'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DataTable from '../../components/ui/DataTable'
import ErrorState from '../../components/ui/ErrorState'
import Icon from '../../components/ui/Icon'
import useServerTable from '../../components/ui/useServerTable'
import useNotify from '../../hooks/useNotify'
import useT from '../../hooks/useT'
import { formatCurrency } from '../../utils/format'
import { isConflict } from '../shop/conflict'
import { pushToast } from '../../store/uiSlice'
import ProductFormModal from './ProductFormModal'

const INITIAL_SORT = { key: 'id', direction: 'asc' }

/** The product list from the database: sortable, searchable, and with create, edit and delete for administrators. */
export default function CatalogView() {
  const { t, language } = useT()
  const dispatch = useDispatch()
  const notify = useNotify()
  const { isAdmin } = useRoles()
  const table = useServerTable(shopApi.products.list, { initialSort: INITIAL_SORT })
  const [editing, setEditing] = useState(null) // { product: null } to create, { product } to edit
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const columns = [
    { key: 'id', label: t('products.columns.id'), sortKey: 'id' },
    { key: 'name', label: t('products.columns.name'), sortKey: 'name' },
    { key: 'category', label: t('products.columns.category'), sortKey: 'category' },
    { key: 'brand', label: t('products.columns.brand'), sortKey: 'brand' },
    { key: 'price', label: t('products.columns.price'), sortKey: 'price', render: (row) => formatCurrency(row.price, language) },
  ]

  function renderRowActions(row) {
    return (
      <span className="row-actions">
        <button
          type="button"
          className="icon-button"
          aria-label={t('products.rowActions.edit')}
          title={t('products.rowActions.edit')}
          onClick={() => setEditing({ product: row })}
        >
          <Icon name="edit" size={16} />
        </button>
        <button
          type="button"
          className="icon-button is-danger"
          aria-label={t('products.rowActions.delete')}
          title={t('products.rowActions.delete')}
          onClick={() => setDeleting(row)}
        >
          <Icon name="delete" size={16} />
        </button>
      </span>
    )
  }

  function confirmDelete() {
    setBusy(true)
    shopApi.products
      .remove(deleting.id)
      .then(() => {
        notify.success('common.toast.deleted')
        setDeleting(null)
        table.reload()
      })
      .catch((error) => {
        setDeleting(null)
        if (isConflict(error)) {
          dispatch(pushToast('error', 'shop.conflict.productInOrders'))
        } else {
          notify.failure(error)
        }
      })
      .finally(() => setBusy(false))
  }

  return (
    <>
      {table.error && <ErrorState message={t('common.error.page')} onRetry={table.reload} />}

      <DataTable
        {...table.tableProps}
        columns={columns}
        searchPlaceholder={t('products.search.placeholder')}
        createLabel={t('products.createLabel')}
        onCreate={isAdmin ? () => setEditing({ product: null }) : undefined}
        rowActions={isAdmin ? renderRowActions : undefined}
      />

      {editing && (
        <ProductFormModal
          product={editing.product}
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
    </>
  )
}
