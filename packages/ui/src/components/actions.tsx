import {
  Fragment,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
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

  useLayoutEffect(() => {
    const rowElement = row.current
    const measureElement = measure.current
    if (rowElement === null || measureElement === null) return
    const update = () => {
      const children = [...measureElement.children] as HTMLElement[]
      const more = children.pop()
      setVisible(
        visibleActions(
          children.map((child) => child.offsetWidth),
          more?.offsetWidth ?? 0,
          8,
          rowElement.clientWidth,
        ),
      )
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(rowElement)
    // The copy's width changes when a font arrives after the first measurement.
    observer.observe(measureElement)
    return () => {
      observer.disconnect()
    }
  }, [actions])

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
    <div ref={row} className={cn('relative min-w-0', className)}>
      {/* Every action and the "More" button, laid out once invisibly and unwrapped, to measure
          their widths. */}
      <div
        ref={measure}
        aria-hidden="true"
        inert
        className="pointer-events-none invisible absolute flex w-max gap-2 **:whitespace-nowrap"
      >
        {actions.map((action) => (
          <Fragment key={action.key}>{render(action)}</Fragment>
        ))}
        {more}
      </div>
      <div
        className={cn(
          'flex flex-wrap items-center gap-2',
          align === 'end' ? 'justify-end' : 'justify-start',
        )}
      >
        {hidden.length > 0 && <DropdownMenu trigger={more} entries={entries} align="end" />}
        {shown.map((action) => (
          <Fragment key={action.key}>{render(action)}</Fragment>
        ))}
      </div>
    </div>
  )
}
