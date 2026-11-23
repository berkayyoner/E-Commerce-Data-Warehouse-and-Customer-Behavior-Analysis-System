import useT from '../../hooks/useT'
import Modal from './Modal'

/** Confirmation for destructive actions such as deleting a record. */
export default function ConfirmDialog({ name, onConfirm, onCancel, busy = false }) {
  const { t } = useT()
  return (
    <Modal
      title={t('common.confirmDelete.title')}
      onClose={onCancel}
      size="small"
      footer={
        <>
          <button type="button" className="button button-ghost" onClick={onCancel} disabled={busy}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button button-danger" onClick={onConfirm} disabled={busy}>
            {t('common.actions.delete')}
          </button>
        </>
      }
    >
      <p>{t('common.confirmDelete.message', { name })}</p>
    </Modal>
  )
}
