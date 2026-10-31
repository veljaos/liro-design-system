import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { FOCUS_RING, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { zoomStep } from './document-frame-protocol'
import { ErrorState } from './empty-state'
import {
  clampPage,
  labelSide,
  regionBox,
  regionPage,
  type PageRegion,
  type ViewerPage,
} from './page-viewer-logic'
import { Skeleton } from './progress'
import { Tooltip } from './popover'

export { clampPage, labelSide, regionBox, regionPage } from './page-viewer-logic'
export type { PageRegion, RegionBox, ViewerPage } from './page-viewer-logic'

/*
 * PageViewer: a document's pages as the images the application made of them
 * (a scan, a photo, a PDF page it rendered), with pages and zoom, and one region highlighted —
 * where a value was read. DocumentFrame shows a viewer from another origin, whose drawing the
 * host can neither see nor mark; here the host draws the pages, so a region given in the page's
 * units can stand over them.
 * - Toolbar (DocumentFrame's: a row above the pages, 8px by 12px, a 1px border.default line under
 *   it): previous and next page (28px compact buttons, the chevrons mirrored in right-to-left),
 *   "Page 1 of 2" (both numbers through `format.number`, announced politely), zoom out, the zoom
 *   through `format.percent`, zoom in (DocumentFrame's steps, 50–300%). 100% fits the page to the
 *   viewer's width; more scrolls the page in both directions.
 * - The pages: one at a time on the sunken surface, 16px around it, a 1px border.default frame
 *   and the xs shadow. A page is paper: it is never mirrored in right-to-left and its regions
 *   stand where the application measured them (from the top-left corner, in the page's units).
 *   The area scrolls on its own and takes the focus, so the keyboard can scroll it.
 * - `highlight`: the region shown, as a marker pen: status.warning.bg multiplied over the page
 *   (the text stays readable through it, as the search's matches) inside a 2px status.warning.fg
 *   frame, and its name on a raised tag above it (below it at the page's top); "Highlighted:
 *   Total, page 1" is announced politely. The page is paper, light in both themes
 *   (`data-liro-theme="light"`), so the marker reads the same on it. A new highlight
 *   turns to its page (reported with `onPageChange`) and is scrolled into view; the first one is
 *   shown without scrolling, so a story's picture never moves.
 * - Loading: a page-shaped skeleton. `error`: an ErrorState with "Try again" (`onRetry`).
 *   `unavailable`: the application's own words and actions in place of the pages (a file locked
 *   with a password). The toolbar waits while any of them is shown.
 * Controlled (`page`, `zoom`) or not (`defaultPage`, `defaultZoom`). It never reads the file.
 */

export interface PageViewerProps {
  /** Names the viewer ("Invoice 2026-1187, Beton Mix d.o.o."). From the application. */
  label: string
  /** The document's pages, in order. */
  pages: readonly ViewerPage[]
  /** The page shown, from 1 (controlled). */
  page?: number
  /** The page shown at first. Default: the highlighted region's page, else 1. */
  defaultPage?: number
  onPageChange?: (page: number) => void
  /** The zoom in percent of the viewer's width (controlled). */
  zoom?: number
  /** The zoom at first. Default 100: the page fits the width. */
  defaultZoom?: number
  onZoomChange?: (zoom: number) => void
  /** Where values were read: rectangles in the pages' units. */
  regions?: readonly PageRegion[]
  /** The region shown, by its id. */
  highlight?: string | null
  /** The pages are being made: a page-shaped skeleton. */
  loading?: boolean
  /** The pages could not be shown: the application's words. */
  error?: ReactNode
  /** "Try again" under the error. */
  onRetry?: () => void
  /** In place of the pages, the application's words and actions (a file locked with a password). */
  unavailable?: ReactNode
  /** Layout classes (the viewer's height, e.g. "h-[32rem]"). Default 480px. */
  className?: string
}

function ToolButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip label={label}>
      <ButtonPrimitive
        family="neutral"
        emphasis="menu"
        shape="compact"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </ButtonPrimitive>
    </Tooltip>
  )
}

