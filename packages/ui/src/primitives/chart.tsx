import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import * as RechartsPrimitive from 'recharts'
import { cn } from './cn'

/*
 * shadcn/ui's Chart (registry style radix-vega, Recharts 3), adapted (P4.7a). Not exported from
 * `@veljaos/ui` (AGENTS.md D10); the Liro charts of `@veljaos/ui/charts` are built on it.
 *
 * What changed from the original:
 * - Colours: a config entry's `color` is a Liro meaning (`var(--liro-chart-main)`, a status
 *   `solid`), set as `--color-<key>` on the container. The tokens switch with the theme, so the
 *   original's per-theme `<style>` block (light / `.dark`) is gone.
 * - The container has a height, not `aspect-video`, and draws the plot only once the page's fonts
 *   are ready (and again when more load): Recharts measures axis labels once, as it draws, and a
 *   fallback font's width stayed (P4.6).
 * - The plot's text is laid out left to right (`[direction:ltr]`): Recharts places text by
 *   physical coordinates and the charts mirror their axes themselves in right-to-left.
 * - Recharts' own colours are replaced by tokens: axis text text.tertiary, grid border.subtle,
 *   the cursor surface.hover / border.strong, a visible focus ring on the focusable surface.
 * - The tooltip and the legend take ready text (decimal strings formatted by the provider, never
 *   `toLocaleString` on a JavaScript number, rule D4), in text tokens; a swatch carries the
 *   colour. The tooltip has a `line` indicator, `dot`, `dashed` or none, and an optional total
 *   row.
 */

/** Each series or slice: its name and its colour (a Liro meaning as a CSS value). */
export type ChartConfig = Record<string, { label?: ReactNode; color?: string }>

const ChartContext = createContext<{ config: ChartConfig } | null>(null)

/** The chart's config, inside a ChartContainer. */
export function useChart(): { config: ChartConfig } {
  const context = useContext(ChartContext)
  if (context === null) throw new Error('useChart must be used within a <ChartContainer />')
  return context
}

/**
 * Bumps when the page's fonts finish loading; null until they are ready (no font API: drawn at
 * once).
 */
export function useFontGeneration(): number | null {
  const [generation, setGeneration] = useState<number | null>(() =>
    typeof document === 'undefined' || !('fonts' in document) || document.fonts.status === 'loaded'
      ? 0
      : null,
  )
  useEffect(() => {
    if (!('fonts' in document)) return
    const fonts = document.fonts
    let cancelled = false
    const bump = () => {
      if (!cancelled) setGeneration((current) => (current ?? 0) + 1)
    }
    void fonts.ready.then(bump)
    fonts.addEventListener('loadingdone', bump)
    return () => {
      cancelled = true
      fonts.removeEventListener('loadingdone', bump)
    }
  }, [])
  return generation
}

const RECHARTS_TOKENS = [
  // Axis text, grid and reference lines in tokens.
  '[&_.recharts-cartesian-axis-tick_text]:fill-[var(--liro-text-tertiary)]',
  '[&_.recharts-polar-angle-axis-tick_text]:fill-[var(--liro-text-secondary)]',
  '[&_.recharts-polar-radius-axis-tick_text]:fill-[var(--liro-text-tertiary)]',
  '[&_.recharts-cartesian-grid_line]:stroke-[var(--liro-border-subtle)]',
  '[&_.recharts-polar-grid_[stroke]]:stroke-[var(--liro-border-default)]',
  '[&_.recharts-reference-line_line]:stroke-[var(--liro-border-strong)]',
  // The cursor under the pointer or the keyboard.
  '[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-[var(--liro-surface-hover)]',
  '[&_.recharts-curve.recharts-tooltip-cursor]:stroke-[var(--liro-border-strong)]',
  '[&_.recharts-radial-bar-background-sector]:fill-[var(--liro-surface-sunken)]',
  // Marks need no focus outline of their own; the surface shows the focus ring.
  '[&_.recharts-layer]:outline-none [&_.recharts-sector]:outline-none',
  '[&_.recharts-surface]:rounded-sm [&_.recharts-surface:focus-visible]:outline-2 [&_.recharts-surface:focus-visible]:outline-offset-2 [&_.recharts-surface:focus-visible]:outline-focus [&_.recharts-surface:focus-visible]:outline-solid',
].join(' ')

export interface ChartContainerProps extends Omit<ComponentProps<'div'>, 'children'> {
  config: ChartConfig
  /** The plot's height in pixels. */
  height: number
  children: ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
}

/** The plot: its config's colours as `--color-<key>`, drawn once the fonts are ready. */
export function ChartContainer({
  id,
  className,
  children,
  config,
  height,
  style,
  ...props
}: ChartContainerProps) {
  const uniqueId = useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`
  const generation = useFontGeneration()
  const colours: Record<string, string> = {}
  for (const [key, item] of Object.entries(config)) {
    if (item.color !== undefined) colours[`--color-${key}`] = item.color
  }
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart-plot"
        data-chart={chartId}
        className={cn(
          'flex min-w-0 justify-center text-xs [direction:ltr]',
          RECHARTS_TOKENS,
          className,
        )}
        style={{ ...colours, ...style, height }}
        {...props}
      >
        {generation === null ? null : (
          <RechartsPrimitive.ResponsiveContainer key={generation} width="100%" height={height}>
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        )}
      </div>
    </ChartContext.Provider>
  )
}

export const ChartTooltip = RechartsPrimitive.Tooltip

// The tooltip's body, the swatch and the legend need no Recharts (P5.41: the map's RegionChart
// uses them too).
export {
  ChartLegendContent,
  ChartSwatch,
  ChartTooltipContent,
  type ChartLegendItem,
  type ChartTooltipIndicator,
  type ChartTooltipRow,
} from './chart-parts'
