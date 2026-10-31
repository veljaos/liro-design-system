import { CircleAlert, CircleCheck, Clock, Pause, type LucideIcon } from 'lucide-react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import type { LiroFormat } from '../provider/format'
import type { LiroMessages } from '../provider/messages'
import { useLiro } from '../provider/liro-provider'
import { instantText } from './admin-logic'
import { durationParts, slaReading, type SlaReading, type SlaState } from './sla-logic'

/*
 * SlaTimer: where a deadline stands — a service level's first response or resolution, a
 * reply promised by a time, any "due by" instant — read against the application's `now`, never
 * the device's clock, and written in words from messages with the minutes through
 * `format.number`:
 * - running: "Due in 2 h 15 min" (text.secondary, a clock);
 * - soon (`warnWithin` minutes before): the same words in the warning tone;
 * - overdue: "Overdue by 40 min" in the danger tone with an alert icon — the words say it, never
 *   the colour alone;
 * - paused (`paused`: the clock stopped, waiting for someone else): "Paused" with a pause icon;
 * - done (`completedAt`): "Met" in the success tone, or "Missed by 25 min" in the danger tone.
 * `label` puts the deadline's name before the words ("First response: Overdue by 40 min"), for a
 * table cell holding two; `showDue` adds the due instant on a second line ("Due 14.10.2026.
 * 10:30"), for a side panel. An instant that cannot be read shows "—".
 *
 * The timer computes nothing but the minutes between two instants (sla-logic.ts, unit-tested):
 * which deadline applies, when it is paused and whether it was met are the application's. It does
 * not tick on its own: the application passes a new `now` (once a minute is enough).
 */

export interface SlaTimerProps {
  /** The deadline: an ISO instant with its offset ("2026-10-14T10:30:00+02:00"). */
  due: string
  /** The application's current instant, from which the time left is counted. */
  now: string
  /** The clock is stopped: "Paused". */
  paused?: boolean
  /** When the work was done: "Met" on time, "Missed by …" after the deadline. */
  completedAt?: string
  /** Minutes before the deadline from which the words take the warning tone. */
  warnWithin?: number
  /** The deadline's name before the words ("First response"), from the application. */
  label?: string
  /** The due instant on a second line ("Due 14.10.2026. 10:30"). */
  showDue?: boolean
  className?: string
}

const LOOK: Record<SlaState, { icon: LucideIcon; text: string }> = {
  running: { icon: Clock, text: 'text-secondary' },
  soon: { icon: Clock, text: 'text-status-warning-fg' },
  overdue: { icon: CircleAlert, text: 'text-status-danger-fg' },
  paused: { icon: Pause, text: 'text-secondary' },
  met: { icon: CircleCheck, text: 'text-status-success-fg' },
  missed: { icon: CircleAlert, text: 'text-status-danger-fg' },
}

/** Minutes in words: "2 h 15 min", the numbers through `format.number`. */
export function durationText(
  minutes: number,
  messages: Pick<LiroMessages, 'sla.duration'>,
  format: Pick<LiroFormat, 'number'>,
): string {
  const parts = durationParts(minutes)
  return messages['sla.duration'](
    parts.days,
    format.number(String(parts.days)),
    parts.hours,
    format.number(String(parts.hours)),
    parts.minutes,
    format.number(String(parts.minutes)),
  )
}

/** A reading in words: "Due in 2 h 15 min", "Overdue by 40 min", "Paused", "Met". */
export function slaText(
  reading: SlaReading,
  messages: Pick<
    LiroMessages,
    | 'sla.duration'
    | 'sla.dueIn'
    | 'sla.overdue'
    | 'sla.overdueBy'
    | 'sla.paused'
    | 'sla.met'
    | 'sla.missedBy'
  >,
  format: Pick<LiroFormat, 'number'>,
): string {
  const duration = () => durationText(reading.minutes, messages, format)
  switch (reading.state) {
    case 'running':
    case 'soon':
      return messages['sla.dueIn'](duration())
    case 'overdue':
      return reading.minutes === 0 ? messages['sla.overdue'] : messages['sla.overdueBy'](duration())
    case 'paused':
      return messages['sla.paused']
    case 'met':
      return messages['sla.met']
    case 'missed':
      return messages['sla.missedBy'](duration())
  }
}

/** A deadline in words against the application's `now`: due in, overdue by, paused, met. */
export function SlaTimer(props: SlaTimerProps) {
  const { messages, format } = useLiro()
  const reading = slaReading(props.due, props.now, {
    ...(props.paused === undefined ? {} : { paused: props.paused }),
    ...(props.completedAt === undefined ? {} : { completedAt: props.completedAt }),
    ...(props.warnWithin === undefined ? {} : { warnWithin: props.warnWithin }),
  })
  if (reading === null) {
    return (
      <span data-slot="sla-timer" className={cn('text-sm text-secondary', props.className)}>
        {props.label !== undefined && <span className="sr-only">{props.label}: </span>}—
      </span>
    )
  }
  const look = LOOK[reading.state]
  const Icon = look.icon
  const text = slaText(reading, messages, format)
  const strong = reading.state === 'overdue' || reading.state === 'missed'
  return (
    <span
      data-slot="sla-timer"
      data-state={reading.state}
      className={cn('inline-flex min-w-0 flex-col gap-0.5 font-sans', props.className)}
    >
      <span className={cn('inline-flex min-w-0 items-start gap-1.5 text-sm', look.text)}>
        <Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <span className={cn(TEXT_DIRECTION, strong && 'font-medium')}>
          {props.label !== undefined && (
            <span className="text-secondary">{messages['sla.labelled'](props.label)} </span>
          )}
          {text}
        </span>
      </span>
      {props.showDue === true && (
        <span className={cn('ps-5 text-xs text-tertiary tabular-nums', TEXT_DIRECTION)}>
          {messages['sla.dueAt'](instantText(format, props.due))}
        </span>
      )}
    </span>
  )
}
