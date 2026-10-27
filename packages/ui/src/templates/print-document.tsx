import type { ReactNode } from 'react'
import { DocumentTotals, type DocumentTotalsProps } from '../components/document-totals'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { PrintPage, type PrintFrameProps } from './print-page'
import {
  PrintAmountDueLine,
  PrintDetails,
  PrintPaymentDetails,
  PrintSection,
  PrintTable,
  PrintTitle,
  type PrintAmountDue,
  type PrintDetail,
  type PrintPayment,
  type PrintTableProps,
} from './print-parts'

/*
 * PrintDocument (P5.15): a commercial document on paper (an invoice, a delivery note, an offer),
 * a PrintPage with a fixed order of parts and every text from props (D1, D5: no domain words
 * here; the examples carry the data). The marker of a draft or a cancelled document
 * (PrintFrameProps `status`) works in it. Other layouts (a certificate, a report card, a finding,
 * the formal acts) are not templates of the library: they come from JSON definitions rendered from
 * the print parts (P5.92).
 *
 * **As simple as a Stripe invoice, in Liro's design** (P5.28 item 20, the owner: "Simplicity is
 * the biggest advantage"): the title at the start and the logo at the end; a small key/value
 * block; black and grey (the brand colour only in the logo and links); generous white space;
 * thin rules only — no boxes, frames, shaded headers, stamps or seals; no signature fields on a
 * business document. All wording and legal notes come from the application: title and logo; the
 * key/value block (number, date of issue, date of supply, due date, place of issue); seller and
 * buyer side by side (name, address, PIB, MB, e-mail); one prominent "5.003.678,22 RSD due
 * 21.10.2026."; the payment details with the IPS QR slot; the lines (thin rules); the totals at
 * the end side (DocumentTotals `ruled`: a thin rule above each row, the amount due bold; the
 * recap by rate only when the data has it); notes.
 */

/** A party of a document (the seller, the buyer): its role, name, address and details. */
export interface PrintParty {
  key: string
  /** Its role on the document ("Seller", "Buyer"), from the application. */
  label: string
  name: string
  /** Address lines, as the application writes them. */
  lines?: readonly string[]
  /** Identifiers and contacts ("PIB", "MB", "E-mail"), one short line each. */
  details?: readonly PrintDetail[]
}

function isEmpty(value: ReactNode): boolean {
  return value === undefined || value === null || value === '' || value === false
}

