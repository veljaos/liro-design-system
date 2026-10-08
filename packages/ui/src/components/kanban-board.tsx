import { ArrowDown, ArrowUp, GripVertical, MoreHorizontal } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { DueDate } from './display-text'
import { DropdownMenu, type MenuEntry } from './dropdown-menu'
import {
  dragLayout,
  dropTarget,
  kanbanKeyTarget,
  moveCard,
  placeOf,
  type ColumnGeometry,
  type KanbanPlace,
} from './kanban-logic'
import { PersonAvatar } from './person'
import { SelectField } from './select-field'
import { usePhone } from './use-phone'

/*
 * KanbanBoard (BUILD-PLAN P5.7): cards in columns, moved by dragging, by the keyboard or from a
 * menu. The board shows what it is given and reports a move; the application decides.
 * - Columns 280px wide, 16px apart, from the leading edge; the board scrolls sideways inside its
 *   own box when they do not fit. A column is an area on surface.sunken (radius lg, 8px padding),
 *   not a card: the cards are the only cards (P4.9: no cards inside a card). Its heading (sm
 *   semibold) with the application's count ("4 tasks", a count with its noun) at the end.
 * - A card (raised, border.default, radius md, 12px): the title (a link to the task when it has
 *   `href`), a description line, a link to the record it is about (kind, number and state, P4.9
 *   rule 7), then the due date (DueDate: always the date), the application's meta ("3 comments")
 *   and the assignee's avatar at the end. Cards 8px apart. An empty column says so.
 * - Dragging (decisions.md "Launchpad dragging is live", the rule for every drag): pointer
 *   events, never the browser's drag and drop; a mouse drag starts after 4px, a touch after a
 *   250ms press without moving more than 8px (a swipe still scrolls). The card lifts (shadow lg,
 *   border.strong, the raised layer) and follows the pointer; the other cards make room with the
 *   slow motion token (250ms, 0ms under reduced motion); a neutral dashed border.strong
 *   placeholder marks where it lands. The place is measured on the laid-out columns
 *   (`dropTarget`), so right-to-left needs no mirroring. Escape or a cancelled pointer puts it
 *   back.
 * - The keyboard (WCAG 2.5.7, every drag has another way): each card's handle (GripVertical, 28px,
 *   named "Move: <title>", the instructions as its description). Space or Enter picks the card
 *   up; ArrowUp and ArrowDown move it within the column, the arrow pointing forward in the
 *   reading direction to the next column (B.7); Space or Enter drops it, Escape cancels. Each step
 *   is announced politely ("Software tasks: In progress, position 2 of 3").
 * - The menu (MoreHorizontal, 28px): "Move to" the other columns (the card goes to the end),
 *   Move up, Move down. On phones it is the main way.
 * - Phones: one column at a time, chosen in a select whose options carry the columns' counts.
 * - `onMove` reports the card, where it was and where it goes (the index counted without the
 *   card itself, as `moveCard` applies it).
 */

/** A card on the board, from the application. */
export interface KanbanCard {
  id: string
  /** The card's title, from the application. */
  title: string
  /** The task's own page: the title becomes a link (through the provider's `linkComponent`). */
  href?: string
  /** One or two lines under the title. */
  description?: string
  /** The person it is assigned to: the avatar at the card's end, named. */
  assignee?: { name: string; src?: string }
  /** The due date, YYYY-MM-DD: shown with DueDate (the date, and its state in words). */
  due?: string
  /** Done: the due date says "Settled" instead of a warning. */
  settled?: boolean
  /** The record the card is about: a link with its kind, number and state. */
  record?: { kind: string; number: string; state?: string; href: string }
  /** A short line from the application ("3 comments"), a count with its noun. */
  meta?: string
}

/** A column of the board, from the application. */
export interface KanbanColumn {
  id: string
  title: string
  cards: readonly KanbanCard[]
  /** The count with its noun, written by the application ("4 tasks"). */
  count?: string
}

/** A move: the card, where it was, and where it goes (index without the card itself). */
export interface KanbanMove {
  cardId: string
  from: KanbanPlace
  to: KanbanPlace
}

