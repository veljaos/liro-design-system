import type { ReactNode } from 'react'
import {
  CartesianGrid,
  Scatter,
  ScatterChart as ScatterRoot,
  XAxis,
  YAxis,
  type ScatterShapeProps,
} from 'recharts'
import { usePhone } from '../components/use-phone'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
  type ChartConfig,
} from '../primitives/chart'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { ChartCard } from './frame'
import { ItemPlot } from './item-plot'
import { niceTicks, scatterOrder, scatterRadius, sequenceKeyTarget } from './plot-logic'
import {
  CHART_MOTION_MS,
  plotValue,
  seriesColour,
  shortTick,
  useChartMotion,
  type ChartPalette,
  type ChartStateProps,
  type ChartTone,
} from './shared'

/*
 * ScatterChart (P5.93 item 44, owner: "price vs margin, optional bubble size"): items placed by two
 * values, optionally sized by a third, on Recharts' Scatter with our own shapes.
 * - Colour as every chart: one series in the main blue, a second grey; three or more groups only
 *   with `palette="categorical"`, named in the legend. Points are a 75% fill with a 1px line of the
 *   card, so overlapping points stay readable. A bubble's area follows its size value (drawing
 *   only, D4; 4–20px).
 * - Each axis is named (`x`, `y`, `size`: the label and how its values are written — an amount, a
 *   percentage or a number). Ticks are the scale's round steps written short; the values
 *   themselves are written in full in the tooltip and the table.
 * - Right-to-left: the x axis runs from the right, the value axis stands at the right.
 * - Keys: the plot is one Tab stop; the arrows walk the points by their x (then y), with the
 *   screen, show the tooltip and announce the point.
 */

/** How an axis' values are written. */
export interface ScatterAxis {
  /** The axis' name ("Price", "Margin"): beside the axis, in the tooltip and the table. */
  label: string
  /** Values are amounts in this currency. */
  currency?: string
  /** Values are percentages ("38.2" is 38,2%). */
  percent?: boolean
  decimals?: number
}

/** One item: its two values, and its size for a bubble. */
export interface ScatterPoint {
  key: string
  label: string
  /** Decimal strings; a point missing x or y is not drawn (the table lists it). */
  x: string | null
  y: string | null
  size?: string | null
}

/** A group of points with its colour's role. */
export interface ScatterSeries {
  key: string
  label: string
  role?: 'main' | 'comparison' | 'other'
  tone?: ChartTone
  points: readonly ScatterPoint[]
}

export interface ScatterChartProps extends ChartStateProps {
  title: string
  description?: string
  series: readonly ScatterSeries[]
  x: ScatterAxis
  y: ScatterAxis
  /** With it the points are bubbles, sized by each point's `size`. */
  size?: ScatterAxis
  /** Default 'default': blue and greys. 'categorical' for three or more groups. */
  palette?: ChartPalette
  /** Default: shown for two or more groups, and always with the categorical palette. */
  legend?: boolean
  /** The plot's height in pixels. Default 280 (240 on phones). */
  height?: number
  controls?: ReactNode
  /** The key figures as toggle buttons (a ChartSeriesToggle) at the header's end (P5.93 item 42). */
  toggle?: ReactNode
  layout?: 'desktop' | 'phone'
  className?: string
}

