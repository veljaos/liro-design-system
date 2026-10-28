import type { ReactNode } from 'react'
import { usePhone } from '../components/use-phone'
import { TEXT_DIRECTION } from '../primitives/classes'
import { ChartTooltipContent } from '../primitives/chart-parts'
import { useLiro } from '../provider/liro-provider'
import { CategoryLabels, ValueAxisLabels } from './axes'
import { equalTicks } from './cartesian'
import { ChartCard, ValuesTable } from './frame'
import { ItemPlot } from './item-plot'
import {
  candleDomain,
  candleDrawable,
  candleShapes,
  linearScale,
  niceTicks,
  physicalX,
  sequenceKeyTarget,
} from './plot-logic'
import { shortTick, useFormatValue, type ChartStateProps } from './shared'

/*
 * CandlestickChart (P5.93 item 44, owner: "exchange rate OHLC"): a price per period — open, high,
 * low, close — as candles, drawn in our own SVG (Recharts has no candlestick).
 * - One meaning, the main blue; the direction is the shape, never colour alone: a rising candle
 *   (the close at or above the open, compared exactly as decimal strings) is hollow, a falling one
 *   filled, and the legend says which is which. A rise is not good or bad here (a rate), so no
 *   green or red.
 * - The wick runs from the low to the high, the body from the open to the close (at least 1px);
 *   bodies are 60% of their band, at most 16px. A period missing a price is a gap, never 0.
 * - Time runs from the page's start (from the right in right-to-left); the value axis stands at
 *   the start, its round ticks written short (`shortTick`), the prices themselves in full in the
 *   tooltip and the table.
 * - Keys: the plot is one Tab stop; the arrows move between the candles with the screen and show
 *   the tooltip (open, high, low, close), announced once.
 */

/** One period's prices, as decimal strings. */
export interface Candle {
  key: string
  /** The period on the axis and in the tooltip ("06.10."). */
  label: string
  open: string | null
  high: string | null
  low: string | null
  close: string | null
}

export interface CandlestickChartProps extends ChartStateProps {
  title: string
  description?: string
  candles: readonly Candle[]
  /** Prices are amounts in this currency (written by `format.money`). */
  currency?: string
  decimals?: number
  /** The plot's height in pixels. Default 240 (200 on phones). */
  height?: number
  /** The legend that says which candles rose. Default true. */
  legend?: boolean
  controls?: ReactNode
  /** Default: from the viewport (below 48em 'phone'). */
  layout?: 'desktop' | 'phone'
  className?: string
}

const TOP = 8
const BOTTOM = 4

