import type { ReactNode } from 'react'
import { Pie, PieChart as PieRoot, Sector, type PieSectorShapeProps } from 'recharts'
import { usePhone } from '../components/use-phone'
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../primitives/chart'
import { useLiro } from '../provider/liro-provider'
import { ChartCard, ValuesTable } from './frame'
import {
  CHART_MOTION_MS,
  plotValue,
  seriesColour,
  useChartMotion,
  useFormatValue,
  type ChartPalette,
  type ChartStateProps,
  type ChartTone,
} from './shared'

/*
 * PieChart and DonutChart (P4.6's donut, rebuilt on the shadcn/ui Chart primitive in P4.7a): parts
 * of one whole, five or fewer — otherwise a bar chart (the "Choosing a chart" page).
 * - Never colour alone: direct labels (outside, or inside on a small raised tag so the text never
 *   stands on the data colour) or a legend; a legend replaces the labels when they are off.
 * - Slices are 2px apart (the surface colour between them).
 * - Values are decimal strings; shares come from the application ("42,5 %"): nothing is computed.
 * - The total in the centre of a donut is the application's (`centre`).
 * - A second ring (`outerRing`) shows the same parts for another period or group around the first;
 *   each part keeps its colour in both rings (matched by key), and the legend names the parts.
 */

/** One slice. */
export interface PieSlice {
  key: string
  label: string
  /** A decimal string. */
  value: string
  /** The share as the application writes it ("42,5 %"). */
  share?: string
  /** A slice that means a state takes the tone's colour ("Over 30 days" in danger). */
  tone?: ChartTone
}

export interface PieChartProps extends ChartStateProps {
  title: string
  description?: string
  slices: readonly PieSlice[]
  currency?: string
  decimals?: number
  /** Default 'default' (blue, then greys); 'categorical' for three or more distinct parts. */
  palette?: ChartPalette
  /** A ring instead of a full disc. */
  donut?: boolean
  /** Where each slice's text stands. Default 'outside'; 'none' shows the legend instead. */
  labels?: 'outside' | 'inside' | 'none'
  /** What the label says: the name and the share (default), or the value. */
  labelText?: 'name' | 'value'
  /** Default: shown when the labels are off. */
  legend?: boolean
  /** One slice drawn 8px larger, standing out (a donut's "active" slice). */
  activeKey?: string
  /** Text in a donut's centre: a value (decimal string) and its name ("Total"). */
  centre?: { value: string; label: string }
  /**
   * The same parts for another period or group, as a ring around the first ("August" around
   * "September"); a part keeps its colour in both (matched by `key`).
   */
  outerRing?: { label: string; slices: readonly PieSlice[] }
  /** The first ring's name beside `outerRing`'s, in the tooltip and the table. Default: the title. */
  ringLabel?: string
  height?: number
  controls?: ReactNode
  layout?: 'desktop' | 'phone'
  className?: string
}

