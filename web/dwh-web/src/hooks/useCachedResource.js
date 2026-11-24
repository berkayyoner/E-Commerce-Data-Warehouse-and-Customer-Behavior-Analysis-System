import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { cacheStored, isFresh } from '../store/cacheSlice'

/**
 * Loads one value for a widget. A value loaded within the last minute is reused, so going back to a page does not
 * call the services again. retry() always asks the service again. A null key means there is nothing to load yet
 * (for example while the date range is invalid): the state is then idle.
 */
export default function useCachedResource(key, fetcher) {
  const dispatch = useDispatch()
  const entry = useSelector((state) => (key ? state.cache.entries[key] : undefined))
  const entryRef = useRef(entry)
  entryRef.current = entry
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState(() => ({
    key,
    data: entry ? entry.data : null,
    error: null,
    loading: Boolean(key) && !isFresh(entry),
  }))

  useEffect(() => {
    if (!key) {
      setState({ key, data: null, error: null, loading: false })
      return undefined
    }
    const cached = entryRef.current
    if (attempt === 0 && isFresh(cached)) {
      setState({ key, data: cached.data, error: null, loading: false })
      return undefined
    }

    let active = true
    setState((previous) => ({
      key,
      data: previous.key === key ? previous.data : null,
      error: null,
      loading: true,
    }))
    fetcherRef.current()
      .then((data) => {
        if (active) {
          dispatch(cacheStored(key, data))
          setState({ key, data, error: null, loading: false })
        }
      })
      .catch((error) => {
        if (active) {
          setState({ key, data: null, error, loading: false })
        }
      })
    return () => {
      active = false
    }
  }, [key, attempt, dispatch])

  const retry = () => setAttempt((value) => value + 1)

  // When the key has just changed, the render comes before the effect above runs. The state then still holds the
  // answer for the previous key, which must not reach the widgets (their formatting expects this key's data).
  if (state.key !== key) {
    return { data: null, error: null, loading: Boolean(key), idle: !key, retry }
  }
  return { data: state.data, error: state.error, loading: state.loading, idle: !key, retry }
}
