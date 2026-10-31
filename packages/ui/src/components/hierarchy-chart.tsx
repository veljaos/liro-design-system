import { Maximize2, Minus, ScanSearch, Shrink } from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import { EmptyState, ErrorState, type EmptyAction } from './empty-state'
import {
  descendantCount,
  hasChildren,
  hierarchyKeyAction,
  hierarchyPath,
  indexHierarchy,
  initiallyExpanded,
  matchHierarchy,
  revealNode,
  toggleWidth,
  visibleHierarchy,
  type HierarchyIndex,
  type HierarchyItem,
  type HierarchyNode,
} from './hierarchy-logic'
import { PersonAvatar } from './person'
import { StatusBadge } from './status-badge'
import { TextField } from './text-field'
import type { TreeNode } from './tree-logic'
import { TreeView } from './tree-view'
import { UnavailableAction } from './actions'
import { usePhone } from './use-phone'

export {
  descendantCount,
  hasChildren,
  hierarchyKeyAction,
  hierarchyPath,
  indexHierarchy,
  initiallyExpanded,
  matchHierarchy,
  revealNode,
  stacksChildren,
  visibleHierarchy,
} from './hierarchy-logic'
export type {
  HierarchyIndex,
  HierarchyItem,
  HierarchyKeyAction,
  HierarchyNode,
} from './hierarchy-logic'

/*
 * HierarchyChart: people and positions by their reporting lines, units with
 * their heads and headcounts, a group of companies with ownership shares on the lines, cost
 * centres. Every word and figure is the application's; the chart draws and reports.
 * - HTML, not a canvas: nested lists of boxes, the connector lines drawn by CSS borders in
 *   border.strong. Right-to-left mirrors by itself (the rows are flex rows, the lines logical),
 *   pictures are stable, print works, text wraps and can be selected, and assistive technology
 *   reads real elements.
 * - Top-down. A node: a 224px box on the raised surface (border.default, radius md, 12px), an
 *   avatar when the node is a person (PersonAvatar), the title sm semibold, the subtitle xs
 *   text.secondary, the detail xs text.tertiary, a StatusBadge and the count in words. A vacant
 *   position has a dashed border and its "Vacant" mark. The words on the line to the parent (an
 *   ownership share) stand on the line in a small raised tag. Children that are all leaves (from
 *   `stackFrom`, default 3) stand as one list under their parent, so a wide level never grows the
 *   chart sideways without end.
 * - The first `defaultExpandedDepth` levels (default 3) are open. A node with children has a 24px
 *   toggle on its line: "+12" (how many stand under it) to open, a minus to close.
 * - "Show only this unit" draws the chosen node's subtree alone, with its path back up as a trail
 *   of buttons ("›" between them) and "Show the whole chart".
 * - Search (`search`): the application's matches (`onSearch` and `matches`) or a filter on the
 *   titles, subtitles and details here; the first match is revealed (its path opened), chosen and
 *   scrolled into view — not opened: its card waits for a press or Enter on it; Enter in the field
 *   goes to the next; "2 of 5 found" is announced politely.
 * - Choosing: a press or Enter on a node chooses it (the neutral selection, surface.selected and a
 *   border.selected border) and calls `onOpen(id)` — the application opens its card or page.
 *   Secondary (dotted-line) relations are the application's: listed in its card, never drawn.
 * - A WAI-ARIA tree: `role="tree"`, every node a `treeitem` with aria-level, aria-setsize,
 *   aria-posinset and aria-expanded, named by its title and subtitle; one node in the tab order
 *   (roving focus). ArrowDown to the first child (opening the node), ArrowUp to the parent,
 *   ArrowLeft / ArrowRight to the siblings (mirrored in right-to-left), along a stacked list with
 *   ArrowDown / ArrowUp; Home, End; Enter opens; Space opens or closes; `*` opens the siblings
 *   (`hierarchyKeyAction`, tested).
 * - The chart scrolls in both directions inside its card (`maxHeight`); the page never scrolls
 *   sideways. "Fit to width" scales it to the card, "Actual size" back (pressed buttons; no
 *   dragging).
 * - Phones (below 48em, or `layout`): the same nodes as an indented list (TreeView), with the
 *   same search, unit, choosing and opening.
 * - Loading: skeleton boxes; `error` with Try again; no nodes: an EmptyState with the
 *   application's words (`empty`) and its first step (`emptyAction`, "Add the first position").
 *   While loading, failed or empty the tools (search, fit, show only this unit) are not drawn:
 *   they have nothing to work on.
 */

