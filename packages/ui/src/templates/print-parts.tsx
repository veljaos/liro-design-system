import { useId, type ReactNode } from 'react'
import { LINE_TYPE_TEXT, spansRow, type LineType } from '../components/line-types'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * The parts of the print templates (P5.15), exported so an application can compose a printout of
 * its own inside PrintPage: a title with the logo at the end, label–value details, a table whose
 * header repeats on every page, a titled section, the place and date, the amount due and the
 * payment details with the IPS QR slot, and the electronic signature fields. Paper conventions
 * (P5.28 item 20, the owner: "as simple as a Stripe invoice"): compact 13px text, labels xs
 * text.secondary, black and grey, thin rules only — no boxes, frames, shaded headers, stamps or
 * seals; nothing interactive on paper.
 */

/** One label and its value on paper. */
export interface PrintDetail {
  key?: string
  label: ReactNode
  /** Any content; empty (null, undefined, '', false) prints "—". */
  value?: ReactNode
  /** Tabular digits, for numbers, amounts and dates. */
  numeric?: boolean
}

function isEmpty(value: ReactNode): boolean {
  return value === undefined || value === null || value === '' || value === false
}

export interface PrintDetailsProps {
  items: readonly PrintDetail[]
  /** Columns on the sheet. Default 2. */
  columns?: 1 | 2 | 3
  /**
   * 'stacked' (default): each label above its value. 'rows': the label and the value on one row,
   * the labels in a column of their own — the small key/value block of a document ("Date of
   * issue  06.10.2026.").
   */
  layout?: 'stacked' | 'rows'
  className?: string
}

const COLUMNS = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' } as const

