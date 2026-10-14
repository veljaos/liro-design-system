import type { CSSProperties } from 'react'
import { cn } from '../primitives/cn'

/*
 * The one "now" marker of the time grids (P5.28 item 10): CalendarView's day and week, the
 * ResourceSchedule (desktop and phone) and the Timetable's running period draw the current time
 * the same way — a 2px line in border.selected with an 8px dot of the same colour at its start
 * (the leading edge of a horizontal line, the top of a vertical one). Neutral, never blue (D17)
 * and never a status colour: "now" is not an error or a warning. Its place comes from the
 * application's clock (`now` props), never the device's, so a picture never changes with the time.
 *
 * Not part of the package's API: the grids place it (absolutely, inside a positioned box) and name
 * it. With `label` it is an image named by it ("Now, 10:05"); without, it is decoration and the
 * grid says "now" itself (`aria-current="time"`).
 */

export interface NowMarkerProps {
  /** 'horizontal': a line across, time running down; 'vertical': a line down, time running along. */
  orientation: 'horizontal' | 'vertical'
  /** Where it stands: `top` (horizontal) or `insetInlineStart` (vertical), and its extent. */
  style: CSSProperties
  /** Its name for assistive technology; without it the marker is decoration. */
  label?: string
  className?: string
}

/** A line with a dot at the current time. */
export function NowMarker({ orientation, style, label, className }: NowMarkerProps) {
  const horizontal = orientation === 'horizontal'
  return (
    <div
      data-slot="now-marker"
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
      className={cn(
        'pointer-events-none absolute flex items-center',
        horizontal ? 'h-0 flex-row' : 'w-0 flex-col',
        className,
      )}
      style={style}
    >
      <span
        className={cn(
          'box-border size-2 shrink-0 rounded-full border-4 border-solid border-selected',
          horizontal ? '-ms-1' : '-mt-1',
        )}
      />
      <span
        className={cn(
          'flex-1 border-0 border-solid border-selected',
          horizontal ? 'border-t-2' : 'border-s-2',
        )}
      />
    </div>
  )
}
