import {
  Fragment,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { flushSync } from 'react-dom'
import { BUTTON_SHAPES, ButtonPrimitive } from '../primitives/button'
import { cn } from '../primitives/cn'
import { TEXT_DIRECTION } from '../primitives/classes'
import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../primitives/tooltip'
import { useLiro } from '../provider/liro-provider'
import { visibleActions } from './action-logic'
import { Button, IconButton } from './button'
import { DropdownMenu, type MenuEntry } from './dropdown-menu'
import { INTENTS, type Emphasis, type Family, type IconComponent, type Intent } from './intents'

/*
 * ActionGroup and UnavailableAction (BUILD-PLAN P2.7), the previous Design System's (owner's
 * decision, 2026-09-28, docs/decisions.md "Actions"):
 * - ActionGroup: a wrapping row, 8px (xs) apart, centred vertically, aligned to the END by
 *   default (the main action sits at the end, where the eye and the thumb expect it); `align`
 *   'start' only beside text. New here, as the plan asks: on a narrow row the actions before the
 *   main one move into a "More" menu, the main action staying visible and last.
 * - UnavailableAction: disabled, with its reason as visible text beside the button (the plan)
 *   and in a tooltip (the old system: 240px wide, several lines, with the arrow), which opens on
 *   hover, on keyboard focus and on touch. The button is `aria-disabled` rather than `disabled`,
 *   so it can take the focus and the reason can be read; pressing it does nothing.
 */

/** An action, as Button takes it. */
export type ActionItem = {
  /** A stable key. */
  key: string
  /** From the application. */
  label: string
  onClick?: () => void
  /** Weight within the family's rules (AGENTS.md D13). */
  emphasis?: Emphasis
  /** Makes it unavailable, with this reason (from the application) beside it and in a tooltip. */
  unavailableReason?: string
} & (
  | { intent: Intent; family?: never; icon?: never }
  | { family: Family; icon: IconComponent; intent?: never }
)

/** Omit that keeps a union a union, so intent and family stay distinct. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

type ActionLook = DistributiveOmit<ActionItem, 'key' | 'label' | 'onClick' | 'unavailableReason'>

/** The intent, or the family and icon, of an action, as Button props. */
function look(action: ActionLook) {
  const emphasis = action.emphasis === undefined ? {} : { emphasis: action.emphasis }
  return action.intent === undefined
    ? { family: action.family, icon: action.icon, ...emphasis }
    : { intent: action.intent, ...emphasis }
}

/** Mantine Button 'xs' (30px, 14px padding, 12px text, 12px icon), for bars. */
const SMALL = 'min-h-control-sm gap-2 px-3.5 text-xs'

/**
 * An action's button: the button primitive in the action's family and weight, with its icon
 * (15px, 12px small) and label. Other attributes (a Radix trigger's, aria-disabled) pass through.
 */
export function ActionButton({
  action,
  small = false,
  ...rest
}: { action: ActionLook & { label: string }; small?: boolean } & Omit<
  ComponentProps<'button'>,
  'children'
>) {
  const intent = action.intent === undefined ? undefined : INTENTS[action.intent]
  const family = intent?.family ?? action.family ?? 'neutral'
  const emphasis = action.emphasis ?? intent?.emphasis ?? 'secondary'
  const Icon = intent?.icon ?? action.icon
  return (
    <ButtonPrimitive
      family={family}
      emphasis={emphasis}
      {...(action.intent === undefined ? {} : { 'data-intent': action.intent })}
      {...rest}
      className={cn(small && SMALL, rest.className)}
    >
      {Icon !== undefined && (
        <Icon
          aria-hidden="true"
          className={cn(
            small ? 'size-3 shrink-0' : BUTTON_SHAPES.text.icon,
            intent?.mirrorsInRtl === true && 'rtl:-scale-x-100',
          )}
        />
      )}
      <span className={TEXT_DIRECTION}>{action.label}</span>
    </ButtonPrimitive>
  )
}

export type UnavailableActionProps = DistributiveOmit<
  ActionItem,
  'key' | 'onClick' | 'unavailableReason'
> & {
  /** Why it cannot be used now, from the application: shown as text and in a tooltip. */
  reason: string
  /**
   * The id of an element where the flow shows the reason itself (`messages['action.unavailable']`)
   * — a wizard's footer on phones puts it on one line under its row (P5.23). The button is then
   * described by that element, and nothing is shown beside it.
   */
  reasonId?: string
}

/**
 * An action the user cannot use now, with the reason in words beside it (and in a tooltip): never
 * only a greyed-out button. Announced to assistive technology with its reason.
 */
export function UnavailableAction({
  reason,
  reasonId: shownElsewhere,
  ...action
}: UnavailableActionProps) {
  const { messages } = useLiro()
  const ownId = `${useId()}-reason`
  const reasonId = shownElsewhere ?? ownId
  const [open, setOpen] = useState(false)
  const touch = useRef(false)
  const onPointerDown = (event: PointerEvent) => {
    touch.current = event.pointerType === 'touch'
  }
  const onClick = (event: MouseEvent) => {
    // A disabled action does nothing; a touch shows the reason (no hover on a touch screen).
    if (touch.current) {
      event.preventDefault()
      setOpen(true)
    }
  }
  return (
    <span className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1">
      <TooltipProvider>
        <TooltipRoot open={open} onOpenChange={setOpen}>
          <TooltipTrigger
            asChild
            aria-disabled="true"
            aria-describedby={reasonId}
            onPointerDown={onPointerDown}
            onClick={onClick}
          >
            <ActionButton action={action} />
          </TooltipTrigger>
          <TooltipContent className="w-60 whitespace-normal">{reason}</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>
      {shownElsewhere === undefined && (
        <span id={reasonId} className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
          {messages['action.unavailable'](reason)}
        </span>
      )}
    </span>
  )
}

function Action({ action }: { action: ActionItem }) {
  if (action.unavailableReason !== undefined) {
    return <UnavailableAction {...action} reason={action.unavailableReason} />
  }
  return (
    <Button
      {...look(action)}
      label={action.label}
      {...(action.onClick === undefined ? {} : { onClick: action.onClick })}
    />
  )
}

export interface ActionGroupProps {
  /** The actions in order, the main action last. */
  actions: readonly ActionItem[]
  /** 'end' (default): at the end of a form or a header. 'start': only beside text. */
  align?: 'start' | 'end'
  className?: string
}

/**
 * The actions of a form, a page header or a dialog, the main one last. When the row is too narrow
 * the others move into a "More" menu, and the main action stays.
 */
export function ActionGroup({ actions, align = 'end', className }: ActionGroupProps) {
  return (
    <OverflowRow
      actions={actions}
      render={(action) => <Action action={action} />}
      onMenuSelect={(action) => action.onClick?.()}
      align={align}
      {...(className === undefined ? {} : { className })}
    />
  )
}

interface OverflowRowProps<T extends ActionItem> {
  /** The actions in order, the main one last. */
  actions: readonly T[]
  /** An action's own control in the row. */
  render: (action: T) => ReactNode
  /** Runs an action chosen in the "More" menu. */
  onMenuSelect: (action: T) => void
  /** A menu entry is disabled when its action is unavailable, or when this says so. */
  disabled?: boolean
  align: 'start' | 'end'
  className?: string
}

/**
 * An element's laid-out width, unrounded: offsetWidth rounds each button, and the rounded sum can
 * exceed the row by a pixel where the row is as wide as its buttons (P5.31). The used width, not
 * the bounding box: a transform (a dialog's opening zoom) must not change what fits.
 */
function layoutWidth(element: HTMLElement | undefined): number {
  if (element === undefined) return 0
  const width = Number.parseFloat(getComputedStyle(element).width)
  return Number.isFinite(width) ? width : element.offsetWidth
}

/**
 * The nearest box whose width does not follow its content: a block in normal flow that is not
 * a flex or grid item. Its width is the room the row's line can have; the row's own width is not
 * where the row is sized by its content.
 */
function placeOf(element: HTMLElement): HTMLElement {
  let current = element.parentElement
  while (current !== null && current !== document.body) {
    const style = getComputedStyle(current)
    const parent = current.parentElement
    const parentDisplay = parent === null ? 'block' : getComputedStyle(parent).display
    if (
      (style.display === 'block' || style.display === 'flow-root') &&
      style.position !== 'absolute' &&
      style.position !== 'fixed' &&
      style.float === 'none' &&
      !/flex|grid/.test(parentDisplay)
    ) {
      return current
    }
    current = parent
  }
  return document.body
}

/**
 * The row of ActionGroup and BulkActionBar. When the actions do not fit on one line, the ones
 * before the main action move into a "More" menu first; a label wraps (P2.7d) only when the main
 * action alone is still too wide. Widths are measured unwrapped, in an invisible copy of the row.
 */
export function OverflowRow<T extends ActionItem>({
  actions,
  render,
  onMenuSelect,
  disabled = false,
  align,
  className,
}: OverflowRowProps<T>) {
  const { messages } = useLiro()
  const row = useRef<HTMLDivElement>(null)
  const measure = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(actions.length)
  const shownCount = useRef(visible)
  useLayoutEffect(() => {
    shownCount.current = visible
  }, [visible])

  const update = useCallback(() => {
    const rowElement = row.current
    const measureElement = measure.current
    if (rowElement === null || measureElement === null) return
    const children = [...measureElement.children] as HTMLElement[]
    const more = children.pop()
    setVisible(
      visibleActions(children.map(layoutWidth), layoutWidth(more), 8, layoutWidth(rowElement)),
    )
  }, [])

  // A row sized by its content (a page header's actions, a worklist's bar) is as wide as what it
  // shows: once folded it never sees the room it would have, and stays folded (P5.31). So it
  // decides with every action laid out — on mount, when the actions change, when their widths
  // change (a font arrives) and when the nearest box whose width does not follow its content
  // resizes — and folds only then. The same actions in a new array (a parent's re-render) are
  // not a change: showing them all again would close an open "More" menu.
  const signature = actions
    .map((action) => `${action.key}\u0000${action.label}\u0000${action.unavailableReason ?? ''}`)
    .join('\u0001')
  const [shownFor, setShownFor] = useState(signature)
  if (shownFor !== signature) {
    setShownFor(signature)
    setVisible(actions.length)
  }
  const retry = useCallback(() => {
    // Never while "More" is open: an open menu can widen the page (a scrollbar appears), and
    // laying every action out would hide its trigger and close it.
    const rowElement = row.current
    if (rowElement?.querySelector('[aria-expanded="true"]') != null) return
    // Nor while the focus is in the row: an action moving into "More" would drop it.
    if (rowElement?.contains(rowElement.ownerDocument.activeElement) === true) return
    if (shownCount.current === actions.length) {
      update()
    } else {
      // Laid out before paint, then measured by the effect below.
      flushSync(() => {
        setVisible(actions.length)
      })
    }
  }, [actions.length, update])

  // With every action laid out, before paint: measure, and fold what does not fit.
  useLayoutEffect(() => {
    if (visible === actions.length) update()
  }, [visible, actions.length, signature, update])

  useLayoutEffect(() => {
    const rowElement = row.current
    const measureElement = measure.current
    if (rowElement === null || measureElement === null) return
    // The row's own size: a narrower place folds more (the row's width follows its place there).
    const rowObserver = new ResizeObserver(update)
    rowObserver.observe(rowElement)
    // The copy's width changes when a font arrives after the first measurement; the place's
    // width when the page or a panel beside it resizes.
    // Widths only: folding changes the place's height, and a trial on that would never end.
    const widths = new Map<Element, number>()
    const trialObserver = new ResizeObserver((entries) => {
      let changed = false
      for (const entry of entries) {
        const width = entry.contentRect.width
        if (widths.get(entry.target) !== width) changed = true
        widths.set(entry.target, width)
      }
      if (changed) retry()
    })
    trialObserver.observe(measureElement)
    trialObserver.observe(placeOf(rowElement))
    return () => {
      rowObserver.disconnect()
      trialObserver.disconnect()
    }
  }, [retry, update])

  const more = <IconButton intent="more" label={messages['action.more']} />
  const hidden = actions.slice(0, actions.length - visible)
  const shown = actions.slice(actions.length - visible)
  const entries: MenuEntry[] = hidden.map((action) => {
    const icon = action.intent === undefined ? action.icon : INTENTS[action.intent].icon
    return {
      label: action.label,
      icon,
      onSelect: () => {
        onMenuSelect(action)
      },
      disabled: disabled || action.unavailableReason !== undefined,
      destructive:
        action.intent === undefined
          ? action.family === 'destructive'
          : INTENTS[action.intent].family === 'destructive',
    }
  })

  return (
    // Inside a flex row (a dialog's footer) the row fills its line: a row as wide as what it
    // shows would stay folded once "More" took its place (P5.26).
    <div ref={row} data-slot="action-row" className={cn('relative min-w-0', className)}>
      {/* Every action and the "More" button, laid out once invisibly and unwrapped, to measure
          their widths. Inside a box of no height that clips it: the copy, wider than a phone,
          must not make the page scroll sideways (P5.28). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-0 overflow-clip"
      >
        <div
          ref={measure}
          inert
          className="invisible absolute flex w-max gap-2 **:whitespace-nowrap"
        >
          {actions.map((action) => (
            <Fragment key={action.key}>{render(action)}</Fragment>
          ))}
          {more}
        </div>
      </div>
      <div
        className={cn(
          'flex flex-wrap items-center gap-2',
          align === 'end' ? 'justify-end' : 'justify-start',
        )}
      >
        {/* "More" stays mounted while every action is laid out to measure (hidden then): a
            remounted button would lose a press that was on its way, and the focus. */}
        {actions.length > 1 && (
          <span className={hidden.length > 0 ? 'contents' : 'hidden'}>
            <DropdownMenu trigger={more} entries={entries} align="end" />
          </span>
        )}
        {shown.map((action) => (
          <Fragment key={action.key}>{render(action)}</Fragment>
        ))}
      </div>
    </div>
  )
}
