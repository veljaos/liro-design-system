/*
 * ClockRecordList's logic (BUILD-PLAN P5.24e), without React: reading a typed clock time and
 * telling a clock-out on a later day. Times are clock times of the tenant ("07:30"); the
 * application turns them into instants. Nothing is computed from them: the duration comes from
 * the application.
 */

import { parseTimeText } from './time-logic'

/**
 * A clock time as typed — "7:30", "07.30", "0730", "730", "7" — as "HH:MM", or null when it is not
 * a time of day (B.4: unreadable is null). Empty text is null too; the caller tells empty from
 * unreadable. The library's one time parser, `parseTimeText` (P5.90 item 12).
 */
export function parseClockTime(text: string): string | null {
  return parseTimeText(text)
}

/** The clock time of an instant as written ("2026-10-06T07:30:00+02:00" → "07:30"), or null. */
export function clockTimeOf(instant: string | null): string | null {
  if (instant === null) return null
  return /T(\d{2}:\d{2})/.exec(instant)?.[1] ?? null
}

/**
 * Whether an instant falls on a later day than `date` (YYYY-MM-DD): a clock-out after midnight.
 * Compares the instant's own date, written in the tenant's offset.
 */
export function onLaterDay(date: string, instant: string | null): boolean {
  return instant !== null && instant.slice(0, 10) > date
}
