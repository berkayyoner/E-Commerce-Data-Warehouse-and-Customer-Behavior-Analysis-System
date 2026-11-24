import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import { pushToast } from '../store/uiSlice'

/** Translation key for the toast that describes a failed request when the server gave no detail. */
export function errorMessageKey(error) {
  const status = error && error.response ? error.response.status : undefined
  if (status === 403) {
    return 'common.toast.forbidden'
  }
  if (status === 409) {
    return 'common.toast.conflict'
  }
  return 'common.toast.failed'
}

/** The "detail" text of an RFC 7807 problem response, which the server writes in the person's language. */
export function serverMessage(error) {
  const data = error && error.response ? error.response.data : null
  return data && typeof data.detail === 'string' && data.detail ? data.detail : null
}

/** Success and error toasts. */
export default function useNotify() {
  const dispatch = useDispatch()
  const success = useCallback(
    (messageKey = 'common.toast.saved') => dispatch(pushToast('success', messageKey)),
    [dispatch],
  )
  const failure = useCallback(
    (error) => dispatch(pushToast('error', errorMessageKey(error), serverMessage(error))),
    [dispatch],
  )
  return useMemo(() => ({ success, failure }), [success, failure])
}
