/** Delay between the last keystroke and the typeahead request. */
export const SUGGEST_DELAY_MS = 250

/** Results per page. The shop service answers at most 10,000 results in total, so later pages are not offered. */
export const PAGE_SIZE = 20

/** Shortest text that gets typeahead suggestions (the service refuses shorter texts). */
export const MIN_SUGGEST_LENGTH = 2

/** Reads a price typed into a field. Empty or negative values count as no price. */
export function parsePrice(text) {
  const trimmed = String(text === undefined || text === null ? '' : text).trim()
  if (!trimmed) {
    return undefined
  }
  const value = Number(trimmed.replace(',', '.'))
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

/** A price range is valid when the minimum is not above the maximum, or when one of the two is missing. */
export function isPriceRangeValid(min, max) {
  return min === undefined || max === undefined || min <= max
}

/** Choices of the sort list. The keys are the values the shop service accepts. */
export const SORT_KEYS = Object.freeze(['relevance', 'priceAsc', 'priceDesc', 'nameAsc'])
