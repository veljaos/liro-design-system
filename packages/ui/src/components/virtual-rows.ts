import { defaultRangeExtractor, type Range } from '@tanstack/react-virtual'

/*
 * The shared row window of long lists. Every list that draws only its rows in view — DataTable,
 * EditableGrid (P5.18), LookupField (P5.19) and the company switcher (P4.9) — runs on TanStack Virtual (`useVirtualizer`, the plan's choice; P5.21a) and applies
 * the same rules through its overscan (`overscanRows`) and range extractor (`keepFocusedRow`):
 * - the rows in view and WINDOW_OVERSCAN pixels above and below them are drawn;
 * - the row that holds the focus (or the active option of a listbox, which
 *   aria-activedescendant names) is drawn wherever it is, with one row before it and two after
 *   it, so Tab, Enter and the arrows always find their next row;
 * - spacers stand wherever drawn rows are not next to each other (`spacersBetween`);
 * - the list still tells its whole size (`aria-rowcount` / `aria-rowindex`, `aria-setsize` /
 *   `aria-posinset`).
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

/** A TanStack Virtual range extractor's result: the window with the focused row kept. */
export function keepFocusedRow(range: Range, focus: number | null): number[] {
  return withFocusedRow(defaultRangeExtractor(range), focus, range.count)
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
