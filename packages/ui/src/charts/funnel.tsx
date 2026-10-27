import type { ReactNode } from 'react'
import { Funnel, FunnelChart as FunnelRoot, type FunnelTrapezoidItem } from 'recharts'
import { usePhone } from '../components/use-phone'
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '../primitives/chart'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { ChartCard, ValuesTable } from './frame'
import { ItemPlot } from './item-plot'
import { sequenceKeyTarget, trapezoidPath } from './plot-logic'
import {
  CHART_MOTION_MS,
  plotValue,
  toneColour,
  useChartMotion,
  useFormatValue,
  type ChartStateProps,
  type ChartTone,
} from './shared'

/*
 * FunnelChart (P5.93 item 44, owner: "CRM conversion"): how many reach each stage of a process,
 * from the first down, on Recharts' Funnel with our own shapes.
 * - One meaning: every stage in the main blue (a stage that means a state takes its tone), 2px of
 *   the card between them; each stage's width follows its value (drawing only, D4).
 * - Each stage is named at the page's start, on its row (HTML: it wraps, never cut, and keeps its
 *   direction): its name, and its value with the application's share ("38,2%" — the conversion is
 *   the application's, never computed). The text never stands on the data colour.
 * - Keys: the plot is one Tab stop; ArrowDown / ArrowUp (and the arrows along the line) move
 *   between the stages, show the tooltip and announce the stage.
 * - A funnel is symmetric: only its names move to the start side in right-to-left.
 */

/** One stage: its value and the application's share. */
export interface FunnelStage {
  key: string
  label: string
  /** A decimal string. */
  value: string | null
  /** The application's share or conversion, written ("38,2%"). */
  share?: string
  /** A stage that means a state takes the tone's colour. */
  tone?: ChartTone
}

export interface FunnelChartProps extends ChartStateProps {
  title: string
  description?: string
  stages: readonly FunnelStage[]
  /** The values' name, in the tooltip and the table ("Deals"). Default: the title. */
  valueLabel?: string
  /** The shares' name, in the tooltip and the table ("Conversion"). */
  shareLabel?: string
  currency?: string
  decimals?: number
  /** The plot's height in pixels. Default 280 (240 on phones). */
  height?: number
  controls?: ReactNode
  layout?: 'desktop' | 'phone'
  className?: string
}

/** How many reach each stage of a process, from the first down. */
export function FunnelChart(props: FunnelChartProps) {
  const { direction } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const animate = useChartMotion()
  const write = useFormatValue(props.currency, props.decimals)
  const height = props.height ?? (phone ? 240 : 280)
  const valueLabel = props.valueLabel ?? props.title

  const fill = (stage: FunnelStage) =>
    stage.tone === undefined ? 'var(--liro-chart-main)' : toneColour(stage.tone)
  const drawn = props.stages.filter((stage) => (plotValue(stage.value) ?? 0) > 0)
  const data = drawn.map((stage) => ({ ...stage, plot: plotValue(stage.value) ?? 0 }))
  const byKey = new Map(props.stages.map((stage) => [stage.key, stage]))
  const keys = drawn.map((stage) => stage.key)
  const config: ChartConfig = Object.fromEntries(
    drawn.map((stage) => [stage.key, { label: stage.label, color: fill(stage) }]),
  )

  const rows = (stage: FunnelStage) => [
    { key: 'value', name: valueLabel, text: write(stage.value), color: fill(stage) },
    ...(stage.share === undefined
      ? []
      : [{ key: 'share', name: props.shareLabel ?? '', text: stage.share, color: fill(stage) }]),
  ]

  const shape = (item: FunnelTrapezoidItem) => {
    const stage = item.payload as FunnelStage | undefined
    if (stage === undefined) return <g />
    const x = item.x
    const y = item.y
    const upper = item.upperWidth
    const shapeHeight = item.height
    return (
      <g data-chart-item={stage.key}>
        <path
          d={trapezoidPath(x, y, upper, item.lowerWidth, shapeHeight)}
          strokeWidth={2}
          strokeLinejoin="round"
          style={{ fill: fill(stage), stroke: 'var(--liro-surface-raised)' }}
        />
      </g>
    )
  }

  const table = (
    <ValuesTable
      title={props.title}
      categories={props.stages}
      series={[
        { key: 'value', label: valueLabel },
        ...(props.stages.some((stage) => stage.share !== undefined)
          ? [{ key: 'share', label: props.shareLabel ?? '' }]
          : []),
      ]}
      values={{
        value: Object.fromEntries(props.stages.map((stage) => [stage.key, stage.value])),
        share: Object.fromEntries(props.stages.map((stage) => [stage.key, stage.share ?? null])),
      }}
      write={(value) => value ?? '—'}
      writeSeries={{ value: write }}
    />
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
      empty={drawn.length === 0}
      skeleton="bars"
      height={height}
      phone={phone}
      table={table}
    >
      <div className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3">
        <ul
          aria-hidden="true"
          className="m-0 flex max-w-60 list-none flex-col p-0 text-xs"
          style={{ height }}
        >
          {drawn.map((stage) => (
            <li
              key={stage.key}
              className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden"
            >
              <span className={cn('text-primary', TEXT_DIRECTION)}>{stage.label}</span>
              <span className={cn('text-secondary tabular-nums', TEXT_DIRECTION)}>
                {[write(stage.value), stage.share ?? ''].filter((part) => part !== '').join(' · ')}
              </span>
            </li>
          ))}
        </ul>
        <ItemPlot
          label={props.title}
          keys={keys}
          height={height}
          keyTarget={(from, event) => {
            const index = from === null ? -1 : keys.indexOf(from)
            const next = sequenceKeyTarget(index, event.key, keys.length, direction)
            return next === null ? null : (keys[next] ?? null)
          }}
          tooltip={(key) => {
            const stage = byKey.get(key)
            if (stage === undefined) return null
            return (
              <ChartTooltipContent direction={direction} label={stage.label} rows={rows(stage)} />
            )
          }}
          announce={(key) => {
            const stage = byKey.get(key)
            if (stage === undefined) return ''
            const parts = rows(stage).map((row) => `${row.name} ${row.text}`.trim())
            return `${stage.label}: ${parts.join(', ')}`
          }}
        >
          {() => (
            <ChartContainer config={config} height={height}>
              <FunnelRoot
                accessibilityLayer={false}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              >
                <Funnel
                  data={data}
                  dataKey="plot"
                  nameKey="label"
                  lastShapeType="rectangle"
                  shape={shape}
                  isAnimationActive={animate}
                  animationDuration={CHART_MOTION_MS}
                />
              </FunnelRoot>
            </ChartContainer>
          )}
        </ItemPlot>
      </div>
    </ChartCard>
  )
}
