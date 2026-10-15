import type { ReactNode } from 'react'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { langAttribute } from '../provider/lang'
import { useLiro } from '../provider/liro-provider'
import { bylineText } from '../components/blog-logic'
import { PersonAvatar } from '../components/person'
import { usePhone } from '../components/use-phone'
import { BackButton, type PageBack } from './page-header'

/*
 * ArticlePage (BUILD-PLAN P5.39): one article to read — a blog post, a news item, a long guide —
 * as a calm reading layout. Generic: every word is the application's; dates through `format`.
 * - **One reading column** (44rem, centred): the back button and the category (a link to it),
 *   the title as the page's h1, the lede (lg text.secondary), the byline (the author's avatar
 *   and name, then the date, the last change and the reading time in xs text.tertiary), the
 *   cover (16:9, radius lg, decorative), the body (the application's RichText, md text), the tags
 *   (neutral links), `share` (ShareLinks), `newsletter` (NewsletterSignup) and the related
 *   articles under an h2 ("Related articles"; an ArticleList).
 * - **Contents** (`contents`, a PageContents) for a long article: in a 14rem column at the start
 *   (the application makes it sticky under the shell); on a phone over the body (PageContents'
 *   disclosure).
 * - `lang` marks the article's language when it differs from the page's (D15).
 */

export interface ArticleAuthor {
  name: string
  /** A photo's address; the initials otherwise. */
  avatarSrc?: string
  /** A line about them ("Product manager, Liro"). */
  detail?: ReactNode
}

export interface ArticleTag {
  key: string
  label: string
  href: string
}

export interface ArticlePageProps {
  /** The page's h1. */
  title: string
  /** Back to the list ("Back to Blog"). */
  back?: PageBack
  /** The article's category, over the title (a link to the category). */
  category?: { label: string; href: string }
  /** One or two sentences under the title. */
  lede?: ReactNode
  author?: ArticleAuthor
  /** Published, YYYY-MM-DD. */
  date?: string
  /** Last changed, YYYY-MM-DD: "Updated 14.10.2026". */
  updated?: string
  /** How long it takes to read, in the application's words ("6 min read"). */
  readingTime?: string
  /** The cover: an image or a drawing, decorative. */
  cover?: ReactNode
  /** A PageContents for a long article. */
  contents?: ReactNode
  /** The body: the application's RichText. */
  children: ReactNode
  tags?: readonly ArticleTag[]
  /** ShareLinks. */
  share?: ReactNode
  /** NewsletterSignup. */
  newsletter?: ReactNode
  /** The related articles: an ArticleList. */
  related?: ReactNode
  /** The related articles' heading. Default `messages['article.related']`. */
  relatedTitle?: string
  /** The language tag of the article when it differs from the page's. */
  lang?: string
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** An article as a calm reading layout: title, byline, cover, body, then what follows. */
export function ArticlePage(props: ArticlePageProps) {
  const { messages, format, locale, linkComponent: Link } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const meta = bylineText([
    props.date === undefined ? undefined : format.date(props.date),
    props.updated === undefined
      ? undefined
      : messages['article.updated'](format.date(props.updated)),
    props.readingTime,
  ])
  const withSide = props.contents !== undefined && !phone

  const column = (
    <article
      {...langAttribute(props.lang, locale)}
      className="flex w-full max-w-[44rem] min-w-0 flex-col gap-6"
    >
      <header className="flex min-w-0 flex-col gap-3">
        {(props.back !== undefined || props.category !== undefined) && (
          <div className="flex min-w-0 items-center gap-2">
            {props.back !== undefined && <BackButton back={props.back} />}
            {props.category !== undefined && (
              <Link
                href={props.category.href}
                className={cn(
                  'rounded-sm text-sm font-medium text-link no-underline hover:underline',
                  FOCUS_RING,
                  TEXT_DIRECTION,
                )}
              >
                {props.category.label}
              </Link>
            )}
          </div>
        )}
        <h1
          className={cn(
            'm-0 break-words text-primary',
            phone ? 'text-h2' : 'text-h1',
            TEXT_DIRECTION,
          )}
        >
          {props.title}
        </h1>
        {props.lede !== undefined && (
          <p className={cn('m-0 text-lg text-secondary', TEXT_DIRECTION)}>{props.lede}</p>
        )}
        {(props.author !== undefined || meta !== '') && (
          <div className="flex min-w-0 items-center gap-3 pt-1">
            {props.author !== undefined && (
              <PersonAvatar
                name={props.author.name}
                {...(props.author.avatarSrc === undefined ? {} : { src: props.author.avatarSrc })}
              />
            )}
            <div className="flex min-w-0 flex-col gap-0.5">
              {props.author !== undefined && (
                <p className={cn('m-0 text-sm font-medium text-primary', TEXT_DIRECTION)}>
                  {props.author.name}
                  {props.author.detail !== undefined && (
                    <span className="font-regular text-secondary"> · {props.author.detail}</span>
                  )}
                </p>
              )}
              {meta !== '' && (
                <p className={cn('m-0 text-xs text-tertiary', TEXT_DIRECTION)}>{meta}</p>
              )}
            </div>
          </div>
        )}
      </header>
      {props.cover !== undefined && (
        <div
          aria-hidden="true"
          className="aspect-video min-w-0 overflow-hidden rounded-lg bg-surface-sunken *:size-full"
        >
          {props.cover}
        </div>
      )}
      {props.contents !== undefined && phone && props.contents}
      <div data-slot="article-body" className="min-w-0 text-md text-primary">
        {props.children}
      </div>
      {props.tags !== undefined && props.tags.length > 0 && (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className={cn('me-1 text-xs font-medium text-secondary', TEXT_DIRECTION)}>
            {messages['article.tags']}
          </span>
          <ul
            aria-label={messages['article.tags']}
            className="m-0 flex list-none flex-wrap gap-2 p-0"
          >
            {props.tags.map((tag) => (
              <li key={tag.key} className="flex">
                <Link
                  href={tag.href}
                  className={cn(
                    'inline-flex min-h-6 items-center rounded-sm border border-solid border-default bg-surface-raised px-2 text-xs text-primary no-underline visited:text-primary hover:bg-surface-hover',
                    FOCUS_RING,
                    TEXT_DIRECTION,
                  )}
                >
                  {tag.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {props.share}
      {props.newsletter}
      {props.related !== undefined && (
        <section className="flex min-w-0 flex-col gap-4 border-0 border-t border-solid border-default pt-6">
          <h2 className={cn('m-0 text-h3 text-primary', TEXT_DIRECTION)}>
            {props.relatedTitle ?? messages['article.related']}
          </h2>
          {props.related}
        </section>
      )}
    </article>
  )

  return (
    <div
      data-slot="article-page"
      className={cn(
        'box-border flex w-full min-w-0 justify-center font-sans',
        phone ? 'p-4' : 'px-6 py-8',
        props.className,
      )}
    >
      {withSide ? (
        <div className="grid w-full max-w-[60rem] min-w-0 grid-cols-[14rem_minmax(0,44rem)] items-start gap-10">
          <div className="min-w-0">{props.contents}</div>
          {column}
        </div>
      ) : (
        column
      )}
    </div>
  )
}
