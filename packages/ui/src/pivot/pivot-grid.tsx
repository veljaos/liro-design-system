import {
  createColumnHelper,
  createExpandedRowModel,
  rowExpandingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type ExpandedState,
  type Header,
  type Updater,
} from '@tanstack/react-table'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import {
  STICKY_CLEARANCE,
  STICKY_HEAD,
  STICKY_START,
  useStickyHead,
} from '../components/sticky-head'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import {
  pivotKeyTarget,
  pivotLeaves,
  pivotRowPaths,
  type PivotCellRef,
  type PivotColumn,
  type PivotLeaf,
  type PivotPosition,
  type PivotResult,
  type PivotRow,
} from './pivot-logic'

/*
 * The pivot's grid, built on TanStack Table: the application's column tree becomes nested
 * column groups, whose header groups give each header cell its column and row span (two or more
 * header rows: "Jul 2026" over "Amount" and "Documents"; a total column spanning them); the rows
 * are a tree (`getSubRows`) drawn through the expanded row model from the open groups. TanStack's
 * grouping and aggregation are not used: every figure is the application's.
 * - A WAI-ARIA treegrid, one cell in the tab order: the arrows move cell by cell (mirrored in right
 *   to left), Home / End, Ctrl+Home / End, Page Up / Down; Enter or Space on a group's row header
 *   opens or closes it (`aria-expanded` on the row), on a figure reports it (`onDrillDown`). A
 *   press does the same.
 * - Sticky: the header rows below the shell while the page scrolls (`STICKY_HEAD` on the
 *   `thead`, the rows move as one), the row headers at the start while the grid scrolls sideways
 *   (`STICKY_START`, opaque), the corner both.
 * - Subtotals: a group's own row (semibold). Totals: a total column (`total`) and the grand total
 *   row are semibold on the sunken surface, the grand total under a strong line, as DataTable's.
 *   Figures are tabular and end-aligned, null is "—".
 */

const features = tableFeatures({ rowExpandingFeature, expandedRowModel: createExpandedRowModel() })

/** The row headers' column. */
const ROW_HEADER = '__rows'
const GROUP_PREFIX = 'g:'

const HEADER_CELL =
  'border-0 border-b border-solid border-default bg-surface-sunken px-3 py-2 align-bottom text-xs font-semibold text-secondary'
const BODY_CELL = 'border-0 border-b border-solid border-subtle px-3 py-2 align-top'
const CELL_FOCUS =
  'outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-focus'

/** The indent of a row header by its depth. */
const INDENT = ['', 'ps-5', 'ps-10', 'ps-15', 'ps-20'] as const
const indent = (depth: number) => INDENT[Math.min(depth, INDENT.length - 1)]

export interface PivotGridProps {
  label: string
  result: PivotResult
  /** The open groups' keys. */
  expanded: readonly string[]
  onToggle: (key: string) => void
  onDrillDown: ((cell: PivotCellRef) => void) | undefined
  /** The row fields' and column fields' names for the corner. */
  rowFields: string
  columnFields: string
  busy: boolean
  phone: boolean
}

/** A figure through the provider's `format`; null is "—". */
function Figure({ leaf, value }: { leaf: PivotLeaf; value: string | null | undefined }) {
  const { format } = useLiro()
  if (value === null || value === undefined || value === '') {
    return <span className={cn('text-tertiary', TEXT_ISOLATE)}>—</span>
  }
  const options = leaf.decimals === undefined ? {} : { decimals: leaf.decimals }
  const text =
    leaf.kind === 'money'
      ? format.money(value, leaf.currency ?? '', options)
      : leaf.kind === 'percent'
        ? format.percent(value, options)
        : format.number(value, options)
  return <bdi className="whitespace-nowrap tabular-nums">{text}</bdi>
}

