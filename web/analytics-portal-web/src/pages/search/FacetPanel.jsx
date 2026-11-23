import { useState } from 'react'

import FormField from '../../components/ui/FormField'
import useT from '../../hooks/useT'
import { formatCurrency, formatNumber } from '../../utils/format'
import { isPriceRangeValid, parsePrice } from './searchState'

/**
 * The filters beside the results: categories (several may be ticked), one brand (a second press clears it) and a
 * price range. The counts come from the answer of the search, so they describe the current results.
 */
export default function FacetPanel({
  facets,
  selectedCategories,
  selectedBrand,
  appliedPrice,
  labelFor,
  language,
  onToggleCategory,
  onSelectBrand,
  onApplyPrice,
  onClear,
  hasFilters,
}) {
  const { t } = useT()
  const [minText, setMinText] = useState(appliedPrice.min === undefined ? '' : String(appliedPrice.min))
  const [maxText, setMaxText] = useState(appliedPrice.max === undefined ? '' : String(appliedPrice.max))
  const [priceError, setPriceError] = useState('')

  const categories = facets ? facets.categories : []
  const brands = facets ? facets.brands : []
  const range = facets ? facets.price : null

  function applyPrice(event) {
    event.preventDefault()
    const min = parsePrice(minText)
    const max = parsePrice(maxText)
    if (!isPriceRangeValid(min, max)) {
      setPriceError(t('search.facets.priceInvalid'))
      return
    }
    setPriceError('')
    onApplyPrice({ min, max })
  }

  function clearAll() {
    setMinText('')
    setMaxText('')
    setPriceError('')
    onClear()
  }

  return (
    <aside className="panel facets" aria-label={t('search.facets.label')}>
      <header className="facets-header">
        <h2>{t('search.facets.label')}</h2>
        {hasFilters && (
          <button type="button" className="button button-ghost button-compact" onClick={clearAll}>
            <span>{t('search.facets.clear')}</span>
          </button>
        )}
      </header>

      <fieldset className="facet-group">
        <legend>{t('search.facets.categories')}</legend>
        {categories.length === 0 && <p className="empty-note">{t('search.facets.none')}</p>}
        {categories.map((facet) => (
          <label className="checkbox-row facet-option" key={facet.value}>
            <input
              type="checkbox"
              checked={selectedCategories.includes(facet.value)}
              onChange={() => onToggleCategory(facet.value)}
            />
            <span>{labelFor(facet.value)}</span>
            <span className="facet-count">({formatNumber(facet.count, language)})</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="facet-group">
        <legend>{t('search.facets.brands')}</legend>
        {brands.length === 0 && <p className="empty-note">{t('search.facets.none')}</p>}
        <div className="chip-list">
          {brands.map((facet) => (
            <button
              key={facet.value}
              type="button"
              className="chip"
              aria-pressed={selectedBrand === facet.value}
              onClick={() => onSelectBrand(facet.value)}
            >
              <span>{facet.value}</span>
              <span className="facet-count">({formatNumber(facet.count, language)})</span>
            </button>
          ))}
        </div>
      </fieldset>

      <form className="facet-group price-form" onSubmit={applyPrice} noValidate>
        <fieldset className="facet-group">
          <legend>{t('search.facets.price')}</legend>
          {range && range.min !== null && range.max !== null && (
            <p className="field-hint">
              {t('search.facets.priceHint', {
                min: formatCurrency(range.min, language, 2),
                max: formatCurrency(range.max, language, 2),
              })}
            </p>
          )}
          <div className="price-fields">
            <FormField label={t('search.facets.min')}>
              {(props) => (
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={minText}
                  onChange={(event) => setMinText(event.target.value)}
                  {...props}
                />
              )}
            </FormField>
            <FormField label={t('search.facets.max')} error={priceError || undefined}>
              {(props) => (
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={maxText}
                  onChange={(event) => setMaxText(event.target.value)}
                  {...props}
                />
              )}
            </FormField>
          </div>
          <button type="submit" className="button button-ghost button-block">
            <span>{t('search.facets.apply')}</span>
          </button>
        </fieldset>
      </form>
    </aside>
  )
}
