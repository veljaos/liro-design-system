import { ChartColumn, Table2 } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import {
  Area,
  AreaChart as AreaRoot,
  Bar,
  BarChart as BarRoot,
  CartesianGrid,
  Line,
  LineChart as LineRoot,
  Pie,
  PieChart as PieRoot,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { CompactIconButton } from './button'

/*
 * Charts (P4.6, on Recharts as shadcn/ui's Chart is; the owner's decisions, docs/decisions.md
 * "Dashboard"): BarChart, LineChart, AreaChart and DonutChart.
 * - Colour (`palette`): by default the main series in the brand blue (chart.main: #0078D4, blue 4
 *   in dark), a comparison series in grey (chart.comparison) and the rest in a darker or lighter
 *   grey (chart.other); a series may take a status tone when it means a state. 'categorical' (opt
 *   in, never the default): up to five hues in a fixed order (chart.category1–5), validated for
 *   colour-vision deficiency; such a chart always shows its legend.
 * - Marks (the dataviz rules): bars at most 24px thick with 4px rounded ends at the data and square
 *   at the baseline, 2px between adjacent bars; 2px lines; area fills a 10% wash of the series;
 *   1px hairline grid in border.subtle, no vertical grid; axis text 12px text.tertiary; no
 *   animation. A donut has 2px separators in the surface colour and direct labels (name and the
 *   share the application gives).
 * - Text never wears the data colour: titles, legends, labels and tooltips use text tokens; a
 *   swatch beside the text carries the identity. A legend for two or more series.
 * - Numbers: values are decimal strings; they become numbers only to draw the marks (rule D4).
 *   Every value a person reads — tooltip, table, donut labels — is formatted from the string
 *   through the provider's `format`; axis ticks are the scale's round steps, formatted by
 *   `format.number`. Shares come from the application.
 * - Each chart is a card (radius lg, border.default, padding md) with its title (h3, sm semibold)
 *   and an optional line under it; a 28px "Show as table" / "Show as chart" button at the end of
 *   the header shows the same values as a table, so nothing depends on hovering (WCAG 1.1.1,
 *   2.1.1). The plot itself is a picture named by the title.
 * - Right-to-left: the category axis runs from the right and the value axis stands at the right.
 */

/** One series: its key in `values`, its name, and its role in the default palette. */
export interface ChartSeries {
  key: string
  label: string
  /** 'main' (blue, default for the first), 'comparison' (grey) or 'other' (grey). */
  role?: 'main' | 'comparison' | 'other'
  /** A series that means a state takes the tone's colour. */
  tone?: 'danger' | 'warning' | 'success' | 'info'
}

export interface ChartCategory {
  key: string
  /** The label on the category axis ("Oct"). */
  label: string
}

export interface CartesianChartProps {
  /** The chart's title (an h3); also the plot's accessible name. */
  title: string
  /** A line under the title ("RSD, without VAT"). */
  description?: string
  categories: readonly ChartCategory[]
  series: readonly ChartSeries[]
  /** By series key, then by category key: decimal strings (null for none). */
  values: Readonly<Record<string, Readonly<Record<string, string | null>>>>
  /** Writes values as amounts in this currency in tooltips and the table. */
  currency?: string
  decimals?: number
  palette?: 'default' | 'categorical'
  /** The plot's height in pixels. Default 240. */
  height?: number
  className?: string
}

export interface DonutSlice {
  key: string
  label: string
  /** A decimal string. */
  value: string
  /** The share as the application writes it ("42,5 %"): the donut computes nothing. */
  share: string
  tone?: ChartSeries['tone']
}

export interface DonutChartProps {
  title: string
  description?: string
  slices: readonly DonutSlice[]
  currency?: string
  decimals?: number
  palette?: 'default' | 'categorical'
  height?: number
  className?: string
}

const TONE_COLOUR: Record<NonNullable<ChartSeries['tone']>, string> = {
  danger: 'var(--liro-status-danger-solid)',
  warning: 'var(--liro-status-warning-solid)',
  success: 'var(--liro-status-success-solid)',
  info: 'var(--liro-status-info-solid)',
}

/** A series' colour: its tone, else its categorical slot, else its role's grey or blue. */
export function seriesColour(
  series: { role?: ChartSeries['role']; tone?: ChartSeries['tone'] },
  index: number,
  palette: 'default' | 'categorical',
): string {
  if (series.tone !== undefined) return TONE_COLOUR[series.tone]
  if (palette === 'categorical') return `var(--liro-chart-category${String((index % 5) + 1)})`
  const role = series.role ?? (index === 0 ? 'main' : index === 1 ? 'comparison' : 'other')
  return `var(--liro-chart-${role})`
}

/** A decimal string as a number, for drawing only; null stays empty. */
export function plotValue(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function useFormatValue(currency?: string, decimals?: number) {
  const { format } = useLiro()
  return (value: string | null | undefined) => {
    if (value === null || value === undefined || value === '') return '—'
    const options = decimals === undefined ? {} : { decimals }
    return currency === undefined
      ? format.number(value, options)
      : format.money(value, currency, options)
  }
}

function ChartFrame({
  title,
  description,
  table,
  legend,
  children,
  className,
}: {
  title: string
  description?: string
  table: ReactNode
  legend?: ReactNode
  children: ReactNode
  className?: string
}) {
  const { messages } = useLiro()
  const [asTable, setAsTable] = useState(false)
  const titleId = useId()
  return (
    <section
      data-slot="chart"
      aria-labelledby={titleId}
      className={cn(
        'box-border flex min-w-0 flex-col gap-3 rounded-lg border border-solid border-default bg-surface-raised p-4 font-sans',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 id={titleId} className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
            {title}
          </h3>
          {description !== undefined && (
            <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>{description}</p>
          )}
        </div>
        <CompactIconButton
          icon={asTable ? ChartColumn : Table2}
          label={asTable ? messages['chart.showChart'] : messages['chart.showTable']}
          aria-pressed={asTable}
          onClick={() => {
            setAsTable(!asTable)
          }}
        />
      </div>
      {asTable ? (
        table
      ) : (
        <>
          {legend}
          <div role="img" aria-label={title} className="min-w-0">
            {children}
          </div>
        </>
      )}
    </section>
  )
}

function Swatch({ colour, line = false }: { colour: string; line?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block shrink-0',
        line ? 'h-0.5 w-3 rounded-full' : 'size-2.5 rounded-xs',
      )}
      style={{ backgroundColor: colour }}
    />
  )
}

function Legend({
  series,
  palette,
  line,
}: {
  series: readonly ChartSeries[]
  palette: 'default' | 'categorical'
  line: boolean
}) {
  if (series.length < 2) return null
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-secondary">
      {series.map((each, index) => (
        <li key={each.key} className="flex items-center gap-1.5">
          <Swatch colour={seriesColour(each, index, palette)} line={line} />
          <span className={TEXT_DIRECTION}>{each.label}</span>
        </li>
      ))}
    </ul>
  )
}

/** The values as a table: the chart's text alternative and its "Show as table" view. */
function ValuesTable({
  title,
  categories,
  series,
  values,
  write,
}: {
  title: string
  categories: readonly ChartCategory[]
  series: readonly ChartSeries[]
  values: CartesianChartProps['values']
  write: (value: string | null | undefined) => string
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-sans text-sm text-primary">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="border-0 border-b border-solid border-default px-2 py-1.5 text-start font-semibold"
            />
            {series.map((each) => (
              <th
                key={each.key}
                scope="col"
                className={cn(
                  'border-0 border-b border-solid border-default px-2 py-1.5 text-end font-semibold',
                  TEXT_DIRECTION,
                )}
              >
                {each.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.key}>
              <th
                scope="row"
                className={cn(
                  'border-0 border-b border-solid border-subtle px-2 py-1.5 text-start font-regular',
                  TEXT_DIRECTION,
                )}
              >
                {category.label}
              </th>
              {series.map((each) => (
                <td
                  key={each.key}
                  className="border-0 border-b border-solid border-subtle px-2 py-1.5 text-end tabular-nums"
                >
                  <bdi>{write(values[each.key]?.[category.key])}</bdi>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The tooltip on hover: the category and each series' value, in text tokens. */
function TooltipBody({
  label,
  rows,
}: {
  label: string
  rows: readonly { key: string; name: string; colour: string; text: string }[]
}) {
  return (
    <div className="flex min-w-36 flex-col gap-1 rounded-md border border-solid border-default bg-surface-overlay px-3 py-2 font-sans text-xs text-primary shadow-md">
      <span className={cn('font-semibold', TEXT_DIRECTION)}>{label}</span>
      {rows.map((row) => (
        <span key={row.key} className="flex items-center gap-2">
          <Swatch colour={row.colour} />
          <span className={cn('flex-1 text-secondary', TEXT_DIRECTION)}>{row.name}</span>
          <bdi className="tabular-nums">{row.text}</bdi>
        </span>
      ))}
    </div>
  )
}

const AXIS_TICK = { fontSize: 12, fill: 'var(--liro-text-tertiary)' }

type Kind = 'bar' | 'line' | 'area'

function Cartesian({ kind, ...props }: CartesianChartProps & { kind: Kind }) {
  const { direction, format } = useLiro()
  const rtl = direction === 'rtl'
  const palette = props.palette ?? 'default'
  const write = useFormatValue(props.currency, props.decimals)
  const data = props.categories.map((category) => {
    const row: Record<string, string | number | null> = {
      __key: category.key,
      __label: category.label,
    }
    for (const each of props.series)
      row[each.key] = plotValue(props.values[each.key]?.[category.key])
    return row
  })
  const colours = props.series.map((each, index) => seriesColour(each, index, palette))
  const height = props.height ?? 240

  const tooltip = (
    <ChartTooltip
      cursor={
        kind === 'bar'
          ? { fill: 'var(--liro-surface-hover)' }
          : { stroke: 'var(--liro-border-strong)' }
      }
      isAnimationActive={false}
      content={({ active, label, payload }) => {
        if (!active || payload.length === 0) return null
        const key = (payload[0]?.payload as { __key?: string } | undefined)?.__key ?? ''
        return (
          <TooltipBody
            label={String(label)}
            rows={props.series.map((each, index) => ({
              key: each.key,
              name: each.label,
              colour: colours[index] ?? '',
              text: write(props.values[each.key]?.[key]),
            }))}
          />
        )
      }}
    />
  )
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--liro-border-subtle)" strokeWidth={1} />
      <XAxis
        dataKey="__label"
        reversed={rtl}
        tickLine={false}
        axisLine={{ stroke: 'var(--liro-border-default)' }}
        tick={AXIS_TICK}
        tickMargin={8}
      />
      <YAxis
        orientation={rtl ? 'right' : 'left'}
        tickLine={false}
        axisLine={false}
        tick={AXIS_TICK}
        tickMargin={8}
        width="auto"
        tickFormatter={(tick: number) => format.number(String(tick))}
      />
      {tooltip}
    </>
  )

  const chart =
    kind === 'bar' ? (
      <BarRoot data={data} accessibilityLayer={false} barGap={2} barCategoryGap="30%">
        {axes}
        {props.series.map((each, index) => (
          <Bar
            key={each.key}
            dataKey={each.key}
            name={each.label}
            fill={colours[index] ?? 'currentColor'}
            maxBarSize={24}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        ))}
      </BarRoot>
    ) : kind === 'line' ? (
      <LineRoot data={data} accessibilityLayer={false}>
        {axes}
        {props.series.map((each, index) => (
          <Line
            key={each.key}
            dataKey={each.key}
            name={each.label}
            stroke={colours[index] ?? 'currentColor'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--liro-surface-raised)' }}
            isAnimationActive={false}
            connectNulls={false}
          />
        ))}
      </LineRoot>
    ) : (
      <AreaRoot data={data} accessibilityLayer={false}>
        {axes}
        {props.series.map((each, index) => (
          <Area
            key={each.key}
            dataKey={each.key}
            name={each.label}
            stroke={colours[index] ?? 'currentColor'}
            strokeWidth={2}
            fill={colours[index] ?? 'currentColor'}
            fillOpacity={0.1}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--liro-surface-raised)' }}
            isAnimationActive={false}
          />
        ))}
      </AreaRoot>
    )

  return (
    <ChartFrame
      title={props.title}
      {...(props.description === undefined ? {} : { description: props.description })}
      {...(props.className === undefined ? {} : { className: props.className })}
      legend={<Legend series={props.series} palette={palette} line={kind !== 'bar'} />}
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
      <ResponsiveContainer width="100%" height={height}>
        {chart}
      </ResponsiveContainer>
    </ChartFrame>
  )
}

/** Values per category, as bars: magnitudes to compare. */
export function BarChart(props: CartesianChartProps) {
  return <Cartesian {...props} kind="bar" />
}

/** Values over time, as lines: change and trend. */
export function LineChart(props: CartesianChartProps) {
  return <Cartesian {...props} kind="line" />
}

/** Values over time with a wash under the line: a volume over time. */
export function AreaChart(props: CartesianChartProps) {
  return <Cartesian {...props} kind="area" />
}

/** Parts of one whole, with their shares from the application. */
export function DonutChart(props: DonutChartProps) {
  const palette = props.palette ?? 'default'
  const write = useFormatValue(props.currency, props.decimals)
  const height = props.height ?? 240
  const colours = props.slices.map((slice, index) => seriesColour(slice, index, palette))
  // Each slice carries its colour (`fill`), as Recharts 3 reads it from the data.
  const data = props.slices.map((slice, index) => ({
    ...slice,
    plot: plotValue(slice.value) ?? 0,
    fill: colours[index] ?? 'currentColor',
  }))
  const categories = props.slices.map((slice) => ({ key: slice.key, label: slice.label }))
  return (
    <ChartFrame
      title={props.title}
      {...(props.description === undefined ? {} : { description: props.description })}
      {...(props.className === undefined ? {} : { className: props.className })}
      table={
        <ValuesTable
          title={props.title}
          categories={categories}
          series={[{ key: 'value', label: props.title }]}
          values={{
            value: Object.fromEntries(props.slices.map((slice) => [slice.key, slice.value])),
          }}
          write={write}
        />
      }
    >
      <ResponsiveContainer width="100%" height={height}>
        <PieRoot accessibilityLayer={false}>
          <Pie
            data={data}
            dataKey="plot"
            nameKey="label"
            innerRadius="58%"
            outerRadius="78%"
            stroke="var(--liro-surface-raised)"
            strokeWidth={2}
            isAnimationActive={false}
            labelLine={false}
            label={({ cx, cy, midAngle, outerRadius, index }) => {
              const slice = props.slices[index]
              if (slice === undefined) return null
              const angle = (-(midAngle ?? 0) * Math.PI) / 180
              const radius = outerRadius + 14
              const x = cx + radius * Math.cos(angle)
              const y = cy + radius * Math.sin(angle)
              const anchor = x > cx ? 'start' : 'end'
              return (
                <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" fontSize={12}>
                  <tspan fill="var(--liro-text-primary)">{slice.label}</tspan>
                  <tspan fill="var(--liro-text-secondary)" dx={6}>
                    {slice.share}
                  </tspan>
                </text>
              )
            }}
          ></Pie>
          <ChartTooltip
            isAnimationActive={false}
            content={({ active, payload }) => {
              const entry = payload[0]?.payload as DonutSlice | undefined
              if (!active || entry === undefined) return null
              const index = props.slices.findIndex((slice) => slice.key === entry.key)
              return (
                <TooltipBody
                  label={entry.label}
                  rows={[
                    {
                      key: entry.key,
                      name: entry.share,
                      colour: colours[index] ?? '',
                      text: write(entry.value),
                    },
                  ]}
                />
              )
            }}
          />
        </PieRoot>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
