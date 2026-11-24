import { useMemo, useState } from 'react'

import PageTitle from '../../../components/layout/PageTitle'
import ErrorState from '../../../components/ui/ErrorState'
import FormField from '../../../components/ui/FormField'
import Icon from '../../../components/ui/Icon'
import Skeleton from '../../../components/ui/Skeleton'
import useT from '../../../hooks/useT'
import { formatNumber } from '../../../utils/format'
import FacetPanel from './FacetPanel'
import ResultsList from './ResultsList'
import SearchBox from './SearchBox'
import { PAGE_SIZE, SORT_KEYS } from './searchState'
import useProductSearch from './useProductSearch'

const INITIAL_FILTERS = Object.freeze({
  query: '',
  categories: [],
  brand: '',
  minPrice: undefined,
  maxPrice: undefined,
  sort: 'relevance',
  page: 0,
})

/** Maps each category name of the facets to its name in the language of the request. */
function categoryLabels(data) {
  const labels = {}
  if (data) {
    data.content.forEach((hit) => {
      if (hit.categoryLabel) {
        labels[hit.category] = hit.categoryLabel
      }
    })
  }
  return labels
}

/**
 * Product search: a search field with typeahead, filters beside the results and a list of the products. The
 * language of the answer follows the language of the application. Every change of a filter returns to the first page.
 */
export default function SearchPage() {
  const { t, language } = useT()
  const [draft, setDraft] = useState('')
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const request = useMemo(() => ({ ...filters, language, size: PAGE_SIZE }), [filters, language])
  const search = useProductSearch(request)
  const data = search.data
  const labels = useMemo(() => categoryLabels(data), [data])

  const total = data ? data.total : 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasFilters =
    filters.categories.length > 0 || filters.brand !== '' || filters.minPrice !== undefined || filters.maxPrice !== undefined

  /** Changes filters and returns to the first page, because the old page may not exist any more. */
  function changeFilters(change) {
    setFilters((current) => ({ ...change(current), page: 0 }))
  }

  function toggleCategory(value) {
    changeFilters((current) => ({
      ...current,
      categories: current.categories.includes(value)
        ? current.categories.filter((item) => item !== value)
        : [...current.categories, value],
    }))
  }

  function renderResults() {
    if (search.status === 'error') {
      return <ErrorState message={t('search.results.error')} onRetry={search.retry} />
    }
    if (search.status === 'loading') {
      return <Skeleton lines={8} />
    }
    if (data.content.length === 0) {
      return <p className="empty-state">{t('search.results.empty')}</p>
    }
    return <ResultsList hits={data.content} />
  }

  return (
    <div className="analytics-scope">
      <div className="page search-page">
        <PageTitle title={t('search.title')} subtitle={t('search.subtitle')} />

        <SearchBox
          value={draft}
          onChange={setDraft}
          onSearch={(text) => changeFilters((current) => ({ ...current, query: text }))}
        />

        <div className="search-layout">
          <FacetPanel
            facets={data ? data.facets : null}
            selectedCategories={filters.categories}
            selectedBrand={filters.brand}
            appliedPrice={{ min: filters.minPrice, max: filters.maxPrice }}
            labelFor={(value) => labels[value] || value}
            language={language}
            hasFilters={hasFilters}
            onToggleCategory={toggleCategory}
            onSelectBrand={(value) =>
              changeFilters((current) => ({ ...current, brand: current.brand === value ? '' : value }))
            }
            onApplyPrice={({ min, max }) => changeFilters((current) => ({ ...current, minPrice: min, maxPrice: max }))}
            onClear={() =>
              changeFilters((current) => ({
                ...current,
                categories: [],
                brand: '',
                minPrice: undefined,
                maxPrice: undefined,
              }))
            }
          />

          <section className="search-results-panel" aria-label={t('search.results.section')}>
            <div className="results-toolbar">
              <p className="results-count" role="status" aria-live="polite">
                {search.status === 'ready' ? t('search.results.count', { total: formatNumber(total, language) }) : ''}
              </p>
              <FormField label={t('search.sort.label')}>
                {(props) => (
                  <select
                    value={filters.sort}
                    onChange={(event) => changeFilters((current) => ({ ...current, sort: event.target.value }))}
                    {...props}
                  >
                    {SORT_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {t(`search.sort.options.${key}`)}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>
            </div>

            {renderResults()}

            {search.status === 'ready' && total > 0 && (
              <nav className="search-pagination" aria-label={t('search.results.pagination')}>
                <button
                  type="button"
                  className="button button-ghost"
                  disabled={filters.page <= 0}
                  onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
                >
                  <Icon name="chevronLeft" size={16} />
                  <span>{t('search.results.previous')}</span>
                </button>
                <span>{t('search.results.page', { page: filters.page + 1, pages })}</span>
                <button
                  type="button"
                  className="button button-ghost"
                  disabled={filters.page + 1 >= pages}
                  onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
                >
                  <span>{t('search.results.next')}</span>
                  <Icon name="chevronRight" size={16} />
                </button>
              </nav>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
