import type { ReactNode } from 'react'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import type { IconComponent } from './intents'

/*
 * Card, SectionCard and KeyValueList (BUILD-PLAN P2.8), the previous Design System's, carried
 * over (owner's decision, 2026-09-28, docs/decisions.md "Display"):
 * - Card (Mantine Card/Paper): the raised surface, a border.default border, radius lg (12px),
 *   padding md (16px).
 * - SectionCard: the same surface; a header only when there is a title or actions — padding md
 *   (12px at the bottom under a description), at the start an optional 18px icon in
 *   text.secondary, the title (an h4 by default) and an optional description (12px,
 *   text.secondary, 2px under the title), at the end the actions, 8px apart, not wrapping; title
 *   and actions aligned to the top; a border.subtle line under the header (`withDivider`, on by
 *   default); the body padded md with md between its children, or `flush` (a table).
 * - KeyValueList: a grid, one column on phones and `columns` (default 2) from the sm breakpoint,
 *   16px apart; each item a label above its value, 2px apart. The label 12px, semibold,
 *   text.secondary, upper case with the caps letter spacing — only for scripts with letter case:
 *   Arabic, Hebrew and CJK labels stay as written, without letter spacing (it breaks the joining
 *   of Arabic letters; styles.css, by :lang()). The value 13px, text.primary, breaking long words;
 *   an empty value is "—". `numeric` items take tabular digits; `fullWidth` items span the row.
 *   Loading: skeletons (label 12 × 90px, value 16 × 150px).
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
  /** An 18px icon before the title. */
  icon?: IconComponent
  /** Actions at the end of the header (buttons), the main one last. */
  actions?: ReactNode
  /** The heading level of the title in the page's outline. Default: 4. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  /** A line between the header and the body. Default: true. */
  withDivider?: boolean
  /** No padding around the body, for a table or a list that reaches the edges. */
  flush?: boolean
  children?: ReactNode
  className?: string
}

/** A titled section of a page: the header with its actions, then the content. */
export function SectionCard(props: SectionCardProps) {
  const Heading = `h${String(props.headingLevel ?? 4)}` as 'h4'
  const Icon = props.icon
  const hasHeader = props.title !== undefined || props.actions !== undefined
  const hasDescription = props.description !== undefined
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
          className={cn(
            'flex items-start justify-between gap-4 p-4',
            hasDescription && 'pb-3',
            props.withDivider !== false && 'border-0 border-b border-solid border-subtle',
          )}
        >
          <div className="flex min-w-0 items-start gap-4">
            {Icon !== undefined && (
              <Icon aria-hidden="true" className="mt-px size-4.5 shrink-0 text-secondary" />
            )}
            <div className="flex min-w-0 flex-col gap-0.5">
              {props.title !== undefined && (
                <Heading className="m-0 text-h4 break-words">{props.title}</Heading>
              )}
              {hasDescription && (
                <p className="m-0 text-xs break-words text-secondary">{props.description}</p>
              )}
            </div>
          </div>
          {props.actions !== undefined && (
            <div className="flex shrink-0 flex-nowrap items-center gap-2">{props.actions}</div>
          )}
        </div>
      )}
      <div className={cn(props.flush !== true && 'flex flex-col gap-4 p-4')}>{props.children}</div>
    </section>
  )
}

/** One item of a KeyValueList. */
export interface KeyValueItem {
  /** A stable key; default: the position. */
  key?: string
  /** From the application. */
  label: ReactNode
  /** Any content (text, a badge); empty (null, undefined, '') shows "—". */
  value?: ReactNode
  /** Tabular digits, for numbers, amounts and dates. */
  numeric?: boolean
  /** Spans every column (a long address, a note). */
  fullWidth?: boolean
}

export interface KeyValueListProps {
  items: readonly KeyValueItem[]
  /** Columns from the sm breakpoint on (one on phones). Default: 2. */
  columns?: 1 | 2 | 3 | 4
  /** Shows skeletons in place of the items. */
  loading?: boolean
  className?: string
}

/** Literal classes, so Tailwind finds them. */
const COLUMNS: Record<1 | 2 | 3 | 4, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
}

/** Whether a value counts as empty. */
export function isEmptyValue(value: ReactNode): boolean {
  return value === undefined || value === null || value === '' || value === false
}

/**
 * Labelled values of a record: an invoice's dates and parties, a person's data. A description
 * list; empty values show an em dash (Appendix B.5), never a hyphen.
 */
export function KeyValueList({
  items,
  columns = 2,
  loading = false,
  className,
}: KeyValueListProps) {
  return (
    <dl
      aria-busy={loading || undefined}
      className={cn('m-0 grid grid-cols-1 gap-4 font-sans', COLUMNS[columns], className)}
    >
      {items.map((item, index) => (
        <div
          key={item.key ?? index}
          className={cn(
            'flex min-w-0 flex-col gap-0.5',
            item.fullWidth === true && 'col-span-full',
          )}
        >
          <dt
            data-slot="key-value-label"
            className="text-xs font-semibold tracking-caps text-secondary uppercase"
          >
            {loading ? <Skeleton className="h-3 w-[90px]" /> : item.label}
          </dt>
          <dd
            className={cn(
              'm-0 text-sm break-words',
              isEmptyValue(item.value) ? 'text-secondary' : 'text-primary',
              item.numeric === true && 'tabular-nums',
            )}
          >
            {loading ? (
              <Skeleton className="h-4 w-[150px]" />
            ) : isEmptyValue(item.value) ? (
              '—'
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