/** Parts of one whole, with their shares from the application. */
export function PieChart(props: PieChartProps) {
  const { direction } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const animate = useChartMotion()
  const palette = props.palette ?? 'default'
  const write = useFormatValue(props.currency, props.decimals)
  const height = props.height ?? (phone ? 220 : 240)
  const twoRings = props.outerRing !== undefined
  // Two rings are named by the legend: their labels would collide.
  const labels = twoRings ? 'none' : (props.labels ?? 'outside')
  const donut = props.donut === true || props.centre !== undefined

  const colours = props.slices.map((slice, index) => seriesColour(slice, index, palette))
  const outerColours = (props.outerRing?.slices ?? []).map((slice, index) => {
    const inner = props.slices.findIndex((each) => each.key === slice.key)
    return inner === -1 ? seriesColour(slice, index, palette) : (colours[inner] ?? 'currentColor')
  })
  const config: ChartConfig = Object.fromEntries(
    props.slices.map((slice, index) => [
      slice.key,
      { label: slice.label, color: colours[index] ?? 'currentColor' },
    ]),
  )
  const toData = (slices: readonly PieSlice[], fills: readonly string[], ring: 0 | 1) =>
    slices.map((slice, index) => ({
      ...slice,
      plot: plotValue(slice.value) ?? 0,
      fill: fills[index] ?? 'currentColor',
      ring,
    }))
  const data = toData(props.slices, colours, 0)
  const outerData = toData(props.outerRing?.slices ?? [], outerColours, 1)

  // Radii as shares of the plot's half-height; outside labels need room around the ring.
  // With a second ring the first ends at 56% and the second runs from 60% to 80%.
  const outer = twoRings ? '56%' : labels === 'outside' ? '66%' : '80%'
  const inner = donut ? (twoRings ? '36%' : labels === 'outside' ? '48%' : '58%') : 0

  const outsideLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    index,
  }: {
    cx: number
    cy: number
    midAngle?: number
    outerRadius: number
    index: number
  }) => {
    const slice = props.slices[index]
    if (slice === undefined) return null
    const angle = (-(midAngle ?? 0) * Math.PI) / 180
    const radius = outerRadius + 14
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    const anchor = x > cx ? 'start' : 'end'
    const first = { fill: 'var(--liro-text-primary)', text: slice.label }
    const second = {
      fill: 'var(--liro-text-secondary)',
      text: props.labelText === 'value' ? write(slice.value) : (slice.share ?? ''),
    }
    // The second part after the name in reading order (the plot's text runs left to right).
    const [a, b] = direction === 'rtl' ? [second, first] : [first, second]
    return (
      <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" fontSize={12}>
        <tspan fill={a.fill}>{a.text}</tspan>
        {b.text !== '' && (
          <tspan fill={b.fill} dx={6}>
            {b.text}
          </tspan>
        )}
      </text>
    )
  }

  const insideLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    index,
  }: {
    cx: number
    cy: number
    midAngle?: number
    innerRadius: number
    outerRadius: number
    index: number
  }) => {
    const slice = props.slices[index]
    if (slice === undefined) return null
    const text = props.labelText === 'value' ? write(slice.value) : (slice.share ?? slice.label)
    const angle = (-(midAngle ?? 0) * Math.PI) / 180
    const radius = (innerRadius + outerRadius) / 2
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    const width = text.length * 6.5 + 10
    // On a raised tag: the text never stands on the data colour (contrast in both themes).
    return (
      <g>
        <rect
          x={x - width / 2}
          y={y - 9}
          width={width}
          height={18}
          rx={4}
          fill="var(--liro-surface-raised)"
        />
        <text
          x={x}
          y={y}
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

  const shape = (sector: PieSectorShapeProps) => {
    const key = (sector.payload as { key?: string } | undefined)?.key
    const grow = props.activeKey !== undefined && key === props.activeKey ? 8 : 0
    return (
      <Sector
        cx={sector.cx}
        cy={sector.cy}
        innerRadius={sector.innerRadius}
        outerRadius={sector.outerRadius + grow}
        startAngle={sector.startAngle}
        endAngle={sector.endAngle}
        fill={(sector.payload as { fill?: string } | undefined)?.fill ?? 'currentColor'}
        stroke="var(--liro-surface-raised)"
        strokeWidth={2}
      />
    )
  }

  const ringNames = [props.ringLabel ?? props.title, props.outerRing?.label ?? '']
  const showLegend = props.legend ?? labels === 'none'
  const empty = !props.slices.some((slice) => (plotValue(slice.value) ?? 0) > 0)
  const motion = { isAnimationActive: animate, animationDuration: CHART_MOTION_MS }

  const tableCategories = props.slices.map((slice) => ({ key: slice.key, label: slice.label }))
  const tableSeries = twoRings
    ? [
        { key: 'inner', label: ringNames[0] ?? '' },
        { key: 'outer', label: ringNames[1] ?? '' },
      ]
    : [{ key: 'inner', label: props.title }]
  const tableValues = {
    inner: Object.fromEntries(props.slices.map((slice) => [slice.key, slice.value])),
    outer: Object.fromEntries(
      (props.outerRing?.slices ?? []).map((slice) => [slice.key, slice.value]),
    ),
  }

  return (
    <ChartCard
      title={props.title}
      {...(props.description === undefined ? {} : { description: props.description })}
      {...(props.controls === undefined ? {} : { controls: props.controls })}
      {...(props.className === undefined ? {} : { className: props.className })}
      {...(props.loading === undefined ? {} : { loading: props.loading })}
      {...(props.error === undefined ? {} : { error: props.error })}
      empty={empty}
      skeleton="round"
      height={height}
      phone={phone}
      legend={
        showLegend ? (
          <ChartLegendContent
            items={props.slices.map((slice, index) => ({
              key: slice.key,
              // Two rings have two shares per part: the tooltip and the table carry them.
              label:
                slice.share === undefined || twoRings
                  ? slice.label
                  : `${slice.label} ${slice.share}`,
              color: colours[index] ?? 'currentColor',
            }))}
          />
        ) : undefined
      }
      table={
        <ValuesTable
          title={props.title}
          categories={tableCategories}
          series={tableSeries}
          values={tableValues}
          write={write}
        />
      }
    >
      <ChartContainer config={config} height={height}>
        <PieRoot>
          <Pie
            data={data}
            dataKey="plot"
            nameKey="label"
            innerRadius={inner}
            outerRadius={outer}
            stroke="var(--liro-surface-raised)"
            strokeWidth={2}
            labelLine={false}
            shape={shape}
            {...(labels === 'outside'
              ? { label: outsideLabel }
              : labels === 'inside'
                ? { label: insideLabel }
                : {})}
            {...motion}
          />
          {twoRings && (
            <Pie
              data={outerData}
              dataKey="plot"
              nameKey="label"
              innerRadius="60%"
              outerRadius="80%"
              stroke="var(--liro-surface-raised)"
              strokeWidth={2}
              labelLine={false}
              {...motion}
            />
          )}
          {props.centre !== undefined && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              className="font-sans"
            >
              <tspan
                x="50%"
                dy="-0.4em"
                fontSize={20}
                fontWeight={600}
                fill="var(--liro-text-primary)"
              >
                {write(props.centre.value)}
              </tspan>
              <tspan x="50%" dy="1.6em" fontSize={12} fill="var(--liro-text-secondary)">
                {props.centre.label}
              </tspan>
            </text>
          )}
          <ChartTooltip
            isAnimationActive={false}
            content={({ active, payload }) => {
              const entry = payload[0]?.payload as
                (PieSlice & { ring: 0 | 1; fill: string }) | undefined
              if (!active || entry === undefined) return null
              const share = entry.share ?? ''
              const name = twoRings
                ? [ringNames[entry.ring], share].filter((part) => part !== '').join(' · ')
                : share
              return (
                <ChartTooltipContent
                  direction={direction}
                  label={entry.label}
                  rows={[
                    {
                      key: entry.key,
                      name,
                      color: entry.fill,
                      text: write(entry.value),
                    },
                  ]}
                />
              )
            }}
          />
        </PieRoot>
      </ChartContainer>
    </ChartCard>
  )
}

/** A pie with a hole: parts of one whole, often with the total in the centre. */
export function DonutChart(props: Omit<PieChartProps, 'donut'>) {
  return <PieChart {...props} donut />
}
