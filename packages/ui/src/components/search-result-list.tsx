import { useId, type MouseEvent, type ReactNode } from 'react'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { langAttribute } from '../provider/lang'
import { useLiro } from '../provider/liro-provider'
import { EmptyState, ErrorState } from './empty-state'
import { highlightText, type Highlight } from './help-logic'
import { Skeleton } from './progress'
import { Spinner } from './spinner'

/*
 * SearchResultList (BUILD-PLAN P5.30 e): the pages a search found — help articles, pages of a
 * guide, saved answers — as a list, each with its matches marked. A list, not a table: a snippet
 * needs the width (as the legal search recipe's results, P5.27). The
 * application searches, ranks and cuts the snippets; the list only shows them.
 * - Over the list a polite status: the count ("3 results", `count`) or the application's own
 *   words (`summary`: "3 results for “rejected”"); while the application searches again, a small
 *   spinner and "Updating…" beside it, the old results kept (aria-busy).
 * - A result: an optional line of context (`meta`, xs text.secondary: "E-invoicing · Updated
 *   08.10.2026.") with an optional badge at the end; the title as a heading with a link (md
 *   semibold, the link colour); the snippet (sm text.secondary). In the title and the snippet each
 *   match is a <mark>: semibold text.primary on the warning background — the weight tells it
 *   even without the colour. `extra` under the snippet (a "Found in …" link). Rows 12px 16px,
 *   divided by border.subtle lines.
 * - The first load: skeleton rows. No results: the application's `empty`, or EmptyState's
 *   no-results. Failed: ErrorState with "Try again" (`onRetry`).
 */

/** One page the search found. */
export interface SearchResult {
  id: string
  /** The title, plain or with its matches marked. */
  title: string | Highlight
  /** Where it leads, through the provider's `linkComponent`. */
  href: string
  /** A line of context above the title ("E-invoicing · Updated 08.10.2026."). */
  meta?: ReactNode
  /** At the end of the context line: a StatusBadge. */
  badge?: ReactNode
  /** The text around the matches, the matches marked. */
  snippet?: Highlight
  /** Under the snippet: a link to where in the page the match is. */
  extra?: ReactNode
  /** The language tag of the title and snippet when it differs from the page's (D15). */
  lang?: string
}

export interface SearchResultListProps {
  /** The list's name for assistive technology ("Search results"). */
  label: string
  /** The results of this page, in the application's order. */
  results: readonly SearchResult[]
  /** How many results there are in all: "3 results" over the list. */
  count?: number
  /** The application's own words over the list instead of the count. */
  summary?: ReactNode
  /** The application is searching. */
  loading?: boolean
  /** The search failed: ErrorState in place of the results. */
  error?: boolean
  /** "Try again" after a failure. */
  onRetry?: () => void
  /** Shown when nothing was found. Default: EmptyState's no-results. */
  empty?: ReactNode
  /** A press on a result's title (before the link is followed). */
  onOpen?: (result: SearchResult, event: MouseEvent<HTMLAnchorElement>) => void
  /** The titles' heading level. Default 2. */
  headingLevel?: 2 | 3 | 4
  className?: string
}

/** A text with its matches marked: semibold on the warning background. */
export function HighlightedText({ parts }: { parts: string | Highlight }) {
  if (typeof parts === 'string') return parts
  return (
    <>
      {parts.map((part, index) =>
        typeof part === 'string' ? (
          part
        ) : (
          <mark
            key={index}
            data-slot="search-match"
            className="rounded-xs bg-status-warning-bg font-semibold text-primary"
          >
            {part.match}
          </mark>
        ),
      )}
    </>
  )
}

