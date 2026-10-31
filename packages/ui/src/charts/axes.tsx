import { TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'

/*
 * The HTML axes of the charts drawn in our own SVG (CandlestickChart, Heatmap,
 * MatrixChart). Text is HTML beside the plot, so it keeps the page's direction, its font and its
 * wrapping; the plot only draws marks. Each label hangs on a zero-size anchor at its place, so it
 * is centred on it in both directions without measuring.
 */

/**
 * Value ticks beside the plot, at the page's start: each label centred on its y (pixels from the
 * plot's top), aligned toward the plot. An invisible copy of every label gives the column its
 * width.
 */
export function ValueAxisLabels({
  ticks,
  height,
}: {
  ticks: readonly { key: string; text: string; y: number }[]
  height: number
}) {
  return (
    <div aria-hidden="true" className="relative pe-2 text-xs text-tertiary" style={{ height }}>
      <div className="invisible h-0 overflow-hidden">
        {ticks.map((tick) => (
          <div key={tick.key} className="whitespace-nowrap tabular-nums">
            {tick.text}
          </div>
        ))}
      </div>
      {ticks.map((tick) => (
        <div
          key={tick.key}
          className="absolute end-2 flex h-0 items-center"
          style={{ top: tick.y }}
        >
          <bdi className="whitespace-nowrap tabular-nums">{tick.text}</bdi>
        </div>
      ))}
    </div>
  )
}

/**
 * Category labels under the plot, in its left-to-right frame: each centred on its place (`x`,
 * physical pixels), one line.
 */
export function CategoryLabels({
  labels,
  className,
}: {
  labels: readonly { key: string; text: string; x: number }[]
  className?: string
}) {
  return (
    <div aria-hidden="true" className={cn('relative h-5 text-xs text-tertiary', className)}>
      {labels.map((label) => (
        <div
          key={label.key}
          className="absolute top-1 flex w-0 justify-center"
          style={{ insetInlineStart: label.x }}
        >
          <span className={cn('whitespace-nowrap', TEXT_ISOLATE)}>{label.text}</span>
        </div>
      ))}
    </div>
  )
}
