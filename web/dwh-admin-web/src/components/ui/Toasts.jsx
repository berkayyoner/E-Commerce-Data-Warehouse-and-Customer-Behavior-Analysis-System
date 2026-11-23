import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import useT from '../../hooks/useT'
import { dismissToast } from '../../store/uiSlice'
import Icon from './Icon'

const LIFETIME_MS = 4500

function Toast({ toast }) {
  const dispatch = useDispatch()
  const { t } = useT()

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), LIFETIME_MS)
    return () => clearTimeout(timer)
  }, [dispatch, toast.id])

  const isError = toast.kind === 'error'
  return (
    <div className={`toast toast-${toast.kind}`} role={isError ? 'alert' : 'status'}>
      <Icon name={isError ? 'warning' : 'check'} />
      <span>{toast.message || t(toast.messageKey)}</span>
      <button
        type="button"
        className="icon-button"
        onClick={() => dispatch(dismissToast(toast.id))}
        aria-label={t('common.actions.close')}
      >
        <Icon name="close" size={14} />
      </button>
    </div>
  )
}

/** Stack of success and error messages in the bottom-right corner. */
export default function Toasts() {
  const toasts = useSelector((state) => state.ui.toasts)
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
