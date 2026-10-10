import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import {
  fitZoom,
  pageName,
  pageNumberContent,
  pageRules,
  resolvedMargins,
  sheetSize,
  type PrintMargins,
  type PrintOrientation,
} from './print-logic'

/*
 * PrintPage (BUILD-PLAN P5.15): the frame of every printed page — an A4 sheet with its margins, a
 * header and a footer on every printed page, the page number, and no application chrome. The
 * print templates (PrintDocument, PrintCertificate, PrintGradeReport, PrintFinding) are built on
 * it; an application may put any content in it.
 *
 * - **Paper is always light** (decided): the sheet carries `data-liro-theme="light"` and
 *   `color-scheme: light`, so the tokens resolve to the light meanings whatever the screen's
 *   theme; on screen the sheet stands on surface.sunken in the screen's theme. Colours only from
 *   the tokens; tones as text and borders, never as filled backgrounds (browsers leave
 *   backgrounds out of a printout by default).
 * - **On screen** the sheet is A4 (210 × 297mm, or 297 × 210mm in landscape) with the margins as
 *   its padding, so the screen shows what the paper will. On a narrow screen `fit="width"` (the
 *   default) scales the whole sheet down to the width (CSS zoom, never enlarged); `fit="none"`
 *   keeps it at 100% in a region that scrolls sideways. The page itself never overflows.
 * - **Printed** (CSS paged media; what Chrome supports is recorded in docs/decisions.md):
 *   an `@page` rule of its own (a named page, so two PrintPages never share one) with the size,
 *   orientation and margins; the page number in the bottom margin box at the end side, its words
 *   from `messages['print.pageNumber']` around `counter(page)` and `counter(pages)`. The frame is
 *   a presentational <table>: its <thead> (the header) repeats at the top of every page; the
 *   footer stands fixed at the bottom of every page (fixed elements repeat), and an invisible
 *   copy in the <tfoot> keeps the room for it, so content never runs under it. The ancestors of
 *   a PrintPage lose their minimum height on paper (styles.css), so a full-height wrapper of the
 *   application never adds an empty page.
 * - **Breaks** (styles.css, inside the sheet): no break inside a table row, a list item or an
 *   element marked `data-print-keep`; none right after a heading or a caption; at least three
 *   lines of a paragraph on each side of a break; a table's header row repeats on every page.
 * - **Status markers from props:** a draft prints "Draft" at the top of the first page and
 *   across every page; a cancelled document prints the cancellation (who, when, why, the
 *   cancellation document, as CancellationBanner on screen) at the top and "Cancelled" across
 *   every page.
 */

/** A printed document's state: a draft, or cancelled (who, when, why). */
export type PrintStatus =
  | {
      kind: 'draft'
      /** A line under "Draft", from the application ("Not valid as a tax document"). */
      note?: string
    }
  | {
      kind: 'cancelled'
      /** Who cancelled it. */
      by: string
      /** When: an ISO instant in the tenant's offset ("2026-10-06T11:20:00+02:00"). */
      at: string
      /** The reason given when it was cancelled. */
      reason: string
      /** The cancellation document ("Cancellation document", "ST-2026-0004"). */
      document?: { kind: string; number: string }
    }

/** What every print template passes to its PrintPage. */
export interface PrintFrameProps {
  /** Default 'portrait' (PrintCertificate: 'landscape'). */
  orientation?: PrintOrientation
  /** CSS lengths; default 16mm top, 20mm bottom, 18mm at the sides. */
  margins?: PrintMargins
  /** Repeated at the top of every printed page (the issuer and the document's number). */
  header?: ReactNode
  /** Repeated at the bottom of every printed page (contact lines, a confidentiality note). */
  footer?: ReactNode
  /** The page number in the bottom margin of every printed page. Default true. */
  pageNumbers?: boolean
  /** A draft or a cancelled document: its marker on the first page and across every page. */
  status?: PrintStatus
  /**
   * On a narrow screen: 'width' (default) scales the sheet down to fit; 'none' keeps it at 100%
   * in a region that scrolls sideways. No effect on paper.
   */
  fit?: 'width' | 'none'
}

