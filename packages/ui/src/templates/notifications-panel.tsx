import { CheckCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../components/button'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { notificationDay, type NotificationItem } from './notifications-logic'

/*
 * NotificationsPanel (P4.9, the owner's review): what the bell opens. The bell keeps its red dot
 * without a number (P4.1); the panel says how many are unread.
 * - 360px wide (the screen less 32px on a phone); a header row: "Notifications" (sm semibold)
 *   and the unread count (xs text.secondary) at the start, "Mark all as read" (a small subtle
 *   neutral button) at the end while anything is unread;
 * - the recent notifications, newest first, at most 400px high and scrolling: each one a link to
 *   its record (through `linkComponent`) — an 8px neutral dot (surface.inverse) at the start
 *   while unread, the title (13px, semibold while unread), then the company and the time (xs
 *   text.tertiary): today the time, otherwise the date. Unread is also in the link's name. No
 *   blue: a notification is not an action (D17);
 * - "View all" at the bottom, a link to the NotificationsPage.
 * Opening a notification calls `onOpen` (the application marks it read) and follows the link.
 */

export interface NotificationsPanelProps {
  /** The recent notifications, newest first (the application chooses how many, usually 5–10). */
  items: readonly NotificationItem[]
  /** How many are unread in all (also those not listed here). */
  unread: number
  /** Called when a notification is opened, before its link is followed: mark it read. */
  onOpen?: (item: NotificationItem) => void
  /** "Mark all as read"; shown while anything is unread. */
  onMarkAllRead?: () => void
  /** The NotificationsPage's address, for "View all". */
  viewAllHref: string
  className?: string
}

/** The time of a notification: the clock today, the date on another day. */
export function NotificationTime({ at }: { at: string }) {
  const { format, today } = useLiro()
  const day = notificationDay(at)
  return (
    <time dateTime={at} dir="auto" className="tabular-nums">
      {day === today ? format.time(at) : format.date(day)}
    </time>
  )
}

/** The unread marker: an 8px neutral dot, and the word for assistive technology. */
export function UnreadDot({ read }: { read: boolean }) {
  const { messages } = useLiro()
  return (
    <span aria-hidden={read ? 'true' : undefined} className="flex h-5 w-2 shrink-0 items-center">
      {!read && (
        <>
          <span className="size-2 rounded-full bg-surface-inverse" />
          <span className="sr-only">{messages['notifications.unread']}</span>
        </>
      )}
    </span>
  )
}

/** The company and the time, xs text.tertiary. */
export function NotificationMeta({
  item,
  children,
}: {
  item: NotificationItem
  children?: ReactNode
}) {
  return (
    <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-xs text-tertiary">
      {item.company !== undefined && (
        <>
          <span className={cn('min-w-0 truncate', TEXT_DIRECTION)}>{item.company}</span>
          <span aria-hidden="true">·</span>
        </>
      )}
      <NotificationTime at={item.at} />
      {children}
    </span>
  )
}

/** The panel the notifications bell opens: recent notifications, the unread count, all of them. */
export function NotificationsPanel(props: NotificationsPanelProps) {
  const { messages, format, linkComponent: Link } = useLiro()
  const unreadText = format.number(String(props.unread))
  return (
    <div
      data-slot="notifications-panel"
      className={cn(
        'flex w-90 max-w-[calc(100vw-32px)] flex-col font-sans text-primary',
        props.className,
      )}
    >
      <div className="flex min-h-10 items-center justify-between gap-3 border-0 border-b border-solid border-subtle px-3 pb-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className={cn('m-0 text-sm font-semibold', TEXT_DIRECTION)}>
            {messages['notifications.title']}
          </h2>
          {props.unread > 0 && (
            <span className="text-xs text-secondary tabular-nums">
              {messages['notifications.unreadCount'](props.unread, unreadText)}
            </span>
          )}
        </div>
        {props.unread > 0 && props.onMarkAllRead !== undefined && (
          <Button
            family="neutral"
            emphasis="menu"
            icon={CheckCheck}
            label={messages['notifications.markAllRead']}
            onClick={props.onMarkAllRead}
          />
        )}
      </div>
      {props.items.length === 0 ? (
        <p className="m-0 px-3 py-6 text-center text-sm text-secondary">
          {messages['notifications.emptyTitle']}
        </p>
      ) : (
        <ul className="m-0 max-h-100 list-none overflow-y-auto p-1">
          {props.items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={() => props.onOpen?.(item)}
                className={cn(
                  'box-border flex w-full gap-2 rounded-md px-2 py-2 text-primary no-underline visited:text-primary hover:bg-surface-hover hover:text-primary active:text-primary',
                  FOCUS_RING,
                  '-outline-offset-2',
                )}
              >
                <UnreadDot read={item.read} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn('text-sm', !item.read && 'font-semibold', TEXT_DIRECTION)}>
                    {item.title}
                  </span>
                  <NotificationMeta item={item} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="border-0 border-t border-solid border-subtle px-3 pt-2">
        <Link
          href={props.viewAllHref}
          className={cn(
            'inline-flex min-h-6 items-center rounded-sm text-sm text-link no-underline visited:text-link hover:text-link hover:underline active:text-link',
            FOCUS_RING,
          )}
        >
          {messages['notifications.viewAll']}
        </Link>
      </div>
    </div>
  )
}
