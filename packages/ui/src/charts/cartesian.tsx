import type { ReactElement, ReactNode } from 'react'
import {
  Area,
  AreaChart as AreaRoot,
  Bar,
  BarChart as BarRoot,
  CartesianGrid,
  LabelList,
  Line,
  LineChart as LineRoot,
  Rectangle,
  ReferenceLine,
  XAxis,
  YAxis,
  type BarShapeProps,
} from 'recharts'
import { usePhone } from '../components/use-phone'
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
  type ChartLegendItem,
  type ChartTooltipIndicator,
} from '../primitives/chart'
import { useLiro } from '../provider/liro-provider'
import { ChartCard, ValuesTable } from './frame'
import {
  CHART_MOTION_MS,
  categoricalColour,
  isEmptyChart,
  percentTick,
  plotValue,
  seriesColour,
  shortTick,
  toneColour,
  useChartMotion,
  useFormatValue,
  type ChartCategory,
  type ChartPalette,
  type ChartSeries,
  type ChartStateProps,
  type ChartValues,
} from './shared'

/*
 * AreaChart, BarChart and LineChart (P4.6, rebuilt on the shadcn/ui Chart primitive in P4.7a; the
 * owner's rules, docs/decisions.md "Charts catalogue").
 * - Colour: one series in the brand blue, a second in grey; three or more only with
 *   `palette="categorical"`. Green and red only when the data means it (`signTones`, a series'
 *   `tone`). No gradients, shadows or 3D: an area is a flat 10% wash (stacked areas 40%, so the
 *   layers read), lines are 2px, bars at most 24px thick with 4px rounded ends at the data.
 * - Values are decimal strings, numbers only to draw (D4); every value a person reads — tooltip,
 *   labels, table — is formatted from its string. A null is a gap in a line or a missing bar.
 *   Axis ticks are the scale's round steps, written short from 10,000 ("12K", words from
 *   `messages`).
 * - Right-to-left: time runs from the right, the value axis stands at the right; the legend is a
 *   list in the page's direction.
 * - Keyboard: the plot is focusable; the arrow keys move between categories (with the screen, also
 *   in right-to-left) and show the tooltip; Enter shows or hides it.
 * - Motion: the marks enter in 300ms, never under reduced motion or in automation.
 * - Phones: fewer ticks, the legend under the plot, the header stacked.
 */

/** The tooltip's options. */
export interface ChartTooltipOptions {
  /** 'dot' (default), 'line', 'dashed' or 'none' beside each value. */
  indicator?: ChartTooltipIndicator
  /** The tooltip's title for a category; default its label. `false` leaves the title out. */
  label?: ((category: ChartCategory) => ReactNode) | false
  /** A total row under the values, per category, from the application (never added here). */
  total?: { label: string; values: Readonly<Record<string, string | null>> }
  /**
   * Shows this category's tooltip from the start (the latest month), until the pointer or the
   * keyboard moves it.
   */
  defaultCategory?: string
}

export interface CartesianChartProps extends ChartStateProps {
  /** The chart's title (an h3); also the plot's accessible name. */
  title: string
  /** A line under the title ("Thousands of RSD, without VAT"); also the plot's description. */
  description?: string
  categories: readonly ChartCategory[]
  series: readonly ChartSeries[]
  values: ChartValues
  /** Writes values as amounts in this currency (tooltip, labels, table). */
  currency?: string
  decimals?: number
  /** Default 'default': blue and greys. 'categorical' for three or more series. */
  palette?: ChartPalette
  /** The plot's height in pixels. Default 240 (200 on phones). */
  height?: number
  /** The application's header controls: a time-range select, a series toggle. */
  controls?: ReactNode
  /** Default: shown for two or more series, and always with the categorical palette. */
  legend?: boolean
  /** The value axis. Default true. */
  valueAxis?: boolean
  /** The category axis. Default true. */
  categoryAxis?: boolean
  /** The hairline grid. Default true. */
  grid?: boolean
  tooltip?: ChartTooltipOptions
  /** Default: from the viewport (below 48em 'phone'). */
  layout?: 'desktop' | 'phone'
  className?: string
}

