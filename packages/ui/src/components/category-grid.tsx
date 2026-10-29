import { useId, type ReactNode } from 'react'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { langAttribute } from '../provider/lang'
import { useLiro } from '../provider/liro-provider'
import { EmptyState } from './empty-state'
import type { IconComponent } from './intents'
import { Skeleton } from './progress'

/*
 * CategoryGrid (BUILD-PLAN P5.30 e): the categories of a collection to browse — a help centre's
 * topics, a catalogue's groups, a library's shelves — as cards with how many things each holds.
 * The look is the Launchpad's card (P4.2), without its keys and editing: a page of topics is
 * not the application's home.
 * - A list named by the application (`label`) of cards: one column on phones, otherwise as many
 *   15rem-wide columns as fit (the grid follows its own width), 16px apart.
 * - Card: a link (the whole card) on the raised surface with a border.default border, radius lg,
 *   16px. Top row: the icon in a 40px surface.sunken square at the start (blue on hover, as the
 *   Launchpad's: the card can be opened) and the count at the end (the application's words, "5
 *   articles", xs medium text.secondary). Then the title (sm bold) and the description (xs
 *   text.secondary, up to three lines). Hover: border.strong. Focus: the standard ring. The
 *   link is named by the title and described by the count and the description.
 * - Loading: skeleton cards. None: the application's `empty`, or EmptyState.
 * The categories, their order and their counts are the application's.
 */

/** One category to browse. */
export interface CategoryCard {
  id: string
  title: string
  /** Where it leads, through the provider's `linkComponent`. */
  href: string
  /** One or two lines about what it holds. */
  description?: ReactNode
  /** How many things it holds, in the application's words ("5 articles"). */
  count?: string
  /** Its lucide icon. */
  icon?: IconComponent
  /** The language tag of the texts when it differs from the page's (D15). */
  lang?: string
}

export interface CategoryGridProps {
  /** The list's name for assistive technology ("Categories"). */
  label: string
  categories: readonly CategoryCard[]
  /** Skeleton cards instead of the categories. */
  loading?: boolean
  /** How many skeleton cards. Default 6. */
  skeletonCount?: number
  /** Shown when there are no categories. Default: EmptyState. */
  empty?: ReactNode
  /** 'phone' forces one column; default: as many as fit. */
  layout?: 'desktop' | 'phone'
  className?: string
}

const CARD =
  'box-border flex h-full min-h-30 flex-col gap-4 rounded-lg border border-solid p-4 font-sans text-start no-underline'

/** The categories of a collection as cards, each with its count. */
export function CategoryGrid(props: CategoryGridProps) {
  const { messages, locale, linkComponent: Link } = useLiro()
  const idBase = useId()
  const grid =
    props.layout === 'phone' ? 'grid-cols-1' : 'grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]'

  if (props.loading === true) {
    return (
      <div
        aria-busy="true"
        data-slot="category-grid"
        className={cn('grid gap-4', grid, props.className)}
      >
        <span className="sr-only">{messages['field.loading']}</span>
        {Array.from({ length: props.skeletonCount ?? 6 }, (_, index) => (
          <Skeleton key={index} aria-hidden="true" className="h-30 rounded-lg" />
        ))}
      </div>
    )
  }
  if (props.categories.length === 0) {
    return <div className={props.className}>{props.empty ?? <EmptyState compact />}</div>
  }
  return (
    <ul
      aria-label={props.label}
      data-slot="category-grid"
      className={cn('m-0 grid list-none gap-4 p-0', grid, props.className)}
    >
      {props.categories.map((category) => {
        const Icon = category.icon
        const id = `${idBase}-${category.id}`
        const described = [
          ...(category.count === undefined ? [] : [`${id}-count`]),
          ...(category.description === undefined ? [] : [`${id}-description`]),
        ].join(' ')
        return (
          <li key={category.id} className="flex min-w-0">
            <Link
              href={category.href}
              {...langAttribute(category.lang, locale)}
              data-slot="category-card"
              aria-labelledby={`${id}-title`}
              {...(described === '' ? {} : { 'aria-describedby': described })}
              className={cn(
                CARD,
                'group w-full border-default bg-surface-raised text-primary transition-colors duration-(--liro-duration-base) ease-standard visited:text-primary hover:border-strong',
                FOCUS_RING,
              )}
            >
              {(Icon !== undefined || category.count !== undefined) && (
                <span className="flex items-start justify-between gap-2">
                  {Icon === undefined ? (
                    <span />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-sunken text-primary transition-[background-color] duration-(--liro-duration-base) ease-standard group-hover:bg-brand-solid group-hover:text-brand-on-solid group-focus-visible:bg-brand-solid group-focus-visible:text-brand-on-solid"
                    >
                      <Icon className="size-5" />
                    </span>
                  )}
                  {category.count !== undefined && (
                    <span
                      id={`${id}-count`}
                      className={cn(
                        'min-w-0 text-end text-xs font-medium break-words text-secondary tabular-nums',
                        TEXT_DIRECTION,
                      )}
                    >
                      {category.count}
                    </span>
                  )}
                </span>
              )}
              <span className="flex min-w-0 flex-col gap-0.5">
                <span
                  id={`${id}-title`}
                  className={cn('text-sm font-bold break-words text-primary', TEXT_DIRECTION)}
                >
                  {category.title}
                </span>
                {category.description !== undefined && (
                  <span
                    id={`${id}-description`}
                    className={cn('line-clamp-3 text-xs text-secondary', TEXT_DIRECTION)}
                  >
                    {category.description}
                  </span>
                )}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
