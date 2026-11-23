import { useRef, useState } from 'react'

import useMediaQuery from '../../hooks/useMediaQuery'
import useT from '../../hooks/useT'
import AlternativeTable from './AlternativeTable'
import { everyNth, niceTicks, targetIndex } from './chartMath'

const NARROW_QUERY = '(max-width: 599px)'
const PAD = { top: 16, right: 20, bottom: 36, left: 68 }

/**
 * Line and area chart drawn as SVG. points is [{ key, label, value }]; label is the text under the point and
 * formatValue turns a value into text for the tooltip, the table and the screen reader.
 *
 * Keyboard: Tab reaches the chart once, the arrow keys (and Home and End) move between points, and the focused point
 * shows its tooltip. On narrow screens the drawing is smaller, with fewer ticks and labels.
 */
export default function LineChart({
  title,
  summary,
  points,
  formatValue,
  formatTick,
  yTitle,
  xTitle,
  emptyText,
  tableHeaders,
}) {
  const { t } = useT()
  const narrow = useMediaQuery(NARROW_QUERY)
  const [active, setActive] = useState(null)
  const pointRefs = useRef([])

  if (points.length === 0) {
    return (
      <figure className="chart">
        <p className="chart-empty">{emptyText}</p>
      </figure>
    )
  }

  const width = narrow ? 340 : 640
  const height = narrow ? 240 : 280
  const innerWidth = width - PAD.left - PAD.right
  const innerHeight = height - PAD.top - PAD.bottom
  const ticks = niceTicks(Math.max(...points.map((point) => point.value)), narrow ? 3 : 5)
  const top = ticks[ticks.length - 1]
  const xOf = (index) =>
    points.length === 1 ? PAD.left + innerWidth / 2 : PAD.left + (index * innerWidth) / (points.length - 1)
  const yOf = (value) => PAD.top + innerHeight - (value / top) * innerHeight
  const coords = points.map((point, index) => ({ x: xOf(index), y: yOf(point.value) }))
  const baseline = PAD.top + innerHeight
  const linePath = coords.map((c, index) => `${index === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${baseline} L${coords[0].x.toFixed(1)},${baseline} Z`
  const labelStep = everyNth(points.length, narrow ? 4 : 8)
  const radius = points.length > 60 ? 3 : 5
  const rovingIndex = active === null ? 0 : active

  function moveTo(index) {
    setActive(index)
    const element = pointRefs.current[index]
    if (element) {
      element.focus()
    }
  }

  function handleKeyDown(event, index) {
    const next = targetIndex(event.key, index, points.length)
    if (next !== null) {
      event.preventDefault()
      moveTo(next)
    }
  }

  const tooltip = active === null ? null : points[active]
  const tooltipLeft = active === null ? 0 : Math.min(Math.max((coords[active].x / width) * 100, 14), 86)
  const tooltipTop = active === null ? 0 : (coords[active].y / height) * 100

  return (
    <figure className="chart">
      <p className="chart-axis-title">{yTitle}</p>
      <div className="chart-plot">
        <svg
          className="line-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={summary}
          preserveAspectRatio="xMidYMid meet"
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={width - PAD.right} y1={yOf(tick)} y2={yOf(tick)} className="chart-grid" />
              <text x={PAD.left - 10} y={yOf(tick) + 4} textAnchor="end" className="chart-axis">
                {formatTick(tick)}
              </text>
            </g>
          ))}
          <path d={areaPath} className="line-chart-area" />
          <path d={linePath} className="line-chart-line" />
          {points.map((point, index) =>
            index % labelStep === 0 ? (
              <text key={`label-${point.key}`} x={coords[index].x} y={height - 10} textAnchor="middle" className="chart-axis">
                {point.label}
              </text>
            ) : null,
          )}
          {points.map((point, index) => (
            <circle
              key={point.key}
              ref={(element) => {
                pointRefs.current[index] = element
              }}
              cx={coords[index].x}
              cy={coords[index].y}
              r={active === index ? radius + 2 : radius}
              className={active === index ? 'line-chart-point is-active' : 'line-chart-point'}
              role="img"
              aria-label={`${point.label}: ${formatValue(point.value)}`}
              tabIndex={index === rovingIndex ? 0 : -1}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            />
          ))}
        </svg>
        {tooltip && (
          <div
            className="chart-tooltip"
            aria-hidden="true"
            style={{ left: `${tooltipLeft}%`, top: `${tooltipTop}%` }}
          >
            <strong>{tooltip.label}</strong>
            <span>{formatValue(tooltip.value)}</span>
          </div>
        )}
      </div>
      <p className="chart-axis-title">{xTitle}</p>
      <AlternativeTable
        caption={title}
        headers={tableHeaders}
        rows={points.map((point) => [point.label, formatValue(point.value)])}
      />
      <span className="sr-only">{t('dashboard.chart.keyboardHint')}</span>
    </figure>
  )
}
