/*
 * The logic of the notifications panel and page (P4.9, the owner's review), kept apart from the
 * markup so it can be unit-tested (AGENTS.md C7): the day a notification belongs to, the groups
 * by day (Today, Yesterday, then dates) and the filters an application may use when it filters on
 * the device. The Design System decides nothing about what a notification says.
 */

/** One notification, from the application. */
export interface NotificationItem {
  id: string
  /** What happened, one line ("UF-2026-1187 waits for your approval"). */
  title: string
  /** An optional second line (a comment's first words). */
  body?: string
  /** The company it belongs to: the user may work for many. */
  company?: string
  /** The company's id, for the company filter. */
  companyId?: string
  /** Its type's key (one of the page's `types`), for the type filter. */
  type?: string
  /**
   * When it happened: an ISO instant in the tenant's offset ("2026-10-06T09:42:00+02:00"). Its
   * date part is the day it is listed under; its clock part is shown (`format.time`).
   */
  at: string
  /** The record it is about; opening the notification goes there (through `linkComponent`). */
  href: string
  read: boolean
}

/** The day of a notification: the date part of its instant, as the tenant's day (YYYY-MM-DD). */
export function notificationDay(at: string): string {
  return at.slice(0, 10)
}

/** The day before a YYYY-MM-DD date. */
export function dayBefore(day: string): string {
  const [year, month, date] = day.split('-').map(Number)
  const previous = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, (date ?? 1) - 1))
  return previous.toISOString().slice(0, 10)
}

/** A group of notifications under one day's heading. */
export interface NotificationGroup {
  day: string
  /** 'today' and 'yesterday' are named in words; other days by their date. */
  kind: 'today' | 'yesterday' | 'date'
  items: NotificationItem[]
}

/**
 * The notifications grouped by day, newest day first and newest first within a day (the order of
 * the instants as written). `today` is the provider's.
 */
export function groupByDay(items: readonly NotificationItem[], today: string): NotificationGroup[] {
  const yesterday = dayBefore(today)
  const sorted = [...items].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
  const groups: NotificationGroup[] = []
  for (const item of sorted) {
    const day = notificationDay(item.at)
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

/** What the notifications page filters by. */
export interface NotificationFilters {
  /** Only the unread ones. */
  unreadOnly?: boolean
  /** Company ids; empty or missing means every company. */
  companies?: readonly string[]
  /** Type keys; empty or missing means every type. */
  types?: readonly string[]
}

/**
 * The notifications that pass the filters — for an application that filters on the device; the
 * page itself shows what it is given (the Core usually filters on the server).
 */
export function filterNotifications(
  items: readonly NotificationItem[],
  filters: NotificationFilters,
): NotificationItem[] {
  return items.filter(
    (item) =>
      (filters.unreadOnly !== true || !item.read) &&
      (filters.companies === undefined ||
        filters.companies.length === 0 ||
        (item.companyId !== undefined && filters.companies.includes(item.companyId))) &&
      (filters.types === undefined ||
        filters.types.length === 0 ||
        (item.type !== undefined && filters.types.includes(item.type))),
  )
}

/** Whether any filter narrows the list (so an empty list means "nothing matches"). */
export function notificationFiltersActive(filters: NotificationFilters): boolean {
  return (
    filters.unreadOnly === true ||
    (filters.companies?.length ?? 0) > 0 ||
    (filters.types?.length ?? 0) > 0
  )
}
