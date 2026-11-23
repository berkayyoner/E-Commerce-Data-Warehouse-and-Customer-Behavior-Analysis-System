import { useMemo, useState } from 'react'

import { analyticsApi } from '../../api/analyticsApi'
import PageTitle from '../../components/layout/PageTitle'
import useRoles from '../../auth/useRoles'
import useCachedResource from '../../hooks/useCachedResource'
import useT from '../../hooks/useT'
import { isValidRange, presetRange } from '../../utils/dateRange'
import CategoryWidget from './CategoryWidget'
import CustomerMetricsWidget from './CustomerMetricsWidget'
import FilterBar from './FilterBar'
import FulfillmentWidget from './FulfillmentWidget'
import KpiCards from './KpiCards'
import PaymentWidget from './PaymentWidget'
import RegionWidget from './RegionWidget'
import SalesTrendWidget from './SalesTrendWidget'
import TopCustomersWidget from './TopCustomersWidget'
import TopProductsWidget from './TopProductsWidget'
import queryKey from './queryKey'

const DEFAULT_PRESET = 'last12Months'

function initialFilters() {
  return { preset: DEFAULT_PRESET, category: '', ...presetRange(DEFAULT_PRESET) }
}

/**
 * The public dashboard. The filter bar (period and category) applies to every widget. Each widget loads on its own,
 * so a failing report shows its own error and leaves the others in place. The customer widgets are shown only to the
 * roles that may see individual customers.
 */
export default function DashboardPage() {
  const { t } = useT()
  const { canSeeCustomers } = useRoles()
  const [filters, setFilters] = useState(initialFilters)

  const rangeValid = isValidRange(filters.from, filters.to)
  const range = useMemo(
    () => (rangeValid ? { from: filters.from, to: filters.to } : null),
    [rangeValid, filters.from, filters.to],
  )
  const categoriesQuery = useCachedResource(queryKey('categories', range), () => analyticsApi.categories(range))
  const categoryNames = (categoriesQuery.data || []).map((row) => row.category).sort((a, b) => a.localeCompare(b))

  function choosePreset(preset) {
    const dates = presetRange(preset)
    setFilters((current) => ({ ...current, preset, ...(dates || {}) }))
  }

  function setBound(name, value) {
    setFilters((current) => ({ ...current, preset: 'custom', [name]: value }))
  }

  return (
    <div className="page dashboard-page">
      <PageTitle title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      <FilterBar
        preset={filters.preset}
        from={filters.from || ''}
        to={filters.to || ''}
        category={filters.category}
        categories={categoryNames}
        rangeValid={rangeValid}
        onPreset={choosePreset}
        onFrom={(value) => setBound('from', value)}
        onTo={(value) => setBound('to', value)}
        onCategory={(value) => setFilters((current) => ({ ...current, category: value }))}
      />

      <KpiCards range={range} />

      <div className="widget-grid">
        <SalesTrendWidget range={range} />
        <TopProductsWidget range={range} category={filters.category} />
        <CategoryWidget range={range} />
        <RegionWidget range={range} />
        <PaymentWidget range={range} />
        <FulfillmentWidget range={range} />
      </div>

      {canSeeCustomers && (
        <section className="customer-section" aria-label={t('dashboard.customers.sectionLabel')}>
          <CustomerMetricsWidget range={range} />
          <TopCustomersWidget range={range} />
        </section>
      )}
    </div>
  )
}
