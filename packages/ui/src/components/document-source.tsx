import { useId, type ReactNode } from 'react'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { DateText, MoneyText } from './display-text'

/*
 * DocumentSource (P5.23, the owner's review of Phase 5 part 1): the document a correcting or
 * cancelling document refers to — a decrease, an increase, a cancellation document, a credit
 * note, a return — shown in DocumentPage's header at the counterparty's level (the `source`
 * slot), because it is the most important fact of such a page. The label from the application
 * ("Corrects", "Cancels", "Credits", "Returns") in xs text.secondary, as the counterparty's;
 * then the record: a link through the provider's linkComponent with its kind and number (sm
 * semibold, the link colour, the number left to right) and its state (a StatusBadge from the
 * application, as RelatedDocuments); under it the date and the total in xs text.secondary
 * ("Issued 25.09.2026. · Total 186.420,35 RSD", through `format`). Several documents (a
 * rebate over a period) stand one under the other. The source in turn lists its correcting
 * documents in its Related documents panel (RelatedDocuments); the "Based on" line
 * (DocumentReferences) is not used for this back-link, so it is said once.
 */

/** The document a correcting or cancelling document refers to. */
export interface DocumentSourceItem {
  key: string
  /** The kind, from the application ("Invoice"). */
  kind: string
  /** The number ("F-2026-0410"). */
  number: string
  /** Its page, followed through the provider's linkComponent. */
  href: string
  /** Its date (YYYY-MM-DD), through `format.date`. */
  date?: string
  /** Its total as a decimal string, through `format.money`. */
  total?: { value: string; currency: string }
  /** Its state: a StatusBadge. */
  status?: ReactNode
}

export interface DocumentSourceProps {
  /** What this document does to the source, from the application ("Corrects", "Cancels"). */
  label: string
  documents: readonly DocumentSourceItem[]
  className?: string
}

/** Link colours named for every state (P4.4); 24px high as a target. */
const LINK =
  'inline-flex min-h-6 items-center gap-1 rounded-sm text-sm font-semibold text-link no-underline visited:text-link hover:text-link hover:underline active:text-link'

/** The source of a correcting or cancelling document, at the counterparty's level. */
export function DocumentSource({ label, documents, className }: DocumentSourceProps) {
  const { messages, linkComponent: Link } = useLiro()
  const labelId = useId()
  if (documents.length === 0) return null
  return (
    <div
      data-slot="document-source"
      className={cn('flex min-w-0 flex-col gap-0.5 font-sans', className)}
    >
      <span id={labelId} className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
        {label}
      </span>
      <ul aria-labelledby={labelId} className="m-0 flex list-none flex-col gap-2 p-0">
        {documents.map((source) => (
          <li key={source.key} className="flex min-w-0 flex-col">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link href={source.href} className={cn(LINK, FOCUS_RING)}>
                <span className={TEXT_DIRECTION}>{source.kind}</span>
                <span dir="ltr" className="tabular-nums">
                  {source.number}
                </span>
              </Link>
              {source.status}
            </span>
            {(source.date !== undefined || source.total !== undefined) && (
              <span className="flex flex-wrap items-baseline gap-x-1.5 text-xs text-secondary">
                {source.date !== undefined && (
                  <span className={TEXT_DIRECTION}>
                    {messages['document.sourceDate']} <DateText value={source.date} />
                  </span>
                )}
                {source.date !== undefined && source.total !== undefined && (
                  <span aria-hidden="true" className="text-tertiary">
                    ·
                  </span>
                )}
                {source.total !== undefined && (
                  <span className={TEXT_DIRECTION}>
                    {messages['document.sourceTotal']}{' '}
                    <MoneyText value={source.total.value} currency={source.total.currency} />
                  </span>
                )}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
