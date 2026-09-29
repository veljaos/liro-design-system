import type { LiroFormat } from '../provider/format'
import type { Entry } from './use-entry'

/*
 * The logic of DateField and DateRangeField, kept apart from the markup so it can be unit-tested
 * (AGENTS.md C7). Values are YYYY-MM-DD strings. The typed text is read by `format.parseDate`;
 * "today" is the provider's `today` (the tenant's date), never the device's clock.
 */

/** Reads the typed text: empty is a valid null, unreadable is an invalid null. */
export function readDate(text: string, format: Pick<LiroFormat, 'parseDate'>): Entry {
  if (text.trim() === '') return { value: null, valid: true }
  const value = format.parseDate(text)
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