export interface PrintPageProps extends PrintFrameProps {
  /** Names the sheet ("Invoice F-2026-0419"), from the application. */
  title: string
  children: ReactNode
}

/** The header and footer slots' look; the footer's invisible copy takes exactly the same room. */
const HEADER_CLASS =
  'mb-6 border-0 border-b border-solid border-default pb-2 text-xs text-secondary'
const FOOTER_CLASS = 'border-0 border-t border-solid border-default pt-2 text-xs text-secondary'

function StatusMarker({ status }: { status: PrintStatus }) {
  const { messages, format } = useLiro()
  if (status.kind === 'draft') {
    return (
      <div
        data-slot="print-status"
        data-status="draft"
        className="mb-6 rounded-md border-2 border-solid border-strong px-4 py-3 break-inside-avoid"
      >
        <p className="m-0 text-md font-semibold text-primary">{messages['print.draft']}</p>
        {status.note !== undefined && (
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{status.note}</p>
        )}
      </div>
    )
  }
  const date = /^\d{4}-\d{2}-\d{2}/.exec(status.at)?.[0] ?? status.at
  return (
    <div
      data-slot="print-status"
      data-status="cancelled"
      className="mb-6 rounded-md border-2 border-solid border-status-danger-fg px-4 py-3 break-inside-avoid"
    >
      <p className="m-0 text-md font-semibold text-status-danger-fg">
        {messages['document.cancelledTitle']}
      </p>
      <p className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>
        {messages['document.cancelledBy'](status.by, format.date(date), format.time(status.at))}{' '}
        {messages['document.cancelReason'](status.reason)}
        {status.document !== undefined && (
          <>
            {' '}
            {status.document.kind} <span dir="ltr">{status.document.number}</span>
          </>
        )}
      </p>
    </div>
  )
}

/**
 * The word across the page (a draft, a cancelled document): drawn as generated content of a
 * hidden element, so it is a picture for the eye only; the marker at the top says it in words.
 * On screen across the first page; printed, fixed, so across every page.
 */
function Watermark({ status }: { status: PrintStatus }) {
  const { messages, direction } = useLiro()
  const word =
    status.kind === 'draft' ? messages['print.draft'] : messages['document.cancelledTitle']
  return (
    <div
      aria-hidden="true"
      data-slot="print-watermark"
      data-text={word}
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 flex h-(--liro-print-height) items-center justify-center overflow-hidden print:fixed print:inset-0 print:h-auto',
        'before:block before:text-h1 before:font-bold before:whitespace-nowrap before:content-[attr(data-text)]',
        direction === 'rtl'
          ? 'before:[transform:rotate(30deg)_scale(3.5)]'
          : 'before:[transform:rotate(-30deg)_scale(3.5)]',
        status.kind === 'draft'
          ? 'before:[color:var(--liro-border-default)]'
          : 'before:[color:var(--liro-status-danger-border)]',
      )}
    />
  )
}

/**
 * An A4 sheet: on screen on surface.sunken, printed with its own page size, margins, header and
 * footer on every page, and the page number. Its content comes from the application or a print
 * template.
 */
