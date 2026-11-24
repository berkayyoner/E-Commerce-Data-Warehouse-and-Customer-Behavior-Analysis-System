import { useCallback, useEffect, useRef, useState } from 'react'

const DEBOUNCE_MS = 300

/**
 * State and loading for a server-driven {@link DataTable}.
 *
 * {@code fetcher({ page, size, sort, search, ...filters })} resolves to { content, total }. The search text is
 * debounced; changing the search, the sort or a filter returns to the first page; a response that arrives after
 * a newer request has started is ignored.
 */
export default function useServerTable(fetcher, { initialSort, size = 20, filters = {} } = {}) {
  const filtersKey = JSON.stringify(filters)
  // A change of filters silently falls back to the first page.
  const [pageState, setPageState] = useState({ page: 0, key: filtersKey })
  const page = pageState.key === filtersKey ? pageState.page : 0
  const setPage = useCallback((next) => setPageState({ page: next, key: filtersKey }), [filtersKey])

  const [sort, setSort] = useState(initialSort)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [state, setState] = useState({ rows: [], total: 0, loading: true, error: null })
  const [reloadToken, setReloadToken] = useState(0)
  const requestId = useRef(0)

  useEffect(() => {
    if (searchInput === search) {
      return undefined
    }
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(0)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, search, setPage])

  useEffect(() => {
    const current = ++requestId.current
    setState((previous) => ({ ...previous, loading: true, error: null }))
    fetcher({ page, size, sort, search, ...JSON.parse(filtersKey) })
      .then((result) => {
        if (current === requestId.current) {
          setState({ rows: result.content || [], total: result.total || 0, loading: false, error: null })
        }
      })
      .catch((error) => {
        if (current === requestId.current) {
          setState({ rows: [], total: 0, loading: false, error })
        }
      })
  }, [fetcher, page, size, sort, search, filtersKey, reloadToken])

  const changeSort = useCallback(
    (next) => {
      setSort(next)
      setPage(0)
    },
    [setPage],
  )

  const reload = useCallback(() => setReloadToken((value) => value + 1), [])

  return {
    rows: state.rows,
    total: state.total,
    loading: state.loading,
    error: state.error,
    reload,
    tableProps: {
      rows: state.rows,
      total: state.total,
      loading: state.loading,
      page,
      size,
      sort,
      search: searchInput,
      onSearchChange: setSearchInput,
      onSortChange: changeSort,
      onPageChange: setPage,
    },
  }
}
