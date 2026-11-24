import useT from '../../hooks/useT'
import { formatNumber } from '../../utils/format'
import WidgetCard from '../dashboard/WidgetCard'
import { FREQUENCY_SCORES, buildHeatGrid, heatLevel } from './rfmGrid'

/**
 * The 5 by 5 RFM heat grid. Each cell prints its customer count and is shaded by it, so the shade is never the only
 * clue. It is a real table: the score headers are column and row headers.
 */
export default function RfmHeatGrid({ resource }) {
  const { t, language } = useT()
  const cells = resource.data || []
  const grid = buildHeatGrid(cells)
  const largest = cells.reduce((max, cell) => Math.max(max, cell.customers), 0)

  return (
    <WidgetCard
      title={t('segments.grid.title')}
      loading={resource.loading}
      error={resource.error}
      onRetry={resource.reload}
      wide
    >
      <p className="field-hint">{t('segments.grid.subtitle')}</p>
      {cells.length === 0 ? (
        <p className="empty-note">{t('segments.grid.empty')}</p>
      ) : (
        <div className="data-table-scroll">
          <table className="heat-grid">
            <caption className="sr-only">{t('segments.grid.caption')}</caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">{t('segments.grid.recency')}</span>
                </th>
                {FREQUENCY_SCORES.map((score) => (
                  <th key={score} scope="col">
                    <span className="sr-only">{t('segments.grid.frequency')} </span>
                    {score}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row) => (
                <tr key={row[0].recency}>
                  <th scope="row">
                    <span className="sr-only">{t('segments.grid.recency')} </span>
                    {row[0].recency}
                  </th>
                  {row.map((cell) => (
                    <td
                      key={cell.frequency}
                      className={`heat-cell heat-${heatLevel(cell.customers, largest)}`}
                      title={t('segments.grid.cell', {
                        recency: cell.recency,
                        frequency: cell.frequency,
                        count: formatNumber(cell.customers, language),
                      })}
                    >
                      {formatNumber(cell.customers, language)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WidgetCard>
  )
}