export interface HierarchyChartProps {
  /** Names the chart for assistive technology ("Organisation of Kvadrat Gradnja d.o.o."). */
  label: string
  nodes: readonly HierarchyNode[]
  /** How many levels are open at first. Default 3. */
  defaultExpandedDepth?: number
  /** The open nodes (controlled). */
  expanded?: readonly string[]
  onExpandedChange?: (expanded: string[]) => void
  /** The node whose subtree is shown alone (controlled); null shows the whole chart. */
  unit?: string | null
  /** The node shown alone at first. */
  defaultUnit?: string | null
  onUnitChange?: (unit: string | null) => void
  /** The chosen node (controlled): the neutral selection. */
  chosen?: string | null
  /** The node chosen at first (its path is opened). */
  defaultChosen?: string | null
  /** A node was chosen (a press, Enter, a search): the application opens its card or page. */
  onOpen?: (id: string) => void
  /** A search field above the chart. Default true. */
  search?: boolean
  /** The text searched at first (the first match is revealed). */
  defaultQuery?: string
  /** The search field's label. Default `messages['hierarchy.search']`. */
  searchLabel?: string
  /** The application searches itself: called with the typed text; its results in `matches`. */
  onSearch?: (query: string) => void
  /** The application's matches for the last query, in its order. */
  matches?: readonly string[]
  /** Children that are all leaves stand as one list from this many. Default 3. */
  stackFrom?: number
  /** 'actual' (default) or 'fit': scaled to the card's width. Controlled. */
  zoom?: 'actual' | 'fit'
  defaultZoom?: 'actual' | 'fit'
  onZoomChange?: (zoom: 'actual' | 'fit') => void
  /**
   * The controls: search, unit, size and the toggles under the nodes. Default true; false for a
   * chart printed from the screen as you see it (a screen, not a document).
   */
  toolbar?: boolean
  /** The card around the chart. Default true; false when the screen is printed as you see it. */
  framed?: boolean
  /** A vacant position's mark. Default `messages['hierarchy.vacant']`. */
  vacantLabel?: string
  /** The chart's height before it scrolls (CSS length). Default "70vh"; "none" never scrolls. */
  maxHeight?: string
  loading?: boolean
  /** The nodes could not be loaded: the application's words. */
  error?: ReactNode
  onRetry?: () => void
  /**
   * The empty chart's words under the provider's "Nothing here yet" (an EmptyState), from the
   * application: "No positions yet." Default: the provider's description.
   */
  empty?: ReactNode
  /** The empty chart's first step, from the application ("Add the first position"). */
  emptyAction?: EmptyAction
  /** 'phone' draws the indented list; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

const NODE_WIDTH = 'w-56'
/** A toggle's room on the line under its node. */
const DROP = 'pt-8'

function NodeBody({
  node,
  vacantLabel,
  compact,
}: {
  node: HierarchyNode
  vacantLabel: string
  compact: boolean
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      {node.avatar !== undefined && (
        <PersonAvatar name={node.avatar} size={compact ? 'sm' : 'md'} />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
        <span className={cn('text-sm font-semibold break-words text-primary', TEXT_DIRECTION)}>
          {node.title}
        </span>
        {node.subtitle !== undefined && (
          <span className={cn('text-xs break-words text-secondary', TEXT_DIRECTION)}>
            {node.subtitle}
          </span>
        )}
        {node.detail !== undefined && (
          <span className={cn('text-xs break-words text-tertiary', TEXT_DIRECTION)}>
            {node.detail}
          </span>
        )}
        {(node.vacant === true || node.badge !== undefined || node.count !== undefined) && (
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {node.vacant === true && (
              <span
                className={cn(
                  'rounded-xs border border-dashed border-strong px-1.5 text-xs font-medium text-secondary',
                  TEXT_ISOLATE,
                )}
              >
                {vacantLabel}
              </span>
            )}
            {node.badge !== undefined && (
              <StatusBadge label={node.badge.label} tone={node.badge.tone} />
            )}
            {node.count !== undefined && (
              <span className={cn('text-xs text-secondary tabular-nums', TEXT_ISOLATE)}>
                {node.count}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}

interface ChartState {
  index: HierarchyIndex
  items: readonly HierarchyItem[]
  expanded: readonly string[]
  chosen: string | null
  focus: string | null
  stackFrom: number
  vacantLabel: string
  /** The toggles under the nodes are drawn. */
  controls: boolean
  toggle: (id: string) => void
  choose: (id: string) => void
  onKey: (event: KeyboardEvent<HTMLElement>, id: string) => void
  register: (id: string, element: HTMLElement | null) => void
}

/** A node's tree item: its box, its toggle, and its open children. */
function Item({
  node,
  state,
  stacked,
}: {
  node: HierarchyNode
  state: ChartState
  stacked: boolean
}) {
  const { messages, format } = useLiro()
  const item = state.items.find((each) => each.id === node.id)
  const titleId = useId()
  if (item === undefined) return null
  const children = state.index.children.get(node.id) ?? []
  const open = item.expanded
  const chosen = state.chosen === node.id
  const hidden = descendantCount(state.index, node.id)
  const toggleText = `+${format.number(String(hidden))}`
  const stackKids =
    children.length >= state.stackFrom &&
    children.every((child) => !hasChildren(state.index, child.id))
  const aria = {
    'aria-level': item.level,
    'aria-setsize': item.setSize,
    'aria-posinset': item.posInSet,
    'aria-labelledby': titleId,
    ...(item.expandable ? { 'aria-expanded': open } : {}),
  }
  const name = (
    <span id={titleId} className="sr-only">
      {[node.title, node.subtitle, node.vacant === true ? state.vacantLabel : undefined]
        .filter((part) => part !== undefined)
        .join(', ')}
    </span>
  )

  if (stacked) {
    return (
      <div
        role="treeitem"
        tabIndex={state.focus === node.id ? 0 : -1}
        aria-selected={chosen}
        {...aria}
        ref={(element) => {
          state.register(node.id, element)
        }}
        data-slot="hierarchy-item"
        onKeyDown={(event) => {
          state.onKey(event, node.id)
        }}
        onClick={(event) => {
          event.stopPropagation()
          state.choose(node.id)
        }}
        className={cn(
          'relative cursor-pointer border-0 border-b border-solid border-subtle px-3 py-2 outline-none last:border-b-0 focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-focus',
          chosen ? 'bg-surface-selected' : 'hover:bg-surface-hover',
          node.vacant === true && 'border-dashed',
        )}
      >
        {name}
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <NodeBody node={node} vacantLabel={state.vacantLabel} compact />
          </div>
          {node.lineLabel !== undefined && (
            <span className={cn('text-xs text-secondary tabular-nums', TEXT_ISOLATE)}>
              {node.lineLabel}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      role="treeitem"
      tabIndex={state.focus === node.id ? 0 : -1}
      aria-selected={chosen}
      {...aria}
      ref={(element) => {
        state.register(node.id, element)
      }}
      data-slot="hierarchy-item"
      onKeyDown={(event) => {
        state.onKey(event, node.id)
      }}
      onClick={(event) => {
        // Only a press on this node's own box chooses it (not on the space around its children).
        const target = event.target as Element
        if (target.closest('[data-slot="hierarchy-node"]')?.parentElement !== event.currentTarget) {
          return
        }
        event.stopPropagation()
        state.choose(node.id)
      }}
      className={cn(
        'relative flex flex-col items-center px-2 outline-none',
        item.level > 1 && DROP,
        // The lines to the parent: the half bar toward the start (not on the first child), the
        // half bar toward the end with the drop to this node (no bar on the last child). Every
        // drop is the 1px column just after the middle (toward the end); the "+N" toggle is
        // centred on that column.
        item.level > 1 &&
          "before:absolute before:start-0 before:top-0 before:w-1/2 before:border-0 before:border-t before:border-solid before:border-strong before:content-[''] first:before:hidden after:absolute after:start-1/2 after:top-0 after:h-8 after:w-1/2 after:border-0 after:border-s after:border-t after:border-solid after:border-strong after:content-[''] last:after:border-t-0",
        '[&:focus-visible>[data-slot=hierarchy-node]]:outline-2 [&:focus-visible>[data-slot=hierarchy-node]]:outline-offset-2 [&:focus-visible>[data-slot=hierarchy-node]]:outline-focus',
      )}
    >
      {name}
      {item.level > 1 && node.lineLabel !== undefined && (
        <span
          aria-hidden="true"
          // Centred on the line's 1px column, as the toggle.
          className="pointer-events-none absolute start-1/2 top-1.5 z-10 flex w-px justify-center"
        >
          <span
            className={cn(
              'shrink-0 rounded-xs border border-solid border-subtle bg-surface-raised px-1 text-xs leading-tight font-medium text-secondary tabular-nums',
              TEXT_ISOLATE,
            )}
          >
            {node.lineLabel}
          </span>
        </span>
      )}
      <div
        data-slot="hierarchy-node"
        data-chosen={chosen ? 'true' : undefined}
        className={cn(
          'relative box-border cursor-pointer rounded-md border border-solid p-3',
          NODE_WIDTH,
          node.vacant === true ? 'border-dashed' : '',
          chosen
            ? 'border-selected bg-surface-selected'
            : node.vacant === true
              ? 'border-strong bg-surface-raised hover:bg-surface-hover'
              : 'border-default bg-surface-raised hover:bg-surface-hover',
        )}
      >
        <NodeBody node={node} vacantLabel={state.vacantLabel} compact={false} />
      </div>
      {item.expandable && state.controls && (
        // The toggle stands on the line under the box: a pointer's way to open and close. The
        // keyboard opens and closes with Space on the node (it is not a tab stop of its own).
        // Exactly centred on the line: it is centred on the same 1px column as
        // the lines (`start-1/2`, one pixel wide) and its width is odd (`toggleWidth`), so it
        // stands on whole pixels in both directions.
        <div className="relative z-10 -mt-3 h-6 self-stretch">
          <div className="absolute start-1/2 top-0 flex h-6 w-px justify-center">
            <button
              type="button"
              tabIndex={-1}
              aria-label={
                open
                  ? messages['hierarchy.collapse'](node.title)
                  : messages['hierarchy.expand'](hidden, format.number(String(hidden)), node.title)
              }
              onClick={(event) => {
                event.stopPropagation()
                state.toggle(node.id)
              }}
              style={{ width: toggleWidth(open ? '−' : toggleText) }}
              className={cn(
                BUTTON_RESET,
                FOCUS_RING,
                'box-border inline-flex h-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-solid border-strong bg-surface-raised font-sans text-xs font-medium text-primary hover:bg-surface-hover',
              )}
            >
              {open ? (
                <Minus aria-hidden="true" className="size-[13px]" />
              ) : (
                <span aria-hidden="true" className={cn('tabular-nums', TEXT_ISOLATE)}>
                  {toggleText}
                </span>
              )}
            </button>
          </div>
        </div>
      )}
      {open && children.length > 0 && (
        <div className="relative flex justify-center pt-5 before:absolute before:start-1/2 before:top-0 before:h-5 before:border-0 before:border-s before:border-solid before:border-strong before:content-['']">
          {stackKids ? (
            <div
              role="group"
              className={cn(
                'm-0 box-border list-none overflow-hidden rounded-md border border-solid border-default bg-surface-raised p-0',
                NODE_WIDTH,
              )}
            >
              {children.map((child) => (
                <Item key={child.id} node={child} state={state} stacked />
              ))}
            </div>
          ) : (
            <div role="group" className="m-0 flex list-none justify-center p-0">
              {children.map((child) => (
                <Item key={child.id} node={child} state={state} stacked={false} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Brings a node's box to the middle of the chart's area, sideways, and into view up and down —
 * inside the area only: the page itself never moves.
 */
function centreWithin(outer: HTMLElement | null, element: HTMLElement | undefined) {
  const box = element?.querySelector(':scope > [data-slot="hierarchy-node"]') ?? element
  if (outer === null || box === undefined) return
  const room = outer.getBoundingClientRect()
  const place = box.getBoundingClientRect()
  outer.scrollLeft += place.left + place.width / 2 - (room.left + room.width / 2)
  if (place.top < room.top + 16 || place.bottom > room.bottom - 16) {
    outer.scrollTop += place.top - room.top - 16
  }
}

function ChartSkeleton() {
  return (
    <div
      data-slot="hierarchy-loading"
      aria-busy="true"
      className="flex flex-col items-center gap-6 p-6"
    >
      <Skeleton className={cn('h-16', NODE_WIDTH)} />
      <div className="flex gap-4">
        <Skeleton className={cn('h-16', NODE_WIDTH)} />
        <Skeleton className={cn('h-16', NODE_WIDTH)} />
        <Skeleton className={cn('h-16', NODE_WIDTH)} />
      </div>
    </div>
  )
}

/** People, units or companies by their lines, top-down; an indented list on phones. */
export function HierarchyChart(props: HierarchyChartProps) {
  const { messages, format, direction, locale } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const index = useMemo(() => indexHierarchy(props.nodes), [props.nodes])
  const depth = props.defaultExpandedDepth ?? 3
  const stackFrom = props.stackFrom ?? 3
  const vacantLabel = props.vacantLabel ?? messages['hierarchy.vacant']
  // The tools work on nodes: not drawn while loading, failed or empty.
  const hasNodes = props.loading !== true && props.error === undefined && props.nodes.length > 0
  const showToolbar = (props.toolbar ?? true) && hasNodes
  const searchable = props.search ?? true

  // What the search found first at mount: revealed, chosen.
  const startQuery = props.defaultQuery ?? ''
  const [startChosen] = useState<string | null>(
    () =>
      props.defaultChosen ??
      (props.matches ?? matchHierarchy(props.nodes, startQuery, locale))[0] ??
      null,
  )

  const [innerUnit, setInnerUnit] = useState<string | null>(props.defaultUnit ?? null)
  const unit = props.unit === undefined ? innerUnit : props.unit
  const setUnit = (next: string | null) => {
    setInnerUnit(next)
    props.onUnitChange?.(next)
  }
  const [innerExpanded, setInnerExpanded] = useState<string[]>(() => {
    const open = initiallyExpanded(index, depth, unit === null ? undefined : [unit])
    return startChosen === null ? open : revealNode(index, open, startChosen)
  })
  const expanded = props.expanded ?? innerExpanded
  const setExpanded = (next: string[]) => {
    setInnerExpanded(next)
    props.onExpandedChange?.(next)
  }
  const [innerChosen, setInnerChosen] = useState<string | null>(startChosen)
  const chosen = props.chosen === undefined ? innerChosen : props.chosen
  const [query, setQuery] = useState(startQuery)
  const [innerZoom, setInnerZoom] = useState<'actual' | 'fit'>(props.defaultZoom ?? 'actual')
  const zoom = props.zoom ?? innerZoom
  const setZoom = (next: 'actual' | 'fit') => {
    setInnerZoom(next)
    props.onZoomChange?.(next)
  }

  const unitNode = unit === null ? undefined : index.byId.get(unit)
  const tops = unitNode === undefined ? index.roots : [unitNode]
  const items = visibleHierarchy(index, tops, expanded, stackFrom)
  const [innerFocus, setFocus] = useState<string | null>(null)
  const focus =
    innerFocus !== null && items.some((item) => item.id === innerFocus)
      ? innerFocus
      : chosen !== null && items.some((item) => item.id === chosen)
        ? chosen
        : (items[0]?.id ?? null)

  const elements = useRef(new Map<string, HTMLElement>())
  const pendingFocus = useRef<string | null>(null)
  const pendingScroll = useRef<string | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const scrollWithin = (id: string) => {
    centreWithin(area.current, elements.current.get(id))
  }
  // At first, and whenever another unit is shown: the chosen node (a search's match), or the top
  // node, in the middle of the area.
  const firstDraw = useRef(true)
  const topId = tops[0]?.id
  useLayoutEffect(() => {
    const target = firstDraw.current && startChosen !== null ? startChosen : topId
    firstDraw.current = false
    if (target !== undefined) centreWithin(area.current, elements.current.get(target))
  }, [unit, phone, topId, startChosen])
  useEffect(() => {
    const id = pendingFocus.current
    if (id !== null) {
      pendingFocus.current = null
      elements.current.get(id)?.focus({ preventScroll: true })
    }
    const scroll = pendingScroll.current
    if (scroll !== null) {
      pendingScroll.current = null
      scrollWithin(scroll)
    }
  })

  const matches = props.matches ?? matchHierarchy(props.nodes, query, locale)
  const reveal = (id: string) => {
    // A match outside the unit shown: the whole chart again.
    const inUnit = unit === null || hierarchyPath(index, id).includes(unit)
    if (!inUnit) setUnit(null)
    setExpanded(revealNode(index, expanded, id))
    setInnerChosen(id)
    setFocus(id)
    pendingScroll.current = id
  }
  const find = (text: string) => {
    setQuery(text)
    props.onSearch?.(text)
    if (props.matches === undefined) {
      const first = matchHierarchy(props.nodes, text, locale)[0]
      if (first !== undefined) reveal(first)
    }
  }
  // The match shown now (the chosen node), and the next one after it.
  const shownMatch = chosen === null ? -1 : matches.indexOf(chosen)
  const findNext = () => {
    const id = matches[(shownMatch + 1) % Math.max(1, matches.length)]
    if (id !== undefined) reveal(id)
  }

  const toggle = (id: string) => {
    setExpanded(expanded.includes(id) ? expanded.filter((each) => each !== id) : [...expanded, id])
  }
  const choose = (id: string) => {
    setInnerChosen(id)
    setFocus(id)
    props.onOpen?.(id)
  }
  const moveTo = (id: string) => {
    setFocus(id)
    pendingFocus.current = id
    pendingScroll.current = id
  }
  const onKey = (event: KeyboardEvent<HTMLElement>, id: string) => {
    if (event.target !== event.currentTarget) return
    const action = hierarchyKeyAction(index, items, id, event.key, direction)
    if (action === null) return
    event.preventDefault()
    event.stopPropagation()
    if (action.kind === 'move') moveTo(action.id)
    else if (action.kind === 'enter') {
      setExpanded([...expanded, action.id])
      moveTo(action.child)
    } else if (action.kind === 'toggle') toggle(action.id)
    else if (action.kind === 'expand') setExpanded([...expanded, ...action.ids])
    else choose(action.id)
  }

  const state: ChartState = {
    index,
    items,
    expanded,
    chosen,
    focus,
    stackFrom,
    vacantLabel,
    controls: showToolbar,
    toggle,
    choose,
    onKey,
    register: (id, element) => {
      if (element === null) elements.current.delete(id)
      else elements.current.set(id, element)
    },
  }

  // "Fit to width": the chart scaled to the card (CSS zoom keeps the scroll area right).
  const chart = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const outer = area.current
    const inner = chart.current
    if (zoom !== 'fit' || phone || outer === null || inner === null) {
      setScale(1)
      return
    }
    const measure = () => {
      // The chart's own width at actual size, whatever scale it has now: measured with the zoom
      // and the minimum width set aside for the reading, so the scale never feeds back into
      // itself (a sheet that fits itself to the page would otherwise never settle).
      const { zoom: shownZoom, minWidth } = inner.style
      inner.style.zoom = '1'
      inner.style.minWidth = '0'
      const natural = inner.scrollWidth
      inner.style.zoom = shownZoom
      inner.style.minWidth = minWidth
      const room = outer.clientWidth - 32
      setScale(natural > 0 && room > 0 ? Math.min(1, Math.floor((room / natural) * 100) / 100) : 1)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(outer)
    return () => {
      observer.disconnect()
    }
  }, [zoom, phone, expanded, unit])

  const unitTarget = chosen ?? focus
  const unitTargetHasChildren = unitTarget !== null && hasChildren(index, unitTarget)
  const path = unit === null ? [] : hierarchyPath(index, unit)
  const found =
    query.trim() === ''
      ? ''
      : matches.length === 0
        ? messages['hierarchy.notFound']
        : shownMatch < 0
          ? messages['hierarchy.foundCount'](matches.length, format.number(String(matches.length)))
          : messages['hierarchy.found'](
              shownMatch + 1,
              format.number(String(shownMatch + 1)),
              matches.length,
              format.number(String(matches.length)),
            )

  const toolbar = showToolbar && (
    <div
      data-slot="hierarchy-toolbar"
      className="flex flex-col gap-1 border-0 border-b border-solid border-default p-4 print:hidden"
    >
      {/* The tools stand on the search field's line; what the search found is a
          line of its own under both. */}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        {searchable && (
          <div
            className="flex min-w-0 flex-col"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.target as HTMLElement).tagName === 'INPUT') {
                event.preventDefault()
                findNext()
              }
            }}
            role="presentation"
          >
            <TextField
              type="search"
              label={props.searchLabel ?? messages['hierarchy.search']}
              value={query}
              onChange={find}
              className="w-72 max-w-full"
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {unitTargetHasChildren && unitTarget !== unit ? (
            <Button
              family="neutral"
              icon={ScanSearch}
              label={messages['hierarchy.showUnit']}
              onClick={() => {
                setUnit(unitTarget)
                setExpanded(initiallyExpanded(index, depth, [unitTarget]))
              }}
            />
          ) : (
            <UnavailableAction
              family="neutral"
              icon={ScanSearch}
              label={messages['hierarchy.showUnit']}
              reason={
                unitTarget !== null && unitTarget === unit
                  ? messages['hierarchy.unitShown']
                  : messages['hierarchy.unitReason']
              }
            />
          )}
          {!phone && (
            <div role="group" aria-label={messages['hierarchy.size']} className="flex gap-1">
              <ButtonPrimitive
                family="neutral"
                emphasis={zoom === 'fit' ? 'secondary' : 'menu'}
                aria-pressed={zoom === 'fit'}
                onClick={() => {
                  setZoom('fit')
                }}
                className={cn(zoom === 'fit' && 'border-selected bg-surface-selected')}
              >
                <Shrink aria-hidden="true" className="size-4" />
                <span className={TEXT_DIRECTION}>{messages['hierarchy.fit']}</span>
              </ButtonPrimitive>
              <ButtonPrimitive
                family="neutral"
                emphasis={zoom === 'actual' ? 'secondary' : 'menu'}
                aria-pressed={zoom === 'actual'}
                onClick={() => {
                  setZoom('actual')
                }}
                className={cn(zoom === 'actual' && 'border-selected bg-surface-selected')}
              >
                <Maximize2 aria-hidden="true" className="size-4" />
                <span className={TEXT_DIRECTION}>{messages['hierarchy.actual']}</span>
              </ButtonPrimitive>
            </div>
          )}
        </div>
      </div>
      {searchable && (
        <p role="status" className={cn('m-0 min-h-4 text-xs text-secondary', TEXT_DIRECTION)}>
          {found}
        </p>
      )}
    </div>
  )

  const trail = path.length > 0 && (
    <nav
      aria-label={messages['hierarchy.path']}
      className="flex flex-wrap items-center gap-x-1 gap-y-1 border-0 border-b border-solid border-subtle px-4 py-2 text-sm print:hidden"
    >
      <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0">
        {path.map((id, at) => {
          const node = index.byId.get(id)
          if (node === undefined) return null
          const last = at === path.length - 1
          return (
            <li key={id} className="flex items-center gap-1">
              {last ? (
                <span
                  aria-current="true"
                  className={cn('font-medium text-primary', TEXT_DIRECTION)}
                >
                  {node.title}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const next = at === 0 && node.parentId === null ? null : id
                    setUnit(next)
                    setExpanded(initiallyExpanded(index, depth, next === null ? undefined : [next]))
                  }}
                  className={cn(
                    BUTTON_RESET,
                    FOCUS_RING,
                    'min-h-6 cursor-pointer rounded-sm text-link hover:underline',
                    TEXT_DIRECTION,
                  )}
                >
                  {node.title}
                </button>
              )}
              {!last && (
                <span aria-hidden="true" className="text-tertiary">
                  ›
                </span>
              )}
            </li>
          )
        })}
      </ol>
      <Button
        family="neutral"
        icon={Maximize2}
        emphasis="menu"
        label={messages['hierarchy.showAll']}
        onClick={() => {
          setUnit(null)
          setExpanded(initiallyExpanded(index, depth))
        }}
      />
    </nav>
  )

  let body: ReactNode
  if (props.loading === true) body = <ChartSkeleton />
  else if (props.error !== undefined) {
    body = (
      <div className="px-6">
        <ErrorState
          compact
          description={props.error}
          {...(props.onRetry === undefined
            ? {}
            : { action: { label: messages['hierarchy.retry'], onClick: props.onRetry } })}
        />
      </div>
    )
  } else if (props.nodes.length === 0) {
    body = (
      <div className="px-6">
        <EmptyState
          compact
          {...(props.empty === undefined ? {} : { description: props.empty })}
          {...(props.emptyAction === undefined ? {} : { action: props.emptyAction })}
        />
      </div>
    )
  } else if (phone) {
    const toTree = (node: HierarchyNode): TreeNode<HierarchyNode> => {
      const kids = index.children.get(node.id) ?? []
      const description = [
        node.subtitle,
        node.vacant === true ? vacantLabel : undefined,
        node.detail,
      ]
        .filter((part) => part !== undefined)
        .join(' · ')
      return {
        id: node.id,
        label: node.title,
        ...(description === '' ? {} : { description }),
        children: kids.map(toTree),
        data: node,
      }
    }
    body = (
      <div className="p-2">
        <TreeView
          label={props.label}
          nodes={tops.map(toTree)}
          layout="phone"
          expanded={expanded}
          onExpandedChange={setExpanded}
          selectionMode="single"
          selected={chosen === null ? [] : [chosen]}
          onSelectedChange={(ids) => {
            const id = ids[0]
            if (id !== undefined) choose(id)
          }}
          end={(node) => {
            const data = node.data
            if (data === undefined) return null
            const text = [data.lineLabel, data.count].filter((part) => part !== undefined)
            return (
              <span className="flex flex-col items-end gap-1">
                {data.badge !== undefined && (
                  <StatusBadge label={data.badge.label} tone={data.badge.tone} />
                )}
                {text.length > 0 && (
                  <span className={cn('text-xs text-secondary tabular-nums', TEXT_ISOLATE)}>
                    {text.join(' · ')}
                  </span>
                )}
              </span>
            )
          }}
        />
      </div>
    )
  } else {
    body = (
      <div
        ref={area}
        data-slot="hierarchy-area"
        className="overflow-auto p-4 print:overflow-visible"
        style={props.maxHeight === 'none' ? undefined : { maxHeight: props.maxHeight ?? '70vh' }}
      >
        <div ref={chart} className="mx-auto w-max min-w-full" style={{ zoom: scale }}>
          <div
            role="tree"
            aria-label={props.label}
            className="m-0 flex list-none justify-center p-0"
          >
            {tops.map((node) => (
              <Item key={node.id} node={node} state={state} stacked={false} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section
      aria-label={props.label}
      data-slot="hierarchy-chart"
      className={cn(
        'flex min-w-0 flex-col font-sans',
        (props.framed ?? true) &&
          'overflow-hidden rounded-lg border border-solid border-default bg-surface-raised',
        props.className,
      )}
    >
      {toolbar}
      {hasNodes && trail}
      {body}
    </section>
  )
}
