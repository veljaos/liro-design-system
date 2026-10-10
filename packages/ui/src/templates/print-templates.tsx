import type { ReactNode } from 'react'
import { DocumentTotals, type DocumentTotalsProps } from '../components/document-totals'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { PrintPage, type PrintFrameProps } from './print-page'
import {
  PrintDetails,
  PrintIssuedLine,
  PrintSection,
  PrintSignatures,
  PrintTable,
  PrintTitle,
  type PrintDetail,
  type PrintIssued,
  type PrintSignature,
  type PrintTableProps,
} from './print-parts'

/*
 * The print templates of P5.15, each a PrintPage with a fixed order of parts and every text from
 * props (D1, D5: no domain words here; the examples carry the data). Generic names, decided:
 * - PrintDocument: a business document (an invoice, a delivery note, an offer) — parties, the
 *   document's details, its lines, the totals (DocumentTotals, the screen's rules: recap by tax
 *   category, deductions, home currency, footnotes; nothing computed), notes, signatures.
 * - PrintCertificate: a certificate or diploma — centred on the page (the convention of the
 *   paper, not of the screen), landscape by default, a double frame line, the recipient's name
 *   large, the text, place and date, signatures with an optional seal; the emblem (a logo or a
 *   crest) and the seal are images from props (D18).
 * - PrintGradeReport: a report of results by subject for a period (a school report): the person's
 *   details, the table, a summary, remarks, signatures.
 * - PrintFinding: a finding of an examination (a medical finding): the person's block, the
 *   finding's details, titled sections, the signature, and a confidentiality line printed in the
 *   footer of every page.
 * The marker of a draft or a cancelled document (PrintFrameProps `status`) works in each.
 */

/** A party of a document (the issuer, the recipient): its role, name, address and details. */
export interface PrintParty {
  key: string
  /** Its role on the document ("Seller", "Buyer"), from the application. */
  label: string
  name: string
  /** Address lines, as the application writes them. */
  lines?: readonly string[]
  /** Identifiers and contacts ("Tax number", "Account"). */
  details?: readonly PrintDetail[]
}

