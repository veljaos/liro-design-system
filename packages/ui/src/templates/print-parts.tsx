import type { ReactNode } from 'react'
import { LINE_TYPE_TEXT, spansRow, type LineType } from '../components/line-types'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * The parts of the print templates (P5.15), exported so an application can compose a printout of
 * its own inside PrintPage: a title, label–value details, a table whose header repeats on every
 * page, a titled section, the place and date, and the signatures. Paper conventions: compact
 * 13px text, labels xs text.secondary, lines instead of filled backgrounds, nothing interactive.
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
  className?: string
}

const COLUMNS = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' } as const

/** Labels above their values in a grid of 1–3 columns (a person's or a document's details). */
export function PrintDetails({ items, columns = 2, className }: PrintDetailsProps) {
  return (
    <dl
      data-slot="print-details"
      className={cn('m-0 grid gap-x-6 gap-y-2', COLUMNS[columns], className)}
    >
      {items.map((item, index) => (
        <div key={item.key ?? index} className="flex min-w-0 flex-col break-inside-avoid">
          <dt className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{item.label}</dt>
          <dd
            className={cn(
              'm-0 text-sm text-primary',
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
 * between pages, lines between rows instead of stripes. Line types read by typography (P5.18): a
 * heading bold across the row, a text line small and secondary, a subtotal semibold under a rule.
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
                'border-0 border-b border-solid border-strong px-2 py-1.5 align-bottom text-xs font-semibold text-secondary first:ps-0 last:pe-0',
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
              ? 'border-0 border-t border-b border-solid border-t-strong border-b-default'
              : 'border-0 border-b border-solid border-default'
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

/** A titled part of a printout: the title (15px semibold, a line under it), then its content. */
export function PrintSection({ title, headingLevel = 2, children }: PrintSectionProps) {
  const Heading = `h${String(headingLevel)}` as 'h2'
  return (
    <section data-slot="print-section" className="flex flex-col gap-2">
      <Heading
        className={cn(
          'm-0 border-0 border-b border-solid border-default pb-1 text-md font-semibold text-primary',
          TEXT_DIRECTION,
        )}
      >
        {title}
      </Heading>
      <div className={cn('flex flex-col gap-2 text-sm text-primary', TEXT_DIRECTION)}>
        {children}
      </div>
    </section>
  )
}

/** One signature on paper. */
export interface PrintSignature {
  key: string
  /** Whose signature it is ("Class teacher", "Issued by"). */
  label: string
  /** The person's name, under the line. */
  name?: string
  /** A line under the name ("Specialist in occupational medicine"). */
  detail?: string
  /** A signature image or a facsimile, from the application, standing on the line. */
  image?: ReactNode
}

export interface PrintSignaturesProps {
  signatures: readonly PrintSignature[]
  /** The place of a seal (an image from the application, D18), between the signatures. */
  seal?: ReactNode
  className?: string
}

/**
 * Signature lines: each with whose signature it is, room to sign on a line, the name and a detail
 * under it. One signature stands at the end; several spread across the width, a seal between
 * them. Never split between pages.
 */
export function PrintSignatures({ signatures, seal, className }: PrintSignaturesProps) {
  const hasSeal = seal !== undefined && seal !== null
  const blocks = signatures.map((signature) => (
    <div key={signature.key} data-slot="print-signature" className="flex w-56 flex-col gap-0.5">
      <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{signature.label}</span>
      <div className="flex h-16 items-end justify-center border-0 border-b border-solid border-strong">
        {signature.image}
      </div>
      {signature.name !== undefined && (
        <span className={cn('pt-1 text-sm font-medium text-primary', TEXT_DIRECTION)}>
          {signature.name}
        </span>
      )}
      {signature.detail !== undefined && (
        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{signature.detail}</span>
      )}
    </div>
  ))
  const middle = Math.ceil(blocks.length / 2)
  return (
    <div
      data-slot="print-signatures"
      data-print-keep=""
      className={cn(
        'flex flex-wrap items-end gap-x-12 gap-y-8 break-inside-avoid',
        blocks.length === 1 && !hasSeal ? 'justify-end' : 'justify-between',
        className,
      )}
    >
      {blocks.slice(0, middle)}
      {hasSeal && (
        <div data-slot="print-seal" className="flex size-28 items-center justify-center">
          {seal}
        </div>
      )}
      {blocks.slice(middle)}
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

/** A printout's title (h1) with its number and a line under it (the period, the subject). */
export function PrintTitle({
  title,
  number,
  subtitle,
}: {
  title: string
  number?: string | undefined
  subtitle?: string | undefined
}) {
  return (
    <div data-slot="print-title" className="flex flex-col gap-1">
      <h1 className={cn('m-0 text-h3 text-primary', TEXT_DIRECTION)}>
        {title}
        {number !== undefined && (
          <>
            {' '}
            <span dir="ltr" className="font-semibold whitespace-nowrap">
              {number}
            </span>
          </>
        )}
      </h1>
      {subtitle !== undefined && (
        <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{subtitle}</p>
      )}
    </div>
  )
}
