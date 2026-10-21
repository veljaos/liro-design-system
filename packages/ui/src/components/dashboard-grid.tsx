import { ChevronDown, GripVertical, MoreHorizontal, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  DropdownMenu as MenuRoot,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { dragTargetIndex, type CardSlot } from '../templates/launchpad-logic'
import {
  allowedSizes,
  cardSpan,
  dashboardKeyTarget,
  gridPlacement,
  layoutOf,
  moveCardTo,
  removeCard,
  resizeCard,
  type DashboardCardSize,
  type DashboardLayoutChange,
  type DashboardLayoutItem,
} from './dashboard-grid-logic'
import { EmptyState } from './empty-state'
import { usePhone } from './use-phone'

/*
 * DashboardGrid (P5.81): the cards of a dashboard the user arranges — the application's cards
 * (StatCard, the charts, a SectionCard with a table) in the user's order and sizes. The grid shows
 * what it is given and reports every change with the new layout (`onLayoutChange`); the
 * application keeps the draft, saves it on its "Done" and puts it back on its "Cancel". Added
 * because nothing arranged cards of different widths: Launchpad's editing mode moves and hides
 * module cards of one size, DashboardPage lays out a fixed set (docs/notes/P5.77-reports.md).
 * - Grid: `columns` columns (default 4) from md (62em), two from xs (36em), one below and always
 *   one in the phone layout; 16px apart. A card takes its size's columns (the application's
 *   sizes: "Small" 1, "Medium" 2, "Full width" 4), never more than the grid has (two in the
 *   two-column grid, one on phones). Cards stand in the user's order, the browser's placement
 *   (never "dense", so reading order is the visual order); heights follow the content.
 * - View mode: only the cards — the grid adds nothing around them.
 * - Editing (`editing`, switched on by the application's "Customize"): each card stands in a
 *   frame (radius lg, a 1px dashed border.strong, 8px padding) with a toolbar over its content —
 *   the handle (GripVertical, 28px, "Move: Revenue", the instructions as its description), the
 *   card's title (sm semibold), the size button (the size's name and a chevron: a menu of the
 *   sizes the card allows as radio items), the card's menu (Move earlier, Move later, Move to the
 *   start, Move to the end) and Remove (X, 28px). The content stays visible and inert (its links
 *   and buttons are not reached while arranging). Remove asks nothing: the application's Cancel
 *   puts the card back.
 * - Moving, three ways (WCAG 2.5.7): drag (decisions.md "Launchpad dragging is live": pointer
 *   events, a mouse after 4px, a touch after a 250ms press; the card lifts — shadow lg,
 *   border.strong, the raised layer — and follows the pointer, a neutral dashed placeholder of
 *   its size marks where it lands, the slot nearest its centre measured when the drag starts, so
 *   right-to-left needs no mirroring; Escape or a cancelled pointer puts it back); the keyboard
 *   on the handle (Space or Enter picks it up, the reading direction's forward arrow one place
 *   later, the other earlier, ArrowUp / ArrowDown to the card above or below as laid out, Home /
 *   End, Space or Enter drops, Escape cancels; each step announced politely); the card's menu.
 * - Phones: one column, every card full width; no dragging and no handle — the card's menu moves
 *   it, and the size button is left out (every size is the full width there).
 * - Loading: each card's place keeps its size with a skeleton. Empty: the application's `empty`,
 *   or EmptyState with `messages['dashboardGrid.empty']`.
 */

/** One card of the dashboard, from the application. */
export interface DashboardCard {
  id: string
  /** The card's name ("Revenue by month"): its toolbar's title and the buttons' names. */
  title: string
  /** The id of its size, one of the grid's `sizes`. */
  size: string
  /** The sizes this card may take (ids), in the application's order; all by default. */
  sizes?: readonly string[]
  /** What the card shows: the application's StatCard, chart or SectionCard. */
  content: ReactNode
}

export interface DashboardGridProps {
  /** Names the grid for assistive technology ("Director's overview"). */
  label: string
  /** The cards, in the user's order. */
  cards: readonly DashboardCard[]
  /** The sizes the application offers, smallest first. */
  sizes: readonly DashboardCardSize[]
  /** The grid's columns on a wide screen (md, 62em). Default 4. */
  columns?: number
  /** The editing mode: move, resize and remove. Switched on by the application. */
  editing?: boolean
  /** Every change in editing mode: the new layout (ids and sizes, in order) and what changed. */
  onLayoutChange?: (layout: DashboardLayoutItem[], change: DashboardLayoutChange) => void
  /** Skeletons in each card's place, keeping the sizes. */
  loading?: boolean
  /** Shown when there are no cards: the application's EmptyState with "Add card". */
  empty?: ReactNode
  /**
   * 'phone' forces one column and the phone's editing (menus only); default by the viewport:
   * one column on phones, two from xs (36em), `columns` from md (62em).
   */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** A drag in progress: the card, where it was, the place it would take and how far it moved. */
interface DragState {
  id: string
  from: number
  target: number
  dx: number
  dy: number
  slots: CardSlot[]
  /** The grid's width, to place the dragged card from the inline start. */
  width: number
}

/** A card picked up by the keyboard: where it was and where it is now. */
interface Lifted {
  id: string
  from: number
  at: number
}

/** The spans of a card as CSS variables: the wide grid's, and the two-column grid's. */
function spanStyle(span: number, columns: number): CSSProperties {
  return {
    '--liro-dash-span': String(Math.min(span, columns)),
    '--liro-dash-span-xs': String(Math.min(span, 2)),
  } as CSSProperties
}

const SPAN =
  'xs:[grid-column:span_var(--liro-dash-span-xs)] md:[grid-column:span_var(--liro-dash-span)]'

/** A dashboard whose cards the user adds, removes, resizes and rearranges. */
export function DashboardGrid(props: DashboardGridProps) {
  const { messages, format, direction } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const columns = Math.max(1, Math.floor(props.columns ?? 4))
  const editing = props.editing === true
  const instructionsId = useId()
  const list = useRef<HTMLUListElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [liftedCard, setLifted] = useState<Lifted | null>(null)
  // Leaving the editing mode puts a lifted card back.
  const lifted = editing ? liftedCard : null
  const [announcement, setAnnouncement] = useState('')
  const layout = layoutOf(props.cards)

  // The handle (or, after a removal, the next card's first button) keeps the focus when the card
  // moves or disappears: React draws the card in its new place.
  const focusAfter = useRef<string | null>(null)
  useEffect(() => {
    const target = focusAfter.current
    if (target === null) return
    focusAfter.current = null
    list.current
      ?.querySelector<HTMLElement>(`[data-dashboard-focus="${CSS.escape(target)}"]`)
      ?.focus()
  })

  const titleOf = (id: string) => props.cards.find((card) => card.id === id)?.title ?? ''
  const count = format.number(String(props.cards.length))
  const position = (index: number) => format.number(String(index + 1))
  const sizeLabel = (id: string) => props.sizes.find((size) => size.id === id)?.label ?? id

  const report = (next: DashboardLayoutItem[], change: DashboardLayoutChange) => {
    props.onLayoutChange?.(next, change)
  }
  const move = (id: string, to: number) => {
    const from = layout.findIndex((item) => item.id === id)
    if (from === -1 || to === from) return
    const next = moveCardTo(layout, id, to)
    const at = next.findIndex((item) => item.id === id)
    report(next, { kind: 'move', id, from, to: at })
    setAnnouncement(messages['dashboardGrid.moved'](titleOf(id), position(at), count))
  }

  // What is shown: the cards, with one lifted by the keyboard (or dragged) at its new place.
  const shownOrder =
    lifted !== null
      ? moveCardTo(layout, lifted.id, lifted.at).map((item) => item.id)
      : drag !== null
        ? moveCardTo(layout, drag.id, drag.target).map((item) => item.id)
        : layout.map((item) => item.id)
  const shown = shownOrder.flatMap((id) => {
    const card = props.cards.find((each) => each.id === id)
    return card === undefined ? [] : [card]
  })
  const wide = phone ? 1 : columns
  const spanOf = (card: DashboardCard) => cardSpan(card.size, props.sizes, wide)

  const onHandleKey = (event: KeyboardEvent<HTMLButtonElement>, card: DashboardCard) => {
    const from = layout.findIndex((item) => item.id === card.id)
    if (from === -1) return
    if (lifted?.id !== card.id) {
      if (event.key !== ' ' && event.key !== 'Enter') return
      event.preventDefault()
      setLifted({ id: card.id, from, at: from })
      setAnnouncement(messages['dashboardGrid.lifted'](card.title, position(from), count))
      return
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      setLifted(null)
      focusAfter.current = `handle:${card.id}`
      setAnnouncement(messages['dashboardGrid.dropped'](card.title, position(lifted.at), count))
      if (lifted.at !== lifted.from) {
        report(moveCardTo(layout, card.id, lifted.at), {
          kind: 'move',
          id: card.id,
          from: lifted.from,
          to: lifted.at,
        })
      }
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setLifted(null)
      focusAfter.current = `handle:${card.id}`
      setAnnouncement(messages['dashboardGrid.cancelled'](card.title))
      return
    }
    // The arrows move by the grid as it is laid out now: the wide grid's columns from md, two
    // from xs (the columns counted from the cards on the first row).
    const laidOut = columnsNow(list.current, wide)
    const places = gridPlacement(
      shown.map((each) => Math.min(spanOf(each), laidOut)),
      laidOut,
    )
    const target = dashboardKeyTarget(event.key, lifted.at, places, direction)
    if (target === null) {
      if (event.key.startsWith('Arrow')) event.preventDefault()
      return
    }
    event.preventDefault()
    setLifted({ ...lifted, at: target })
    focusAfter.current = `handle:${card.id}`
    setAnnouncement(messages['dashboardGrid.moved'](card.title, position(target), count))
  }

  // Live dragging on pointer events (no browser ghost; touch after a short press).
  const startDrag = (event: PointerEvent<HTMLElement>, card: DashboardCard, from: number) => {
    if (!editing || phone || lifted !== null || event.button !== 0) return
    if (
      event.target instanceof Element &&
      event.target.closest('button:not([data-dashboard-grip])') !== null
    ) {
      return
    }
    const listElement = list.current
    if (listElement === null) return
    const touch = event.pointerType === 'touch'
    const startX = event.clientX
    const startY = event.clientY
    let active = false
    let slots: CardSlot[] = []
    let current: DragState | null = null
    const activate = () => {
      const box = listElement.getBoundingClientRect()
      slots = Array.from(listElement.querySelectorAll<HTMLElement>('[data-dashboard-card]')).map(
        (element) => {
          const rect = element.getBoundingClientRect()
          return {
            x: rect.left - box.left,
            y: rect.top - box.top,
            width: rect.width,
            height: rect.height,
          }
        },
      )
      active = true
      current = { id: card.id, from, target: from, dx: 0, dy: 0, slots, width: box.width }
      setDrag(current)
    }
    const timer = touch ? window.setTimeout(activate, 250) : undefined
    const finish = (commit: boolean) => {
      window.clearTimeout(timer)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('touchmove', onTouchMove)
      if (active && commit && current !== null && current.target !== current.from) {
        move(current.id, current.target)
      }
      if (active && !commit) setAnnouncement(messages['dashboardGrid.cancelled'](card.title))
      setDrag(null)
    }
    const onMove = (pointer: globalThis.PointerEvent) => {
      const distance = Math.hypot(pointer.clientX - startX, pointer.clientY - startY)
      if (!active) {
        // A touch that moves before the press completes is a swipe: the page scrolls.
        if (touch) {
          if (distance > 8) finish(false)
          return
        }
        if (distance < 4) return
        activate()
      }
      const dx = pointer.clientX - startX
      const dy = pointer.clientY - startY
      const own = slots[from]
      if (own === undefined) return
      const target = dragTargetIndex(slots, {
        x: own.x + own.width / 2 + dx,
        y: own.y + own.height / 2 + dy,
      })
      current = { id: card.id, from, target, dx, dy, slots, width: current?.width ?? 0 }
      setDrag(current)
    }
    const onUp = () => {
      finish(true)
    }
    const onCancel = () => {
      finish(false)
    }
    const onKey = (key: globalThis.KeyboardEvent) => {
      if (key.key !== 'Escape' || !active) return
      key.preventDefault()
      key.stopPropagation()
      finish(false)
    }
    // While a touch drags, the page must not scroll under it.
    const onTouchMove = (touchMove: TouchEvent) => {
      if (active) touchMove.preventDefault()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
  }

  const gridClass = cn(
    'relative m-0 grid list-none gap-4 p-0',
    phone
      ? 'grid-cols-[minmax(0,1fr)]'
      : 'grid-cols-[minmax(0,1fr)] xs:grid-cols-[repeat(2,minmax(0,1fr))] md:grid-cols-[repeat(var(--liro-dash-columns),minmax(0,1fr))]',
  )
  const gridStyle = { '--liro-dash-columns': String(columns) } as CSSProperties

  if (props.cards.length === 0 && props.loading !== true) {
    return (
      <div data-slot="dashboard-grid" className={props.className}>
        {props.empty ?? <EmptyState title={messages['dashboardGrid.empty']} />}
      </div>
    )
  }

  if (props.loading === true) {
    return (
      <div data-slot="dashboard-grid" className={props.className}>
        <ul aria-label={props.label} aria-busy="true" className={gridClass} style={gridStyle}>
          {props.cards.map((card) => (
            <li
              key={card.id}
              className={cn('min-w-0', !phone && SPAN)}
              style={phone ? undefined : spanStyle(spanOf(card), columns)}
            >
              <Skeleton className="h-33 rounded-lg" />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const dragged = drag === null ? undefined : props.cards.find((card) => card.id === drag.id)
  const draggedSlot = drag === null ? undefined : drag.slots[drag.from]

  return (
    <div data-slot="dashboard-grid" className={cn('flex min-w-0 flex-col', props.className)}>
      {editing && (
        <>
          <span id={instructionsId} className="sr-only">
            {messages['dashboardGrid.instructions']}
          </span>
          <div role="status" className="sr-only">
            {announcement}
          </div>
        </>
      )}
      <ul ref={list} aria-label={props.label} className={gridClass} style={gridStyle}>
        {shown.map((card) => {
          const index = layout.findIndex((item) => item.id === card.id)
          const style = phone ? undefined : spanStyle(spanOf(card), columns)
          if (!editing) {
            return (
              <li
                key={card.id}
                data-dashboard-card=""
                className={cn('min-w-0', !phone && SPAN)}
                style={style}
              >
                {card.content}
              </li>
            )
          }
          if (drag?.id === card.id && draggedSlot !== undefined) {
            // Where the dragged card lands: its size, neutral, never blue (D17).
            return (
              <li
                key={card.id}
                aria-hidden="true"
                data-slot="dashboard-drop-placeholder"
                className={cn(
                  'box-border min-w-0 rounded-lg border-2 border-dashed border-strong bg-surface-sunken',
                  !phone && SPAN,
                )}
                style={{ ...style, height: draggedSlot.height }}
              />
            )
          }
          const isLifted = lifted?.id === card.id
          const sizes = allowedSizes(props.sizes, card.sizes)
          return (
            <li
              key={card.id}
              data-dashboard-card=""
              {...(isLifted ? { 'data-lifted': '' } : {})}
              onPointerDown={(event) => {
                startDrag(event, card, index)
              }}
              className={cn(
                'box-border flex min-w-0 flex-col gap-2 rounded-lg border border-dashed p-2',
                isLifted
                  ? 'z-(--liro-layer-raised) border-strong bg-surface-raised shadow-lg'
                  : 'border-strong',
                !phone && 'cursor-grab select-none',
                !phone && SPAN,
              )}
              style={style}
            >
              <div className="flex min-w-0 items-start gap-1">
                {!phone && (
                  <ButtonPrimitive
                    family="neutral"
                    emphasis="menu"
                    shape="compact"
                    data-dashboard-grip=""
                    data-dashboard-focus={`handle:${card.id}`}
                    aria-label={messages['dashboardGrid.moveCard'](card.title)}
                    aria-describedby={instructionsId}
                    aria-pressed={isLifted}
                    title={messages['dashboardGrid.moveCard'](card.title)}
                    onKeyDown={(event) => {
                      onHandleKey(event, card)
                    }}
                    onBlur={(event) => {
                      // Leaving the handle while the card is up (Tab) puts it back.
                      if (isLifted && event.relatedTarget !== null) {
                        setLifted(null)
                        setAnnouncement(messages['dashboardGrid.cancelled'](card.title))
                      }
                    }}
                    className="cursor-grab"
                  >
                    <GripVertical aria-hidden="true" className="size-4" />
                  </ButtonPrimitive>
                )}
                <span
                  className={cn(
                    'min-w-0 flex-1 pt-1 text-sm font-semibold break-words text-primary',
                    phone && 'ps-1',
                    TEXT_DIRECTION,
                  )}
                >
                  {card.title}
                </span>
                {!phone && sizes.length > 1 && (
                  <SizeMenu
                    card={card}
                    sizes={sizes}
                    label={sizeLabel(card.size)}
                    onChoose={(size) => {
                      if (size === card.size) return
                      report(resizeCard(layout, card.id, size), {
                        kind: 'resize',
                        id: card.id,
                        size,
                      })
                      setAnnouncement(
                        messages['dashboardGrid.resized'](card.title, sizeLabel(size)),
                      )
                    }}
                  />
                )}
                <CardMenu
                  card={card}
                  index={index}
                  count={layout.length}
                  focusId={`menu:${card.id}`}
                  onMove={(to) => {
                    focusAfter.current = `menu:${card.id}`
                    move(card.id, to)
                  }}
                />
                <ButtonPrimitive
                  family="neutral"
                  emphasis="menu"
                  shape="compact"
                  aria-label={messages['dashboardGrid.remove'](card.title)}
                  title={messages['dashboardGrid.remove'](card.title)}
                  onClick={() => {
                    const next = layout[index + 1] ?? layout[index - 1]
                    if (next !== undefined) focusAfter.current = `menu:${next.id}`
                    report(removeCard(layout, card.id), { kind: 'remove', id: card.id })
                    setAnnouncement(messages['dashboardGrid.removed'](card.title))
                  }}
                >
                  <X aria-hidden="true" className="size-4" />
                </ButtonPrimitive>
              </div>
              {/* What the card shows, as it will look; not reached while arranging. */}
              <div inert className="min-w-0">
                {card.content}
              </div>
            </li>
          )
        })}
        {dragged !== undefined && drag !== null && draggedSlot !== undefined && (
          // The dragged card follows the pointer from where it stood.
          <li
            aria-hidden="true"
            data-dragging=""
            className="pointer-events-none absolute z-(--liro-layer-raised) box-border flex cursor-grabbing flex-col gap-2 rounded-lg border border-dashed border-strong bg-surface-raised p-2 shadow-lg"
            style={{
              top: draggedSlot.y,
              insetInlineStart:
                direction === 'rtl'
                  ? drag.width - draggedSlot.x - draggedSlot.width
                  : draggedSlot.x,
              width: draggedSlot.width,
              height: draggedSlot.height,
              transform: `translate(${String(drag.dx)}px, ${String(drag.dy)}px)`,
            }}
          >
            <div className="flex min-w-0 items-start gap-1">
              <span className="flex size-7 shrink-0 items-center justify-center text-secondary">
                <GripVertical aria-hidden="true" className="size-4" />
              </span>
              <span
                className={cn(
                  'min-w-0 flex-1 pt-1 text-sm font-semibold text-primary',
                  TEXT_DIRECTION,
                )}
              >
                {dragged.title}
              </span>
            </div>
            <div inert className="min-w-0 overflow-hidden">
              {dragged.content}
            </div>
          </li>
        )}
      </ul>
    </div>
  )
}

/** The columns the grid has now: the cards on the first card's row add up to them. */
function columnsNow(listElement: HTMLUListElement | null, wide: number): number {
  if (listElement === null) return wide
  const template = getComputedStyle(listElement).gridTemplateColumns
  const counted = template.split(' ').filter((part) => part.trim() !== '').length
  return counted > 0 ? Math.min(counted, wide) : wide
}

/** The size button: the current size's name and a menu of the sizes the card allows. */
function SizeMenu({
  card,
  sizes,
  label,
  onChoose,
}: {
  card: DashboardCard
  sizes: readonly DashboardCardSize[]
  label: string
  onChoose: (size: string) => void
}) {
  const { messages } = useLiro()
  return (
    <MenuRoot modal={false}>
      <DropdownMenuTrigger asChild>
        <ButtonPrimitive
          family="neutral"
          emphasis="menu"
          aria-label={messages['dashboardGrid.sizeOf'](label, card.title)}
          className="min-h-7 shrink-0 gap-1 py-0 ps-2 pe-1.5 text-xs"
        >
          <span className={TEXT_DIRECTION}>{label}</span>
          <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
        </ButtonPrimitive>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{messages['dashboardGrid.size']}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={card.size} onValueChange={onChoose}>
          {sizes.map((size) => (
            <DropdownMenuRadioItem key={size.id} value={size.id} check>
              {size.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </MenuRoot>
  )
}

/** The card's menu: the ways to move it without dragging. */
function CardMenu({
  card,
  index,
  count,
  focusId,
  onMove,
}: {
  card: DashboardCard
  index: number
  count: number
  focusId: string
  onMove: (to: number) => void
}) {
  const { messages } = useLiro()
  const first = index <= 0
  const last = index >= count - 1
  return (
    <MenuRoot modal={false}>
      <DropdownMenuTrigger asChild>
        <ButtonPrimitive
          family="neutral"
          emphasis="menu"
          shape="compact"
          data-dashboard-focus={focusId}
          aria-label={messages['dashboardGrid.cardMenu'](card.title)}
          title={messages['dashboardGrid.cardMenu'](card.title)}
        >
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </ButtonPrimitive>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={first}
          onSelect={() => {
            onMove(index - 1)
          }}
        >
          {messages['dashboardGrid.moveEarlier']}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={last}
          onSelect={() => {
            onMove(index + 1)
          }}
        >
          {messages['dashboardGrid.moveLater']}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={first}
          onSelect={() => {
            onMove(0)
          }}
        >
          {messages['dashboardGrid.moveFirst']}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={last}
          onSelect={() => {
            onMove(count - 1)
          }}
        >
          {messages['dashboardGrid.moveLast']}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </MenuRoot>
  )
}
