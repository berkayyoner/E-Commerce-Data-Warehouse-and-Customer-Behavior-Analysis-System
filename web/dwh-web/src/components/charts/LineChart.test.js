import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { Provider } from 'react-redux'

import { createAppStore } from '../../store/store'
import LineChart from './LineChart'

const POINTS = [
  { key: '2026-03-01', label: 'Mar 1', value: 100 },
  { key: '2026-03-02', label: 'Mar 2', value: 250 },
  { key: '2026-03-03', label: 'Mar 3', value: 180 },
]

function renderChart(overrides = {}) {
  const props = {
    title: 'Sales trend',
    summary: 'Revenue by day over 3 periods.',
    points: POINTS,
    formatValue: (value) => `TRY ${value}`,
    formatTick: (value) => String(value),
    yTitle: 'Revenue (TRY)',
    xTitle: 'Period',
    emptyText: 'No data for this period.',
    tableHeaders: ['Period', 'Revenue (TRY)'],
    ...overrides,
  }
  return render(
    <Provider store={createAppStore({ language: { selectedLanguage: 'en' } })}>
      <LineChart {...props} />
    </Provider>,
  )
}

function setNarrowScreen(matches) {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }))
}

afterEach(() => {
  delete window.matchMedia
})

test('the chart is one image with a summary and draws one focusable point per value', () => {
  renderChart()

  const image = screen.getByRole('img', { name: 'Revenue by day over 3 periods.' })
  expect(image.tagName.toLowerCase()).toBe('svg')
  expect(screen.getByRole('img', { name: 'Mar 2: TRY 250' })).toBeInTheDocument()
  expect(image.querySelectorAll('circle')).toHaveLength(3)
})

test('the first point is reachable with Tab and focusing it shows its exact value in a tooltip', () => {
  renderChart()

  const first = screen.getByRole('img', { name: 'Mar 1: TRY 100' })
  expect(first).toHaveAttribute('tabindex', '0')
  fireEvent.focus(first)

  const tooltip = document.querySelector('.chart-tooltip')
  expect(within(tooltip).getByText('Mar 1')).toBeInTheDocument()
  expect(within(tooltip).getByText('TRY 100')).toBeInTheDocument()
})

test('the arrow keys move the focus and the tooltip to the next point', () => {
  renderChart()

  const first = screen.getByRole('img', { name: 'Mar 1: TRY 100' })
  act(() => first.focus())
  fireEvent.keyDown(first, { key: 'ArrowRight' })

  const second = screen.getByRole('img', { name: 'Mar 2: TRY 250' })
  expect(second).toHaveAttribute('tabindex', '0')
  expect(document.querySelector('.chart-tooltip')).toHaveTextContent('TRY 250')
})

test('End moves to the last point and Home returns to the first', () => {
  renderChart()

  const first = screen.getByRole('img', { name: 'Mar 1: TRY 100' })
  act(() => first.focus())
  fireEvent.keyDown(first, { key: 'End' })
  expect(document.querySelector('.chart-tooltip')).toHaveTextContent('TRY 180')

  fireEvent.keyDown(screen.getByRole('img', { name: 'Mar 3: TRY 180' }), { key: 'Home' })
  expect(document.querySelector('.chart-tooltip')).toHaveTextContent('TRY 100')
})

test('leaving a point removes its tooltip', () => {
  renderChart()

  const first = screen.getByRole('img', { name: 'Mar 1: TRY 100' })
  fireEvent.focus(first)
  fireEvent.blur(first)

  expect(document.querySelector('.chart-tooltip')).toBeNull()
})

test('the table alternative is hidden until it is asked for and then lists every value', () => {
  renderChart()

  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  const toggle = screen.getByRole('button', { name: 'Show as table' })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')

  fireEvent.click(toggle)

  const table = screen.getByRole('table')
  expect(within(table).getByRole('rowheader', { name: 'Mar 2' })).toBeInTheDocument()
  expect(within(table).getByRole('cell', { name: 'TRY 250' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Hide table' })).toHaveAttribute('aria-expanded', 'true')
})

test('an empty series shows the empty message and no drawing', () => {
  renderChart({ points: [] })

  expect(screen.getByText('No data for this period.')).toBeInTheDocument()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
})

test('on narrow screens only a few labels are drawn', () => {
  setNarrowScreen(true)
  const many = Array.from({ length: 24 }, (_, index) => ({
    key: `k${index}`,
    label: `L${index}`,
    value: index + 1,
  }))
  const { container } = renderChart({ points: many, summary: 'Many points.' })

  const labels = [...container.querySelectorAll('svg text')].filter((node) => /^L\d+$/.test(node.textContent))
  expect(labels.length).toBeLessThanOrEqual(6)
  expect(container.querySelector('svg').getAttribute('viewBox')).toMatch(/^0 0 340 /)
})

test('a single point is drawn in the middle of the plot without dividing by zero', () => {
  renderChart({ points: [POINTS[0]] })

  expect(screen.getByRole('img', { name: 'Mar 1: TRY 100' })).toBeInTheDocument()
})
