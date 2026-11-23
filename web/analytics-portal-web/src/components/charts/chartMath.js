/**
 * Round tick values from zero up to at least max, about count steps apart. The step is 1, 2 or 5 times a power of
 * ten, so the labels read easily.
 */
export function niceTicks(max, count = 4) {
  if (!(max > 0)) {
    return [0, 1]
  }
  const rough = max / Math.max(count, 1)
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const normalised = rough / magnitude
  const step = (normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10) * magnitude
  const steps = Math.ceil(max / step)
  return Array.from({ length: steps + 1 }, (_, index) => Number((index * step).toPrecision(12)))
}

/** Spacing of the labels so that at most maxLabels of them are drawn. */
export function everyNth(length, maxLabels) {
  return Math.max(1, Math.ceil(length / Math.max(maxLabels, 1)))
}

/** Index of the point the arrow keys (or Home and End) move to, or null for any other key. */
export function targetIndex(key, index, count) {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return Math.min(count - 1, index + 1)
    case 'ArrowLeft':
    case 'ArrowDown':
      return Math.max(0, index - 1)
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}
