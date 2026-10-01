import { useId, type ReactNode } from 'react'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import type { IconComponent } from './intents'

/*
 * Card, SectionCard and KeyValueList (BUILD-PLAN P2.8; redesigned in P3.2a by the owner,
 * docs/decisions.md "Display"):
 * - Card (Mantine Card/Paper): the raised surface, a border.default border, radius lg (12px),
 *   padding md (16px).
 * - SectionCard: the same surface; a header only when there is a title or actions: the title (an
 *   h4 by default) and an optional description under it (12px, text.secondary, 2px apart) at the
 *   start, the actions at the end (8px apart, not wrapping), aligned to the top, padding md. No
 *   icon unless `icon` is given (18px, text.secondary), and no line under the header: the body
 *   follows md below it, padded md with md between its children, or `flush` (a table).
 * - KeyValueList, layout "rows" (the default): each item one row, the label at the start (13px,
 *   text.secondary, as written: never upper case or letter-spaced) and the value at the end (13px,
 *   weight 500, text.primary; tabular digits for `numeric`); long values wrap and stay at the end.
 *   8px above and below each row and a 1px border.subtle line between rows, none after the last
 *   row of a column. `columns` 1, 2 or 3 (default 2) from the sm breakpoint (48em), one column on
 *   phones, 32px (xl) apart. A `fullWidth` item spans every column with its label above its value
 *   (notes, descriptions). `groups` splits the list into titled groups (12px, semibold,
 *   text.secondary), 24px apart. Layout "stacked": the label above the value, 2px apart, no lines,
 *   16px between items, for short cards. Text values are isolated (`bdi`). An empty value is
 *   "—"; loading shows skeletons (label 12 × 90px, value 16 × 150px).
 */

export interface CardProps {
  children: ReactNode
  /** Layout classes. */
  className?: string
}

/** A surface that groups related content. */
export function Card({ children, className }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        'rounded-lg border border-solid border-default bg-surface-raised p-4 font-sans text-primary',
        className,
      )}
    >
      {children}
    </div>
  )
}

export interface SectionCardProps {
  /** The section's heading, from the application. */
  title?: ReactNode
  /** A line under the title, from the application. */
  description?: ReactNode
  /** An 18px icon before the title. None by default. */
  icon?: IconComponent
  /** Actions at the end of the header (buttons), the main one last. */
  actions?: ReactNode
  /** The heading level of the title in the page's outline. Default: 4. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  /** No padding around the body, for a table or a list that reaches the edges. */
  flush?: boolean
  children?: ReactNode
  className?: string
}

/** A titled section of a page: the title at the start, its actions at the end, then the content. */
export function SectionCard(props: SectionCardProps) {
  const Heading = `h${String(props.headingLevel ?? 4)}` as 'h4'
  const Icon = props.icon
  const hasHeader = props.title !== undefined || props.actions !== undefined
  const flush = props.flush === true
  return (
    <section
      data-slot="section-card"
      className={cn(
        'overflow-hidden rounded-lg border border-solid border-default bg-surface-raised font-sans text-primary',
        props.className,
      )}
    >
      {hasHeader && (
        <div
          data-slot="section-card-header"
          className={cn('flex items-start justify-between gap-4 px-4 pt-4', flush && 'pb-4')}
        >
          <div className="flex min-w-0 items-start gap-4">
            {Icon !== undefined && (
              <Icon aria-hidden="true" className="mt-px size-4.5 shrink-0 text-secondary" />
            )}
            <div className="flex min-w-0 flex-col gap-0.5">
              {props.title !== undefined && (
                <Heading className="m-0 text-h4 break-words">{props.title}</Heading>
              )}
              {props.description !== undefined && (
                <p className="m-0 text-xs break-words text-secondary">{props.description}</p>
              )}
            </div>
          </div>
          {props.actions !== undefined && (
            <div className="flex shrink-0 flex-nowrap items-center gap-2">{props.actions}</div>
          )}
        </div>
      )}
      <div className={cn(!flush && 'flex flex-col gap-4 p-4')}>{props.children}</div>
    </section>
  )
}

/** One item of a KeyValueList. */
export interface KeyValueItem {
  /** A stable key; default: the position. */
  key?: string
  /** From the application. */
  label: ReactNode
  /** Any content (text, a badge); empty (null, undefined, '', false) shows "—". */
  value?: ReactNode
  /** Tabular digits, for numbers, amounts and dates. */
  numeric?: boolean
  /** Spans every column, the label above the value (a note, a description, an address). */
  fullWidth?: boolean
}

/** A titled group of a KeyValueList ("Customer", "Payment"). */
export interface KeyValueGroup {
  /** A stable key; default: the position. */
  key?: string
  /** The group's title, from the application. */
  title: ReactNode
  items: readonly KeyValueItem[]
}

export type KeyValueLayout = 'rows' | 'stacked'

export type KeyValueListProps = {
  /**
   * "rows" (default): the label at the start, the value at the end, lines between rows.
   * "stacked": the label above the value, no lines, for short cards.
   */
  layout?: KeyValueLayout
  /** Columns from the sm breakpoint (48em) on; one on phones. Default: 2. */
  columns?: 1 | 2 | 3
  /** Shows skeletons in place of the labels and values. */
  loading?: boolean
  className?: string
} & (
  | { items: readonly KeyValueItem[]; groups?: never }
  | { groups: readonly KeyValueGroup[]; items?: never }
)

