import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import type { IconComponent } from '../components/intents'
import { ButtonPrimitive } from '../primitives/button'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import {
  dragTargetIndex,
  isTyping,
  launchpadArrowTarget,
  launchpadDigitTarget,
  moveModule,
  moveModuleTo,
  slotShift,
  type CardSlot,
} from './launchpad-logic'

/*
 * Launchpad (BUILD-PLAN P4.2; the owner's values, docs/decisions.md "Launchpad"): the home of
 * the application, a grid of module cards (navigation is the launchpad and module tabs, never a
 * sidebar, Appendix B.8).
 * - Grid: one column on phones, two from xs (36em), three from sm (48em), 16px (md) apart.
 * - Card: radius lg, padding md, a 1px border.default border on the raised surface, 132px high at
 *   least (the skeleton's height). Top row: the module's 20px icon in a 40px square
 *   (surface.sunken, 10px padding, 10px radius — the old Liro Business App detail; the icon in
 *   text.primary) at the start, the counter at the end (xs, medium, text.secondary, plain text).
 *   Then 16px (md) and the name (sm, bold), and an optional one-line description (xs,
 *   text.secondary) 2px under it.
 * - Hover: border.strong, no shadow; the icon square turns brand.solid with the icon in
 *   brand.onSolid (the old detail that says the card can be opened); colours change in the base
 *   duration with the standard easing. Focus: the standard ring.
 * - Locked: surface.sunken, border.default, not a link, no hover change; a 12px Lock and the
 *   application's text ("Available in Pro") in normal case where the counter stands.
 * - Keys: 1–9 open the first nine modules (outside fields, without modifiers); the arrows move
 *   between cards (left and right in reading order, up and down by a row), Home and End.
 * - Editing (`editing`, switched on by the application): each card shows three 28px buttons —
 *   move earlier, move later, hide — and is not a link; dragging also reorders, the buttons always
 *   remain (WCAG 2.5.7). Dragging is live (P4.9, owner): pointer events, not the browser's drag
 *   and drop, so there is no grey ghost and touch works (a 250ms press first, so a swipe still
 *   scrolls); the dragged card lifts (shadow lg) and follows the pointer, the others slide to
 *   their new places in the slow duration (0ms under reduced motion, the token), and a dashed
 *   border.strong placeholder on surface.sunken shows where it lands. The target is the slot
 *   nearest to the card's centre, measured on the laid-out grid, so it holds in right-to-left
 *   (B.7). Escape or a cancelled pointer puts everything back. Hidden modules are listed under the grid ("Hidden (2)") with "Show".
 *   The application's page header holds "Customize" and "Done", which switch the mode. Every
 *   change is reported through a callback.
 * - Loading: skeleton cards, 132px high.
 */

/** One module of the launchpad. */
export interface LaunchpadModule {
  id: string
  /** The module's name, from the application. */
  name: string
  /** One line under the name, from the application. */
  description?: string
  /** The module's lucide icon. */
  icon: IconComponent
  /** Where the card leads (through the provider's `linkComponent`). */
  href: string
  /** The counter at the card's end, written by the application ("3 waiting"). */
  counter?: string
  /** Locks the card and says why, from the application ("Available in Pro"). */
  locked?: string
}

export interface LaunchpadProps {
  /** The visible modules, in the user's order. */
  modules: readonly LaunchpadModule[]
  /** Names the grid for assistive technology, from the application (e.g. "Modules"). */
  label: string
  /** The modules the user hid; listed in editing mode with "Show". */
  hidden?: readonly LaunchpadModule[]
  /** Skeleton cards instead of modules. */
  loading?: boolean
  /** How many skeleton cards. Default 6. */
  skeletonCount?: number
  /** The editing mode: reorder and hide. Switched on by the application. */
  editing?: boolean
  /**
   * 'phone' forces one column (a narrow frame at desktop width); default: by the viewport —
   * one column on phones, two from xs (36em), three from sm (48em).
   */
  layout?: 'desktop' | 'phone'
  /** The new order of the visible modules' ids. */
  onReorder?: (ids: string[]) => void
  onHide?: (id: string) => void
  onShow?: (id: string) => void
  className?: string
}

