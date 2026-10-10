import { Check, ChevronLeft, ChevronRight, CircleAlert, Minus } from 'lucide-react'
import {
  Fragment,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { EmptyState } from './empty-state'
import { Spinner } from './spinner'
import type { TreeNode, TreeRow } from './tree-logic'
import { TREE_PHONE_ROW_HEIGHT, TREE_ROW_HEIGHT, useTreeWindow } from './tree-window'
import { usePhone } from './use-phone'
import { useTree, type TreeBaseProps } from './use-tree'
import { spacersBetween } from './virtual-rows'

/*
 * TreeView (BUILD-PLAN P5.9): nodes in a hierarchy — a chart of accounts, warehouse locations,
 * org units, a course's structure. The tree shows what it is given and reports what the user
 * does; what a node means is the application's.
 * - Rows: 13px text, at least 32px high (44px on phones), 20px of indent per level (16px on
 *   phones), from the leading edge. Before the name a 24px chevron (32px on phones) pointing to
 *   the trailing side, turned down when open, mirrored in right-to-left; a leaf keeps the room.
 *   The node's code (tabular, left to right) before its name, a description line under it, and a
 *   node that cannot be selected says why in words (`disabledReason`).
 * - The WAI-ARIA tree pattern (`tree-logic.ts`, tested): one row in the tab order (roving focus);
 *   ArrowDown / ArrowUp, Home / End; the arrow toward the trailing side opens a node or enters it,
 *   the other closes it or goes to its parent (mirrored in right-to-left, Appendix B.7); `*` opens
 *   every sibling; typing a name's (or code's) first letters moves to it; Enter or Space selects
 *   (or, without selection, opens and closes). `aria-level`, `aria-setsize`, `aria-posinset`,
 *   `aria-expanded` on every row, so a flat list of drawn rows still reads as a tree.
 * - Lazy children: a node with `hasChildren` and no `children` asks `onLoadChildren(id)` when it
 *   is opened; a loading row (the small Spinner, "Loading…") stands under it until the children
 *   arrive, an error row (`loadError`) with "Try again" when they could not be loaded.
 * - Selection (`selectionMode`): 'single' — the selected row on surface.selected with the 3px
 *   border.selected bar at its start (D17: never blue); 'multiple' — a checkbox per row, a branch
 *   checked, unchecked or mixed from the selected ids (`treeCheckStates`; the application may
 *   pass a node's own `checked`), toggled with its loaded descendants (`toggleTreeSelection`).
 * - Long trees: with `maxHeight` the tree scrolls inside it and draws only the rows in view
 *   (TanStack Virtual, `tree-window.ts`; the focused row is kept drawn).
 * - Phones (below 48em, or `layout`): the same tree as an indented list with 44px rows and 32px
 *   chevrons, for the thumb.
 */

export interface TreeViewProps<Data = undefined> extends TreeBaseProps<Data> {
  /** Skeleton rows while the tree loads. */
  loading?: boolean
  /** What an empty tree shows. Default: EmptyState (compact) with the provider's texts. */
  empty?: ReactNode
  /**
   * The tree scrolls inside this height (CSS length, e.g. "60vh") and draws only the rows in
   * view: for thousands of nodes.
   */
  maxHeight?: string
  /** 'phone' draws the touch layout (44px rows); default by the viewport (below 48em). */
  layout?: 'desktop' | 'phone'
  /**
   * What stands at the end of a node's row, from the application: a figure ("12 pallets"), a
   * StatusBadge. TreeTable puts its main figure here on phones.
   */
  end?: (node: TreeNode<Data>) => ReactNode
  /** Layout classes (width, margins). */
  className?: string
}

/** The indent of one level, in pixels. */
export const TREE_INDENT = 20
export const TREE_PHONE_INDENT = 16

/** The tree state, as `useTree` returns it. */
export type TreeState<Data> = ReturnType<typeof useTree<Data>>

/**
 * A selected row (single selection): besides surface.selected, a 3px border.selected bar on its
 * start edge (as DataTable's selected row, D17).
 */
export const SELECTED_BAR =
  "relative before:absolute before:inset-y-0 before:start-0 before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']"

/** A checkbox drawn for a row (the row carries `aria-checked`), as the Checkbox primitive. */
function RowCheck({ state, disabled }: { state: boolean | 'mixed'; disabled: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-state={state === 'mixed' ? 'indeterminate' : state ? 'checked' : 'unchecked'}
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-sm border border-solid text-on-accent',
        disabled
          ? 'border-default bg-surface-disabled text-disabled'
          : state === false
            ? 'border-control bg-surface-raised'
            : 'border-transparent bg-brand-solid',
      )}
    >
      {state === true && <Check strokeWidth={3} className="size-2.5" />}
      {state === 'mixed' && <Minus strokeWidth={3} className="size-2.5" />}
    </span>
  )
}

