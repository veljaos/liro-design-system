/*
 * The pivot's model and its pure logic (P5.77): the fields the application offers, the layout the
 * user chooses (rows, columns, values with their aggregation, filters), and the result the
 * application computes for that layout. The library never adds, averages or counts: every cell,
 * subtotal and grand total is the application's decimal string (null shows as "—"). What is here:
 * changing a layout, the columns' leaves and their paths, the rows' paths, the groups that can be
 * opened, and the grid's arrow keys.
 */

/** Where a field stands in the layout. */
export type PivotArea = 'filters' | 'columns' | 'rows' | 'values'

/** The areas in the chooser's order (as a spreadsheet's field list: filters, columns, rows, values). */
export const PIVOT_AREAS: readonly PivotArea[] = ['filters', 'columns', 'rows', 'values']

/** One choice from the application's list: an aggregation, or a dimension's value. */
export interface PivotOption {
  id: string
  /** In the application's words ("Sum", "Average", "Beton Mix d.o.o."). */
  label: string
}

/** A field the application offers for the pivot. */
export interface PivotField {
  id: string
  /** The field's name, from the application ("Partner", "Month", "Amount"). */
  label: string
  /**
   * 'dimension': its values group the figures (rows, columns, filters). 'measure': a figure the
   * application aggregates (values).
   */
  kind: 'dimension' | 'measure'
  /** A measure's aggregations, in the application's words; the first is the one added by default. */
  aggregations?: readonly PivotOption[]
  /** A dimension's values to filter by. Without them the field cannot be a filter. */
  values?: readonly PivotOption[]
}

/** A measure in Values with the aggregation chosen for it. */
export interface PivotValue {
  field: string
  aggregation: string
}

/** A filter: the values kept. An empty list keeps every value (no filter yet). */
export interface PivotFilter {
  field: string
  values: readonly string[]
}

/** What the user chose: the application computes the result for it. */
export interface PivotLayout {
  rows: readonly string[]
  columns: readonly string[]
  values: readonly PivotValue[]
  filters: readonly PivotFilter[]
}

/** An empty layout: nothing chosen yet. */
export const EMPTY_PIVOT_LAYOUT: PivotLayout = { rows: [], columns: [], values: [], filters: [] }

/** How a column's figures are written: through the provider's `format`. Default 'number'. */
export type PivotValueKind = 'number' | 'money' | 'percent'

/**
 * A column of the result, from the application: the members of the column fields nested, the
 * leaves the figures' columns ("Jul 2026" over "Amount" and "Documents"). Keys are unique in the
 * whole tree. A group may set `kind`, `currency` and `decimals` for its leaves.
 */
export interface PivotColumn {
  key: string
  label: string
  children?: readonly PivotColumn[]
  /** A subtotal or the grand total column (semibold on the sunken surface, as DataTable's totals). */
  total?: boolean
  kind?: PivotValueKind
  /** For 'money': the currency code or sign. */
  currency?: string
  /** Zeros added up to this many decimals; never rounded. */
  decimals?: number
}

/**
 * A row of the result: a member of the row fields with its figures by leaf column key, and the
 * members of the next row field under it. A row with children is a group: its own figures are the
 * group's subtotals, from the application.
 */
export interface PivotRow {
  key: string
  label: string
  /** The figures by leaf column key: decimal strings; null or missing is "—". */
  cells: Readonly<Record<string, string | null | undefined>>
  children?: readonly PivotRow[]
}

/** What the application computed for a layout. */
export interface PivotResult {
  columns: readonly PivotColumn[]
  rows: readonly PivotRow[]
  /** The grand total row (its `label` is the application's: "Total"). */
  total?: PivotRow
}

/** A figure the user opened (drill-down): the application shows its records. */
export interface PivotCellRef {
  rowKey: string
  columnKey: string
  /** The row's labels from the top ("Beton Mix d.o.o.", "Site Liman 4"). */
  rowPath: readonly string[]
  /** The column's labels from the top ("Jul 2026", "Amount"). */
  columnPath: readonly string[]
  /** The figure as the application gave it. */
  value: string
}

// ── The layout ───────────────────────────────────────────────────────────────────────────────

/** The areas a field may stand in: a dimension in rows and columns (and filters with values). */
export function fieldAreas(field: PivotField): PivotArea[] {
  if (field.kind === 'measure') return (field.aggregations?.length ?? 0) > 0 ? ['values'] : []
  return field.values !== undefined && field.values.length > 0
    ? ['filters', 'columns', 'rows']
    : ['columns', 'rows']
}

