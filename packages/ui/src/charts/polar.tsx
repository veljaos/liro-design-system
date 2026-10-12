import type { ReactNode } from 'react'
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RadarRoot,
  RadialBar,
  RadialBarChart,
} from 'recharts'
import { usePhone } from '../components/use-phone'
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../primitives/chart'
import { useLiro } from '../provider/liro-provider'
import { CentreText } from './centre'
import { ChartCard, ValuesTable } from './frame'
import {
  CHART_MOTION_MS,
  isEmptyChart,
  plotValue,
  seriesColour,
  useChartMotion,
  useFormatValue,
  type ChartCategory,
  type ChartPalette,
  type ChartSeries,
  type ChartStateProps,
  type ChartTone,
  type ChartValues,
} from './shared'

/*
 * RadarChart and RadialChart (P4.7a, on the shadcn/ui Chart primitive): for a few scores (radar)
 * and progress to a goal (radial) — never for money over time (the "Choosing a chart" page).
 * - Right-to-left: the spokes and the rings run counter-clockwise, in reading order.
 * - The same colour rules as the other charts: blue, then grey; categorical for three or more.
 */

export interface RadarChartProps extends ChartStateProps {
  title: string
  description?: string
  /** The spokes: what is scored ("Delivery on time"). */
  categories: readonly ChartCategory[]
  series: readonly ChartSeries[]
  values: ChartValues
  currency?: string
  decimals?: number
  palette?: ChartPalette
  /** A dot on each value. */
  dots?: boolean
  /** The flat wash inside each shape. Default true; false draws lines only. */
  fill?: boolean
  /** The grid: polygons (default), circles, or none. */
  grid?: 'polygon' | 'circle' | 'none'
  /** Default: shown for two or more series. */
  legend?: boolean
  height?: number
  controls?: ReactNode
  layout?: 'desktop' | 'phone'
  className?: string
}

/** A few scores around a circle: one shape per series. */
export function RadarChart(props: RadarChartProps) {
  const { direction } = useLiro()
  const rtl = direction === 'rtl'
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const animate = useChartMotion()
  const palette = props.palette ?? 'default'
  const write = useFormatValue(props.currency, props.decimals)
  const height = props.height ?? (phone ? 240 : 280)
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
  const grid = props.grid ?? 'polygon'
  const showLegend = props.legend ?? (props.series.length >= 2 || palette === 'categorical')
  const motion = { isAnimationActive: animate, animationDuration: CHART_MOTION_MS }

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
      skeleton="round"
      height={height}
      phone={phone}
      legend={
        showLegend ? (
          <ChartLegendContent
            items={props.series.map((each, index) => ({
              key: each.key,
              label: each.label,
              color: colours[index] ?? 'currentColor',
            }))}
          />
        ) : undefined
      }
      table={
        <ValuesTable
          title={props.title}
          categories={props.categories}
          series={props.series}
          values={props.values}
          write={write}
        />
      }
    >
      <ChartContainer config={config} height={height}>
        <RadarRoot
          data={data}
          outerRadius={phone ? '62%' : '70%'}
          startAngle={90}
          endAngle={rtl ? 450 : -270}
        >
          {grid !== 'none' && <PolarGrid gridType={grid} />}
          <PolarAngleAxis dataKey="__label" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis tick={false} axisLine={false} />
          <ChartTooltip
            isAnimationActive={false}
            cursor={false}
            content={({ active, payload }) => {
              const key = (payload[0]?.payload as { __key?: string } | undefined)?.__key
              const category = props.categories.find((each) => each.key === key)
              if (!active || category === undefined) return null
              return (
                <ChartTooltipContent
                  direction={direction}
                  label={category.label}
                  rows={props.series.map((each, index) => ({
                    key: each.key,
                    name: each.label,
                    color: colours[index] ?? '',
                    text: write(props.values[each.key]?.[category.key]),
                  }))}
                />
              )
            }}
          />
          {props.series.map((each) => (
            <Radar
              key={each.key}
              dataKey={each.key}
              name={each.label}
              stroke={`var(--color-${each.key})`}
              strokeWidth={2}
              fill={`var(--color-${each.key})`}
              fillOpacity={props.fill === false ? 0 : 0.15}
              dot={
                props.dots === true
                  ? { r: 4, fill: `var(--color-${each.key})`, fillOpacity: 1 }
                  : false
              }
              {...motion}
            />
          ))}
        </RadarRoot>
      </ChartContainer>
    </ChartCard>
  )
}