/** The parties side by side: the role small and grey, the name semibold, then plain lines. */
function Parties({ parties }: { parties: readonly PrintParty[] }) {
  return (
    <div
      data-slot="print-parties"
      className={cn('grid gap-8', parties.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}
    >
      {parties.map((party) => (
        <section
          key={party.key}
          aria-label={party.label}
          className="flex min-w-0 flex-col gap-0.5 break-inside-avoid"
        >
          <p className={cn('m-0 pb-1 text-xs text-secondary', TEXT_DIRECTION)}>{party.label}</p>
          <p className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
            {party.name}
          </p>
          {party.lines?.map((line, index) => (
            <p key={index} className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>
              {line}
            </p>
          ))}
          {party.details?.map((detail, index) => (
            <p key={detail.key ?? index} className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>
              <span className="text-secondary">{detail.label}</span>{' '}
              <span className={cn(detail.numeric === true && 'tabular-nums')}>
                {isEmpty(detail.value) ? '—' : detail.value}
              </span>
            </p>
          ))}
        </section>
      ))}
    </div>
  )
}

function Notes({ notes, title }: { notes: readonly string[]; title?: string | undefined }) {
  const paragraphs = notes.map((note, index) => (
    <p key={index} className={cn('m-0 text-sm whitespace-pre-line text-secondary', TEXT_DIRECTION)}>
      {note}
    </p>
  ))
  if (title === undefined) {
    return (
      <div data-slot="print-notes" className="flex flex-col gap-2">
        {paragraphs}
      </div>
    )
  }
  return <PrintSection title={title}>{paragraphs}</PrintSection>
}

/** The PrintPage props of a template, without its own. */
function frame(props: PrintFrameProps): PrintFrameProps {
  return {
    ...(props.orientation === undefined ? {} : { orientation: props.orientation }),
    ...(props.margins === undefined ? {} : { margins: props.margins }),
    ...(props.header === undefined ? {} : { header: props.header }),
    ...(props.footer === undefined ? {} : { footer: props.footer }),
    ...(props.pageNumbers === undefined ? {} : { pageNumbers: props.pageNumbers }),
    ...(props.status === undefined ? {} : { status: props.status }),
    ...(props.fit === undefined ? {} : { fit: props.fit }),
    ...(props.onSignatureFields === undefined
      ? {}
      : { onSignatureFields: props.onSignatureFields }),
  }
}

// ── PrintDocument ───────────────────────────────────────────────────────────────────────────

export interface PrintDocumentProps<Row> extends PrintFrameProps {
  /** The document's kind as the application names it ("Invoice"): the h1, at the start. */
  title: string
  /** Its number: names the sheet ("Invoice F-2026-0419"); print it in `details`. */
  number?: string
  /** The issuer's logo (an image from the application, D18), at the end of the title row. */
  logo?: ReactNode
  /**
   * The small key/value block under the title: number, date of issue, date of supply, due date,
   * place of issue (label and value on one row).
   */
  details?: readonly PrintDetail[]
  /** The parties, side by side (the seller and the buyer). */
  parties?: readonly PrintParty[]
  /** The one prominent line: "5.003.678,22 RSD due 21.10.2026.". */
  amountDue?: PrintAmountDue
  /** How to pay: account, model and reference number, the IPS QR code. */
  payment?: PrintPayment
  /** The lines (PrintTable's props: columns, rows, line types). */
  lines: PrintTableProps<Row>
  /**
   * The totals, exactly as DocumentTotals takes them on screen (the recap by rate only when the
   * data has it); nothing is computed. Drawn with a thin rule above each row.
   */
  totals?: DocumentTotalsProps
  /** Notes after the totals, one paragraph each (template texts, legal notes, the free note). */
  notes?: readonly string[]
  /** The title of the notes. Without it, the notes stand without a heading. */
  notesTitle?: string
}

/**
 * A business document on paper, as simple as a Stripe invoice: title and logo, the key/value
 * block, seller and buyer, the amount due, the payment details, the lines, the totals, notes.
 * No signatures.
 */
export function PrintDocument<Row>(props: PrintDocumentProps<Row>) {
  const name = props.number === undefined ? props.title : `${props.title} ${props.number}`
  return (
    <PrintPage {...frame(props)} title={name}>
      <div data-slot="print-document" className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <PrintTitle title={props.title} logo={props.logo} />
          {props.details !== undefined && props.details.length > 0 && (
            <PrintDetails items={props.details} columns={1} layout="rows" />
          )}
        </div>
        {props.parties !== undefined && props.parties.length > 0 && (
          <Parties parties={props.parties} />
        )}
        {(props.amountDue !== undefined || props.payment !== undefined) && (
          <div className="flex flex-col gap-4">
            {props.amountDue !== undefined && <PrintAmountDueLine due={props.amountDue} />}
            {props.payment !== undefined && <PrintPaymentDetails payment={props.payment} />}
          </div>
        )}
        <div className="flex flex-col gap-6">
          <PrintTable {...props.lines} />
          {props.totals !== undefined && (
            <div className="break-inside-avoid">
              <DocumentTotals {...props.totals} ruled />
            </div>
          )}
        </div>
        {props.notes !== undefined && props.notes.length > 0 && (
          <Notes notes={props.notes} title={props.notesTitle} />
        )}
      </div>
    </PrintPage>
  )
}
