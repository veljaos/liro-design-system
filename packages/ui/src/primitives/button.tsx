import type { ComponentProps } from 'react'
import type { Emphasis, Family } from '../components/intents'
import { cn } from './cn'

/**
 * The look of every Liro button, in one place: Button, IconButton and CompactIconButton, and the
 * buttons inside other primitives (the close button of a dialog, the actions of an alert dialog,
 * the month buttons of the calendar). Adapted from the shadcn/ui button: its `variant` and `size`
 * are replaced by the Liro family, emphasis and shape.
 *
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

/** text: a button with an icon and a label; icon: 36px without text; compact: 28px, tight places. */
export type ButtonShape = 'text' | 'icon' | 'compact'

export const BUTTON_SHAPES: Record<ButtonShape, { button: string; icon: string }> = {
  text: { button: 'h-control gap-2.5 ps-3 pe-4.5 text-sm', icon: 'size-3.75 shrink-0' },
  icon: { button: 'h-control px-2', icon: 'size-4 shrink-0' },
  compact: { button: 'size-7 p-0', icon: 'size-4 shrink-0' },
}

export interface ButtonLook {
  family: Family
  emphasis: Emphasis
  shape: ButtonShape
}

/** The classes of a button with this family, emphasis and shape. */
export function buttonClassName({ family, emphasis, shape }: ButtonLook): string {
  return [
    BASE,
    BUTTON_SHAPES[shape].button,
    // Every emphasis has a 1px border, so all have the same size; only neutral "default" shows it.
    family === 'neutral' && emphasis === 'secondary' ? '' : 'border-transparent',
    COLOURS[family][emphasis],
    DISABLED,
  ]
    .filter((part) => part !== '')
    .join(' ')
}

export type ButtonPrimitiveProps = ComponentProps<'button'> & Partial<ButtonLook>

/**
 * A plain button element with the Liro look, for other primitives. Default: neutral, secondary,
 * text shape, type "button". Product code uses Button, IconButton or CompactIconButton.
 */
export function ButtonPrimitive({
  family = 'neutral',
  emphasis = 'secondary',
  shape = 'text',
  className,
  type = 'button',
  ...props
}: ButtonPrimitiveProps) {
  return (
    <button
      type={type}
      data-slot="button"
      data-family={family}
      data-emphasis={emphasis}
      className={cn(buttonClassName({ family, emphasis, shape }), className)}
      {...props}
    />
  )
}
