import {
  createColumnHelper,
  rowSelectionFeature,
  tableFeatures,
  useTable,
  type RowData,
  type RowSelectionState,
  type Updater,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { Checkbox } from '../primitives/checkbox'
import { BUTTON_RESET, FOCUS_RING } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { BulkActionBar, type BulkAction } from './bulk-action-bar'
import { CompactIconButton } from './button'
import {
  ariaSort,
  formatCount,
  hasActiveFilters,
  nextSort,
  type DataTableFilters,
  type DataTableSort,
} from './data-table-logic'
import { DropdownMenu, type MenuEntry } from './dropdown-menu'
import { EmptyState, type EmptyAction } from './empty-state'
import { CursorPagination } from './navigation'

/*
 * DataTable (BUILD-PLAN P3.1), on TanStack Table and fully controlled: the table never fetches,
 * sorts, filters or sums. Rows arrive in the order to show; sort, filters, selection, paging and
 * totals arrive as props, and every change goes back through a callback.
 *
 * The previous Design System's values (the owner, 2026-09-30, docs/decisions.md "Table"):
 * - table font size sm (13px), cells 12px (sm) top and bottom and 16px (md) at the sides;
 * - the header row on surface.sunken; sticky when `stickyHeader` (inside the table's own scroll
 *   area, `maxHeight`);
 * - minimum column width 64px; below 640px the table scrolls sideways inside its container;
 * - rows highlight under the pointer only when they can be pressed;
 * - sortable headers: a plain button, label then a 13px icon 4px after it (ArrowUpDown, ArrowUp,
 *   ArrowDown), the label and icon in text.brand when sorted; aria-sort on sortable headers only;
 *   a column sorts ascending, then descending, then ascending again (never back to unsorted);
 * - the selection column with an xs (16px) checkbox; the header checkbox is indeterminate when
 *   some rows are selected; selected rows on surface.selected;
 * - loading: first load 5 skeleton bars (36px, radius sm, 8px apart, 16px around), the header
 *   stays; a refetch keeps the rows as they are with a 14px loader in the top end corner; never a
 *   translucent overlay;
 * - totals row: surface.sunken, semibold, a 1px border.strong line above it, sticky at the
 *   bottom while the table scrolls; values from the application, never computed;
 * - filters decide "nothing here yet" or "no rows match" (with "Clear filters").
 * Everything else is Mantine 9.6.2 Table (Table.css) with Liro meanings.
 */

/** One column. */
export interface DataTableColumn<Row extends RowData> {
  /** Unique within the table; the sort and the totals refer to it. */
  id: string
  /** The header's text, from the application. */
  header: ReactNode
  /** The cell of one row. Numbers and amounts through NumberText / MoneyText. */
  cell: (row: Row) => ReactNode
  /** Default 'start'. Numbers and amounts: 'end'. */
  align?: 'start' | 'center' | 'end'
  /** Tabular digits, for numbers, amounts and dates. */
  numeric?: boolean
  /** The header sorts by this column (the application sorts; the table never does). */
  sortable?: boolean
}

export interface DataTableProps<Row extends RowData> {
  /** The table's accessible name, from the application (e.g. the page's title). */
  label: string
  columns: readonly DataTableColumn<Row>[]
  /** The rows to show, in the order to show them. */
  rows: readonly Row[]
  /** A stable id per row: selection and keys use it. */
  getRowId: (row: Row) => string
  /** Names a row for assistive technology: "Select <label>", "Actions: <label>". */
  getRowLabel: (row: Row) => string

  sort?: DataTableSort
  onSortChange?: (sort: DataTableSort) => void

  /** Only read to tell "nothing here yet" from "no rows match"; cleared by "Clear filters". */
  filters?: DataTableFilters
  onFiltersChange?: (filters: DataTableFilters) => void

  hasPrevious?: boolean
  hasNext?: boolean
  onPrevious?: () => void
  onNext?: () => void
  /** The number of rows of the whole result, from the application. */
  count?: number
  /** False when the server stopped counting: the count is a lower bound. Default true. */
  countIsExact?: boolean
  /** Above it, "More than <threshold>". Default 10,000. */
  countThreshold?: number

  /** The totals, per column id, from the application; never computed. */
  totals?: Readonly<Record<string, ReactNode>>
  /** Shown in the first column of the totals row when that column has no total of its own. */
  totalsLabel?: ReactNode

  /** Pressing a row (pointer, or Enter on the focused row). The application decides what opens. */
  onRowClick?: (row: Row) => void
  /** The actions of one row, in a menu at the row's end. */
  rowActions?: (row: Row) => readonly MenuEntry[]

  /** The ids of the selected rows; with `onSelectionChange`, rows get a checkbox. */
  selection?: readonly string[]
  onSelectionChange?: (ids: string[]) => void
  /** Actions on the selection, in the BulkActionBar above the table. */
  bulkActions?: readonly BulkAction[]
  /** Offered by the BulkActionBar when the whole result (`count`) is larger than the selection. */
  onSelectAll?: () => void
  /** The application is running a bulk action. */
  bulkLoading?: boolean

  /** First load (no rows yet): skeleton bars. With rows: a small loader, the rows stay. */
  loading?: boolean
  /** Skeleton bars on the first load. Default 5. */
  skeletonRows?: number
  /** The first step offered by the "nothing here yet" state (e.g. create). */
  emptyAction?: EmptyAction
  /** A message under the table, e.g. that only the first rows are shown. From the application. */
  rowLimitMessage?: ReactNode
  /** An export button (the application runs the export as a job), above the table at the end. */
  exportAction?: ReactNode

  /** The header stays at the top while the rows scroll (inside `maxHeight`). */
  stickyHeader?: boolean
  /** The table scrolls inside this height (CSS length, e.g. "60vh"), so header and totals stay. */
  maxHeight?: string
  className?: string
}

const features = tableFeatures({ rowSelectionFeature })

const ALIGN = { start: 'text-start', center: 'text-center', end: 'text-end' } as const

/** Mantine Table cell padding: vertical sm (12px), horizontal md (16px). */
const CELL = 'px-4 py-3'

/** Keeps a press on a control inside a row (checkbox, menu, link) from pressing the row. */
function fromControl(event: MouseEvent | KeyboardEvent): boolean {
  const target = event.target as Element
  // Menus render in a portal; their events still bubble through the React tree to the row.
  if (!event.currentTarget.contains(target)) return true
  return target.closest('button, a, input, select, textarea, [role="checkbox"]') !== null
}

/**
 * A list of records: columns, sort, selection with bulk actions, row actions, totals, count and
 * paging by cursor. Controlled: the application fetches, sorts and filters on the server.
 */
export function DataTable<Row extends RowData>(props: DataTableProps<Row>) {
  const { messages } = useLiro()
  const {
    columns,
    rows,
    getRowId,
    getRowLabel,
    sort = null,
    onSortChange,
    selection,
    onSelectionChange,
  } = props
  const selectable = onSelectionChange !== undefined
  const hasActions = props.rowActions !== undefined
  const clickable = props.onRowClick !== undefined

  const rowSelection = useMemo<RowSelectionState>(
    () => Object.fromEntries((selection ?? []).map((id) => [id, true])),
    [selection],
  )
  const setRowSelection = (updater: Updater<RowSelectionState>) => {
    if (onSelectionChange === undefined) return
    const next = typeof updater === 'function' ? updater(rowSelection) : updater
    onSelectionChange(Object.keys(next).filter((id) => next[id] === true))
  }

  const tanstackColumns = useMemo(() => {
    const helper = createColumnHelper<typeof features, Row>()
    return columns.map((column) =>
      helper.display({ id: column.id, cell: (context) => column.cell(context.row.original) }),
    )
  }, [columns])

  const table = useTable({
    features,
    columns: tanstackColumns,
    data: rows,
    getRowId: (row) => getRowId(row),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: selectable,
  })

  // The scroll area takes the focus only while it scrolls, so the keyboard can scroll it (WCAG
  // 2.1.1; axe scrollable-region-focusable) and a table that fits adds no tab stop.
  const scroller = useRef<HTMLDivElement>(null)
  const [scrolls, setScrolls] = useState(false)
  useEffect(() => {
    const element = scroller.current
    if (element === null) return
    const measure = () => {
      setScrolls(
        element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth,
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    const content = element.firstElementChild
    if (content !== null) observer.observe(content)
    return () => {
      observer.disconnect()
    }
  }, [])

  const byId = new Map(columns.map((column) => [column.id, column]))
  const tableRows = table.getRowModel().rows
  const firstLoad = props.loading === true && rows.length === 0
  const refetching = props.loading === true && rows.length > 0
  const span = columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)
  const allSelected = tableRows.length > 0 && table.getIsAllRowsSelected()
  const someSelected = !allSelected && table.getIsSomeRowsSelected()

  const header = (column: DataTableColumn<Row>) => {
    const align = column.align ?? 'start'
    const sortable = column.sortable === true && onSortChange !== undefined
    const sorted = sort?.column === column.id ? sort.direction : null
    const Icon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown
    return (
      <th
        key={column.id}
        scope="col"
        aria-sort={ariaSort(sort, column.id, sortable)}
        className={cn(
          CELL,
          'min-w-16 border-0 border-b border-solid border-default bg-surface-sunken font-bold text-primary',
          ALIGN[align],
          props.stickyHeader === true && 'sticky top-0 z-10',
        )}
      >
        {sortable ? (
          <button
            type="button"
            onClick={() => {
              onSortChange(nextSort(sort, column.id))
            }}
            className={cn(
              BUTTON_RESET,
              'inline-flex cursor-pointer items-center gap-1 rounded-sm text-sm font-bold',
              sorted === null ? 'text-primary' : 'text-brand',
              FOCUS_RING,
            )}
          >
            <span>{column.header}</span>
            <Icon aria-hidden="true" className="size-[13px] shrink-0" />
          </button>
        ) : (
          column.header
        )}
      </th>
    )
  }

  const body = () => {
    if (firstLoad) {
      const count = props.skeletonRows ?? 5
      return (
        <tr>
          <td colSpan={span} className="p-4">
            <div className="flex flex-col gap-2">
              {Array.from({ length: count }, (_, index) => (
                <Skeleton key={index} className="h-9 rounded-sm" />
              ))}
            </div>
          </td>
        </tr>
      )
    }
    if (rows.length === 0) {
      const filtered = hasActiveFilters(props.filters)
      const { onFiltersChange } = props
      const clear =
        filtered && onFiltersChange !== undefined
          ? {
              label: messages['table.clearFilters'],
              onClick: () => {
                onFiltersChange({})
              },
            }
          : undefined
      const action = filtered ? clear : props.emptyAction
      return (
        <tr>
          <td colSpan={span} className="p-4">
            <EmptyState
              variant={filtered ? 'no-results' : 'empty'}
              title={filtered ? messages['table.noMatch'] : messages['table.noRows']}
              {...(action === undefined ? {} : { action })}
            />
          </td>
        </tr>
      )
    }
    return tableRows.map((row) => {
      const original = row.original
      const selected = row.getIsSelected()
      const label = getRowLabel(original)
      const press = () => props.onRowClick?.(original)
      return (
        <tr
          key={row.id}
          aria-selected={selectable ? selected : undefined}
          {...(clickable
            ? {
                tabIndex: 0,
                onClick: (event: MouseEvent) => {
                  if (!fromControl(event)) press()
                },
                onKeyDown: (event: KeyboardEvent) => {
                  if (event.key === 'Enter' && !fromControl(event)) {
                    event.preventDefault()
                    press()
                  }
                },
              }
            : {})}
          className={cn(
            'group/row',
            selected && 'bg-surface-selected',
            clickable &&
              'cursor-pointer outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
            clickable && !selected && 'hover:bg-surface-sunken',
          )}
        >
          {selectable && (
            <td className={cn(CELL, 'w-px border-0 border-b border-solid border-default')}>
              <Checkbox
                checked={selected}
                onCheckedChange={(value) => {
                  row.toggleSelected(value === true)
                }}
                aria-label={messages['table.selectRow'](label)}
                className="flex size-4 after:-inset-1 [&_svg]:size-2.5"
              />
            </td>
          )}
          {row.getAllCells().map((cell) => {
            const column = byId.get(cell.column.id)
            return (
              <td
                key={cell.id}
                className={cn(
                  CELL,
                  'min-w-16 border-0 border-b border-solid border-default',
                  ALIGN[column?.align ?? 'start'],
                  column?.numeric === true && 'tabular-nums',
                )}
              >
                <table.FlexRender cell={cell} />
              </td>
            )
          })}
          {hasActions && (
            <td className="w-px border-0 border-b border-solid border-default px-2 py-0 text-end">
              <DropdownMenu
                align="end"
                trigger={
                  <CompactIconButton intent="more" label={messages['table.rowActions'](label)} />
                }
                entries={props.rowActions?.(original) ?? []}
              />
            </td>
          )}
        </tr>
      )
    })
  }

  const totals = props.totals
  const footer =
    totals !== undefined && rows.length > 0 ? (
      <tfoot>
        <tr>
          {selectable && <td className={cn(CELL, 'bg-surface-sunken', TOTALS_LINE)} />}
          {columns.map((column, index) => {
            const value = totals[column.id] ?? (index === 0 ? props.totalsLabel : undefined) ?? null
            return (
              <td
                key={column.id}
                className={cn(
                  CELL,
                  'min-w-16 bg-surface-sunken font-semibold text-primary',
                  TOTALS_LINE,
                  ALIGN[column.align ?? 'start'],
                  column.numeric === true && 'tabular-nums',
                )}
              >
                {value}
              </td>
            )
          })}
          {hasActions && <td className={cn('bg-surface-sunken', TOTALS_LINE)} />}
        </tr>
      </tfoot>
    ) : null

  const paging = props.onNext !== undefined || props.onPrevious !== undefined
  const countText =
    props.count === undefined
      ? undefined
      : formatCount(messages, props.count, props.countIsExact ?? true, props.countThreshold)

  return (
    <div className={cn('flex min-w-0 flex-col gap-3 font-sans', props.className)}>
      {props.exportAction !== undefined && (
        <div className="flex justify-end">{props.exportAction}</div>
      )}
      {selectable && props.bulkActions !== undefined && (
        <BulkActionBar
          count={selection?.length ?? 0}
          {...(props.count !== undefined && props.countIsExact !== false
            ? { total: props.count }
            : {})}
          {...(props.onSelectAll === undefined ? {} : { onSelectAll: props.onSelectAll })}
          onClear={() => {
            onSelectionChange([])
          }}
          actions={props.bulkActions}
          {...(props.bulkLoading === undefined ? {} : { loading: props.bulkLoading })}
        />
      )}
      <div className="relative min-w-0">
        <div
          ref={scroller}
          {...(scrolls ? { tabIndex: 0, role: 'region', 'aria-label': props.label } : {})}
          className={cn(
            'overflow-auto',
            FOCUS_RING,
            'focus-visible:-outline-offset-2',
            // A row reached by the keyboard is scrolled clear of the sticky header and totals
            // (focus never hidden, WCAG 2.4.11): both are one 13px line with 12px above and below.
            props.stickyHeader === true && 'scroll-pt-12',
            props.totals !== undefined && 'scroll-pb-12',
          )}
          style={props.maxHeight === undefined ? undefined : { maxHeight: props.maxHeight }}
        >
          <table
            aria-label={props.label}
            aria-busy={props.loading === true ? true : undefined}
            className="w-full min-w-160 border-separate border-spacing-0 text-sm text-primary"
          >
            <thead>
              <tr>
                {selectable && (
                  <th
                    scope="col"
                    className={cn(
                      CELL,
                      'w-px border-0 border-b border-solid border-default bg-surface-sunken',
                      props.stickyHeader === true && 'sticky top-0 z-10',
                    )}
                  >
                    <Checkbox
                      checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                      disabled={tableRows.length === 0}
                      onCheckedChange={(value) => {
                        table.toggleAllRowsSelected(value === true)
                      }}
                      aria-label={messages['table.selectAll']}
                      className="flex size-4 after:-inset-1 [&_svg]:size-2.5"
                    />
                  </th>
                )}
                {columns.map(header)}
                {hasActions && (
                  <td
                    className={cn(
                      'w-px border-0 border-b border-solid border-default bg-surface-sunken',
                      props.stickyHeader === true && 'sticky top-0 z-10',
                    )}
                  />
                )}
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">{body()}</tbody>
            {footer}
          </table>
        </div>
        {refetching && (
          <span
            role="status"
            className="absolute end-0.5 top-0.5 z-20 flex size-3.5 items-center justify-center"
          >
            <span
              aria-hidden="true"
              className="box-border size-3.5 animate-liro-spin rounded-full border-[1.75px] border-solid border-brand border-s-transparent"
            />
            <span className="sr-only">{messages['field.loading']}</span>
          </span>
        )}
      </div>
      {props.rowLimitMessage !== undefined && (
        <div className="text-sm text-secondary">{props.rowLimitMessage}</div>
      )}
      {paging ? (
        <CursorPagination
          hasPrevious={props.hasPrevious === true}
          hasNext={props.hasNext === true}
          onPrevious={props.onPrevious ?? noop}
          onNext={props.onNext ?? noop}
          count={countText}
        />
      ) : (
        countText !== undefined && <div className="text-sm text-secondary">{countText}</div>
      )}
    </div>
  )
}

/** The totals row: the 1px border.strong line above it, and sticky at the bottom edge. */
const TOTALS_LINE = 'sticky bottom-0 z-10 border-0 border-t border-solid border-strong'

function noop() {
  return undefined
}
