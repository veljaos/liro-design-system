import {
  createColumnHelper,
  rowSelectionFeature,
  tableFeatures,
  useTable,
  type RowData,
  type RowSelectionState,
  type Updater,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { Checkbox } from '../primitives/checkbox'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { BulkActionBar, type BulkAction } from './bulk-action-bar'
import { CompactIconButton } from './button'
import { DataTableCard, fromControl } from './data-table-card'
import {
  ariaSort,
  clampWidth,
  formatCount,
  hasActiveFilters,
  MIN_COLUMN_WIDTH,
  nextSort,
  rowKeyAction,
  subtotalStart,
  type DataTableFilters,
  type DataTableSort,
} from './data-table-logic'
import { LINE_TYPE_TEXT, spansRow, type LineType } from './line-types'
import { ResizeHandle } from './data-table-resize'
import { DropdownMenu, type MenuEntry } from './dropdown-menu'
import { EmptyState, type EmptyAction } from './empty-state'
import { CursorPagination } from './navigation'
import { usePhone } from './use-phone'

/*
 * DataTable (BUILD-PLAN P3.1, P3.2), on TanStack Table and fully controlled: the table never
 * fetches, sorts, filters or sums. Rows arrive in the order to show; sort, filters, selection,
 * paging and totals arrive as props, and every change goes back through a callback.
 *
 * The previous Design System's values (the owner, 2026-09-30, docs/decisions.md "Table"):
 * - table font size sm (13px), cells 12px (sm) top and bottom and 16px (md) at the sides;
 * - the header row on surface.sunken; sticky when `stickyHeader`, always when virtualized;
 * - minimum column width 64px; below 640px the table scrolls sideways inside its container;
 *   resizable, the table is exactly as wide as its columns, so resizing one never moves another;
 * - rows highlight under the pointer only when they can be pressed;
 * - sortable headers: a plain button, label then a 13px icon 4px after it (ArrowUpDown, ArrowUp,
 *   ArrowDown), the label and icon in text.brand when sorted; aria-sort on sortable headers only;
 *   a column sorts ascending, then descending, then ascending again (never back to unsorted);
 * - the selection column with an xs (16px) checkbox; the header checkbox is indeterminate when
 *   some rows are selected; selected rows on surface.selected;
 * - loading: first load 5 skeleton bars (36px, radius sm, 8px apart, 16px around), the header
 *   stays; a refetch keeps the rows as they are with a 14px loader above the table at the end, in
 *   a slot always reserved (P3.6), and "Updating…" for screen readers; never a translucent
 *   overlay;
 * - totals row: surface.sunken, semibold, a 1px border.strong line above it, sticky at the
 *   bottom while the table scrolls; values from the application, never computed;
 * - filters decide "nothing here yet" or "no rows match" (with "Clear filters");
 * - on a phone (below 48em) the rows are cards, by real branching: only one layout is rendered
 *   (Appendix B.5); virtualized rows are 44px, cards estimated at 104px. Inside a card (`inCard`)
 *   they are not cards but one flat list divided by border.subtle lines (P4.9: no cards inside a
 *   card); in a card nothing is padded under the last row unless totals, a note, the count or the
 *   paging stand there.
 * Everything else is Mantine 9.6.2 Table (Table.css) with Liro meanings.
 */

/** One column. */
export interface DataTableColumn<Row extends RowData> {
  /** Unique within the table; the sort and the totals refer to it. */
  id: string
  /** The header's text, from the application. */
  header: ReactNode
  /**
   * The header as plain text, for the names of its resize controls. Default: `header` when it is
   * a string, else the id.
   */
  label?: string
  /** The cell of one row. Numbers and amounts through NumberText / MoneyText. */
  cell: (row: Row) => ReactNode
  /** Default 'start'. Numbers and amounts: 'end'. */
  align?: 'start' | 'center' | 'end'
  /** Tabular digits, for numbers, amounts and dates. */
  numeric?: boolean
  /** The header sorts by this column (the application sorts; the table never does). */
  sortable?: boolean
  /** With `resizable`: the starting width in pixels. Default: the width the content takes. */
  width?: number
  /** With `resizable`: the narrowest it can be made. Default 64px. */
  minWidth?: number
  /** With `resizable`: false keeps this column's width. Default true. */
  resizable?: boolean
}

/** Which parts of a row make its card on a phone. */
export interface DataTableMobile<Row extends RowData> {
  /** The card's title (one line). Default: `getRowLabel`. */
  title?: (row: Row) => ReactNode
  /** A second line under the title. */
  subtitle?: (row: Row) => ReactNode
  /** At the card's end, e.g. a StatusBadge. */
  badge?: (row: Row) => ReactNode
  /** The columns shown as label and value under the title, by id. Default: every column. */
  details?: readonly string[]
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

  /**
   * Pressing a row (pointer, or Space or Enter on the focused row). The application decides what
   * opens.
   */
  onRowClick?: (row: Row) => void
  /**
   * Enter on the focused row (or card) opens the record (its full page), while the pointer and
   * Space keep `onRowClick` (a quick preview, P4.3). Needs `onRowClick`.
   */
  onRowOpen?: (row: Row) => void
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
  /**
   * The table sits in a card (ListPage, P4.3): the table reaches the card's edges, the parts above
   * and below it (the loader and export slot, the bulk bar, the row-limit note, the count and
   * paging) keep 16px from them, and 12px stay under the paging. The loader slot stands right
   * above the table, without a gap (P4.4).
   */
  inCard?: boolean
  /** The table scrolls inside this height (CSS length, e.g. "60vh"), so header and totals stay. */
  maxHeight?: string

  /** The card of a row on a phone. */
  mobile?: DataTableMobile<Row>
  /** 'auto' (default): cards below 48em, the table above. 'table' or 'cards' forces one. */
  layout?: 'auto' | 'table' | 'cards'
  /**
   * Renders only the rows in view, for long lists: 44px rows, the header sticky. Needs
   * `maxHeight`, the height it scrolls in.
   */
  virtualize?: boolean
  /** Columns can be resized by pointer, keyboard and a popover (without dragging). */
  resizable?: boolean
  /** The widths after each resize, per column id, for the application to keep. */
  onColumnWidthsChange?: (widths: Record<string, number>) => void
  /**
   * The type of each row (P5.18: a document's read-only lines and a specification; the types of
   * `line-types.ts`), told apart by typography, never colour: a `heading` bold across the row; a
   * `text` line smaller and secondary across the row; a `subtotal` semibold with a rule above, its
   * label end-aligned before the amounts (the trailing end-aligned columns); `discount` and
   * `deduction` as normal lines (their negative amounts from the application). Headings, text
   * lines and subtotals have no checkbox, no menu and cannot be pressed. Default: every row a
   * `line`.
   */
  lineType?: (row: Row) => LineType
  /** The text of a heading, a text line and a subtotal's label. Default: the first column's cell. */
  lineText?: (row: Row) => ReactNode
  /**
   * What a line is ("Item", "Service", "Fixed asset"), from the application: small secondary text
   * under the first cell (P5.18; no colour).
   */
  lineKind?: (row: Row) => ReactNode
  className?: string
}

const features = tableFeatures({ rowSelectionFeature })

const ALIGN = { start: 'text-start', center: 'text-center', end: 'text-end' } as const

/** Mantine Table cell padding: vertical sm (12px), horizontal md (16px). */
const CELL = 'px-4 py-3'

/**
 * A selected row (P3.6, owner): besides its neutral background, a 3px bar in border.selected on
 * the row's start edge, drawn by the first cell, so selected differs from hovered by shape too.
 */
const SELECTED_ROW =
  "[&>td:first-child]:relative [&>td:first-child]:before:absolute [&>td:first-child]:before:inset-y-0 [&>td:first-child]:before:start-0 [&>td:first-child]:before:border-0 [&>td:first-child]:before:border-s-[3px] [&>td:first-child]:before:border-solid [&>td:first-child]:before:border-selected [&>td:first-child]:before:content-['']"

/** A virtualized row (owner) and the estimated card (owner). */
const ROW_HEIGHT = 44
const CARD_HEIGHT = 104

/** The selection column (16px checkbox, 16px each side) and the menu column (28px, 8px each side). */
const SELECT_WIDTH = 48
const ACTIONS_WIDTH = 44

/** The narrowest a column can be resized to. */
function columnMinWidth<Row extends RowData>(column: DataTableColumn<Row>): number {
  return column.minWidth ?? MIN_COLUMN_WIDTH
}

/** The column's name as text. */
function columnLabel<Row extends RowData>(column: DataTableColumn<Row>): string {
  return column.label ?? (typeof column.header === 'string' ? column.header : column.id)
}

/**
 * A list of records: columns, sort, selection with bulk actions, row actions, totals, count and
 * paging by cursor; cards on a phone; virtual rows for long lists; resizable columns.
 * Controlled: the application fetches, sorts and filters on the server.
 */
export function DataTable<Row extends RowData>(props: DataTableProps<Row>) {
  const { messages, format } = useLiro()
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
  const phone = usePhone()
  const layout = props.layout ?? 'auto'
  const cards = layout === 'cards' || (layout === 'auto' && phone)
  // Cards inside a card would be cards in a card (P4.9): in a card the rows are one flat list
  // with dividers instead.
  const flat = cards && props.inCard === true
  const virtualize = props.virtualize === true
  const sticky = props.stickyHeader === true || virtualize
  const resizable = props.resizable === true && !cards
  // Line types (P5.18): every row a normal line unless the application says otherwise.
  const typeOf = (row: Row): LineType => props.lineType?.(row) ?? 'line'

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
    // Headings, text lines and subtotals are not records: no checkbox (P5.18).
    enableRowSelection: selectable
      ? (row) => !spansRow(typeOf(row.original)) && typeOf(row.original) !== 'subtotal'
      : false,
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
  }, [cards])

  // Column widths, once resizing is on: the given widths, else the ones the content took in the
  // first (automatic) layout, measured before the browser paints. Then the layout is fixed and the
  // table exactly as wide as its columns.
  const [widths, setWidths] = useState<Record<string, number>>({})
  const widthsRef = useRef(widths)
  widthsRef.current = widths
  const headerCells = useRef(new Map<string, HTMLTableCellElement>())
  useLayoutEffect(() => {
    if (!resizable) return
    const missing = columns.filter((column) => widths[column.id] === undefined)
    if (missing.length === 0) return
    const next = { ...widths }
    for (const column of missing) {
      const measured = headerCells.current.get(column.id)?.getBoundingClientRect().width
      // Rounded up: a column a fraction of a pixel too narrow would end its text with "…".
      const natural = measured === undefined ? undefined : Math.ceil(measured)
      next[column.id] = clampWidth(
        column.width ?? natural ?? MIN_COLUMN_WIDTH,
        columnMinWidth(column),
      )
    }
    setWidths(next)
  }, [resizable, columns, widths])
  // The first measurement may run before the web fonts have loaded, with a narrower fallback
  // font: whenever fonts finish loading, measure again, until the user resizes a column.
  const userResized = useRef(false)
  useEffect(() => {
    if (!resizable) return
    const remeasure = () => {
      if (!userResized.current) setWidths({})
    }
    document.fonts.addEventListener('loadingdone', remeasure)
    return () => {
      document.fonts.removeEventListener('loadingdone', remeasure)
    }
  }, [resizable])
  const fixed = resizable && columns.every((column) => widths[column.id] !== undefined)
  // The measuring pass, before the first paint: every column at its natural one-line width, so a
  // long text in one column does not squeeze the others before they are measured.
  const measuring = resizable && !fixed
  const tableWidth = fixed
    ? columns.reduce((sum, column) => sum + (widths[column.id] ?? 0), 0) +
      (selectable ? SELECT_WIDTH : 0) +
      (hasActions ? ACTIONS_WIDTH : 0)
    : undefined

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scroller.current,
    estimateSize: () => (cards ? CARD_HEIGHT : ROW_HEIGHT),
    overscan: 8,
    enabled: virtualize,
    // Before the scroll area is measured (and on the server), assume a screen's height, so the
    // first rows are drawn at once instead of after a measurement.
    initialRect: { width: 0, height: 720 },
  })

  const byId = new Map(columns.map((column) => [column.id, column]))
  const tableRows = table.getRowModel().rows
  const firstLoad = props.loading === true && rows.length === 0
  const refetching = props.loading === true && rows.length > 0
  const span = columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)
  const allSelected = tableRows.length > 0 && table.getIsAllRowsSelected()
  const someSelected = !allSelected && table.getIsSomeRowsSelected()
  const filtered = hasActiveFilters(props.filters)
  // Cells cut what does not fit with an ellipsis: resized columns (owner) and 44px virtual rows.
  const oneLine = fixed || virtualize
  const textOf = (row: Row): ReactNode => props.lineText?.(row) ?? columns[0]?.cell(row) ?? null
  const amountsFrom = subtotalStart(columns.map((column) => column.align))
  const lineAt = (index: number): LineType => {
    const row = tableRows[index]
    return row === undefined ? 'line' : typeOf(row.original)
  }

  const skeleton = (
    <div className="flex flex-col gap-2 p-4">
      {Array.from({ length: props.skeletonRows ?? 5 }, (_, index) => (
        <Skeleton key={index} className="h-9 rounded-sm" />
      ))}
    </div>
  )

  const empty = () => {
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
      <EmptyState
        // A new element per state: the "Clear filters" button is not reused as the "nothing here
        // yet" action, so the focus never stays on a button whose action has changed.
        key={filtered ? 'no-match' : 'empty'}
        variant={filtered ? 'no-results' : 'empty'}
        title={filtered ? messages['table.noMatch'] : messages['table.noRows']}
        {...(action === undefined ? {} : { action })}
      />
    )
  }

  const onResize = (column: DataTableColumn<Row>, width: number) => {
    userResized.current = true
    setWidths((current) => ({ ...current, [column.id]: width }))
  }
  const onResizeEnd = () => {
    // After React has applied the last width.
    queueMicrotask(() => {
      props.onColumnWidthsChange?.({ ...widthsRef.current })
    })
  }

  const header = (column: DataTableColumn<Row>) => {
    const align = column.align ?? 'start'
    const sortable = column.sortable === true && onSortChange !== undefined
    const sorted = sort?.column === column.id ? sort.direction : null
    const Icon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown
    const width = widths[column.id]
    return (
      <th
        key={column.id}
        ref={(element) => {
          if (element === null) headerCells.current.delete(column.id)
          else headerCells.current.set(column.id, element)
        }}
        scope="col"
        aria-sort={ariaSort(sort, column.id, sortable)}
        className={cn(
          CELL,
          'group/header min-w-16 border-0 border-b border-solid border-default bg-surface-sunken font-bold text-primary',
          ALIGN[align],
          sticky ? 'sticky top-0 z-10' : resizable && 'relative',
          oneLine && 'truncate',
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
              'inline-flex max-w-full cursor-pointer items-center gap-1 rounded-sm text-sm font-bold text-primary',
              FOCUS_RING,
            )}
          >
            <span className={cn(TEXT_DIRECTION, oneLine && 'truncate')}>{column.header}</span>
            <Icon
              aria-hidden="true"
              className={cn('size-[13px] shrink-0', sorted === null && 'text-tertiary')}
            />
          </button>
        ) : (
          column.header
        )}
        {resizable && column.resizable !== false && width !== undefined && (
          <ResizeHandle
            label={columnLabel(column)}
            width={width}
            min={columnMinWidth(column)}
            onResize={(next) => {
              onResize(column, next)
            }}
            onResizeEnd={onResizeEnd}
          />
        )}
      </th>
    )
  }

  const tableRow = (index: number) => {
    const row = tableRows[index]
    if (row === undefined) return null
    const original = row.original
    const type = typeOf(original)
    // A subtotal draws its own rule above; the row before it has no line of its own (one line).
    const next = tableRows[index + 1]
    const rowLine =
      next !== undefined && typeOf(next.original) === 'subtotal'
        ? 'border-0'
        : 'border-0 border-b border-solid border-default'
    if (spansRow(type)) {
      return (
        <tr
          key={row.id}
          data-line={type}
          aria-rowindex={virtualize ? index + 2 : undefined}
          className={virtualize ? 'h-11' : undefined}
        >
          <td
            colSpan={span}
            className={cn(
              CELL,
              rowLine,
              LINE_TYPE_TEXT[type],
              virtualize && 'py-0',
              oneLine && 'truncate',
            )}
          >
            <span className={TEXT_ISOLATE}>{textOf(original)}</span>
          </td>
        </tr>
      )
    }
    if (type === 'subtotal') {
      const cellLine = cn(SUBTOTAL_LINE, rowLine === 'border-0' ? 'border-b-0' : 'border-b')
      return (
        <tr
          key={row.id}
          data-line={type}
          aria-rowindex={virtualize ? index + 2 : undefined}
          className={virtualize ? 'h-11' : undefined}
        >
          <td
            colSpan={amountsFrom + (selectable ? 1 : 0)}
            className={cn(
              CELL,
              cellLine,
              'text-end',
              LINE_TYPE_TEXT.subtotal,
              virtualize && 'py-0',
              oneLine && 'truncate',
            )}
          >
            <span className={TEXT_ISOLATE}>{textOf(original)}</span>
          </td>
          {columns.slice(amountsFrom).map((column) => (
            <td
              key={column.id}
              className={cn(
                CELL,
                cellLine,
                'min-w-16',
                ALIGN[column.align ?? 'start'],
                LINE_TYPE_TEXT.subtotal,
                column.numeric === true && 'tabular-nums',
                virtualize && 'py-0',
                oneLine && 'truncate',
              )}
            >
              <span className={TEXT_ISOLATE}>{column.cell(original)}</span>
            </td>
          ))}
          {hasActions && <td className={cellLine} />}
        </tr>
      )
    }
    const kind = props.lineKind?.(original)
    const selected = row.getIsSelected()
    const label = getRowLabel(original)
    const press = () => props.onRowClick?.(original)
    return (
      <tr
        key={row.id}
        {...(type === 'line' ? {} : { 'data-line': type })}
        aria-selected={selectable ? selected : undefined}
        // The selection's own text colours (P4.3): tokens.css lightens the few that fail on it.
        data-liro-surface={selected ? 'selected' : undefined}
        aria-rowindex={virtualize ? index + 2 : undefined}
        {...(clickable
          ? {
              tabIndex: 0,
              onClick: (event: MouseEvent) => {
                if (!fromControl(event)) press()
              },
              onKeyDown: (event: KeyboardEvent) => {
                if (fromControl(event)) return
                const action = rowKeyAction(event.key, props.onRowOpen !== undefined)
                if (action === null) return
                event.preventDefault()
                if (action === 'open') props.onRowOpen?.(original)
                else press()
              },
            }
          : {})}
        className={cn(
          virtualize && 'h-11',
          selected && [SELECTED_ROW, 'bg-surface-selected'],
          clickable &&
            'cursor-pointer outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
          clickable && !selected && 'hover:bg-surface-sunken',
        )}
      >
        {selectable && (
          <td className={cn(CELL, 'w-px', rowLine, virtualize && 'py-0')}>
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
        {row.getAllCells().map((cell, cellIndex) => {
          const column = byId.get(cell.column.id)
          return (
            <td
              key={cell.id}
              className={cn(
                CELL,
                'min-w-16',
                rowLine,
                ALIGN[column?.align ?? 'start'],
                column?.numeric === true && 'tabular-nums',
                virtualize && 'py-0',
                oneLine && 'truncate',
              )}
            >
              {/* The application's content takes its direction from itself; the cell keeps its side. */}
              <span className={TEXT_ISOLATE}>
                <table.FlexRender cell={cell} />
              </span>
              {/* What the line is (P5.18): small secondary text under the first cell, no colour. */}
              {cellIndex === 0 && kind !== undefined && kind !== null && (
                <span
                  data-slot="line-kind"
                  className={cn('block text-xs text-secondary', TEXT_DIRECTION)}
                >
                  {kind}
                </span>
              )}
            </td>
          )
        })}
        {hasActions && (
          <td className={cn('w-px px-2 py-0 text-end', rowLine)}>
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
  }

  const body = () => {
    if (firstLoad) {
      return (
        <tr>
          <td colSpan={span} className="p-0">
            {skeleton}
          </td>
        </tr>
      )
    }
    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={span} className="p-4">
            {empty()}
          </td>
        </tr>
      )
    }
    if (!virtualize) return tableRows.map((_, index) => tableRow(index))
    // Only the rows in view, between two spacer rows that keep the scroll height.
    const items = virtualizer.getVirtualItems()
    const before = items[0]?.start ?? 0
    const after = virtualizer.getTotalSize() - (items.at(-1)?.end ?? 0)
    return (
      <>
        {before > 0 && (
          <tr aria-hidden="true" style={{ height: before }}>
            <td colSpan={span} className="border-0 p-0" />
          </tr>
        )}
        {items.map((item) => tableRow(item.index))}
        {after > 0 && (
          <tr aria-hidden="true" style={{ height: after }}>
            <td colSpan={span} className="border-0 p-0" />
          </tr>
        )}
      </>
    )
  }

  const totals = props.totals
  const footer =
    totals !== undefined && rows.length > 0 ? (
      <tfoot>
        <tr aria-rowindex={virtualize ? rows.length + 2 : undefined}>
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
                  oneLine && 'truncate',
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

  const detailColumns = (props.mobile?.details ?? columns.map((column) => column.id))
    .map((id) => byId.get(id))
    .filter((column) => column !== undefined)

  const card = (index: number) => {
    const row = tableRows[index]
    if (row === undefined) return null
    const original = row.original
    const type = typeOf(original)
    // Phones keep the types by typography (P5.18): a heading and a text line are a line of text,
    // a subtotal its label and amounts, semibold, under a rule (the list item draws it).
    if (spansRow(type)) {
      return (
        <div
          data-line={type}
          className={cn(
            flat ? 'px-4 py-3' : 'py-1',
            LINE_TYPE_TEXT[type],
            'break-words',
            TEXT_DIRECTION,
          )}
        >
          {textOf(original)}
        </div>
      )
    }
    if (type === 'subtotal') {
      return (
        <div
          data-line={type}
          className={cn(
            'flex flex-col gap-0.5',
            LINE_TYPE_TEXT.subtotal,
            flat ? 'px-4 py-3' : 'border-0 border-t border-solid border-strong px-3 py-3',
          )}
        >
          <span className={cn('break-words', TEXT_DIRECTION)}>{textOf(original)}</span>
          <dl className="m-0 flex flex-col gap-0.5">
            {columns.slice(amountsFrom).map((column) => (
              <div key={column.id} className="flex items-baseline justify-between gap-4">
                <dt className={cn('text-xs font-normal text-secondary', TEXT_DIRECTION)}>
                  {column.header}
                </dt>
                <dd className="m-0 text-end tabular-nums">{column.cell(original)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )
    }
    const label = getRowLabel(original)
    const kind = props.lineKind?.(original)
    const { mobile, rowActions, onRowClick, onRowOpen } = props
    // What the line is stands under the title when the card has no subtitle of its own (P5.18).
    const subtitle = mobile?.subtitle?.(original) ?? (kind === null ? undefined : kind)
    const badge = mobile?.badge?.(original)
    return (
      <DataTableCard
        title={mobile?.title?.(original) ?? label}
        {...(subtitle === undefined ? {} : { subtitle })}
        {...(badge === undefined ? {} : { badge })}
        details={detailColumns.map((column) => ({
          key: column.id,
          label: column.header,
          value: column.cell(original),
        }))}
        selected={row.getIsSelected()}
        flat={flat}
        {...(selectable
          ? {
              onSelectedChange: (value: boolean) => {
                row.toggleSelected(value)
              },
            }
          : {})}
        selectLabel={messages['table.selectRow'](label)}
        {...(rowActions === undefined ? {} : { actions: rowActions(original) })}
        actionsLabel={messages['table.rowActions'](label)}
        {...(onRowClick === undefined
          ? {}
          : {
              onPress: () => {
                onRowClick(original)
              },
            })}
        {...(onRowOpen === undefined
          ? {}
          : {
              onOpen: () => {
                onRowOpen(original)
              },
            })}
      />
    )
  }

  const cardList = () => {
    if (firstLoad) return skeleton
    if (rows.length === 0) return <div className="p-4">{empty()}</div>
    if (!virtualize) {
      return (
        <ul
          aria-label={props.label}
          className={cn('m-0 flex list-none flex-col p-0', flat ? FLAT_DIVIDERS : 'gap-4')}
        >
          {tableRows.map((row, index) => (
            <li key={row.id} {...lineAttribute(typeOf(row.original))}>
              {card(index)}
            </li>
          ))}
        </ul>
      )
    }
    // Cards differ in height: each is measured once drawn; the gap is part of its item.
    return (
      <ul
        aria-label={props.label}
        className="relative m-0 list-none p-0"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((item) => (
          <li
            key={tableRows[item.index]?.id ?? item.index}
            data-index={item.index}
            {...lineAttribute(lineAt(item.index))}
            ref={virtualizer.measureElement}
            aria-setsize={rows.length}
            aria-posinset={item.index + 1}
            className={cn(
              'absolute inset-x-0 top-0',
              flat ? item.index > 0 && 'border-0 border-t border-solid border-subtle' : 'pb-4',
              // A subtotal's rule above it (P5.18), in place of the divider.
              flat &&
                lineAt(item.index) === 'subtotal' &&
                'border-0 border-t border-solid border-strong',
            )}
            style={{ transform: `translateY(${String(item.start)}px)` }}
          >
            {card(item.index)}
          </li>
        ))}
      </ul>
    )
  }

  const cardTotals =
    cards && totals !== undefined && rows.length > 0 ? (
      <div
        {...(flat ? { 'data-flat': '' } : {})}
        className={cn(
          'flex flex-col gap-0.5 border-0 border-t border-solid border-strong bg-surface-sunken text-xs font-semibold text-primary',
          flat ? 'px-4 py-3' : 'rounded-md p-3',
        )}
      >
        {props.totalsLabel !== undefined && <div className="text-sm">{props.totalsLabel}</div>}
        {columns
          .filter((column) => totals[column.id] !== undefined)
          .map((column) => (
            <div key={column.id} className="flex items-baseline justify-between gap-4">
              <span className={TEXT_DIRECTION}>{column.header}</span>
              <span className="text-end tabular-nums">{totals[column.id]}</span>
            </div>
          ))}
      </div>
    ) : null

  const paging = props.onNext !== undefined || props.onPrevious !== undefined
  const countText =
    props.count === undefined
      ? undefined
      : formatCount(messages, format, props.count, props.countIsExact ?? true, props.countThreshold)

  const scrollStyle: CSSProperties | undefined =
    props.maxHeight === undefined ? undefined : { maxHeight: props.maxHeight }

  const edge = props.inCard === true ? 'px-4' : undefined
  const under =
    cardTotals !== null || props.rowLimitMessage !== undefined || paging || countText !== undefined

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col font-sans',
        // In a card the reserved loader slot sits right above the table, without a gap of its
        // own (the card's header or the FilterBar already gives the room); the parts under the
        // table keep 12px from it.
        // Nothing under the last row (P4.9): the card ends with it, without 12px of white; the
        // flat phone list and its totals follow the parts above them directly.
        props.inCard === true
          ? cn('[&>*+*:not(:has(table)):not([data-flat])]:mt-3', under && 'pb-3')
          : 'gap-3',
        props.className,
      )}
    >
      {/*
        Above the table at the end (P3.6, owner; the old system kept it at the top): the refetch
        loader in a slot that is always reserved, so showing or hiding it never moves the table,
        then the export slot. The slot is a polite live region: "Updating…" is announced when a
        refetch starts.
      */}
      {/*
        In a card (P4.5): the slot only where a refetch can happen (the application passes
        `loading`) or an export slot stands, so a document's lines start at the card's top.
      */}
      {(props.inCard !== true ||
        props.loading !== undefined ||
        props.exportAction !== undefined) && (
        <div className={cn('flex min-h-3.5 flex-wrap items-center justify-end gap-3', edge)}>
          <span
            role="status"
            aria-live="polite"
            data-slot="refetch-loader"
            className="flex size-3.5 shrink-0 items-center justify-center"
          >
            {refetching && (
              <>
                <span
                  aria-hidden="true"
                  className="box-border size-3.5 animate-liro-spin rounded-full border-[1.75px] border-solid border-brand border-s-transparent motion-reduce:animate-none"
                />
                <span className="sr-only">{messages['table.updating']}</span>
              </>
            )}
          </span>
          {props.exportAction}
        </div>
      )}
      {selectable && props.bulkActions !== undefined && (
        <div className={cn('empty:hidden', edge)}>
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
        </div>
      )}
      <div className="relative min-w-0" {...(flat ? { 'data-flat': '' } : {})}>
        <div
          ref={scroller}
          {...(scrolls ? { tabIndex: 0, role: 'region', 'aria-label': props.label } : {})}
          aria-busy={cards && props.loading === true ? true : undefined}
          className={cn(
            'overflow-auto',
            // In a card, phone cards stand 16px inside its edges, as the rows' text does.
            cards && !flat && edge,
            FOCUS_RING,
            'focus-visible:-outline-offset-2',
            // A row reached by the keyboard is scrolled clear of the sticky header and totals
            // (focus never hidden, WCAG 2.4.11): both are one 13px line with 12px above and below.
            !cards && sticky && 'scroll-pt-12',
            !cards && props.totals !== undefined && 'scroll-pb-12',
          )}
          style={scrollStyle}
        >
          {cards ? (
            cardList()
          ) : (
            <table
              aria-label={props.label}
              aria-busy={props.loading === true ? true : undefined}
              aria-rowcount={virtualize ? rows.length + 1 + (footer === null ? 0 : 1) : undefined}
              className={cn(
                'border-separate border-spacing-0 text-sm text-primary',
                fixed
                  ? 'table-fixed'
                  : measuring
                    ? 'w-max [&_td]:text-nowrap [&_th]:text-nowrap'
                    : 'w-full min-w-160',
              )}
              style={tableWidth === undefined ? undefined : { width: tableWidth }}
            >
              {fixed && (
                <colgroup>
                  {selectable && <col style={{ width: SELECT_WIDTH }} />}
                  {columns.map((column) => (
                    <col key={column.id} style={{ width: widths[column.id] }} />
                  ))}
                  {hasActions && <col style={{ width: ACTIONS_WIDTH }} />}
                </colgroup>
              )}
              <thead>
                <tr aria-rowindex={virtualize ? 1 : undefined}>
                  {selectable && (
                    <th
                      scope="col"
                      className={cn(
                        CELL,
                        'w-px border-0 border-b border-solid border-default bg-surface-sunken',
                        sticky && 'sticky top-0 z-10',
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
                        sticky && 'sticky top-0 z-10',
                      )}
                    />
                  )}
                </tr>
              </thead>
              <tbody className="[&>tr:last-child>td]:border-b-0">{body()}</tbody>
              {footer}
            </table>
          )}
        </div>
      </div>
      {cardTotals}
      {props.rowLimitMessage !== undefined && (
        <div className={cn('text-sm text-secondary', TEXT_DIRECTION, edge)}>
          {props.rowLimitMessage}
        </div>
      )}
      {paging ? (
        <div className={edge}>
          <CursorPagination
            hasPrevious={props.hasPrevious === true}
            hasNext={props.hasNext === true}
            onPrevious={props.onPrevious ?? noop}
            onNext={props.onNext ?? noop}
            count={countText}
          />
        </div>
      ) : (
        countText !== undefined && (
          <div className={cn('text-sm text-secondary', TEXT_DIRECTION, edge)}>{countText}</div>
        )
      )}
    </div>
  )
}

/**
 * The dividers between the rows of the flat phone list in a card (P4.9); a subtotal has the
 * border.strong rule above it instead (P5.18).
 */
const FLAT_DIVIDERS =
  '[&>li+li]:border-0 [&>li+li]:border-t [&>li+li]:border-solid [&>li+li]:border-subtle [&>li[data-line=subtotal]]:border-0 [&>li[data-line=subtotal]]:border-t [&>li[data-line=subtotal]]:border-solid [&>li[data-line=subtotal]]:border-strong'

/** Marks a list item with its line type (P5.18); a normal line carries nothing. */
function lineAttribute(type: LineType): { 'data-line'?: LineType } {
  return type === 'line' ? {} : { 'data-line': type }
}

/**
 * A subtotal's cells (P5.18): the rule above in border.strong (line-types' SUBTOTAL_RULE), the
 * row line below as every row's; the bottom width is set by the row.
 */
const SUBTOTAL_LINE = 'border-0 border-t border-solid border-t-strong border-b-default'

/** The totals row: the 1px border.strong line above it, and sticky at the bottom edge. */
const TOTALS_LINE = 'sticky bottom-0 z-10 border-0 border-t border-solid border-strong'

function noop() {
  return undefined
}
