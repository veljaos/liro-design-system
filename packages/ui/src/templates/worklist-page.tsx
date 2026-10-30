import { ArrowLeft, ArrowRight, Search } from 'lucide-react'
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type SVGProps,
} from 'react'
import { Button, CompactIconButton, IconButton } from '../components/button'
import { ProgressBar } from '../components/progress'
import { usePageWindow, useTreeWindow } from '../components/tree-window'
import { useBelowMd } from '../components/use-phone'
import { spacersBetween } from '../components/virtual-rows'
import { Checkbox } from '../primitives/checkbox'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Input } from '../primitives/input'
import { useSteadyBottom } from '../primitives/use-steady-bottom'
import { useLiro } from '../provider/liro-provider'
import { PageHeader, type PageBack } from './page-header'

/*
 * WorklistPage (BUILD-PLAN P4.3; the owner's values, docs/decisions.md "Worklist"): a queue
 * processed item by item.
 * - From md (62em): the queue 380px at the start, the detail fills the rest, a 1px border.default
 *   line between them; each scrolls on its own, the page filling the screen under the shell
 *   (AppShell's --liro-shell-top). The queue's tools (`toolbar`, `search`, `filters`) stand above
 *   its rows and stay in view while the rows scroll (P5.94 item 19).
 * - Below md: the queue; choosing an item shows its detail full width (the whole screen, never a
 *   second list under it), its top row "Back to list" at the start and the position ("3 of 11")
 *   with Previous and Next at the end. The item's decisions go into AppShell's bottom bar (the
 *   application passes them there; P4.9 rule 16).
 * - One way to decide items one by one (P5.23, the owner's review): the position, Previous, Next
 *   and the decisions — the main one last ("Confirm", "Approve") — stand in one bar at the bottom
 *   of the detail pane from md, always in view; after a decision the application opens the next
 *   item by itself (`nextWorklistItem`) and offers Undo in place where it can be taken back.
 * - Many items (P5.94 item 19, a bank statement of 1,000+ lines): from WORKLIST_WINDOW_FROM items
 *   only the rows in view are drawn (TanStack Virtual, the shared rules of virtual-rows.ts), in the
 *   queue's own scroll from md and against the page's scroll below it; every row still tells its
 *   place (`aria-posinset`, `aria-setsize`). `filters` (the application's states with their
 *   counts: "Needs you 3", "Done 7") stand as chips that wrap, one pressed, so every state is in
 *   view in the narrow queue; the first chip is always "All" with every item's count (P5.96), so
 *   every item can be seen, while the queue opens on the state that needs the user; `search` is the application's (it narrows `items`). The floorplan
 *   neither filters nor counts.
 * - Keyboard: the queue is one tab stop (a roving focus); ArrowUp / ArrowDown, Home and End move
 *   it and, from md, choose the item (its detail follows); Enter takes the chosen item's main
 *   decision (`onConfirm`) from md, else chooses; Space chooses. When the chosen item leaves the
 *   queue (decided, filtered out) and the queue had the focus, the focus follows to the item the
 *   application chooses next.
 * - `summary` stands between the title and the list: the record the queue belongs to; a
 *   `WorklistSummary` (a thin strip of its figures, "3 of 10 done" with a bar, the application's
 *   check and, when nothing waits, its final action) or the application's own. The title row
 *   takes `back`, `status` and `subtitle`.
 * - Rows (the old WorklistItem): the title (sm semibold), a subtitle (xs text.secondary), one
 *   deciding figure at the end (sm medium, tabular) with the status badge under it; rows
 *   separated by border.subtle, padding sm by md. The chosen row is surface.selected with a 3px
 *   border.selected bar at its start (the neutral selection, AGENTS.md D17). The detail pane is
 *   optional.
 * - Decisions (Approve, Reject) stand only in the detail, where the item is seen whole, and in the
 *   bulk bar for checked rows — never in every row (P4.9, the owner's review). With
 *   `onCheckedChange` each row has a checkbox at its start (16px, a 24px target); `bulkBar` (a
 *   BulkActionBar) stands above the list while any row is checked.
 */