/** A drag in progress: the card, its place, the place it would take and how far it moved. */
interface DragState {
  id: string
  from: number
  target: number
  dx: number
  dy: number
  slots: CardSlot[]
  /** The list's width, to place the placeholder from the inline start. */
  width: number
}

const CARD =
  'box-border flex min-h-33 flex-col rounded-lg border border-solid p-4 font-sans text-start text-primary no-underline visited:text-primary'

function ModuleIcon({ icon: Icon, locked }: { icon: IconComponent; locked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-[10px] text-primary',
        locked
          ? 'bg-surface-raised'
          : 'bg-surface-sunken transition-colors duration-(--liro-duration-base) ease-standard group-hover:bg-brand-solid group-hover:text-brand-on-solid',
      )}
    >
      <Icon className="size-5" />
    </span>
  )
}

function CardText({ module }: { module: LaunchpadModule }) {
  return (
    <span className="mt-4 flex min-w-0 flex-col gap-0.5">
      <span className={cn('text-sm font-bold text-primary', TEXT_DIRECTION)}>{module.name}</span>
      {module.description !== undefined && (
        <span className={cn('truncate text-xs text-secondary', TEXT_DIRECTION)}>
          {module.description}
        </span>
      )}
    </span>
  )
}

function Counter({ module }: { module: LaunchpadModule }) {
  if (module.locked !== undefined) {
    return (
      <span className="flex min-w-0 items-center gap-1 text-xs font-medium text-secondary">
        <Lock aria-hidden="true" className="size-3 shrink-0" />
        <span className={TEXT_DIRECTION}>{module.locked}</span>
      </span>
    )
  }
  if (module.counter === undefined) return null
  return (
    <span
      className={cn(
        'min-w-0 text-end text-xs font-medium break-words text-secondary tabular-nums',
        TEXT_DIRECTION,
      )}
    >
      {module.counter}
    </span>
  )
}

/** The columns of the grid as laid out: the cards on the first card's row. */
function columnsOf(cards: readonly HTMLElement[]): number {
  const top = cards[0]?.offsetTop
  return Math.max(1, cards.filter((card) => card.offsetTop === top).length)
}