function ResultRow({
  result,
  level,
  onOpen,
}: {
  result: SearchResult
  level: number
  onOpen: SearchResultListProps['onOpen']
}) {
  const { locale, linkComponent: Link } = useLiro()
  const lang = langAttribute(result.lang, locale)
  const Heading = `h${String(level)}` as 'h2'
  const plainTitle = typeof result.title === 'string' ? result.title : highlightText(result.title)
  return (
    <li
      data-slot="search-result"
      className="flex min-w-0 flex-col gap-1 border-0 border-t border-solid border-subtle px-4 py-3 first:border-t-0"
    >
      {(result.meta !== undefined || result.badge !== undefined) && (
        <div className="flex items-start justify-between gap-3">
          <span className={cn('min-w-0 text-xs text-secondary', TEXT_DIRECTION)}>
            {result.meta}
          </span>
          {result.badge !== undefined && <span className="shrink-0">{result.badge}</span>}
        </div>
      )}
      <Heading className="m-0 text-md font-semibold">
        <Link
          href={result.href}
          {...lang}
          // The marks split the title for assistive technology; the name is the whole title.
          aria-label={plainTitle}
          onClick={(event: MouseEvent<HTMLAnchorElement>) => {
            onOpen?.(result, event)
          }}
          className={cn(
            'rounded-sm break-words text-link no-underline visited:text-link hover:underline',
            FOCUS_RING,
            TEXT_DIRECTION,
          )}
        >
          <HighlightedText parts={result.title} />
        </Link>
      </Heading>
      {result.snippet !== undefined && result.snippet.length > 0 && (
        <p {...lang} className={cn('m-0 text-sm break-words text-secondary', TEXT_DIRECTION)}>
          <HighlightedText parts={result.snippet} />
        </p>
      )}
      {result.extra}
    </li>
  )
}

/** Skeleton results while the first page loads. */
function ResultSkeletons() {
  const { messages } = useLiro()
  return (
    <div aria-busy="true" className="flex flex-col">
      <span className="sr-only">{messages['field.loading']}</span>
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex flex-col gap-2 border-0 border-t border-solid border-subtle px-4 py-3 first:border-t-0"
        >
          <Skeleton className="h-3 w-32" />
          <Skeleton className={cn('h-4', index % 2 === 0 ? 'w-3/4' : 'w-1/2')} />
          <Skeleton className="h-3.5 w-full" />
        </div>
      ))}
    </div>
  )
}

/** What a search found: the count, then each result with its matches marked. */
export function SearchResultList(props: SearchResultListProps) {
  const { messages, format } = useLiro()
  const listId = useId()
  const loading = props.loading === true
  const level = props.headingLevel ?? 2
  const summary =
    props.summary ??
    (props.count === undefined
      ? undefined
      : messages['searchResults.count'](props.count, format.number(String(props.count))))

  let body: ReactNode
  if (props.error === true) {
    body = (
      <ErrorState
        compact
        {...(props.onRetry === undefined
          ? {}
          : { action: { label: messages['searchResults.retry'], onClick: props.onRetry } })}
      />
    )
  } else if (props.results.length === 0) {
    body = loading ? (
      <ResultSkeletons />
    ) : (
      (props.empty ?? <EmptyState compact variant="no-results" />)
    )
  } else {
    body = (
      <ul
        id={listId}
        aria-label={props.label}
        aria-busy={loading || undefined}
        className="m-0 flex list-none flex-col p-0"
      >
        {props.results.map((result) => (
          <ResultRow key={result.id} result={result} level={level} onOpen={props.onOpen} />
        ))}
      </ul>
    )
  }

  const showSummary = props.error !== true && !(loading && props.results.length === 0)
  return (
    <div
      data-slot="search-result-list"
      className={cn('flex min-w-0 flex-col font-sans', props.className)}
    >
      <div
        className={cn(
          'flex flex-wrap items-center gap-3 px-4',
          (showSummary && summary !== undefined) || loading
            ? 'min-h-8 pt-3 pb-1'
            : 'h-0 overflow-hidden',
        )}
      >
        <span role="status" className={cn('text-xs text-secondary tabular-nums', TEXT_DIRECTION)}>
          {showSummary ? summary : null}
        </span>
        {loading && props.results.length > 0 && (
          <Spinner size="sm">
            <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
              {messages['table.updating']}
            </span>
          </Spinner>
        )}
      </div>
      {body}
    </div>
  )
}
