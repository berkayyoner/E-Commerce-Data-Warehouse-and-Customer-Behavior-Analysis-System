import { useId } from 'react'

import FormField from '../../components/ui/FormField'
import useT from '../../hooks/useT'
import { INITIAL_CRITERIA, toggleValue } from './smartSearch'

/**
 * Facet filters of the smart search. The categories and brands come from the facets of the last answer; each choice
 * narrows the search on the server. The service takes one brand, so choosing a brand replaces the previous one.
 */
export default function SearchFacets({ facets, criteria, onChange }) {
  const { t } = useT()
  const titleId = useId()
  const categories = facets ? facets.categories : []
  const brands = facets ? facets.brands : []

  return (
    <aside className="panel facet-panel" aria-labelledby={titleId}>
      <div className="facet-head">
        <h2 id={titleId}>{t('products.smart.facets.title')}</h2>
        <button
          type="button"
          className="button button-ghost"
          onClick={() =>
            onChange({ categories: INITIAL_CRITERIA.categories, brand: '', minPrice: '', maxPrice: '', page: 0 })
          }
        >
          {t('products.smart.facets.clear')}
        </button>
      </div>

      <fieldset className="facet-group">
        <legend>{t('products.smart.facets.categories')}</legend>
        {categories.map((term) => (
          <label key={term.value} className="facet-option">
            <input
              type="checkbox"
              checked={criteria.categories.includes(term.value)}
              onChange={() => onChange({ categories: toggleValue(criteria.categories, term.value), page: 0 })}
            />
            <span>{term.value}</span>
            <span className="facet-count">{term.count}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="facet-group">
        <legend>{t('products.smart.facets.brands')}</legend>
        <p className="field-hint">{t('products.smart.facets.brandHint')}</p>
        {brands.map((term) => (
          <label key={term.value} className="facet-option">
            <input
              type="checkbox"
              checked={criteria.brand === term.value}
              onChange={(event) => onChange({ brand: event.target.checked ? term.value : '', page: 0 })}
            />
            <span>{term.value}</span>
            <span className="facet-count">{term.count}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="facet-group">
        <legend>{t('products.smart.facets.price')}</legend>
        <FormField label={t('products.smart.facets.minPrice')}>
          {(props) => (
            <input
              {...props}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={criteria.minPrice}
              onChange={(event) => onChange({ minPrice: event.target.value, page: 0 })}
            />
          )}
        </FormField>
        <FormField label={t('products.smart.facets.maxPrice')}>
          {(props) => (
            <input
              {...props}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={criteria.maxPrice}
              onChange={(event) => onChange({ maxPrice: event.target.value, page: 0 })}
            />
          )}
        </FormField>
      </fieldset>
    </aside>
  )
}
