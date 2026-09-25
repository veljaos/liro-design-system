import type { MouseEventHandler } from 'react'
import { BUTTON_SHAPES, buttonClassName, type ButtonShape } from '../primitives/button'
import { INTENTS, type Emphasis, type Family, type IconComponent, type Intent } from './intents'

/*
 * The look (colours by family and emphasis, the Mantine sizes of each shape) lives in
 * primitives/button.tsx, shared with the buttons inside other primitives.
 */

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

function buttonParts(props: CompactIconButtonProps, shape: ButtonShape) {
  const { family, emphasis, Icon, mirrors, data } = resolve(
    props,
    shape === 'compact' ? 'menu' : null,
  )
  const size = BUTTON_SHAPES[shape]
  const className = buttonClassName({ family, emphasis, shape })
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