/** Prices over time as candles: open, high, low and close of each period. */
export function CandlestickChart(props: CandlestickChartProps) {
  const { direction, format, messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const write = useFormatValue(props.currency, props.decimals)
  const height = props.height ?? (phone ? 200 : 240)
  const inner = height - TOP - BOTTOM

  const range = candleDomain(props.candles)
  const ticks = range === null ? [] : niceTicks(range[0], range[1], phone ? 4 : 5)
  const domain: [number, number] = [ticks[0] ?? 0, ticks[ticks.length - 1] ?? 1]
  const y = linearScale(domain, [TOP + inner, TOP])
  const byKey = new Map(props.candles.map((candle) => [candle.key, candle]))

  const priceRows = (candle: Candle) => [
    { key: 'open', name: messages['chart.open'], text: write(candle.open), color: '' },
    { key: 'high', name: messages['chart.high'], text: write(candle.high), color: '' },
    { key: 'low', name: messages['chart.low'], text: write(candle.low), color: '' },
    { key: 'close', name: messages['chart.close'], text: write(candle.close), color: '' },
  ]

  const swatch = (rising: boolean) => (
    <span
      aria-hidden="true"
      className="inline-block size-2.5 shrink-0 rounded-xs border-[1.5px] border-solid"
      style={{
        borderColor: 'var(--liro-chart-main)',
        backgroundColor: rising ? 'var(--liro-surface-raised)' : 'var(--liro-chart-main)',
      }}
    />
  )
  const legend =
    props.legend === false ? undefined : (
      <ul
        data-slot="chart-legend"
        className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-secondary"
      >
        <li className="flex items-center gap-1.5">
          {swatch(true)}
          <span className={TEXT_DIRECTION}>{messages['chart.rising']}</span>
        </li>
        <li className="flex items-center gap-1.5">
          {swatch(false)}
          <span className={TEXT_DIRECTION}>{messages['chart.falling']}</span>
        </li>
      </ul>
    )

  const table = (
    <ValuesTable
      title={props.title}
      categories={props.candles}
      series={[
        { key: 'open', label: messages['chart.open'] },
        { key: 'high', label: messages['chart.high'] },
        { key: 'low', label: messages['chart.low'] },
        { key: 'close', label: messages['chart.close'] },
      ]}
      values={{
        open: Object.fromEntries(props.candles.map((each) => [each.key, each.open])),
        high: Object.fromEntries(props.candles.map((each) => [each.key, each.high])),
        low: Object.fromEntries(props.candles.map((each) => [each.key, each.low])),
        close: Object.fromEntries(props.candles.map((each) => [each.key, each.close])),
      }}
      write={write}
    />
  )

  const tickLabels = ticks.map((tick) => ({
    key: String(tick),
    text: shortTick(tick, format, messages),
    y: y(tick),
  }))
  const labelled = new Set(equalTicks(props.candles, phone ? 4 : 8).map((each) => each.key))
  // The keys follow the drawn candles: a period without its prices is skipped.
  const drawnKeys = props.candles.filter(candleDrawable).map((candle) => candle.key)

  const plot = (
    <div className="grid grid-cols-[auto_minmax(0,1fr)]">
      <ValueAxisLabels ticks={tickLabels} height={height} />
      <ItemPlot
        label={props.title}
        keys={drawnKeys}
        height={height}
        keyTarget={(from, event) => {
          const index = from === null ? -1 : drawnKeys.indexOf(from)
          const next = sequenceKeyTarget(index, event.key, drawnKeys.length, direction)
          return next === null ? null : (drawnKeys[next] ?? null)
        }}
        tooltip={(key) => {
          const candle = byKey.get(key)
          if (candle === undefined) return null
          return (
            <ChartTooltipContent
              direction={direction}
              indicator="none"
              label={candle.label}
              rows={priceRows(candle)}
            />
          )
        }}
        announce={(key) => {
          const candle = byKey.get(key)
          if (candle === undefined) return ''
          const prices = priceRows(candle)
            .map((row) => `${row.name} ${row.text}`)
            .join(', ')
          return `${candle.label}: ${prices}`
        }}
        after={(width) => {
          const band = props.candles.length === 0 ? 0 : width / props.candles.length
          return (
            <CategoryLabels
              labels={props.candles.flatMap((candle, index) =>
                labelled.has(candle.key)
                  ? [
                      {
                        key: candle.key,
                        text: candle.label,
                        x: physicalX(band * (index + 0.5), 0, width, direction),
                      },
                    ]
                  : [],
              )}
            />
          )
        }}
      >
        {(width) => {
          const shapes = candleShapes(props.candles, width, inner, domain)
          const band = props.candles.length === 0 ? 0 : width / props.candles.length
          return (
            <svg aria-hidden="true" width={width} height={height} className="block">
              {ticks.map((tick) => (
                <line
                  key={tick}
                  x1={0}
                  x2={width}
                  y1={y(tick)}
                  y2={y(tick)}
                  strokeWidth={1}
                  style={{ stroke: 'var(--liro-border-subtle)' }}
                />
              ))}
              <g transform={`translate(0 ${String(TOP)})`}>
                {shapes.map((shape) => {
                  const centre = physicalX(shape.centre, 0, width, direction)
                  const left = centre - shape.bodyWidth / 2
                  // A rising body is hollow: its 1.5px line drawn inside its box.
                  const inset = shape.rising ? 0.75 : 0
                  return (
                    <g key={shape.key} data-chart-item={shape.key}>
                      <rect
                        x={centre - band / 2}
                        y={0}
                        width={band}
                        height={inner}
                        fill="none"
                        pointerEvents="all"
                      />
                      <g data-chart-mark="">
                        <line
                          x1={centre}
                          x2={centre}
                          y1={shape.wickTop}
                          y2={shape.wickBottom}
                          strokeWidth={1}
                          style={{ stroke: 'var(--liro-chart-main)' }}
                        />
                        <rect
                          x={left + inset}
                          y={shape.bodyTop + inset}
                          width={Math.max(shape.bodyWidth - inset * 2, 1)}
                          height={Math.max(shape.bodyHeight - inset * 2, 1)}
                          strokeWidth={shape.rising ? 1.5 : 0}
                          style={{
                            fill: shape.rising
                              ? 'var(--liro-surface-raised)'
                              : 'var(--liro-chart-main)',
                            stroke: 'var(--liro-chart-main)',
                          }}
                        />
                      </g>
                    </g>
                  )
                })}
              </g>
              <line
                x1={0}
                x2={width}
                y1={height - BOTTOM}
                y2={height - BOTTOM}
                strokeWidth={1}
                style={{ stroke: 'var(--liro-border-default)' }}
              />
            </svg>
          )
        }}
      </ItemPlot>
    </div>
  )

  return (
    <ChartCard
      title={props.title}
      {...(props.description === undefined ? {} : { description: props.description })}
      {...(props.controls === undefined ? {} : { controls: props.controls })}
      {...(props.className === undefined ? {} : { className: props.className })}
      {...(props.loading === undefined ? {} : { loading: props.loading })}
      {...(props.defaultView === undefined ? {} : { defaultView: props.defaultView })}
      {...(props.error === undefined ? {} : { error: props.error })}
      empty={range === null}
      skeleton="columns"
      height={height}
      phone={phone}
      legend={legend}
      table={table}
    >
      {plot}
    </ChartCard>
  )
}
