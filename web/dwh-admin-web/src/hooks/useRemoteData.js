import { useCallback, useEffect, useState } from 'react'

/**
 * Loads one value with a fetcher that is defined outside the component, so it keeps its identity. The value
 * loads again when reload() is called or when refreshToken changes, which lets a parent ask every section for
 * fresh data after an action. A response that arrives after a newer request has started is ignored.
 */
export default function useRemoteData(fetcher, refreshToken = 0) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let current = true
    setState((previous) => ({ ...previous, loading: true, error: null }))
    fetcher()
      .then((data) => {
        if (current) {
          setState({ data, error: null, loading: false })
        }
      })
      .catch((error) => {
        if (current) {
          setState({ data: null, error, loading: false })
        }
      })
    return () => {
      current = false
    }
  }, [fetcher, reloadToken, refreshToken])

  const reload = useCallback(() => setReloadToken((value) => value + 1), [])
  return { ...state, reload }
}