/**
 * The inside of a row — indent, chevron, checkbox, code, name, description, reason — or of the
 * loading and error rows; TreeView's rows and TreeTable's first cell draw it.
 */
export function TreeItemContent<Data>({
  row,
  tree,
  phone,
  end,
}: {
  row: TreeRow<Data>
  tree: TreeState<Data>
  phone: boolean
  /** At the row's end: TreeTable's main figure on phones. */
  end?: ReactNode
}) {
  const { messages, direction } = useLiro()
  const indent = (row.level - 1) * (phone ? TREE_PHONE_INDENT : TREE_INDENT)
  const chevronBox = phone ? 'size-8' : 'size-6'
  const style: CSSProperties = { paddingInlineStart: indent }

  if (row.kind === 'loading') {
    return (
      <div style={style} className="flex min-w-0 items-center">
        <span aria-hidden="true" className={cn('shrink-0', chevronBox)} />
        <Spinner size="sm" className="gap-2 text-secondary">
          {messages['tree.loading']}
        </Spinner>
      </div>
    )
  }
  if (row.kind === 'error') {
    return (
      <div style={style} className="flex min-w-0 items-center">
        <span aria-hidden="true" className={cn('shrink-0', chevronBox)} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex min-w-0 items-center gap-1.5 text-status-danger-fg">
            <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
            <span className={TEXT_DIRECTION}>
              {row.error === true ? messages['tree.loadError'] : row.error}
            </span>
          </span>
          {/* The row itself takes Enter and Space; the button is for the pointer. */}
          <ButtonPrimitive
            family="neutral"
            emphasis="secondary"
            tabIndex={-1}
            className="min-h-6 px-2.5 text-xs"
            onClick={(event) => {
              event.stopPropagation()
              tree.retry(row.parentId)
            }}
          >
            <span className={TEXT_DIRECTION}>{messages['tree.retry']}</span>
          </ButtonPrimitive>
        </div>
      </div>
    )
  }

  const { node } = row
  const Chevron = direction === 'rtl' ? ChevronLeft : ChevronRight
  const check = tree.checks?.get(node.id) ?? false
  return (
    <div style={style} className="flex min-w-0 items-start gap-1">
      {row.expandable ? (
        // For the pointer only (the row's click handler, `onTreeRowClick`): the row's keys open and
        // close it (the tree pattern).
        <span
          aria-hidden="true"
          data-slot="tree-chevron"
          className={cn(
            'flex shrink-0 cursor-pointer items-center justify-center rounded-sm text-secondary hover:bg-surface-sunken',
            chevronBox,
          )}
        >
          <Chevron
            className={cn(
              'size-4 transition-transform duration-(--liro-duration-fast) ease-standard motion-reduce:transition-none',
              row.expanded && (direction === 'rtl' ? '-rotate-90' : 'rotate-90'),
            )}
          />
        </span>
      ) : (
        <span aria-hidden="true" className={cn('shrink-0', chevronBox)} />
      )}
      {tree.mode === 'multiple' && (
        <span className={cn('flex shrink-0 items-center justify-center', chevronBox)}>
          <RowCheck state={check} disabled={node.disabledReason !== undefined} />
        </span>
      )}
      <div
        className={cn('flex min-w-0 flex-1 flex-col justify-center', phone ? 'min-h-8' : 'min-h-6')}
      >
        <span className={cn('min-w-0 text-sm text-primary', TEXT_DIRECTION)}>
          {node.code !== undefined && (
            <>
              <bdi dir="ltr" className="me-1 text-secondary tabular-nums">
                {node.code}
              </bdi>{' '}
            </>
          )}
          {node.label}
        </span>
        {node.description !== undefined && (
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{node.description}</span>
        )}
        {node.disabledReason !== undefined && (
          <span className={cn('text-xs text-tertiary', TEXT_DIRECTION)}>{node.disabledReason}</span>
        )}
      </div>
      {end !== undefined && (
        <span
          className={cn(
            'flex shrink-0 items-center text-sm text-primary tabular-nums',
            phone ? 'min-h-8' : 'min-h-6',
            TEXT_ISOLATE,
          )}
        >
          {end}
        </span>
      )}
    </div>
  )
}

