import { CheckCheck, Mail, MailOpen, Settings } from 'lucide-react'
import { useId } from 'react'
import { CompactIconButton, Button } from '../components/button'
import type { ComboboxOption } from '../components/combobox-field'
import { EmptyState } from '../components/empty-state'
import { MultiSelectField } from '../components/multi-select-field'
import { Skeleton } from '../components/progress'
import { usePhone } from '../components/use-phone'
import { buttonClassName } from '../primitives/button'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import type { LiroMessages } from '../provider/messages'
import { groupByDay, type NotificationGroup, type NotificationItem } from './notifications-logic'
import { NotificationMeta, UnreadDot } from './notifications-panel'
import { PageHeader } from './page-header'

/*
 * NotificationsPage (P4.9, the owner's review): every notification, where "View all" in the
 * bell's panel leads.
 * - The header: the title (visible h1: no module tab names this page), "Mark all as read" and a
 *   "Notification settings" link at the end (the settings page is the application's).
 * - One card (as ListPage): the first row holds the All / Unread toggle (the saved-view look:
 *   toggle buttons with the 2px line under the current one); the second row the company filter
 *   (searchable, several companies, one line) and the type filter (the application's types:
 *   approvals, documents, mentions and comments, system …), both "All" while empty.
 * - The list grouped by day — "Today", "Yesterday", then the date in words — each group's heading
 *   an h2 (xs semibold text.secondary). Each notification: the unread dot, the title as a link to
 *   its record (semibold while unread; opening it calls `onOpen`, which marks it read), an
 *   optional second line, the company and the time; at the end a 28px button that marks it read
 *   or unread. Rows 12px by 16px, a border.subtle line between them.
 * - Empty: "No notifications" when nothing is there; "Nothing matches" with "Clear filters" when
 *   the filters hide everything. Loading: five skeleton rows.
 * The page shows what it is given: the application filters (on the server, or with
 * `filterNotifications` on the device), as DataTable never filters.
 */

/** A filter of the page: options from the application, the chosen values. */
export interface NotificationFilter {
  /** The field's label ("Company", "Type"). From the application. */
  label: string
  options: readonly ComboboxOption[]
  value: readonly string[]
  onChange: (value: string[]) => void
}

export interface NotificationsPageProps {
  /** The page's title ("Notifications"). From the application. */
  title: string
  /** The notifications to show, already filtered, in any order (they are grouped by day). */
  items: readonly NotificationItem[]
  /** How many are unread in all. */
  unread: number
  /** All or only the unread ones, and its change. */
  show: 'all' | 'unread'
  onShowChange: (show: 'all' | 'unread') => void
  /** The company filter (searchable): companies the user works for. */
  companyFilter?: NotificationFilter
  /** The type filter: the application's notification types. */
  typeFilter?: NotificationFilter
  /** A notification is opened (its link followed): mark it read. */
  onOpen?: (item: NotificationItem) => void
  /** Mark one read or unread. */
  onReadChange?: (item: NotificationItem, read: boolean) => void
  /** Mark all as read; the button shows while anything is unread. */
  onMarkAllRead?: () => void
  /** Clears every filter (the "Nothing matches" state's action). */
  onClearFilters?: () => void
  /** The address of the notification settings. */
  settingsHref?: string
  loading?: boolean
  /** 'desktop' or 'phone'; default by the viewport. */
  layout?: 'desktop' | 'phone'
  className?: string
}

