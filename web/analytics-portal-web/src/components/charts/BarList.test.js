import { render, screen, within } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'

import { createAppStore } from '../../store/store'
import BarList from './BarList'

const ITEMS = [
  { key: 'electronics', label: 'Electronics', value: 500, share: 0.5 },
  { key: 'books', label: 'Books', value: 250, share: 0.25, detail: 'Print' },
  { key: 'toys', label: 'Toys', value: 250, share: 0.25 },
]

function renderBars(props = {}, language = 'en') {
  return render(
    <Provider store={createAppStore({ language: { selectedLanguage: language } })}>
      <BarList
        title="Revenue by category"
        summary="Revenue share of 3 categories. The largest is Electronics."
        items={ITEMS}
        formatValue={(value) => `TRY ${value}`}
        emptyText="There is no data for this period."
        tableHeaders={['Category', 'Detail', 'Revenue', 'Share']}
        {...props}
      />
    </Provider>,
  )
}

test('each bar carries its value and its percentage as text, not only as length', () => {
  const { container } = renderBars()

  const bars = container.querySelectorAll('.bar-row')
  expect(bars).toHaveLength(3)
  expect(bars[0]).toHaveTextContent('TRY 500 (50%)')
  expect(bars[1]).toHaveTextContent('Print')
})

test('the largest bar fills the whole track and the others are proportional', () => {
  const { container } = renderBars()

  const fills = [...container.querySelectorAll('.bar-fill')].map((fill) => fill.style.width)
  expect(fills).toEqual(['100%', '50%', '50%'])
})

test('the list is one image with the summary as its name', () => {
  renderBars()

  expect(screen.getByRole('img', { name: 'Revenue share of 3 categories. The largest is Electronics.' })).toBeInTheDocument()
})

test('the table alternative shows the optional columns only when the items have them', () => {
  renderBars()
  fireEvent.click(screen.getByRole('button', { name: 'Show as table' }))

  const table = screen.getByRole('table')
  const headers = within(table).getAllByRole('columnheader').map((cell) => cell.textContent)
  expect(headers).toEqual(['Category', 'Detail', 'Revenue', 'Share'])
  expect(within(table).getByRole('cell', { name: '50%' })).toBeInTheDocument()
})

test('without details or shares the table has only the label and the value columns', () => {
  renderBars({ items: [{ key: 'a', label: 'Alpha', value: 10 }] })
  fireEvent.click(screen.getByRole('button', { name: 'Show as table' }))

  const headers = within(screen.getByRole('table')).getAllByRole('columnheader').map((cell) => cell.textContent)
  expect(headers).toEqual(['Category', 'Revenue'])
})

test('percentages follow the language of the application', () => {
  const { container } = renderBars({}, 'tr')

  expect(container.querySelector('.bar-share').textContent).toContain('%50')
})

test('an empty list shows the empty message', () => {
  renderBars({ items: [] })

  expect(screen.getByText('There is no data for this period.')).toBeInTheDocument()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
})
