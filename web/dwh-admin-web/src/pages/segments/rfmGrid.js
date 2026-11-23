export const RECENCY_SCORES = Object.freeze([5, 4, 3, 2, 1])
export const FREQUENCY_SCORES = Object.freeze([1, 2, 3, 4, 5])

/**
 * The full 5 by 5 grid: rows run from recency score 5 down to 1, columns from frequency score 1 to 5. The service
 * returns only the combinations that have customers, so the others count zero here.
 */
export function buildHeatGrid(cells) {
  const counts = new Map(cells.map((cell) => [`${cell.recencyScore}-${cell.frequencyScore}`, cell.customers]))
  return RECENCY_SCORES.map((recency) =>
    FREQUENCY_SCORES.map((frequency) => ({
      recency,
      frequency,
      customers: counts.get(`${recency}-${frequency}`) || 0,
    })),
  )
}

/** Shade of a cell from 0 (no customers) to 4 (the fullest cell of the grid). */
export function heatLevel(customers, largest) {
  if (customers <= 0 || largest <= 0) {
    return 0
  }
  return Math.min(4, Math.ceil((customers / largest) * 4))
}