/**
 * The pages' area is a region the keyboard can reach and scroll (WCAG 2.1.1, axe
 * scrollable-region-focusable), as WorklistPage's detail pane.
 */
const SCROLL_AREA = { role: 'region', tabIndex: 0 } as const

/** A document's pages with pages and zoom, and the region a value was read from highlighted. */
export function PageViewer(props: PageViewerProps) {
  const { messages, format } = useLiro()
  const regions = props.regions ?? []
  const highlight = props.highlight ?? null
  const count = props.pages.length
  const highlightPage = regionPage(regions, highlight)

  const [innerPage, setInnerPage] = useState(() =>
    clampPage(props.defaultPage ?? highlightPage ?? 1, count),
  )
  // A new highlight turns to its page (adjusted while rendering, as React advises).
  const [seen, setSeen] = useState(highlight)
  if (seen !== highlight) {
    setSeen(highlight)
    if (highlightPage !== null) setInnerPage(clampPage(highlightPage, count))
  }
  const page = clampPage(props.page ?? innerPage, count)
  const [innerZoom, setInnerZoom] = useState(props.defaultZoom ?? 100)
  const zoom = props.zoom ?? innerZoom

  const { onPageChange } = props
  const goTo = (next: number) => {
    const target = clampPage(next, count)
    setInnerPage(target)
    onPageChange?.(target)
  }
  const zoomTo = (next: number | null) => {
    if (next === null) return
    setInnerZoom(next)
    props.onZoomChange?.(next)
  }

  // The application hears of the page a new highlight turned to.
  const reported = useRef(highlight)
  useEffect(() => {
    if (reported.current === highlight) return
    reported.current = highlight
    if (highlightPage !== null) onPageChange?.(clampPage(highlightPage, count))
  }, [highlight, highlightPage, count, onPageChange])

  // A new highlight is brought into view once its page is drawn; the first is not (no scrolling
  // while a picture is taken).
  const mark = useRef<HTMLDivElement>(null)
  const scrolled = useRef(highlight)
  useEffect(() => {
    if (highlight === null) {
      scrolled.current = null
      return
    }
    if (scrolled.current === highlight || mark.current === null) return
    scrolled.current = highlight
    mark.current.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [highlight, page])

  const waiting =
    props.loading === true || props.error !== undefined || props.unavailable !== undefined
  const ready = !waiting && count > 0
  const current = props.pages[page - 1]
  const pageText = messages['frame.page'](
    page,
    format.number(String(page)),
    count,
    format.number(String(count)),
  )
  const region = regions.find((each) => each.id === highlight && each.page === page)
  const box = region === undefined || current === undefined ? null : regionBox(region, current)
  const shownRegion = ready && region !== undefined && box !== null ? region : undefined
  const zoomOut = zoomStep(zoom, 'out')
  const zoomIn = zoomStep(zoom, 'in')
  const zoomText = format.percent(String(zoom))

  return (
    <div
      data-slot="page-viewer"
      className={cn(
        'flex h-120 min-h-0 flex-col overflow-hidden rounded-md border border-solid border-default bg-surface-sunken font-sans',
        props.className,
      )}
    >
      <div
        role="group"
        aria-label={messages['frame.toolbar']}
        className="flex flex-wrap items-center gap-x-4 gap-y-1 border-0 border-b border-solid border-default bg-surface-raised px-3 py-2"
      >
        <div className="flex items-center gap-1">
          <ToolButton
            label={messages['frame.previousPage']}
            disabled={!ready || page <= 1}
            onClick={() => {
              goTo(page - 1)
            }}
          >
            <ChevronLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          </ToolButton>
          <span
            role="status"
            className={cn(
              'min-w-24 text-center text-xs whitespace-nowrap tabular-nums',
              ready ? 'text-primary' : 'text-tertiary',
              TEXT_ISOLATE,
            )}
          >
            {ready && pageText}
          </span>
          <ToolButton
            label={messages['frame.nextPage']}
            disabled={!ready || page >= count}
            onClick={() => {
              goTo(page + 1)
            }}
          >
            <ChevronRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          </ToolButton>
        </div>
        <div className="flex items-center gap-1">
          <ToolButton
            label={messages['frame.zoomOut']}
            disabled={!ready || zoomOut === null}
            onClick={() => {
              zoomTo(zoomOut)
            }}
          >
            <ZoomOut aria-hidden="true" className="size-4" />
          </ToolButton>
          <span
            className={cn(
              'min-w-12 text-center text-xs whitespace-nowrap tabular-nums',
              ready ? 'text-primary' : 'text-tertiary',
              TEXT_ISOLATE,
            )}
          >
            {ready && (
              <>
                <span className="sr-only">{messages['frame.zoom'](zoomText)}</span>
                <span aria-hidden="true">{zoomText}</span>
              </>
            )}
          </span>
          <ToolButton
            label={messages['frame.zoomIn']}
            disabled={!ready || zoomIn === null}
            onClick={() => {
              zoomTo(zoomIn)
            }}
          >
            <ZoomIn aria-hidden="true" className="size-4" />
          </ToolButton>
        </div>
      </div>
      <p role="status" className="sr-only">
        {shownRegion?.label === undefined
          ? ''
          : messages['viewer.highlighted'](shownRegion.label, pageText)}
      </p>
      {props.loading === true ? (
        <div
          data-slot="page-viewer-loading"
          aria-busy="true"
          className="flex min-h-0 flex-1 justify-center overflow-hidden p-4"
        >
          <span className="sr-only">{messages['frame.loading']}</span>
          <div className="flex w-full max-w-120 flex-col gap-3 rounded-sm bg-surface-raised p-8">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ) : props.error !== undefined ? (
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
          <ErrorState
            compact
            title={messages['frame.error']}
            description={props.error}
            {...(props.onRetry === undefined
              ? {}
              : { action: { label: messages['frame.retry'], onClick: props.onRetry } })}
          />
        </div>
      ) : props.unavailable !== undefined ? (
        <div
          data-slot="page-viewer-unavailable"
          className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6"
        >
          {props.unavailable}
        </div>
      ) : (
        // The page is paper: drawn left to right in every direction, its regions where they were
        // measured. The area scrolls in both directions above 100%.
        <div
          dir="ltr"
          aria-label={props.label}
          {...SCROLL_AREA}
          data-slot="page-viewer-pages"
          className={cn('min-h-0 flex-1 overflow-auto p-4', FOCUS_RING)}
        >
          {current !== undefined && (
            <div
              data-slot="page-viewer-page"
              data-liro-theme="light"
              className="relative mx-auto box-border border border-solid border-default bg-surface-raised shadow-xs [color-scheme:light]"
              style={{
                width: `${String(zoom)}%`,
                aspectRatio: `${String(current.width)} / ${String(current.height)}`,
              }}
            >
              <img
                src={current.src}
                alt={current.alt ?? pageText}
                draggable={false}
                className="block size-full select-none"
              />
              {shownRegion !== undefined && box !== null && (
                <div
                  ref={mark}
                  data-slot="page-viewer-highlight"
                  className="pointer-events-none absolute"
                  style={{
                    insetInlineStart: box.left,
                    top: box.top,
                    width: box.width,
                    height: box.height,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute -inset-0.5 rounded-xs border-2 border-solid border-status-warning-fg bg-status-warning-bg mix-blend-multiply"
                  />
                  {shownRegion.label !== undefined && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute -start-0.5 rounded-xs border border-solid border-default bg-surface-raised px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-primary shadow-xs',
                        labelSide(shownRegion, current) === 'above'
                          ? 'bottom-full mb-1'
                          : 'top-full mt-1',
                        TEXT_ISOLATE,
                      )}
                    >
                      {shownRegion.label}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
