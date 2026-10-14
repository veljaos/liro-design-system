import type { ReactNode } from 'react'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { langAttribute } from '../provider/lang'
import { useLiro } from '../provider/liro-provider'
import { articlePlaces, bylineText } from './blog-logic'
import { EmptyState, ErrorState } from './empty-state'
import { Skeleton } from './progress'
import { usePhone } from './use-phone'

/*
 * ArticleList (BUILD-PLAN P5.39): articles to read — a blog's posts, a magazine's stories, a
 * newsroom's notes — as cards: the cover, the category, the title (a link to the article), the
 * excerpt and the byline (author · date · reading time). Generic: every word and figure is the
 * application's; the date goes through the provider's `format`.
 * - Cards stand without frames on the page (calm reading, no boxes): the cover in a 16:9 slot on
 *   surface.sunken (radius lg; the application's image or drawing, decorative), the category (xs
 *   medium text.secondary), the title (h4 size, semibold, text.primary; underlined on hover and
 *   focus), the excerpt (sm text.secondary, three lines) and the byline (xs text.tertiary). The
 *   whole card is the title's link (its press area covers the card); the link is named by the
 *   title alone.
 * - The grid follows its own width: columns of at least 17rem, 24px apart; one column on phones.
 *   `featured`: the first article spans the row, its cover beside the text on a desktop (the
 *   blog's lead story).
 * - Loading: skeleton cards. None: the application's `empty`, or EmptyState's no-results. Error:
 *   ErrorState with the application's Try again.
 * - `headingLevel` (default 2) keeps the page's outline; `lang` marks an article in another
 *   language (D15).
 */

/** One article in a list. */
export interface ArticleSummary {
  id: string
  title: string
  /** The article, through the provider's `linkComponent`. */
  href: string
  /** One or two sentences about it. */
  excerpt?: ReactNode
  /** The cover: an image or a drawing, decorative (the title names the card). */
  cover?: ReactNode
  /** Its category, in words. */
  category?: string
  /** Who wrote it. */
  author?: string
  /** When it was published, YYYY-MM-DD. */
  date?: string
  /** How long it takes to read, in the application's words ("6 min read"). */
  readingTime?: string
  /** The language tag of its texts when it differs from the page's. */
  lang?: string
}

export interface ArticleListProps {
  /** The list's name for assistive technology ("Latest articles"). */
  label: string
  articles: readonly ArticleSummary[]
  /** The first article as the lead story, across the row. Default false. */
  featured?: boolean
  /** The level of the titles. Default 2. */
  headingLevel?: 2 | 3 | 4
  /** Skeleton cards instead of the articles. */
  loading?: boolean
  /** How many skeleton cards. Default 6. */
  skeletonCount?: number
  /** Shown when there are no articles. Default: EmptyState's no-results. */
  empty?: ReactNode
  /** Loading failed: ErrorState with this text. */
  error?: ReactNode
  /** Try again after an error. */
  onRetry?: () => void
  /** 'phone' forces one column; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

function Card({
  article,
  lead,
  level,
}: {
  article: ArticleSummary
  lead: boolean
  level: 2 | 3 | 4
}) {
  const { format, locale, linkComponent: Link } = useLiro()
  const Heading = `h${String(level)}` as 'h2'
  const byline = bylineText([
    article.author,
    article.date === undefined ? undefined : format.date(article.date),
    article.readingTime,
  ])
  return (
    <article
      data-slot="article-card"
      {...langAttribute(article.lang, locale)}
      className={cn(
        'group relative flex h-full w-full min-w-0 font-sans text-primary',
        lead
          ? 'flex-col gap-4 @min-[44rem]:grid @min-[44rem]:grid-cols-2 @min-[44rem]:gap-8'
          : 'flex-col gap-3',
      )}
    >
      {article.cover !== undefined && (
        <div
          aria-hidden="true"
          className="aspect-video min-w-0 overflow-hidden rounded-lg bg-surface-sunken *:size-full"
        >
          {article.cover}
        </div>
      )}
      <div className={cn('flex min-w-0 flex-col gap-1.5', lead && '@min-[44rem]:justify-center')}>
        {article.category !== undefined && (
          <p className={cn('m-0 text-xs font-medium text-secondary', TEXT_DIRECTION)}>
            {article.category}
          </p>
        )}
        <Heading
          className={cn(
            'm-0 font-semibold break-words text-primary',
            lead ? 'text-h3' : 'text-h4',
            TEXT_DIRECTION,
          )}
        >
          <Link
            href={article.href}
            className={cn(
              'rounded-sm text-primary no-underline visited:text-primary group-hover:underline focus-visible:underline',
              'after:absolute after:inset-0 after:content-[""]',
              FOCUS_RING,
            )}
          >
            {article.title}
          </Link>
        </Heading>
        {article.excerpt !== undefined && (
          <p
            className={cn(
              'm-0 text-sm text-secondary',
              lead ? 'line-clamp-4' : 'line-clamp-3',
              TEXT_DIRECTION,
            )}
          >
            {article.excerpt}
          </p>
        )}
        {byline !== '' && (
          <p className={cn('m-0 text-xs text-tertiary', TEXT_DIRECTION)}>{byline}</p>
        )}
      </div>
    </article>
  )
}

/** Articles as cards: cover, category, title, excerpt and byline. */
export function ArticleList(props: ArticleListProps) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const grid = phone ? 'grid-cols-1' : 'grid-cols-[repeat(auto-fill,minmax(17rem,1fr))]'
  const level = props.headingLevel ?? 2

  if (props.error !== undefined) {
    return (
      <ErrorState
        description={props.error}
        {...(props.onRetry === undefined
          ? {}
          : { action: { label: messages['searchResults.retry'], onClick: props.onRetry } })}
        {...(props.className === undefined ? {} : { className: props.className })}
      />
    )
  }
  if (props.loading === true) {
    return (
      <div
        aria-busy="true"
        data-slot="article-list"
        className={cn('grid gap-6', grid, props.className)}
      >
        <span className="sr-only">{messages['field.loading']}</span>
        {Array.from({ length: props.skeletonCount ?? 6 }, (_, index) => (
          <div key={index} aria-hidden="true" className="flex flex-col gap-3">
            <Skeleton className="aspect-video rounded-lg" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-10" />
          </div>
        ))}
      </div>
    )
  }
  if (props.articles.length === 0) {
    return (
      <div className={props.className}>{props.empty ?? <EmptyState variant="no-results" />}</div>
    )
  }
  const places = articlePlaces(props.articles, props.featured === true)
  return (
    <div data-slot="article-list" className={cn('@container min-w-0', props.className)}>
      <ul aria-label={props.label} className={cn('m-0 grid list-none gap-x-6 gap-y-8 p-0', grid)}>
        {places.featured !== null && (
          <li className="col-span-full flex min-w-0">
            <Card article={places.featured} lead={!phone} level={level} />
          </li>
        )}
        {places.rest.map((article) => (
          <li key={article.id} className="flex min-w-0">
            <Card article={article} lead={false} level={level} />
          </li>
        ))}
      </ul>
    </div>
  )
}