function ShowToggle({
  show,
  onShowChange,
  unread,
}: {
  show: 'all' | 'unread'
  onShowChange: (show: 'all' | 'unread') => void
  unread: number
}) {
  const { messages, format } = useLiro()
  const choices = [
    { key: 'all' as const, label: messages['notifications.all'] },
    { key: 'unread' as const, label: messages['notifications.unreadFilter'] },
  ]
  return (
    <div role="group" aria-label={messages['notifications.show']} className="-mb-px flex">
      {choices.map((choice) => {
        const current = choice.key === show
        return (
          <button
            key={choice.key}
            type="button"
            aria-pressed={current}
            onClick={() => {
              onShowChange(choice.key)
            }}
            className={cn(
              'm-0 box-border flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-t-md border-0 border-b-2 border-solid border-transparent bg-transparent px-4 font-sans text-sm leading-none whitespace-nowrap text-primary hover:border-default hover:bg-surface-hover',
              current && 'border-brand hover:border-brand',
              FOCUS_RING,
              '-outline-offset-2',
            )}
          >
            <span className={TEXT_DIRECTION}>{choice.label}</span>
            {choice.key === 'unread' && unread > 0 && (
              <span className="text-xs text-tertiary tabular-nums">
                {format.number(String(unread))}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function dayHeading(
  group: NotificationGroup,
  messages: LiroMessages,
  date: (day: string) => string,
) {
  if (group.kind === 'today') return messages['notifications.today']
  if (group.kind === 'yesterday') return messages['notifications.yesterday']
  return date(group.day)
}

/** Every notification, grouped by day, with filters and read state. */
export function NotificationsPage(props: NotificationsPageProps) {
  const { messages, format, today, linkComponent: Link } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const groups = groupByDay(props.items, today)
  const idPrefix = useId()
  const filtered =
    props.show === 'unread' ||
    (props.companyFilter?.value.length ?? 0) > 0 ||
    (props.typeFilter?.value.length ?? 0) > 0

  const settings =
    props.settingsHref === undefined ? undefined : (
      <Link
        href={props.settingsHref}
        className={cn(
          buttonClassName({ family: 'neutral', emphasis: 'menu', shape: 'text' }),
          'no-underline visited:text-family-neutral-fg',
        )}
      >
        <Settings aria-hidden="true" className="size-3.75 shrink-0" />
        <span className={TEXT_DIRECTION}>{messages['notifications.settings']}</span>
      </Link>
    )
  const markAll =
    props.unread > 0 && props.onMarkAllRead !== undefined ? (
      <Button
        family="neutral"
        icon={CheckCheck}
        label={messages['notifications.markAllRead']}
        onClick={props.onMarkAllRead}
      />
    ) : undefined

  const filterField = (filter: NotificationFilter) => (
    <MultiSelectField
      label={filter.label}
      options={filter.options}
      value={filter.value}
      onChange={filter.onChange}
      placeholder={messages['notifications.all']}
      summary
      className={phone ? 'w-full' : 'w-60'}
    />
  )

  let body
  if (props.loading === true && props.items.length === 0) {
    body = (
      <div aria-busy="true" className="flex flex-col gap-3 p-4">
        <span className="sr-only">{messages['table.updating']}</span>
        {[0, 1, 2, 3, 4].map((index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    )
  } else if (props.items.length === 0) {
    body = filtered ? (
      <EmptyState
        variant="no-results"
        compact
        title={messages['notifications.noMatchTitle']}
        {...(props.onClearFilters === undefined
          ? {}
          : { action: { label: messages['table.clearFilters'], onClick: props.onClearFilters } })}
        className="py-10"
      />
    ) : (
      <EmptyState
        compact
        title={messages['notifications.emptyTitle']}
        description={messages['notifications.emptyDescription']}
        className="py-10"
      />
    )
  } else {
    body = groups.map((group) => (
      <section key={group.day} aria-labelledby={`${idPrefix}-${group.day}`}>
        <h2
          id={`${idPrefix}-${group.day}`}
          className={cn('m-0 px-4 pt-4 pb-2 text-xs font-semibold text-secondary', TEXT_DIRECTION)}
        >
          {dayHeading(group, messages, (day) => format.date(day))}
        </h2>
        <ul className="m-0 list-none p-0">
          {group.items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-2 border-0 border-t border-solid border-subtle px-4 py-3"
            >
              <UnreadDot read={item.read} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Link
                  href={item.href}
                  onClick={() => props.onOpen?.(item)}
                  className={cn(
                    'self-start rounded-sm text-sm text-primary no-underline visited:text-primary hover:text-primary hover:underline active:text-primary',
                    !item.read && 'font-semibold',
                    FOCUS_RING,
                    TEXT_DIRECTION,
                  )}
                >
                  {item.title}
                </Link>
                {item.body !== undefined && (
                  <span className={cn('text-sm text-secondary', TEXT_DIRECTION)}>{item.body}</span>
                )}
                <NotificationMeta item={item} />
              </div>
              {props.onReadChange !== undefined && (
                <CompactIconButton
                  icon={item.read ? Mail : MailOpen}
                  label={
                    item.read
                      ? messages['notifications.markUnread'](item.title)
                      : messages['notifications.markRead'](item.title)
                  }
                  onClick={() => props.onReadChange?.(item, !item.read)}
                />
              )}
            </li>
          ))}
        </ul>
      </section>
    ))
  }

  return (
    <div
      data-slot="notifications-page"
      className={cn(
        'mx-auto box-border flex w-full max-w-content flex-col',
        phone ? 'gap-4 p-4' : 'gap-6 p-6',
        props.className,
      )}
    >
      <PageHeader
        title={props.title}
        {...(settings === undefined && markAll === undefined
          ? {}
          : {
              actions: (
                <>
                  {settings}
                  {markAll}
                </>
              ),
            })}
      />
      <div className="overflow-hidden rounded-lg border border-solid border-default bg-surface-raised font-sans text-primary">
        <div className="border-0 border-b border-solid border-default px-4">
          <ShowToggle show={props.show} onShowChange={props.onShowChange} unread={props.unread} />
        </div>
        {(props.companyFilter !== undefined || props.typeFilter !== undefined) && (
          <div
            className={cn(
              'flex gap-3 border-0 border-b border-solid border-subtle px-4 py-3',
              phone ? 'flex-col' : 'flex-wrap items-end',
            )}
          >
            {props.companyFilter !== undefined && filterField(props.companyFilter)}
            {props.typeFilter !== undefined && filterField(props.typeFilter)}
          </div>
        )}
        {body}
      </div>
    </div>
  )
}
