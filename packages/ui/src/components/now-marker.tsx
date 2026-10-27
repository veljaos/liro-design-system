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
 * **It never covers text (P5.90 item 17):** each grid draws it after its lines and backgrounds and
 * before its content — events, bookings, lessons, bars and their labels are positioned after it
 * (or on a higher layer, Gantt's bars), so they cover the line, never the reverse; the dot stays at
 * the line's edge (a column's leading edge, the top of the rows).
 *
 * **The time stands in the gutter (P5.93 item 8):** besides the line, each grid writes the time
 * itself (NowTimeTag: "09:40" on a small strong-neutral tag, surface.inverse like today's date) in
 * its time gutter or time scale, at the line's place — the gutter is never covered by events, so
 * "now" is always readable at a glance even when the day is full; the line shows in the gaps
 * between the events and in the free strip at each column's end. The tag is decoration: the
 * marker's name says the time.
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

/**
 * Whether the time tag, `half` either side of `at`, would cover a scale label from `start` to
 * `end` (all along the time axis, in the same unit): the grids leave such a label out of sight
 * (kept for assistive technology), so no text is ever drawn under the tag.
 */
export function tagCovers(at: number, half: number, start: number, end: number): boolean {
  return at + half > start && at - half < end
}

export interface NowTimeTagProps {
  /**
   * 'horizontal': in a gutter beside rows of time (the line runs across); it stands at the
   * gutter's end, centred on the line. 'vertical': in a time scale above columns of time (the line
   * runs down); it is centred on the line.
   */
  orientation: 'horizontal' | 'vertical'
  /** Where it stands: `top` (horizontal, with the gutter's inline extent) or `insetInlineStart`. */
  style: CSSProperties
  /** The time as the provider's `format` writes it ("09:40"). */
  time: string
  className?: string
}

/** The time of the "now" marker in a grid's time gutter or scale (P5.93 item 8). Decoration. */
export function NowTimeTag({ orientation, style, time, className }: NowTimeTagProps) {
  const horizontal = orientation === 'horizontal'
  return (
    <div
      aria-hidden="true"
      data-slot="now-time"
      className={cn(
        // A zero-size box centred on the line: the tag overflows it evenly in either direction.
        'pointer-events-none absolute z-(--liro-layer-raised) flex',
        horizontal
          ? 'h-0 items-center justify-end pe-1'
          : 'inset-y-0 w-0 items-center justify-center',
        className,
      )}
      style={style}
    >
      <NowTime time={time} />
    </div>
  )
}

/**
 * The time of "now" on its tag, in the flow (P5.93 item 8): the Timetable writes it under the
 * running period's times, where it covers no text. Decoration.
 */
export function NowTime({ time, className }: { time: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-gantt-text=""
      className={cn(
        'w-fit rounded-sm bg-surface-inverse px-1 py-px text-xs leading-tight font-semibold whitespace-nowrap text-on-inverse tabular-nums',
        className,
      )}
    >
      <bdi>{time}</bdi>
    </span>
  )
}
