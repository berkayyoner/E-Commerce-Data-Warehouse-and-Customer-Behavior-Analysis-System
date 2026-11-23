import useT from '../../hooks/useT'
import { formatNumber } from '../../utils/format'

const WIDTH = 720
const HEIGHT = 260
const PAD = { top: 24, right: 28, bottom: 36, left: 64 }

/**
 * Inertia against k as a line. The chosen k is drawn larger and labelled, so it is marked by more than colour. The
 * svg is one image for screen readers; the summary above it names the chosen k.
 */
export default function ElbowChart({ points, chosenK, title, chosenLabel }) {
  const { language } = useT()
  const ks = points.map((point) => point.k)
  const minK = Math.min(...ks)
  const maxK = Math.max(...ks)
  const maxInertia = Math.max(...points.map((point) => point.inertia), 0)
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom

  const x = (k) => PAD.left + (maxK === minK ? innerWidth / 2 : ((k - minK) / (maxK - minK)) * innerWidth)
  const y = (inertia) => PAD.top + innerHeight - (maxInertia > 0 ? (inertia / maxInertia) * innerHeight : 0)
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.k)} ${y(point.inertia)}`).join(' ')
  const ticks = [0, 0.5, 1].map((fraction) => maxInertia * fraction)

  return (
    <figure className="elbow-chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={title} preserveAspectRatio="xMidYMid meet">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} className="chart-grid" />
            <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" className="chart-axis">
              {formatNumber(Math.round(tick), language)}
            </text>
          </g>
        ))}
        <path d={line} className="elbow-line" fill="none" />
        {points.map((point) => {
          const chosen = point.k === chosenK
          return (
            <g key={point.k}>
              {chosen && (
                <text x={x(point.k)} y={y(point.inertia) - 14} textAnchor="middle" className="elbow-label">
                  {chosenLabel}
                </text>
              )}
              <circle
                cx={x(point.k)}
                cy={y(point.inertia)}
                r={chosen ? 7 : 4}
                className={chosen ? 'elbow-point is-chosen' : 'elbow-point'}
              >
                <title>{`k = ${point.k}: ${formatNumber(Math.round(point.inertia), language)}`}</title>
              </circle>
              <text x={x(point.k)} y={HEIGHT - 10} textAnchor="middle" className="chart-axis">
                {point.k}
              </text>
            </g>
          )
        })}
      </svg>
    </figure>
  )
}