/** One item of the queue. */
export interface WorklistItem {
  id: string
  /** From the application ("F-2026-0412 · Drina Prevoz d.o.o."). */
  title: ReactNode
  subtitle?: ReactNode
  /** The one figure the decision depends on (an amount through MoneyText). */
  figure?: ReactNode
  /** A StatusBadge. */
  status?: ReactNode
  /** The item's name as plain text, for its checkbox ("UF-2026-1187"). Default: the title, if text. */
  label?: string
}

/** One of the queue's filters: a state of the items with how many are in it (the application's). */
export interface WorklistFilter {
  value: string
  /** "Needs you". */
  label: string
  /** How many items are in this state, counted by the application. */
  count: number
}

export interface WorklistPageProps {
  /** The page's title (h1). */
  title: string
  /** The title for screen readers only, when a module tab already names the page. Default false. */
  titleHidden?: boolean
  /** The page's actions at the end of the title row. */
  actions?: ReactNode
  /** The back button at the start of the title (the record's list). */
  back?: PageBack
  /** After the title: a StatusBadge (the record's state). */
  status?: ReactNode
  /** A line under the title. */
  subtitle?: ReactNode
  /**
   * Between the title and the list: what the queue belongs to (a `WorklistSummary`, KeyFigures,
   * a progress line). Below md it stands above the list and is not shown with an item's detail.
   */
  summary?: ReactNode
  /** Names the list for assistive technology ("Invoices to approve"). */
  label: string
  items: readonly WorklistItem[]
  /** The chosen item's id. */
  selected?: string
  onSelect?: (id: string) => void
  /** The chosen item's detail. Optional: a worklist may be a list alone. */
  detail?: ReactNode
  /**
   * The chosen item's decisions, the main one last ("Leave for later", "Confirm"). From md they
   * end the detail pane's bottom bar; below md WorklistPage does not show them: the application
   * puts them into AppShell's `bottomBar`, within thumb reach.
   */
  detailActions?: ReactNode
  /**
   * Enter on the queue's chosen row (from md): the item's main decision, as its main button
   * ("Confirm"); the application decides, then chooses the next item. Below md Enter opens the
   * item. Without it Enter chooses.
   */
  onConfirm?: (id: string) => void
  /** Below md: back from the detail to the list (the application clears `selected`). */
  onBack?: () => void
  /** To the previous item (the application chooses it, and whether the queue wraps around). */
  onPrevious?: () => void
  /** On to the next item. */
  onNext?: () => void
  /** At the top of the queue: its bulk action ("Accept all exact matches (6)") or a count. */
  toolbar?: ReactNode
  /** The queue's search text; with `onSearchChange` a search field stands above the rows. */
  search?: string
  /** Reports the typed text; the application narrows `items`. */
  onSearchChange?: (text: string) => void
  /** Names the search field (its placeholder too). Default `messages['worklist.search']`. */
  searchLabel?: string
  /**
   * The states to show, each with its count, as chips above the rows (one pressed). The first is
   * always "All" with every item's count (P5.96); the application opens the queue on the state
   * that needs the user.
   */
  filters?: readonly WorklistFilter[]
  /** The pressed filter's value. */
  filter?: string
  /** Reports the chosen filter; the application narrows `items`. */
  onFilterChange?: (value: string) => void
  /** Names the filter chips. Default `messages['worklist.filters']`. */
  filtersLabel?: string
  /** The checked rows' ids (for bulk decisions). */
  checked?: readonly string[]
  /** Gives every row a checkbox; reports the checked ids. */
  onCheckedChange?: (ids: string[]) => void
  /** Above the list while any row is checked: a BulkActionBar with the decisions. */
  bulkBar?: ReactNode
  /** Shown instead of the rows when there are none (an EmptyState). */
  empty?: ReactNode
  /** 'split' (list and detail side by side) or 'stacked'; default by the viewport (62em). */
  layout?: 'split' | 'stacked'
  className?: string
}

/** From this many items only the rows in view are drawn (P5.94 item 19). */
export const WORKLIST_WINDOW_FROM = 100

/** A row's estimated height before it is measured: a title, a subtitle, a figure and a badge. */
const ROW_HEIGHT = 72