export function PrintPage(props: PrintPageProps) {
  const { messages, direction } = useLiro()
  const orientation = props.orientation ?? 'portrait'
  const margins = resolvedMargins(props.margins)
  const size = sheetSize(orientation)
  const name = pageName(useId())
  const fit = props.fit ?? 'width'
  const backdrop = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)

  useLayoutEffect(() => {
    const element = backdrop.current
    if (fit !== 'width' || element === null) return
    const measure = () => {
      const style = getComputedStyle(element)
      const padding = parseFloat(style.paddingInlineStart) + parseFloat(style.paddingInlineEnd)
      setZoom(fitZoom(element.clientWidth - padding, orientation))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [fit, orientation])

  const rules = pageRules({
    name,
    orientation,
    margins,
    direction,
    pageNumber:
      props.pageNumbers === false ? null : pageNumberContent(messages['print.pageNumber']),
  })
  const sheetStyle = {
    '--liro-print-page': name,
    '--liro-print-width': `${String(size.width)}mm`,
    '--liro-print-height': `${String(size.height)}mm`,
    '--liro-print-area': `calc(${String(size.height)}mm - ${margins.top} - ${margins.bottom} - 1mm)`,
    '--liro-print-zoom': fit === 'width' ? String(zoom) : '1',
    paddingBlockStart: margins.top,
    paddingBlockEnd: margins.bottom,
    paddingInlineStart: margins.start,
    paddingInlineEnd: margins.end,
  } as CSSProperties
  const hasFooter = props.footer !== undefined && props.footer !== null

  return (
    <div
      ref={backdrop}
      data-slot="print-page"
      data-fit={fit}
      // fit="none": a region that scrolls sideways, focusable so the keyboard can scroll it.
      {...(fit === 'none' ? { role: 'region', 'aria-label': props.title } : {})}
      tabIndex={fit === 'none' ? 0 : undefined}
      className={cn(
        'box-border flex w-full min-w-0 bg-surface-sunken px-4 py-6 font-sans sm:px-6',
        fit === 'none'
          ? cn('justify-start overflow-x-auto', FOCUS_RING, '-outline-offset-2')
          : 'justify-center overflow-hidden',
        'print:block print:overflow-visible print:bg-transparent print:p-0',
      )}
    >
      <style>{rules}</style>
      <article
        data-slot="print-sheet"
        data-print-page={name}
        data-orientation={orientation}
        data-liro-theme="light"
        aria-label={props.title}
        style={sheetStyle}
        className={cn(
          'relative box-border flex min-h-(--liro-print-height) w-(--liro-print-width) shrink-0 flex-col bg-surface-raised text-primary shadow-sm [color-scheme:light] [page:var(--liro-print-page)] [zoom:var(--liro-print-zoom)]',
          'print:min-h-0 print:w-auto print:p-0! print:shadow-none print:[zoom:1]',
        )}
      >
        {props.status !== undefined && <Watermark status={props.status} />}
        {/* A real table: Chrome repeats only <thead> and <tfoot> on every printed page (elements
            with display: table-header-group do not repeat). Presentational: no table semantics. */}
        <table
          role="presentation"
          data-slot="print-frame"
          className="relative flex flex-1 flex-col border-collapse print:table print:w-full"
        >
          {props.header !== undefined && props.header !== null && (
            <thead data-slot="print-header" className="block print:table-header-group">
              <tr data-slot="print-frame-row" className="block print:table-row">
                <td className="block p-0 print:table-cell">
                  <div className={cn(HEADER_CLASS, TEXT_DIRECTION)}>{props.header}</div>
                </td>
              </tr>
            </thead>
          )}
          <tbody data-slot="print-body" className="flex flex-1 flex-col print:table-row-group">
            <tr data-slot="print-frame-row" className="flex flex-1 flex-col print:table-row">
              <td className="flex flex-1 flex-col p-0 align-top print:table-cell">
                {props.status !== undefined && <StatusMarker status={props.status} />}
                {props.children}
              </td>
            </tr>
          </tbody>
          {hasFooter && (
            <tfoot aria-hidden="true" className="hidden print:table-footer-group">
              <tr data-slot="print-frame-row">
                <td className="p-0">
                  <div className="invisible pt-6">
                    <div className={FOOTER_CLASS}>{props.footer}</div>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        {hasFooter && (
          <footer
            data-slot="print-footer"
            className="relative mt-auto pt-6 print:fixed print:inset-x-0 print:bottom-0 print:pt-0"
          >
            <div className={cn(FOOTER_CLASS, TEXT_DIRECTION)}>{props.footer}</div>
          </footer>
        )}
      </article>
    </div>
  )
}
