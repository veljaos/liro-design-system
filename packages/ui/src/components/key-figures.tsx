import type { ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { usePhone } from './use-phone'

/*
 * KeyFigures (P4.4, the owner's values, docs/decisions.md "Detail and record form pages"): the
 * two to four values a record is judged by, in a row under its title — "Amount due
 * 12.345,60 RSD · Due 15.10.2026. · Overdue 3 days".
 * - Each: the label xs (12px) text.secondary above, the value 20px (xl) semibold with tabular
 *   digits, 2px apart; 32px (xl) between items; no frame, no card, no separators.
 * - Colour only for a state: `tone` writes the value in the tone's text colour ("Overdue 3 days"
 *   in status.danger.fg); everything else text.primary.
 * - Phones (below 48em, or `layout`): a clean two-column grid (P4.9, the owner's review): two equal
 *   columns 16px apart, 12px between rows, every value 16px (lg) semibold so an amount with its
 *   currency ("135.954,00 RSD") fits its half of a 360px screen on one line; an amount never
 *   breaks inside itself (MoneyText keeps its currency with a non-breaking space).
 */

export type KeyFigureTone = 'danger' | 'warning' | 'success' | 'info'

/** One key figure. */
export interface KeyFigure {
  /** A stable key; default: the position. */
  key?: string
  /** From the application ("Amount due"). */
  label: ReactNode
  /** The value: text, MoneyText, DateText … */
  value: ReactNode
  /** A state the value shows (overdue, blocked): the value takes the tone's text colour. */
  tone?: KeyFigureTone
}

export interface KeyFiguresProps {
  items: readonly KeyFigure[]
  /** 'phone' forces two columns; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** Literal classes, so Tailwind finds them. */
const TONE_TEXT: Record<KeyFigureTone, string> = {
  danger: 'text-status-danger-fg',
  warning: 'text-status-warning-fg',
  success: 'text-status-success-fg',
  info: 'text-status-info-fg',
}

/** The values a record is judged by, under its title. */
export function KeyFigures({ items, layout, className }: KeyFiguresProps) {
  const viewportPhone = usePhone()
  const phone = layout === undefined ? viewportPhone : layout === 'phone'
  return (
    <dl
      data-slot="key-figures"
      className={cn(
        'm-0 font-sans',
        phone ? 'grid grid-cols-2 gap-x-4 gap-y-3' : 'flex flex-wrap gap-x-8 gap-y-4',
        className,
      )}
    >
      {items.map((item, index) => (
        <div key={item.key ?? index} className="flex min-w-0 flex-col gap-0.5">
          <dt className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{item.label}</dt>
          <dd
            className={cn(
              'm-0 font-semibold tabular-nums',
              phone ? 'text-lg' : 'text-xl',
              item.tone === undefined ? 'text-primary' : TONE_TEXT[item.tone],
              TEXT_DIRECTION,
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
