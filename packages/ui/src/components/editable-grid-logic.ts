/*
 * EditableGrid's keyboard logic, without React (owner's decisions, 2026-10-01, docs/decisions.md
 * "Editable grid"). Positions count editable columns only; a row index counts the grid's rows.
 */

/** What a key press in a cell does. */
export type GridAction =
  | { type: 'focus'; row: number; column: number }
  /** Ask the application for a new row at `at`, then focus `column` in it. */
  | { type: 'add'; at: number; column: number }
  /** Ask the application to remove `row`, then focus `column` in `focusRow` (after the removal). */
  | { type: 'remove'; row: number; focusRow: number | null; column: number }
  | null

export interface GridKey {
  key: string
  shift: boolean
  /** Ctrl, or Cmd on a Mac. */
  mod: boolean
  alt: boolean
}

export interface GridPosition {
  row: number
  column: number
  rowCount: number
  columnCount: number
  /** Below maxRows. */
  canAdd: boolean
  /** Above minRows. */
  canRemove: boolean
  /**
   * On phones there is no Tab key: the on-screen keyboard's "next" (Enter) goes through every
   * field of the row, then to the next row.
   */
  phone: boolean
  /**
   * The editable cells of each row (P5.18 line types): a normal line has `columnCount`, a text
   * line or a section heading 1, a subtotal 0. Rows without cells are skipped. Default: every row
   * has `columnCount`.
   */
  rowCells?: readonly number[]
  /**
   * The column Enter keeps when it moves up or down: the last column used in a full line, so
   * passing through a heading (one cell) does not lose it. Default: `column`.
   */
  preferredColumn?: number
}

/**
 * The action of a key press, or null when the grid leaves the key to the browser (Tab moves to
 * the next cell in the browser's order) or to the field.
 * - Enter: the same column in the next row; on the last row a new row (Excel, the old grid).
 *   Shift+Enter: the same column in the previous row.
 * - On phones Enter goes to the next field of the row, then the first field of the next row; on
 *   the last field of the last row it adds a row. Shift+Enter goes back.
 * - Ctrl/Cmd+Enter inserts a row below; Ctrl/Cmd+Delete (Backspace is the Mac's delete key)
 *   removes the row, the focus moving to the next row, or the previous one after the last.
 * - Rows without editable cells (a subtotal) are skipped; a row with fewer cells (a heading, a
 *   text line) takes the focus in its last cell at most, and the preferred column comes back in
 *   the next full line (P5.18).
 */
export function gridKeyAction(key: GridKey, at: GridPosition): GridAction {
  const { row, column, rowCount, columnCount } = at
  const cells = (index: number) => at.rowCells?.[index] ?? columnCount
  const wanted = at.preferredColumn ?? column
  const into = (index: number) => Math.max(0, Math.min(wanted, cells(index) - 1))
  const nextRow = (from: number): number | null => {
    for (let index = from + 1; index < rowCount; index += 1) if (cells(index) > 0) return index
    return null
  }
  const previousRow = (from: number): number | null => {
    for (let index = from - 1; index >= 0; index -= 1) if (cells(index) > 0) return index
    return null
  }
  if (key.mod && !key.alt && key.key === 'Enter') {
    return at.canAdd ? { type: 'add', at: row + 1, column: wanted } : null
  }
  if (key.mod && !key.alt && (key.key === 'Delete' || key.key === 'Backspace')) {
    if (!at.canRemove) return null
    // The rows after the removed one move up by one.
    const next = nextRow(row)
    if (next !== null) return { type: 'remove', row, focusRow: next - 1, column: into(next) }
    const previous = previousRow(row)
    if (previous !== null)
      return { type: 'remove', row, focusRow: previous, column: into(previous) }
    return { type: 'remove', row, focusRow: null, column: wanted }
  }
  if (key.key !== 'Enter' || key.mod || key.alt) return null
  if (at.phone) {
    if (key.shift) {
      if (column > 0) return { type: 'focus', row, column: column - 1 }
      const previous = previousRow(row)
      return previous === null
        ? null
        : { type: 'focus', row: previous, column: cells(previous) - 1 }
    }
    if (column < cells(row) - 1) return { type: 'focus', row, column: column + 1 }
    const next = nextRow(row)
    if (next !== null) return { type: 'focus', row: next, column: 0 }
    return at.canAdd ? { type: 'add', at: rowCount, column: 0 } : null
  }
  if (key.shift) {
    const previous = previousRow(row)
    return previous === null ? null : { type: 'focus', row: previous, column: into(previous) }
  }
  const next = nextRow(row)
  if (next !== null) return { type: 'focus', row: next, column: into(next) }
  return at.canAdd ? { type: 'add', at: rowCount, column: wanted } : null
}

/** One message under a row: an error or a warning, from the application or the grid. */
export interface GridMessage {
  tone: 'danger' | 'warning'
  text: string
  /** The columns whose cells it concerns: they take the danger border when it is an error. */
  columns?: readonly string[]
}

/**
 * A detail of a line from the application (P5.18), shown under the row in secondary text: a fixed
 * asset's number and sale note, a warehouse. `internal` marks a value that never reaches the
 * customer's document (a book value): it is shown after the provider's "Internal" note. What
 * reaches the PDF is the application's; the mark only says so on screen.
 */
export interface GridDetail {
  text: string
  internal?: boolean
}

/** A row's messages in the order shown: errors before warnings, each kind in its given order. */
export function orderMessages(messages: readonly GridMessage[]): GridMessage[] {
  return [
    ...messages.filter((message) => message.tone === 'danger'),
    ...messages.filter((message) => message.tone === 'warning'),
  ]
}
