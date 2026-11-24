import { useEffect, useId, useState } from 'react'

import { segmentationApi } from '../../api/resources'
import DataTable from '../../components/ui/DataTable'
import ErrorState from '../../components/ui/ErrorState'
import FormField from '../../components/ui/FormField'
import useServerTable from '../../components/ui/useServerTable'
import useT from '../../hooks/useT'
import { formatCurrency, formatNumber } from '../../utils/format'

const INITIAL_SORT = { key: 'monetary', direction: 'desc' }

/**
 * The customers with their RFM scores, segment and cluster. Searchable and sortable on the server; the segment and
 * the cluster filters narrow the list. It reloads after a segmentation run (refreshToken changes).
 */
export default function SegmentCustomers({ segments, clusters, refreshToken }) {
  const { t, language } = useT()
  const titleId = useId()
  const [segment, setSegment] = useState('')
  const [cluster, setCluster] = useState('')
  const table = useServerTable(segmentationApi.customers, {
    initialSort: INITIAL_SORT,
    filters: { segment, cluster },
  })
  const { reload } = table

  useEffect(() => {
    if (refreshToken > 0) {
      reload()
    }
  }, [refreshToken, reload])

  const segmentRows = segments.data || []
  const clusterRows = clusters.data ? clusters.data.clusters : []

  const columns = [
    { key: 'customerId', label: t('segments.customers.columns.customerId') },
    { key: 'name', label: t('segments.customers.columns.name'), sortKey: 'name' },
    { key: 'region', label: t('segments.customers.columns.region'), sortKey: 'region' },
    {
      key: 'recencyDays',
      label: t('segments.customers.columns.recency'),
      sortKey: 'recencyDays',
      render: (row) => formatNumber(row.recencyDays, language),
    },
    {
      key: 'frequency',
      label: t('segments.customers.columns.frequency'),
      sortKey: 'frequency',
      render: (row) => formatNumber(row.frequency, language),
    },
    {
      key: 'monetary',
      label: t('segments.customers.columns.monetary'),
      sortKey: 'monetary',
      render: (row) => formatCurrency(row.monetary, language),
    },
    { key: 'scores', label: t('segments.customers.columns.scores'), render: (row) => `${row.rScore} / ${row.fScore} / ${row.mScore}` },
    { key: 'segment', label: t('segments.customers.columns.segment'), sortKey: 'segment' },
    {
      key: 'clusterLabel',
      label: t('segments.customers.columns.cluster'),
      sortKey: 'clusterId',
      render: (row) => row.clusterLabel || '-',
    },
  ]

  return (
    <section className="segment-customers" aria-labelledby={titleId}>
      <h2 id={titleId} className="section-title">
        {t('segments.customers.title')}
      </h2>

      <div className="filter-bar">
        <FormField label={t('segments.customers.segment')}>
          {(props) => (
            <select {...props} value={segment} onChange={(event) => setSegment(event.target.value)}>
              <option value="">{t('segments.customers.allSegments')}</option>
              {segmentRows.map((row) => (
                <option key={row.segment} value={row.segment}>
                  {row.segment}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField label={t('segments.customers.cluster')}>
          {(props) => (
            <select {...props} value={cluster} onChange={(event) => setCluster(event.target.value)}>
              <option value="">{t('segments.customers.allClusters')}</option>
              {clusterRows.map((row) => (
                <option key={row.clusterId} value={row.clusterId}>
                  {row.label}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      {table.error && <ErrorState message={t('common.error.page')} onRetry={table.reload} />}

      <DataTable
        {...table.tableProps}
        columns={columns}
        rowKey={(row) => row.customerId}
        searchPlaceholder={t('segments.customers.search')}
      />
    </section>
  )
}
