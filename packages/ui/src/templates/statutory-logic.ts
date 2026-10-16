import type { ReactNode } from 'react'
import type { StatutoryRule } from './register-logic'

/*
 * The model and the pure logic of StatutoryFormPage as a form grid (P5.28 item 19, the owner:
 * "VAT return and statutory forms as the real form grid, like PP PDV, POPDV and the input-VAT
 * records"), unit-tested in `statutory-logic.test.ts`. Rows, columns, codes and texts are the
 * application's; nothing here computes a value of the form — these functions only lay out,
 * find and name what they are given.
 */

/** A document behind an amount. */
export interface SourceDocument {
  key: string
  /** The kind ("Invoice", "Credit note"). */
  type: string
  /** Its number ("F-2026-0412"). */
  number: string
  /** Its page, through the provider's linkComponent. */
  href: string
  /** Its state: a StatusBadge. */
  status?: ReactNode
  /** Its date, YYYY-MM-DD. */
  date?: string
  /** Its share of the cell's amount, a decimal string. */
  amount: string
}

/** A value typed over the computed one: who and when (the application's words), and the computed value. */
export interface StatutoryOverride {
  /** The value the books give, a decimal string. */
  computed: string
  /** Who changed it ("Ivana Stojanović"). */
  by: string
  /** When, as the application writes it ("05.10.2026. 14:12"). */
  at: string
}

/**
 * A column of a part's grid. Neighbouring columns with the same `group` share one header above
 * their own ("General rate 20%" over "Base" and "VAT"); a column without a group has one header
 * over both header rows. A one-column part has one column ("Amount / value").
 */
export interface StatutoryColumn {
  id: string
  /** The column's header ("Base", "VAT", "Amount / value"), from the application. */
  label: string
  /** The group's header over it ("General rate 20%"), from the application. */
  group?: string
}

/**
 * How a cell gets its value:
 * - `entered` — typed by the user: the application's field (`field`); plain text when read-only;
 * - `computed` — read-only, worked out by the Core (a total, a sum of other cells);
 * - `source` — read-only, taken from documents (e-invoices from the e-invoice system, customs
 *   declarations): the value opens the documents (`sources`).
 * A computed or source cell may be typed over (`editor`), and then carries its `override`.
 */
export type StatutoryCellKind = 'entered' | 'computed' | 'source'

/** One cell of the grid: a row's value in one column. */
export interface StatutoryCell {
  kind: StatutoryCellKind
  /** This period's value, a decimal string; null when empty. */
  value: string | null
  /** The previous period's value, shown under it while comparing; null prints "—". */
  previous?: string | null
  /** Default: the page's `currency`. */
  currency?: string
  decimals?: number
  /**
   * `entered`: the application's field (a MoneyField with its label hidden; name it with
   * `statutoryCellLabel`, e.g. "1.1.2 · General rate 20% · Base").
   */
  field?: ReactNode
  /** `source`: the documents behind the value; the value opens them. */
  sources?: readonly SourceDocument[]
  /** `source`: where the documents come from ("E-invoices from SEF"), named in their list. */
  sourceName?: string
  /** The value was typed over the computed one. */
  override?: StatutoryOverride
  /** `computed` or `source`: the application's field to type a value over the computed one. */
  editor?: ReactNode
  /**
   * The application's own content in place of an amount, read-only (P5.45): a column that holds
   * no figure, such as a financial statement's "Note" column with a link to the note. `value`
   * is then ignored (keep it null).
   */
  content?: ReactNode
}

/** One numbered row of the form ("1.1.2"). */
export interface StatutoryRow {
  id: string
  /** The form's own number ("1.1.2", "8a.1"). */
  number: string
  /** The form's text for the row; long texts wrap. */
  label: string
  /**
   * The row's cells by column id. A column without a cell does not apply to the row: its place
   * stays blank — never 0, never a disabled field.
   */
  cells: Readonly<Partial<Record<string, StatutoryCell>>>
  /** A result line of the form ("Total"): drawn semibold under a line. */
  total?: boolean
}

/** A numbered group of rows inside a part ("1.1 Supplies in the Republic"), collapsible. */
export interface StatutoryGroup {
  key: string
  /** Its number ("1.1"). */
  number?: string
  title: string
  /** Its rows and groups, in the form's order. */
  items: readonly StatutoryItem[]
}

/** A row or a nested group. */
export type StatutoryItem = StatutoryRow | StatutoryGroup

/** One part of the form ("Part 1"): a card with its own columns, collapsible. */
export interface StatutorySection {
  key: string
  /** Its title as the form writes it ("Part 1. Supplies of goods and services and VAT"). */
  title: string
  description?: string
  /** The part's columns: groups over sub-columns, or one column. */
  columns: readonly StatutoryColumn[]
  /** Its rows and numbered groups, in the form's order. */
  items: readonly StatutoryItem[]
}

/** True for a nested group, false for a row. */
export function isStatutoryGroup(item: StatutoryItem): item is StatutoryGroup {
  return 'items' in item
}

/** The id of one cell ("1.1.2" and "base20" → "1.1.2/base20"): rules and "Go to" use it. */
export function statutoryCellId(row: string, column: string): string {
  return `${row}/${column}`
}

