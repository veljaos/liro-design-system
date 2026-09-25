import type { MouseEventHandler } from 'react'
import { INTENTS, type Emphasis, type Family, type IconComponent, type Intent } from './intents'

/**
 * Colours by family and emphasis ("button weights" in docs/decisions.md). Tailwind finds classes
 * by reading the source, so every class is written out.
 * - primary (filled): the family fill with white text; one and two shades darker on hover and press.
 * - secondary (light): the family tint with the family's text; the stronger tint and the stronger
 *   text on hover. Neutral is "default" instead: raised surface, border.default, text.primary.
 * - menu (subtle): the family's text only; the tint (neutral: surface.hover) and the stronger
 *   text on hover.
 */
const COLOURS: Record<Family, Record<Emphasis, string>> = {
  primary: {
    primary:
      'bg-family-primary-solid text-on-accent enabled:hover:bg-family-primary-solid-hover enabled:active:bg-family-primary-solid-active',
    secondary:
      'bg-family-primary-subtle text-family-primary-fg enabled:hover:bg-family-primary-subtle-hover enabled:hover:text-family-primary-fg-hover',
    menu: 'bg-transparent text-family-primary-fg enabled:hover:bg-family-primary-subtle enabled:hover:text-family-primary-fg-hover',
  },
  verify: {
    primary:
      'bg-family-verify-solid text-on-accent enabled:hover:bg-family-verify-solid-hover enabled:active:bg-family-verify-solid-active',
    secondary:
      'bg-family-verify-subtle text-family-verify-fg enabled:hover:bg-family-verify-subtle-hover enabled:hover:text-family-verify-fg-hover',
    menu: 'bg-transparent text-family-verify-fg enabled:hover:bg-family-verify-subtle enabled:hover:text-family-verify-fg-hover',
  },
  document: {
    primary:
      'bg-family-document-solid text-on-accent enabled:hover:bg-family-document-solid-hover enabled:active:bg-family-document-solid-active',
    secondary:
      'bg-family-document-subtle text-family-document-fg enabled:hover:bg-family-document-subtle-hover enabled:hover:text-family-document-fg-hover',
    menu: 'bg-transparent text-family-document-fg enabled:hover:bg-family-document-subtle enabled:hover:text-family-document-fg-hover',
  },
  positive: {
    primary:
      'bg-family-positive-solid text-on-accent enabled:hover:bg-family-positive-solid-hover enabled:active:bg-family-positive-solid-active',
    secondary:
      'bg-family-positive-subtle text-family-positive-fg enabled:hover:bg-family-positive-subtle-hover enabled:hover:text-family-positive-fg-hover',
    menu: 'bg-transparent text-family-positive-fg enabled:hover:bg-family-positive-subtle enabled:hover:text-family-positive-fg-hover',
  },
  destructive: {
    primary:
      'bg-family-destructive-solid text-on-accent enabled:hover:bg-family-destructive-solid-hover enabled:active:bg-family-destructive-solid-active',
    secondary:
      'bg-family-destructive-subtle text-family-destructive-fg enabled:hover:bg-family-destructive-subtle-hover enabled:hover:text-family-destructive-fg-hover',
    menu: 'bg-transparent text-family-destructive-fg enabled:hover:bg-family-destructive-subtle enabled:hover:text-family-destructive-fg-hover',
  },
  caution: {
    primary:
      'bg-family-caution-solid text-on-accent enabled:hover:bg-family-caution-solid-hover enabled:active:bg-family-caution-solid-active',
    secondary:
      'bg-family-caution-subtle text-family-caution-fg enabled:hover:bg-family-caution-subtle-hover enabled:hover:text-family-caution-fg-hover',
    menu: 'bg-transparent text-family-caution-fg enabled:hover:bg-family-caution-subtle enabled:hover:text-family-caution-fg-hover',
  },
  neutral: {
    primary:
      'bg-family-neutral-solid text-on-accent enabled:hover:bg-family-neutral-solid-hover enabled:active:bg-family-neutral-solid-active',
    secondary:
      'border-default bg-surface-raised text-family-neutral-fg enabled:hover:bg-surface-hover enabled:hover:text-family-neutral-fg-hover',
    menu: 'bg-transparent text-family-neutral-fg enabled:hover:bg-surface-hover enabled:hover:text-family-neutral-fg-hover',
  },
}

/** Disabled, in every emphasis: Mantine's disabled colours, transparent border (Button.css). */
const DISABLED =
  'disabled:border-transparent disabled:bg-surface-disabled disabled:text-disabled disabled:cursor-not-allowed'

/**
 * The previous Design System's Mantine sizes ("Button sizes" in docs/decisions.md, source
 * @mantine/core 9.6.2 styles/Button.css and ActionIcon.css): radius md (8px), 1px border,
 * weight 600, line height 1. Button = size 'sm': height 36px, font size 13px, horizontal padding
 * 18px, 12px (18 / 1.5) on the side of the icon, 10px between icon and label, icon 15px.
 * IconButton = the same button without visible text: 36px high, 8px horizontal padding, icon
 * 16px (the old ActionButton). CompactIconButton = Mantine ActionIcon size 'md': 28px square,
 * neutral and subtle by default, for tight places only.
 */
