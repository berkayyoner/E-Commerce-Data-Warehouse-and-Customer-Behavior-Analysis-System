import ErrorState from '../../components/ui/ErrorState'
import FormField from '../../components/ui/FormField'
import Icon from '../../components/ui/Icon'
import useT from '../../hooks/useT'
import { formatCurrency, formatNumber, formatScore } from '../../utils/format'
import { RESULT_PAGE_SIZE, SORT_KEYS, nextPriceSort } from './smartSearch'

function priceDirection(sort) {
  if (sort === 'priceAsc') {
    return 'ascending'
  }
  return sort === 'priceDesc' ? 'descending' : 'none'
}

function priceIcon(sort) {
  if (sort === 'priceAsc') {
    return 'arrowUp'
  }
  return sort === 'priceDesc' ? 'arrowDown' : 'chevronsUpDown'
}

/**
 * Paged search hits as table rows. The name and price headers sort the results; the sort list does the same.
 * The relevance score is shown with the localized category name.
 */
export default function SearchResults({ resource, criteria, onChange }) {
  const { t, language } = useT()
  const { data, error, loading, reload } = resource
  const rows = data ? data.content : []
  const total = data ? data.total : 0
  const pages = Math.max(1, Math.ceil(total / RESULT_PAGE_SIZE))
  const from = total === 0 ? 0 : criteria.page * RESULT_PAGE_SIZE + 1
  const to = Math.min(total, (criteria.page + 1) * RESULT_PAGE_SIZE)
  const nameLabel = t('products.smart.results.columns.name')
  const priceLabel = t('products.smart.results.columns.price')
  const nameSorted = criteria.sort === 'nameAsc'

  return (
    <section className="data-table results-table" aria-busy={loading}>
      <div className="data-table-toolbar">
        <FormField label={t('products.smart.sort.label')}>
          {(props) => (
            <select {...props} value={criteria.sort} onChange={(event) => onChange({ sort: event.target.value, page: 0 })}>
              {SORT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t(`products.smart.sort.${key}`)}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <p className="results-summary">{t('products.smart.results.summary', { total: formatNumber(total, language) })}</p>
      </div>

      {error ? (
        <ErrorState message={t('common.error.page')} onRetry={reload} />
      ) : (
        <div className="data-table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col" aria-sort={nameSorted ? 'ascending' : 'none'}>
                  <button
                    type="button"
                    className="sort-button"
                    title={t('common.table.sortBy', { column: nameLabel })}
                    onClick={() => onChange({ sort: 'nameAsc', page: 0 })}
                  >
                    <span>{nameLabel}</span>
                    <Icon name={nameSorted ? 'arrowUp' : 'chevronsUpDown'} size={14} />
                  </button>
                </th>
                <th scope="col">{t('products.smart.results.columns.category')}</th>
                <th scope="col">{t('products.smart.results.columns.brand')}</th>
                <th scope="col" aria-sort={priceDirection(criteria.sort)}>
                  <button
                    type="button"
                    className="sort-button"
                    title={t('common.table.sortBy', { column: priceLabel })}
                    onClick={() => onChange({ sort: nextPriceSort(criteria.sort), page: 0 })}
                  >
                    <span>{priceLabel}</span>
                    <Icon name={priceIcon(criteria.sort)} size={14} />
                  </button>
                </th>
                <th scope="col">{t('products.smart.results.columns.score')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-message">
                    {loading ? t('common.table.loading') : t('products.smart.results.empty')}
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id}>
                  <td data-label={nameLabel}>{row.name}</td>
                  <td data-label={t('products.smart.results.columns.category')}>{row.categoryLabel}</td>
                  <td data-label={t('products.smart.results.columns.brand')}>{row.brand}</td>
                  <td data-label={priceLabel}>{formatCurrency(row.price, language)}</td>
                  <td data-label={t('products.smart.results.columns.score')}>{formatScore(row.score, language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="data-table-footer">
        <span>{t('common.table.showing', { from, to, total })}</span>
        <div className="pagination">
          <button
            type="button"
            className="button button-ghost"
            disabled={criteria.page <= 0}
            onClick={() => onChange({ page: criteria.page - 1 })}
          >
            <Icon name="chevronLeft" size={16} />
            <span>{t('common.table.previous')}</span>
          </button>
          <span>{t('common.table.page', { page: criteria.page + 1, pages })}</span>
          <button
            type="button"
            className="button button-ghost"
            disabled={criteria.page + 1 >= pages}
            onClick={() => onChange({ page: criteria.page + 1 })}
          >
            <span>{t('common.table.next')}</span>
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </div>
    </section>
  )
}
