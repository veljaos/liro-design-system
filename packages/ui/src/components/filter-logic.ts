import type { LiroFormat } from '../provider/format'
import type { LiroMessages } from '../provider/messages'
import type { ComboboxOption } from './combobox-field'
import type { DataTableFilters, DataTableSort } from './data-table-logic'
import type { DateRange } from './date-field'
import type { SelectOption } from './select-field'

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
    | { type: 'numberRange'; decimals?: number }
    | { type: 'boolean' }
    | { type: 'text' }
  )

/**
 * The value of each kind: select a string; multiSelect a list of strings; dateRange a DateRange
 * (YYYY-MM-DD ends); numberRange a NumberRange (decimal strings); boolean true or false; text a
 * string. Null, undefined, '' and an empty list mean "not set".
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
  format: Pick<LiroFormat, 'date' | 'number'>,
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
      const text = (end: string | null) =>
        end === null || end === '' ? null : format.number(end, decimals)
      return rangeText(text(range.min), text(range.max))
    }
    case 'boolean':
      return value === true ? messages['filter.yes'] : messages['filter.no']
    case 'text':
      return String(value)
  }
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
