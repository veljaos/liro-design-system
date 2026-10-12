import type { ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
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
  /** The receipt's name for assistive technology. Default: `messages['receipt.title']`. */
  label?: string
  className?: string
}

const RULE = 'border-0 border-t border-dashed border-strong'

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
      {props.facts !== undefined && props.facts.length > 0 && (
        <dl className={cn('m-0 flex flex-col gap-0.5 pt-2', RULE)}>
          {props.facts.map((fact) => (
            <div key={fact.id} className="flex items-baseline justify-between gap-3">
              <dt className={TEXT_DIRECTION}>{fact.label}</dt>
              <dd className="m-0 text-end tabular-nums">
                <bdi>{fact.value}</bdi>
              </dd>
            </div>
          ))}
        </dl>
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
    </article>
  )
}
