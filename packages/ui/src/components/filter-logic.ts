import type { LiroFormat } from '../provider/format'
import type { LiroMessages } from '../provider/messages'
import type { ComboboxOption } from './combobox-field'
import type { DataTableFilters, DataTableSort } from './data-table-logic'
import type { DateRange } from './date-field'
import type { SelectOption } from './select-field'
import type { TreeNode } from './tree-logic'

/*
 * FilterBar's logic, without React: which values count as set, how an active filter is written
 * on its pill, how the bar clears its own filters, and the short text of the phone's sort button.
 * The bar never filters or sorts rows; the application does, on the server.
 */

/** A range of decimal strings ("10", "1234.50"); either end may be open. */
export interface NumberRange {
  min: string | null
  max: string | null
}

interface FilterBase {
  /** The key of the filter's value in `values`. */
  id: string
  /** The filter's name for the user, from the application. */
  label: string
}

/** One filter of a FilterBar, by kind. Values: see `FilterValue`. */
export type FilterDefinition = FilterBase &
  (
    | { type: 'select'; options: readonly SelectOption[] }
    | { type: 'multiSelect'; options: readonly ComboboxOption[] }
    | { type: 'dateRange' }
    | {
        type: 'numberRange'
        decimals?: number
        /** An amount range: the ends are MoneyFields with this currency. */
        currency?: string
      }
    | { type: 'boolean' }
    | { type: 'text' }
    | {
        /**
         * A choice in a hierarchy (an act's area): a TreeView in the drawer, never in the
         * row (a tree needs the room), with checkboxes (`selection` 'multiple', the default) or
         * one node ('single'). Checking a branch checks its loaded descendants
         * (`toggleTreeSelection`); the pill names the highest chosen nodes (`treeFilterLabels`).
         */
        type: 'tree'
        nodes: readonly TreeNode[]
        selection?: 'single' | 'multiple'
        /** Branches open when the drawer opens; default the ancestors of the chosen nodes. */
        defaultExpanded?: readonly string[]
      }
  )

/**
 * The value of each kind: select a string; multiSelect a list of strings; dateRange a DateRange
 * (YYYY-MM-DD ends); numberRange a NumberRange (decimal strings); boolean true or false; text a
 * string; tree a list of node ids (at most one with `selection` 'single'). Null, undefined, '' and
 * an empty list mean "not set".
 */
export type FilterValue = string | readonly string[] | DateRange | NumberRange | boolean | null

function isRange(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Whether a filter's value is set (a range needs at least one end). */
export function isFilterSet(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  if (isRange(value)) {
    return Object.values(value).some((end) => end !== null && end !== undefined && end !== '')
  }
  return true
}

/** The value that means "not set" for a filter of this kind. */
export function emptyFilterValue(filter: FilterDefinition): FilterValue {
  switch (filter.type) {
    case 'multiSelect':
    case 'tree':
      return []
    case 'dateRange':
      return { start: null, end: null }
    case 'numberRange':
      return { min: null, max: null }
    default:
      return null
  }
}

/**
 * `values` with every filter of the bar set back to "not set". Keys the bar does not own (the
 * application's other filters) stay as they are.
 */
export function clearFilters(
  filters: readonly FilterDefinition[],
  values: DataTableFilters,
): DataTableFilters {
  const next: Record<string, unknown> = { ...values }
  for (const filter of filters) next[filter.id] = emptyFilterValue(filter)
  return next
}

/** "from – to", or one end with the dash on its open side ("from –", "– to"). */
export function rangeText(from: string | null, to: string | null): string {
  if (from !== null && to !== null) return `${from} – ${to}`
  if (from !== null) return `${from} –`
  return `– ${to ?? ''}`
}

/**
 * The text of a filter's value on its pill (without the label), through the provider's
 * `format` and `messages`; null when the value is not set.
 */
export function filterValueText(
  filter: FilterDefinition,
  value: unknown,
  format: Pick<LiroFormat, 'date' | 'number' | 'money'>,
  messages: Pick<LiroMessages, 'filter.yes' | 'filter.no'>,
): string | null {
  if (!isFilterSet(value)) return null
  switch (filter.type) {
    case 'select':
      return filter.options.find((option) => option.value === value)?.label ?? String(value)
    case 'multiSelect': {
      const chosen = value as readonly string[]
      return chosen
        .map((one) => filter.options.find((option) => option.value === one)?.label ?? one)
        .join(', ')
    }
    case 'dateRange': {
      const range = value as DateRange
      return rangeText(
        range.start === null ? null : format.date(range.start),
        range.end === null ? null : format.date(range.end),
      )
    }
    case 'numberRange': {
      const range = value as NumberRange
      const decimals = filter.decimals === undefined ? {} : { decimals: filter.decimals }
      const currency = filter.currency
      const text = (end: string | null) =>
        end === null || end === ''
          ? null
          : currency === undefined
            ? format.number(end, decimals)
            : format.money(end, currency, decimals)
      return rangeText(text(range.min), text(range.max))
    }
    case 'boolean':
      return value === true ? messages['filter.yes'] : messages['filter.no']
    case 'text':
      return String(value)
    case 'tree':
      return treeFilterLabels(filter.nodes, treeFilterIds(value)).join(', ')
  }
}

/** A tree filter's value as a list of ids: a list stays, one id (text) becomes a list of one. */
export function treeFilterIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((id): id is string => typeof id === 'string')
  return typeof value === 'string' && value !== '' ? [value] : []
}

/**
 * The names a tree filter's pill shows: each chosen node whose parent is not chosen, in the
 * tree's order (a checked branch stands for its descendants: "Construction", not "Construction,
 * Building permits, Site safety"); a chosen id the tree does not hold (not loaded) as it is, at
 * the end.
 */
export function treeFilterLabels(
  nodes: readonly TreeNode<unknown>[],
  chosen: readonly string[],
): string[] {
  const wanted = new Set(chosen)
  const labels: string[] = []
  const found = new Set<string>()
  const walk = (list: readonly TreeNode<unknown>[], parentChosen: boolean) => {
    for (const node of list) {
      const isChosen = wanted.has(node.id)
      if (isChosen) found.add(node.id)
      if (isChosen && !parentChosen) labels.push(node.label)
      if (node.children !== undefined) walk(node.children, parentChosen || isChosen)
    }
  }
  walk(nodes, false)
  return [...labels, ...chosen.filter((id) => !found.has(id))]
}

/** A sortable column, as the phone's sort menu lists it. */
export interface SortColumn {
  id: string
  /** Short, from the application: "Date", "Total". */
  label: string
}

/** The phone's sort button text: "Date ↓", or the given fallback when nothing is sorted. */
export function sortButtonText(
  sort: DataTableSort,
  columns: readonly SortColumn[],
  unsorted: string,
): string {
  const column = sort === null ? undefined : columns.find((one) => one.id === sort.column)
  if (sort === null || column === undefined) return unsorted
  return `${column.label} ${sort.direction === 'asc' ? '↑' : '↓'}`
}