/** The column tree as TanStack column groups; the row headers' column first. */
function columnDefs(columns: readonly PivotColumn[]) {
  const helper = createColumnHelper<typeof features, PivotRow>()
  const toDef = (column: PivotColumn): ColumnDef<typeof features, PivotRow> =>
    column.children !== undefined && column.children.length > 0
      ? helper.group({
          id: `${GROUP_PREFIX}${column.key}`,
          header: column.label,
          columns: column.children.map(toDef),
        })
      : helper.display({ id: column.key, header: column.label })
  return [helper.display({ id: ROW_HEADER, header: '' }), ...columns.map(toDef)]
}

/** Every column of the tree by its TanStack id. */
function columnsById(columns: readonly PivotColumn[]): Map<string, PivotColumn> {
  const byId = new Map<string, PivotColumn>()
  const walk = (list: readonly PivotColumn[]) => {
    for (const column of list) {
      if (column.children !== undefined && column.children.length > 0) {
        byId.set(`${GROUP_PREFIX}${column.key}`, column)
        walk(column.children)
      } else {
        byId.set(column.key, column)
      }
    }
  }
  walk(columns)
  return byId
}

/** Whether a column or a group above it is a total. */
function isTotal(column: PivotColumn | undefined): boolean {
  return column?.total === true
}

