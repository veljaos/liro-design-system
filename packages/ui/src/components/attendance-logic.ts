import { matrixKeyTarget } from './admin-logic'

/*
 * AttendanceGrid's logic (BUILD-PLAN P5.13 and P5.24 a, c: one pattern), without React: the
 * cells a range covers, what a key does, the changes of a marking, a fill and "Copy previous
 * week". Every function returns the changes for the application to apply; nothing here adds hours
 * or reads them as numbers (D4): hours stay decimal strings as typed and read by
 * `format.parseNumber`.
 */

/** What a cell holds: a code (or none) and, in the hours mode, hours as a decimal string. */
export interface AttendanceEntry {
  code: string | null
  hours?: string | null
}

/** The grid's value: row id → column id → entry. A missing cell is empty. */
export type AttendanceValue = Readonly<Record<string, Readonly<Record<string, AttendanceEntry>>>>

/** One cell's new entry, reported to the application. */
export interface AttendanceChange {
  row: string
  column: string
  entry: AttendanceEntry
  /** The entry it replaces; null for an empty cell. */
  previous: AttendanceEntry | null
}

/** A day column's kind: weekends and holidays are shaded and named. */
export type AttendanceColumnKind = 'normal' | 'weekend' | 'holiday'

/** What the logic needs of a column. */
export interface AttendanceColumnInfo {
  id: string
  /** YYYY-MM-DD, for a day. */
  date?: string
  kind?: AttendanceColumnKind
}

/** A cell of the day area: the person's index and the column's index. */
export interface AttendanceCell {
  row: number
  column: number
}

/** A rectangle of the day area, its ends included. */
export interface AttendanceRange {
  top: number
  bottom: number
  start: number
  end: number
}

/** The entry of one cell, or null when it is empty. */
export function entryOf(
  value: AttendanceValue,
  row: string,
  column: string,
): AttendanceEntry | null {
  return value[row]?.[column] ?? null
}

/** Whether a cell holds nothing: no code and no hours. */
export function isEmptyEntry(entry: AttendanceEntry | null): boolean {
  return entry === null || (entry.code === null && (entry.hours ?? null) === null)
}

/** Two entries hold the same code and hours (an empty cell equals an empty entry). */
export function sameEntry(a: AttendanceEntry | null, b: AttendanceEntry | null): boolean {
  if (isEmptyEntry(a) && isEmptyEntry(b)) return true
  return (a?.code ?? null) === (b?.code ?? null) && (a?.hours ?? null) === (b?.hours ?? null)
}

/** The range between the cell where a selection started and the one it reached. */
export function cellRange(anchor: AttendanceCell, focus: AttendanceCell): AttendanceRange {
  return {
    top: Math.min(anchor.row, focus.row),
    bottom: Math.max(anchor.row, focus.row),
    start: Math.min(anchor.column, focus.column),
    end: Math.max(anchor.column, focus.column),
  }
}

/** Whether a cell is inside a range. */
export function inRange(range: AttendanceRange, cell: AttendanceCell): boolean {
  return (
    cell.row >= range.top &&
    cell.row <= range.bottom &&
    cell.column >= range.start &&
    cell.column <= range.end
  )
}

/** The number of cells in a range. */
export function rangeSize(range: AttendanceRange): number {
  return (range.bottom - range.top + 1) * (range.end - range.start + 1)
}

/** The cells of a range, row by row, each row in column order. */
export function rangeCells(range: AttendanceRange): AttendanceCell[] {
  const cells: AttendanceCell[] = []
  for (let row = range.top; row <= range.bottom; row += 1) {
    for (let column = range.start; column <= range.end; column += 1) cells.push({ row, column })
  }
  return cells
}

/**
 * The changes that give each cell the entry `next` makes from its current one; cells whose entry
 * would not change are left out.
 */