/** The arrows of Previous and Next, pointing along the reading direction (mirrored in rtl). */
function ArrowStart(props: SVGProps<SVGSVGElement>) {
  return <ArrowLeft {...props} className={cn(props.className, 'rtl:-scale-x-100')} />
}
function ArrowEnd(props: SVGProps<SVGSVGElement>) {
  return <ArrowRight {...props} className={cn(props.className, 'rtl:-scale-x-100')} />
}

/** "3 of 11": the chosen item's place among the items, or null when none is chosen. */
export function worklistPosition(
  items: readonly { id: string }[],
  selected: string | undefined,
): { index: number; total: number } | null {
  const index = selected === undefined ? -1 : items.findIndex((item) => item.id === selected)
  return index < 0 ? null : { index: index + 1, total: items.length }
}

/**
 * Where a key moves the queue's focus from the row at `index` of `count`: ArrowDown and ArrowUp
 * by one (stopping at the ends), Home to the first, End to the last; null for any other key or an
 * empty queue.
 */
export function worklistKeyTarget(key: string, index: number, count: number): number | null {
  if (count === 0) return null
  const from = Math.min(Math.max(index, 0), count - 1)
  switch (key) {
    case 'ArrowDown':
      return Math.min(from + 1, count - 1)
    case 'ArrowUp':
      return Math.max(from - 1, 0)
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

/**
 * The item to open after `id` is decided: the first after it, in the queue's order and wrapping
 * around, that `waits` (still needs the user); null when none does. `id` itself is never the
 * answer. An `id` no longer in the queue starts from the beginning.
 */
export function nextWorklistItem<Item extends { id: string }>(
  items: readonly Item[],
  id: string | undefined,
  waits: (item: Item) => boolean,
): Item | null {
  const at = id === undefined ? -1 : items.findIndex((item) => item.id === id)
  const order = at < 0 ? items : [...items.slice(at + 1), ...items.slice(0, at)]
  return order.find((item) => item.id !== id && waits(item)) ?? null
}

function Row({
  item,
  index,
  count,
  selected,
  focusable,
  onSelect,
  onKeyDown,
  onFocusRow,
  check,
  measure,
}: {
  item: WorklistItem
  index: number
  count: number
  selected: boolean
  /** The roving tab stop of the queue. */
  focusable: boolean
  onSelect?: (id: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>, index: number) => void
  onFocusRow: (id: string) => void
  check?: { checked: boolean; onChange: (checked: boolean) => void }
  measure?: ((element: Element | null) => void) | undefined
}) {
  const { messages } = useLiro()
  const choose = () => onSelect?.(item.id)
  const name = item.label ?? (typeof item.title === 'string' ? item.title : item.id)
  return (
    <li
      ref={measure}
      data-index={index}
      data-worklist-row={item.id}
      aria-current={selected ? 'true' : undefined}
      aria-posinset={index + 1}
      aria-setsize={count}
      data-liro-surface={selected ? 'selected' : undefined}
      className={cn(
        'relative box-border flex items-start gap-3 border-0 border-b border-solid border-subtle px-4 py-3',
        selected
          ? "bg-surface-selected before:absolute before:inset-y-0 before:start-0 before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']"
          : 'hover:bg-surface-hover',
      )}
    >
      {check !== undefined && (
        // Outside the row's button; 16px with a 24px target, on the title's first line.
        <Checkbox
          checked={check.checked}
          onCheckedChange={(value) => {
            check.onChange(value === true)
          }}
          aria-label={messages['table.selectRow'](name)}
          className="mt-0.5 flex size-4 after:-inset-1 [&_svg]:size-2.5"
        />
      )}
      <div
        role="button"
        tabIndex={focusable ? 0 : -1}
        aria-pressed={selected}
        data-worklist-target=""
        onClick={choose}
        onFocus={() => {
          onFocusRow(item.id)
        }}
        onKeyDown={(event) => {
          onKeyDown(event, index)
        }}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-4 rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
            {item.title}
          </span>
          {item.subtitle !== undefined && (
            <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{item.subtitle}</span>
          )}
        </div>
        {(item.figure !== undefined || item.status !== undefined) && (
          <div className="flex shrink-0 flex-col items-end gap-1">
            {item.figure !== undefined && (
              <span className={cn('text-sm font-medium text-primary tabular-nums', TEXT_ISOLATE)}>
                {item.figure}
              </span>
            )}
            {item.status}
          </div>
        )}
      </div>
    </li>
  )
}

/**
 * The detail pane from md: it scrolls on its own and takes the focus only while it scrolls, so
 * the keyboard can scroll it (WCAG 2.1.1, axe scrollable-region-focusable), as DataTable's area.
 * Another item opens at its top.
 */
function DetailPane({
  label,
  item,
  children,
}: {
  label: string
  item: string | undefined
  children: ReactNode
}) {
  const pane = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const spacer = useSteadyBottom(content, item)
  const [scrolls, setScrolls] = useState(false)
  useEffect(() => {
    const element = pane.current
    if (element === null) return
    const measure = () => {
      setScrolls(element.scrollHeight > element.clientHeight)
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
  useLayoutEffect(() => {
    const element = pane.current
    if (element !== null) element.scrollTop = 0
  }, [item])
  return (
    <div
      ref={pane}
      {...(scrolls ? { tabIndex: 0, role: 'region', 'aria-label': label } : {})}
      className="min-h-0 min-w-0 flex-1 overflow-y-auto outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
    >
      <div ref={content}>{children}</div>
      <div ref={spacer} aria-hidden="true" />
    </div>
  )
}

/**
 * The detail below md, in the page's own scroll: its view stays steady as the item's content
 * shrinks, as the pane's does from md; another item opens with its top in view.
 */
function StackedDetail({ item, children }: { item: string | undefined; children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null)
  const spacer = useSteadyBottom(content, item)
  return (
    <div className="min-w-0">
      <div ref={content}>{children}</div>
      <div ref={spacer} aria-hidden="true" />
    </div>
  )
}

/**
 * The detail's bar from md. It publishes how far its top stands above the bottom of the window
 * as --liro-shell-bottom on the provider's root (as AppShell's bottom bar does on phones,
 * P4.9d), so a toast stands above the bar and never covers "Next" or the next decision.
 */
function DetailBar({ children }: { children: ReactNode }) {
  const bar = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = bar.current
    if (element === null) return
    const owner = element.closest<HTMLElement>('[data-liro-theme]') ?? element
    const measure = () => {
      const distance = Math.max(0, window.innerHeight - element.getBoundingClientRect().top)
      owner.style.setProperty('--liro-shell-bottom', `${String(Math.round(distance))}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      owner.style.removeProperty('--liro-shell-bottom')
    }
  }, [])
  return (
    <div
      ref={bar}
      data-slot="worklist-detail-bar"
      className="flex shrink-0 flex-wrap items-center gap-2 border-0 border-t border-solid border-default px-6 py-3"
    >
      {children}
    </div>
  )
}

/** A chip of the queue's filters (RoomRack's state chips): the label and the count. */
const CHIP =
  'inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-sm border border-solid px-2.5 text-sm whitespace-nowrap transition-colors'

/** The queue's search field: a search icon at the start, a clear button at the end. */
function QueueSearch({
  value,
  label,
  onChange,
}: {
  value: string
  label: string
  onChange: (text: string) => void
}) {
  const { messages } = useLiro()
  return (
    <div className="relative w-full">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 start-0 flex w-9 items-center justify-center text-secondary"
      >
        <Search className="size-3.75" />
      </span>
      <Input
        aria-label={label}
        placeholder={label}
        autoComplete="off"
        enterKeyHint="search"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        className={cn('ps-9', value !== '' && 'pe-9')}
      />
      {value !== '' && (
        <span className="absolute inset-y-0 end-1 flex items-center">
          <CompactIconButton
            intent="cancel"
            label={messages['filter.clearSearch']}
            onClick={() => {
              onChange('')
            }}
          />
        </span>
      )}
    </div>
  )
}

/** The queue's filters: one chip per state with its count, the chosen one pressed (neutral). */
function QueueFilters({
  filters,
  value,
  label,
  onChange,
}: {
  filters: readonly WorklistFilter[]
  value: string | undefined
  label: string
  onChange?: ((value: string) => void) | undefined
}) {
  const { format } = useLiro()
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const pressed = filter.value === value
        return (
          <button
            key={filter.value}
            type="button"
            aria-pressed={pressed}
            data-worklist-filter={filter.value}
            onClick={() => {
              if (!pressed) onChange?.(filter.value)
            }}
            className={cn(
              BUTTON_RESET,
              FOCUS_RING,
              CHIP,
              pressed
                ? 'border-selected bg-surface-selected text-primary'
                : 'border-default bg-surface-raised text-primary hover:bg-surface-hover',
            )}
          >
            <span className={TEXT_ISOLATE}>{filter.label}</span>
            <span className={cn('font-semibold text-secondary tabular-nums', TEXT_ISOLATE)}>
              {format.number(String(filter.count))}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** A queue processed item by item: the list and the chosen item's detail. */
export function WorklistPage(props: WorklistPageProps) {
  const { messages, format } = useLiro()
  const viewportNarrow = useBelowMd()
  const stacked = props.layout === undefined ? viewportNarrow : props.layout === 'stacked'
  const showDetail = props.detail !== undefined && props.selected !== undefined
  const items = props.items
  const windowed = items.length >= WORKLIST_WINDOW_FROM

  // The roving focus of the queue: the row that holds the tab stop. It follows the chosen item
  // (set while rendering, React's "adjust state when a prop changes"); back from an item below
  // md it stays on that item's row.
  const [focusId, setFocusId] = useState<string | undefined>(undefined)
  const [seenSelected, setSeenSelected] = useState(props.selected)
  if (seenSelected !== props.selected) {
    setSeenSelected(props.selected)
    setFocusId(props.selected ?? seenSelected)
  }
  const focusAt = (() => {
    const at = focusId === undefined ? -1 : items.findIndex((item) => item.id === focusId)
    if (at >= 0) return at
    const chosen =
      props.selected === undefined ? -1 : items.findIndex((item) => item.id === props.selected)
    return chosen >= 0 ? chosen : items.length > 0 ? 0 : -1
  })()
  const tabStop = items[focusAt]?.id

  const scroller = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const getKey = (index: number) => items[index]?.id ?? String(index)
  const paneWindow = useTreeWindow({
    count: items.length,
    scroller,
    rowHeight: ROW_HEIGHT,
    enabled: windowed && !stacked,
    focusIndex: focusAt < 0 ? null : focusAt,
    getKey,
  })
  const pageWindow = usePageWindow({
    count: items.length,
    list: listRef,
    rowHeight: ROW_HEIGHT,
    enabled: windowed && stacked && !showDetail,
    focusIndex: focusAt < 0 ? null : focusAt,
    getKey,
  })
  const rowWindow = stacked ? pageWindow : paneWindow

  // Whether the keyboard is in the queue: then the focus follows the item chosen next, also when
  // the chosen row leaves the queue (a removed element sends no focusout to tell).
  const queueFocused = useRef(false)
  const pendingFocus = useRef<string | null>(null)

  /** Brings the row at `index` into the queue's view (drawn first when windowed). */
  const reveal = (index: number) => {
    if (windowed) {
      rowWindow.scrollToIndex(index, { align: 'auto' })
      return
    }
    const id = items[index]?.id
    const row =
      id === undefined
        ? null
        : (listRef.current?.querySelector<HTMLElement>(`[data-worklist-row="${CSS.escape(id)}"]`) ??
          null)
    const box = scroller.current
    if (row === null || box === null || stacked) return
    const shown = box.getBoundingClientRect()
    const at = row.getBoundingClientRect()
    if (at.top < shown.top) box.scrollTop -= shown.top - at.top
    else if (at.bottom > shown.bottom) box.scrollTop += at.bottom - shown.bottom
  }

  const moveTo = (index: number) => {
    const target = items[index]
    if (target === undefined) return
    setFocusId(target.id)
    pendingFocus.current = target.id
    reveal(index)
    // From md the detail follows the queue's focus.
    if (!stacked) props.onSelect?.(target.id)
  }

  const onRowKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    const target = worklistKeyTarget(event.key, index, items.length)
    if (target !== null) {
      event.preventDefault()
      event.stopPropagation()
      moveTo(target)
      return
    }
    const item = items[index]
    if (item === undefined) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      if (
        event.key === 'Enter' &&
        !stacked &&
        props.onConfirm !== undefined &&
        item.id === props.selected
      ) {
        props.onConfirm(item.id)
      } else {
        props.onSelect?.(item.id)
      }
    }
  }

  // The chosen item changed (a decision opened the next one, Next, a key): the queue shows it,
  // and takes the focus to it when the keyboard was in the queue. Below md, back from an item to
  // the queue, its row is shown and takes the focus again.
  const shownSelected = useRef(props.selected)
  useLayoutEffect(() => {
    const before = shownSelected.current
    shownSelected.current = props.selected
    if (props.selected === before) return
    if (props.selected === undefined) {
      if (!stacked || before === undefined) return
      const index = items.findIndex((item) => item.id === before)
      if (index < 0) return
      pendingFocus.current = before
      if (windowed) rowWindow.scrollToIndex(index, { align: 'center' })
      return
    }
    const index = items.findIndex((item) => item.id === props.selected)
    if (index < 0) return
    if (!stacked) reveal(index)
    const active = document.activeElement
    const list = listRef.current
    const keyboardInQueue =
      queueFocused.current &&
      list !== null &&
      (active === null || active === document.body || list.contains(active))
    if (keyboardInQueue) pendingFocus.current = props.selected
  })

  // Whether the keyboard is in the queue (focusin / focusout on the list, as DataTable's rows).
  useEffect(() => {
    const list = listRef.current
    if (list === null) return
    const into = () => {
      queueFocused.current = true
    }
    const out = (event: FocusEvent) => {
      const next = event.relatedTarget
      if (next instanceof Node && !list.contains(next)) queueFocused.current = false
    }
    list.addEventListener('focusin', into)
    list.addEventListener('focusout', out)
    return () => {
      list.removeEventListener('focusin', into)
      list.removeEventListener('focusout', out)
    }
  })

  // Moves the focus once the row it goes to is drawn.
  useLayoutEffect(() => {
    const id = pendingFocus.current
    if (id === null) return
    const target = listRef.current?.querySelector<HTMLElement>(
      `[data-worklist-row="${CSS.escape(id)}"] [data-worklist-target]`,
    )
    if (target === null || target === undefined) return
    pendingFocus.current = null
    target.focus()
  })

  // Below md, another item opens with its top in view (under the shell's sticky top).
  const pageRoot = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const root = pageRoot.current
    if (!stacked || props.selected === undefined || root === null) return
    const shellTop =
      Number.parseFloat(getComputedStyle(root).getPropertyValue('--liro-shell-top')) || 0
    if (root.getBoundingClientRect().top < shellTop) root.scrollIntoView({ block: 'start' })
  }, [stacked, props.selected])

  const place = worklistPosition(items, props.selected)
  const position =
    place === null ? null : (
      <span
        data-slot="worklist-position"
        className={cn('shrink-0 text-sm text-secondary tabular-nums', TEXT_DIRECTION)}
      >
        {messages['worklist.position'](
          place.index,
          format.number(String(place.index)),
          place.total,
          format.number(String(place.total)),
        )}
      </span>
    )

  const checked = props.checked ?? []
  const onChecked = props.onCheckedChange

  const drawn: { index: number; before: number }[] = (() => {
    if (!windowed) return items.map((_, index) => ({ index, before: 0 }))
    const margin = stacked ? rowWindow.options.scrollMargin : 0
    const virtual = rowWindow
      .getVirtualItems()
      .map((each) => ({ index: each.index, start: each.start - margin, end: each.end - margin }))
    const { before } = spacersBetween(virtual, rowWindow.getTotalSize())
    return virtual.map((each, at) => ({ index: each.index, before: before[at] ?? 0 }))
  })()
  const after = (() => {
    if (!windowed) return 0
    const margin = stacked ? rowWindow.options.scrollMargin : 0
    const virtual = rowWindow
      .getVirtualItems()
      .map((each) => ({ start: each.start - margin, end: each.end - margin }))
    return spacersBetween(virtual, rowWindow.getTotalSize()).after
  })()

  const rows =
    items.length === 0 ? (
      props.empty
    ) : (
      <ul
        ref={listRef}
        aria-label={props.label}
        data-slot="worklist-queue"
        className="m-0 flex list-none flex-col p-0"
      >
        {drawn.map(({ index, before }) => {
          const item = items[index]
          if (item === undefined) return null
          return (
            <Fragment key={item.id}>
              {before > 0 && <li aria-hidden="true" style={{ height: before }} />}
              <Row
                item={item}
                index={index}
                count={items.length}
                selected={item.id === props.selected}
                focusable={item.id === tabStop}
                {...(props.onSelect === undefined ? {} : { onSelect: props.onSelect })}
                onKeyDown={onRowKeyDown}
                onFocusRow={setFocusId}
                measure={windowed ? rowWindow.measureElement : undefined}
                {...(onChecked === undefined
                  ? {}
                  : {
                      check: {
                        checked: checked.includes(item.id),
                        onChange: (on: boolean) => {
                          onChecked(
                            on ? [...checked, item.id] : checked.filter((id) => id !== item.id),
                          )
                        },
                      },
                    })}
              />
            </Fragment>
          )
        })}
        {after > 0 && <li aria-hidden="true" style={{ height: after }} />}
      </ul>
    )

  const hasTools =
    props.toolbar !== undefined ||
    props.onSearchChange !== undefined ||
    (props.filters !== undefined && props.filters.length > 0)
  const tools = hasTools && (
    <div
      data-slot="worklist-tools"
      className="flex shrink-0 flex-col gap-3 border-0 border-b border-solid border-subtle px-4 py-3"
    >
      {props.toolbar}
      {props.onSearchChange !== undefined && (
        <QueueSearch
          value={props.search ?? ''}
          label={props.searchLabel ?? messages['worklist.search']}
          onChange={props.onSearchChange}
        />
      )}
      {props.filters !== undefined && props.filters.length > 0 && (
        <QueueFilters
          filters={props.filters}
          value={props.filter}
          label={props.filtersLabel ?? messages['worklist.filters']}
          onChange={props.onFilterChange}
        />
      )}
    </div>
  )
  const bulk = props.bulkBar !== undefined && checked.length > 0 && (
    <div className="shrink-0 border-0 border-b border-solid border-subtle p-3">{props.bulkBar}</div>
  )

  const header = (
    <PageHeader
      title={props.title}
      {...(props.titleHidden === undefined ? {} : { titleHidden: props.titleHidden })}
      {...(props.back === undefined ? {} : { back: props.back })}
      {...(props.status === undefined ? {} : { status: props.status })}
      {...(props.subtitle === undefined ? {} : { subtitle: props.subtitle })}
      {...(props.actions === undefined ? {} : { actions: props.actions })}
    />
  )

  if (stacked) {
    return (
      <div
        ref={pageRoot}
        data-slot="worklist-page"
        className={cn(
          'box-border flex w-full scroll-mt-[var(--liro-shell-top,0px)] flex-col gap-4 p-4',
          props.className,
        )}
      >
        {showDetail ? (
          <>
            {/* The detail's header: back to the list; the position, Previous and Next. */}
            <div className="flex items-center gap-2">
              {props.onBack !== undefined && (
                <Button intent="back" label={messages['worklist.back']} onClick={props.onBack} />
              )}
              <div className="ms-auto flex items-center gap-2">
                {position}
                {props.onPrevious !== undefined && (
                  <IconButton
                    family="neutral"
                    icon={ArrowStart}
                    label={messages['worklist.previous']}
                    onClick={props.onPrevious}
                  />
                )}
                {props.onNext !== undefined && (
                  <IconButton
                    family="neutral"
                    icon={ArrowEnd}
                    label={messages['worklist.next']}
                    onClick={props.onNext}
                  />
                )}
              </div>
            </div>
            <StackedDetail item={props.selected}>{props.detail}</StackedDetail>
          </>
        ) : (
          <>
            {header}
            {props.summary}
            <div className="overflow-clip rounded-lg border border-solid border-default bg-surface-raised">
              {tools}
              {bulk}
              {rows}
            </div>
          </>
        )}
      </div>
    )
  }

  const bar =
    position !== null ||
    props.onPrevious !== undefined ||
    props.onNext !== undefined ||
    props.detailActions !== undefined
  return (
    <div
      data-slot="worklist-page"
      className={cn(
        'box-border flex h-[calc(100dvh-var(--liro-shell-top,0px))] w-full flex-col gap-4 p-6',
        props.className,
      )}
    >
      {header}
      {props.summary}
      <div
        className={cn(
          'grid min-h-0 flex-1 overflow-hidden rounded-lg border border-solid border-default bg-surface-raised',
          props.detail === undefined ? 'grid-cols-1' : 'grid-cols-[380px_minmax(0,1fr)]',
        )}
      >
        <div
          className={cn(
            'flex min-h-0 min-w-0 flex-col',
            props.detail !== undefined && 'border-0 border-e border-solid border-default',
          )}
        >
          {tools}
          {bulk}
          <div
            ref={scroller}
            data-slot="worklist-scroller"
            className="min-h-0 flex-1 overflow-y-auto [overflow-anchor:none]"
          >
            {rows}
          </div>
        </div>
        {props.detail !== undefined && (
          <div className="flex min-h-0 min-w-0 flex-col">
            <DetailPane label={messages['worklist.detail']} item={props.selected}>
              {props.detail}
            </DetailPane>
            {bar && (
              // The item's bar: where it stands, Previous and Next, then its decisions with the
              // main one last — always in view under the scrolling detail.
              <DetailBar>
                <div className="me-auto">{position}</div>
                {props.onPrevious !== undefined && (
                  <Button
                    family="neutral"
                    icon={ArrowStart}
                    label={messages['worklist.previous']}
                    onClick={props.onPrevious}
                  />
                )}
                {props.onNext !== undefined && (
                  <Button
                    family="neutral"
                    icon={ArrowEnd}
                    label={messages['worklist.next']}
                    onClick={props.onNext}
                  />
                )}
                {props.detailActions}
              </DetailBar>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── The record's strip ─────────────────────────────────────────────────────────────────────────

/** One figure of the record the queue belongs to ("Opening balance", an amount). */
export interface WorklistFact {
  key: string
  label: string
  /** Written by the application (MoneyText, NumberText). */
  value: ReactNode
}

export interface WorklistSummaryProps {
  /** The record's figures, in its order. */
  facts: readonly WorklistFact[]
  /** Items decided so far, of `total` (the application's counts). */
  done: number
  total: number
  /** The application's check in words, with its icon and tone ("Balance checks out"). */
  note?: ReactNode
  /**
   * The record's final action, given when nothing waits any more ("Post statement"); the main
   * action of the screen then.
   */
  action?: ReactNode
  /** 'phone' stacks the strip (two figures a row); default by the viewport (62em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/**
 * A thin strip above a worklist: the record's figures, "3 of 10 done" with a bar, the
 * application's check, and its final action once nothing waits (P5.94 item 19).
 */
export function WorklistSummary(props: WorklistSummaryProps) {
  const { messages, format } = useLiro()
  const viewportNarrow = useBelowMd()
  const phone = props.layout === undefined ? viewportNarrow : props.layout === 'phone'
  const progress = messages['worklist.done'](
    props.done,
    format.number(String(props.done)),
    props.total,
    format.number(String(props.total)),
  )
  return (
    <div
      data-slot="worklist-summary"
      className={cn(
        'box-border rounded-lg border border-solid border-default bg-surface-raised font-sans',
        phone
          ? 'flex flex-col gap-3 p-4'
          : 'flex flex-wrap items-center gap-x-8 gap-y-3 px-4 py-2.5',
        props.className,
      )}
    >
      <dl
        className={cn(
          'm-0',
          phone ? 'grid grid-cols-2 gap-x-4 gap-y-2' : 'flex flex-wrap gap-x-6 gap-y-2',
        )}
      >
        {props.facts.map((fact) => (
          <div key={fact.key} className="flex min-w-0 flex-col">
            <dt className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{fact.label}</dt>
            <dd className="m-0 text-sm font-semibold text-primary tabular-nums">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className={cn('flex min-w-0 flex-col gap-1.5', phone ? 'w-full' : 'w-44')}>
        <span className={cn('text-sm font-medium text-primary tabular-nums', TEXT_DIRECTION)}>
          {progress}
        </span>
        <ProgressBar label={progress} value={props.done} max={Math.max(props.total, 1)} />
      </div>
      {props.note !== undefined && <div className="min-w-0 text-xs">{props.note}</div>}
      {props.action !== undefined && (
        <div className={cn('flex', phone ? '[&>*]:flex-1' : 'ms-auto')}>{props.action}</div>
      )}
    </div>
  )
}
