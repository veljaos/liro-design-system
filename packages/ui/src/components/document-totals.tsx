import type { ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { SettlingValue } from './settling-value'

/*
 * DocumentTotals (P4.5, the owner's decision, docs/decisions.md "Document page"): a document's
 * totals under its lines — computed by the application, never here (rule D4).
 * - An end-aligned block, 320px wide (the full width on phones), no card.
 * - Rows from the application in any number (tax base 20%, VAT 20%, tax base 10%, VAT 10%,
 *   exempt, advance deducted …): label and amount, 13px, 8px apart; the label text.secondary,
 *   the amount text.primary with tabular digits, as a SettlingValue (the confirmed value stays
 *   while a new one is computed). A row may start a group: a thin border.subtle line above it.
 * - Only the final row is large: 16px semibold, a 1px border.strong line above it.
 */

/** One row of the totals: a value from the application. */
export interface TotalsRow {
  key: string
  label: ReactNode
  /** A decimal string, or null when there is none. */
  value: string | null
  /** The amount's currency; without it, a number. */
  currency?: string
  decimals?: number
  /** A new value is being computed: the confirmed one stays, a dot shows after 300ms. */
  pending?: boolean
  /** Starts a group: a thin line above the row. */
  group?: boolean
}

export interface DocumentTotalsProps {
  rows: readonly TotalsRow[]
  /** The final row (the total to pay): large, under a stronger line. */
  total: TotalsRow
  /** Names the block for assistive technology ("Totals"), from the application. */
  label: string
  className?: string
}

function Row({ row, final = false }: { row: TotalsRow; final?: boolean }) {
  return (
    <div
      className={cn(
        // Label and amount on one baseline; a long label wraps, its amount on the first line.
        'flex items-baseline justify-between gap-4',
        final
          ? 'mt-1 border-0 border-t border-solid border-strong pt-3 text-lg font-semibold'
          : 'text-sm',
        !final && row.group === true && 'mt-1 border-0 border-t border-solid border-subtle pt-3',
      )}
    >
      <dt className={cn('min-w-0', final ? 'text-primary' : 'text-secondary', TEXT_DIRECTION)}>
        {row.label}
      </dt>
      <dd className="m-0 text-primary tabular-nums">
        {/* On the label's baseline: the amount's text gives the baseline, the dot slot is
            centred (it would otherwise give its own). */}
        <SettlingValue
          className="items-baseline [&>[aria-hidden]]:self-center"
          value={row.value}
          {...(row.currency === undefined ? {} : { currency: row.currency })}
          {...(row.decimals === undefined ? {} : { decimals: row.decimals })}
          {...(row.pending === undefined ? {} : { pending: row.pending })}
        />
      </dd>
    </div>
  )
}

/** A document's totals, end-aligned under its lines. */
export function DocumentTotals({ rows, total, label, className }: DocumentTotalsProps) {
  return (
    <dl
      aria-label={label}
      data-slot="document-totals"
      className={cn(
        'm-0 ms-auto box-border flex w-full max-w-80 flex-col gap-2 font-sans',
        className,
      )}
    >
      {rows.map((row) => (
        <Row key={row.key} row={row} />
      ))}
      <Row row={total} final />
    </dl>
  )
}
