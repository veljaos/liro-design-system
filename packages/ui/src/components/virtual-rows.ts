/*
 * The shared row window of long lists (P4.9 company switcher, P5.18 EditableGrid, P5.19
 * LookupField, P5.20 matching view), without React: rows of known (or measured) heights, the
 * rows in view plus an overscan in pixels around them, and the scroll that brings a row into
 * view. DataTable keeps TanStack Virtual (the plan's choice for tables) and applies the same
 * rules through its overscan and range extractor (`tableRange`).
 */

/** The tops of rows of known heights, and the height of them all. */
export function rowOffsets(heights: readonly number[]): { tops: number[]; total: number } {
  let total = 0
  const tops = heights.map((height) => {
    const top = total
    total += height
    return top
  })
  return { tops, total }
}

/**
 * The rows to draw for a scroll position: those in view and `overscan` pixels around it (from
 * `first` up to but not including `last`). Rows have known heights, so nothing is measured here.
 */
export function visibleRows(
  tops: readonly number[],
  total: number,
  scrollTop: number,
  height: number,
  overscan = 240,
): { first: number; last: number } {
  const from = scrollTop - overscan
  const to = scrollTop + height + overscan
  // The first row whose bottom is below `from` (binary search over the tops).
  let low = 0
  let high = tops.length
  while (low < high) {
    const middle = (low + high) >> 1
    const bottom = tops[middle + 1] ?? total
    if (bottom <= from) low = middle + 1
    else high = middle
  }
  let last = low
  while (last < tops.length && (tops[last] ?? total) < to) last += 1
  return { first: low, last }
}

/** The scroll position that brings a row fully into view, or undefined when it is in view. */
export function scrollToShow(
  top: number,
  rowHeight: number,
  scrollTop: number,
  height: number,
): number | undefined {
  if (top < scrollTop) return top
  if (top + rowHeight > scrollTop + height) return top + rowHeight - height
  return undefined
}
