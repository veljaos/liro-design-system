import type { LiroMessages } from '../provider/messages'

/** The column a table is sorted by, and the direction. `null`: the order the rows came in. */
export type DataTableSort = { column: string; direction: 'asc' | 'desc' } | null

/**
 * The table's filters, as the application keeps them: filter id → value. The table reads them
 * only to tell "nothing here yet" from "no rows match", and clears them (P3.1; FilterBar, P3.3,
 * edits them).
 */
export type DataTableFilters = Readonly<Record<string, unknown>>

/** Above this count, a table shows "More than 10,000" (BUILD-PLAN P3.1). */
export const COUNT_THRESHOLD = 10_000

/**
 * The count of rows in words, through `messages['table.count']`: the exact number up to the
 * threshold, else "More than <threshold>". A count the server did not finish (`exact` false) is
 * a lower bound: "More than <count>".
 */
export function formatCount(
  messages: Pick<LiroMessages, 'table.count'>,
  count: number,
  exact = true,
  threshold = COUNT_THRESHOLD,
): string {
  if (count > threshold) return messages['table.count'](threshold, false)
  return messages['table.count'](count, exact)
}

/** Whether a filter value filters anything: not null, undefined, '', false or an empty list. */
export function isActiveFilterValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '' || value === false) return false
  if (Array.isArray(value)) return value.length > 0
  return true
}

/** Whether any filter is set, so an empty table means "no rows match" rather than "nothing yet". */
export function hasActiveFilters(filters: DataTableFilters | undefined): boolean {
  return filters !== undefined && Object.values(filters).some(isActiveFilterValue)
}

/**
 * The sort after a header is pressed (the owner, 2026-09-30): another column sorts ascending; the
 * column sorted ascending turns descending; descending turns ascending again. Never back to
 * "unsorted": the application decides the default order.
 */
export function nextSort(current: DataTableSort, column: string): DataTableSort {
  if (current?.column === column && current.direction === 'asc') {
    return { column, direction: 'desc' }
  }
  return { column, direction: 'asc' }
}

/** The header cell's aria-sort: only a sortable column has one. */
export function ariaSort(
  sort: DataTableSort,
  column: string,
  sortable: boolean,
): 'none' | 'ascending' | 'descending' | undefined {
  if (!sortable) return undefined
  if (sort?.column !== column) return 'none'
  return sort.direction === 'asc' ? 'ascending' : 'descending'
}
