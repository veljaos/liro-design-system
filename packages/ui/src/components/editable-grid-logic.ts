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
 */
export function gridKeyAction(key: GridKey, at: GridPosition): GridAction {
  const { row, column, rowCount, columnCount } = at
  if (key.mod && !key.alt && key.key === 'Enter') {
    return at.canAdd ? { type: 'add', at: row + 1, column } : null
  }
  if (key.mod && !key.alt && (key.key === 'Delete' || key.key === 'Backspace')) {
    if (!at.canRemove) return null
    const focusRow = row < rowCount - 1 ? row : row - 1
    return { type: 'remove', row, focusRow: focusRow >= 0 ? focusRow : null, column }
  }
  if (key.key !== 'Enter' || key.mod || key.alt) return null
  if (at.phone) {
    if (key.shift) {
      if (column > 0) return { type: 'focus', row, column: column - 1 }
      return row > 0 ? { type: 'focus', row: row - 1, column: columnCount - 1 } : null
    }
    if (column < columnCount - 1) return { type: 'focus', row, column: column + 1 }
    if (row < rowCount - 1) return { type: 'focus', row: row + 1, column: 0 }
    return at.canAdd ? { type: 'add', at: rowCount, column: 0 } : null
  }
  if (key.shift) return row > 0 ? { type: 'focus', row: row - 1, column } : null
  if (row < rowCount - 1) return { type: 'focus', row: row + 1, column }
  return at.canAdd ? { type: 'add', at: rowCount, column } : null
}

/** One message under a row: an error or a warning, from the application or the grid. */
export interface GridMessage {
  tone: 'danger' | 'warning'
  text: string
  /** The columns whose cells it concerns: they take the danger border when it is an error. */
  columns?: readonly string[]
}

/** A row's messages in the order shown: errors before warnings, each kind in its given order. */
export function orderMessages(messages: readonly GridMessage[]): GridMessage[] {
  return [
    ...messages.filter((message) => message.tone === 'danger'),
    ...messages.filter((message) => message.tone === 'warning'),
  ]
}