/** Items placed by two values, optionally sized by a third: relationships and outliers. */
export function ScatterChart(props: ScatterChartProps) {
  const { direction, format, messages } = useLiro()
  const rtl = direction === 'rtl'
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const animate = useChartMotion()
  const palette = props.palette ?? 'default'
  const height = props.height ?? (phone ? 240 : 280)

  const writer = (axis: ScatterAxis | undefined) => (value: string | null | undefined) => {
    if (value === null || value === undefined || value === '') return '—'
    const options = axis?.decimals === undefined ? {} : { decimals: axis.decimals }
    if (axis?.percent === true) return format.percent(value, options)
    if (axis?.currency !== undefined) return format.money(value, axis.currency, options)
    return format.number(value, options)
  }
  const writeX = writer(props.x)
  const writeY = writer(props.y)
  const writeSize = writer(props.size)
  const tick = (axis: ScatterAxis) => (value: number) =>
    axis.percent === true
      ? format.percent(String(Number(value.toPrecision(12))))
      : shortTick(value, format, messages)

  const colours = props.series.map((each, index) => seriesColour(each, index, palette))
  const config: ChartConfig = Object.fromEntries(
    props.series.map((each, index) => [
      each.key,
      { label: each.label, color: colours[index] ?? 'currentColor' },
    ]),
  )
  const sizes = props.series.flatMap((each) => each.points.map((point) => plotValue(point.size)))
  const readable = sizes.filter((value) => value !== null)
  const largest = props.size === undefined || readable.length === 0 ? null : Math.max(...readable)

  // Round ticks over the drawn values (drawing only): the scale's steps, never data.
  const axisTicks = (read: (point: ScatterPoint) => string | null, count: number) => {
    const values = props.series
      .flatMap((each) => each.points.map((point) => plotValue(read(point))))
      .filter((value) => value !== null)
    return values.length === 0 ? [] : niceTicks(Math.min(...values), Math.max(...values), count)
  }
  const xTicks = axisTicks((point) => point.x, phone ? 4 : 6)
  const yTicks = axisTicks((point) => point.y, phone ? 4 : 5)
  const domainOf = (ticks: readonly number[]): [number, number] => [
    ticks[0] ?? 0,
    ticks[ticks.length - 1] ?? 1,
  ]

  const order = scatterOrder(props.series)
  const keys = order.map((entry) => entry.id)
  const byId = new Map(order.map((entry) => [entry.id, entry]))
  const many = props.series.length > 1

  const rows = (point: ScatterPoint, colour: string) => [
    { key: 'x', name: props.x.label, text: writeX(point.x), color: colour },
    { key: 'y', name: props.y.label, text: writeY(point.y), color: colour },
    ...(props.size === undefined
      ? []
      : [{ key: 'size', name: props.size.label, text: writeSize(point.size), color: colour }]),
  ]

  const showLegend = props.legend ?? (many || palette === 'categorical')
  const legend = showLegend ? (
    <ChartLegendContent
      items={props.series.map((each, index) => ({
        key: each.key,
        label: each.label,
        color: colours[index] ?? 'currentColor',
      }))}
    />
  ) : undefined

  const head = 'border-0 border-b border-solid border-default px-2 py-1.5 font-semibold'
  const cell = 'border-0 border-b border-solid border-subtle px-2 py-1.5'
  const table = (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-sans text-sm text-primary">
        <caption className="sr-only">{props.title}</caption>
        <thead>
          <tr>
            <th scope="col" className={cn(head, 'text-start')} />
            {many && <th scope="col" className={cn(head, 'text-start')} />}
            {[props.x, props.y, ...(props.size === undefined ? [] : [props.size])].map((axis) => (
              <th key={axis.label} scope="col" className={cn(head, 'text-end')}>
                <span className={TEXT_ISOLATE}>{axis.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.series.flatMap((each) =>
            each.points.map((point) => (
              <tr key={`${each.key}:${point.key}`}>
                <th scope="row" className={cn(cell, 'text-start font-regular')}>
                  <span className={TEXT_ISOLATE}>{point.label}</span>
                </th>
                {many && (
                  <td className={cn(cell, 'text-start text-secondary')}>
                    <span className={TEXT_ISOLATE}>{each.label}</span>
                  </td>
                )}
                <td className={cn(cell, 'text-end tabular-nums')}>
                  <bdi>{writeX(point.x)}</bdi>
                </td>
                <td className={cn(cell, 'text-end tabular-nums')}>
                  <bdi>{writeY(point.y)}</bdi>
                </td>
                {props.size !== undefined && (
                  <td className={cn(cell, 'text-end tabular-nums')}>
                    <bdi>{writeSize(point.size)}</bdi>
                  </td>
                )}
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  )

  const axisTick = { fontSize: 12 }

  return (
    <ChartCard
      title={props.title}
      {...(props.description === undefined ? {} : { description: props.description })}
      {...(props.controls === undefined ? {} : { controls: props.controls })}
      {...(props.toggle === undefined ? {} : { toggle: props.toggle })}
      {...(props.className === undefined ? {} : { className: props.className })}
      {...(props.loading === undefined ? {} : { loading: props.loading })}
      {...(props.defaultView === undefined ? {} : { defaultView: props.defaultView })}
      {...(props.error === undefined ? {} : { error: props.error })}
      empty={keys.length === 0}
      skeleton="block"
      height={height}
      phone={phone}
      legend={legend}
      table={table}
    >
      <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)} aria-hidden="true">
        {props.y.label}
      </p>
      <ItemPlot
        label={props.title}
        keys={keys}
        height={height}
        keyTarget={(from, event) => {
          const index = from === null ? -1 : keys.indexOf(from)
          const next = sequenceKeyTarget(index, event.key, keys.length, direction)
          return next === null ? null : (keys[next] ?? null)
        }}
        tooltip={(id) => {
          const entry = byId.get(id)
          if (entry === undefined) return null
          const colour = colours[entry.seriesIndex] ?? 'currentColor'
          return (
            <ChartTooltipContent
              direction={direction}
              label={
                <>
                  {entry.point.label}
                  {many && (
                    <span className={cn('block font-regular text-secondary', TEXT_DIRECTION)}>
                      {props.series[entry.seriesIndex]?.label}
                    </span>
                  )}
                </>
              }
              rows={rows(entry.point, colour)}
            />
          )
        }}
        announce={(id) => {
          const entry = byId.get(id)
          if (entry === undefined) return ''
          const parts = rows(entry.point, '').map((row) => `${row.name} ${row.text}`)
          return `${entry.point.label}: ${parts.join(', ')}`
        }}
      >
        {() => (
          <ChartContainer config={config} height={height}>
            <ScatterRoot
              accessibilityLayer={false}
              margin={{ top: 12, right: rtl ? 8 : 16, bottom: 0, left: rtl ? 16 : 8 }}
            >
              <CartesianGrid strokeWidth={1} />
              <XAxis
                type="number"
                dataKey="x"
                name={props.x.label}
                reversed={rtl}
                domain={domainOf(xTicks)}
                ticks={xTicks}
                interval={0}
                tickLine={false}
                axisLine={{ stroke: 'var(--liro-border-default)' }}
                tick={axisTick}
                tickMargin={8}
                tickFormatter={tick(props.x)}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={props.y.label}
                orientation={rtl ? 'right' : 'left'}
                domain={domainOf(yTicks)}
                ticks={yTicks}
                interval={0}
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                tickMargin={8}
                width="auto"
                tickFormatter={tick(props.y)}
              />
              {props.series.map((each, seriesIndex) => {
                const data = each.points.flatMap((point) => {
                  const x = plotValue(point.x)
                  const y = plotValue(point.y)
                  if (x === null || y === null) return []
                  return [
                    {
                      id: `${each.key}:${point.key}`,
                      x,
                      y,
                      r: scatterRadius(
                        props.size === undefined ? null : plotValue(point.size),
                        largest,
                      ),
                    },
                  ]
                })
                const shape = (dot: ScatterShapeProps) => {
                  const payload = dot.payload as { id?: string; r?: number } | undefined
                  if (dot.cx === undefined || dot.cy === undefined || payload?.id === undefined)
                    return <g />
                  return (
                    <circle
                      data-chart-item={payload.id}
                      cx={dot.cx}
                      cy={dot.cy}
                      r={payload.r ?? 5}
                      fillOpacity={0.75}
                      strokeWidth={1}
                      style={{
                        fill: colours[seriesIndex] ?? 'currentColor',
                        stroke: 'var(--liro-surface-raised)',
                      }}
                    />
                  )
                }
                return (
                  <Scatter
                    key={each.key}
                    name={each.label}
                    data={data}
                    shape={shape}
                    isAnimationActive={animate}
                    animationDuration={CHART_MOTION_MS}
                  />
                )
              })}
            </ScatterRoot>
          </ChartContainer>
        )}
      </ItemPlot>
      <p className="m-0 text-end text-xs text-secondary" aria-hidden="true">
        <span className={TEXT_ISOLATE}>{props.x.label}</span>
      </p>
    </ChartCard>
  )
}
