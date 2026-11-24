import useT from '../../hooks/useT'
import { formatPercent } from '../../utils/format'
import AlternativeTable from './AlternativeTable'

/**
 * Horizontal bars, one row per item: { key, label, detail?, value, share? }. Every bar carries its value as text and,
 * when a share is given, its percentage, so the reading never depends on colour alone. The list is one image for
 * screen readers (summary); the same numbers are available as a table. tableHeaders lists the four columns in
 * the order label, detail, value, share; the detail and share columns appear only when some item has them.
 */
export default function BarList({ title, summary, items, formatValue, emptyText, tableHeaders }) {
  const { language } = useT()

  if (items.length === 0) {
    return (
      <figure className="bar-list-figure">
        <p className="chart-empty">{emptyText}</p>
      </figure>
    )
  }

  const largest = Math.max(...items.map((item) => item.value), 0)
  const hasDetail = items.some((item) => item.detail)
  const hasShare = items.some((item) => item.share !== undefined)
  const headers = [
    tableHeaders[0],
    ...(hasDetail ? [tableHeaders[1]] : []),
    tableHeaders[2],
    ...(hasShare ? [tableHeaders[3]] : []),
  ]

  return (
    <figure className="bar-list-figure">
      <div className="bar-list" role="img" aria-label={summary}>
        {items.map((item) => (
          <div className="bar-row" key={item.key} aria-hidden="true">
            <div className="bar-label">
              <span className="bar-name">{item.label}</span>
              {item.detail && <span className="bar-detail">{item.detail}</span>}
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${largest > 0 ? (item.value / largest) * 100 : 0}%` }} />
            </div>
            <span className="bar-value">
              {formatValue(item.value)}
              {item.share !== undefined && <span className="bar-share"> ({formatPercent(item.share, language)})</span>}
            </span>
          </div>
        ))}
      </div>
      <AlternativeTable
        caption={title}
        headers={headers}
        rows={items.map((item) => [
          item.label,
          ...(hasDetail ? [item.detail || ''] : []),
          formatValue(item.value),
          ...(hasShare ? [item.share !== undefined ? formatPercent(item.share, language) : ''] : []),
        ])}
      />
    </figure>
  )
}
