import type { ReactNode } from 'react'
import { DocumentTotals, type DocumentTotalsProps } from '../components/document-totals'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { PrintPage, type PrintFrameProps } from './print-page'
import {
  PrintAmountDueLine,
  PrintDetails,
  PrintIssuedLine,
  PrintPaymentDetails,
  PrintSection,
  PrintSignatures,
  PrintTable,
  PrintTitle,
  type PrintAmountDue,
  type PrintDetail,
  type PrintIssued,
  type PrintPayment,
  type PrintSignature,
  type PrintTableProps,
} from './print-parts'

/*
 * The print templates of P5.15, each a PrintPage with a fixed order of parts and every text from
 * props (D1, D5: no domain words here; the examples carry the data). Generic names, decided:
 * PrintDocument (an invoice, a delivery note, an offer), PrintCertificate, PrintGradeReport (a
 * school report), PrintFinding (a medical finding). The marker of a draft or a cancelled
 * document (PrintFrameProps `status`) works in each.
 *
 * **As simple as a Stripe invoice, in Liro's design** (P5.28 item 20, the owner: "Simplicity is
 * the biggest advantage"): the title at the start and the logo at the end; a small key/value
 * block; black and grey (the brand colour only in the logo and links); generous white space;
 * thin rules only — no boxes, frames, shaded headers, stamps or seals. Signature fields only
 * where a signature is really required (a certificate, a report card, a finding), never on a
 * business document; each is an electronic signature field with a stable id whose place in the
 * PDF PrintPage reports. All wording and legal notes come from the application.
 * - PrintDocument: title and logo; the key/value block (number, date of issue, date of supply,
 *   due date, place of issue); seller and buyer side by side (name, address, PIB, MB, e-mail);
 *   one prominent "5.003.678,22 RSD due 21.10.2026."; the payment details with the IPS QR slot;
 *   the lines (thin rules); the totals at the end side (DocumentTotals `ruled`: a thin rule above
 *   each row, the amount due bold; the recap by rate only when the data has it); notes.
 * - PrintCertificate: one page, landscape by default, start-aligned: title and logo, the words
 *   before the name, the name as the largest text, the text, number, place and date, signatures.
 * - PrintGradeReport: title, period and logo; the person's details; the table; the summary;
 *   remarks; place and date; signatures.
 * - PrintFinding: title, number and logo; the person's details (`subjectTitle` over them, no
 *   frame); the finding's details; titled sections; place and date; the signature; the
 *   `confidentiality` note in the footer of every page.
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

function Closing({
  issued,
  signatures,
  onSign,
}: {
  issued?: PrintIssued | undefined
  signatures?: readonly PrintSignature[] | undefined
  onSign?: ((id: string) => void) | undefined
}) {
  if (issued === undefined && (signatures === undefined || signatures.length === 0)) return null
  return (
    <div data-slot="print-closing" className="flex flex-col gap-6 pt-4 break-inside-avoid">
      {issued !== undefined && <PrintIssuedLine issued={issued} />}
      {signatures !== undefined && signatures.length > 0 && (
        <PrintSignatures signatures={signatures} {...(onSign === undefined ? {} : { onSign })} />
      )}
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

// ── PrintCertificate ────────────────────────────────────────────────────────────────────────

export interface PrintCertificateProps extends PrintFrameProps {
  /** "Certificate": the h1, at the start. */
  title: string
  /** A line under the title ("of completion of the training"). */
  subtitle?: string
  /** The words before the name ("This certifies that"). */
  lead?: string
  /** The person it is given to: the largest text on the page. */
  recipient: string
  /** A line under the name (born, place, number of the identity document). */
  recipientDetail?: string
  /** What the certificate states. */
  text: ReactNode
  /** Its number, as the application writes it ("No. BZR-2026-0142"). */
  number?: string
  /** The issuer's logo (an image, D18), at the end of the title row. */
  logo?: ReactNode
  issued?: PrintIssued
  /** The electronic signature fields. */
  signatures?: readonly PrintSignature[]
  /** The user signs in a field (on screen; see PrintSignatureField). */
  onSign?: (id: string) => void
}

/**
 * A certificate on one page: landscape by default, start-aligned, no frame or seal; the title
 * and the logo, the name, the text, the number, place and date, the signature fields at the
 * bottom. Without a page number unless `pageNumbers` asks for one.
 */
export function PrintCertificate(props: PrintCertificateProps) {
  return (
    <PrintPage
      {...frame(props)}
      orientation={props.orientation ?? 'landscape'}
      pageNumbers={props.pageNumbers ?? false}
      title={`${props.title}: ${props.recipient}`}
    >
      <div
        data-slot="print-certificate"
        className="box-border flex min-h-(--liro-print-area) flex-1 flex-col justify-between gap-8 break-inside-avoid"
      >
        <PrintTitle title={props.title} subtitle={props.subtitle} logo={props.logo} />
        <div className="flex max-w-[190mm] flex-col gap-2">
          {props.lead !== undefined && (
            <p className={cn('m-0 text-md text-secondary', TEXT_DIRECTION)}>{props.lead}</p>
          )}
          <p data-slot="print-recipient" className={cn('m-0 text-h1 text-primary', TEXT_DIRECTION)}>
            {props.recipient}
          </p>
          {props.recipientDetail !== undefined && (
            <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
              {props.recipientDetail}
            </p>
          )}
          <div className={cn('pt-4 text-md text-primary', TEXT_DIRECTION)}>{props.text}</div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-0.5">
            {props.number !== undefined && (
              <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{props.number}</p>
            )}
            {props.issued !== undefined && <PrintIssuedLine issued={props.issued} />}
          </div>
          {props.signatures !== undefined && props.signatures.length > 0 && (
            <PrintSignatures
              signatures={props.signatures}
              {...(props.onSign === undefined ? {} : { onSign: props.onSign })}
            />
          )}
        </div>
      </div>
    </PrintPage>
  )
}

