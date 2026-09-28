import { ChevronDown } from 'lucide-react'
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import { BUTTON_SHAPES, ButtonPrimitive } from '../primitives/button'
import { cn } from '../primitives/cn'
import {
  DropdownMenu as MenuRoot,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu'
import { useLiro } from '../provider/liro-provider'
import type { MenuEntry } from './dropdown-menu'
import { INTENTS, type Emphasis, type Family, type IconComponent, type Intent } from './intents'

/*
 * SplitAction (BUILD-PLAN P2.7), the previous Design System's, carried over (owner's decision,
 * 2026-09-28, docs/decisions.md "Actions"): the main button and a menu button joined into one
 * control. The main button's end corners are square; the menu button's start corners are square
 * and it overlaps the main button by 1px, so default-weight borders do not double. Between them a
 * 1px line in currentColor at 30% (a pseudo-element at the menu button's inline start: the owner's
 * inset box-shadow with color-mix() is not allowed by liro/no-raw-colors, and a shadow's offset
 * does not follow the direction). The menu button has the main button's family and weight, 8px
 * horizontal padding and a 16px chevron; its name is "<more options>: <main label>". The menu
 * opens under it at its end (mirrored in right-to-left), with an arrow (Mantine Popover: 7px) and
 * the "pop" transition; items have 16px icons; destructive items are in the danger colours.
 */

export type SplitActionProps = {
  /** The main action's text, from the application. */
  label: string
  onClick?: () => void
  /** Weight within the family's rules; both halves share it. */
  emphasis?: Emphasis
  disabled?: boolean
  /** The related actions in the menu. */
  entries: readonly MenuEntry[]
} & (
  | { intent: Intent; family?: never; icon?: never }
  | { family: Family; icon: IconComponent; intent?: never }
)

/**
 * A main action with related ones behind a chevron: "Save" with "Save as draft", "PDF" with
 * "Send by e-mail". The main action runs on its own button; the menu holds the rest.
 */
export function SplitAction(props: SplitActionProps) {
  const { messages } = useLiro()
  const family = props.intent === undefined ? props.family : INTENTS[props.intent].family
  const emphasis =
    props.emphasis ?? (props.intent === undefined ? 'secondary' : INTENTS[props.intent].emphasis)
  const Icon = props.intent === undefined ? props.icon : INTENTS[props.intent].icon
  const mirrors = props.intent !== undefined && INTENTS[props.intent].mirrorsInRtl
  return (
    <span className="inline-flex max-w-full items-stretch">
      <ButtonPrimitive
        family={family}
        emphasis={emphasis}
        disabled={props.disabled === true}
        {...(props.intent === undefined ? {} : { 'data-intent': props.intent })}
        {...(props.onClick === undefined ? {} : { onClick: props.onClick })}
        className="rounded-e-none"
      >
        <Icon
          aria-hidden="true"
          className={cn(BUTTON_SHAPES.text.icon, mirrors && 'rtl:-scale-x-100')}
        />
        <span>{props.label}</span>
      </ButtonPrimitive>
      <MenuRoot modal={false}>
        <DropdownMenuTrigger asChild>
          <ButtonPrimitive
            family={family}
            emphasis={emphasis}
            disabled={props.disabled === true}
            aria-label={messages['action.moreOptions'](props.label)}
            title={messages['action.moreOptions'](props.label)}
            className="relative -ms-px rounded-s-none px-2 before:absolute before:inset-y-0 before:start-0 before:w-px before:bg-current before:opacity-30"
          >
            <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
          </ButtonPrimitive>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="bottom"
          className="data-[state=closed]:animate-liro-pop-out data-[state=open]:animate-liro-pop-in"
        >
          {props.entries.map((entry, index) => {
            if (entry.type === 'separator') {
              return (
                <DropdownMenuPrimitive.Separator
                  key={index}
                  className="-mx-1 my-1 border-t border-default"
                />
              )
            }
            if (entry.type === 'label') {
              return (
                <DropdownMenuPrimitive.Label
                  key={index}
                  className="px-3 py-[5px] text-xs font-semibold text-secondary"
                >
                  {entry.label}
                </DropdownMenuPrimitive.Label>
              )
            }
            const Icon = entry.icon
            return (
              <DropdownMenuItem
                key={index}
                disabled={entry.disabled === true}
                onSelect={entry.onSelect}
                className={cn(
                  '[&_svg]:size-4',
                  entry.destructive === true &&
                    'text-status-danger-fg data-highlighted:bg-status-danger-bg',
                )}
              >
                {Icon !== undefined && <Icon aria-hidden="true" />}
                <span className="min-w-0 flex-1">{entry.label}</span>
              </DropdownMenuItem>
            )
          })}
          {/* Mantine's 7px arrow: a triangle 7√2 wide and half as high, bordered on two sides. */}
          <DropdownMenuPrimitive.Arrow asChild width={7 * Math.SQRT2} height={3.5 * Math.SQRT2}>
            <svg viewBox="0 0 10 5" aria-hidden="true" className="overflow-visible">
              <polygon points="0,0 10,0 5,5" className="fill-(--liro-surface-overlay)" />
              <polyline
                points="0,0 5,5 10,0"
                className="fill-none stroke-(--liro-border-default)"
                strokeWidth={1}
              />
            </svg>
          </DropdownMenuPrimitive.Arrow>
        </DropdownMenuContent>
      </MenuRoot>
    </span>
  )
}
