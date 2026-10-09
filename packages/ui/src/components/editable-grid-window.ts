/*
 * EditableGrid's row window (P5.18: a specification of 300 positions), without React. A long
 * grid draws only the lines in view and 600px around them, plus the line that has the focus and
 * its neighbours (so Enter, Tab and the row shortcuts always find the next line); spacers keep
 * the scroll height. It runs on TanStack Virtual with the shared rules of `virtual-rows.ts`
 * (P5.21a), heights measured once drawn and estimated before. Cells stay fields: a line in the
 * page is the same as in a short grid. Here: when to window, and the table's row numbers.
 */

/** From this many rows on, a grid draws only its window (unless `virtualize` says otherwise). */
export const VIRTUALIZE_FROM = 100

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
