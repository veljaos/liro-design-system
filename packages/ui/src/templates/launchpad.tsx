import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock } from 'lucide-react'
import { useEffect, useId, useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import type { IconComponent } from '../components/intents'
import { ButtonPrimitive } from '../primitives/button'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import {
  dropModule,
  isTyping,
  launchpadArrowTarget,
  launchpadDigitTarget,
  moveModule,
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
 *   remain (WCAG 2.5.7). Hidden modules are listed under the grid ("Hidden (2)") with "Show".
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

const CARD =
  'box-border flex min-h-33 flex-col rounded-lg border border-solid p-4 font-sans text-start no-underline'

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
  const { messages, direction, linkComponent: Link } = useLiro()
  const list = useRef<HTMLUListElement>(null)
  const [dragging, setDragging] = useState<string | null>(null)
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

  const dragProps = (module: LaunchpadModule) =>
    editing
      ? {
          draggable: true,
          onDragStart: (event: DragEvent) => {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', module.id)
            setDragging(module.id)
          },
          onDragOver: (event: DragEvent) => {
            if (dragging !== null) event.preventDefault()
          },
          onDrop: (event: DragEvent) => {
            event.preventDefault()
            if (dragging !== null) reorder(dropModule(ids, dragging, module.id))
            setDragging(null)
          },
          onDragEnd: () => {
            setDragging(null)
          },
        }
      : {}

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
      <ul ref={list} aria-label={props.label} className={cn('m-0 grid list-none gap-4 p-0', grid)}>
        {props.modules.map((module, index) => {
          const locked = module.locked !== undefined
          if (editing) {
            return (
              <li
                key={module.id}
                data-launchpad-card=""
                {...dragProps(module)}
                className={cn(
                  CARD,
                  'cursor-grab border-default bg-surface-raised',
                  dragging === module.id && 'border-strong bg-surface-sunken',
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
            {messages['launchpad.hidden'](hidden.length)}
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
