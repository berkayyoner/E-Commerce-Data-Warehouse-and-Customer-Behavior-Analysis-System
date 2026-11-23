import { useCallback, useEffect, useRef, useState } from 'react'

import { etlApi } from '../../api/resources'
import usePageVisible from '../../hooks/usePageVisible'

export const RUN_PAGE_SIZE = 20
export const POLL_INTERVAL_MS = 5000

/**
 * One page of ETL runs. While a run is RUNNING the list is reloaded every 5 seconds, but only while the browser
 * tab is visible and the list is still mounted.
 */
export default function useRunList(page) {
  const visible = usePageVisible()
  const [state, setState] = useState({ rows: [], total: 0, loading: true, error: null })
  const [reloadToken, setReloadToken] = useState(0)
  const requestId = useRef(0)

  useEffect(() => {
    const current = ++requestId.current
    etlApi
      .listRuns({ page, size: RUN_PAGE_SIZE })
      .then((result) => {
        if (current === requestId.current) {
          setState({ rows: result.content || [], total: result.total || 0, loading: false, error: null })
        }
      })
      .catch((error) => {
        if (current === requestId.current) {
          setState((previous) => ({ ...previous, loading: false, error }))
        }
      })
  }, [page, reloadToken])

  const anyRunning = state.rows.some((run) => run.status === 'RUNNING')
  const reload = useCallback(() => setReloadToken((value) => value + 1), [])

  useEffect(() => {
    if (!anyRunning || !visible) {
      return undefined
    }
    const timer = setTimeout(reload, POLL_INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [anyRunning, visible, reload, state.rows])

  return { ...state, reload }
}