export function PivotGrid(props: PivotGridProps) {
  const { messages, direction } = useLiro()
  const { result } = props
  const hintId = useId()
  const leaves = useMemo(() => pivotLeaves(result.columns), [result.columns])
  const byId = useMemo(() => columnsById(result.columns), [result.columns])
  const paths = useMemo(() => pivotRowPaths(result.rows), [result.rows])
  const columns = useMemo(() => columnDefs(result.columns), [result.columns])
  const expanded = useMemo<ExpandedState>(
    () => Object.fromEntries(props.expanded.map((key) => [key, true])),
    [props.expanded],
  )
  const onExpandedChange = (updater: Updater<ExpandedState>) => {
    const next = typeof updater === 'function' ? updater(expanded) : updater
    if (next === true) return
    for (const key of new Set([...Object.keys(next), ...props.expanded])) {
      if ((next[key] === true) !== props.expanded.includes(key)) props.onToggle(key)
    }
  }
  const table = useTable({
    features,
    columns,
    data: result.rows,
    getRowId: (row) => row.key,
    getSubRows: (row) => (row.children as PivotRow[] | undefined) ?? [],
    state: { expanded },
    onExpandedChange,
    // The open groups are the application's (or Pivot's): never reset when a new result arrives.
    autoResetExpanded: false,
  })
  const bodyRows = table.getRowModel().rows
  // Every drawn row in the grid's order: the body rows, then the grand total.
  const drawn: { row: PivotRow; depth: number; group: boolean; open: boolean }[] = [
    ...bodyRows.map((row) => ({
      row: row.original,
      depth: row.depth,
      group: row.getCanExpand(),
      open: row.getIsExpanded(),
    })),
    ...(result.total === undefined
      ? []
      : [{ row: result.total, depth: 0, group: false, open: false }]),
  ]
  const size = { rows: drawn.length, columns: leaves.length + 1 }

  const [active, setActive] = useState<PivotPosition>({ row: 0, column: 0 })
  const current = {
    row: Math.min(active.row, Math.max(0, size.rows - 1)),
    column: Math.min(active.column, Math.max(0, size.columns - 1)),
  }
  const wrapper = useRef<HTMLDivElement>(null)
  // The header rows stay below the shell while the page scrolls.
  useStickyHead(wrapper)
  const pendingFocus = useRef(false)
  useEffect(() => {
    if (!pendingFocus.current) return
    pendingFocus.current = false
    wrapper.current
      ?.querySelector<HTMLElement>(`[data-pos="${String(current.row)}:${String(current.column)}"]`)
      ?.focus()
  })

  const drillable = props.onDrillDown !== undefined
  const valueAt = (at: PivotPosition) => {
    const line = drawn[at.row]
    const leaf = leaves[at.column - 1]
    if (line === undefined || leaf === undefined) return null
    return line.row.cells[leaf.column.key] ?? null
  }
  /** Opens or closes a group, or reports a figure, at a cell. */
  const act = (at: PivotPosition): boolean => {
    const line = drawn[at.row]
    if (line === undefined) return false
    if (at.column === 0) {
      if (!line.group) return false
      props.onToggle(line.row.key)
      return true
    }
    const leaf = leaves[at.column - 1]
    const value = valueAt(at)
    if (props.onDrillDown === undefined || leaf === undefined || value === null || value === '') {
      return false
    }
    const total = line.row === result.total
    props.onDrillDown({
      rowKey: line.row.key,
      columnKey: leaf.column.key,
      rowPath: total ? [line.row.label] : (paths.get(line.row.key) ?? [line.row.label]),
      columnPath: leaf.path,
      value,
    })
    return true
  }
  const positionOf = (target: EventTarget): PivotPosition | null => {
    if (!(target instanceof Element)) return null
    const cell = target.closest<HTMLElement>('[data-pos]')
    const [row, column] = (cell?.dataset.pos ?? '').split(':').map(Number)
    if (row === undefined || column === undefined || Number.isNaN(row) || Number.isNaN(column)) {
      return null
    }
    return { row, column }
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const at = positionOf(event.target)
    if (at === null) return
    if (event.key === 'Enter' || event.key === ' ') {
      if (act(at)) event.preventDefault()
      return
    }
    const next = pivotKeyTarget(event.key, at, size, {
      rtl: direction === 'rtl',
      ctrl: event.ctrlKey || event.metaKey,
    })
    if (next === null) return
    event.preventDefault()
    if (next.row === at.row && next.column === at.column) return
    pendingFocus.current = true
    setActive(next)
  }
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const at = positionOf(event.target)
    if (at === null) return
    setActive(at)
    act(at)
  }
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const at = positionOf(event.target)
    if (at !== null && (at.row !== current.row || at.column !== current.column)) setActive(at)
  }
  const focusable = (row: number, column: number) => ({
    'data-pos': `${String(row)}:${String(column)}`,
    tabIndex: row === current.row && column === current.column ? 0 : -1,
  })

  const headerCell = (header: Header<typeof features, PivotRow>) => {
    const id = header.column.id
    if (id === ROW_HEADER) {
      return (
        <th
          key={header.id}
          role="columnheader"
          rowSpan={Math.max(1, header.rowSpan)}
          aria-rowspan={Math.max(1, header.rowSpan)}
          data-sticky-start=""
          className={cn(
            HEADER_CELL,
            STICKY_START,
            'z-20 text-start',
            props.phone ? 'min-w-36' : 'min-w-56',
          )}
        >
          <span className="flex flex-col gap-0.5">
            {props.columnFields !== '' && (
              <span className={cn('font-regular text-tertiary', TEXT_DIRECTION)}>
                {props.columnFields}
              </span>
            )}
            <span className={TEXT_DIRECTION}>{props.rowFields}</span>
          </span>
        </th>
      )
    }
    const column = byId.get(id)
    const group = header.subHeaders.length > 0 && !header.isPlaceholder
    return (
      <th
        key={header.id}
        role="columnheader"
        colSpan={header.colSpan}
        rowSpan={Math.max(1, header.rowSpan)}
        aria-colspan={header.colSpan}
        aria-rowspan={Math.max(1, header.rowSpan)}
        data-total={isTotal(column) ? '' : undefined}
        className={cn(
          HEADER_CELL,
          'border-s',
          group ? 'text-center' : 'min-w-28 text-end',
          isTotal(column) && 'text-primary',
        )}
      >
        <span className={TEXT_ISOLATE}>{column?.label}</span>
      </th>
    )
  }

  return (
    <>
      <p id={hintId} className="sr-only">
        {drillable ? messages['pivot.drillHint'] : messages['pivot.gridHint']}
      </p>
      {/* The treegrid is the scroll region; the table inside only lays the cells out (its rows
          and cells carry the grid's roles), so the native column and row spans draw the headers. */}
      <div
        ref={wrapper}
        role="treegrid"
        // Focusable only through its cells (one in the tab order); never itself in the order.
        tabIndex={-1}
        aria-label={props.label}
        aria-describedby={hintId}
        aria-readonly="true"
        aria-busy={props.busy || undefined}
        onKeyDown={onKeyDown}
        onClick={onClick}
        onFocus={onFocus}
        data-slot="pivot-grid"
        className={cn('w-full min-w-0 overflow-x-auto outline-none', STICKY_CLEARANCE)}
      >
        <table
          role="presentation"
          className="w-full border-separate border-spacing-0 font-sans text-sm text-primary"
        >
          <thead data-sticky-head="" className={cn('bg-surface-sunken', STICKY_HEAD, 'z-10')}>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} role="row">
                {group.headers.filter((header) => header.rowSpan !== 0).map(headerCell)}
              </tr>
            ))}
          </thead>
          <tbody className="[&>tr:last-child>*]:border-b-0">
            {drawn.map((line, rowIndex) => {
              if (line.row === result.total) return null
              return (
                <tr
                  key={line.row.key}
                  role="row"
                  aria-level={line.depth + 1}
                  aria-expanded={line.group ? line.open : undefined}
                  data-group={line.group ? '' : undefined}
                >
                  <th
                    role="rowheader"
                    {...focusable(rowIndex, 0)}
                    className={cn(
                      BODY_CELL,
                      STICKY_START,
                      CELL_FOCUS,
                      'z-[5] bg-surface-raised text-start',
                      line.group ? 'cursor-pointer font-semibold' : 'font-regular',
                    )}
                  >
                    <span className={cn('flex items-start gap-1', indent(line.depth))}>
                      {line.group ? (
                        <span
                          aria-hidden="true"
                          className="-my-0.5 inline-flex size-6 shrink-0 items-center justify-center text-secondary"
                        >
                          {line.open ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4 rtl:-scale-x-100" />
                          )}
                        </span>
                      ) : (
                        <span aria-hidden="true" className="w-6 shrink-0" />
                      )}
                      <span className={cn('min-w-0 break-words', TEXT_DIRECTION)}>
                        {line.row.label}
                      </span>
                    </span>
                  </th>
                  {leaves.map((leaf, index) => {
                    const value = line.row.cells[leaf.column.key]
                    const opens = drillable && value !== null && value !== undefined && value !== ''
                    return (
                      <td
                        key={leaf.column.key}
                        role="gridcell"
                        {...focusable(rowIndex, index + 1)}
                        data-total={leaf.total ? '' : undefined}
                        className={cn(
                          BODY_CELL,
                          CELL_FOCUS,
                          'border-s text-end whitespace-nowrap',
                          line.group && 'font-semibold',
                          leaf.total && 'bg-surface-sunken font-semibold',
                          opens &&
                            'cursor-pointer hover:underline hover:decoration-dotted hover:underline-offset-2',
                        )}
                      >
                        <Figure leaf={leaf} value={value} />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
          {result.total !== undefined && (
            <tfoot>
              <tr role="row" aria-level={1} data-total="">
                <th
                  role="rowheader"
                  {...focusable(drawn.length - 1, 0)}
                  className={cn(
                    BODY_CELL,
                    STICKY_START,
                    CELL_FOCUS,
                    'z-[5] border-t border-b-0 border-t-strong bg-surface-sunken text-start font-semibold',
                  )}
                >
                  <span className="flex items-start gap-1">
                    <span aria-hidden="true" className="w-6 shrink-0" />
                    <span className={TEXT_DIRECTION}>{result.total.label}</span>
                  </span>
                </th>
                {leaves.map((leaf, index) => {
                  const value = result.total?.cells[leaf.column.key]
                  const opens = drillable && value !== null && value !== undefined && value !== ''
                  return (
                    <td
                      key={leaf.column.key}
                      role="gridcell"
                      {...focusable(drawn.length - 1, index + 1)}
                      className={cn(
                        BODY_CELL,
                        CELL_FOCUS,
                        'border-s border-t border-b-0 border-t-strong bg-surface-sunken text-end font-semibold whitespace-nowrap',
                        opens &&
                          'cursor-pointer hover:underline hover:decoration-dotted hover:underline-offset-2',
                      )}
                    >
                      <Figure leaf={leaf} value={value} />
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </>
  )
}
