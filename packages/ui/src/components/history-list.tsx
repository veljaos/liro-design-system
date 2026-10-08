import { ArrowRight, Bot, ChevronDown, Plug, Settings2 } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import type { LiroMessages } from '../provider/messages'
import { AgentMark } from './agent-mark'
import { Button } from './button'
import { groupByDayOf, type DayGroup } from './day-groups'
import { EmptyState } from './empty-state'
import { PersonAvatar } from './person'
import { Skeleton } from './progress'
import { Spinner } from './spinner'

/*
 * HistoryList (P5.1; the plan's "Timeline / HistoryList", one component under this name): the
 * full history of a record — who did what, when, and what changed.
 *
 * - **Entries newest first, grouped by day** like the notifications page (P4.9): "Today",
 *   "Yesterday", then the date (`format.date`), each heading an h3 by default (`headingLevel`),
 *   xs semibold text.secondary. An entry's `at` is an instant in the tenant's offset; its date
 *   part is its day and its clock part is shown (`format.time`), so heading and time agree.
 * - **Each entry**, a row with a 1px border.subtle line above it (the panel rows' rule; none above
 *   a day's first): at the start a 26px marker of the actor's kind — a person's avatar (PersonAvatar
 *   'sm'; nothing else marks a human), the Bot icon for an agent (and AgentMark after its name),
 *   a neutral Settings icon for the system, a Plug for an integration (named "System" /
 *   "Integration" for assistive technology); then the name (sm semibold), the time (xs
 *   text.tertiary, tabular), the application's sentence ("Sent to SEF"), each changed field as
 *   "Due date  13.10.2026 → 20.10.2026" (the label text.secondary, the old value text.secondary,
 *   the new one text.primary medium, an arrow that mirrors in right-to-left; the words "Before:" /
 *   "After:" for assistive technology; both values exactly as the application gives them), and
 *   "On behalf of Milica Petrović" (xs text.secondary) when someone acted for someone else.
 * - **Long histories** page from the application: `hasMore` shows "Show more" under the list,
 *   `onLoadMore` asks for the next (older) entries, `loading` shows a spinner in its place (and
 *   skeleton rows while the first page loads). Empty: an EmptyState ("No changes yet").
 *
 * Which one to use: HistoryList for the whole history of a record, on its page; ActivityList
 * (P4.9) for the latest few entries in a side panel; StatusTimeline (P5.4) for the states of one
 * process with its next step; LifecycleBar (P4.5) for the dots of a document's lifecycle above it;
 * MessageThread for a conversation.
 */

/** Who acted: a person, the system, an agent or an integration (another system). */
export type ActorKind = 'human' | 'system' | 'agent' | 'integration'

export interface HistoryActor {
  /** The name shown ("Dragan Ilić", "Liro agent", "SEF", "Banca Intesa import"). */
  name: string
  /** Default: 'human'. */
  kind?: ActorKind
  /** A person's photo. */
  src?: string
}

/** One changed field: its label and the old and new values, as the application writes them. */
export interface HistoryChange {
  /** The field's label ("Due date"). */
  field: string
  /** The value before; left out when the field was empty. */
  from?: ReactNode
  /** The value after; left out when the field was emptied. */
  to?: ReactNode
}

/** One entry of a record's history. */
export interface HistoryEntry {
  id: string
  /** When: an ISO instant in the tenant's offset ("2026-10-06T09:42:00+02:00"). */
  at: string
  /** The time as the application writes it; default `format.time(at)`. */
  time?: ReactNode
  actor: HistoryActor
  /** The person the actor acted for (an agent preparing a reminder for Milica). */
  onBehalfOf?: string
  /** What happened, in the application's words ("Sent to SEF", "Payment booked"). */
  text?: ReactNode
  /** The fields that changed. */
  changes?: readonly HistoryChange[]
}

