import { ArrowUpDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { ActionButton } from '../components/actions'
import { formatCount, type DataTableFilters } from '../components/data-table-logic'
import { EmptyState, ErrorState } from '../components/empty-state'
import { FilterBar } from '../components/filter-bar'
import { clearFilters, isFilterSet, type FilterDefinition } from '../components/filter-logic'
import { CursorPagination } from '../components/navigation'
import { Skeleton } from '../components/progress'
import { RefetchLoader } from '../components/refetch-loader'
import { StatusBadge } from '../components/status-badge'
import { usePhone } from '../components/use-phone'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  DropdownMenu as MenuRoot,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu'
import { langAttribute } from '../provider/lang'
import { useLiro } from '../provider/liro-provider'
import {
  gazetteNumbers,
  type LegalSearchResult,
  type LegalSearchSort,
  type LegalSnippet,
} from './legal-search-logic'
import { ListPage, type SavedView } from './list-page'

/*
 * LegalSearchPage (BUILD-PLAN P5.27 e): a full-text search across legal acts, on ListPage — the
 * page's title (for screen readers, as a list's) and main action, then ONE card: the saved views,
 * the FilterBar (search at the start, filters beside it and in the drawer, pills under it) and
 * the results.
 * - The application searches and filters; the page reports the query (after typing pauses), the
 *   filter values and the sort, and shows the results it is given, in their order.
 * - Filters are FilterBar's kinds: type, issuer and status as choices, the area as a tree (in the
 *   drawer), the gazette's year and number, the date in force as a date range.
 * - Results are a list, not a table: a snippet needs the width. Over the list, the count
 *   ("128 results", `legalSearch.count`) with the refetch loader at the start and "Sort:
 *   Relevance" at the end (with `sortOptions`). Each result, 12px by 16px with a border.subtle
 *   line between results: the type and issuer (xs text.secondary) with the status at the end
 *   (StatusBadge, the application's tone, never blue); the title as a link (an h2, semibold, the
 *   link colour); the gazette references ("Illustrative Gazette No. 12/2016, 47/2018", xs,
 *   tabular); the snippet (sm text.secondary), each match in a <mark> on the warning background
 *   and semibold — never colour alone, never a blue fill; "Found in Article 57" linking to the
 *   article.
 * - Paging by cursor under the list (CursorPagination: previous and next).
 * - States: skeleton results while the first page loads, the refetch loader while results stand;
 *   "Nothing matches" (EmptyState no-results, with "Clear filters" while a filter is set);
 *   nothing yet (EmptyState) before anything is searched; ErrorState with "Try again".
 * - Phones (below 48em, or `layout`): the same results in one column; every filter in
 *   FilterBar's drawer.
 */

export interface LegalSearchPageProps {
  /** The page's title (h1), from the application ("Legal information"). */
  title: string
  /** For screen readers only (a module tab names the page). Default true, as ListPage's. */
  titleHidden?: boolean
  /** The page's main action at the end of the title row. */
  actions?: ReactNode
  /** Saved views (the card's first row): "All acts", "In force", "Bookmarked". */
  views?: readonly SavedView[]
  view?: string
  onViewChange?: (id: string) => void
  /** At the end of the views row ("Save view"). */
  saveView?: ReactNode
  /** The search text, and its change (after typing pauses, at once when cleared). */
  search: string
  onSearchChange: (text: string) => void
  /** The search field's placeholder and name. Default: `messages['filter.search']`. */
  searchPlaceholder?: string
  /** The filters (FilterBar's kinds; the area a 'tree'), their values and their change. */
  filters: readonly FilterDefinition[]
  values: DataTableFilters
  onValuesChange: (values: DataTableFilters) => void
  /** How many filters stand in the row on desktop (a tree never does). Default 0. */
  inline?: number
  /** Shows the filters drawer from the start (the application restores it). */
  defaultFiltersOpen?: boolean
  /** The results of the current page, in the application's order. */
  results: readonly LegalSearchResult[]
  /** How many acts match in all; over the list. */
  count?: number
  /** Whether `count` is exact; default true. Above 10.000: "More than 10.000 results". */
  countIsExact?: boolean
  /** The ways to sort; with `onSortChange`, "Sort: …" stands over the list. */
  sortOptions?: readonly LegalSearchSort[]
  sort?: string
  onSortChange?: (sort: string) => void
  /** The application is searching: skeletons at first, then the refetch loader. */
  loading?: boolean
  /** The search failed: ErrorState in place of the results. */
  error?: boolean
  /** The failure's case number, shown so the user can quote it. */
  errorCaseId?: string
  /** "Try again" after a failure. */
  onRetry?: () => void
  /** Cursor paging: previous and next pages of results. */
  hasPrevious?: boolean
  hasNext?: boolean
  onPrevious?: () => void
  onNext?: () => void
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** A snippet: text, each match in a <mark> (semibold on the warning background). */
function Snippet({ snippet }: { snippet: LegalSnippet }) {
  return (
    <>
      {snippet.map((part, index) =>
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

/** "Sort: Relevance", opening the application's ways to sort. */
function SortMenu(props: {
  options: readonly LegalSearchSort[]
  sort: string | undefined
  onSortChange: (sort: string) => void
}) {
  const { messages } = useLiro()
  const current = props.options.find((option) => option.value === props.sort) ?? props.options[0]
  return (
    <MenuRoot modal={false}>
      <DropdownMenuTrigger asChild>
        <ActionButton
          small
          action={{
            family: 'neutral',
            icon: ArrowUpDown,
            emphasis: 'menu',
            label: messages['legalSearch.sortBy'](current?.label ?? ''),
          }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" avoidCollisions={false}>
        <DropdownMenuRadioGroup value={current?.value ?? ''} onValueChange={props.onSortChange}>
          {props.options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value} check>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </MenuRoot>
  )
}

/** One result: type, issuer and status; the title; the gazette; the snippet; the article. */
function ResultRow({ result }: { result: LegalSearchResult }) {
  const { messages, locale, linkComponent: Link } = useLiro()
  const lang = langAttribute(result.lang, locale)
  const numbers = gazetteNumbers(result.gazette)
  return (
    <li
      data-slot="legal-search-result"
      className="flex flex-col gap-1 border-0 border-t border-solid border-subtle px-4 py-3 first:border-t-0"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn('min-w-0 text-xs text-secondary', TEXT_DIRECTION)}>
          {result.type}
          {result.issuer !== undefined && (
            <>
              <span aria-hidden="true"> · </span>
              {result.issuer}
            </>
          )}
        </span>
        <span className="shrink-0">
          <StatusBadge label={result.status.label} tone={result.status.tone} />
        </span>
      </div>
      <h2 className="m-0 text-md font-semibold">
        <Link
          href={result.href}
          {...lang}
          className={cn(
            'rounded-sm break-words text-link no-underline visited:text-link hover:underline',
            FOCUS_RING,
            TEXT_DIRECTION,
          )}
        >
          {result.title}
        </Link>
      </h2>
      {numbers !== '' && (
        <span className={cn('text-xs text-secondary tabular-nums', TEXT_DIRECTION)}>
          {result.gazetteName === undefined
            ? numbers
            : messages['legalSearch.gazette'](result.gazetteName, numbers)}
        </span>
      )}
      {result.snippet !== undefined && result.snippet.length > 0 && (
        <p {...lang} className={cn('m-0 text-sm break-words text-secondary', TEXT_DIRECTION)}>
          <Snippet snippet={result.snippet} />
        </p>
      )}
      {result.article !== undefined && (
        <Link
          href={result.article.href}
          className={cn(
            'self-start rounded-sm text-xs text-link no-underline visited:text-link hover:underline',
            FOCUS_RING,
            TEXT_DIRECTION,
          )}
        >
          {messages['legalSearch.foundIn'](result.article.label)}
        </Link>
      )}
    </li>
  )
}

/** Skeleton results while the first page loads. */
function ResultSkeletons() {
  const { messages } = useLiro()
  return (
    <div aria-busy="true" className="flex flex-col">
      <span className="sr-only">{messages['table.updating']}</span>
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex flex-col gap-2 border-0 border-t border-solid border-subtle px-4 py-3 first:border-t-0"
        >
          <Skeleton className="h-3 w-32" />
          <Skeleton className={cn('h-4', index % 2 === 0 ? 'w-3/4' : 'w-1/2')} />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3.5 w-full" />
        </div>
      ))}
    </div>
  )
}

/** A search across legal acts: filters, results with highlighted snippets, paging. */
export function LegalSearchPage(props: LegalSearchPageProps) {
  const { messages, format } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const loading = props.loading === true
  const filtered = props.filters.some((filter) => isFilterSet(props.values[filter.id]))
  const searched = props.search.trim() !== '' || filtered
  const clear = () => {
    props.onValuesChange(clearFilters(props.filters, props.values))
  }

  let body: ReactNode
  if (props.error === true) {
    body = (
      <ErrorState
        compact
        {...(props.errorCaseId === undefined ? {} : { caseId: props.errorCaseId })}
        {...(props.onRetry === undefined
          ? {}
          : { action: { label: messages['legalSearch.retry'], onClick: props.onRetry } })}
      />
    )
  } else if (props.results.length === 0) {
    body = loading ? (
      <ResultSkeletons />
    ) : searched ? (
      <EmptyState
        variant="no-results"
        compact
        {...(filtered ? { action: { label: messages['table.clearFilters'], onClick: clear } } : {})}
      />
    ) : (
      <EmptyState compact />
    )
  } else {
    body = (
      <ul aria-label={messages['legalSearch.results']} className="m-0 flex list-none flex-col p-0">
        {props.results.map((result) => (
          <ResultRow key={result.id} result={result} />
        ))}
      </ul>
    )
  }

  const showCount = props.count !== undefined && props.error !== true
  const sortable =
    props.onSortChange !== undefined &&
    props.sortOptions !== undefined &&
    props.sortOptions.length > 0 &&
    props.results.length > 0 &&
    props.error !== true
  const paged =
    props.error !== true &&
    props.results.length > 0 &&
    (props.hasPrevious === true || props.hasNext === true)

  return (
    <ListPage
      title={props.title}
      titleHidden={props.titleHidden ?? true}
      layout={phone ? 'phone' : 'desktop'}
      {...(props.actions === undefined ? {} : { actions: props.actions })}
      {...(props.views === undefined ? {} : { views: props.views })}
      {...(props.view === undefined ? {} : { view: props.view })}
      {...(props.onViewChange === undefined ? {} : { onViewChange: props.onViewChange })}
      {...(props.saveView === undefined ? {} : { saveView: props.saveView })}
      {...(props.className === undefined ? {} : { className: props.className })}
      filterBar={
        <FilterBar
          inCard
          layout={phone ? 'phone' : 'desktop'}
          filters={props.filters}
          values={props.values}
          onValuesChange={props.onValuesChange}
          search={props.search}
          onSearchChange={props.onSearchChange}
          {...(props.searchPlaceholder === undefined
            ? {}
            : { searchPlaceholder: props.searchPlaceholder })}
          {...(props.inline === undefined ? {} : { inline: props.inline })}
          {...(props.defaultFiltersOpen === undefined
            ? {}
            : { defaultFiltersOpen: props.defaultFiltersOpen })}
        />
      }
    >
      <div data-slot="legal-search-results" className="flex min-w-0 flex-col">
        {(showCount || sortable || loading) && (
          <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-0 border-b border-solid border-default px-4 py-1">
            <span className="flex min-w-0 items-center gap-2">
              {showCount && props.count !== undefined && (
                <span className={cn('text-xs text-secondary', TEXT_DIRECTION)} aria-live="polite">
                  {formatCount(
                    { 'table.count': messages['legalSearch.count'] },
                    format,
                    props.count,
                    props.countIsExact ?? true,
                  )}
                </span>
              )}
              <RefetchLoader active={loading && props.results.length > 0} />
            </span>
            {sortable && props.onSortChange !== undefined && (
              <SortMenu
                options={props.sortOptions ?? []}
                sort={props.sort}
                onSortChange={props.onSortChange}
              />
            )}
          </div>
        )}
        {body}
        {paged && (
          <div className="border-0 border-t border-solid border-default px-4 py-3">
            <CursorPagination
              hasPrevious={props.hasPrevious === true}
              hasNext={props.hasNext === true}
              onPrevious={() => props.onPrevious?.()}
              onNext={() => props.onNext?.()}
            />
          </div>
        )}
      </div>
    </ListPage>
  )
}
