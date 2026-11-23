import { useCallback, useEffect, useState } from 'react'

import { searchApi } from '../../api/resources'
import useNotify from '../../hooks/useNotify'
import { REINDEX_POLL_MS } from './smartSearch'

/**
 * Starts a full rebuild of the search index and follows its progress. While the rebuild runs the status is read
 * again every two seconds, until it succeeds or fails. A status request that fails stops the polling.
 */
export default function useReindex() {
  const notify = useNotify()
  const [status, setStatus] = useState(null)
  const [starting, setStarting] = useState(false)
  const [unreachable, setUnreachable] = useState(false)
  const running = status !== null && status.state === 'RUNNING' && !unreachable

  useEffect(() => {
    if (!running) {
      return undefined
    }
    const timer = setTimeout(() => {
      searchApi
        .reindexStatus()
        .then(setStatus)
        .catch(() => setUnreachable(true))
    }, REINDEX_POLL_MS)
    return () => clearTimeout(timer)
  }, [running, status])

  const start = useCallback(() => {
    setStarting(true)
    setUnreachable(false)
    searchApi
      .startReindex()
      .then(setStatus)
      .catch((error) => notify.failure(error))
      .finally(() => setStarting(false))
  }, [notify])

  return { status, busy: starting || running, unreachable, start }
}
