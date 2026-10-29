import { ChevronDown } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { FOCUS_RING, LINK_ITEM_HOVER, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import { SectionCard } from './cards'
import { EmptyState, ErrorState } from './empty-state'
import type { GazetteReference, RelatedAct } from './legal-model'
import { Skeleton } from './progress'
import { Spinner } from './spinner'
import { StatusBadge } from './status-badge'

/*
 * GazetteIssues (BUILD-PLAN P5.27 e): what is new in an official gazette, issue by issue, the
 * newest first — a SectionCard titled by the application ("New in the Illustrative Gazette").
 * - Each issue: its number as a heading ("No. 9/2024", a link with `href`), its day ("Published
 *   15.02.2024.", through `format.date`) and how many acts it holds, in xs text.secondary; then
 *   its acts, each a row: the type (xs text.secondary) with the status at the end (StatusBadge,
 *   the application's tone), the title as a link (sm medium, the link colour), and the
 *   application's short note ("Amends the Law on …", xs text.secondary). Rows 8px above and below
 *   with a border.subtle line between them (as the side panels' lists); 16px between issues.
 * - Paging from the application: "Show more issues" under the list (`hasMore`, `onLoadMore`);
 *   while `loading`, skeletons at first, then a small spinner in the button's place.
 * - Empty: "No new issues". Failed: ErrorState with "Try again" (`onRetry`).
 * The issues, their order, the notes and the statuses are the application's; nothing is computed.
 */

/** One issue of the gazette: its reference (number, day, address) and the acts in it. */
export interface GazetteIssue extends GazetteReference {
  /** The day it was published, YYYY-MM-DD. */
  published: string
  /** Its acts, in the application's order; `note` says what an act does ("Amends …"). */
  acts: readonly RelatedAct[]
}

export interface GazetteIssuesProps {
  /** The card's title, from the application ("New in the Illustrative Gazette"). */
  title: ReactNode
  /** A line under the title. */
  description?: ReactNode
  /** Actions at the end of the header ("Watch for changes"). */
  actions?: ReactNode
  /** The issues, newest first. */
  issues: readonly GazetteIssue[]
  /** More, older issues exist: "Show more issues" under the list. */
  hasMore?: boolean
  /** Load the next, older issues (the application pages). */
  onLoadMore?: () => void
  /** The application is loading: skeletons at first, then a spinner in place of "Show more". */
  loading?: boolean
  /** Loading failed: ErrorState in place of the issues. */
  error?: boolean
  /** "Try again" after a failure. */
  onRetry?: () => void
  /** The title's heading level; the issues' headings are one level below. Default 2. */
  headingLevel?: 2 | 3 | 4
  className?: string
}

/** One act of an issue: type and status, the title as a link, the note. */
function ActRow({ act }: { act: RelatedAct }) {
  const { linkComponent: Link } = useLiro()
  return (
    <li
      data-slot="gazette-act"
      className={cn(
        '-mx-2 flex min-w-0 flex-col gap-0.5 rounded-md border-0 border-t border-solid border-subtle px-2 py-2 first:border-t-0',
        LINK_ITEM_HOVER,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn('min-w-0 text-xs text-secondary', TEXT_DIRECTION)}>{act.type}</span>
        {act.status !== undefined && (
          <span className="shrink-0">
            <StatusBadge label={act.status.label} tone={act.status.tone} />
          </span>
        )}
      </div>
      <Link
        href={act.href}
        className={cn(
          'self-start rounded-sm text-sm font-medium break-words text-link no-underline visited:text-link',
          FOCUS_RING,
          TEXT_DIRECTION,
        )}
      >
        {act.title}
      </Link>
      {act.note !== undefined && (
        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{act.note}</span>
      )}
    </li>
  )
}

/** Skeleton issues while the first page loads. */
function IssueSkeletons() {
  const { messages } = useLiro()
  return (
    <div aria-busy="true" className="flex flex-col gap-4 p-4">
      <span className="sr-only">{messages['field.loading']}</span>
      {[0, 1].map((issue) => (
        <div key={issue} aria-hidden="true" className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-40" />
          {[0, 1].map((act) => (
            <div key={act} className="flex flex-col gap-1.5 py-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className={cn('h-3.5', act === 0 ? 'w-3/4' : 'w-1/2')} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/** "New in the gazette": issue by issue, the newest first, each with its acts. */
export function GazetteIssues(props: GazetteIssuesProps) {
  const { messages, format, linkComponent: Link } = useLiro()
  const idPrefix = useId()
  const level = props.headingLevel ?? 2
  const IssueHeading = `h${String(level + 1)}` as 'h3'
  const loading = props.loading === true

  let body: ReactNode
  if (props.error === true) {
    body = (
      <ErrorState
        compact
        {...(props.onRetry === undefined
          ? {}
          : { action: { label: messages['legalSearch.retry'], onClick: props.onRetry } })}
      />
    )
  } else if (props.issues.length === 0) {
    body = loading ? (
      <IssueSkeletons />
    ) : (
      <EmptyState
        compact
        title={messages['gazette.emptyTitle']}
        description={messages['gazette.emptyDescription']}
      />
    )
  } else {
    body = (
      <div className="flex flex-col gap-4 p-4">
        {props.issues.map((issue) => {
          const headingId = `${idPrefix}-${issue.id}`
          return (
            <section
              key={issue.id}
              aria-labelledby={headingId}
              data-slot="gazette-issue"
              className="flex flex-col gap-1"
            >
              <IssueHeading
                id={headingId}
                className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}
              >
                {issue.href === undefined ? (
                  issue.label
                ) : (
                  <Link
                    href={issue.href}
                    className={cn(
                      'rounded-sm text-link no-underline visited:text-link',
                      FOCUS_RING,
                    )}
                  >
                    {issue.label}
                  </Link>
                )}
              </IssueHeading>
              <span className={cn('text-xs text-secondary tabular-nums', TEXT_DIRECTION)}>
                {messages['gazette.published'](format.date(issue.published))}
                <span aria-hidden="true"> · </span>
                {messages['gazette.acts'](
                  issue.acts.length,
                  format.number(String(issue.acts.length)),
                )}
              </span>
              <ul className="m-0 flex list-none flex-col p-0">
                {issue.acts.map((act) => (
                  <ActRow key={act.id} act={act} />
                ))}
              </ul>
            </section>
          )
        })}
        {loading ? (
          <Spinner size="sm" className="self-start">
            <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
              {messages['field.loading']}
            </span>
          </Spinner>
        ) : (
          props.hasMore === true &&
          props.onLoadMore !== undefined && (
            <div className="flex">
              <Button
                family="neutral"
                icon={ChevronDown}
                label={messages['gazette.showMore']}
                onClick={props.onLoadMore}
              />
            </div>
          )
        )}
      </div>
    )
  }

  return (
    <SectionCard
      flush
      headingLevel={level}
      title={props.title}
      {...(props.description === undefined ? {} : { description: props.description })}
      {...(props.actions === undefined ? {} : { actions: props.actions })}
      {...(props.className === undefined ? {} : { className: props.className })}
    >
      <div data-slot="gazette-issues" className="border-0 border-t border-solid border-default">
        {body}
      </div>
    </SectionCard>
  )
}