export function changeCells(
  value: AttendanceValue,
  cells: readonly { row: string; column: string }[],
  next: (previous: AttendanceEntry | null) => AttendanceEntry,
): AttendanceChange[] {
  return cells.flatMap(({ row, column }) => {
    const previous = entryOf(value, row, column)
    const entry = next(previous)
    return sameEntry(previous, entry) ? [] : [{ row, column, entry, previous }]
  })
}

/** A code given to a cell: the code changes, the hours stay. */
export function withCode(
  code: string | null,
): (previous: AttendanceEntry | null) => AttendanceEntry {
  return (previous) => (previous?.hours === undefined ? { code } : { code, hours: previous.hours })
}

/** The ids of the cells of a range. */
export function rangeIds(
  range: AttendanceRange,
  rowIds: readonly string[],
  columnIds: readonly string[],
): { row: string; column: string }[] {
  return rangeCells(range).flatMap((cell) => {
    const row = rowIds[cell.row]
    const column = columnIds[cell.column]
    return row === undefined || column === undefined ? [] : [{ row, column }]
  })
}

/** "Mark everyone: <code>" of a column: every row's cell in it takes the code. */
export function markColumn(
  value: AttendanceValue,
  rowIds: readonly string[],
  column: string,
  code: string,
): AttendanceChange[] {
  return changeCells(
    value,
    rowIds.map((row) => ({ row, column })),
    withCode(code),
  )
}

/**
 * "Mark all: <code>" of a row: every normal column of the row takes the code. Weekends and
 * holidays are left as they are (a working day's code does not belong on them).
 */
export function markRow(
  value: AttendanceValue,
  row: string,
  columns: readonly AttendanceColumnInfo[],
  code: string,
): AttendanceChange[] {
  return changeCells(
    value,
    columns
      .filter((column) => (column.kind ?? 'normal') === 'normal')
      .map((column) => ({ row, column: column.id })),
    withCode(code),
  )
}

/** Clears the cells: no code, and no hours in the hours mode. */
export function clearCells(
  value: AttendanceValue,
  cells: readonly { row: string; column: string }[],
  hours: boolean,
): AttendanceChange[] {
  return changeCells(value, cells, () => (hours ? { code: null, hours: null } : { code: null }))
}

/**
 * "Fill the range": every cell of the range takes the entry of the cell where the selection
 * started (`from`), code and hours alike. An empty first cell clears the range.
 */
export function fillRange(
  value: AttendanceValue,
  rowIds: readonly string[],
  columnIds: readonly string[],
  range: AttendanceRange,
  from: AttendanceCell,
  hours: boolean,
): AttendanceChange[] {
  const row = rowIds[from.row]
  const column = columnIds[from.column]
  if (row === undefined || column === undefined) return []
  const source = entryOf(value, row, column)
  const entry: AttendanceEntry = hours
    ? { code: source?.code ?? null, hours: source?.hours ?? null }
    : { code: source?.code ?? null }
  return changeCells(value, rangeIds(range, rowIds, columnIds), () => entry)
}

// ── Dates ───────────────────────────────────────────────────────────────────────────────────

function utcDays(date: string): number {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number)
  return Date.UTC(year, month - 1, day) / 86_400_000
}

function fromUtcDays(days: number): string {
  return new Date(days * 86_400_000).toISOString().slice(0, 10)
}

/** The date `days` days after `date` (before, when negative); both YYYY-MM-DD. */
export function addDays(date: string, days: number): string {
  return fromUtcDays(utcDays(date) + days)
}

/** The weekday of a date: 0 Sunday … 6 Saturday. */
export function weekdayOf(date: string): number {
  // 1970-01-01 was a Thursday.
  return (((utcDays(date) + 4) % 7) + 7) % 7
}

/** The first day of the week that holds `date`, the week starting on `weekStartsOn`. */
export function weekStart(date: string, weekStartsOn: number): string {
  return addDays(date, -((weekdayOf(date) - weekStartsOn + 7) % 7))
}

