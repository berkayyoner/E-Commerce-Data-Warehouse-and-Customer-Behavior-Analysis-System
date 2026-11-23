import { useCallback, useEffect, useState } from 'react'

import { searchApi } from '../../api/resources'
import useRoles from '../../auth/useRoles'
import useT from '../../hooks/useT'
import ReindexPanel from './ReindexPanel'
import SearchFacets from './SearchFacets'
import SearchResults from './SearchResults'
import SuggestBox from './SuggestBox'
import { INITIAL_CRITERIA, buildSearchParams, priceRangeError } from './smartSearch'

/**
 * Smart search over the Elasticsearch index: typeahead, facets, price range, sorting and paged hits. The language of
 * the results and the suggestions follows the language of the console. Administrators can rebuild the index.
 */
export default function SmartSearchView() {
  const { t, language } = useT()
  const { isAdmin } = useRoles()
  const [criteria, setCriteria] = useState(INITIAL_CRITERIA)
  const [reloadToken, setReloadToken] = useState(0)
  const [result, setResult] = useState({ data: null, error: null, loading: true })
  const priceErrorKey = priceRangeError(criteria)

  useEffect(() => {
    if (priceRangeError(criteria)) {
      return undefined
    }
    let current = true
    setResult((previous) => ({ ...previous, loading: true, error: null }))
    searchApi
      .products(buildSearchParams(criteria, language))
      .then((data) => {
        if (current) {
          setResult({ data, error: null, loading: false })
        }
      })
      .catch((error) => {
        if (current) {
          setResult({ data: null, error, loading: false })
        }
      })
    return () => {
      current = false
    }
  }, [criteria, language, reloadToken])

  const updateCriteria = useCallback((patch) => setCriteria((previous) => ({ ...previous, ...patch })), [])
  const reload = useCallback(() => setReloadToken((value) => value + 1), [])
  const facets = result.data ? result.data.facets : null

  return (
    <div className="smart-search">
      <div className="smart-toolbar">
        <SuggestBox lang={language} onSearch={(text) => updateCriteria({ q: text, page: 0 })} />
        {isAdmin && <ReindexPanel />}
      </div>

      <div className="smart-layout">
        <SearchFacets facets={facets} criteria={criteria} onChange={updateCriteria} />
        <div className="smart-results">
          {priceErrorKey && (
            <p className="form-alert" role="alert">
              {t(priceErrorKey)}
            </p>
          )}
          <SearchResults resource={{ ...result, reload }} criteria={criteria} onChange={updateCriteria} />
        </div>
      </div>
    </div>
  )
}