export type ChartCurve = 'monotone' | 'linear' | 'step'

export interface AreaChartProps extends CartesianChartProps {
  /**
   * Default by density (P4.7c, owner): 'linear' — straight segments — up to 31 points (monthly or
   * sparse data), 'monotone' for denser series; never a curve that passes the values.
   */
  curve?: ChartCurve
  /** A dot on each value. Default: with 12 or fewer points. */
  dots?: boolean
  /** 'stacked': the series on top of each other; 'expanded': stacked to 100%. Default 'none'. */
  stack?: 'none' | 'stacked' | 'expanded'
}

export interface LineChartProps extends CartesianChartProps {
  /** Default by density: 'linear' up to 31 points, 'monotone' for denser series. */
  curve?: ChartCurve
  /** A dot on each value. Default: with 12 or fewer points. */
  dots?: boolean
  /** Each value written above its point. */
  labels?: boolean
}

export interface BarChartProps extends CartesianChartProps {
  /**
   * 'horizontal': bars run along the reading direction, categories down the start side — for long
   * category names or more than 7 items. Default 'vertical'.
   */
  orientation?: 'vertical' | 'horizontal'
  /** 'stacked': the series on top of each other, 2px apart. Default 'none'. */
  stack?: 'none' | 'stacked'
  /** Each value written at the bar's end ('end') or inside it ('inside'). Default 'none'. */
  labels?: 'none' | 'end' | 'inside'
  /** One category highlighted: its bar in the main colour, the others grey (one series). */
  activeCategory?: string
  /**
   * Profit and loss: values at or above zero in success, below zero in danger, with the two names
   * in the legend (one series).
   */
  signTones?: { positive: string; negative: string }
  /**
   * 'category': each bar its own hue from the categorical palette, named in the legend (one
   * series). Default 'series'.
   */
  colorBy?: 'series' | 'category'
}

type Kind = 'area' | 'bar' | 'line'

type AnyCartesianProps = AreaChartProps &
  Omit<LineChartProps, 'curve' | 'dots'> &
  Omit<BarChartProps, 'labels' | 'stack'>

const CURVE_TYPE: Record<ChartCurve, 'monotone' | 'linear' | 'stepAfter'> = {
  monotone: 'monotone',
  linear: 'linear',
  step: 'stepAfter',
}

const AXIS_TICK = { fontSize: 12 }

/** Up to this many points a line is straight segments; denser series are drawn smooth. */
export const LINEAR_MAX_POINTS = 31
/** Up to this many points each value has a dot. */
export const DOTS_MAX_POINTS = 12

/** The curve a series is drawn with: the application's, else by density. */
export function defaultCurve(points: number): ChartCurve {
  return points <= LINEAR_MAX_POINTS ? 'linear' : 'monotone'
}

/**
 * The category ticks of a dense axis, at equal intervals ending on the last point (the latest
 * day), at most `max` of them; every category when they fit.
 */
export function equalTicks<T>(categories: readonly T[], max: number): T[] {
  if (categories.length <= max) return [...categories]
  const step = Math.ceil((categories.length - 1) / (max - 1))
  return categories.filter((_, index) => (categories.length - 1 - index) % step === 0)
}