/**
 * "Copy previous week" for the week of `column` (a day column): for each given row, each day of
 * that week takes the entry of the same weekday seven days earlier, when both days are columns of
 * the grid and of the same kind (a holiday is not overwritten by a working day's entry, and a
 * holiday's entry is not copied onto a working day). Unchanged cells are left out; nothing is
 * copied when the column has no date.
 */
export function copyPreviousWeek(
  value: AttendanceValue,
  rowIds: readonly string[],
  columns: readonly AttendanceColumnInfo[],
  column: string,
  weekStartsOn: number,
  hours: boolean,
): AttendanceChange[] {
  const date = columns.find((each) => each.id === column)?.date
  if (date === undefined) return []
  const byDate = new Map(
    columns.flatMap((each) => (each.date === undefined ? [] : [[each.date, each] as const])),
  )
  const first = weekStart(date, weekStartsOn)
  const pairs = Array.from({ length: 7 }, (_, index) => addDays(first, index)).flatMap((day) => {
    const target = byDate.get(day)
    const source = byDate.get(addDays(day, -7))
    if (target === undefined || source === undefined) return []
    if ((target.kind ?? 'normal') !== (source.kind ?? 'normal')) return []
    return [{ target: target.id, source: source.id }]
  })
  return rowIds.flatMap((row) =>
    pairs.flatMap(({ target, source }) => {
      const from = entryOf(value, row, source)
      const entry: AttendanceEntry = hours
        ? { code: from?.code ?? null, hours: from?.hours ?? null }
        : { code: from?.code ?? null }
      const previous = entryOf(value, row, target)
      return sameEntry(previous, entry) ? [] : [{ row, column: target, entry, previous }]
    }),
  )
}

// ── Keyboard ────────────────────────────────────────────────────────────────────────────────

/**
 * A position in the whole table: row 0 is the header row, then one row per person, then the
 * totals rows; column 0 is the row headers, then the day columns, then the totals columns.
 */
export interface AttendancePosition {
  row: number
  column: number
}

export interface AttendanceKey {
  key: string
  shift: boolean
  /** Ctrl, or Cmd on a Mac. */
  mod: boolean
  alt: boolean
}

export interface AttendanceKeyState {
  at: AttendancePosition
  /** The table's size, headers and totals included. */
  rows: number
  columns: number
  /** The day area: table rows 1…people, table columns 1…days. */
  people: number
  days: number
  direction: 'ltr' | 'rtl'
  mode: 'code' | 'hours'
  /** The codes and their keys. */
  codes: readonly { code: string; key?: string }[]
  /** False while locked: nothing is changed by a key. */
  editable: boolean
  /** Corrections are offered (locked, with `onCorrect`). */
  correctable: boolean
  /** Where marking a cell moves the focus: down the column, or forward along the row. */
  advance: 'down' | 'forward'
  /** The selection covers more than the focused cell. */
  ranged: boolean
}

/** What a key does in the grid (not while a cell is being edited). */
export type AttendanceKeyAction =
  /** The focus moves; the selection becomes that one cell. */
  | { type: 'move'; to: AttendancePosition }
  /** The selection grows or shrinks to this cell (Shift and an arrow). */
  | { type: 'extend'; to: AttendancePosition }
  /** The code is given to the selection, or to the focused cell and the focus moves on (`to`). */
  | { type: 'mark'; code: string; to: AttendancePosition | null }
  /** The selection, or the focused cell, is cleared. */
  | { type: 'clear' }
  /** The focused cell is edited: from its hours (`text` null) or from the typed character. */
  | { type: 'edit'; text: string | null }
  /** The selection is filled with its first cell's entry. */
  | { type: 'fill' }
  /** A correction of the focused cell is asked for (a locked grid). */
  | { type: 'correct' }
  | null

/** Whether a table position is a cell of the day area. */
export function isDayCell(cell: AttendancePosition, people: number, days: number): boolean {
  return cell.row >= 1 && cell.row <= people && cell.column >= 1 && cell.column <= days
}

