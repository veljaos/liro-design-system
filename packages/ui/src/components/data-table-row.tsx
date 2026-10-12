import type { RowData } from '@tanstack/react-table'
import { memo, type KeyboardEvent, type MouseEvent, type ReactNode, type RefObject } from 'react'
import { Checkbox } from '../primitives/checkbox'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import type { LiroMessages } from '../provider/messages'
import { CompactIconButton } from './button'
import { fromControl } from './data-table-card'
import { rowKeyAction } from './data-table-logic'
import type { DataTableColumn } from './data-table'
import { LazyDropdownMenu, type MenuEntry } from './dropdown-menu'
import { LINE_TYPE_TEXT, spansRow, type LineType } from './line-types'

/*
 * One row of DataTable's table layout, memoised (P5.20: long lists stay responsive). A row draws
 * again only when what it shows changes: its record, its place (aria-rowindex), its selection,
 * the line after it (a subtotal), or the table's columns and settings. A scroll draws only the
 * rows that enter the window; selecting a row draws that row. Handlers and `getRowLabel` are read
 * through `latest` when used, so a new function from the application is not a reason to draw.
 */

export const ALIGN = { start: 'text-start', center: 'text-center', end: 'text-end' } as const

/** Mantine Table cell padding: vertical sm (12px), horizontal md (16px). */
export const CELL = 'px-4 py-3'

/**
 * A selected row (P3.6, owner): besides its neutral background, a 3px bar in border.selected on
 * the row's start edge, drawn by the first cell, so selected differs from hovered by shape too.
 */
const SELECTED_ROW =
  "[&>td:first-child]:relative [&>td:first-child]:before:absolute [&>td:first-child]:before:inset-y-0 [&>td:first-child]:before:start-0 [&>td:first-child]:before:border-0 [&>td:first-child]:before:border-s-[3px] [&>td:first-child]:before:border-solid [&>td:first-child]:before:border-selected [&>td:first-child]:before:content-['']"

/**
 * A subtotal's cells (P5.18): the rule above in border.strong (line-types' SUBTOTAL_RULE), the
 * row line below as every row's; the bottom width is set by the row.
 */
/** What the line is, under its first cell (P5.18). */
const LINE_KIND = cn('block text-xs text-secondary', TEXT_DIRECTION)

const SUBTOTAL_LINE = 'border-0 border-t border-solid border-t-strong border-b-default'

/** What a row reads when it is used, not when it is drawn. */
export interface RowLatest<Row extends RowData> {
  getRowLabel: (row: Row) => string
  onRowClick: ((row: Row) => void) | undefined
  onRowOpen: ((row: Row) => void) | undefined
  /** Selects or clears one row (through TanStack Table's selection). */
  toggle: (id: string, value: boolean) => void
}

/** Everything every row shares: one object, memoised by the table. */
export interface RowShared<Row extends RowData> {
  columns: readonly DataTableColumn<Row>[]
  selectable: boolean
  hasActions: boolean
  clickable: boolean
  virtualize: boolean
  oneLine: boolean
  /** The number of cells of a row. */
  span: number
  /** The first column of a subtotal's amounts. */
  amountsFrom: number
  messages: LiroMessages
  rowActions: ((row: Row) => readonly MenuEntry[]) | undefined
  lineText: ((row: Row) => ReactNode) | undefined
  lineKind: ((row: Row) => ReactNode) | undefined
  latest: RefObject<RowLatest<Row>>
  /** The classes of a normal line's cells (`lineClasses`), joined once per table, not per cell. */
  classes: LineClasses
}

/** A normal line's cell classes, with the line under the row ([0]) and without it ([1]). */
export interface LineClasses {
  cells: readonly [readonly string[], readonly string[]]
  select: readonly [string, string]
  actions: readonly [string, string]
}

const ROW_LINE = ['border-0 border-b border-solid border-default', 'border-0'] as const

/** Joins the cell classes of a normal line for these columns once (cn per cell was measurable). */
export function lineClasses<Row extends RowData>(
  columns: readonly DataTableColumn<Row>[],
  virtualize: boolean,
  oneLine: boolean,
): LineClasses {
  const cells = (rowLine: string) =>
    columns.map((column) =>
      cn(
        CELL,
        // A column's own minimum width stands on its header cell (P5.23).
        column.minWidth === undefined && 'min-w-16',
        rowLine,
        ALIGN[column.align ?? 'start'],
        column.numeric === true && 'tabular-nums',
        virtualize && 'py-0',
        oneLine && 'truncate',
      ),
    )
  const select = (rowLine: string) => cn(CELL, 'w-px', rowLine, virtualize && 'py-0')
  const actions = (rowLine: string) => cn('w-px px-2 py-0 text-end', rowLine)
  return {
    cells: [cells(ROW_LINE[0]), cells(ROW_LINE[1])],
    select: [select(ROW_LINE[0]), select(ROW_LINE[1])],
    actions: [actions(ROW_LINE[0]), actions(ROW_LINE[1])],
  }
}

