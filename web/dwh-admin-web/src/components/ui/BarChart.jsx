const WIDTH = 720
const HEIGHT = 240
const PAD = { top: 12, right: 8, bottom: 28, left: 56 }

/**
 * Dependency-free column chart. points is [{ label, values: { key: number } }]; series lists the value keys to
 * draw, each with a name and a CSS class. The svg is one image for screen readers (its title is the summary); a
 * visually hidden table repeats every number.
 */
export default function BarChart({ points, series, title, periodLabel }) {
  const max = Math.max(1, ...points.flatMap((point) => series.map((item) => point.values[item.key] || 0)))
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const groupWidth = innerWidth / Math.max(points.length, 1)
  const barWidth = Math.max(1, Math.min(24, (groupWidth - 4) / series.length))
  const labelEvery = Math.max(1, Math.ceil(points.length / 8))
  const ticks = [0, 0.5, 1].map((fraction) => Math.round(max * fraction))

  return (
    <figure className="bar-chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={title} preserveAspectRatio="xMidYMid meet">
        {ticks.map((tick) => {
          const y = PAD.top + innerHeight - (tick / max) * innerHeight
          return (
            <g key={tick}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} className="chart-grid" />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="chart-axis">
                {tick}
              </text>
            </g>
          )
        })}
        {points.map((point, index) => {
          const groupX = PAD.left + index * groupWidth + (groupWidth - barWidth * series.length) / 2
          return (
            <g key={point.label}>
              {series.map((item, position) => {
                const value = point.values[item.key] || 0
                const height = (value / max) * innerHeight
                return (
                  <rect
                    key={item.key}
                    x={groupX + position * barWidth}
                    y={PAD.top + innerHeight - height}
                    width={barWidth - 2}
                    height={height}
                    className={item.className}
                  >
                    <title>{`${point.label}: ${item.name} ${value}`}</title>
                  </rect>
                )
              })}
              {index % labelEvery === 0 && (
                <text x={PAD.left + index * groupWidth + groupWidth / 2} y={HEIGHT - 8} textAnchor="middle" className="chart-axis">
                  {point.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">{periodLabel}</th>
            {series.map((item) => (
              <th key={item.key} scope="col">
                {item.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.label}>
              <th scope="row">{point.label}</th>
              {series.map((item) => (
                <td key={item.key}>{point.values[item.key] || 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