export interface KanbanBoardProps {
  columns: readonly KanbanColumn[]
  /** Names the board for assistive technology, from the application ("Tasks"). */
  label: string
  /** A card was moved; the application changes `columns` (or not). */
  onMove?: (move: KanbanMove) => void
  /** No moving: no handles, menus or dragging (a board the user may only read). */
  readOnly?: boolean
  /** Skeleton columns while the board loads. */
  loading?: boolean
  /** The columns' heading level in the page's outline. Default 2. */
  headingLevel?: 2 | 3 | 4
  /** Phones: the column shown (controlled); default the first. */
  column?: string
  onColumnChange?: (column: string) => void
  /** 'phone' shows one column at a time; default by the viewport (below 48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** The gap between cards (8px, spacing xs), which the drag layout needs. */
const GAP = 8

/** A drag in progress. */
interface DragState {
  cardId: string
  from: KanbanPlace
  target: KanbanPlace
  dx: number
  dy: number
  geometry: ColumnGeometry[]
}

/** A card picked up with the keyboard: where it was and where it is now. */
interface Lifted {
  cardId: string
  from: KanbanPlace
  at: KanbanPlace
}

/** The board: columns of cards; drag, keys or the menu move a card. */
export function KanbanBoard(props: KanbanBoardProps) {
  const { messages, format, direction, linkComponent: Link } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const board = useRef<HTMLDivElement>(null)
  const instructionsId = useId()
  const [drag, setDrag] = useState<DragState | null>(null)
  const [lifted, setLifted] = useState<Lifted | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [innerColumn, setInnerColumn] = useState<string | undefined>(undefined)
  const editable = props.readOnly !== true && props.onMove !== undefined
  const Heading = `h${String(props.headingLevel ?? 2)}` as 'h2'

  // What is shown: the board, with a card picked up by the keyboard at its new place.
  const shown = lifted === null ? props.columns : moveCard(props.columns, lifted.cardId, lifted.at)
  const shownColumnId =
    props.column ?? innerColumn ?? (lifted === null ? undefined : lifted.at.column)
  const phoneColumn = shown.find((column) => column.id === shownColumnId) ?? shown[0] ?? undefined

  const titleOf = (cardId: string) =>
    props.columns.flatMap((column) => column.cards).find((card) => card.id === cardId)?.title ?? ''
  const placeText = (place: KanbanPlace, cardId: string) => {
    const column = props.columns.find((each) => each.id === place.column)
    const total = (column?.cards.filter((card) => card.id !== cardId).length ?? 0) + 1
    return {
      column: column?.title ?? '',
      position: format.number(String(place.index + 1)),
      total: format.number(String(total)),
    }
  }
  const announce = (
    kind: 'kanban.lifted' | 'kanban.moved' | 'kanban.dropped',
    cardId: string,
    place: KanbanPlace,
  ) => {
    const text = placeText(place, cardId)
    setAnnouncement(messages[kind](titleOf(cardId), text.column, text.position, text.total))
  }
  const report = (cardId: string, from: KanbanPlace, to: KanbanPlace) => {
    if (from.column === to.column && from.index === to.index) return
    props.onMove?.({ cardId, from, to })
  }
  const showColumn = (column: string) => {
    setInnerColumn(column)
    props.onColumnChange?.(column)
  }

  // The handle keeps the focus while the card it belongs to moves between columns (React mounts
  // it anew in its new list).
  const focusAfterMove = useRef<string | null>(null)
  useEffect(() => {
    const id = focusAfterMove.current
    if (id === null) return
    focusAfterMove.current = null
    board.current?.querySelector<HTMLElement>(`[data-kanban-handle="${CSS.escape(id)}"]`)?.focus()
  })

  const onHandleKey = (event: KeyboardEvent<HTMLButtonElement>, card: KanbanCard) => {
    const from = placeOf(props.columns, card.id)
    if (from === null) return
    if (lifted?.cardId !== card.id) {
      if (event.key !== ' ' && event.key !== 'Enter') return
      event.preventDefault()
      setLifted({ cardId: card.id, from, at: from })
      announce('kanban.lifted', card.id, from)
      return
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      setLifted(null)
      announce('kanban.dropped', card.id, lifted.at)
      focusAfterMove.current = card.id
      report(card.id, lifted.from, lifted.at)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setLifted(null)
      setAnnouncement(messages['kanban.cancelled'](card.title))
      focusAfterMove.current = card.id
      if (phone) showColumn(lifted.from.column)
      return
    }
    const target = kanbanKeyTarget(event.key, lifted.at, props.columns, card.id, direction)
    if (target === null) {
      if (event.key.startsWith('Arrow')) event.preventDefault()
      return
    }
    event.preventDefault()
    setLifted({ ...lifted, at: target })
    if (phone) showColumn(target.column)
    focusAfterMove.current = card.id
    announce('kanban.moved', card.id, target)
  }

  const menuMove = (card: KanbanCard, to: KanbanPlace) => {
    const from = placeOf(props.columns, card.id)
    if (from === null) return
    report(card.id, from, to)
    announce('kanban.moved', card.id, to)
  }

  // Live dragging on pointer events (no browser ghost; touch after a short press).
  const startDrag = (event: PointerEvent<HTMLElement>, card: KanbanCard) => {
    if (!editable || lifted !== null || event.button !== 0) return
    if (event.target instanceof Element && event.target.closest('button, a') !== null) return
    const boardElement = board.current
    const from = placeOf(props.columns, card.id)
    if (boardElement === null || from === null) return
    const touch = event.pointerType === 'touch'
    const startX = event.clientX
    const startY = event.clientY
    let active = false
    let geometry: ColumnGeometry[] = []
    let current: DragState | null = null
    const activate = () => {
      const box = boardElement.getBoundingClientRect()
      geometry = Array.from(boardElement.querySelectorAll<HTMLElement>('[data-kanban-column]')).map(
        (columnElement) => {
          const rect = columnElement.getBoundingClientRect()
          const list = columnElement.querySelector<HTMLElement>('[data-kanban-list]')
          const listTop = (list?.getBoundingClientRect().top ?? rect.top) - box.top
          return {
            id: columnElement.dataset.kanbanColumn ?? '',
            x: rect.left - box.left,
            width: rect.width,
            top: listTop,
            cards: Array.from(
              columnElement.querySelectorAll<HTMLElement>('[data-kanban-card]'),
            ).map((cardElement) => {
              const cardRect = cardElement.getBoundingClientRect()
              return {
                id: cardElement.dataset.kanbanCard ?? '',
                y: cardRect.top - box.top,
                height: cardRect.height,
              }
            }),
          }
        },
      )
      active = true
      current = { cardId: card.id, from, target: from, dx: 0, dy: 0, geometry }
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
      if (active && commit && current !== null) report(card.id, from, current.target)
      setDrag(null)
    }
    const onMove = (move: globalThis.PointerEvent) => {
      const distance = Math.hypot(move.clientX - startX, move.clientY - startY)
      if (!active) {
        // A touch that moves before the press completes is a swipe: the page scrolls.
        if (touch) {
          if (distance > 8) finish(false)
          return
        }
        if (distance < 4) return
        activate()
      }
      const dx = move.clientX - startX
      const dy = move.clientY - startY
      const own = geometry
        .find((column) => column.id === from.column)
        ?.cards.find((each) => each.id === card.id)
      const column = geometry.find((each) => each.id === from.column)
      if (own === undefined || column === undefined) return
      const target =
        dropTarget(geometry, card.id, {
          x: column.x + column.width / 2 + dx,
          y: own.y + own.height / 2 + dy,
        }) ?? from
      current = { cardId: card.id, from, target, dx, dy, geometry }
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

  const layout = drag === null ? null : dragLayout(drag.geometry, drag.cardId, drag.target, GAP)

  const cardStyle = (card: KanbanCard): CSSProperties | undefined => {
    if (drag === null || layout === null) return undefined
    if (card.id === drag.cardId) {
      return { transform: `translate(${String(drag.dx)}px, ${String(drag.dy)}px)` }
    }
    const shift = layout.shifts[card.id] ?? 0
    return { transform: `translateY(${String(shift)}px)` }
  }

  if (props.loading === true) {
    return (
      <div
        aria-busy="true"
        aria-label={props.label}
        role="region"
        className={cn('flex gap-4 overflow-hidden', props.className)}
      >
        {Array.from({ length: phone ? 1 : 4 }, (_, index) => (
          <div
            key={index}
            className={cn(
              'flex shrink-0 flex-col gap-2 rounded-lg bg-surface-sunken p-2',
              phone ? 'w-full' : 'w-70',
            )}
          >
            <Skeleton className="m-1.5 h-4 w-24" />
            <Skeleton className="h-24 rounded-md" />
            <Skeleton className="h-24 rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  const renderCard = (card: KanbanCard, column: KanbanColumn, index: number) => {
    const isDragged = drag?.cardId === card.id
    const isLifted = lifted?.cardId === card.id
    const others = column.cards.filter((each) => each.id !== card.id)
    const position = isLifted ? lifted.at.index : index
    const menu: MenuEntry[] = [
      { type: 'label', label: messages['kanban.moveTo'] },
      ...shown
        .filter((each) => each.id !== column.id)
        .map((each) => ({
          label: messages['kanban.moveToColumn'](each.title),
          onSelect: () => {
            menuMove(card, {
              column: each.id,
              index: each.cards.filter((other) => other.id !== card.id).length,
            })
          },
        })),
      { type: 'separator' },
      {
        label: messages['kanban.moveUp'],
        icon: ArrowUp,
        disabled: position === 0,
        onSelect: () => {
          menuMove(card, { column: column.id, index: position - 1 })
        },
      },
      {
        label: messages['kanban.moveDown'],
        icon: ArrowDown,
        disabled: position >= others.length,
        onSelect: () => {
          menuMove(card, { column: column.id, index: position + 1 })
        },
      },
    ]
    return (
      <li
        key={card.id}
        data-kanban-card={card.id}
        {...(isDragged || isLifted ? { 'data-dragging': '' } : {})}
        onPointerDown={(event) => {
          startDrag(event, card)
        }}
        style={cardStyle(card)}
        className={cn(
          'relative box-border flex flex-col gap-1.5 rounded-md border border-solid bg-surface-raised p-3 text-start',
          editable && 'cursor-grab select-none',
          drag !== null &&
            !isDragged &&
            'transition-transform duration-(--liro-duration-slow) ease-standard',
          isDragged || isLifted
            ? 'z-(--liro-layer-raised) cursor-grabbing border-strong shadow-lg'
            : 'border-default',
        )}
      >
        <div className="flex items-start gap-2">
          {card.href === undefined ? (
            <span
              className={cn('min-w-0 flex-1 pt-1 text-sm font-medium text-primary', TEXT_DIRECTION)}
            >
              {card.title}
            </span>
          ) : (
            <Link
              href={card.href}
              className={cn(
                'min-w-0 flex-1 rounded-sm pt-1 text-sm font-medium text-primary no-underline visited:text-primary hover:text-primary hover:underline active:text-primary',
                FOCUS_RING,
                TEXT_DIRECTION,
              )}
            >
              {card.title}
            </Link>
          )}
          {editable && (
            <div className="-me-1 -mt-0.5 flex shrink-0">
              <ButtonPrimitive
                family="neutral"
                emphasis="menu"
                shape="compact"
                data-kanban-handle={card.id}
                aria-label={messages['kanban.moveCard'](card.title)}
                aria-describedby={instructionsId}
                aria-pressed={isLifted}
                title={messages['kanban.moveCard'](card.title)}
                onKeyDown={(event) => {
                  onHandleKey(event, card)
                }}
                onBlur={(event) => {
                  // Leaving the handle while the card is up (Tab) puts it back.
                  if (isLifted && event.relatedTarget !== null) {
                    setLifted(null)
                    setAnnouncement(messages['kanban.cancelled'](card.title))
                  }
                }}
                className="cursor-grab"
              >
                <GripVertical aria-hidden="true" className="size-4" />
              </ButtonPrimitive>
              <DropdownMenu
                align="end"
                entries={menu}
                trigger={
                  <ButtonPrimitive
                    family="neutral"
                    emphasis="menu"
                    shape="compact"
                    aria-label={messages['kanban.cardMenu'](card.title)}
                    title={messages['kanban.cardMenu'](card.title)}
                  >
                    <MoreHorizontal aria-hidden="true" className="size-4" />
                  </ButtonPrimitive>
                }
              />
            </div>
          )}
        </div>
        {card.description !== undefined && (
          <p className={cn('m-0 line-clamp-2 text-xs text-secondary', TEXT_DIRECTION)}>
            {card.description}
          </p>
        )}
        {card.record !== undefined && (
          <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
            <Link
              href={card.record.href}
              className={cn(
                'rounded-sm text-link no-underline visited:text-link hover:text-link hover:underline active:text-link',
                FOCUS_RING,
              )}
            >
              {card.record.kind} <bdi dir="ltr">{card.record.number}</bdi>
            </Link>
            {card.record.state !== undefined && <> · {card.record.state}</>}
          </p>
        )}
        {(card.due !== undefined || card.meta !== undefined || card.assignee !== undefined) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary">
            {card.due !== undefined && (
              <span className="text-xs">
                <DueDate value={card.due} {...(card.settled === true ? { settled: true } : {})} />
              </span>
            )}
            {card.meta !== undefined && <span className={TEXT_ISOLATE}>{card.meta}</span>}
            {card.assignee !== undefined && (
              <PersonAvatar
                name={card.assignee.name}
                alt={card.assignee.name}
                size="sm"
                className="ms-auto"
                {...(card.assignee.src === undefined ? {} : { src: card.assignee.src })}
              />
            )}
          </div>
        )}
      </li>
    )
  }

  const renderColumn = (column: KanbanColumn, wide: boolean) => {
    const headingId = `${instructionsId}-${column.id}`
    const placeholder =
      layout !== null && layout.placeholder.column === column.id ? layout.placeholder : null
    const extraRoom =
      drag !== null && placeholder !== null && drag.from.column !== column.id
        ? placeholder.height + GAP
        : 0
    return (
      <section
        key={column.id}
        data-kanban-column={column.id}
        aria-labelledby={headingId}
        className={cn(
          'box-border flex shrink-0 flex-col gap-2 rounded-lg bg-surface-sunken p-2',
          wide ? 'w-full' : 'w-70',
        )}
      >
        <div className="flex items-baseline justify-between gap-2 px-1.5 pt-1">
          <Heading
            id={headingId}
            className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}
          >
            {column.title}
          </Heading>
          {column.count !== undefined && (
            <span className={cn('text-xs text-secondary tabular-nums', TEXT_ISOLATE)}>
              {column.count}
            </span>
          )}
        </div>
        <ul
          data-kanban-list=""
          aria-labelledby={headingId}
          className="relative m-0 flex min-h-20 list-none flex-col gap-2 p-0"
          style={extraRoom > 0 ? { paddingBottom: extraRoom } : undefined}
        >
          {placeholder !== null && (
            // Where the dragged card lands: neutral, never blue (D17).
            <li
              aria-hidden="true"
              data-slot="kanban-drop-placeholder"
              className="pointer-events-none absolute inset-x-0 box-border rounded-md border-2 border-dashed border-strong bg-surface-sunken"
              style={{ top: placeholder.y, height: placeholder.height }}
            />
          )}
          {column.cards.map((card, index) => renderCard(card, column, index))}
          {column.cards.length === 0 && (
            <li
              className={cn(
                'flex min-h-20 items-center justify-center text-xs text-tertiary',
                TEXT_ISOLATE,
              )}
            >
              {messages['kanban.emptyColumn']}
            </li>
          )}
        </ul>
      </section>
    )
  }

  return (
    <div data-slot="kanban-board" className={cn('flex min-w-0 flex-col gap-3', props.className)}>
      <span id={instructionsId} className="sr-only">
        {messages['kanban.instructions']}
      </span>
      <div role="status" className="sr-only">
        {announcement}
      </div>
      {phone && phoneColumn !== undefined && (
        <SelectField
          label={messages['kanban.column']}
          value={phoneColumn.id}
          options={shown.map((column) => ({
            value: column.id,
            label: column.count === undefined ? column.title : `${column.title} · ${column.count}`,
          }))}
          onChange={(value) => {
            if (value !== '') showColumn(value)
          }}
        />
      )}
      <div
        ref={board}
        role="region"
        aria-label={props.label}
        className={cn('relative flex items-start gap-4', !phone && 'overflow-x-auto pb-2')}
      >
        {phone
          ? phoneColumn !== undefined && renderColumn(phoneColumn, true)
          : shown.map((column) => renderColumn(column, false))}
      </div>
    </div>
  )
}
