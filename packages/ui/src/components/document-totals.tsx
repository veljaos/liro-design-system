import type { ReactNode } from 'react'
import { FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
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
 *
 * P5.18 (complex documents), additive — every part optional, nothing computed:
 * - `recap`: the recap by tax category after the rows — a small table (category, base, rate,
 *   tax) under its caption; the block is then 384px wide, so four columns of amounts fit.
 * - `deductions`: one row per deduction (an advance), each label a link to its document
 *   (`href`), in a group of their own, right before the final row (the amount due).
 * - `exchange`: a foreign-currency document's home-currency equivalents after the final row,
 *   then the rate line ("1 EUR = 117,1825 RSD, NBS middle rate on 05.10.2026."). Only here: the
 *   lines stay in the document's currency.
 * - `footnotes`: the reasons for exemption and reverse charge, once, under the totals ("¹ Exempt
 *   under …"), their markers given by the application and repeated in the lines' tax column.
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
  /**
   * The label is a link to this address (P5.18: a deduction's advance invoice), followed through
   * the provider's linkComponent.
   */
  href?: string
}

/** One line of the recap by tax category (P5.18). */
export interface TaxRecapRow {
  key: string
  /** The category as the lines show it ("S 20%", "E¹"). */
  category: ReactNode
  /** The base in this category: a decimal string. */
  base: string | null
  /** The rate as a percentage ("20"), written by `format.percent`; null or absent: none. */
  rate?: string | null
  /** The tax in this category: a decimal string. */
  tax: string | null
}

/** The recap by tax category: a small table after the rows (P5.18). */
export interface TaxRecap {
  /** The table's caption, from the application ("Recap by tax category"). */
  label: string
  /** The column headers, from the application. */
  headers: { category: string; base: string; rate: string; tax: string }
  rows: readonly TaxRecapRow[]
  /** The amounts' currency; without it, numbers with the money decimals. */
  currency?: string
  decimals?: number
}

/** The home-currency equivalents of a foreign-currency document, and its rate (P5.18). */
export interface TotalsExchange {
  /** The document's currency ("EUR"). */
  currency: string
  /** The home currency ("RSD"). */
  homeCurrency: string
  /** Home-currency units for one unit of `currency`: a decimal string ("117.1825"). */
  rate: string
  /** Where the rate comes from, written by the application ("NBS middle rate on 05.10.2026."). */
  source?: string
  /** The equivalents ("Total in RSD"), in the home currency. */
  rows: readonly TotalsRow[]
}

/** A reason given once under the totals (P5.18): the marker repeats it in the lines. */
export interface TotalsFootnote {
  key: string
  /** "¹", "²" — the same marker the lines' tax column shows. */
  marker: string
  text: ReactNode
}

export interface DocumentTotalsProps {
  rows: readonly TotalsRow[]
  /** The final row (the total to pay): large, under a stronger line. */
  total: TotalsRow
  /** Names the block for assistive technology ("Totals"), from the application. */
  label: string
  /** The recap by tax category, after the rows (P5.18). */
  recap?: TaxRecap
  /** One row per deduction (an advance), before the final row (P5.18). */
  deductions?: readonly TotalsRow[]
  /** The home-currency equivalents and the rate line, after the final row (P5.18). */
  exchange?: TotalsExchange
  /** Exemption and reverse-charge reasons, once, under the totals (P5.18). */
  footnotes?: readonly TotalsFootnote[]
  className?: string
}

function Row({ row, final = false }: { row: TotalsRow; final?: boolean }) {
  const { linkComponent: Link } = useLiro()
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
        {row.href === undefined ? (
          row.label
        ) : (
          <Link
            href={row.href}
            className={cn(
              'rounded-sm text-link no-underline visited:text-link hover:underline',
              FOCUS_RING,
            )}
          >
            {row.label}
          </Link>
        )}
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

/** The deductions as a group of their own: a line above the first. */
function deductionRows(deductions: readonly TotalsRow[] | undefined): TotalsRow[] {
  return (deductions ?? []).map((row, index) => (index === 0 ? { ...row, group: true } : row))
}

const NUMBER_CELL = 'py-1 ps-3 pe-0 text-end tabular-nums whitespace-nowrap'

function RecapTable({ recap }: { recap: TaxRecap }) {
  const { format } = useLiro()
  const amount = (value: string | null) => {
    if (value === null || value === '') return '—'
    const decimals = recap.decimals ?? format.moneyDecimals
    return recap.currency === undefined
      ? format.number(value, { decimals })
      : format.money(value, recap.currency, { decimals })
  }
  return (
    <div className="mt-1 border-0 border-t border-solid border-subtle pt-3">
      <table data-slot="tax-recap" className="w-full border-collapse text-sm text-primary">
        <caption
          className={cn('pb-1 text-start text-xs font-semibold text-secondary', TEXT_DIRECTION)}
        >
          {recap.label}
        </caption>
        <thead>
          <tr>
            <th scope="col" className="px-0 py-1 text-start text-xs font-normal text-secondary">
              <span className={TEXT_ISOLATE}>{recap.headers.category}</span>
            </th>
            <th scope="col" className="py-1 ps-3 pe-0 text-end text-xs font-normal text-secondary">
              <span className={TEXT_ISOLATE}>{recap.headers.base}</span>
            </th>
            <th scope="col" className="py-1 ps-3 pe-0 text-end text-xs font-normal text-secondary">
              <span className={TEXT_ISOLATE}>{recap.headers.rate}</span>
            </th>
            <th scope="col" className="py-1 ps-3 pe-0 text-end text-xs font-normal text-secondary">
              <span className={TEXT_ISOLATE}>{recap.headers.tax}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {recap.rows.map((row) => (
            <tr key={row.key}>
              <th scope="row" className="px-0 py-1 text-start font-normal whitespace-nowrap">
                <span className={TEXT_ISOLATE}>{row.category}</span>
              </th>
              <td className={NUMBER_CELL}>
                <bdi>{amount(row.base)}</bdi>
              </td>
              <td className={NUMBER_CELL}>
                <bdi>
                  {row.rate === undefined || row.rate === null ? '—' : format.percent(row.rate)}
                </bdi>
              </td>
              <td className={NUMBER_CELL}>
                <bdi>{amount(row.tax)}</bdi>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ExchangeBlock({ exchange }: { exchange: TotalsExchange }) {
  const { messages, format } = useLiro()
  const rate = messages['document.rate'](
    exchange.currency,
    exchange.homeCurrency,
    format.number(exchange.rate),
  )
  return (
    <div data-slot="totals-exchange" className="flex flex-col gap-2">
      <dl className="m-0 flex flex-col gap-2">
        {exchange.rows.map((row, index) => (
          <Row key={row.key} row={index === 0 ? { ...row, group: true } : row} />
        ))}
      </dl>
      <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
        {exchange.source === undefined
          ? rate
          : messages['document.rateLine'](rate, exchange.source)}
      </p>
    </div>
  )
}

/** A document's totals, end-aligned under its lines. */
export function DocumentTotals({
  rows,
  total,
  label,
  recap,
  deductions,
  exchange,
  footnotes,
  className,
}: DocumentTotalsProps) {
  const extended =
    recap !== undefined ||
    exchange !== undefined ||
    (footnotes !== undefined && footnotes.length > 0)
  if (!extended) {
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
        {deductionRows(deductions).map((row) => (
          <Row key={row.key} row={row} />
        ))}
        <Row row={total} final />
      </dl>
    )
  }
  // With a recap, the rate line or footnotes the block holds more than one list: a group named
  // by the label, the lists inside it in the fixed order.
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="document-totals"
      className={cn(
        'ms-auto box-border flex w-full flex-col gap-2 font-sans',
        recap === undefined ? 'max-w-80' : 'max-w-96',
        className,
      )}
    >
      {rows.length > 0 && (
        <dl className="m-0 flex flex-col gap-2">
          {rows.map((row) => (
            <Row key={row.key} row={row} />
          ))}
        </dl>
      )}
      {recap !== undefined && <RecapTable recap={recap} />}
      <dl className="m-0 flex flex-col gap-2">
        {deductionRows(deductions).map((row) => (
          <Row key={row.key} row={row} />
        ))}
        <Row row={total} final />
      </dl>
      {exchange !== undefined && <ExchangeBlock exchange={exchange} />}
      {footnotes !== undefined && footnotes.length > 0 && (
        <div data-slot="totals-footnotes" className="mt-1 flex flex-col gap-1">
          {footnotes.map((note) => (
            <p key={note.key} className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
              <sup>{note.marker}</sup> {note.text}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
