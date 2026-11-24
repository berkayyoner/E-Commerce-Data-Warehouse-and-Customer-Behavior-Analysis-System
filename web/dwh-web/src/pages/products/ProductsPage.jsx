import { useState } from 'react'

import PageTitle from '../../components/layout/PageTitle'
import useT from '../../hooks/useT'
import CatalogView from './CatalogView'
import SmartSearchView from './SmartSearchView'

/** Products: the database catalog, or the smart search over the search index. A segmented control switches them. */
export default function ProductsPage() {
  const { t } = useT()
  const [view, setView] = useState('catalog')
  const views = [
    { key: 'catalog', label: t('products.views.catalog') },
    { key: 'smart', label: t('products.views.search') },
  ]

  return (
    <div className="page">
      <PageTitle title={t('products.title')} subtitle={t('products.subtitle')} />

      <div className="segmented" role="group" aria-label={t('products.views.label')}>
        {views.map((option) => (
          <button
            key={option.key}
            type="button"
            className="segmented-option"
            aria-pressed={view === option.key}
            onClick={() => setView(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {view === 'catalog' ? <CatalogView /> : <SmartSearchView />}
    </div>
  )
}