export interface TableRowProps<Row extends RowData> {
  shared: RowShared<Row>
  id: string
  original: Row
  /** The row's index among all rows (aria-rowindex is one more than the header's). */
  index: number
  type: LineType
  selected: boolean
  /** The next row is a subtotal: this row draws no line under it (the subtotal's rule is it). */
  beforeSubtotal: boolean
}

function TableRowView<Row extends RowData>({
  shared,
  id,
  original,
  index,
  type,
  selected,
  beforeSubtotal,
}: TableRowProps<Row>) {
  const { columns, virtualize, oneLine, selectable, messages, latest } = shared
  const rowLine = ROW_LINE[beforeSubtotal ? 1 : 0]
  const line = beforeSubtotal ? 1 : 0
  const rowIndex = virtualize ? index + 2 : undefined
  // The index the table reads to keep a focused row drawn (virtual-rows.ts).
  const dataIndex = virtualize ? index : undefined
  const textOf = (): ReactNode => shared.lineText?.(original) ?? columns[0]?.cell(original) ?? null
  if (spansRow(type)) {
    return (
      <tr
        data-line={type}
        data-index={dataIndex}
        aria-rowindex={rowIndex}
        className={virtualize ? 'h-11' : undefined}
      >
        <td
          colSpan={shared.span}
          className={cn(
            CELL,
            rowLine,
            LINE_TYPE_TEXT[type],
            virtualize && 'py-0',
            oneLine && 'truncate',
          )}
        >
          <span className={TEXT_ISOLATE}>{textOf()}</span>
        </td>
      </tr>
    )
  }
  if (type === 'subtotal') {
    const cellLine = cn(SUBTOTAL_LINE, beforeSubtotal ? 'border-b-0' : 'border-b')
    return (
      <tr
        data-line={type}
        data-index={dataIndex}
        aria-rowindex={rowIndex}
        className={virtualize ? 'h-11' : undefined}
      >
        <td
          colSpan={shared.amountsFrom + (selectable ? 1 : 0)}
          className={cn(
            CELL,
            cellLine,
            'text-end',
            LINE_TYPE_TEXT.subtotal,
            virtualize && 'py-0',
            oneLine && 'truncate',
          )}
        >
          <span className={TEXT_ISOLATE}>{textOf()}</span>
        </td>
        {columns.slice(shared.amountsFrom).map((column) => (
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
        {shared.hasActions && <td className={cellLine} />}
      </tr>
    )
  }
  const kind = shared.lineKind?.(original)
  const label = latest.current.getRowLabel(original)
  const press = () => latest.current.onRowClick?.(original)
  const { rowActions } = shared
  return (
    <tr
      {...(type === 'line' ? {} : { 'data-line': type })}
      aria-selected={selectable ? selected : undefined}
      // The selection's own text colours (P4.3): tokens.css lightens the few that fail on it.
      data-liro-surface={selected ? 'selected' : undefined}
      data-index={dataIndex}
      aria-rowindex={rowIndex}
      {...(shared.clickable
        ? {
            tabIndex: 0,
            onClick: (event: MouseEvent) => {
              if (!fromControl(event)) press()
            },
            onKeyDown: (event: KeyboardEvent) => {
              if (fromControl(event)) return
              const open = latest.current.onRowOpen
              const action = rowKeyAction(event.key, open !== undefined)
              if (action === null) return
              event.preventDefault()
              if (action === 'open') open?.(original)
              else press()
            },
          }
        : {})}
      className={cn(
        virtualize && 'h-11',
        selected && [SELECTED_ROW, 'bg-surface-selected'],
        shared.clickable &&
          'cursor-pointer outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        shared.clickable && !selected && 'hover:bg-surface-sunken',
      )}
    >
      {selectable && (
        <td className={shared.classes.select[line]}>
          <Checkbox
            checked={selected}
            onCheckedChange={(value) => {
              latest.current.toggle(id, value === true)
            }}
            aria-label={messages['table.selectRow'](label)}
            className="flex size-4 after:-inset-1 [&_svg]:size-2.5"
          />
        </td>
      )}
      {columns.map((column, cellIndex) => (
        <td key={column.id} className={shared.classes.cells[line][cellIndex]}>
          {/* The application's content takes its direction from itself; the cell keeps its side. */}
          <span className={TEXT_ISOLATE}>{column.cell(original)}</span>
          {/* What the line is (P5.18): small secondary text under the first cell, no colour. */}
          {cellIndex === 0 && kind !== undefined && kind !== null && (
            <span data-slot="line-kind" className={LINE_KIND}>
              {kind}
            </span>
          )}
        </td>
      ))}
      {shared.hasActions && (
        <td className={shared.classes.actions[line]}>
          {/* Built when first used: a Radix menu on every drawn row was a quarter of a scroll. */}
          <LazyDropdownMenu
            align="end"
            trigger={
              <CompactIconButton intent="more" label={messages['table.rowActions'](label)} />
            }
            entries={() => rowActions?.(original) ?? []}
          />
        </td>
      )}
    </tr>
  )
}

/** The memoised row: shallow props, so a scroll or a selection draws only the rows it changes. */
export const TableRow = memo(TableRowView) as <Row extends RowData>(
  props: TableRowProps<Row>,
) => ReactNode
