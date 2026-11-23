import { useId, useState } from 'react'

import useT from '../../hooks/useT'
import Icon from '../ui/Icon'

/**
 * The same numbers as a chart, as a table. It is hidden until the reader asks for it with the toggle button, so the
 * chart stays uncluttered for sighted readers while the values remain available to everyone.
 */
export default function AlternativeTable({ caption, headers, rows }) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const tableId = useId()

  return (
    <div className="chart-alternative">
      <button
        type="button"
        className="chart-table-toggle"
        aria-expanded={open}
        aria-controls={tableId}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="table" size={16} />
        <span>{open ? t('dashboard.chart.hideTable') : t('dashboard.chart.showTable')}</span>
      </button>
      {open && (
        <div id={tableId} className="chart-table-wrap">
          <table className="plain-table">
            <caption>{caption}</caption>
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index} scope="col">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) =>
                    cellIndex === 0 ? (
                      <th key={cellIndex} scope="row" data-label={headers[0]}>
                        {cell}
                      </th>
                    ) : (
                      <td key={cellIndex} data-label={headers[cellIndex]}>
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