/** Literal classes, so Tailwind finds them. */
const COLUMNS: Record<1 | 2 | 3, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
}

/** Whether a value counts as empty. */
export function isEmptyValue(value: ReactNode): boolean {
  return value === undefined || value === null || value === '' || value === false
}

/**
 * Where the "rows" layout draws a line under an item: on phones (one column) under every item but
 * the last; from the sm breakpoint under every item that has another item below it in one of its
 * columns, so no line follows the last row of a column. Items fill the columns row by row; a
 * `fullWidth` item starts a new row and takes all of it.
 */
export function keyValueLines(
  items: readonly Pick<KeyValueItem, 'fullWidth'>[],
  columns: number,
): { phone: boolean; wide: boolean }[] {
  const occupied: number[][] = []
  let column = 0
  for (const item of items) {
    if (item.fullWidth === true || columns === 1) {
      occupied.push(Array.from({ length: columns }, (_, index) => index))
      column = 0
    } else {
      occupied.push([column])
      column = (column + 1) % columns
    }
  }
  return occupied.map((own, index) => ({
    phone: index < items.length - 1,
    wide: occupied.slice(index + 1).some((later) => later.some((at) => own.includes(at))),
  }))
}

interface ListOptions {
  layout: KeyValueLayout
  columns: 1 | 2 | 3
  loading: boolean
}

function ItemList({
  items,
  layout,
  columns,
  loading,
  className,
}: ListOptions & { items: readonly KeyValueItem[]; className?: string | undefined }) {
  const rows = layout === 'rows'
  const lines = keyValueLines(items, columns)
  return (
    <dl
      aria-busy={loading || undefined}
      className={cn(
        'm-0 grid grid-cols-1 font-sans',
        COLUMNS[columns],
        rows ? 'gap-x-8' : 'gap-4',
        className,
      )}
    >
      {items.map((item, index) => {
        const stacked = !rows || item.fullWidth === true
        const empty = isEmptyValue(item.value)
        const line = lines[index] ?? { phone: false, wide: false }
        return (
          <div
            key={item.key ?? index}
            data-slot="key-value-item"
            className={cn(
              'flex min-w-0',
              stacked ? 'flex-col gap-0.5' : 'items-baseline justify-between gap-4',
              item.fullWidth === true && 'col-span-full',
              rows && 'border-0 border-solid border-subtle py-2',
              rows && (line.phone ? 'border-b' : 'border-b-0'),
              rows && (line.wide ? 'sm:border-b' : 'sm:border-b-0'),
            )}
          >
            <dt
              data-slot="key-value-label"
              className={cn(
                'min-w-0 text-sm break-words text-secondary',
                !stacked && 'max-w-1/2 shrink-0',
              )}
            >
              {loading ? <Skeleton className="h-3 w-[90px] max-w-full" /> : item.label}
            </dt>
            <dd
              className={cn(
                'm-0 min-w-0 text-sm font-medium break-words',
                !stacked && 'flex-1 text-end',
                empty && !loading ? 'text-secondary' : 'text-primary',
                item.numeric === true && 'tabular-nums',
              )}
            >
              {loading ? (
                <Skeleton className={cn('h-4 w-[150px] max-w-full', !stacked && 'ms-auto')} />
              ) : empty ? (
                '—'
              ) : typeof item.value === 'string' || typeof item.value === 'number' ? (
                // Isolated, so a value in the other direction (Latin in right-to-left) keeps its
                // own order ("12.345,60 EUR", "d.o.o."), while the row keeps the page's alignment.
                <bdi>{item.value}</bdi>
              ) : (
                item.value
              )}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

function Group({ group, ...options }: ListOptions & { group: KeyValueGroup }) {
  const titleId = useId()
  return (
    <div role="group" aria-labelledby={titleId} className="flex flex-col not-first:mt-6">
      <p
        id={titleId}
        data-slot="key-value-group-title"
        className={cn(
          'm-0 text-xs font-semibold text-secondary',
          options.layout === 'stacked' && 'mb-2',
        )}
      >
        {group.title}
      </p>
      <ItemList items={group.items} {...options} />
    </div>
  )
}

/**
 * Labelled values of a record: an invoice's dates and parties, a person's data. Description
 * lists, optionally in titled groups; empty values show an em dash (Appendix B.5), never a hyphen.
 */
export function KeyValueList(props: KeyValueListProps) {
  const options: ListOptions = {
    layout: props.layout ?? 'rows',
    columns: props.columns ?? 2,
    loading: props.loading ?? false,
  }
  if (props.groups === undefined) {
    return <ItemList items={props.items} className={props.className} {...options} />
  }
  return (
    <div
      aria-busy={options.loading || undefined}
      className={cn('flex flex-col font-sans', props.className)}
    >
      {props.groups.map((group, index) => (
        <Group key={group.key ?? index} group={group} {...options} />
      ))}
    </div>
  )
}