// ── PrintGradeReport ────────────────────────────────────────────────────────────────────────

export interface PrintGradeReportProps<Row> extends PrintFrameProps {
  /** "Report card": the h1, at the start. */
  title: string
  /** The period it covers ("First term, school year 2026/27"), under the title. */
  period?: string
  /** The institution's logo (an image, D18), at the end of the title row. */
  logo?: ReactNode
  /** Whose results these are (name, class, date of birth …): the key/value block. */
  details?: readonly PrintDetail[]
  /** The results by subject (PrintTable's props; a subtotal row for the average). */
  table: PrintTableProps<Row>
  /** The outcome under the table (overall result, conduct, absences). */
  summary?: readonly PrintDetail[]
  /** Remarks: a titled block of text. */
  remarks?: { title: string; content: ReactNode }
  issued?: PrintIssued
  /** The electronic signature fields. */
  signatures?: readonly PrintSignature[]
  /** The user signs in a field (on screen; see PrintSignatureField). */
  onSign?: (id: string) => void
}

/**
 * Results by subject for a period: title, period and logo, the person's details, the table, the
 * summary, remarks, place and date, the signature fields.
 */
export function PrintGradeReport<Row>(props: PrintGradeReportProps<Row>) {
  return (
    <PrintPage {...frame(props)} title={props.title}>
      <div data-slot="print-grade-report" className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <PrintTitle title={props.title} subtitle={props.period} logo={props.logo} />
          {props.details !== undefined && props.details.length > 0 && (
            <PrintDetails items={props.details} columns={2} layout="rows" />
          )}
        </div>
        <PrintTable {...props.table} />
        {props.summary !== undefined && props.summary.length > 0 && (
          <PrintDetails items={props.summary} columns={1} layout="rows" />
        )}
        {props.remarks !== undefined && (
          <PrintSection title={props.remarks.title}>{props.remarks.content}</PrintSection>
        )}
        <Closing issued={props.issued} signatures={props.signatures} onSign={props.onSign} />
      </div>
    </PrintPage>
  )
}

// ── PrintFinding ────────────────────────────────────────────────────────────────────────────

/** A titled section of a finding. */
export interface PrintFindingSection {
  key: string
  title: string
  content: ReactNode
}

export interface PrintFindingProps extends PrintFrameProps {
  /** "Specialist examination report": the h1, at the start. */
  title: string
  /** Its number, left to right after the title. */
  number?: string
  /** The institution's logo (an image, D18), at the end of the title row. */
  logo?: ReactNode
  /** The title of the person's block ("Patient"). */
  subjectTitle: string
  /** The person's details (name, date of birth, insurance number). */
  subject: readonly PrintDetail[]
  /** The finding's details (date, referral, department). */
  details?: readonly PrintDetail[]
  /** The finding's sections, in order. */
  sections: readonly PrintFindingSection[]
  /** A confidentiality note from the application, printed at the bottom of every page. */
  confidentiality?: string
  issued?: PrintIssued
  /** The electronic signature fields. */
  signatures?: readonly PrintSignature[]
  /** The user signs in a field (on screen; see PrintSignatureField). */
  onSign?: (id: string) => void
}

/**
 * A finding on paper: title, number and logo, the person's details, the finding's details, the
 * sections, place and date, the signature field; the confidentiality note in every page's footer.
 */
export function PrintFinding(props: PrintFindingProps) {
  const title = props.number === undefined ? props.title : `${props.title} ${props.number}`
  const footer =
    props.confidentiality === undefined ? (
      props.footer
    ) : (
      <div className="flex flex-col gap-1">
        <p
          data-slot="print-confidentiality"
          className={cn('m-0 font-semibold text-primary', TEXT_DIRECTION)}
        >
          {props.confidentiality}
        </p>
        {props.footer !== undefined && props.footer !== null && (
          <div className={TEXT_DIRECTION}>{props.footer}</div>
        )}
      </div>
    )
  return (
    <PrintPage {...frame(props)} footer={footer} title={title}>
      <div data-slot="print-finding" className="flex flex-col gap-8">
        <PrintTitle title={props.title} number={props.number} logo={props.logo} />
        <section
          aria-label={props.subjectTitle}
          className="flex flex-col gap-1.5 break-inside-avoid"
        >
          <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>{props.subjectTitle}</p>
          <PrintDetails items={props.subject} columns={2} layout="rows" />
        </section>
        {props.details !== undefined && props.details.length > 0 && (
          <PrintDetails items={props.details} columns={2} layout="rows" />
        )}
        {props.sections.map((section) => (
          <PrintSection key={section.key} title={section.title}>
            {section.content}
          </PrintSection>
        ))}
        <Closing issued={props.issued} signatures={props.signatures} onSign={props.onSign} />
      </div>
    </PrintPage>
  )
}
