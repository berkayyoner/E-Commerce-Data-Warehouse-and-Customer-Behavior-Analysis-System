import { fireEvent, screen, within } from '@testing-library/react'

import { ADMIN_USER, renderWithProviders } from '../../test-utils'
import DataTable from './DataTable'

const COLUMNS = [
  { key: 'name', label: 'Name', sortKey: 'name' },
  { key: 'city', label: 'City' },
]
const ROWS = [{ id: 1, name: 'Ayse', city: 'Ankara' }]

function renderTable(overrides = {}) {
  const props = {
    columns: COLUMNS,
    rows: ROWS,
    total: 1,
    page: 0,
    size: 20,
    onSortChange: jest.fn(),
    onPageChange: jest.fn(),
    onSearchChange: jest.fn(),
    search: '',
    ...overrides,
  }
  return { props, ...renderWithProviders(<DataTable {...props} />, { user: ADMIN_USER }) }
}

test('clicking a sortable header asks for ascending order, then descending on the next click', () => {
  const { props, unmount } = renderTable()
  fireEvent.click(screen.getByRole('button', { name: 'Name' }))
  expect(props.onSortChange).toHaveBeenLastCalledWith({ key: 'name', direction: 'asc' })
  unmount()

  renderTable({ sort: { key: 'name', direction: 'asc' }, onSortChange: props.onSortChange })
  fireEvent.click(screen.getByRole('button', { name: 'Name' }))
  expect(props.onSortChange).toHaveBeenLastCalledWith({ key: 'name', direction: 'desc' })
})

test('the sorted column reports its direction through aria-sort and shows an arrow', () => {
  const { container } = renderTable({ sort: { key: 'name', direction: 'desc' } })

  const header = screen.getByRole('button', { name: 'Name' }).closest('th')
  expect(header).toHaveAttribute('aria-sort', 'descending')
  expect(container.querySelector('.sort-button svg')).toBeInTheDocument()
})

test('the search box with a magnifier sits first in the toolbar and the create button last', () => {
  const { container } = renderTable({ onCreate: jest.fn(), createLabel: 'New account' })

  const toolbar = container.querySelector('.data-table-toolbar')
  const searchBox = toolbar.querySelector('.search-box')
  expect(toolbar.firstElementChild).toBe(searchBox)
  expect(searchBox.querySelector('svg.lucide-search, svg')).toBeInTheDocument()
  expect(toolbar.lastElementChild.querySelector('button')).toHaveTextContent('New account')
})

test('the create button is shown only when a create handler is given', () => {
  const { unmount } = renderTable()
  expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument()
  unmount()

  renderTable({ onCreate: jest.fn() })
  expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
})

test('typing in the search box reports the new text', () => {
  const { props } = renderTable()

  fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'ankara' } })

  expect(props.onSearchChange).toHaveBeenCalledWith('ankara')
})

test('a row click runs the row handler, and Enter does the same from the keyboard', () => {
  const onRowClick = jest.fn()
  renderTable({ onRowClick })
  const row = screen.getByText('Ayse').closest('tr')

  fireEvent.click(row)
  fireEvent.keyDown(row, { key: 'Enter' })

  expect(onRowClick).toHaveBeenCalledTimes(2)
  expect(onRowClick).toHaveBeenCalledWith(ROWS[0])
})

test('an empty table says that no records were found', () => {
  renderTable({ rows: [], total: 0 })

  const message = screen.getByText('No records found.')
  expect(within(message.closest('table')).getAllByRole('columnheader')).toHaveLength(2)
})
