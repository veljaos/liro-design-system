import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * The plot of a chart whose marks are reached one by one (P5.93 item 44: CandlestickChart,
 * FunnelChart, ScatterChart, Heatmap, SankeyChart, MatrixChart, Treemap): the keyboard, the
 * tooltip and the announcement the Recharts charts get from Recharts' accessibility layer, for
 * marks drawn by Recharts with our own shapes or by our own SVG.
 * - Every mark carries `data-chart-item="<key>"`. The plot finds it under the pointer (one handler
 *   for every mark) and measures it when the keys reach it, so the tooltip stands over the mark
 *   whatever drew it.
 * - The plot is one Tab stop (`role="application"`, named by the chart's title, described by the
 *   keys): the chart's own key function moves between the marks (a sequence, or a grid); each mark
 *   reached shows its tooltip, takes the focus ring round it and is announced once (a polite
 *   status). Escape hides the tooltip; leaving the plot clears it.
 * - The plot's width is measured (`children(width)`), so the marks are laid out in pixels; a
 *   moment at a tiny width (a full-page screenshot) keeps the last layout.
 * - The tooltip stays inside the plot: centred over the mark, below it near the top.
 */

const TOOLTIP_HALF = 112
/** Below this the plot keeps its last width: a page measured at 1px for a moment redraws nothing. */
const MIN_WIDTH = 16

export interface ItemPlotProps {
  /** The plot's accessible name: the chart's title. */
  label: string
  /** The marks' keys in their keyboard order (used for the first key press and Home / End). */
  keys: readonly string[]
  /** Where a key moves from the mark reached (null: none yet); null leaves the key alone. */
  keyTarget: (from: string | null, event: KeyboardEvent) => string | null
  /** A mark's tooltip body (a `ChartTooltipContent`). */
  tooltip: (key: string) => ReactNode
  /** What is announced when the keys reach a mark ("Mon, 14:00: 42"). */
  announce: (key: string) => string
  height: number
  /** The marks, laid out for the measured width (0 until measured). */
  children: (width: number) => ReactNode
  /**
   * What stands under the plot at the same width (a category axis), outside the Tab stop; its
   * frame is left to right, so places are physical (`physicalX`).
   */
  after?: (width: number) => ReactNode
  className?: string
}

interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** The marks' plot: one Tab stop, the keys, the tooltip and the announcement. */
export function ItemPlot(props: ItemPlotProps) {
  const { messages, direction } = useLiro()
  const holder = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<string | null>(null)
  const [reached, setReached] = useState<string | null>(null)
  const [box, setBox] = useState<Box | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const hintId = useId()

  useLayoutEffect(() => {
    const element = holder.current
    if (element === null) return
    const measure = () => {
      const next = element.getBoundingClientRect().width
      if (next >= MIN_WIDTH) setWidth(Math.floor(next))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [])

  const shown = hover ?? reached
  // A key that is no longer drawn (new data) is forgotten.
  const known = shown !== null && props.keys.includes(shown) ? shown : null

  useLayoutEffect(() => {
    const element = holder.current
    if (element === null || known === null) {
      setBox(null)
      return
    }
    const mark = [...element.querySelectorAll('[data-chart-item]')].find(
      (each) => each.getAttribute('data-chart-item') === known,
    )
    if (mark === undefined) {
      setBox(null)
      return
    }
    const outer = element.getBoundingClientRect()
    // A mark may carry a wider hit area; its drawn part (`data-chart-mark`) is what is measured.
    const rect = (mark.querySelector('[data-chart-mark]') ?? mark).getBoundingClientRect()
    setBox({
      x: rect.left - outer.left,
      y: rect.top - outer.top,
      width: rect.width,
      height: rect.height,
    })
  }, [known, width])

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setReached(null)
      setHover(null)
      return
    }
    const next = props.keyTarget(reached, event)
    if (next === null) return
    event.preventDefault()
    setHover(null)
    setReached(next)
    setAnnouncement(props.announce(next))
  }
  const handlers = useRef({ onKeyDown })
  useLayoutEffect(() => {
    handlers.current = { onKeyDown }
  })

  // One Tab stop, named and described, with the keys and the pointer: set on the element itself
  // (as MapCanvas does), since jsx-a11y counts `application` as a non-interactive role.
  useEffect(() => {
    const element = holder.current
    if (element === null) return
    element.setAttribute('role', 'application')
    element.setAttribute('aria-label', props.label)
    element.setAttribute('aria-describedby', hintId)
    element.tabIndex = 0
    const markAt = (event: Event): string | null => {
      const target = event.target instanceof Element ? event.target : null
      return target?.closest('[data-chart-item]')?.getAttribute('data-chart-item') ?? null
    }
    const keyDown = (event: KeyboardEvent) => {
      handlers.current.onKeyDown(event)
    }
    const blur = () => {
      setReached(null)
    }
    const pointer = (event: Event) => {
      setHover(markAt(event))
    }
    const leave = () => {
      setHover(null)
    }
    element.addEventListener('keydown', keyDown)
    element.addEventListener('blur', blur)
    element.addEventListener('pointerover', pointer)
    element.addEventListener('pointerdown', pointer)
    element.addEventListener('pointerleave', leave)
    return () => {
      element.removeEventListener('keydown', keyDown)
      element.removeEventListener('blur', blur)
      element.removeEventListener('pointerover', pointer)
      element.removeEventListener('pointerdown', pointer)
      element.removeEventListener('pointerleave', leave)
    }
  }, [props.label, hintId])

  const tooltip = (() => {
    if (known === null || box === null || width === 0) return null
    const centre = box.x + box.width / 2
    const x =
      width < TOOLTIP_HALF * 2
        ? width / 2
        : Math.min(Math.max(centre, TOOLTIP_HALF), width - TOOLTIP_HALF)
    const below = box.y < 88
    return (
      <div
        data-slot="chart-tooltip"
        className={cn(
          'pointer-events-none absolute z-10 max-w-56 -translate-x-1/2',
          below ? 'translate-y-2' : '-translate-y-[calc(100%+8px)]',
        )}
        // Measured in physical pixels: the plot's frame is left to right in both directions.
        style={{ insetInlineStart: x, top: below ? box.y + box.height : box.y }}
      >
        {props.tooltip(known)}
      </div>
    )
  })()

  return (
    // The frame is left to right (the marks are measured in physical pixels); the tooltip and the
    // hidden texts keep the page's direction.
    <div dir="ltr" className={cn('relative', props.className)} style={{ minHeight: props.height }}>
      <div
        ref={holder}
        className="rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus focus-visible:outline-solid"
        style={{ minHeight: props.height }}
      >
        {width === 0 ? null : props.children(width)}
      </div>
      {width !== 0 && props.after?.(width)}
      {reached !== null && known === reached && box !== null && (
        <div
          aria-hidden="true"
          data-slot="chart-item-focus"
          className="pointer-events-none absolute rounded-xs outline-2 outline-focus outline-solid"
          style={{
            insetInlineStart: box.x - 2,
            top: box.y - 2,
            width: box.width + 4,
            height: box.height + 4,
          }}
        />
      )}
      {tooltip}
      <p id={hintId} dir={direction} className="sr-only">
        {messages['chart.itemKeys']}
      </p>
      <p role="status" dir={direction} className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
