import { useMemo, useState } from 'react'

import { analyticsApi } from '../../api/analyticsApi'
import useCachedResource from '../../hooks/useCachedResource'
import useT from '../../hooks/useT'
import { formatCurrency, formatDate, formatNumber } from '../../utils/format'
import WidgetCard from './WidgetCard'
import queryKey from './queryKey'

const COLUMNS = [
  { key: 'name', type: 'text' },
  { key: 'region', type: 'text' },
  { key: 'orders', type: 'number' },
  { key: 'revenue', type: 'number' },
  { key: 'firstOrderDate', type: 'date' },
  { key: 'lastOrderDate', type: 'date' },
]

/** Orders the rows by one column. Dates are ISO strings, so their text order is their date order. */
export function compareCustomers(a, b, key, type, direction) {
  let result
  if (type === 'number') {
    result = Number(a[key]) - Number(b[key])
  } else {
    result = String(a[key] ?? '').localeCompare(String(b[key] ?? ''))
  }
  return direction === 'asc' ? result : -result
}

/** The customers with the highest revenue. Readers can sort the table by any column. */
export default function TopCustomersWidget({ range }) {
  const { t, language } = useT()
  const [sort, setSort] = useState({ key: 'revenue', direction: 'desc' })
  const query = useCachedResource(queryKey('topCustomers', range), () => analyticsApi.topCustomers(range))

  function sortBy(column) {
    setSort((current) => ({
      key: column.key,
      direction: current.key === column.key && current.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  function ariaSort(key) {
    if (sort.key !== key) {
      return 'none'
    }
    return sort.direction === 'asc' ? 'ascending' : 'descending'
  }

  function cell(row, key) {
    switch (key) {
      case 'orders':
        return formatNumber(row.orders, language)
      case 'revenue':
        return formatCurrency(row.revenue, language)
      case 'firstOrderDate':
      case 'lastOrderDate':
        return formatDate(row[key], language)
      default:
        return row[key]
    }
  }

  return (
    <WidgetCard title={t('dashboard.customers.topTitle')} query={query} lines={6}>
      {(rows) => (
        <CustomerTable
          rows={rows}
          sort={sort}
          ariaSort={ariaSort}
          onSort={sortBy}
          cell={cell}
          summaryText={rows.length ? t('dashboard.customers.summary', { count: rows.length, name: rows[0].name }) : ''}
        />
      )}
    </WidgetCard>
  )
}

function CustomerTable({ rows, sort, ariaSort, onSort, cell, summaryText }) {
  const { t } = useT()
  const sorted = useMemo(
    () => [...rows].sort((a, b) => compareCustomers(a, b, sort.key, typeOf(sort.key), sort.direction)),
    [rows, sort],
  )

  if (rows.length === 0) {
    return <p className="chart-empty">{t('dashboard.chart.empty')}</p>
  }

  return (
    <div className="table-scroll">
      <p className="table-summary">{summaryText}</p>
      <table className="data-table" aria-label={t('dashboard.customers.topTitle')}>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th key={column.key} scope="col" aria-sort={ariaSort(column.key)}>
                <button
                  type="button"
                  className="sort-button"
                  onClick={() => onSort(column)}
                  title={t('common.table.sortBy', { column: t(`dashboard.customers.columns.${column.key}`) })}
                >
                  <span>{t(`dashboard.customers.columns.${column.key}`)}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.customerId}>
              {COLUMNS.map((column) => (
                <td key={column.key} data-label={t(`dashboard.customers.columns.${column.key}`)}>
                  {cell(row, column.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function typeOf(key) {
  return COLUMNS.find((column) => column.key === key).type
}
