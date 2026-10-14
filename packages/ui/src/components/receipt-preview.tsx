import type { ReactNode } from 'react'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * ReceiptPreview (BUILD-PLAN P5.10; docs/decisions.md "Touch and POS"). A till receipt as the
 * printer will give it, on screen and for print: a narrow paper strip 58mm or 80mm wide, the
 * header lines centred (the shop, the address, the tax number — the application's), the receipt's
 * facts, the items ("2 × 45,00" under the name, the line's amount at the end), the totals, the
 * payments, and the fiscal footer and code from the application (a fiscal QR code as an image).
 * Everything comes from props; every amount is a decimal string written by `format` (never
 * rounded) with tabular digits, so the columns line up as on a printed receipt. Dashed rules
 * divide the parts. For print the strip loses its frame and shadow and is never split.
 *
 * P5.28 (item 21): the parts a fiscal receipt prints, every word the application's data — a
 * `banner` on top and an `end` line at the bottom between double rules ("FISCAL RECEIPT", "END OF
 * FISCAL RECEIPT"), the receipt's kind as a `kindLine` between dashed rules above the items
 * ("NORMAL SALE"), a `marker` for a kind that is not a real sale, printed boxed and bold under
 * the facts and again above the footer ("THIS IS NOT A FISCAL RECEIPT"), a `recap` table (the tax
 * per label: label, name, rate, amount — columns and rows from the application), `issuedFacts`
 * after it (the processor's number and time, the counter) and a `signature` line where the
 * application's rules ask for one.
 */

export interface ReceiptItem {
  id: string
  name: string
  /** A decimal string. */
  quantity: string
  /** The unit after the quantity ("kg"). */
  unit?: string
  /** A decimal string. */
  unitPrice: string
  /** The line's amount, a decimal string, from the application. */
  total: string
  /** A line under the item: a discount, a tax label, in the application's words. */
  note?: string
}

/** A total or a payment: its label and a decimal string. */
export interface ReceiptAmount {
  id: string
  label: string
  value: string
  /** The amount due: larger and bold. */
  strong?: boolean
}

/** A column of the recap table; an `amount` column holds decimal strings, written by `format`. */
export interface ReceiptRecapColumn {
  id: string
  label: string
  amount?: boolean
}

/** A table under the totals (the tax per label), from the application. */
export interface ReceiptRecap {
  columns: readonly ReceiptRecapColumn[]
  /** Each row's cells by column id: text, or a decimal string in an amount column. */
  rows: readonly { id: string; cells: Readonly<Record<string, string>> }[]
  /** Rows under the table ("Total tax"). */
  totals?: readonly ReceiptAmount[]
}

/** A fact of the receipt: its number, the date and time, the cashier (text, as given). */
export interface ReceiptFact {
  id: string
  label: string
  value: string
}

export interface ReceiptPreviewProps {
  /** Centred lines on top: the shop's name first (bold), then the address, the tax number. */
  header?: readonly string[]
  facts?: readonly ReceiptFact[]
  items: readonly ReceiptItem[]
  totals?: readonly ReceiptAmount[]
  payments?: readonly ReceiptAmount[]
  /** Centred lines at the bottom: the fiscal text, a thank-you, from the application. */
  footer?: readonly string[]
  /** A code under the footer (a fiscal QR code as an image), from the application. */
  code?: ReactNode
  /** Written after the totals and payments when given; the items' amounts stand without it. */
  currency?: string
  /** The paper's width. Default '80mm'. */
  paper?: '58mm' | '80mm'
  /** A line on top between double rules ("FISCAL RECEIPT"), from the application. */
  banner?: string
  /** The last line between double rules ("END OF FISCAL RECEIPT"), from the application. */
  end?: string
  /** The receipt's kind between dashed rules above the items ("NORMAL SALE"). */
  kindLine?: string
  /**
   * The words that mark a receipt that is not a real sale ("THIS IS NOT A FISCAL RECEIPT"),
   * printed boxed under the facts and again above the footer.
   */
  marker?: string
  /** A table under the payments: the tax per label. */
  recap?: ReceiptRecap
  /** Facts after the recap: the processor's number and time, the counter (text, as given). */
  issuedFacts?: readonly ReceiptFact[]
  /** A line to sign under these words ("Buyer's signature"), where the rules ask for one. */
  signature?: string
  /** The receipt's name for assistive technology. Default: `messages['receipt.title']`. */
  label?: string
  className?: string
}

const RULE = 'border-0 border-t border-dashed border-strong'
const DOUBLE = 'border-0 border-y-[3px] border-double border-strong'

/** A till receipt from props, as it prints: narrow, monospaced figures, nothing computed. */
export function ReceiptPreview(props: ReceiptPreviewProps) {
  const { messages, format } = useLiro()
  const amount = (value: string) => format.number(value, { decimals: format.moneyDecimals })
  const total = (value: string) =>
    props.currency === undefined
      ? amount(value)
      : format.money(value, props.currency, { decimals: format.moneyDecimals })
  const narrow = props.paper === '58mm'
  const amountRows = (rows: readonly ReceiptAmount[] | undefined) =>
    rows !== undefined &&
    rows.length > 0 && (
      <dl className={cn('m-0 flex flex-col gap-0.5 pt-2', RULE)}>
        {rows.map((row) => (
          <div
            key={row.id}
            className={cn(
              'flex items-baseline justify-between gap-3',
              row.strong === true && 'text-md font-bold',
            )}
          >
            <dt className={TEXT_DIRECTION}>{row.label}</dt>
            <dd className="m-0 shrink-0 tabular-nums">
              <bdi>{total(row.value)}</bdi>
            </dd>
          </div>
        ))}
      </dl>
    )
  const factRows = (rows: readonly ReceiptFact[] | undefined) =>
    rows !== undefined &&
    rows.length > 0 && (
      <dl className={cn('m-0 flex flex-col gap-0.5 pt-2', RULE)}>
        {rows.map((fact) => (
          <div key={fact.id} className="flex items-baseline justify-between gap-3">
            <dt className={TEXT_DIRECTION}>{fact.label}</dt>
            <dd className="m-0 text-end tabular-nums">
              <bdi>{fact.value}</bdi>
            </dd>
          </div>
        ))}
      </dl>
    )
  const marker = (repeat: boolean) =>
    props.marker !== undefined && (
      <p
        data-slot="receipt-marker"
        aria-hidden={repeat || undefined}
        className={cn(
          'm-0 border-2 border-solid border-strong px-2 py-1 text-center font-bold break-words',
          TEXT_ISOLATE,
        )}
      >
        {props.marker}
      </p>
    )
  const recap = props.recap
  return (
    <article
      aria-label={props.label ?? messages['receipt.title']}
      data-slot="receipt-preview"
      data-paper={props.paper ?? '80mm'}
      className={cn(
        'box-border flex max-w-full flex-col gap-2 border border-solid border-default bg-surface-raised px-4 py-5 font-sans text-primary shadow-sm print:border-0 print:shadow-none print:break-inside-avoid',
        narrow ? 'w-[58mm] text-xs' : 'w-[80mm] text-sm',
        props.className,
      )}
    >
      {props.banner !== undefined && (
        <p className={cn('m-0 py-1 text-center font-bold break-words', DOUBLE, TEXT_ISOLATE)}>
          {props.banner}
        </p>
      )}
      {props.header !== undefined && props.header.length > 0 && (
        <div className="flex flex-col items-center gap-0.5 text-center">
          {props.header.map((line, index) => (
            <p
              key={`${String(index)}-${line}`}
              className={cn('m-0 break-words', index === 0 && 'text-md font-bold', TEXT_DIRECTION)}
            >
              {line}
            </p>
          ))}
        </div>
      )}
      {factRows(props.facts)}
      {marker(false)}
      {props.kindLine !== undefined && (
        <p className="m-0 flex items-center gap-2 pt-2">
          <span aria-hidden="true" className={cn('h-0 min-w-4 flex-1', RULE)} />
          <span className={cn('text-center font-semibold break-words', TEXT_ISOLATE)}>
            {props.kindLine}
          </span>
          <span aria-hidden="true" className={cn('h-0 min-w-4 flex-1', RULE)} />
        </p>
      )}
      <ul className={cn('m-0 flex list-none flex-col gap-1.5 p-0 pt-2', RULE)}>
        {props.items.map((item) => (
          <li key={item.id} className="flex flex-col">
            <span className={cn('break-words', TEXT_DIRECTION)}>{item.name}</span>
            <span className="flex items-baseline justify-between gap-3 tabular-nums">
              <bdi className="text-secondary">
                {format.number(item.quantity)}
                {item.unit !== undefined && ` ${item.unit}`} × {amount(item.unitPrice)}
              </bdi>
              <bdi className="shrink-0">{amount(item.total)}</bdi>
            </span>
            {item.note !== undefined && (
              <span className={cn('text-secondary', TEXT_DIRECTION)}>{item.note}</span>
            )}
          </li>
        ))}
      </ul>
      {amountRows(props.totals)}
      {amountRows(props.payments)}
      {recap !== undefined && recap.rows.length > 0 && (
        <div className={cn('flex flex-col gap-0.5 pt-2', RULE)}>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {recap.columns.map((column) => (
                  <th
                    key={column.id}
                    scope="col"
                    className={cn(
                      'p-0 pb-0.5 font-semibold text-secondary',
                      column.amount === true ? 'text-end' : 'text-start',
                      TEXT_ISOLATE,
                    )}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recap.rows.map((row) => (
                <tr key={row.id}>
                  {recap.columns.map((column) => {
                    const cell = row.cells[column.id] ?? ''
                    return (
                      <td
                        key={column.id}
                        className={cn(
                          'p-0',
                          column.amount === true ? 'text-end tabular-nums' : 'text-start',
                          TEXT_ISOLATE,
                        )}
                      >
                        {column.amount === true && cell !== '' ? <bdi>{amount(cell)}</bdi> : cell}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {recap.totals !== undefined && recap.totals.length > 0 && (
            <dl className="m-0 flex flex-col gap-0.5">
              {recap.totals.map((row) => (
                <div key={row.id} className="flex items-baseline justify-between gap-3">
                  <dt className={TEXT_DIRECTION}>{row.label}</dt>
                  <dd className="m-0 shrink-0 tabular-nums">
                    <bdi>{total(row.value)}</bdi>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
      {factRows(props.issuedFacts)}
      {props.signature !== undefined && (
        <div data-slot="receipt-signature" className="flex flex-col gap-1 pt-8">
          <span aria-hidden="true" className="h-0 border-0 border-t border-solid border-strong" />
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{props.signature}</span>
        </div>
      )}
      {marker(true)}
      {((props.footer !== undefined && props.footer.length > 0) || props.code !== undefined) && (
        <div className={cn('flex flex-col items-center gap-1 pt-2 text-center', RULE)}>
          {props.footer?.map((line, index) => (
            <p key={`${String(index)}-${line}`} className={cn('m-0 break-words', TEXT_DIRECTION)}>
              {line}
            </p>
          ))}
          {props.code !== undefined && <div className="mt-1 flex justify-center">{props.code}</div>}
        </div>
      )}
      {props.end !== undefined && (
        <p className={cn('m-0 py-1 text-center font-bold break-words', DOUBLE, TEXT_ISOLATE)}>
          {props.end}
        </p>
      )}
    </article>
  )
}
