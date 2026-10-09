/*
 * The shared row window of long lists (P4.9 company switcher, P5.18 EditableGrid, P5.19
 * LookupField, P5.20 matching view), without React: rows of known (or measured) heights, the
 * rows in view plus an overscan in pixels around them, and the scroll that brings a row into
 * view. DataTable keeps TanStack Virtual (the plan's choice for tables) and applies the same
 * rules through its overscan (`overscanRows`) and range extractor (`withFocusedRow`). The rules:
 * - the rows in view and WINDOW_OVERSCAN pixels above and below them are drawn;
 * - the row that holds the focus is drawn wherever it is, with one row before it and two after
 *   it, so Tab, Enter and the arrows always find their next row;
 * - the table still tells its whole size (`aria-rowcount`, `aria-rowindex` on each drawn row).
 */

/** Pixels drawn above and below the view: about fifteen 40px lines. */
export const WINDOW_OVERSCAN = 600

/** The rows kept drawn before and after the focused row. */
export const FOCUS_ROWS_BEFORE = 1
export const FOCUS_ROWS_AFTER = 2

/** WINDOW_OVERSCAN as a number of rows of one height (TanStack Virtual counts rows). */
export function overscanRows(rowHeight: number, overscan = WINDOW_OVERSCAN): number {
  return Math.max(1, Math.ceil(overscan / Math.max(1, rowHeight)))
}

/**
 * The indexes to draw: those of the window (ascending) and the focused row with its neighbours,
 * ascending and without repeats. `count` is the number of rows; a focus outside it is ignored.
 */
export function withFocusedRow(
  indexes: readonly number[],
  focus: number | null,
  count: number,
): number[] {
  if (focus === null || focus < 0 || focus >= count) return [...indexes]
  const from = Math.max(0, focus - FOCUS_ROWS_BEFORE)
  const to = Math.min(count - 1, focus + FOCUS_ROWS_AFTER)
  const wanted = new Set(indexes)
  for (let index = from; index <= to; index += 1) wanted.add(index)
  return [...wanted].sort((a, b) => a - b)
}

/**
 * The spacers around drawn rows that are not all next to each other (the window and a focused
 * row far from it): for each drawn row, the empty height before it, and the height after the
 * last. `rows` are ascending, each with its top (`start`) and bottom (`end`).
 */
export function spacersBetween(
  rows: readonly { start: number; end: number }[],
  total: number,
): { before: number[]; after: number } {
  let bottom = 0
  const before = rows.map((row) => {
    const gap = Math.max(0, row.start - bottom)
    bottom = Math.max(bottom, row.end)
    return gap
  })
  return { before, after: Math.max(0, total - bottom) }
}

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