function Cartesian({
  kind,
  barLabels = 'none',
  barStack = 'none',
  ...props
}: AnyCartesianProps & {
  kind: Kind
  barLabels?: BarChartProps['labels']
  barStack?: BarChartProps['stack']
}) {
  const { direction, format, messages } = useLiro()
  const rtl = direction === 'rtl'
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const animate = useChartMotion()
  const palette = props.palette ?? 'default'
  const write = useFormatValue(props.currency, props.decimals)
  const height = props.height ?? (phone ? 200 : 240)
  const horizontal = kind === 'bar' && props.orientation === 'horizontal'
  const stack: 'none' | 'stacked' | 'expanded' =
    kind === 'area' ? (props.stack ?? 'none') : kind === 'bar' ? barStack : 'none'
  const byCategory = kind === 'bar' && props.colorBy === 'category'
  const signTones = kind === 'bar' ? props.signTones : undefined

  const colours = props.series.map((each, index) => seriesColour(each, index, palette))
  const config: ChartConfig = Object.fromEntries(
    props.series.map((each, index) => [
      each.key,
      { label: each.label, color: colours[index] ?? 'currentColor' },
    ]),
  )
  const data = props.categories.map((category) => {
    const row: Record<string, string | number | null> = {
      __key: category.key,
      __label: category.label,
    }
    for (const each of props.series)
      row[each.key] = plotValue(props.values[each.key]?.[category.key])
    return row
  })

  /** The colour of one bar: by category, by sign, by the highlighted category, or its series'. */
  const barColour = (seriesIndex: number, categoryIndex: number): string => {
    const category = props.categories[categoryIndex]
    if (byCategory) return categoricalColour(categoryIndex)
    if (signTones !== undefined) {
      const series = props.series[seriesIndex]
      const value =
        series === undefined ? null : plotValue(props.values[series.key]?.[category?.key ?? ''])
      return toneColour(value !== null && value < 0 ? 'danger' : 'success')
    }
    if (props.activeCategory !== undefined)
      return category?.key === props.activeCategory
        ? 'var(--liro-chart-main)'
        : 'var(--liro-chart-comparison)'
    return colours[seriesIndex] ?? 'currentColor'
  }
  const perBar = byCategory || signTones !== undefined || props.activeCategory !== undefined

  const legendItems: ChartLegendItem[] = byCategory
    ? props.categories.map((category, index) => ({
        key: category.key,
        label: category.label,
        color: categoricalColour(index),
      }))
    : signTones !== undefined
      ? [
          { key: 'positive', label: signTones.positive, color: toneColour('success') },
          { key: 'negative', label: signTones.negative, color: toneColour('danger') },
        ]
      : props.series.map((each, index) => ({
          key: each.key,
          label: each.label,
          color: colours[index] ?? 'currentColor',
          line: kind !== 'bar',
        }))
  const showLegend =
    props.legend ??
    (props.series.length >= 2 || palette === 'categorical' || byCategory || signTones !== undefined)

  const tooltipOptions = props.tooltip ?? {}
  const defaultIndex =
    tooltipOptions.defaultCategory === undefined
      ? -1
      : props.categories.findIndex((category) => category.key === tooltipOptions.defaultCategory)
  const tooltip = (
    <ChartTooltip
      {...(defaultIndex === -1 ? {} : { defaultIndex })}
      cursor={
        kind === 'bar'
          ? { fill: 'var(--liro-surface-hover)' }
          : { stroke: 'var(--liro-border-strong)' }
      }
      isAnimationActive={false}
      content={({ active, payload }) => {
        if (!active || payload.length === 0) return null
        const key = (payload[0]?.payload as { __key?: string } | undefined)?.__key ?? ''
        const categoryIndex = props.categories.findIndex((category) => category.key === key)
        const category = props.categories[categoryIndex]
        if (category === undefined) return null
        const label =
          tooltipOptions.label === false
            ? undefined
            : tooltipOptions.label === undefined
              ? category.label
              : tooltipOptions.label(category)
        const total = tooltipOptions.total
        return (
          <ChartTooltipContent
            direction={direction}
            indicator={tooltipOptions.indicator ?? 'dot'}
            {...(label === undefined ? {} : { label })}
            rows={props.series.map((each, index) => ({
              key: each.key,
              name: each.label,
              color: perBar ? barColour(index, categoryIndex) : (colours[index] ?? ''),
              text: write(props.values[each.key]?.[key]),
            }))}
            {...(total === undefined
              ? {}
              : { total: { label: total.label, text: write(total.values[key]) } })}
          />
        )
      }}
    />
  )

  const valueTick = (tick: number) =>
    stack === 'expanded' ? percentTick(tick, format) : shortTick(tick, format, messages)
  const valueAxisShown = props.valueAxis ?? true
  const categoryAxisShown = props.categoryAxis ?? true
  const gridShown = props.grid ?? true

  const axes = horizontal ? (
    <>
      {gridShown && <CartesianGrid horizontal={false} strokeWidth={1} />}
      <XAxis
        type="number"
        hide={!valueAxisShown}
        reversed={rtl}
        tickLine={false}
        axisLine={false}
        tick={AXIS_TICK}
        tickMargin={8}
        tickCount={phone ? 3 : 5}
        tickFormatter={valueTick}
      />
      <YAxis
        type="category"
        dataKey="__label"
        hide={!categoryAxisShown}
        orientation={rtl ? 'right' : 'left'}
        tickLine={false}
        axisLine={{ stroke: 'var(--liro-border-default)' }}
        tick={AXIS_TICK}
        tickMargin={8}
        width="auto"
        interval={0}
      />
    </>
  ) : (
    <>
      {gridShown && <CartesianGrid vertical={false} strokeWidth={1} />}
      <XAxis
        dataKey="__label"
        hide={!categoryAxisShown}
        reversed={rtl}
        tickLine={false}
        axisLine={{ stroke: 'var(--liro-border-default)' }}
        tick={AXIS_TICK}
        tickMargin={8}
        ticks={equalTicks(
          props.categories.map((category) => category.label),
          phone ? 4 : 8,
        )}
        interval={0}
      />
      <YAxis
        hide={!valueAxisShown}
        orientation={rtl ? 'right' : 'left'}
        tickLine={false}
        axisLine={false}
        tick={AXIS_TICK}
        tickMargin={8}
        width="auto"
        tickCount={phone ? 4 : 5}
        tickFormatter={valueTick}
        {...(stack === 'expanded' ? { domain: [0, 1] } : {})}
      />
    </>
  )

  /** A value written beside its mark, formatted from its decimal string. */
  const labelText = (seriesKey: string, index: number | undefined): string =>
    write(props.values[seriesKey]?.[props.categories[index ?? -1]?.key ?? ''])

  // Lines and areas start and end on the plot's edges, so the last category label (and the first
  // where no value axis stands) needs room beside the plot, or it is cut ("06.1", "Se").
  const edge = kind === 'bar' ? 8 : 24
  const margin = {
    top: (kind === 'line' && props.labels === true) || barLabels === 'end' ? 20 : 8,
    right: horizontal && barLabels === 'end' && !rtl ? 64 : rtl ? 8 : edge,
    left: horizontal && barLabels === 'end' && rtl ? 64 : rtl ? edge : 8,
    bottom: 0,
  }
  const motion = { isAnimationActive: animate, animationDuration: CHART_MOTION_MS }
  const curve = CURVE_TYPE[props.curve ?? defaultCurve(props.categories.length)]
  const dots = props.dots ?? props.categories.length <= DOTS_MAX_POINTS
  const dot = (key: string) =>
    dots
      ? {
          r: 3.5,
          strokeWidth: 2,
          fill: `var(--color-${key})`,
          stroke: 'var(--liro-surface-raised)',
        }
      : false
  const hasNegative =
    kind === 'bar' &&
    props.series.some((each) =>
      props.categories.some(
        (category) => (plotValue(props.values[each.key]?.[category.key]) ?? 0) < 0,
      ),
    )

  let chart: ReactElement
  if (kind === 'bar') {
    const last = props.series.length - 1
    chart = (
      <BarRoot
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        barGap={2}
        barCategoryGap="30%"
        margin={margin}
      >
        {axes}
        {tooltip}
        {hasNegative &&
          (horizontal ? (
            <ReferenceLine x={0} strokeWidth={1} />
          ) : (
            <ReferenceLine y={0} strokeWidth={1} />
          ))}
        {props.series.map((each, seriesIndex) => {
          const top = stack === 'none' || seriesIndex === last
          /**
           * One bar: rounded 4px at the data end only — the top of a positive column, the bottom
           * of a negative one, the end of a horizontal bar in the reading direction — square at
           * the baseline and between stacked parts; its colour by category, sign or highlight.
           */
          const shape = (bar: BarShapeProps) => {
            const value = (bar.payload as Record<string, number | null> | undefined)?.[each.key]
            const negative = value !== null && value !== undefined && value < 0
            const x = bar.width < 0 ? bar.x + bar.width : bar.x
            const y = bar.height < 0 ? bar.y + bar.height : bar.y
            const width = Math.abs(bar.width)
            const height = Math.abs(bar.height)
            const endOnRight = negative === rtl
            const radius: [number, number, number, number] = !top
              ? [0, 0, 0, 0]
              : horizontal
                ? endOnRight
                  ? [0, 4, 4, 0]
                  : [4, 0, 0, 4]
                : negative
                  ? [0, 0, 4, 4]
                  : [4, 4, 0, 0]
            return (
              <Rectangle
                x={x}
                y={y}
                width={width}
                height={height}
                radius={radius}
                fill={perBar ? barColour(seriesIndex, bar.index) : `var(--color-${each.key})`}
                {...(stack === 'stacked'
                  ? { stroke: 'var(--liro-surface-raised)', strokeWidth: 1 }
                  : {})}
              />
            )
          }
          return (
            <Bar
              key={each.key}
              dataKey={each.key}
              name={each.label}
              fill={`var(--color-${each.key})`}
              maxBarSize={24}
              shape={shape}
              {...(stack === 'stacked' ? { stackId: 'stack' } : {})}
              {...motion}
            >
              {barLabels !== 'none' && (
                <LabelList
                  dataKey={each.key}
                  content={(labelProps) => {
                    const index =
                      typeof labelProps.index === 'number' ? labelProps.index : undefined
                    const text = labelText(each.key, index)
                    if (text === '—') return null
                    const {
                      x = 0,
                      y = 0,
                      width = 0,
                      height: barHeight = 0,
                    } = labelProps as {
                      x?: number
                      y?: number
                      width?: number
                      height?: number
                    }
                    const inside = barLabels === 'inside'
                    // A reversed axis (right-to-left) reports the bar with a negative width.
                    const left = Math.min(x, x + width)
                    const right = Math.max(x, x + width)
                    if (inside) {
                      // On a small raised tag inside the bar's start: the text never stands on the
                      // data colour (white on blue 4 is 2.6:1 in the dark theme).
                      const tagWidth = text.length * 6.5 + 10
                      const cx = horizontal
                        ? rtl
                          ? right - 4 - tagWidth / 2
                          : left + 4 + tagWidth / 2
                        : left + Math.abs(width) / 2
                      const cy = horizontal ? y + barHeight / 2 : y + 13
                      if (horizontal ? Math.abs(width) < tagWidth + 8 : Math.abs(barHeight) < 26)
                        return null
                      return (
                        <g>
                          <rect
                            x={cx - tagWidth / 2}
                            y={cy - 9}
                            width={tagWidth}
                            height={18}
                            rx={4}
                            fill="var(--liro-surface-raised)"
                          />
                          <text
                            x={cx}
                            y={cy}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={12}
                            fill="var(--liro-text-primary)"
                          >
                            {text}
                          </text>
                        </g>
                      )
                    }
                    const fill = 'var(--liro-text-secondary)'
                    if (horizontal) {
                      return (
                        <text
                          x={rtl ? left - 8 : right + 8}
                          y={y + barHeight / 2}
                          dominantBaseline="central"
                          textAnchor={rtl ? 'end' : 'start'}
                          fontSize={12}
                          fill={fill}
                        >
                          {text}
                        </text>
                      )
                    }
                    return (
                      <text
                        x={left + Math.abs(width) / 2}
                        y={y - 6}
                        textAnchor="middle"
                        fontSize={12}
                        fill={fill}
                      >
                        {text}
                      </text>
                    )
                  }}
                />
              )}
            </Bar>
          )
        })}
      </BarRoot>
    )
  } else if (kind === 'line') {
    chart = (
      <LineRoot data={data} margin={margin}>
        {axes}
        {tooltip}
        {props.series.map((each) => (
          <Line
            key={each.key}
            dataKey={each.key}
            name={each.label}
            type={curve}
            stroke={`var(--color-${each.key})`}
            strokeWidth={2}
            dot={dot(each.key)}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--liro-surface-raised)' }}
            connectNulls={false}
            {...motion}
          >
            {props.labels === true && (
              <LabelList
                dataKey={each.key}
                content={(labelProps) => {
                  const index = typeof labelProps.index === 'number' ? labelProps.index : undefined
                  const text = labelText(each.key, index)
                  if (text === '—') return null
                  const { x = 0, y = 0 } = labelProps as { x?: number; y?: number }
                  return (
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      fontSize={12}
                      fill="var(--liro-text-secondary)"
                    >
                      {text}
                    </text>
                  )
                }}
              />
            )}
          </Line>
        ))}
      </LineRoot>
    )
  } else {
    const stacked = stack !== 'none'
    chart = (
      <AreaRoot
        data={data}
        margin={margin}
        {...(stack === 'expanded' ? { stackOffset: 'expand' } : {})}
      >
        {axes}
        {tooltip}
        {props.series.map((each) => (
          <Area
            key={each.key}
            dataKey={each.key}
            name={each.label}
            type={curve}
            stroke={`var(--color-${each.key})`}
            strokeWidth={2}
            fill={`var(--color-${each.key})`}
            fillOpacity={stacked ? 0.4 : 0.1}
            dot={dot(each.key)}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--liro-surface-raised)' }}
            connectNulls={false}
            {...(stacked ? { stackId: 'stack' } : {})}
            {...motion}
          />
        ))}
      </AreaRoot>
    )
  }

  return (
    <ChartCard
      title={props.title}
      {...(props.description === undefined ? {} : { description: props.description })}
      {...(props.controls === undefined ? {} : { controls: props.controls })}
      {...(props.className === undefined ? {} : { className: props.className })}
      {...(props.loading === undefined ? {} : { loading: props.loading })}
      {...(props.defaultView === undefined ? {} : { defaultView: props.defaultView })}
      {...(props.error === undefined ? {} : { error: props.error })}
      empty={isEmptyChart(props.categories, props.series, props.values)}
      skeleton={horizontal ? 'bars' : 'columns'}
      height={height}
      phone={phone}
      legend={showLegend ? <ChartLegendContent items={legendItems} /> : undefined}
      table={
        <ValuesTable
          title={props.title}
          categories={props.categories}
          series={props.series}
          values={props.values}
          write={write}
          {...(tooltipOptions.total === undefined ? {} : { total: tooltipOptions.total })}
        />
      }
    >
      <ChartContainer config={config} height={height}>
        {chart}
      </ChartContainer>
    </ChartCard>
  )
}

/** Values over time with a flat wash under the line: a volume over time, or parts of it. */
export function AreaChart(props: AreaChartProps) {
  return <Cartesian {...props} kind="area" />
}

/** Values over time as lines: change and trend. */
export function LineChart(props: LineChartProps) {
  return <Cartesian {...props} kind="line" />
}

/** Values per category as bars: magnitudes to compare. */
export function BarChart({ labels, stack, ...props }: BarChartProps) {
  return (
    <Cartesian
      {...props}
      kind="bar"
      {...(labels === undefined ? {} : { barLabels: labels })}
      {...(stack === undefined ? {} : { barStack: stack })}
    />
  )
}