/** The ids of the fields in one area, in order. */
export function areaFieldIds(layout: PivotLayout, area: PivotArea): string[] {
  if (area === 'values') return layout.values.map((value) => value.field)
  if (area === 'filters') return layout.filters.map((filter) => filter.field)
  return [...layout[area]]
}

/** Where the field stands, or null when it is not in the layout. */
export function areaOf(layout: PivotLayout, fieldId: string): PivotArea | null {
  return PIVOT_AREAS.find((area) => areaFieldIds(layout, area).includes(fieldId)) ?? null
}

/** The layout without the field, wherever it stood. */
export function removeField(layout: PivotLayout, fieldId: string): PivotLayout {
  return {
    rows: layout.rows.filter((id) => id !== fieldId),
    columns: layout.columns.filter((id) => id !== fieldId),
    values: layout.values.filter((value) => value.field !== fieldId),
    filters: layout.filters.filter((filter) => filter.field !== fieldId),
  }
}

function insertAt<T>(list: readonly T[], item: T, index: number | undefined): T[] {
  const at = index === undefined ? list.length : Math.max(0, Math.min(index, list.length))
  return [...list.slice(0, at), item, ...list.slice(at)]
}

/**
 * The layout with the field placed in an area (at `index`, default the end), taken from where it
 * stood. A measure enters Values with its first aggregation; a filter starts with every value kept.
 * A field the area does not take leaves the layout unchanged.
 */
export function placeField(
  layout: PivotLayout,
  field: PivotField,
  area: PivotArea,
  index?: number,
): PivotLayout {
  if (!fieldAreas(field).includes(area)) return layout
  const rest = removeField(layout, field.id)
  if (area === 'values') {
    const kept = layout.values.find((value) => value.field === field.id)
    const aggregation = kept?.aggregation ?? field.aggregations?.[0]?.id ?? ''
    return { ...rest, values: insertAt(rest.values, { field: field.id, aggregation }, index) }
  }
  if (area === 'filters') {
    const kept = layout.filters.find((filter) => filter.field === field.id)
    return {
      ...rest,
      filters: insertAt(rest.filters, kept ?? { field: field.id, values: [] }, index),
    }
  }
  return { ...rest, [area]: insertAt(rest[area], field.id, index) }
}

function moveItem<T>(list: readonly T[], from: number, offset: number): T[] {
  const to = from + offset
  if (from < 0 || to < 0 || to >= list.length) return [...list]
  const next = [...list]
  const [item] = next.splice(from, 1)
  if (item !== undefined) next.splice(to, 0, item)
  return next
}

/** The field moved earlier (−1) or later (+1) within its area; at an end, unchanged. */
export function moveField(layout: PivotLayout, fieldId: string, offset: number): PivotLayout {
  const area = areaOf(layout, fieldId)
  if (area === null) return layout
  const from = areaFieldIds(layout, area).indexOf(fieldId)
  if (area === 'values') return { ...layout, values: moveItem(layout.values, from, offset) }
  if (area === 'filters') return { ...layout, filters: moveItem(layout.filters, from, offset) }
  return { ...layout, [area]: moveItem(layout[area], from, offset) }
}

/** A measure's aggregation changed (one of the application's ids). */
export function setAggregation(
  layout: PivotLayout,
  fieldId: string,
  aggregation: string,
): PivotLayout {
  return {
    ...layout,
    values: layout.values.map((value) =>
      value.field === fieldId ? { ...value, aggregation } : value,
    ),
  }
}

/** A filter's kept values changed; an empty list keeps every value. */
export function setFilterValues(
  layout: PivotLayout,
  fieldId: string,
  values: readonly string[],
): PivotLayout {
  return {
    ...layout,
    filters: layout.filters.map((filter) =>
      filter.field === fieldId ? { ...filter, values: [...values] } : filter,
    ),
  }
}

/** The fields not in the layout, in the application's order. */
export function unusedFields(fields: readonly PivotField[], layout: PivotLayout): PivotField[] {
  return fields.filter((field) => areaOf(layout, field.id) === null)
}

/** Whether there is a figure to show: at least one value. */
export function hasValues(layout: PivotLayout): boolean {
  return layout.values.length > 0
}

// ── The result ───────────────────────────────────────────────────────────────────────────────

