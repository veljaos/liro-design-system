import { useSyncExternalStore } from 'react'
import type { LiroFormat } from '../provider/format'
import { useLiro } from '../provider/liro-provider'
import type { LiroMessages } from '../provider/messages'

/*
 * What every chart of `@veljaos/ui/charts` shares (P4.7a): series and categories, colours, reading
 * a decimal string for drawing, short axis ticks and motion.
 */

/** One series: its key in `values`, its name, and its role in the default palette. */
export interface ChartSeries {
  key: string
  label: string
  /** 'main' (blue, default for the first), 'comparison' (grey, the second) or 'other' (grey). */
  role?: 'main' | 'comparison' | 'other'
  /** A series that means a state takes the tone's colour (profit and loss, overdue). */
  tone?: ChartTone
}

export type ChartTone = 'danger' | 'warning' | 'success' | 'info'

/** One category: a point on the category axis, a slice, a spoke. */
export interface ChartCategory {
  key: string
  /** The label on the axis ("Oct"); also the tooltip's title. */
  label: string
}

/** By series key, then by category key: decimal strings; null (or missing) for none. */
export type ChartValues = Readonly<Record<string, Readonly<Record<string, string | null>>>>

/**
 * 'default': the main series in the brand blue, a comparison in grey, the rest in a darker or
 * lighter grey. 'categorical' (opt in, three or more series): five hues in a fixed order,
 * validated for colour-vision deficiency, never cycled.
 */
export type ChartPalette = 'default' | 'categorical'

/** Loading, empty and error are the chart's own states; null values are gaps. */
export interface ChartStateProps {
  /** Draws a chart-shaped skeleton (no spinner). */
  loading?: boolean
  /** A failed load: the message (default `messages['chart.error']`) and Retry. */
  error?: { message?: string; onRetry: () => void }
  /** What the card shows first: the chart (default) or its values as a table. */
  defaultView?: 'chart' | 'table'
}

const TONE_COLOUR: Record<ChartTone, string> = {
  danger: 'var(--liro-status-danger-solid)',
  warning: 'var(--liro-status-warning-solid)',
  success: 'var(--liro-status-success-solid)',
  info: 'var(--liro-status-info-solid)',
}

/** A tone's mark colour. */
export function toneColour(tone: ChartTone): string {
  return TONE_COLOUR[tone]
}

/** The colour of the categorical palette's nth hue (0-based); past the fifth, the last grey. */
export function categoricalColour(index: number): string {
  return index < 5 ? `var(--liro-chart-category${String(index + 1)})` : 'var(--liro-chart-other)'
}

/** A series' colour: its tone, else its categorical slot, else its role's grey or blue. */
export function seriesColour(
  series: { role?: ChartSeries['role']; tone?: ChartTone },
  index: number,
  palette: ChartPalette,
): string {
  if (series.tone !== undefined) return TONE_COLOUR[series.tone]
  if (palette === 'categorical') return categoricalColour(index)
  const role = series.role ?? (index === 0 ? 'main' : index === 1 ? 'comparison' : 'other')
  return `var(--liro-chart-${role})`
}

/**
 * A decimal string as a number, for drawing only (rule D4: nothing drawn is read back, added or
 * shown); unreadable or missing is null — a gap, never 0.
 */
export function plotValue(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value.trim() === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

/** True when there is nothing to draw: no categories, or no readable value at all. */
export function isEmptyChart(
  categories: readonly ChartCategory[],
  series: readonly { key: string }[],
  values: ChartValues,
): boolean {
  return !categories.some((category) =>
    series.some((each) => plotValue(values[each.key]?.[category.key]) !== null),
  )
}

/** Writes a decimal string as a number or an amount through the provider; "—" when empty. */
export function useFormatValue(currency?: string, decimals?: number) {
  const { format } = useLiro()
  return (value: string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '—'
    const options = decimals === undefined ? {} : { decimals }
    return currency === undefined
      ? format.number(value, options)
      : format.money(value, currency, options)
  }
}

/** A tick's value without the floating-point noise of a division ("1.5", not "1.4999999999"). */
function tickText(value: number): string {
  return String(Number(value.toPrecision(12)))
}

/**
 * An axis tick written short: from 10,000 in thousands, from 1,000,000 in millions, from
 * 1,000,000,000 in billions, with the Core's words (`messages['chart.thousands']` …). A tick is the
 * scale's round step, never a value a person reads as data; values are shown in full in the
 * tooltip and the table.
 */
export function shortTick(
  tick: number,
  format: Pick<LiroFormat, 'number'>,
  messages: Pick<LiroMessages, 'chart.thousands' | 'chart.millions' | 'chart.billions'>,
): string {
  const size = Math.abs(tick)
  if (size >= 1e9) return messages['chart.billions'](format.number(tickText(tick / 1e9)))
  if (size >= 1e6) return messages['chart.millions'](format.number(tickText(tick / 1e6)))
  if (size >= 1e4) return messages['chart.thousands'](format.number(tickText(tick / 1e3)))
  return format.number(tickText(tick))
}

/** A share on a 100% axis (0–1 from the expanded stack), written by the locale: "40%". */
export function percentTick(share: number, format: Pick<LiroFormat, 'percent'>): string {
  return format.percent(tickText(share * 100))
}

function subscribeMotion(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !('matchMedia' in window)) return () => undefined
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  query.addEventListener('change', onChange)
  return () => {
    query.removeEventListener('change', onChange)
  }
}

function motionAllowed(): boolean {
  if (typeof window === 'undefined' || !('matchMedia' in window)) return false
  // Browsers driven by automation (the visual and story tests) never animate, so their pictures
  // do not depend on timing.
  if (navigator.webdriver) return false
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** The marks' entry animation: 300ms, none under reduced motion, in automation or on a server. */
export const CHART_MOTION_MS = 300

/** Whether the charts animate their marks. */
export function useChartMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, motionAllowed, () => false)
}
