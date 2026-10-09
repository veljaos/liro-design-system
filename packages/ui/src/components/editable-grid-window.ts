import {
  FOCUS_ROWS_AFTER,
  FOCUS_ROWS_BEFORE,
  rowOffsets,
  visibleRows,
  WINDOW_OVERSCAN,
} from './virtual-rows'

/*
 * EditableGrid's row window (P5.18: a specification of 300 positions), without React: which rows
 * are in the page. A long grid draws only the lines in view and OVERSCAN pixels around them, plus
 * the line that has the focus and its neighbours (so Enter, Tab and the row shortcuts always find
 * the next line); spacers keep the scroll height. The rules are the shared ones of
 * `virtual-rows.ts` (DataTable applies them through TanStack Virtual). Heights are measured once drawn, estimated
 * before. Cells stay fields: a line in the page is the same as in a short grid.
 */

/** From this many rows on, a grid draws only its window (unless `virtualize` says otherwise). */
export const VIRTUALIZE_FROM = 100

export interface GridWindow {
  /** The first row drawn. */
  first: number
  /** One past the last row drawn. */
  last: number
  /** The height of the rows above the window (the top spacer). */
  before: number
  /** The height of the rows below it (the bottom spacer). */
  after: number
}

/**
 * The rows to draw for a view: `viewTop` is how far the view's top is below the first row's top
 * (negative while the grid starts lower on the screen), `viewHeight` the view's height. The
 * focused row, one row before it and two after it are always drawn.
 */
export function gridWindow(
  heights: readonly number[],
  viewTop: number,
  viewHeight: number,
  focusRow: number | null,
  overscan = WINDOW_OVERSCAN,
): GridWindow {
  const { tops, total } = rowOffsets(heights)
  const visible = visibleRows(tops, total, viewTop, viewHeight, overscan)
  let { first, last } = visible
  if (focusRow !== null && focusRow >= 0 && focusRow < heights.length) {
    first = Math.min(first, Math.max(0, focusRow - FOCUS_ROWS_BEFORE))
    last = Math.max(last, Math.min(heights.length, focusRow + FOCUS_ROWS_AFTER + 1))
  }
  first = Math.min(first, heights.length)
  last = Math.max(first, Math.min(last, heights.length))
  const top = (index: number) => tops[index] ?? total
  return { first, last, before: top(first), after: total - top(last) }
}

/**
 * The aria-rowindex of each line's row in a table with `headerRows` header rows, when some lines
 * have a row of notes under them (each counts as a row of the table), and the table's
 * aria-rowcount (with `footerRows` totals rows).
 */
export function ariaRowIndexes(
  noteRows: readonly boolean[],
  headerRows = 1,
  footerRows = 0,
): { indexes: number[]; count: number } {
  let next = headerRows + 1
  const indexes = noteRows.map((hasNotes) => {
    const index = next
    next += hasNotes ? 2 : 1
    return index
  })
  return { indexes, count: next - 1 + footerRows }
}
