import useT from '../../hooks/useT'
import Icon from './Icon'

/**
 * The table used by every list page.
 *
 * - Column headers with a sortKey are buttons that sort the data. The arrow shows the direction; a second click
 *   reverses it.
 * - The search box with a magnifier sits at the top left; the create button sits at the top right and is shown
 *   only when onCreate is given.
 * - Pagination is zero-based and server-driven.
 *
 * columns: [{ key, label, sortKey?, render?(row), className? }]
 */
export default function DataTable({
  columns,
  rows,
  rowKey = (row) => row.id,
  loading = false,
  total = 0,
  page = 0,
  size = 20,
  sort,
  onSortChange,
  onPageChange,
  search = '',
  onSearchChange,
  searchPlaceholder,
  createLabel,
  onCreate,
  rowActions,
  onRowClick,
}) {
  const { t } = useT()

  const pages = Math.max(1, Math.ceil(total / size))
  const from = total === 0 ? 0 : page * size + 1
  const to = Math.min(total, (page + 1) * size)
  const columnCount = columns.length + (rowActions ? 1 : 0)

  function toggleSort(column) {
    const sameColumn = sort && sort.key === column.sortKey
    onSortChange({
      key: column.sortKey,
      direction: sameColumn && sort.direction === 'asc' ? 'desc' : 'asc',
    })
  }

  function ariaSort(column) {
    if (!column.sortKey) {
      return undefined
    }
    if (!sort || sort.key !== column.sortKey) {
      return 'none'
    }
    return sort.direction === 'asc' ? 'ascending' : 'descending'
  }

  function sortIcon(column) {
    if (!sort || sort.key !== column.sortKey) {
      return 'chevronsUpDown'
    }
    return sort.direction === 'asc' ? 'arrowUp' : 'arrowDown'
  }

  function handleRowKey(event, row) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onRowClick(row)
    }
  }

  return (
    <section className="data-table">
      <div className="data-table-toolbar">
        <label className="search-box">
          <Icon name="search" size={16} />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange && onSearchChange(event.target.value)}
            placeholder={searchPlaceholder || t('common.search.placeholder')}
            aria-label={t('common.search.label')}
          />
        </label>

        {onCreate && (
          <div className="data-table-toolbar-right">
            <button type="button" className="button button-primary" onClick={onCreate}>
              <Icon name="plus" size={16} />
              <span>{createLabel || t('common.actions.create')}</span>
            </button>
          </div>
        )}
      </div>

      <div className="data-table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={column.className} aria-sort={ariaSort(column)}>
                  {column.sortKey ? (
                    <button
                      type="button"
                      className="sort-button"
                      onClick={() => toggleSort(column)}
                      title={t('common.table.sortBy', { column: column.label })}
                    >
                      <span>{column.label}</span>
                      <Icon name={sortIcon(column)} size={14} />
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              {rowActions && <th className="actions-column">{t('common.table.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="table-message">
                  {loading ? t('common.table.loading') : t('common.table.empty')}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={onRowClick ? 'is-clickable' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (event) => handleRowKey(event, row) : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className={column.className} data-label={column.label}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
                {rowActions && (
                  <td className="actions-column" onClick={(event) => event.stopPropagation()}>
                    {rowActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="data-table-footer">
        <span>{t('common.table.showing', { from, to, total })}</span>
        <div className="pagination">
          <button
            type="button"
            className="button button-ghost"
            disabled={page <= 0}
            onClick={() => onPageChange(page - 1)}
          >
            <Icon name="chevronLeft" size={16} />
            <span>{t('common.table.previous')}</span>
          </button>
          <span>{t('common.table.page', { page: page + 1, pages })}</span>
          <button
            type="button"
            className="button button-ghost"
            disabled={page + 1 >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            <span>{t('common.table.next')}</span>
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </div>
    </section>
  )
}
