import { useState } from 'react'

import { usersApi } from '../../api/resources'
import PageTitle from '../../components/layout/PageTitle'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DataTable from '../../components/ui/DataTable'
import ErrorState from '../../components/ui/ErrorState'
import Icon from '../../components/ui/Icon'
import useServerTable from '../../components/ui/useServerTable'
import useNotify from '../../hooks/useNotify'
import useT from '../../hooks/useT'
import { formatDateTime } from '../../utils/format'
import UserFormModal from './UserFormModal'

const INITIAL_SORT = { key: 'username', direction: 'asc' }

/** Personnel accounts (administrators only): searchable, sortable list with create, edit and delete. */
export default function UsersPage() {
  const { t, language } = useT()
  const notify = useNotify()
  const table = useServerTable(usersApi.list, { initialSort: INITIAL_SORT })
  const [editing, setEditing] = useState(null) // { user: null } to create, { user } to edit
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const columns = [
    { key: 'username', label: t('users.columns.username'), sortKey: 'username' },
    { key: 'displayName', label: t('users.columns.displayName'), sortKey: 'displayName' },
    { key: 'email', label: t('users.columns.email'), sortKey: 'email', render: (row) => row.email || '-' },
    { key: 'role', label: t('users.columns.role'), sortKey: 'role', render: (row) => t(`common.roles.${row.role}`) },
    {
      key: 'enabled',
      label: t('users.columns.status'),
      sortKey: 'enabled',
      render: (row) => (
        <span className={`badge ${row.enabled ? 'badge-success' : 'badge-muted'}`}>
          {t(row.enabled ? 'common.status.enabled' : 'common.status.disabled')}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: t('users.columns.createdAt'),
      sortKey: 'createdAt',
      render: (row) => formatDateTime(row.createdAt, language),
    },
  ]

  function renderRowActions(row) {
    return (
      <span className="row-actions">
        <button
          type="button"
          className="icon-button"
          aria-label={t('users.rowActions.edit')}
          title={t('users.rowActions.edit')}
          onClick={() => setEditing({ user: row })}
        >
          <Icon name="edit" size={16} />
        </button>
        <button
          type="button"
          className="icon-button is-danger"
          aria-label={t('users.rowActions.delete')}
          title={t('users.rowActions.delete')}
          onClick={() => setDeleting(row)}
        >
          <Icon name="delete" size={16} />
        </button>
      </span>
    )
  }

  function confirmDelete() {
    setBusy(true)
    usersApi
      .remove(deleting.id)
      .then(() => {
        notify.success('common.toast.deleted')
        setDeleting(null)
        table.reload()
      })
      .catch((error) => notify.failure(error))
      .finally(() => setBusy(false))
  }

  return (
    <div className="page">
      <PageTitle title={t('users.title')} />

      {table.error && <ErrorState message={t('common.error.page')} onRetry={table.reload} />}

      <DataTable
        {...table.tableProps}
        columns={columns}
        createLabel={t('users.createLabel')}
        onCreate={() => setEditing({ user: null })}
        rowActions={renderRowActions}
      />

      {editing && (
        <UserFormModal
          user={editing.user}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            table.reload()
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          name={deleting.username}
          busy={busy}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}
