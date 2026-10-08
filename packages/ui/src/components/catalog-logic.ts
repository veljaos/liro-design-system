/*
 * The logic of the catalogue components (P5.19): LookupDialog's keyboard, ImportWizard's column
 * mapping and preview, BulkEditDrawer's summary. Pure functions, unit-tested in
 * `catalog-logic.test.ts`. Nothing here sorts, filters or decides about records: the application
 * does that on the server.
 */

// ── LookupDialog ──────────────────────────────────────────────────────────────────────────────

/**
 * Where a key moves the focus in LookupDialog: 'search' (the search field), the index of a
 * result row, or null (the key is not the dialog's). `index` is the focused row, or -1 for the
 * search field; `count` is the number of rows shown.
 * - From the search field ArrowDown goes to the first row (the field keeps every other key).
 * - In the rows ArrowDown / ArrowUp move one row and stop at the ends — ArrowUp from the first
 *   row returns to the search field; PageDown / PageUp move ten; Home / End go to the first and
 *   the last row.
 */
export function lookupKeyTarget(
  key: string,
  index: number,
  count: number,
): 'search' | number | null {
  if (count === 0) return null
  if (index < 0) return key === 'ArrowDown' ? 0 : null
  const last = count - 1
  switch (key) {
    case 'ArrowDown':
      return Math.min(index + 1, last)
    case 'ArrowUp':
      return index === 0 ? 'search' : index - 1
    case 'PageDown':
      return Math.min(index + LOOKUP_PAGE_STEP, last)
    case 'PageUp':
      return Math.max(index - LOOKUP_PAGE_STEP, 0)
    case 'Home':
      return 0
    case 'End':
      return last
    default:
      return null
  }
}

/** PageDown and PageUp in LookupDialog's results move this many rows (as the company switcher). */
export const LOOKUP_PAGE_STEP = 10

/**
 * A key that types (a character, or Backspace) without a modifier: on a result row it sends the
 * focus back to the search field, which then receives it, so typing never stops.
 */
export function isTypingKey(event: {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
}): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return false
  if (event.key === 'Backspace') return true
  // One character (a code point): a named key ("ArrowDown", "F2") is longer.
  return /^.$/u.test(event.key) && event.key !== ' '
}

// ── ImportWizard ──────────────────────────────────────────────────────────────────────────────

/** A column of the chosen file, as the application read it. */
export interface ImportSourceColumn {
  id: string
  /** The column's heading in the file ("Naziv kupca"). */
  name: string
  /** A value from the file's first data row, to recognise the column. */
  sample?: string
}

/** A field of the catalogue that a column can fill. */
export interface ImportField {
  id: string
  /** The field's name ("Name", "Tax number"). */
  label: string
  /** The import cannot start without a column for it. */
  required?: boolean
  /** What the field expects ("9 digits"). */
  description?: string
}

/** The mapping: for each field id, the id of the file's column that fills it, or null. */
export type ImportMapping = Readonly<Record<string, string | null>>

/** One problem of a preview row, from the application's validation. */
export interface ImportIssue {
  /** The field it concerns (shown in that cell); none for the row as a whole. */
  field?: string
  tone: 'danger' | 'warning'
  /** The application's words ("Tax number must have 9 digits"). */
  text: string
}

/** One row of the validation preview, as the application read and checked it. */
export interface ImportPreviewRow {
  id: string
  /** The row's line in the file, as the user finds it there. */
  line: number
  /** The values per field id, as text. */
  values: Readonly<Record<string, string>>
  issues: readonly ImportIssue[]
}

/** The preview's counts, from the application (it checked the whole file). */
export interface ImportCounts {
  /** Rows that can be imported as they are. */
  ready: number
  /** Rows with at least one error. */
  errors: number
  /** Rows with warnings only. */
  warnings?: number
  /** Rows that look like a record that already exists. */
  duplicates?: number
}

/** The required fields that have no column yet, in the fields' order. */
export function missingRequired(
  fields: readonly ImportField[],
  mapping: ImportMapping,
): ImportField[] {
  return fields.filter((field) => field.required === true && (mapping[field.id] ?? null) === null)
}

/** The file's columns that no field takes, in the file's order. */
export function unusedColumns(
  columns: readonly ImportSourceColumn[],
  mapping: ImportMapping,
): ImportSourceColumn[] {
  const used = new Set(Object.values(mapping).filter((id) => id !== null))
  return columns.filter((column) => !used.has(column.id))
}

/**
 * The mapping after a column is chosen for a field (or none, null). A column fills one field
 * only: a field that had the same column loses it, so a value is never imported twice.
 */
export function assignColumn(
  mapping: ImportMapping,
  field: string,
  column: string | null,
): Record<string, string | null> {
  const next: Record<string, string | null> = {}
  for (const [id, value] of Object.entries(mapping)) {
    next[id] = column !== null && value === column ? null : value
  }
  next[field] = column
  return next
}

/** A row with an error or a warning (the preview's "Only rows with problems"). */
export function isProblemRow(row: ImportPreviewRow): boolean {
  return row.issues.length > 0
}

/** A row with at least one error: it cannot be imported as it is. */
export function hasErrors(row: ImportPreviewRow): boolean {
  return row.issues.some((issue) => issue.tone === 'danger')
}

/**
 * The issues of one cell (`field`) or of the row as a whole (`field` undefined), errors before
 * warnings, each group in the application's order.
 */
export function issuesOf(row: ImportPreviewRow, field: string | undefined): ImportIssue[] {
  const own = row.issues.filter((issue) => issue.field === field)
  return [
    ...own.filter((issue) => issue.tone === 'danger'),
    ...own.filter((issue) => issue.tone === 'warning'),
  ]
}

/** Import cannot start while rows have errors and the user has not chosen to skip them. */
export function importBlocked(counts: ImportCounts, skipInvalid: boolean): boolean {
  return counts.errors > 0 && !skipInvalid
}

// ── BulkEditDrawer ────────────────────────────────────────────────────────────────────────────

/** The ids being changed after a field's "change" choice is turned on or off, in the fields' order. */
export function toggleChanging(
  fields: readonly { id: string }[],
  changing: readonly string[],
  id: string,
  on: boolean,
): string[] {
  const set = new Set(changing)
  if (on) set.add(id)
  else set.delete(id)
  return fields.map((field) => field.id).filter((each) => set.has(each))
}

/** The fields that will change, in the fields' order (the summary and the confirmation). */
export function changedFields<Field extends { id: string }>(
  fields: readonly Field[],
  changing: readonly string[],
): Field[] {
  const set = new Set(changing)
  return fields.filter((field) => set.has(field.id))
}