function Parties({ parties }: { parties: readonly PrintParty[] }) {
  return (
    <div
      data-slot="print-parties"
      className={cn('grid gap-6', parties.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}
    >
      {parties.map((party) => (
        <section
          key={party.key}
          aria-label={party.label}
          className="flex min-w-0 flex-col gap-1 break-inside-avoid"
        >
          <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>{party.label}</p>
          <p className={cn('m-0 text-md font-semibold text-primary', TEXT_DIRECTION)}>
            {party.name}
          </p>
          {party.lines?.map((line, index) => (
            <p key={index} className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>
              {line}
            </p>
          ))}
          {party.details !== undefined && party.details.length > 0 && (
            <PrintDetails items={party.details} columns={1} className="mt-2 gap-y-1" />
          )}
        </section>
      ))}
    </div>
  )
}

function Closing({
  issued,
  signatures,
  seal,
}: {
  issued?: PrintIssued | undefined
  signatures?: readonly PrintSignature[] | undefined
  seal?: ReactNode
}) {
  if (issued === undefined && (signatures === undefined || signatures.length === 0)) return null
  return (
    <div data-slot="print-closing" className="flex flex-col gap-6 pt-4 break-inside-avoid">
      {issued !== undefined && <PrintIssuedLine issued={issued} />}
      {signatures !== undefined && signatures.length > 0 && (
        <PrintSignatures signatures={signatures} seal={seal} />
      )}
    </div>
  )
}

// ── PrintDocument ───────────────────────────────────────────────────────────────────────────

export interface PrintDocumentProps<Row> extends PrintFrameProps {
  /** The document's kind as the application names it ("Invoice"): the h1. */
  title: string
  /** Its number ("F-2026-0419"), left to right after the title. */
  number?: string
  /** The issuer's block at the top of the first page (name, address; a logo as an image, D18). */
  letterhead?: ReactNode
  /** The parties, side by side (the seller and the buyer). */
  parties?: readonly PrintParty[]
  /** The document's details (dates of issue, supply and payment, place, references). */
  details?: readonly PrintDetail[]
  /** The lines (PrintTable's props: columns, rows, line types). */
  lines: PrintTableProps<Row>
  /** The totals, exactly as DocumentTotals takes them on screen; nothing is computed. */
  totals?: DocumentTotalsProps
  /** Notes after the totals, one paragraph each (template texts and the free note). */
  notes?: readonly string[]
  /** The title of the notes. Without it, the notes stand without a heading. */
  notesTitle?: string
  issued?: PrintIssued
  signatures?: readonly PrintSignature[]
}

/**
 * A business document on paper: letterhead, title and number, parties, details, the lines, the
 * totals, notes, place and date, signatures.
 */
export function PrintDocument<Row>(props: PrintDocumentProps<Row>) {
  const title = props.number === undefined ? props.title : `${props.title} ${props.number}`
  return (
    <PrintPage {...frame(props)} title={title}>
      <div data-slot="print-document" className="flex flex-col gap-6">
        {props.letterhead !== undefined && (
          <div data-slot="print-letterhead">{props.letterhead}</div>
        )}
        <PrintTitle title={props.title} number={props.number} />
        {props.parties !== undefined && props.parties.length > 0 && (
          <Parties parties={props.parties} />
        )}
        {props.details !== undefined && props.details.length > 0 && (
          <PrintDetails items={props.details} columns={3} />
        )}
        <PrintTable {...props.lines} />
        {props.totals !== undefined && (
          <div className="break-inside-avoid">
            <DocumentTotals {...props.totals} />
          </div>
        )}
        {props.notes !== undefined && props.notes.length > 0 && (
          <Notes notes={props.notes} title={props.notesTitle} />
        )}
        <Closing issued={props.issued} signatures={props.signatures} />
      </div>
    </PrintPage>
  )
}

function Notes({ notes, title }: { notes: readonly string[]; title?: string | undefined }) {
  const paragraphs = notes.map((note, index) => (
    <p key={index} className={cn('m-0 text-sm whitespace-pre-line text-primary', TEXT_DIRECTION)}>
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
  }
}

// ── PrintCertificate ────────────────────────────────────────────────────────────────────────

export interface PrintCertificateProps extends PrintFrameProps {
  /** "Certificate": the h1. */
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
  /** An emblem above the title (a logo or a crest, as an image), D18. */
  emblem?: ReactNode
  /** A seal between the signatures (an image), D18. */
  seal?: ReactNode
  issued?: PrintIssued
  signatures?: readonly PrintSignature[]
}

/**
 * A certificate on one page: landscape by default, centred, inside a double frame line; the
 * emblem, the title, the recipient's name, the text, the number, place and date, signatures.
 * Without a page number unless `pageNumbers` asks for one.
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
        className="box-border flex min-h-(--liro-print-area) flex-1 flex-col items-center justify-between gap-6 border-4 border-double border-strong px-10 py-8 text-center break-inside-avoid"
      >
        <div className="flex flex-col items-center gap-3">
          {props.emblem !== undefined && (
            <div data-slot="print-emblem" className="flex max-h-20 items-center justify-center">
              {props.emblem}
            </div>
          )}
          <h1 className={cn('m-0 text-h1 text-primary', TEXT_ISOLATE)}>{props.title}</h1>
          {props.subtitle !== undefined && (
            <p className={cn('m-0 text-lg text-secondary', TEXT_ISOLATE)}>{props.subtitle}</p>
          )}
        </div>
        <div className="flex max-w-[150mm] flex-col items-center gap-2">
          {props.lead !== undefined && (
            <p className={cn('m-0 text-md text-secondary', TEXT_ISOLATE)}>{props.lead}</p>
          )}
          <p
            data-slot="print-recipient"
            className={cn(
              'm-0 border-0 border-b border-solid border-strong px-6 pb-1 text-h2 text-primary',
              TEXT_ISOLATE,
            )}
          >
            {props.recipient}
          </p>
          {props.recipientDetail !== undefined && (
            <p className={cn('m-0 text-sm text-secondary', TEXT_ISOLATE)}>
              {props.recipientDetail}
            </p>
          )}
          <div className={cn('pt-3 text-md text-primary', TEXT_ISOLATE)}>{props.text}</div>
          {props.number !== undefined && (
            <p className={cn('m-0 pt-1 text-xs text-secondary', TEXT_ISOLATE)}>{props.number}</p>
          )}
        </div>
        <div className="flex w-full flex-col items-center gap-6">
          {props.issued !== undefined && <PrintIssuedLine issued={props.issued} />}
          {props.signatures !== undefined && props.signatures.length > 0 && (
            <PrintSignatures
              signatures={props.signatures}
              seal={props.seal}
              className="w-full text-start"
            />
          )}
        </div>
      </div>
    </PrintPage>
  )
}

// ── PrintGradeReport ────────────────────────────────────────────────────────────────────────

export interface PrintGradeReportProps<Row> extends PrintFrameProps {
  /** "Report card": the h1. */
  title: string
  /** The period it covers ("First term, school year 2026/27"), under the title. */
  period?: string
  /** The institution's block at the top of the first page (D18: a logo as an image). */
  letterhead?: ReactNode
  /** Whose results these are (name, class, date of birth …). */
  details?: readonly PrintDetail[]
  /** The results by subject (PrintTable's props; a subtotal row for the average). */
  table: PrintTableProps<Row>
  /** The outcome under the table (overall result, conduct, absences). */
  summary?: readonly PrintDetail[]
  /** Remarks: a titled block of text. */
  remarks?: { title: string; content: ReactNode }
  issued?: PrintIssued
  signatures?: readonly PrintSignature[]
  /** A seal between the signatures (an image), D18. */
  seal?: ReactNode
}

/**
 * Results by subject for a period: letterhead, title and period, the person's details, the
 * table, the summary, remarks, place and date, signatures.
 */
export function PrintGradeReport<Row>(props: PrintGradeReportProps<Row>) {
  return (
    <PrintPage {...frame(props)} title={props.title}>
      <div data-slot="print-grade-report" className="flex flex-col gap-6">
        {props.letterhead !== undefined && (
          <div data-slot="print-letterhead">{props.letterhead}</div>
        )}
        <PrintTitle title={props.title} subtitle={props.period} />
        {props.details !== undefined && props.details.length > 0 && (
          <PrintDetails items={props.details} columns={3} />
        )}
        <PrintTable {...props.table} />
        {props.summary !== undefined && props.summary.length > 0 && (
          <PrintDetails items={props.summary} columns={3} />
        )}
        {props.remarks !== undefined && (
          <PrintSection title={props.remarks.title}>{props.remarks.content}</PrintSection>
        )}
        <Closing issued={props.issued} signatures={props.signatures} seal={props.seal} />
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
  /** "Specialist examination report": the h1. */
  title: string
  /** Its number, left to right after the title. */
  number?: string
  /** The institution's block at the top of the first page (D18: a logo as an image). */
  letterhead?: ReactNode
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
  signatures?: readonly PrintSignature[]
  /** A stamp between the signatures (an image), D18. */
  seal?: ReactNode
}

/**
 * A finding on paper: letterhead, title and number, the person's block, the details, the
 * sections, place and date, the signature; the confidentiality note in every page's footer.
 */
export function PrintFinding(props: PrintFindingProps) {
  const title = props.number === undefined ? props.title : `${props.title} ${props.number}`
  const footer =
    props.confidentiality === undefined ? (
      props.footer
    ) : (
      <div className="flex flex-col gap-1">
        <p data-slot="print-confidentiality" className="m-0 font-semibold text-primary">
          {props.confidentiality}
        </p>
        {props.footer !== undefined && props.footer !== null && <div>{props.footer}</div>}
      </div>
    )
  return (
    <PrintPage {...frame(props)} footer={footer} title={title}>
      <div data-slot="print-finding" className="flex flex-col gap-6">
        {props.letterhead !== undefined && (
          <div data-slot="print-letterhead">{props.letterhead}</div>
        )}
        <PrintTitle title={props.title} number={props.number} />
        <section
          aria-label={props.subjectTitle}
          className="flex flex-col gap-2 rounded-md border border-solid border-strong p-3 break-inside-avoid"
        >
          <p className={cn('m-0 text-xs font-semibold text-secondary', TEXT_DIRECTION)}>
            {props.subjectTitle}
          </p>
          <PrintDetails items={props.subject} columns={3} />
        </section>
        {props.details !== undefined && props.details.length > 0 && (
          <PrintDetails items={props.details} columns={3} />
        )}
        {props.sections.map((section) => (
          <PrintSection key={section.key} title={section.title}>
            {section.content}
          </PrintSection>
        ))}
        <Closing issued={props.issued} signatures={props.signatures} seal={props.seal} />
      </div>
    </PrintPage>
  )
}