/** A character that starts the editing of hours: a digit, a separator or a sign. */
export function startsHours(key: string): boolean {
  return /^[0-9.,\-+]$/.test(key)
}

/** The code whose key this is (keys compare without letter case), or null. */
export function codeForKey(
  key: string,
  codes: readonly { code: string; key?: string }[],
): string | null {
  if (key.length !== 1) return null
  const lower = key.toLowerCase()
  return codes.find((code) => code.key?.toLowerCase() === lower)?.code ?? null
}

/**
 * The action of a key press on a cell of the table.
 * - Arrows move one cell over the whole table (headers and totals included), the arrow pointing
 *   forward in the reading direction to the next column (Appendix B.7); Home and End to the row's
 *   ends, Ctrl+Home and Ctrl+End to the table's corners.
 * - Shift with an arrow grows the selection inside the day area.
 * - On a day cell of an editable grid: a code's key marks (the selection, or the cell and the
 *   focus moves on, down or forward); Delete or Backspace clears; Ctrl/Cmd+D fills the selection.
 *   In the code mode Enter moves down and Shift+Enter up (as EditableGrid). In the hours mode a
 *   digit or separator starts editing with it, and Enter or F2 edits the hours.
 * - On a day cell of a locked grid with corrections: Enter or F2 asks for a correction.
 */
export function attendanceKeyAction(
  key: AttendanceKey,
  state: AttendanceKeyState,
): AttendanceKeyAction {
  const { at, people, days } = state
  const day = isDayCell(at, people, days)
  const arrow = key.key.startsWith('Arrow')
  if (arrow && key.shift && !key.mod && !key.alt) {
    if (!day) return null
    const target = matrixKeyTarget(key.key, at, state.rows, state.columns, state.direction)
    if (target === null) return null
    const clamped = {
      row: Math.min(Math.max(target.row, 1), people),
      column: Math.min(Math.max(target.column, 1), days),
    }
    return clamped.row === at.row && clamped.column === at.column
      ? null
      : { type: 'extend', to: clamped }
  }
  if ((arrow || key.key === 'Home' || key.key === 'End') && !key.shift && !key.alt) {
    if (arrow && key.mod) return null
    const target = matrixKeyTarget(key.key, at, state.rows, state.columns, state.direction, key.mod)
    return target === null ? null : { type: 'move', to: target }
  }
  if (!day || key.alt) return null
  if (!state.editable) {
    return state.correctable && !key.mod && (key.key === 'Enter' || key.key === 'F2')
      ? { type: 'correct' }
      : null
  }
  if (key.mod) {
    return key.key.toLowerCase() === 'd' && !key.shift && state.ranged ? { type: 'fill' } : null
  }
  if (key.key === 'Delete' || key.key === 'Backspace') return { type: 'clear' }
  if (state.mode === 'hours') {
    if (key.key === 'Enter' || key.key === 'F2') return { type: 'edit', text: null }
    if (startsHours(key.key)) return { type: 'edit', text: key.key }
  } else if (key.key === 'Enter') {
    const row = at.row + (key.shift ? -1 : 1)
    return row < 1 || row > people ? null : { type: 'move', to: { row, column: at.column } }
  }
  const code = codeForKey(key.key, state.codes)
  return code === null ? null : { type: 'mark', code, to: state.ranged ? null : advanced(state) }
}

/** The cell after the focused one: down the column, or forward along the row; null at the end. */
function advanced(state: AttendanceKeyState): AttendancePosition | null {
  const { at } = state
  if (state.advance === 'down') {
    return at.row < state.people ? { row: at.row + 1, column: at.column } : null
  }
  return at.column < state.days ? { row: at.row, column: at.column + 1 } : null
}

/** The position "3 of 12" on phones: the index (from 0) after a step, kept inside the list. */
export function stepPerson(index: number, step: -1 | 1, count: number): number {
  return Math.min(Math.max(index + step, 0), Math.max(count - 1, 0))
}
