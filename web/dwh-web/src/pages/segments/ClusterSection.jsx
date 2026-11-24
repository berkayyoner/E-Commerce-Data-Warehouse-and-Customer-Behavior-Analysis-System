import { useState } from 'react'

import Icon from '../../components/ui/Icon'
import useT from '../../hooks/useT'
import { formatCurrency, formatDecimal, formatNumber, formatPercent } from '../../utils/format'
import WidgetCard from '../dashboard/WidgetCard'
import ElbowChart from './ElbowChart'

/** The K-Means clusters of the latest successful run, and the elbow curve that chose their number. */
export default function ClusterSection({ resource }) {
  const { t, language } = useT()
  const [showTable, setShowTable] = useState(false)
  const overview = resource.data
  const clusters = overview ? overview.clusters : []
  const elbow = overview ? overview.elbow : []
  const chosenK = overview ? overview.chosenK : null
  const kValues = elbow.map((point) => point.k)
  const elbowSummary = t('segments.clusters.elbow.summary', {
    min: kValues.length ? Math.min(...kValues) : 0,
    max: kValues.length ? Math.max(...kValues) : 0,
    k: chosenK === null ? '-' : chosenK,
  })

  return (
    <>
      <WidgetCard
        title={t('segments.clusters.title')}
        loading={resource.loading}
        error={resource.error}
        onRetry={resource.reload}
        wide
      >
        {clusters.length === 0 ? (
          <p className="empty-note">{t('segments.clusters.empty')}</p>
        ) : (
          <>
            {chosenK !== null && <p className="field-hint">{t('segments.clusters.chosenK', { k: chosenK })}</p>}
            <div className="data-table-scroll">
              <table className="plain-table">
                <caption className="sr-only">{t('segments.clusters.title')}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('segments.clusters.columns.label')}</th>
                    <th scope="col">{t('segments.clusters.columns.customers')}</th>
                    <th scope="col">{t('segments.clusters.columns.share')}</th>
                    <th scope="col">{t('segments.clusters.columns.recency')}</th>
                    <th scope="col">{t('segments.clusters.columns.frequency')}</th>
                    <th scope="col">{t('segments.clusters.columns.monetary')}</th>
                  </tr>
                </thead>
                <tbody>
                  {clusters.map((cluster) => (
                    <tr key={cluster.clusterId}>
                      <th scope="row">{cluster.label}</th>
                      <td>{formatNumber(cluster.customers, language)}</td>
                      <td>{formatPercent(cluster.share, language)}</td>
                      <td>{formatDecimal(cluster.averageRecencyDays, language)}</td>
                      <td>{formatDecimal(cluster.averageFrequency, language)}</td>
                      <td>{formatCurrency(cluster.averageMonetary, language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </WidgetCard>

      <WidgetCard
        title={t('segments.clusters.elbow.title')}
        loading={resource.loading}
        error={resource.error}
        onRetry={resource.reload}
        wide
      >
        {elbow.length === 0 ? (
          <p className="empty-note">{t('segments.clusters.empty')}</p>
        ) : (
          <>
            <p className="field-hint">{elbowSummary}</p>
            <div className="widget-toolbar">
              <button type="button" className="button button-ghost" onClick={() => setShowTable((value) => !value)}>
                <Icon name={showTable ? 'chart' : 'table'} size={16} />
                <span>{t(showTable ? 'segments.clusters.elbow.showChart' : 'segments.clusters.elbow.showTable')}</span>
              </button>
            </div>
            {showTable ? (
              <div className="data-table-scroll">
                <table className="plain-table">
                  <caption className="sr-only">{t('segments.clusters.elbow.table')}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{t('segments.clusters.elbow.axisK')}</th>
                      <th scope="col">{t('segments.clusters.elbow.axisInertia')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elbow.map((point) => (
                      <tr key={point.k} className={point.k === chosenK ? 'is-chosen-row' : undefined}>
                        <th scope="row">{point.k}</th>
                        <td>{formatNumber(Math.round(point.inertia), language)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <ElbowChart
                points={elbow}
                chosenK={chosenK}
                title={elbowSummary}
                chosenLabel={t('segments.clusters.chosenBadge')}
              />
            )}
          </>
        )}
      </WidgetCard>
    </>
  )
}