/** The home screen: the modules as cards; 1–9 and the arrows open and move. */
export function Launchpad(props: LaunchpadProps) {
  const { messages, direction, format, linkComponent: Link } = useLiro()
  const list = useRef<HTMLUListElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const hiddenHeading = useId()
  const editing = props.editing === true
  const grid =
    props.layout === 'phone' ? 'grid-cols-1' : 'grid-cols-1 xs:grid-cols-2 sm:grid-cols-3'
  const ids = props.modules.map((module) => module.id)

  const cards = () =>
    Array.from(list.current?.querySelectorAll<HTMLElement>('[data-launchpad-card]') ?? [])

  // 1–9 open a module from anywhere on the page, except while typing or in a dialog or menu.
  useEffect(() => {
    if (editing || props.loading === true) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return
      if (isTyping(event.target)) return
      if (
        event.target instanceof Element &&
        event.target.closest('[role="dialog"], [role="alertdialog"], [role="menu"]') !== null
      ) {
        return
      }
      const index = launchpadDigitTarget(event.key, cards().length)
      if (index === null) return
      const card = cards()[index]
      if (card?.tagName !== 'A') return
      event.preventDefault()
      card.focus()
      card.click()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [editing, props.loading])

  const onArrow = (event: KeyboardEvent<HTMLElement>) => {
    if (editing) return
    const all = cards()
    const index = all.findIndex((card) => card === document.activeElement)
    if (index === -1) return
    const target = launchpadArrowTarget(event.key, index, all.length, columnsOf(all), direction)
    if (target === null) return
    event.preventDefault()
    all[target]?.focus()
  }

  const reorder = (next: string[]) => {
    if (next.join('\u0000') !== ids.join('\u0000')) props.onReorder?.(next)
  }

  // Live dragging on pointer events (no browser ghost; touch after a short press).
  const startDrag = (event: PointerEvent<HTMLElement>, module: LaunchpadModule, from: number) => {
    if (!editing || event.button !== 0) return
    if (event.target instanceof Element && event.target.closest('button') !== null) return
    const listElement = list.current
    if (listElement === null) return
    const touch = event.pointerType === 'touch'
    const startX = event.clientX
    const startY = event.clientY
    let active = false
    let slots: CardSlot[] = []
    let current: DragState | null = null
    const relative = (x: number, y: number) => {
      const box = listElement.getBoundingClientRect()
      return { x: x - box.left, y: y - box.top }
    }
    const start = relative(startX, startY)
    const activate = () => {
      const box = listElement.getBoundingClientRect()
      slots = cards().map((card) => {
        const rect = card.getBoundingClientRect()
        return {
          x: rect.left - box.left,
          y: rect.top - box.top,
          width: rect.width,
          height: rect.height,
        }
      })
      active = true
      current = { id: module.id, from, target: from, dx: 0, dy: 0, slots, width: box.width }
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
      if (active && commit && current !== null) {
        reorder(moveModuleTo(ids, current.id, current.target))
      }
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
      const point = relative(move.clientX, move.clientY)
      const dx = point.x - start.x
      const dy = point.y - start.y
      const own = slots[from]
      if (own === undefined) return
      const target = dragTargetIndex(slots, {
        x: own.x + own.width / 2 + dx,
        y: own.y + own.height / 2 + dy,
      })
      current = { id: module.id, from, target, dx, dy, slots, width: current?.width ?? 0 }
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

  const shown = drag === null ? ids : moveModuleTo(ids, drag.id, drag.target)

  /** Where an editing card stands while another is dragged, or how far the dragged one moved. */
  const dragStyle = (id: string, index: number): CSSProperties | undefined => {
    if (drag === null) return undefined
    const shift =
      id === drag.id ? { x: drag.dx, y: drag.dy } : slotShift(drag.slots, index, shown.indexOf(id))
    return { transform: `translate(${String(shift.x)}px, ${String(shift.y)}px)` }
  }

  const placeholder = drag === null ? undefined : drag.slots[drag.target]

  if (props.loading === true) {
    return (
      <div
        aria-busy="true"
        aria-label={props.label}
        role="region"
        className={cn('grid gap-4', grid, props.className)}
      >
        {Array.from({ length: props.skeletonCount ?? 6 }, (_, index) => (
          <Skeleton key={index} className="h-33 rounded-lg" />
        ))}
      </div>
    )
  }

  const hidden = props.hidden ?? []

  return (
    <div className={cn('flex flex-col gap-6', props.className)}>
      <ul
        ref={list}
        aria-label={props.label}
        className={cn('relative m-0 grid list-none gap-4 p-0', grid)}
      >
        {placeholder !== undefined && drag !== null && (
          // Where the dragged card lands: neutral, never blue (D17).
          <li
            aria-hidden="true"
            data-slot="launchpad-drop-placeholder"
            className="pointer-events-none absolute box-border rounded-lg border-2 border-dashed border-strong bg-surface-sunken"
            style={{
              top: placeholder.y,
              insetInlineStart:
                direction === 'rtl'
                  ? drag.width - placeholder.x - placeholder.width
                  : placeholder.x,
              width: placeholder.width,
              height: placeholder.height,
            }}
          />
        )}
        {props.modules.map((module, index) => {
          const locked = module.locked !== undefined
          if (editing) {
            return (
              <li
                key={module.id}
                data-launchpad-card=""
                {...(drag?.id === module.id ? { 'data-dragging': '' } : {})}
                onPointerDown={(event) => {
                  startDrag(event, module, index)
                }}
                style={dragStyle(module.id, index)}
                className={cn(
                  CARD,
                  'relative cursor-grab border-default bg-surface-raised select-none',
                  drag !== null &&
                    drag.id !== module.id &&
                    'transition-transform duration-(--liro-duration-slow) ease-standard',
                  drag?.id === module.id &&
                    'z-(--liro-layer-raised) cursor-grabbing border-strong shadow-lg',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <ModuleIcon icon={module.icon} locked={locked} />
                  <div className="flex gap-1">
                    <EditButton
                      label={messages['launchpad.moveEarlier'](module.name)}
                      icon={ArrowLeft}
                      mirrored
                      disabled={index === 0}
                      onClick={() => {
                        reorder(moveModule(ids, module.id, -1))
                      }}
                    />
                    <EditButton
                      label={messages['launchpad.moveLater'](module.name)}
                      icon={ArrowRight}
                      mirrored
                      disabled={index === props.modules.length - 1}
                      onClick={() => {
                        reorder(moveModule(ids, module.id, 1))
                      }}
                    />
                    <EditButton
                      label={messages['launchpad.hide'](module.name)}
                      icon={EyeOff}
                      onClick={() => props.onHide?.(module.id)}
                    />
                  </div>
                </div>
                <CardText module={module} />
              </li>
            )
          }
          if (locked) {
            return (
              <li key={module.id}>
                {/* Announced as a link that cannot be followed, with its reason in its text. */}
                <div
                  data-launchpad-card=""
                  role="link"
                  aria-disabled="true"
                  tabIndex={-1}
                  onKeyDown={onArrow}
                  className={cn(CARD, 'h-full border-default bg-surface-sunken outline-none')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <ModuleIcon icon={module.icon} locked />
                    <Counter module={module} />
                  </div>
                  <CardText module={module} />
                </div>
              </li>
            )
          }
          return (
            <li key={module.id}>
              <Link
                href={module.href}
                data-launchpad-card=""
                onKeyDown={onArrow}
                {...(index < 9 ? { 'aria-keyshortcuts': String(index + 1) } : {})}
                className={cn(
                  CARD,
                  'group h-full border-default bg-surface-raised transition-colors duration-(--liro-duration-base) ease-standard hover:border-strong',
                  FOCUS_RING,
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  <ModuleIcon icon={module.icon} locked={false} />
                  <Counter module={module} />
                </span>
                <CardText module={module} />
              </Link>
            </li>
          )
        })}
      </ul>
      {editing && hidden.length > 0 && (
        <section aria-labelledby={hiddenHeading} className="flex flex-col gap-3">
          <h2 id={hiddenHeading} className={cn('m-0 text-h5 text-secondary', TEXT_DIRECTION)}>
            {messages['launchpad.hidden'](hidden.length, format.number(String(hidden.length)))}
          </h2>
          <ul className="m-0 flex list-none flex-col p-0">
            {hidden.map((module) => {
              const Icon = module.icon
              return (
                <li
                  key={module.id}
                  className="flex items-center gap-3 border-0 border-b border-solid border-subtle py-2 last:border-b-0"
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0 text-secondary" />
                  <span className={cn('min-w-0 flex-1 text-sm text-primary', TEXT_DIRECTION)}>
                    {module.name}
                  </span>
                  <ButtonPrimitive
                    family="neutral"
                    emphasis="secondary"
                    aria-label={messages['launchpad.show'](module.name)}
                    onClick={() => props.onShow?.(module.id)}
                    className="min-h-control-sm gap-2 px-3.5 text-xs"
                  >
                    <Eye aria-hidden="true" className="size-3 shrink-0" />
                    <span className={TEXT_DIRECTION}>{messages['launchpad.showLabel']}</span>
                  </ButtonPrimitive>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}

function EditButton({
  label,
  icon: Icon,
  mirrored = false,
  disabled = false,
  onClick,
}: {
  label: string
  icon: IconComponent
  mirrored?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <ButtonPrimitive
      family="neutral"
      emphasis="menu"
      shape="compact"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon aria-hidden="true" className={cn('size-4', mirrored && 'rtl:-scale-x-100')} />
    </ButtonPrimitive>
  )
}
