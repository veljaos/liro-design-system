/*
 * The logic of the shell markers (P5.3): the minutes left of a session as another user, and when
 * that number next changes. Times are instants (ISO 8601 with an offset, from the application) and
 * milliseconds since the epoch; nothing here is money (AGENTS.md D4 is about amounts).
 */

const MINUTE = 60_000

/**
 * The whole minutes left until `endsAt`, rounded up, so "1 minute left" lasts until the end and
 * "0" never shows while time remains; 0 once the end has passed. `null` when `endsAt` cannot be
 * read (the bar then shows no time rather than a wrong one).
 */
export function minutesLeft(endsAt: string, now: number): number | null {
  const end = Date.parse(endsAt)
  if (Number.isNaN(end)) return null
  const left = end - now
  if (left <= 0) return 0
  return Math.ceil(left / MINUTE)
}

/**
 * Milliseconds until `minutesLeft` changes: the bar redraws exactly then, not on a fixed tick, so
 * the number it shows is never a minute late. `null` when nothing will change (unreadable, or
 * already ended).
 */
export function untilNextMinute(endsAt: string, now: number): number | null {
  const end = Date.parse(endsAt)
  if (Number.isNaN(end)) return null
  const left = end - now
  if (left <= 0) return null
  const rest = left % MINUTE
  return rest === 0 ? MINUTE : rest
}

/** The states of a draft's connection (ConnectionState). */
export type ConnectionStatus = 'local' | 'sending' | 'sent' | 'failed'

export const CONNECTION_STATUSES: readonly ConnectionStatus[] = [
  'local',
  'sending',
  'sent',
  'failed',
]
