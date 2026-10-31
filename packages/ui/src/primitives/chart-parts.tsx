import type { ReactNode } from 'react'
import { TEXT_DIRECTION } from './classes'
import { cn } from './cn'

/*
 * The parts of shadcn/ui's Chart (see chart.tsx) that do not need Recharts: the
 * tooltip's body, the swatch and the legend. Kept apart so `@veljaos/ui/map`'s RegionChart
 * shows the same tooltip and legend without loading Recharts. Re-exported by chart.tsx.
 */

/** One row of the tooltip: ready text. */
export interface ChartTooltipRow {
  key: string
  name: ReactNode
  /** The value as text, formatted from its decimal string. */
  text: string
  color: string
}

export type ChartTooltipIndicator = 'dot' | 'line' | 'dashed' | 'none'

/** A swatch in the series' colour: a square, a short line, or a dashed line. */
export function ChartSwatch({
  color,
  indicator = 'dot',
  className,
}: {
  color: string
  indicator?: Exclude<ChartTooltipIndicator, 'none'>
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block shrink-0',
        indicator === 'dot' && 'size-2.5 rounded-xs',
        indicator === 'line' && 'w-1 self-stretch rounded-full',
        indicator === 'dashed' && 'w-0 self-stretch border-0 border-s-[1.5px] border-dashed',
        className,
      )}
      style={
        indicator === 'dashed' ? { borderColor: color } : ({ backgroundColor: color } as const)
      }
    />
  )
}

/**
 * The tooltip's body: an optional label, a row per series (swatch, name, value at the end, tabular)
 * and an optional total row under a line. In the page's direction.
 */
export function ChartTooltipContent({
  label,
  rows,
  indicator = 'dot',
  total,
  direction,
  className,
}: {
  label?: ReactNode
  rows: readonly ChartTooltipRow[]
  indicator?: ChartTooltipIndicator
  total?: { label: ReactNode; text: string }
  direction: 'ltr' | 'rtl'
  className?: string
}) {
  return (
    <div
      dir={direction}
      className={cn(
        'grid min-w-36 items-start gap-1.5 rounded-md border border-solid border-default bg-surface-overlay px-3 py-2 font-sans text-xs text-primary shadow-md',
        className,
      )}
    >
      {label !== undefined && <div className={cn('font-semibold', TEXT_DIRECTION)}>{label}</div>}
      <div className="grid gap-1.5">
        {rows.map((row) => (
          <div key={row.key} className="flex items-stretch gap-2">
            {indicator !== 'none' && <ChartSwatch color={row.color} indicator={indicator} />}
            <div className="flex flex-1 items-center justify-between gap-4 leading-tight">
              <span className={cn('text-secondary', TEXT_DIRECTION)}>{row.name}</span>
              <bdi className="font-medium text-primary tabular-nums">{row.text}</bdi>
            </div>
          </div>
        ))}
      </div>
      {total !== undefined && (
        <div className="flex items-center justify-between gap-4 border-0 border-t border-solid border-subtle pt-1.5 leading-tight">
          <span className={cn('font-semibold', TEXT_DIRECTION)}>{total.label}</span>
          <bdi className="font-semibold tabular-nums">{total.text}</bdi>
        </div>
      )}
    </div>
  )
}

/** One legend entry. */
export interface ChartLegendItem {
  key: string
  label: ReactNode
  color: string
  /** A short line instead of a square, for line and area series. */
  line?: boolean
}

/**
 * The legend as a list in the page's direction (so its order follows the reading direction),
 * outside the plot, a swatch beside each name.
 */
export function ChartLegendContent({
  items,
  className,
}: {
  items: readonly ChartLegendItem[]
  className?: string
}) {
  if (items.length === 0) return null
  return (
    <ul
      data-slot="chart-legend"
      className={cn(
        'm-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-secondary',
        className,
      )}
    >
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn(
              'inline-block shrink-0',
              item.line === true ? 'h-0.5 w-3 rounded-full' : 'size-2.5 rounded-xs',
            )}
            style={{ backgroundColor: item.color }}
          />
          <span className={TEXT_DIRECTION}>{item.label}</span>
        </li>
      ))}
    </ul>
  )
}