/** A press on a row: on its chevron it opens or closes the node, elsewhere it activates the row. */
export function onTreeRowClick<Data>(
  event: MouseEvent<HTMLElement>,
  row: TreeRow<Data>,
  tree: TreeState<Data>,
) {
  if (
    row.kind === 'node' &&
    event.target instanceof Element &&
    event.target.closest('[data-slot="tree-chevron"]') !== null
  ) {
    tree.toggleExpanded(row.id)
    return
  }
  if (event.target instanceof Element && event.target.closest('button') !== null) return
  tree.activate(row)
}

/** The ARIA of a row of a tree or tree grid (level, place, state). */
export function treeRowAria<Data>(row: TreeRow<Data>, tree: TreeState<Data>) {
  if (row.kind !== 'node') {
    return { 'aria-level': row.level, 'aria-setsize': 1, 'aria-posinset': 1 }
  }
  return {
    'aria-level': row.level,
    'aria-setsize': row.setSize,
    'aria-posinset': row.posInSet,
    ...(row.expandable ? { 'aria-expanded': row.expanded } : {}),
    ...(tree.mode === 'multiple' ? { 'aria-checked': tree.checks?.get(row.id) ?? false } : {}),
  }
}

/** The skeleton of a tree that is loading: rows at three levels. */
export function TreeSkeleton({ phone }: { phone: boolean }) {
  const levels = [1, 2, 2, 3, 1, 2]
  return (
    <div aria-hidden="true" className="flex flex-col gap-2 py-1">
      {levels.map((level, index) => (
        <div
          key={index}
          className={cn('flex items-center gap-2', phone ? 'h-9' : 'h-6')}
          style={{ paddingInlineStart: (level - 1) * (phone ? TREE_PHONE_INDENT : TREE_INDENT) }}
        >
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className={cn('h-3.5', index % 2 === 0 ? 'w-48' : 'w-36')} />
        </div>
      ))}
    </div>
  )
}

/**
 * The drawn rows of a tree inside `scroller`: every row, or with `windowed` only those in view
 * (and the focused one) with spacers that keep the scroll height. `draw` renders one row.
 */