/** A column's full name: its group and its own header ("General rate 20% · Base"). */
export function statutoryColumnLabel(column: StatutoryColumn): string {
  return column.group === undefined ? column.label : `${column.group} · ${column.label}`
}

/** A cell's full name: the row's number, the group and the column ("1.1.2 · General rate 20% · Base"). */
export function statutoryCellLabel(row: StatutoryRow, column: StatutoryColumn): string {
  return `${row.number} · ${statutoryColumnLabel(column)}`
}

/** One header cell of the first header row: a group over its columns, or a column alone. */
export type StatutoryHeaderCell =
  | { kind: 'group'; key: string; label: string; span: number }
  | { kind: 'column'; column: StatutoryColumn }

/**
 * The two header rows of a grid: the first holds the groups (spanning their columns) and the
 * columns without a group (spanning both rows); the second the grouped columns' own headers.
 * Without any group there is one header row (`second` is empty).
 */
export function statutoryHeaderRows(columns: readonly StatutoryColumn[]): {
  first: StatutoryHeaderCell[]
  second: StatutoryColumn[]
} {
  const first: StatutoryHeaderCell[] = []
  const second: StatutoryColumn[] = []
  for (const column of columns) {
    if (column.group === undefined) {
      first.push({ kind: 'column', column })
      continue
    }
    second.push(column)
    const last = first[first.length - 1]
    if (last?.kind === 'group' && last.label === column.group) last.span += 1
    else first.push({ kind: 'group', key: column.id, label: column.group, span: 1 })
  }
  return { first, second }
}

/** A line of the drawn grid: a group's heading or a row, with its depth (0 at the part). */
export type StatutoryGridLine =
  | { kind: 'group'; group: StatutoryGroup; depth: number; open: boolean }
  | { kind: 'row'; row: StatutoryRow; depth: number }

/**
 * The lines to draw, in order: every group's heading, and the rows of the open groups only
 * (a collapsed group's rows are not drawn).
 */
export function statutoryGridLines(
  items: readonly StatutoryItem[],
  collapsed: ReadonlySet<string>,
  depth = 0,
): StatutoryGridLine[] {
  const lines: StatutoryGridLine[] = []
  for (const item of items) {
    if (isStatutoryGroup(item)) {
      const open = !collapsed.has(item.key)
      lines.push({ kind: 'group', group: item, depth, open })
      if (open) lines.push(...statutoryGridLines(item.items, collapsed, depth + 1))
    } else {
      lines.push({ kind: 'row', row: item, depth })
    }
  }
  return lines
}

/** Every row of the items, groups opened (for finding a field). */
export function statutoryRows(items: readonly StatutoryItem[]): StatutoryRow[] {
  return items.flatMap((item) => (isStatutoryGroup(item) ? statutoryRows(item.items) : [item]))
}

/** Where a row or a cell is: its part, the keys of the groups around it, the row and the column. */
export interface StatutoryPlace {
  section: StatutorySection
  /** The keys of the part and of every group around the row, outermost first. */
  path: string[]
  row: StatutoryRow
  /** The column, when the id named a cell. */
  column?: StatutoryColumn
}

function placeIn(
  items: readonly StatutoryItem[],
  rowId: string,
  path: string[],
): { row: StatutoryRow; path: string[] } | undefined {
  for (const item of items) {
    if (isStatutoryGroup(item)) {
      const found = placeIn(item.items, rowId, [...path, item.key])
      if (found !== undefined) return found
    } else if (item.id === rowId) {
      return { row: item, path }
    }
  }
  return undefined
}

/**
 * Finds a row ("1.1.2") or a cell ("1.1.2/base20") in the form, with the part and groups that
 * must be open to show it.
 */
export function findStatutoryPlace(
  sections: readonly StatutorySection[],
  id: string,
): StatutoryPlace | undefined {
  for (const section of sections) {
    for (const column of [undefined, ...section.columns]) {
      const prefix = column === undefined ? undefined : `/${column.id}`
      if (prefix !== undefined && !id.endsWith(prefix)) continue
      const rowId = prefix === undefined ? id : id.slice(0, -prefix.length)
      const found = placeIn(section.items, rowId, [section.key])
      if (found === undefined) continue
      if (column !== undefined && found.row.cells[column.id] === undefined) continue
      return {
        section,
        path: found.path,
        row: found.row,
        ...(column === undefined ? {} : { column }),
      }
    }
  }
  return undefined
}

/**
 * The rules to show under a row: those that concern the row or any of its cells and did not
 * pass, failures before warnings, each group in the Core's order (as `fieldRules` for one field).
 */
export function statutoryRowRules(
  rules: readonly StatutoryRule[],
  row: StatutoryRow,
  columns: readonly StatutoryColumn[],
): StatutoryRule[] {
  const ids = [row.id, ...columns.map((column) => statutoryCellId(row.id, column.id))]
  const order = { failed: 0, warning: 1, passed: 2 } as const
  return rules
    .filter((rule) => rule.result !== 'passed' && rule.fields.some((id) => ids.includes(id)))
    .sort((a, b) => order[a.result] - order[b.result])
}
