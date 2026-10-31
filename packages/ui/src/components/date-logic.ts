import type { LiroFormat } from '../provider/format'
import type { Entry } from './use-entry'

/*
 * The logic of DateField and DateRangeField, kept apart from the markup so it can be unit-tested.
 * Values are YYYY-MM-DD strings. The typed text is read by `format.parseDate`;
 * "today" is the provider's `today` (the tenant's date), never the device's clock.
 */

/** Right-to-left and left-to-right marks Intl writes into some locales' dates. */
const BIDI_MARKS = /[\u200e\u200f\u061c]/g

/**
 * A day and a month typed without the year ("7.10.", "07.10", "7/10", "0710"): the quick entry
 * of a date this year. Returns the text with the year of `today` added, written
 * the way `format.parseDate` reads it, in both places the year can stand in a locale's order —
 * after the day and month (day–month–year, month–day–year) or before them (year–month–day) — or
 * null when the text is not a day and a month alone.
 */
export function withTodaysYear(text: string, today: string): [string, string] | null {
  const cleaned = text.replace(BIDI_MARKS, '').trim().replace(/\.$/, '').trim()
  const parts = /^\d{4}$/.test(cleaned)
    ? [cleaned.slice(0, 2), cleaned.slice(2)]
    : cleaned.split(/[./\-\s]+/)
  if (parts.length !== 2 || !parts.every((part) => /^\d{1,2}$/.test(part))) return null
  const year = today.slice(0, 4)
  const dayAndMonth = parts.join('.')
  return [`${dayAndMonth}.${year}`, `${year}.${dayAndMonth}`]
}

/**
 * Reads the typed text: empty is a valid null, unreadable is an invalid null. With `today` (the
 * provider's date), a day and a month alone ("7.10.") are read in today's year.
 */
export function readDate(
  text: string,
  format: Pick<LiroFormat, 'parseDate'>,
  today?: string,
): Entry {
  if (text.trim() === '') return { value: null, valid: true }
  let value = format.parseDate(text)
  if (value === null && today !== undefined) {
    for (const candidate of withTodaysYear(text, today) ?? []) {
      value = format.parseDate(candidate)
      if (value !== null) break
    }
  }
  return value === null ? { value: null, valid: false } : { value, valid: true }
}

/** The text a field shows for a value, through `format.date`. */
export function showDate(value: string | null, format: Pick<LiroFormat, 'date'>): string {
  return value === null ? '' : format.date(value)
}

/** A local Date at midnight for YYYY-MM-DD, as the calendar needs it. */
export function toLocalDate(iso: string): Date {
  const [year = 1970, month = 1, day = 1] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  // Years 0–99 would otherwise be read as 1900–1999.
  date.setFullYear(year)
  return date
}

/** YYYY-MM-DD of a local Date. */
export function fromLocalDate(date: Date): string {
  const pad = (value: number, width: number) => String(value).padStart(width, '0')
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`
}

/**
 * The month the calendar shows when it opens: the chosen date's month, else the month of the
 * provider's `today` (not the device's date).
 */
export function openingMonth(value: string | null, today: string): Date {
  const date = toLocalDate(value ?? today)
  date.setDate(1)
  return date
}

/** A range whose end is before its start is out of order; an open end is not. */
export function rangeInOrder(start: string | null, end: string | null): boolean {
  return start === null || end === null || start <= end
}