export function useTreeRows<Data>(
  tree: TreeState<Data>,
  scrollerRef: RefObject<HTMLElement | null>,
  revealRef: RefObject<((index: number) => void) | null>,
  windowed: boolean,
  phone: boolean,
) {
  const virtualizer = useTreeWindow({
    count: tree.rows.length,
    scroller: scrollerRef,
    rowHeight: phone ? TREE_PHONE_ROW_HEIGHT : TREE_ROW_HEIGHT,
    enabled: windowed,
    focusIndex: tree.focusIndex,
    getKey: (index) => tree.rows[index]?.id ?? String(index),
  })
  // How the tree brings a row it moves the focus to into the window (useTree's focus effect).
  useLayoutEffect(() => {
    revealRef.current = windowed
      ? (index) => {
          virtualizer.scrollToIndex(index, { align: 'auto' })
        }
      : null
  })
  return {
    /** The rows to draw, with the empty height before each (0 when it follows the previous one). */
    drawn: (): { index: number; before: number }[] => {
      if (!windowed) return tree.rows.map((_, index) => ({ index, before: 0 }))
      const items = virtualizer.getVirtualItems()
      const { before } = spacersBetween(items, virtualizer.getTotalSize())
      return items.map((item, at) => ({ index: item.index, before: before[at] ?? 0 }))
    },
    /** The empty height after the last drawn row. */
    after: (): number => {
      if (!windowed) return 0
      return spacersBetween(virtualizer.getVirtualItems(), virtualizer.getTotalSize()).after
    },
    measure: windowed ? virtualizer.measureElement : undefined,
  }
}

/** A tree of nodes: expand, collapse, lazy children, the keyboard of the WAI-ARIA tree, selection. */
export function TreeView<Data = undefined>(props: TreeViewProps<Data>) {
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const scrollerRef = useRef<HTMLDivElement>(null)
  const revealRef = useRef<((index: number) => void) | null>(null)
  const tree = useTree(props, scrollerRef, revealRef)
  const windowed = props.maxHeight !== undefined
  const view = useTreeRows(tree, scrollerRef, revealRef, windowed, phone)

  if (props.loading === true) {
    return (
      <div
        role="tree"
        aria-label={props.label}
        aria-busy="true"
        className={cn('font-sans', props.className)}
      >
        <TreeSkeleton phone={phone} />
      </div>
    )
  }
  if (props.nodes.length === 0) {
    return (
      <div data-slot="tree-view" className={cn('font-sans', props.className)}>
        {props.empty ?? <EmptyState compact className="py-6" />}
      </div>
    )
  }

  const after = view.after()
  return (
    <div
      ref={scrollerRef}
      role="tree"
      aria-label={props.label}
      data-slot="tree-view"
      className={cn(
        'flex min-w-0 flex-col font-sans',
        windowed && 'overflow-auto',
        props.className,
      )}
      style={windowed ? { maxHeight: props.maxHeight } : undefined}
    >
      {view.drawn().map(({ index, before }) => {
        const row = tree.rows[index]
        if (row === undefined) return null
        const selected = tree.mode === 'single' && tree.selectedSet.has(row.id)
        return (
          <Fragment key={row.id}>
            {before > 0 && <div aria-hidden="true" style={{ height: before }} />}
            <div
              role="treeitem"
              data-tree-row={row.id}
              data-index={index}
              ref={view.measure}
              tabIndex={index === tree.focusIndex ? 0 : -1}
              aria-selected={tree.mode === 'single' ? selected : undefined}
              {...treeRowAria(row, tree)}
              {...(row.kind === 'loading' ? { 'aria-busy': true } : {})}
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
                'box-border flex shrink-0 cursor-default flex-col justify-center rounded-md py-1 pe-2 text-start',
                phone ? 'min-h-11' : 'min-h-8',
                row.kind === 'node' && 'cursor-pointer hover:bg-surface-hover',
                selected && cn('bg-surface-selected hover:bg-surface-selected', SELECTED_BAR),
                FOCUS_RING,
                'focus-visible:-outline-offset-2',
              )}
            >
              <TreeItemContent
                row={row}
                tree={tree}
                phone={phone}
                {...(props.end !== undefined && row.kind === 'node'
                  ? { end: props.end(row.node) }
                  : {})}
              />
            </div>
          </Fragment>
        )
      })}
      {after > 0 && <div aria-hidden="true" style={{ height: after }} />}
    </div>
  )
}
