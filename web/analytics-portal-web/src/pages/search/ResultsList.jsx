import useT from '../../hooks/useT'
import { formatCurrency } from '../../utils/format'

/**
 * The products of one page. On phones each product is a card; from the tablet width up the same list becomes a table
 * with a header row. One list serves both layouts, so screen readers hear the same products either way.
 */
export default function ResultsList({ hits }) {
  const { t, language } = useT()

  return (
    <ul className="results" aria-label={t('search.results.label')}>
      <li className="results-head" aria-hidden="true">
        <span>{t('search.results.name')}</span>
        <span>{t('search.results.category')}</span>
        <span>{t('search.results.brand')}</span>
        <span>{t('search.results.price')}</span>
      </li>
      {hits.map((hit) => (
        <li className="result" key={hit.id}>
          <span className="result-name" data-label={t('search.results.name')}>
            {hit.name}
          </span>
          <span className="result-category" data-label={t('search.results.category')}>
            {hit.categoryLabel || hit.category}
          </span>
          <span className="result-brand" data-label={t('search.results.brand')}>
            {hit.brand}
          </span>
          <span className="result-price" data-label={t('search.results.price')}>
            {formatCurrency(hit.price, language, 2)}
          </span>
        </li>
      ))}
    </ul>
  )
}
