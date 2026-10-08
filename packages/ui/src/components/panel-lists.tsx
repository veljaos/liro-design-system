import { useState, type ReactNode } from 'react'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * The lists of the side panels (P4.9, the owner's review; docs/decisions.md "Side panels"), so
 * every panel reads the same way. Rows 8px above and below, a 1px border.subtle line between
 * rows (as KeyValueList's rows); inside SidePanels the outer rows lose their outer padding, so
 * the panel's own spacing rule holds.
 * - RelatedDocuments: every item is a link (the provider's linkComponent) — the type in
 *   text.secondary, then the number in the link colour — with the item's status at the end
 *   (a StatusBadge from the application). Nothing is shown that cannot be opened.
 * - ActivityList (comments and history): each entry the author's name semibold with the time in
 *   xs text.tertiary on the same line, the text under it (sm). The latest `limit` entries (2 by
 *   default) with a "Show all" button (`messages['panel.showAll']`) when there are more; then
 *   "Show fewer". The entries arrive newest first.
 */

/** One related document: a link with its type, number and status. */
export interface RelatedDocument {
  key: string
  /** The kind, from the application ("Order", "Delivery note", "Advance invoice"). */
  type: string
  /** The document's number ("N-2026-0157"). */
  number: string
  /** Its page, followed through the provider's linkComponent. */
  href: string
  /** Its state: a StatusBadge. */
  status?: ReactNode
}

export interface RelatedDocumentsProps {
  items: readonly RelatedDocument[]
  /** The list's accessible name ("Related documents"). */
  label: string
  className?: string
}

const ROW = 'flex min-w-0 border-0 border-b border-solid border-subtle py-2 last:border-b-0'

/** The documents linked to this one, each a link with its type, number and status. */
export function RelatedDocuments({ items, label, className }: RelatedDocumentsProps) {
  const { linkComponent: Link } = useLiro()
  return (
    <ul aria-label={label} className={cn('m-0 flex list-none flex-col p-0 font-sans', className)}>
      {items.map((item) => (
        <li
          key={item.key}
          data-slot="panel-row"
          className={cn(ROW, 'items-center justify-between gap-3')}
        >
          <Link
            href={item.href}
            className={cn(
              'flex min-w-0 flex-col rounded-sm text-sm no-underline hover:underline',
              FOCUS_RING,
            )}
          >
            <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{item.type}</span>
            <span dir="ltr" className="text-start font-medium text-link tabular-nums">
              {item.number}
            </span>
          </Link>
          {item.status !== undefined && <span className="shrink-0">{item.status}</span>}
        </li>
      ))}
    </ul>
  )
}

/** One comment or history entry. */
export interface ActivityEntry {
  key: string
  /** Who wrote it or did it. */
  author: string
  /** When, as the application writes it (`format.dateTime`). */
  time: ReactNode
  /** The comment, or what was done. */
  text: ReactNode
}

export interface ActivityListProps {
  /** Newest first. */
  items: readonly ActivityEntry[]
  /** The list's accessible name ("Comments"). */
  label: string
  /** How many entries show before "Show all". Default 2. */
  limit?: number
  className?: string
}

/** Comments or history in a panel: author and time on one line, the text under it. */
export function ActivityList({ items, label, limit = 2, className }: ActivityListProps) {
  const { messages, format } = useLiro()
  const [all, setAll] = useState(false)
  const more = items.length > limit
  const shown = all || !more ? items : items.slice(0, limit)
  return (
    <div className={cn('flex flex-col items-start gap-1 font-sans', className)}>
      <ul aria-label={label} className="m-0 flex w-full list-none flex-col p-0">
        {shown.map((item) => (
          <li key={item.key} data-slot="panel-row" className={cn(ROW, 'flex-col gap-0.5')}>
            <p className="m-0 flex min-w-0 flex-wrap items-baseline gap-x-2">
              <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
                {item.author}
              </span>
              <span className="text-xs text-tertiary tabular-nums">{item.time}</span>
            </p>
            <div className={cn('text-sm text-primary', TEXT_DIRECTION)}>{item.text}</div>
          </li>
        ))}
      </ul>
      {more && (
        <button
          type="button"
          aria-expanded={all}
          onClick={() => {
            setAll(!all)
          }}
          className={cn(
            'min-h-6 cursor-pointer rounded-sm border-0 bg-transparent p-0 font-sans text-sm text-link hover:underline',
            FOCUS_RING,
          )}
        >
          {all
            ? messages['panel.showFewer']
            : messages['panel.showAll'](items.length, format.number(String(items.length)))}
        </button>
      )}
    </div>
  )
}
