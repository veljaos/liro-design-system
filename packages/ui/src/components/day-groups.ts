/*
 * Entries grouped by the day they happened on (P5.1): HistoryList (newest first, as the
 * notifications page) and MessageList (oldest first, as a conversation reads). Kept apart from the
 * markup so it can be unit-tested (AGENTS.md C7).
 *
 * An entry's `at` is an ISO instant in the tenant's offset ("2026-10-06T09:42:00+02:00", as the
 * Core sends it): its date part is its day, compared with the provider's `today`, and its clock
 * part is what `format.time` shows — so a day heading and the times under it always agree (the
 * rule of the notifications page, P4.9).
 */

/** The day of an instant: its date part as written (YYYY-MM-DD). */
export function dayOf(at: string): string {
  return at.slice(0, 10)
}

/** The day before a YYYY-MM-DD date. */
export function previousDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number)
  const previous = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, (date ?? 1) - 1))
  return previous.toISOString().slice(0, 10)
}

/** The entries of one day, under its heading. */
export interface DayGroup<T> {
  day: string
  /** 'today' and 'yesterday' are named in words; other days by their date. */
  kind: 'today' | 'yesterday' | 'date'
  items: T[]
}

/** The moment of an instant for ordering; an unreadable one sorts as written. */
function moment(at: string): number {
  const time = Date.parse(at)
  return Number.isNaN(time) ? 0 : time
}

/**
 * The entries grouped by day: `newest` first (a history) or `oldest` first (a conversation), by
 * their instants; entries of the same instant keep their given order.
 */
export function groupByDayOf<T>(
  items: readonly T[],
  at: (item: T) => string,
  today: string,
  order: 'newest' | 'oldest',
): DayGroup<T>[] {
  const yesterday = previousDay(today)
  const sign = order === 'newest' ? -1 : 1
  const sorted = items
    .map((item, index) => ({ item, index, time: moment(at(item)) }))
    .sort((a, b) => sign * (a.time - b.time) || a.index - b.index)
  const groups: DayGroup<T>[] = []
  for (const { item } of sorted) {
    const day = dayOf(at(item))
    let group = groups.at(-1)
    if (group?.day !== day) {
      group = {
        day,
        kind: day === today ? 'today' : day === yesterday ? 'yesterday' : 'date',
        items: [],
      }
      groups.push(group)
    }
    group.items.push(item)
  }
  return groups
}
