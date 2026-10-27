import type { ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import type { IconComponent } from './intents'

/*
 * A tile's or a card's state line (P5.93 item 15, the owner's fourth review): one pattern for
 * every tile and card that says what state it is in — the icon and the state in words on the
 * first line ("Unavailable", "Low stock", "Locked"), the detail under it ("Sold out", "3 left",
 * "Available in Pro"), lined up with the state's words. The tone colours the first line and
 * only repeats the words; the detail is secondary text. Both wrap inside the tile's padding.
 * ProductTile, CatalogPicker's items and Launchpad's locked modules use it. Internal: not
 * exported from the package.
 */

export type StateLineTone = 'neutral' | 'warning' | 'danger'

const TONE_CLASS: Record<StateLineTone, string> = {
  neutral: 'text-secondary',
  warning: 'text-status-warning-fg',
  danger: 'text-status-danger-fg',
}

export function StateLine({
  icon: Icon,
  state,
  detail,
  tone = 'neutral',
  id,
  className,
}: {
  icon: IconComponent
  /** The state in words ("Unavailable"). */
  state: ReactNode
  /** What it means here ("Sold out"), under the state. */
  detail?: ReactNode
  tone?: StateLineTone
  id?: string
  className?: string
}) {
  return (
    <span
      id={id}
      data-slot="state-line"
      className={cn('flex min-w-0 flex-col gap-0.5 text-xs', className)}
    >
      <span className={cn('flex min-w-0 items-start gap-1 font-semibold', TONE_CLASS[tone])}>
        <Icon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
        <span className={cn('min-w-0 break-words', TEXT_DIRECTION)}>{state}</span>
      </span>
      {detail !== undefined && detail !== null && detail !== '' && (
        <span className={cn('min-w-0 ps-4.5 break-words text-secondary', TEXT_DIRECTION)}>
          {detail}
        </span>
      )}
    </span>
  )
}
