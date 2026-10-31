/*
 * The logic of SlaTimer, kept apart from the markup so it can be unit-tested:
 * where a deadline stands against the application's `now` — running, soon, overdue, paused,
 * met or missed — and a number of minutes cut into the parts the words show ("2 h 15 min",
 * "1 d 3 h"). Instants are ISO strings with their offset ("2026-10-14T10:30:00+02:00"); the
 * difference between two of them is whole minutes, never the device's clock.
 */

/** Where a deadline stands. */
export type SlaState = 'running' | 'soon' | 'overdue' | 'paused' | 'met' | 'missed'

/** A deadline read against `now`: its state and the minutes the words show. */
export interface SlaReading {
  state: SlaState
  /**
   * Running or soon: the minutes left, rounded up (a deadline 30 seconds away is "1 min"). Overdue
   * or missed: the minutes late, rounded down (0 right at the deadline). Paused and met: 0.
   */
  minutes: number
}

/** The options of a deadline: paused, done, and when "soon" starts. */
export interface SlaOptions {
  /** The clock is stopped (waiting for the customer): "Paused", whatever the time. */
  paused?: boolean
  /** When the deadline's work was done (an instant): "Met" on time, "Missed by …" after. */
  completedAt?: string
  /** Minutes before the deadline from which it is "soon" (the warning tone). */
  warnWithin?: number
}

const MINUTE = 60_000

/** The milliseconds of an ISO instant, or null when it cannot be read. */
function instantMs(instant: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(instant)) return null
  const ms = Date.parse(instant)
  return Number.isNaN(ms) ? null : ms
}

/** The milliseconds from `from` to `to` (negative when `to` is earlier), or null. */
export function millisecondsBetween(from: string, to: string): number | null {
  const start = instantMs(from)
  const end = instantMs(to)
  return start === null || end === null ? null : end - start
}

/**
 * Where a deadline (`due`) stands at `now`. Done (`completedAt`) wins over paused, paused over the
 * clock. Null when an instant cannot be read (the timer then shows "—").
 */
export function slaReading(due: string, now: string, options: SlaOptions = {}): SlaReading | null {
  if (options.completedAt !== undefined) {
    const late = millisecondsBetween(due, options.completedAt)
    if (late === null) return null
    return late > 0
      ? { state: 'missed', minutes: Math.floor(late / MINUTE) }
      : { state: 'met', minutes: 0 }
  }
  const left = millisecondsBetween(now, due)
  if (left === null) return null
  if (options.paused === true) return { state: 'paused', minutes: 0 }
  if (left <= 0) return { state: 'overdue', minutes: Math.floor(Math.abs(left) / MINUTE) }
  const minutes = Math.ceil(left / MINUTE)
  const soon = options.warnWithin !== undefined && minutes <= options.warnWithin
  return { state: soon ? 'soon' : 'running', minutes }
}

/** A number of minutes cut into the parts the words show. */
export interface DurationParts {
  days: number
  hours: number
  minutes: number
}

/**
 * Minutes as the words show them: under an hour the minutes ("40 min"); under a day hours and
 * minutes ("2 h 15 min", "2 h"); from a day days and hours ("1 d 3 h"), the minutes left out — a
 * deadline a day away is not read to the minute. Negative input counts as 0.
 */
export function durationParts(total: number): DurationParts {
  const whole = Math.max(0, Math.floor(total))
  const days = Math.floor(whole / 1440)
  const hours = Math.floor((whole % 1440) / 60)
  const minutes = days > 0 ? 0 : whole % 60
  return { days, hours, minutes }
}

/** The tone of each state: words always say it too, never the colour alone. */
export const SLA_TONES = {
  running: 'neutral',
  soon: 'warning',
  overdue: 'danger',
  paused: 'neutral',
  met: 'success',
  missed: 'danger',
} as const satisfies Record<SlaState, 'neutral' | 'warning' | 'danger' | 'success'>

/**
 * The deadlines of a list in the order to work them (a sort the application may use): overdue
 * first (the longest overdue first), then the soonest; paused and done after them, in their order.
 */
export function slaUrgency(reading: SlaReading | null): number {
  if (reading === null) return Number.MAX_SAFE_INTEGER
  switch (reading.state) {
    case 'overdue':
      return -reading.minutes
    case 'soon':
    case 'running':
      return reading.minutes
    case 'paused':
      return Number.MAX_SAFE_INTEGER - 3
    case 'missed':
    case 'met':
      return Number.MAX_SAFE_INTEGER - 2
  }
}
