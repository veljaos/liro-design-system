import type { CSSProperties } from 'react'
import { cn } from '../primitives/cn'

/*
 * "Now" on the time grids, from the application's clock (`now` props), never the device's, so a
 * picture never changes with the time.
 *
 * **Calendar-type views write only the time (P5.94 item 16, the owner):** CalendarView's day and
 * week, the ResourceSchedule (desktop and phone) and the Timetable show "now" as one small dark tag
 * with the time ("10:20 AM", "10:20", through `format.time`) in their time gutter, their hours row
 * or under the running period's times — NowTimeTag / NowTime: surface.inverse with
 * text.onInverse, the look of today's date. No line runs across the days: it fought the events for
 * room and read as one more line of the grid. The gutter is never covered, so "now" reads at a
 * glance on a full day. The tag names itself ("Now, 10:20 AM", `label`); the grid marks the
 * current slot `aria-current="time"`. A scale label under the tag is left out of sight
 * (`tagCovers`).
 *
 * **The Gantt keeps its line (owner, P5.94 item 6):** a long plan reads "done before today, to do
 * after" across many rows. NowMarker draws it: a 2px line in border.selected with an 8px dot of the
 * same colour at its top. Neutral, never blue (D17) and never a status colour. It never covers text
 * (P5.90 item 17): the Gantt draws it under its bars and their labels.
 *
 * Not part of the package's API: the grids place these (absolutely, inside a positioned box) and
 * name them.
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
  /** Its name for assistive technology ("Now, 09:40"); without it the tag is decoration. */
  label?: string
  className?: string
}

/**
 * The time of "now" in a grid's time gutter or scale (P5.93 item 8; the calendars' only mark of
 * "now", P5.94 item 16). With `label` an image named by it, otherwise decoration.
 */
export function NowTimeTag({ orientation, style, time, label, className }: NowTimeTagProps) {
  const horizontal = orientation === 'horizontal'
  return (
    <div
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
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
 * running period's times, where it covers no text. With `label` an image named by it.
 */
export function NowTime({
  time,
  label,
  className,
}: {
  time: string
  label?: string
  className?: string
}) {
  return (
    <span
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
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