/** One ring of a radial chart. */
export interface RadialItem {
  key: string
  label: string
  /** A decimal string. */
  value: string
  tone?: ChartTone
}

export interface RadialChartProps extends ChartStateProps {
  title: string
  description?: string
  /** One ring per item (from the centre out), or one ring of parts with `stacked`. */
  items: readonly RadialItem[]
  /** The full circle's value (a goal, a limit): a decimal string. Default: the largest value. */
  max?: string
  currency?: string
  decimals?: number
  palette?: ChartPalette
  /**
   * Each ring's name and value at its start ("Jovana Marić 112%"). The names identify the rings,
   * so every ring is then the brand blue (P4.7c, owner) unless an item has a tone.
   */
  labels?: boolean
  /** The values are percentages: written with the provider's `format.percent`. */
  percent?: boolean
  /** Circles behind the rings. */
  grid?: boolean
  /** Text in the centre: a value (decimal string) and its name. */
  centre?: { value: string; label: string }
  /** The items as parts of one ring, end to end. */
  stacked?: boolean
  /** Default: shown for two or more items without labels. */
  legend?: boolean
  height?: number
  controls?: ReactNode
  layout?: 'desktop' | 'phone'
  className?: string
}

/** Progress to a goal, or a few values as rings. */
export function RadialChart(props: RadialChartProps) {
  const { direction } = useLiro()
  const rtl = direction === 'rtl'
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const animate = useChartMotion()
  const palette = props.palette ?? 'default'
  const writeNumber = useFormatValue(props.currency, props.decimals)
  const { format } = useLiro()
  const write = (value: string | null | undefined) =>
    props.percent === true && value !== null && value !== undefined && value !== ''
      ? format.percent(value, props.decimals === undefined ? {} : { decimals: props.decimals })
      : writeNumber(value)
  const height = props.height ?? (phone ? 220 : 240)
  // Labelled rings are named by their labels: one colour (the brand blue) for all of them.
  const colours = props.items.map((item, index) =>
    seriesColour(
      item,
      props.labels === true ? 0 : index,
      props.labels === true ? 'default' : palette,
    ),
  )
  const config: ChartConfig = Object.fromEntries(
    props.items.map((item, index) => [
      item.key,
      { label: item.label, color: colours[index] ?? 'currentColor' },
    ]),
  )
  const stacked = props.stacked === true
  const max = plotValue(props.max)
  const data = stacked
    ? [
        Object.fromEntries([
          ['__key', 'all'],
          ...props.items.map((item) => [item.key, plotValue(item.value)]),
        ]) as Record<string, string | number | null>,
      ]
    : props.items.map((item, index) => ({
        __key: item.key,
        __label: item.label,
        plot: plotValue(item.value),
        fill: colours[index] ?? 'currentColor',
      }))
  const endAngle = rtl ? 450 : -270

  /**
   * A ring's name just before its start (12 o'clock), on a small raised tag, never on the data
   * colour: at the start's left in left-to-right, at its right in right-to-left.
   */
  const ringLabel = (labelProps: unknown) => {
    const { index, viewBox } = labelProps as {
      index?: number
      viewBox?: { cx?: number; cy?: number; innerRadius?: number; outerRadius?: number }
    }
    const item = props.items[index ?? -1]
    if (item === undefined || viewBox === undefined) return null
    const { cx = 0, cy = 0, innerRadius = 0, outerRadius = 0 } = viewBox
    const y = cy - (innerRadius + outerRadius) / 2
    const valueText = write(item.value)
    const width = (item.label.length + valueText.length + 1) * 6 + 10
    // On a small raised tag: a nearly full ring runs under its own name.
    const tagX = rtl ? cx + 2 : cx - 2 - width
    return (
      <g>
        <rect
          x={tagX}
          y={y - 8}
          width={width}
          height={16}
          rx={4}
          fill="var(--liro-surface-raised)"
        />
        <text
          x={rtl ? tagX + 5 : tagX + width - 5}
          y={y}
          textAnchor={rtl ? 'start' : 'end'}
          dominantBaseline="central"
          fontSize={11}
          fill="var(--liro-text-primary)"
        >
          {rtl ? (
            <>
              <tspan fontWeight={600}>{valueText}</tspan> {item.label}
            </>
          ) : (
            <>
              {item.label} <tspan fontWeight={600}>{valueText}</tspan>
            </>
          )}
        </text>
      </g>
    )
  }
  const showLegend = props.legend ?? (props.items.length >= 2 && props.labels !== true)
  const motion = { isAnimationActive: animate, animationDuration: CHART_MOTION_MS }
  const domain: [number, number | 'auto'] = [0, max ?? 'auto']
  const categories = props.items.map((item) => ({ key: item.key, label: item.label }))
  const empty = !props.items.some((item) => plotValue(item.value) !== null)

  return (
    <ChartCard
      title={props.title}
      {...(props.description === undefined ? {} : { description: props.description })}
      {...(props.controls === undefined ? {} : { controls: props.controls })}
      {...(props.className === undefined ? {} : { className: props.className })}
      {...(props.loading === undefined ? {} : { loading: props.loading })}
      {...(props.defaultView === undefined ? {} : { defaultView: props.defaultView })}
      {...(props.error === undefined ? {} : { error: props.error })}
      empty={empty}
      skeleton="round"
      height={height}
      phone={phone}
      legend={
        showLegend ? (
          <ChartLegendContent
            items={props.items.map((item, index) => ({
              key: item.key,
              label: item.label,
              color: colours[index] ?? 'currentColor',
            }))}
          />
        ) : undefined
      }
      table={
        <ValuesTable
          title={props.title}
          categories={categories}
          series={[{ key: 'value', label: props.title }]}
          values={{
            value: Object.fromEntries(props.items.map((item) => [item.key, item.value])),
          }}
          write={write}
        />
      }
    >
      <div className="relative">
        <ChartContainer config={config} height={height}>
          <RadialBarChart
            data={data}
            startAngle={90}
            endAngle={endAngle}
            innerRadius={stacked ? '62%' : props.centre === undefined ? '24%' : '58%'}
            outerRadius={stacked ? '86%' : '90%'}
            {...(stacked ? { barSize: 18 } : {})}
          >
            {props.grid === true && <PolarGrid gridType="circle" radialLines={false} />}
            {/* The value runs around the circle: the angle axis carries the scale (the goal). */}
            <PolarAngleAxis type="number" domain={domain} tick={false} axisLine={false} />
            <ChartTooltip
              isAnimationActive={false}
              cursor={false}
              content={({ active, payload }) => {
                if (!active || payload.length === 0) return null
                const shown = stacked
                  ? props.items
                  : props.items.filter(
                      (item) =>
                        item.key === (payload[0]?.payload as { __key?: string } | undefined)?.__key,
                    )
                return (
                  <ChartTooltipContent
                    direction={direction}
                    rows={shown.map((item) => ({
                      key: item.key,
                      name: item.label,
                      color: colours[props.items.indexOf(item)] ?? '',
                      text: write(item.value),
                    }))}
                  />
                )
              }}
            />
            {stacked ? (
              props.items.map((item, index) => (
                <RadialBar
                  key={item.key}
                  dataKey={item.key}
                  stackId="ring"
                  fill={`var(--color-${item.key})`}
                  stroke="var(--liro-surface-raised)"
                  strokeWidth={2}
                  cornerRadius={index === 0 || index === props.items.length - 1 ? 4 : 0}
                  {...(index === 0 ? { background: true } : {})}
                  {...motion}
                />
              ))
            ) : (
              <RadialBar
                dataKey="plot"
                background
                cornerRadius={4}
                {...(props.labels === true ? { label: ringLabel } : {})}
                {...motion}
              />
            )}
          </RadialBarChart>
        </ChartContainer>
        {props.centre !== undefined && (
          <CentreText
            value={write(props.centre.value)}
            name={props.centre.label}
            height={height}
            innerShare={stacked ? 0.62 : 0.58}
          />
        )}
      </div>
    </ChartCard>
  )
}
