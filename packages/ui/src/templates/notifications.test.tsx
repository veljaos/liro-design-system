import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { LiroProvider } from '../provider/liro-provider'
import {
  dayBefore,
  filterNotifications,
  groupByDay,
  notificationDay,
  notificationFiltersActive,
  type NotificationItem,
} from './notifications-logic'
import { NotificationsPage, type NotificationsPageProps } from './notifications-page'
import { NotificationsPanel } from './notifications-panel'

function item(id: string, at: string, extra: Partial<NotificationItem> = {}): NotificationItem {
  return { id, title: `Notification ${id}`, at, href: `#${id}`, read: false, ...extra }
}

const ITEMS = [
  item('a', '2026-10-05T16:30:00+02:00', { read: true, companyId: 'x', type: 'system' }),
  item('b', '2026-10-06T08:05:00+02:00', { companyId: 'y', type: 'mentions' }),
  item('c', '2026-10-06T10:14:00+02:00', { companyId: 'x', type: 'approvals' }),
  item('d', '2026-09-30T07:00:00+02:00', { read: true, companyId: 'y', type: 'system' }),
]

describe('notifications logic', () => {
  it('takes the day from the instant as written', () => {
    expect(notificationDay('2026-10-06T23:30:00+02:00')).toBe('2026-10-06')
    expect(dayBefore('2026-10-01')).toBe('2026-09-30')
    expect(dayBefore('2026-01-01')).toBe('2025-12-31')
    expect(dayBefore('2024-03-01')).toBe('2024-02-29')
  })
  it('groups by day, newest first: today, yesterday, then dates', () => {
    const groups = groupByDay(ITEMS, '2026-10-06')
    expect(groups.map((group) => [group.kind, group.day, group.items.map((i) => i.id)])).toEqual([
      ['today', '2026-10-06', ['c', 'b']],
      ['yesterday', '2026-10-05', ['a']],
      ['date', '2026-09-30', ['d']],
    ])
    expect(groupByDay([], '2026-10-06')).toEqual([])
  })
  it('filters by unread, companies and types; empty filters let everything through', () => {
    const ids = (list: NotificationItem[]) => list.map((each) => each.id)
    expect(ids(filterNotifications(ITEMS, {}))).toEqual(['a', 'b', 'c', 'd'])
    expect(ids(filterNotifications(ITEMS, { unreadOnly: true }))).toEqual(['b', 'c'])
    expect(ids(filterNotifications(ITEMS, { companies: ['x'] }))).toEqual(['a', 'c'])
    expect(ids(filterNotifications(ITEMS, { types: ['system'], companies: [] }))).toEqual([
      'a',
      'd',
    ])
    expect(notificationFiltersActive({ companies: [], types: [] })).toBe(false)
    expect(notificationFiltersActive({ unreadOnly: true })).toBe(true)
  })
  it('writes a clock time as written, never shifted, in the locale', () => {
    expect(createFormat('sr-Latn-RS').time('2026-10-06T09:42:00+02:00')).toBe('09:42')
    expect(createFormat('en-US').time('2026-10-06T21:05:00-05:00')).toMatch(/09:05\sPM/)
    expect(createFormat('en').time('nonsense')).toBe('nonsense')
  })
})

function render(node: React.ReactNode) {
  return renderToStaticMarkup(
    <LiroProvider locale="en" today="2026-10-06">
      {node}
    </LiroProvider>,
  )
}

const PAGE: NotificationsPageProps = {
  title: 'Notifications',
  items: ITEMS,
  unread: 2,
  show: 'all',
  onShowChange: () => undefined,
  layout: 'desktop',
}

describe('NotificationsPanel and NotificationsPage', () => {
  it('panel: the unread count through format, unread marked, time today and date otherwise', () => {
    const html = render(
      <NotificationsPanel
        items={ITEMS}
        unread={1284}
        viewAllHref="#all"
        onMarkAllRead={() => undefined}
      />,
    )
    expect(html).toContain('1,284 unread')
    expect(html).toContain('Mark all as read')
    expect(html).toContain('>Unread<')
    expect(html).toContain('>10:14 AM<')
    expect(html).toContain('href="#all"')
  })
  it('page: day headings, read toggles, and the two empty states', () => {
    const html = render(<NotificationsPage {...PAGE} onReadChange={() => undefined} />)
    expect(html).toContain('>Today<')
    expect(html).toContain('>Yesterday<')
    expect(html).toContain('>09/30/2026<')
    expect(html).toContain('aria-label="Mark as read: Notification c"')
    expect(html).toContain('aria-label="Mark as unread: Notification a"')
    expect(render(<NotificationsPage {...PAGE} items={[]} />)).toContain('No notifications')
    expect(render(<NotificationsPage {...PAGE} items={[]} show="unread" />)).toContain(
      'No notification matches these filters',
    )
  })
})
