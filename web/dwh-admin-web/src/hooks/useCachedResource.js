import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { cacheStored, isFresh } from '../store/cacheSlice'

/**
 * Loads one value for a dashboard widget. A value loaded within the last minute is reused, so going back to
 * the dashboard does not call the services again. The returned retry() always asks the service again.
 */
export default function useCachedResource(key, fetcher) {
  const dispatch = useDispatch()
  const entry = useSelector((state) => state.cache.entries[key])
  const entryRef = useRef(entry)
  entryRef.current = entry
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState(() => ({
    data: entry ? entry.data : null,
    error: null,
    loading: !isFresh(entry),
  }))

  useEffect(() => {
    const cached = entryRef.current
    if (attempt === 0 && isFresh(cached)) {
      setState({ data: cached.data, error: null, loading: false })
      return undefined
    }

    let active = true
    setState((previous) => ({ ...previous, loading: true, error: null }))
    fetcherRef.current()
      .then((data) => {
        if (active) {
          dispatch(cacheStored(key, data))
          setState({ data, error: null, loading: false })
        }
      })
      .catch((error) => {
        if (active) {
          setState({ data: null, error, loading: false })
        }
      })
    return () => {
      active = false
    }
  }, [key, attempt, dispatch])

  return { ...state, retry: () => setAttempt((value) => value + 1) }
}