/** A figures' column with its labels from the top and how it is written. */
export interface PivotLeaf {
  column: PivotColumn
  path: string[]
  kind: PivotValueKind
  currency: string | undefined
  decimals: number | undefined
  /** It or a group above it is a total. */
  total: boolean
}

/** The leaves in order, each with its path and the format it inherits from the groups above it. */
export function pivotLeaves(columns: readonly PivotColumn[]): PivotLeaf[] {
  const leaves: PivotLeaf[] = []
  const walk = (list: readonly PivotColumn[], parent: Omit<PivotLeaf, 'column'>) => {
    for (const column of list) {
      const here = {
        path: [...parent.path, column.label],
        kind: column.kind ?? parent.kind,
        currency: column.currency ?? parent.currency,
        decimals: column.decimals ?? parent.decimals,
        total: parent.total || column.total === true,
      }
      if (column.children !== undefined && column.children.length > 0) walk(column.children, here)
      else leaves.push({ column, ...here })
    }
  }
  walk(columns, {
    path: [],
    kind: 'number',
    currency: undefined,
    decimals: undefined,
    total: false,
  })
  return leaves
}

/** How many header rows the columns take (the deepest leaf). */
export function pivotHeaderDepth(columns: readonly PivotColumn[]): number {
  let depth = 0
  for (const column of columns) {
    const below =
      column.children !== undefined && column.children.length > 0
        ? pivotHeaderDepth(column.children)
        : 0
    depth = Math.max(depth, below + 1)
  }
  return depth
}

/** Every row's labels from the top, by key. */
export function pivotRowPaths(rows: readonly PivotRow[]): Map<string, string[]> {
  const paths = new Map<string, string[]>()
  const walk = (list: readonly PivotRow[], parent: string[]) => {
    for (const row of list) {
      const path = [...parent, row.label]
      paths.set(row.key, path)
      if (row.children !== undefined) walk(row.children, path)
    }
  }
  walk(rows, [])
  return paths
}

/** The keys of every group (a row with children), for "Expand all". */
export function pivotGroupKeys(rows: readonly PivotRow[]): string[] {
  return rows.flatMap((row) =>
    row.children !== undefined && row.children.length > 0
      ? [row.key, ...pivotGroupKeys(row.children)]
      : [],
  )
}

/** The groups at the top level only: the first level opened, the rest closed. */
export function pivotTopGroupKeys(rows: readonly PivotRow[]): string[] {
  return rows.filter((row) => (row.children?.length ?? 0) > 0).map((row) => row.key)
}

// ── The grid's keys ──────────────────────────────────────────────────────────────────────────

/** A cell of the grid: the row among the drawn rows (the total last), the column (0: row header). */
export interface PivotPosition {
  row: number
  column: number
}

/** How many rows a Page Up / Page Down moves. */
export const PIVOT_PAGE_ROWS = 10

/**
 * Where an arrow, Home, End, Page Up or Page Down moves the focus in the grid (WAI-ARIA grid):
 * the arrows by one cell (ArrowRight towards the end, so to the left in right to left), Home / End
 * to the row's first / last cell (with Ctrl or Cmd to the grid's first / last), Page keys by ten
 * rows. Null for any other key. Kept inside the grid.
 */
export function pivotKeyTarget(
  key: string,
  at: PivotPosition,
  size: { rows: number; columns: number },
  options: { rtl: boolean; ctrl: boolean },
): PivotPosition | null {
  const lastRow = Math.max(0, size.rows - 1)
  const lastColumn = Math.max(0, size.columns - 1)
  const clamp = (row: number, column: number): PivotPosition => ({
    row: Math.max(0, Math.min(row, lastRow)),
    column: Math.max(0, Math.min(column, lastColumn)),
  })
  const forward = options.rtl ? -1 : 1
  switch (key) {
    case 'ArrowDown':
      return clamp(at.row + 1, at.column)
    case 'ArrowUp':
      return clamp(at.row - 1, at.column)
    case 'ArrowRight':
      return clamp(at.row, at.column + forward)
    case 'ArrowLeft':
      return clamp(at.row, at.column - forward)
    case 'Home':
      return options.ctrl ? clamp(0, 0) : clamp(at.row, 0)
    case 'End':
      return options.ctrl ? clamp(lastRow, lastColumn) : clamp(at.row, lastColumn)
    case 'PageDown':
      return clamp(at.row + PIVOT_PAGE_ROWS, at.column)
    case 'PageUp':
      return clamp(at.row - PIVOT_PAGE_ROWS, at.column)
    default:
      return null
  }
}