export interface HistoryListProps {
  /** The entries loaded so far, in any order (they are sorted newest first). */
  entries: readonly HistoryEntry[]
  /** The list's accessible name ("History of F-2026-0410"). From the application. */
  label: string
  /** There are older entries to load. */
  hasMore?: boolean
  /** Load the next, older entries (the application pages). */
  onLoadMore?: () => void
  /** The application is loading: skeleton rows at first, then a spinner in place of "Show more". */
  loading?: boolean
  /** The level of the day headings. Default: 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  className?: string
}

const MARKER = 'flex size-6.5 shrink-0 items-center justify-center rounded-xl bg-surface-sunken'

function ActorMarker({ actor, messages }: { actor: HistoryActor; messages: LiroMessages }) {
  const kind = actor.kind ?? 'human'
  if (kind === 'human') {
    return (
      <PersonAvatar
        name={actor.name}
        size="sm"
        {...(actor.src === undefined ? {} : { src: actor.src })}
      />
    )
  }
  if (kind === 'agent') {
    // AgentMark after the name says it; the icon here is the agent's face.
    return (
      <span aria-hidden="true" className={cn(MARKER, 'text-primary')}>
        <Bot className="size-3.5" />
      </span>
    )
  }
  const Icon = kind === 'system' ? Settings2 : Plug
  const word = kind === 'system' ? messages['history.system'] : messages['history.integration']
  return (
    <span role="img" aria-label={word} title={word} className={cn(MARKER, 'text-secondary')}>
      <Icon aria-hidden="true" className="size-3.5" />
    </span>
  )
}

function ChangeLine({ change, messages }: { change: HistoryChange; messages: LiroMessages }) {
  const hasFrom = change.from !== undefined && change.from !== null && change.from !== ''
  const hasTo = change.to !== undefined && change.to !== null && change.to !== ''
  return (
    <li className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-sm">
      <span className={cn('text-secondary', TEXT_DIRECTION)}>{change.field}</span>
      <span className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1.5">
        {hasFrom && (
          <>
            <span className="sr-only">{messages['history.before']}</span>
            <bdi className="text-secondary tabular-nums">{change.from}</bdi>
            <ArrowRight
              aria-hidden="true"
              className="size-3 shrink-0 self-center text-tertiary rtl:-scale-x-100"
            />
          </>
        )}
        <span className="sr-only">{messages['history.after']}</span>
        <bdi className="font-medium text-primary tabular-nums">{hasTo ? change.to : '—'}</bdi>
      </span>
    </li>
  )
}

function Entry({ entry }: { entry: HistoryEntry }) {
  const { messages, format } = useLiro()
  const kind = entry.actor.kind ?? 'human'
  return (
    <li
      data-slot="history-entry"
      className="flex min-w-0 gap-3 border-0 border-t border-solid border-subtle py-2.5 first:border-t-0 first:pt-0"
    >
      <ActorMarker actor={entry.actor} messages={messages} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="m-0 flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
              {entry.actor.name}
            </span>
            {kind === 'agent' && <AgentMark />}
          </span>
          <time dateTime={entry.at} dir="ltr" className="text-xs text-tertiary tabular-nums">
            {entry.time ?? format.time(entry.at)}
          </time>
        </p>
        {entry.text !== undefined && (
          <div className={cn('text-sm text-primary', TEXT_DIRECTION)}>{entry.text}</div>
        )}
        {entry.changes !== undefined && entry.changes.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {entry.changes.map((change, index) => (
              <ChangeLine
                key={`${change.field}-${String(index)}`}
                change={change}
                messages={messages}
              />
            ))}
          </ul>
        )}
        {entry.onBehalfOf !== undefined && (
          <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
            {messages['history.onBehalfOf'](entry.onBehalfOf)}
          </p>
        )}
      </div>
    </li>
  )
}

/** The heading of a day: "Today", "Yesterday" or the date. */
export function dayHeading(
  group: DayGroup<unknown>,
  messages: LiroMessages,
  date: (day: string) => string,
): string {
  if (group.kind === 'today') return messages['notifications.today']
  if (group.kind === 'yesterday') return messages['notifications.yesterday']
  return date(group.day)
}

/** The full history of a record: who, when, what changed; grouped by day, newest first. */
export function HistoryList({
  entries,
  label,
  hasMore = false,
  onLoadMore,
  loading = false,
  headingLevel = 3,
  className,
}: HistoryListProps) {
  const { messages, format, today } = useLiro()
  const idPrefix = useId()
  const Heading = `h${String(headingLevel)}` as 'h3'

  if (entries.length === 0) {
    if (loading) {
      return (
        <div
          role="group"
          aria-label={label}
          aria-busy="true"
          className={cn('flex flex-col gap-3 font-sans', className)}
        >
          <span className="sr-only">{messages['field.loading']}</span>
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="size-6.5 shrink-0 rounded-xl" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3.5 w-full max-w-80" />
              </div>
            </div>
          ))}
        </div>
      )
    }
    return (
      <EmptyState
        compact
        title={messages['history.emptyTitle']}
        description={messages['history.emptyDescription']}
        {...(className === undefined ? {} : { className })}
      />
    )
  }

  const groups = groupByDayOf(entries, (entry) => entry.at, today, 'newest')
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="history-list"
      className={cn('flex flex-col items-stretch gap-4 font-sans', className)}
    >
      {groups.map((group) => {
        const headingId = `${idPrefix}-${group.day}`
        return (
          <section key={group.day} aria-labelledby={headingId} className="flex flex-col gap-2">
            <Heading
              id={headingId}
              className={cn('m-0 text-xs font-semibold text-secondary', TEXT_DIRECTION)}
            >
              {dayHeading(group, messages, (day) => format.date(day))}
            </Heading>
            <ol className="m-0 flex list-none flex-col p-0">
              {group.items.map((entry) => (
                <Entry key={entry.id} entry={entry} />
              ))}
            </ol>
          </section>
        )
      })}
      {loading ? (
        <Spinner size="sm" className="self-start">
          <span className="text-xs text-secondary">{messages['field.loading']}</span>
        </Spinner>
      ) : (
        hasMore &&
        onLoadMore !== undefined && (
          <div className="flex">
            <Button
              family="neutral"
              icon={ChevronDown}
              label={messages['history.showMore']}
              onClick={onLoadMore}
            />
          </div>
        )
      )}
    </div>
  )
}
