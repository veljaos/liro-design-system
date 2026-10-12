import { Fragment, useRef, type ReactNode } from 'react'
import { FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { EmptyState } from './empty-state'
import type { TreeNode, TreeRow } from './tree-logic'
import {
  onTreeRowClick,
  SELECTED_BAR,
  TreeItemContent,
  treeRowAria,
  TreeSkeleton,
  TreeView,
  useTreeRows,
} from './tree-view'
import { usePhone } from './use-phone'
import { useTree, type TreeBaseProps } from './use-tree'

/*
 * TreeTable (BUILD-PLAN P5.9): a tree whose nodes carry figures — a chart of accounts with its
 * balances, warehouse locations with their stock, a budget by org unit. The first column is the
 * tree (TreeView's rows: chevron, code, name, the same keys, lazy children and selection); the
 * other columns come from DataTable-like definitions. The table never adds anything: a branch's
 * figures and the totals row are the application's (D4).
 * - A treegrid (WAI-ARIA): the rows take the focus (roving, one in the tab order) and the keys of
 *   the tree pattern; the cells hold text only. `aria-level`, `aria-setsize`, `aria-posinset`,
 *   `aria-expanded` per row; with `maxHeight`, `aria-rowcount` and `aria-rowindex` too.
 * - DataTable's look (Mantine Table): 13px, the header row on surface.sunken in bold, a 1px
 *   border.default line under each row; cells 8px top and bottom, 16px at the sides. Numbers and
 *   amounts end-aligned with tabular digits (`numeric`), written by the application through the
 *   provider's `format` (NumberText, MoneyText). The totals row: surface.sunken, semibold, a 1px
 *   border.strong line above it, sticky at the bottom while the table scrolls.
 * - Thousands of nodes: with `maxHeight` the table scrolls inside it with a sticky header and
 *   draws only the rows in view (TanStack Virtual, `tree-window.ts`).
 * - Phones (below 48em, or `layout`): the tree (TreeView's phone rows) with the main figure
 *   (`mainColumn`) at each row's end, and the total under it.
 */

/** One column after the tree. */
export interface TreeTableColumn<Data> {
  /** Unique within the table; `totals` and `mainColumn` refer to it. */
  id: string
  /** The header's text, from the application. */
  header: ReactNode
  /** The cell of one node: its figure (NumberText, MoneyText), from the node's data. */
  cell: (node: TreeNode<Data>) => ReactNode
  /** Default 'start', or 'end' for a `numeric` column. */
  align?: 'start' | 'center' | 'end'
  /** Tabular digits, end-aligned unless `align` says otherwise: numbers, amounts, dates. */
  numeric?: boolean
  /** The narrowest the column gets, in pixels. Default: its content's width. */
  minWidth?: number
}

export interface TreeTableProps<Data> extends TreeBaseProps<Data> {
  /** The tree column's header, from the application ("Account"). */
  treeHeader: ReactNode
  columns: readonly TreeTableColumn<Data>[]
  /** The totals row's values by column id, computed by the application. */
  totals?: Readonly<Partial<Record<string, ReactNode>>>
  /** The totals row's label. Default: `messages['tree.total']`. */
  totalsLabel?: string
  /**
   * Phones: the column whose value stands at the end of each row. Default: the first `numeric`
   * column, else the first.
   */
  mainColumn?: string
  /** Skeleton rows while the table loads. */
  loading?: boolean
  /** What an empty table shows. Default: EmptyState (compact) with the provider's texts. */
  empty?: ReactNode
  /** The table scrolls inside this height (CSS length) and draws only the rows in view. */
  maxHeight?: string
  /** 'phone' draws the tree with the main figure; default by the viewport (below 48em). */
  layout?: 'desktop' | 'phone'
  /** Layout classes (width, margins). */
  className?: string
}

const ALIGN = { start: 'text-start', center: 'text-center', end: 'text-end' } as const

/** Mantine Table cells, a little tighter for a tree: 8px top and bottom, 16px at the sides. */
const CELL = 'px-4 py-2'
const LINE = 'border-0 border-b border-solid border-default'
const TOTALS_LINE = 'sticky bottom-0 z-10 border-0 border-t border-solid border-strong'

function alignOf<Data>(column: TreeTableColumn<Data>) {
  return column.align ?? (column.numeric === true ? 'end' : 'start')
}

/** The column shown at the end of a row on phones. */
export function mainColumnOf<Data>(
  columns: readonly TreeTableColumn<Data>[],
  id: string | undefined,
): TreeTableColumn<Data> | undefined {
  return (
    (id === undefined ? undefined : columns.find((column) => column.id === id)) ??
    columns.find((column) => column.numeric === true) ??
    columns[0]
  )
}

/** A tree with columns of figures: the first column is the tree, the others the node's values. */
export function TreeTable<Data>(props: TreeTableProps<Data>) {
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  if (phone) return <PhoneTreeTable {...props} />
  return <DesktopTreeTable {...props} />
}

/** Phones: the tree with the main figure at each row's end, the total under it. */
function PhoneTreeTable<Data>(props: TreeTableProps<Data>) {
  const { messages } = useLiro()
  const main = mainColumnOf(props.columns, props.mainColumn)
  const total = main === undefined ? undefined : props.totals?.[main.id]
  return (
    <div data-slot="tree-table" className={cn('flex min-w-0 flex-col font-sans', props.className)}>
      <TreeView
        nodes={props.nodes}
        label={props.label}
        layout="phone"
        {...treeProps(props)}
        {...(main === undefined ? {} : { end: (node: TreeNode<Data>) => main.cell(node) })}
      />
      {total !== undefined && total !== null && props.loading !== true && (
        <div className="flex items-baseline justify-between gap-4 border-0 border-t border-solid border-strong px-2 py-3 text-sm font-semibold text-primary">
          <span className={TEXT_DIRECTION}>{props.totalsLabel ?? messages['tree.total']}</span>
          <span className={cn('tabular-nums', TEXT_ISOLATE)}>{total}</span>
        </div>
      )}
    </div>
  )
}

/** The optional props TreeView takes over from TreeTable on phones. */
function treeProps<Data>(props: TreeTableProps<Data>) {
  return {
    ...(props.expanded === undefined ? {} : { expanded: props.expanded }),
    ...(props.defaultExpanded === undefined ? {} : { defaultExpanded: props.defaultExpanded }),
    ...(props.onExpandedChange === undefined ? {} : { onExpandedChange: props.onExpandedChange }),
    ...(props.selectionMode === undefined ? {} : { selectionMode: props.selectionMode }),
    ...(props.selected === undefined ? {} : { selected: props.selected }),
    ...(props.defaultSelected === undefined ? {} : { defaultSelected: props.defaultSelected }),
    ...(props.onSelectedChange === undefined ? {} : { onSelectedChange: props.onSelectedChange }),
    ...(props.onLoadChildren === undefined ? {} : { onLoadChildren: props.onLoadChildren }),
    ...(props.loading === undefined ? {} : { loading: props.loading }),
    ...(props.empty === undefined ? {} : { empty: props.empty }),
    ...(props.maxHeight === undefined ? {} : { maxHeight: props.maxHeight }),
  }
}

/*
 * The desktop table is a treegrid of elements laid out as a table (`display: table`): the rows
 * take the focus and the keys, as WAI-ARIA's treegrid; a <table> cannot take the treegrid role
 * without losing its own semantics to jsx-a11y's rule, and the roles here are the same ones.
 */
function DesktopTreeTable<Data>(props: TreeTableProps<Data>) {
  const { messages } = useLiro()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const revealRef = useRef<((index: number) => void) | null>(null)
  const tree = useTree(props, scrollerRef, revealRef)
  const windowed = props.maxHeight !== undefined
  const view = useTreeRows(tree, scrollerRef, revealRef, windowed, false)
  const hasTotals = props.totals !== undefined
  const sticky = windowed ? 'sticky top-0 z-10' : undefined

  if (props.nodes.length === 0 && props.loading !== true) {
    return (
      <div data-slot="tree-table" className={cn('font-sans', props.className)}>
        {props.empty ?? <EmptyState compact className="py-6" />}
      </div>
    )
  }

  const headerRow = (
    <div role="row" aria-rowindex={windowed ? 1 : undefined} className="table-row">
      <div
        role="columnheader"
        className={cn(
          CELL,
          LINE,
          'table-cell bg-surface-sunken text-start font-bold text-primary',
          sticky,
        )}
      >
        <span className={TEXT_ISOLATE}>{props.treeHeader}</span>
      </div>
      {props.columns.map((column) => (
        <div
          key={column.id}
          role="columnheader"
          className={cn(
            CELL,
            LINE,
            'table-cell bg-surface-sunken font-bold whitespace-nowrap text-primary',
            ALIGN[alignOf(column)],
            sticky,
          )}
          style={column.minWidth === undefined ? undefined : { minWidth: column.minWidth }}
        >
          <span className={TEXT_ISOLATE}>{column.header}</span>
        </div>
      ))}
    </div>
  )

  const bodyRow = (row: TreeRow<Data>, index: number) => {
    const selected = tree.mode === 'single' && tree.selectedSet.has(row.id)
    return (
      <div
        role="row"
        data-tree-row={row.id}
        data-index={index}
        ref={view.measure}
        tabIndex={index === tree.focusIndex ? 0 : -1}
        aria-rowindex={windowed ? index + 2 : undefined}
        aria-selected={tree.mode === 'single' ? selected : undefined}
        {...treeRowAria(row, tree)}
        {...(row.kind === 'loading' ? { 'aria-busy': true } : {})}
        {...(selected ? { 'data-liro-surface': 'selected' } : {})}
        onKeyDown={(event) => {
          tree.onKeyDown(event, index)
        }}
        onFocus={() => {
          tree.onFocusRow(row)
        }}
        onClick={(event) => {
          onTreeRowClick(event, row, tree)
        }}
        className={cn(
          'table-row text-sm',
          row.kind === 'node' && 'cursor-pointer hover:bg-surface-hover',
          selected && 'bg-surface-selected hover:bg-surface-selected',
          FOCUS_RING,
          'focus-visible:-outline-offset-2',
        )}
      >
        <div
          role="gridcell"
          className={cn('table-cell py-1 ps-2 pe-4 align-top', LINE, selected && SELECTED_BAR)}
        >
          <TreeItemContent row={row} tree={tree} phone={false} />
        </div>
        {props.columns.map((column) => (
          <div
            key={column.id}
            role="gridcell"
            className={cn(
              CELL,
              LINE,
              'table-cell align-top whitespace-nowrap text-primary',
              ALIGN[alignOf(column)],
              column.numeric === true && 'tabular-nums',
            )}
            style={column.minWidth === undefined ? undefined : { minWidth: column.minWidth }}
          >
            {row.kind === 'node' && <span className={TEXT_ISOLATE}>{column.cell(row.node)}</span>}
          </div>
        ))}
      </div>
    )
  }

  const spacer = (key: string, height: number) => (
    <div key={key} aria-hidden="true" className="table-row" style={{ height }} />
  )

  const after = view.after()
  return (
    <div data-slot="tree-table" className={cn('flex min-w-0 flex-col font-sans', props.className)}>
      <div
        ref={scrollerRef}
        className="min-w-0 overflow-auto"
        style={windowed ? { maxHeight: props.maxHeight } : undefined}
      >
        <div
          role="treegrid"
          aria-label={props.label}
          aria-busy={props.loading === true ? true : undefined}
          aria-rowcount={windowed ? tree.rows.length + 1 + (hasTotals ? 1 : 0) : undefined}
          className="table w-full border-separate border-spacing-0 text-sm text-primary"
        >
          <div role="rowgroup" className="table-header-group">
            {headerRow}
          </div>
          {props.loading === true ? (
            <div role="rowgroup" className="table-row-group">
              <div aria-hidden="true" className="table-row">
                <div className={cn(CELL, 'table-cell')}>
                  <TreeSkeleton phone={false} />
                </div>
              </div>
            </div>
          ) : (
            <div role="rowgroup" className="table-row-group">
              {view.drawn().map(({ index, before }) => {
                const row = tree.rows[index]
                if (row === undefined) return null
                return (
                  <Fragment key={row.id}>
                    {before > 0 && spacer('before', before)}
                    {bodyRow(row, index)}
                  </Fragment>
                )
              })}
              {after > 0 && spacer('after', after)}
            </div>
          )}
          {hasTotals && props.loading !== true && (
            <div role="rowgroup" className="table-footer-group">
              <div
                role="row"
                aria-rowindex={windowed ? tree.rows.length + 2 : undefined}
                className="table-row"
              >
                <div
                  role="rowheader"
                  className={cn(
                    CELL,
                    TOTALS_LINE,
                    'table-cell bg-surface-sunken text-start font-semibold text-primary',
                  )}
                >
                  <span className={TEXT_ISOLATE}>
                    {props.totalsLabel ?? messages['tree.total']}
                  </span>
                </div>
                {props.columns.map((column) => (
                  <div
                    key={column.id}
                    role="gridcell"
                    className={cn(
                      CELL,
                      TOTALS_LINE,
                      'table-cell bg-surface-sunken font-semibold whitespace-nowrap text-primary',
                      ALIGN[alignOf(column)],
                      column.numeric === true && 'tabular-nums',
                    )}
                  >
                    <span className={TEXT_ISOLATE}>{props.totals?.[column.id]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
