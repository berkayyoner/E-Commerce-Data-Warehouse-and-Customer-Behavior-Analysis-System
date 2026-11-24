import { useState } from 'react'

import FormField from '../../../components/ui/FormField'
import Icon from '../../../components/ui/Icon'
import useT from '../../../hooks/useT'
import { PRESETS } from '../../../utils/dateRange'

const QUICK_PRESETS = PRESETS.filter((preset) => preset !== 'custom')

/**
 * Period and category choice that applies to the whole sales overview. On phones the fields fold away behind a
 * button; on wider screens they are always visible.
 */
export default function FilterBar({
  preset,
  from,
  to,
  category,
  categories,
  rangeValid,
  onPreset,
  onFrom,
  onTo,
  onCategory,
}) {
  const { t } = useT()
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="panel filter-bar" aria-label={t('analytics.filters.label')}>
      <button
        type="button"
        className="button button-ghost filter-toggle"
        aria-expanded={expanded}
        aria-controls="sales-filter-fields"
        onClick={() => setExpanded((value) => !value)}
      >
        <Icon name="filters" size={16} />
        <span>{t('analytics.filters.toggle')}</span>
      </button>

      <div id="sales-filter-fields" className={`filter-fields${expanded ? ' is-open' : ''}`}>
        <div className="segmented" role="group" aria-label={t('analytics.filters.period')}>
          {QUICK_PRESETS.map((item) => (
            <button
              key={item}
              type="button"
              className="segmented-option"
              aria-pressed={preset === item}
              onClick={() => onPreset(item)}
            >
              {t(`analytics.filters.${item}`)}
            </button>
          ))}
        </div>

        <FormField label={t('analytics.filters.from')}>
          {(props) => (
            <input type="date" value={from} max={to || undefined} onChange={(event) => onFrom(event.target.value)} {...props} />
          )}
        </FormField>

        <FormField label={t('analytics.filters.to')} error={rangeValid ? undefined : t('analytics.filters.invalidRange')}>
          {(props) => (
            <input type="date" value={to} min={from || undefined} onChange={(event) => onTo(event.target.value)} {...props} />
          )}
        </FormField>

        <FormField label={t('analytics.filters.category')} hint={t('analytics.filters.categoryHint')}>
          {(props) => (
            <select value={category} onChange={(event) => onCategory(event.target.value)} {...props}>
              <option value="">{t('analytics.filters.allCategories')}</option>
              {categories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>
    </section>
  )
}