const BASE =
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-solid font-sans font-semibold leading-none whitespace-nowrap box-border select-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'
type Shape = 'text' | 'icon' | 'compact'

const SHAPES: Record<Shape, { button: string; icon: string }> = {
  text: { button: 'h-control gap-2.5 ps-3 pe-4.5 text-sm', icon: 'size-3.75 shrink-0' },
  icon: { button: 'h-control px-2', icon: 'size-4 shrink-0' },
  compact: { button: 'size-7 p-0', icon: 'size-4 shrink-0' },
}

interface CommonProps {
  /** The visible text of a Button, the accessible name of an IconButton. From the application. */
  label: string
  /**
   * Default: the intent's emphasis; for a family, 'secondary'. CompactIconButton: 'menu'.
   * One 'primary' per screen.
   */
  emphasis?: Emphasis
  /** Default: 'button'. */
  type?: 'button' | 'submit' | 'reset'
  /**
   * The action cannot be used. The reason must be visible near the button as text: the
   * unavailable action of P2.7 does that.
   */
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
}

/** An interface intent (Appendix A.6): its family, emphasis and icon come with it. */
interface IntentProps {
  intent: Intent
  family?: never
  icon?: never
}

/** Any other action, e.g. one a module declares: its family and icon. */
interface FamilyProps {
  family: Family
  icon: IconComponent
  intent?: never
}

export type ButtonProps = CommonProps & (IntentProps | FamilyProps)

export type IconButtonProps = ButtonProps

/** A compact icon button: an intent, or an icon with a family (default neutral, as Mantine's ActionIcon). */
export type CompactIconButtonProps = CommonProps &
  (IntentProps | { icon: IconComponent; family?: Family; intent?: never })

interface Resolved {
  family: Family
  emphasis: Emphasis
  Icon: IconComponent
  mirrors: boolean
  data: Record<string, string>
}

/** Family, emphasis, icon and data attributes of either kind of button. */
function resolve(props: CompactIconButtonProps, defaultEmphasis: Emphasis | null): Resolved {
  if (props.intent !== undefined) {
    const intent = INTENTS[props.intent]
    return {
      family: intent.family,
      emphasis: props.emphasis ?? defaultEmphasis ?? intent.emphasis,
      Icon: intent.icon,
      mirrors: intent.mirrorsInRtl,
      data: {
        'data-intent': props.intent,
        ...(intent.confirms ? { 'data-confirms': 'true' } : {}),
      },
    }
  }
  return {
    family: props.family ?? 'neutral',
    emphasis: props.emphasis ?? defaultEmphasis ?? 'secondary',
    Icon: props.icon,
    mirrors: false,
    data: {},
  }
}

function buttonParts(props: CompactIconButtonProps, shape: Shape) {
  const { family, emphasis, Icon, mirrors, data } = resolve(
    props,
    shape === 'compact' ? 'menu' : null,
  )
  const size = SHAPES[shape]
  const className = [
    BASE,
    size.button,
    // Every emphasis has a 1px border, so all have the same size; only neutral "default" shows it.
    family === 'neutral' && emphasis === 'secondary' ? '' : 'border-transparent',
    COLOURS[family][emphasis],
    DISABLED,
  ]
    .filter((part) => part !== '')
    .join(' ')
  const icon = (
    <Icon aria-hidden="true" className={mirrors ? `${size.icon} rtl:-scale-x-100` : size.icon} />
  )
  return {
    icon,
    attributes: {
      type: props.type ?? 'button',
      disabled: props.disabled,
      onClick: props.onClick,
      className,
      'data-family': family,
      'data-emphasis': emphasis,
      ...data,
    },
  }
}

/**
 * A button that says what it does. Choose an `intent` (save, delete, pdf, back, …) or a `family`
 * with an `icon`; never a colour. The label always comes from the application.
 */
export function Button(props: ButtonProps) {
  const { icon, attributes } = buttonParts(props, 'text')
  return (
    <button {...attributes}>
      {icon}
      <span>{props.label}</span>
    </button>
  )
}

/**
 * An action without visible text: the same 36px button with only its icon. `label` is required:
 * it is the accessible name and the tooltip. Use it where the icon is universally understood.
 */
export function IconButton(props: IconButtonProps) {
  const { icon, attributes } = buttonParts(props, 'icon')
  return (
    <button {...attributes} aria-label={props.label} title={props.label}>
      {icon}
    </button>
  )
}

/**
 * A 28px icon button for tight places only: table row menus, close buttons. Neutral and subtle
 * (menu emphasis) by default. `label` is required: it is the accessible name and the tooltip.
 */
export function CompactIconButton(props: CompactIconButtonProps) {
  const { icon, attributes } = buttonParts(props, 'compact')
  return (
    <button {...attributes} aria-label={props.label} title={props.label}>
      {icon}
    </button>
  )
}