/** Labels and their values in a grid of 1–3 columns (a person's or a document's details). */
export function PrintDetails({
  items,
  columns = 2,
  layout = 'stacked',
  className,
}: PrintDetailsProps) {
  const rows = layout === 'rows'
  return (
    <dl
      data-slot="print-details"
      data-layout={layout}
      className={cn('m-0 grid gap-x-6', rows ? 'gap-y-1' : 'gap-y-2', COLUMNS[columns], className)}
    >
      {items.map((item, index) => (
        <div
          key={item.key ?? index}
          className={cn(
            'flex min-w-0 break-inside-avoid',
            rows ? 'items-baseline gap-4' : 'flex-col',
          )}
        >
          <dt
            className={cn(
              'text-secondary',
              rows ? 'w-36 shrink-0 text-sm' : 'text-xs',
              TEXT_DIRECTION,
            )}
          >
            {item.label}
          </dt>
          <dd
            className={cn(
              'm-0 min-w-0 text-sm text-primary',
              item.numeric === true && 'tabular-nums',
              TEXT_DIRECTION,
            )}
          >
            {isEmpty(item.value) ? '—' : item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** A column of a PrintTable. */
export interface PrintColumn<Row> {
  key: string
  header: ReactNode
  cell: (row: Row) => ReactNode
  /** Numbers and amounts at the end, with tabular digits. Default 'start'. */
  align?: 'start' | 'end'
  /** The column's width as CSS ("12%", "22mm"); default by its content. */
  width?: string
}

export interface PrintTableProps<Row> {
  columns: readonly PrintColumn<Row>[]
  rows: readonly Row[]
  rowKey: (row: Row) => string
  /** Names the table; printed above it when `captionVisible`, else for assistive technology. */
  caption: string
  /** Print the caption above the table. Default false (a heading before it names it). */
  captionVisible?: boolean
  /** How a row reads (P5.18 line types): a heading or text across the row, a subtotal. */
  lineType?: (row: Row) => LineType
  /** The text of a heading or text row, across the row. */
  lineText?: (row: Row) => ReactNode
}

/**
 * A table on paper: the header row repeats at the top of every printed page, a row is never split
 * between pages. Thin rules only (P5.28): a 1px border.default line under the header (no shading),
 * a 1px border.subtle line under each row, no boxes. Line types read by typography (P5.18): a
 * heading bold across the row, a text line small and secondary, a subtotal semibold under a thin
 * border.default rule.
 */
export function PrintTable<Row>(props: PrintTableProps<Row>) {
  return (
    <table
      data-slot="print-table"
      className="w-full border-collapse font-sans text-sm text-primary"
    >
      <caption
        className={cn(
          props.captionVisible === true
            ? 'pb-2 text-start text-sm font-semibold text-primary'
            : 'sr-only',
          TEXT_DIRECTION,
        )}
      >
        {props.caption}
      </caption>
      {props.columns.some((column) => column.width !== undefined) && (
        <colgroup>
          {props.columns.map((column) => (
            <col
              key={column.key}
              {...(column.width === undefined ? {} : { style: { width: column.width } })}
            />
          ))}
        </colgroup>
      )}
      <thead className="[display:table-header-group]">
        <tr>
          {props.columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className={cn(
                'border-0 border-b border-solid border-default px-2 py-1.5 align-bottom text-xs font-medium text-secondary first:ps-0 last:pe-0',
                column.align === 'end' ? 'text-end' : 'text-start',
              )}
            >
              <span className={TEXT_ISOLATE}>{column.header}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.rows.map((row) => {
          const type = props.lineType?.(row) ?? 'line'
          const cellBorder =
            type === 'subtotal'
              ? 'border-0 border-t border-b border-solid border-t-default border-b-subtle'
              : 'border-0 border-b border-solid border-subtle'
          if (spansRow(type)) {
            return (
              <tr key={props.rowKey(row)} data-line-type={type} className="break-inside-avoid">
                <td
                  colSpan={props.columns.length}
                  className={cn(
                    'px-0 py-1.5 align-top',
                    cellBorder,
                    LINE_TYPE_TEXT[type],
                    type === 'heading' && 'pt-3',
                    TEXT_DIRECTION,
                  )}
                >
                  {props.lineText?.(row)}
                </td>
              </tr>
            )
          }
          return (
            <tr key={props.rowKey(row)} data-line-type={type} className="break-inside-avoid">
              {props.columns.map((column, index) => {
                const content = column.cell(row)
                const Cell = index === 0 ? 'th' : 'td'
                return (
                  <Cell
                    key={column.key}
                    {...(index === 0 ? { scope: 'row' } : {})}
                    className={cn(
                      'px-2 py-1.5 align-top first:ps-0 last:pe-0',
                      cellBorder,
                      LINE_TYPE_TEXT[type],
                      index === 0 && type !== 'subtotal' && 'font-regular',
                      column.align === 'end'
                        ? 'text-end whitespace-nowrap tabular-nums'
                        : cn('text-start', TEXT_DIRECTION),
                    )}
                  >
                    {column.align === 'end' ? <bdi>{content}</bdi> : content}
                  </Cell>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export interface PrintSectionProps {
  title: ReactNode
  /** The title's level in the printout's outline. Default 2. */
  headingLevel?: 2 | 3 | 4
  children: ReactNode
}

/** A titled part of a printout: the title (13px semibold, no rule), then its content. */
export function PrintSection({ title, headingLevel = 2, children }: PrintSectionProps) {
  const Heading = `h${String(headingLevel)}` as 'h2'
  return (
    <section data-slot="print-section" className="flex flex-col gap-1.5">
      <Heading className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
        {title}
      </Heading>
      <div className={cn('flex flex-col gap-2 text-sm text-primary', TEXT_DIRECTION)}>
        {children}
      </div>
    </section>
  )
}

/** One signature on paper: an electronic signature field (P5.28). */
export interface PrintSignature {
  /**
   * The field's stable id ("doctor", "teacher"): the same on every print of the document, so the
   * application and Liro Bridge find the field by it.
   */
  id: string
  /** Whose signature it is ("Class teacher", "Issued by"). */
  label: string
  /** The person's name, under the line. */
  name?: string
  /** A line under the name ("Specialist in occupational medicine"). */
  detail?: string
  /** The visible signature once signed (an image from the application), standing on the line. */
  image?: ReactNode
}

export interface PrintSignatureFieldProps extends PrintSignature {
  /**
   * The user signs here: on screen the empty field is a "Sign here" button (left off the paper)
   * that reports the field's id; without it the field is only the place to sign.
   */
  onSign?: (id: string) => void
  className?: string
}

/**
 * An electronic signature field: whose signature it is, a 64 × 18mm place for the visible
 * signature on a thin line, the name and a detail under it. The place carries
 * `data-signature-field="<id>"`; PrintPage measures it and writes its page and PDF rectangle on it
 * (`data-pdf-page`, `data-pdf-rect`) and reports them (`onSignatureFields`). Never split between
 * pages. Signature lines only where a signature is really required (a certificate, a finding),
 * never on an invoice.
 */
export function PrintSignatureField(props: PrintSignatureFieldProps) {
  const { messages } = useLiro()
  const labelId = useId()
  const signed = props.image !== undefined && props.image !== null
  return (
    <div
      data-slot="print-signature"
      className={cn(
        'flex w-[64mm] max-w-full flex-col gap-0.5 break-inside-avoid',
        props.className,
      )}
    >
      <span id={labelId} className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
        {props.label}
      </span>
      <div
        data-signature-field={props.id}
        className="relative box-border flex h-[18mm] items-end justify-center border-0 border-b border-solid border-strong"
      >
        {props.image}
        {!signed && props.onSign !== undefined && (
          <button
            type="button"
            aria-describedby={labelId}
            onClick={() => {
              props.onSign?.(props.id)
            }}
            className={cn(
              BUTTON_RESET,
              FOCUS_RING,
              'absolute inset-x-0 top-0 bottom-1 flex cursor-pointer items-center justify-center rounded-sm border border-dashed border-default text-sm text-link hover:bg-surface-hover print:hidden',
            )}
          >
            <span className={TEXT_ISOLATE}>{messages['print.signHere']}</span>
          </button>
        )}
      </div>
      {props.name !== undefined && (
        <span className={cn('pt-1 text-sm font-medium text-primary', TEXT_DIRECTION)}>
          {props.name}
        </span>
      )}
      {props.detail !== undefined && (
        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{props.detail}</span>
      )}
    </div>
  )
}

export interface PrintSignaturesProps {
  signatures: readonly PrintSignature[]
  /** The user signs in a field: see PrintSignatureField. */
  onSign?: (id: string) => void
  className?: string
}

/**
 * The signature fields of a printout in one row at the start, top-aligned, 48px apart, wrapping. Never split
 * between pages. No seal or stamp (P5.28).
 */
export function PrintSignatures({ signatures, onSign, className }: PrintSignaturesProps) {
  return (
    <div
      data-slot="print-signatures"
      data-print-keep=""
      className={cn('flex flex-wrap items-start gap-x-12 gap-y-8 break-inside-avoid', className)}
    >
      {signatures.map((signature) => (
        <PrintSignatureField
          key={signature.id}
          {...signature}
          {...(onSign === undefined ? {} : { onSign })}
        />
      ))}
    </div>
  )
}

/** Where and when a printout was issued. */
export interface PrintIssued {
  /** The place, from the application ("Novi Sad"). */
  place?: string
  /** The date, YYYY-MM-DD, written by the provider's format. */
  date?: string
}

/** "Novi Sad, 10.10.2026.": the place and the date through `format.date`. */
export function PrintIssuedLine({ issued }: { issued: PrintIssued }) {
  const { messages, format } = useLiro()
  const date = issued.date === undefined ? undefined : format.date(issued.date)
  const text =
    issued.place !== undefined && date !== undefined
      ? messages['print.placeAndDate'](issued.place, date)
      : (issued.place ?? date ?? '')
  if (text === '') return null
  return (
    <p data-slot="print-issued" className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>
      {text}
    </p>
  )
}

/**
 * A printout's title row (P5.28): the title (h1, 24px) with its number and a line under it (the
 * period, the subject) at the start, the application's logo (an image, D18) at the end.
 */
export function PrintTitle({
  title,
  number,
  subtitle,
  logo,
}: {
  title: string
  number?: string | undefined
  subtitle?: string | undefined
  /** The issuer's logo, an image from the application, at the end of the row. */
  logo?: ReactNode
}) {
  return (
    <div data-slot="print-title" className="flex items-start justify-between gap-6">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className={cn('m-0 text-h2 text-primary', TEXT_DIRECTION)}>
          {title}
          {number !== undefined && (
            <>
              {' '}
              <span dir="ltr" className="whitespace-nowrap">
                {number}
              </span>
            </>
          )}
        </h1>
        {subtitle !== undefined && (
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{subtitle}</p>
        )}
      </div>
      {logo !== undefined && logo !== null && (
        <div data-slot="print-logo" className="flex max-h-16 max-w-[60mm] shrink-0 items-start">
          {logo}
        </div>
      )}
    </div>
  )
}

/** The amount to pay and by when. */
export interface PrintAmountDue {
  /** The amount, a decimal string from the application (never computed here). */
  value: string
  currency: string
  /** The due date, YYYY-MM-DD; without it the line names no date. */
  date?: string
  decimals?: number
}

/**
 * The one prominent line of a document (P5.28): "5.003.678,22 RSD due 21.10.2026.", the amount
 * through `format.money`, the date through `format.date`, the words from
 * `messages['print.amountDue']`.
 */
export function PrintAmountDueLine({ due }: { due: PrintAmountDue }) {
  const { messages, format } = useLiro()
  const amount = format.money(
    due.value,
    due.currency,
    due.decimals === undefined ? {} : { decimals: due.decimals },
  )
  return (
    <p
      data-slot="print-amount-due"
      className={cn('m-0 text-h3 font-semibold text-primary tabular-nums', TEXT_DIRECTION)}
    >
      {messages['print.amountDue'](
        amount,
        due.date === undefined ? undefined : format.date(due.date),
      )}
    </p>
  )
}

/** How to pay: the details and the IPS QR code. */
export interface PrintPayment {
  /** The block's heading ("Payment details"), from the application. */
  title?: string
  /** Account, model and reference number, recipient … as label–value rows. */
  details: readonly PrintDetail[]
  /**
   * The IPS QR code: an image (or an SVG element) the application makes from the payment's
   * data. The template draws nothing of its own in this 32mm slot.
   */
  code?: ReactNode
  /** A line under the code ("Scan with your bank's app"), from the application. */
  codeCaption?: string
}

/** The payment details at the start, the IPS QR code at the end; never split between pages. */
export function PrintPaymentDetails({ payment }: { payment: PrintPayment }) {
  const hasCode = payment.code !== undefined && payment.code !== null
  return (
    <section
      data-slot="print-payment"
      aria-label={payment.title}
      className="flex items-start justify-between gap-6 break-inside-avoid"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        {payment.title !== undefined && (
          <h2 className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
            {payment.title}
          </h2>
        )}
        <PrintDetails items={payment.details} columns={1} layout="rows" />
      </div>
      {hasCode && (
        <figure
          data-slot="print-payment-code"
          className="m-0 flex w-[32mm] shrink-0 flex-col gap-1"
        >
          <div className="flex size-[32mm] items-center justify-center [&>*]:max-h-full [&>*]:max-w-full">
            {payment.code}
          </div>
          {payment.codeCaption !== undefined && (
            <figcaption className={cn('text-xs text-secondary', TEXT_ISOLATE)}>
              {payment.codeCaption}
            </figcaption>
          )}
        </figure>
      )}
    </section>
  )
}
