import { Lightbulb } from 'lucide-react'
import { useId, type MouseEvent, type ReactNode } from 'react'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { langAttribute } from '../provider/lang'
import { useLiro } from '../provider/liro-provider'
import { Spinner } from './spinner'

/*
 * LinkSuggestions (BUILD-PLAN P5.30 d): pages the application proposes while the user writes —
 * help articles while a customer describes a problem, similar answers while an agent writes one.
 * The application searches (after a pause in typing, as ComboboxField's 300ms) and gives the
 * suggestions; the list only shows them. It never blocks what the user is doing: it takes no
 * focus, opens nothing by itself, and the form beside it stays usable with or without it.
 * - A box on the raised surface with a border.default border, radius md, 12px 16px: the title
 *   (the application's, "These articles may help", sm semibold) with a Lightbulb, then the
 *   suggestions as a list, each a link (sm medium, the link colour) with an optional line of
 *   context (`meta`, xs text.tertiary: the category) and a short summary (xs text.secondary,
 *   at most two lines on the page; the whole summary is in the link's description). Rows 8px
 *   apart with a border.subtle line between them. Not a toned background (it is a hint, not a
 *   warning).
 * - While the application searches (`loading`) a small spinner and "Looking for suggestions…"
 *   stand under the title; the earlier suggestions stay until new ones arrive.
 * - Without suggestions and not loading, nothing is drawn but a hidden status, so the count can
 *   still be announced politely ("3 suggestions", "No suggestions") as they change.
 * - `onOpen` reports a press on a suggestion (the application may keep the draft, log the
 *   choice or open the page in a drawer instead and call `preventDefault`).
 */

/** One suggested page. */
export interface LinkSuggestion {
  id: string
  /** The page's title, the link's text. */
  title: string
  /** Where it leads, through the provider's `linkComponent`. */
  href: string
  /** A short summary under the title, from the application. */
  summary?: ReactNode
  /** A line of context above the title ("E-invoicing"). */
  meta?: ReactNode
  /** The language tag of the title and summary when it differs from the page's (D15). */
  lang?: string
}

export interface LinkSuggestionsProps {
  /** The box's title, from the application ("These articles may help"). */
  title: ReactNode
  /** The suggestions, best first. */
  suggestions: readonly LinkSuggestion[]
  /** The application is searching. */
  loading?: boolean
  /** A press on a suggestion (before the link is followed). */
  onOpen?: (suggestion: LinkSuggestion, event: MouseEvent<HTMLAnchorElement>) => void
  /** The title's heading level. Default 2. */
  headingLevel?: 2 | 3 | 4
  className?: string
}

/** Pages that may help, proposed by the application while the user writes. */
export function LinkSuggestions(props: LinkSuggestionsProps) {
  const { messages, format, locale, linkComponent: Link } = useLiro()
  const titleId = useId()
  const loading = props.loading === true
  const count = props.suggestions.length
  const Heading = `h${String(props.headingLevel ?? 2)}` as 'h2'
  // The polite count is announced only once the search has answered.
  const status = loading ? '' : messages['suggestions.count'](count, format.number(String(count)))
  const shown = count > 0 || loading
  return (
    <div data-slot="link-suggestions" className={cn('min-w-0 font-sans', props.className)}>
      <span role="status" className="sr-only">
        {status}
      </span>
      {shown && (
        <section
          aria-labelledby={titleId}
          className="box-border flex flex-col gap-2 rounded-md border border-solid border-default bg-surface-raised px-4 py-3"
        >
          <Heading
            id={titleId}
            className="m-0 flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <Lightbulb aria-hidden="true" className="size-4 shrink-0 text-secondary" />
            <span className={cn('min-w-0', TEXT_DIRECTION)}>{props.title}</span>
          </Heading>
          {loading && (
            <Spinner size="sm" className="self-start">
              <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                {messages['suggestions.searching']}
              </span>
            </Spinner>
          )}
          {count > 0 && (
            <ul className="m-0 flex list-none flex-col p-0">
              {props.suggestions.map((suggestion) => {
                const lang = langAttribute(suggestion.lang, locale)
                const summaryId = `${titleId}-${suggestion.id}`
                return (
                  <li
                    key={suggestion.id}
                    data-slot="link-suggestion"
                    className="flex min-w-0 flex-col gap-0.5 border-0 border-t border-solid border-subtle py-2 first:border-t-0 first:pt-0 last:pb-0"
                  >
                    {suggestion.meta !== undefined && (
                      <span className={cn('text-xs text-tertiary', TEXT_DIRECTION)}>
                        {suggestion.meta}
                      </span>
                    )}
                    <Link
                      href={suggestion.href}
                      {...lang}
                      {...(suggestion.summary === undefined
                        ? {}
                        : { 'aria-describedby': summaryId })}
                      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                        props.onOpen?.(suggestion, event)
                      }}
                      className={cn(
                        'self-start rounded-sm text-sm font-medium break-words text-link no-underline visited:text-link hover:underline',
                        FOCUS_RING,
                        TEXT_DIRECTION,
                      )}
                    >
                      {suggestion.title}
                    </Link>
                    {suggestion.summary !== undefined && (
                      <span
                        id={summaryId}
                        {...lang}
                        className={cn('line-clamp-2 text-xs text-secondary', TEXT_DIRECTION)}
                      >
                        {suggestion.summary}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
