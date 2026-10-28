import type { ReactNode } from 'react'
import { Sankey, type SankeyLinkProps, type SankeyNodeProps } from 'recharts'
import { usePhone } from '../components/use-phone'
import { TEXT_ISOLATE } from '../primitives/classes'
import { ChartContainer, ChartTooltipContent } from '../primitives/chart'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { ChartCard } from './frame'
import { ItemPlot } from './item-plot'
import {
  sankeyColumn,
  sankeyColumns,
  sankeyData,
  sankeyLabelRoom,
  sequenceKeyTarget,
  textWidth,
} from './plot-logic'
import { toneColour, useFormatValue, type ChartStateProps, type ChartTone } from './shared'

/*
 * SankeyChart (P5.93 item 44, owner: "cash flow"): how amounts flow from sources through
 * accounts to their uses, on Recharts' Sankey with our own nodes and flows.
 * - Nodes are the main blue (a node that means a state takes its tone: a loss); flows are a grey
 *   wash, stronger under the pointer or the keys. A flow's width follows its amount (drawing only,
 *   D4). A node's total is the application's (`value`), never added here.
 * - Names stand beside their nodes, toward the inside of the chart, on a halo of the card, with
 *   the node's total under the name when there is room.
 * - Right-to-left: the flow runs from the right (sources at the page's start); the names keep
 *   their text direction.
 * - Keys: the plot is one Tab stop; the arrows walk the nodes, then the flows, show the tooltip and
 *   announce each ("Sales → Bank account: 4,120,000.00 RSD").
 */

/** A node: a source, an account or a use. */
export interface SankeyNode {
  key: string
  label: string
  /** The node's total, the application's (a decimal string). */
  value?: string
  /** A node that means a state takes the tone's colour. */
  tone?: ChartTone
}

/** A flow from one node to another. */
export interface SankeyFlow {
  source: string
  target: string
  /** A decimal string. */
  value: string
}

export interface SankeyChartProps extends ChartStateProps {
  title: string
  description?: string
  nodes: readonly SankeyNode[]
  flows: readonly SankeyFlow[]
  /** The amounts' name, in the tooltip and the table ("Amount"). Default: the title. */
  valueLabel?: string
  currency?: string
  decimals?: number
  /** The plot's height in pixels. Default 320 (280 on phones). */
  height?: number
  controls?: ReactNode
  /** The key figures as toggle buttons (a ChartSeriesToggle) at the header's end (P5.93 item 42). */
  toggle?: ReactNode
  layout?: 'desktop' | 'phone'
  className?: string
}

const NODE_WIDTH = 12

/** How amounts flow from sources to uses. */
export function SankeyChart(props: SankeyChartProps) {
  const { direction, messages } = useLiro()
  const rtl = direction === 'rtl'
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const write = useFormatValue(props.currency, props.decimals)
  const height = props.height ?? (phone ? 280 : 320)
  const valueLabel = props.valueLabel ?? props.title

  const data = sankeyData(props.nodes, props.flows)
  const nodeByKey = new Map(props.nodes.map((node) => [node.key, node]))
  const columns = sankeyColumns(data.nodes.length, data.links)
  const keys = [
    ...data.nodes.map((node) => `node:${node.key}`),
    ...data.links.map((link) => `flow:${String(link.index)}`),
  ]
  const fill = (node: SankeyNode | undefined) =>
    node?.tone === undefined ? 'var(--liro-chart-main)' : toneColour(node.tone)
  const flowName = (flow: SankeyFlow) =>
    messages['chart.flow'](
      nodeByKey.get(flow.source)?.label ?? flow.source,
      nodeByKey.get(flow.target)?.label ?? flow.target,
    )

  const describe = (key: string): { label: string; rows: { name: string; text: string }[] } => {
    if (key.startsWith('node:')) {
      const node = nodeByKey.get(key.slice(5))
      return {
        label: node?.label ?? '',
        rows: node?.value === undefined ? [] : [{ name: valueLabel, text: write(node.value) }],
      }
    }
    const flow = props.flows[data.links[Number(key.slice(5))]?.flow ?? -1]
    return flow === undefined
      ? { label: '', rows: [] }
      : { label: flowName(flow), rows: [{ name: valueLabel, text: write(flow.value) }] }
  }

  const head = 'border-0 border-b border-solid border-default px-2 py-1.5 font-semibold'
  const cell = 'border-0 border-b border-solid border-subtle px-2 py-1.5'
  const table = (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-sans text-sm text-primary">
        <caption className="sr-only">{props.title}</caption>
        <thead>
          <tr>
            <th scope="col" className={cn(head, 'text-start')}>
              <span className={TEXT_ISOLATE}>{messages['chart.from']}</span>
            </th>
            <th scope="col" className={cn(head, 'text-start')}>
              <span className={TEXT_ISOLATE}>{messages['chart.to']}</span>
            </th>
            <th scope="col" className={cn(head, 'text-end')}>
              <span className={TEXT_ISOLATE}>{valueLabel}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {props.flows.map((flow, index) => (
            <tr key={index}>
              <th scope="row" className={cn(cell, 'text-start font-regular')}>
                <span className={TEXT_ISOLATE}>
                  {nodeByKey.get(flow.source)?.label ?? flow.source}
                </span>
              </th>
              <td className={cn(cell, 'text-start')}>
                <span className={TEXT_ISOLATE}>
                  {nodeByKey.get(flow.target)?.label ?? flow.target}
                </span>
              </td>
              <td className={cn(cell, 'text-end tabular-nums')}>
                <bdi>{write(flow.value)}</bdi>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

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
      empty={data.links.length === 0}
      skeleton="block"
      height={height}
      phone={phone}
      table={table}
    >
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
          const { label, rows } = describe(key)
          return (
            <ChartTooltipContent
              direction={direction}
              indicator="none"
              label={label}
              rows={rows.map((row) => ({ key: row.name, ...row, color: '' }))}
            />
          )
        }}
        announce={(key) => {
          const { label, rows } = describe(key)
          return [label, ...rows.map((row) => `${row.name} ${row.text}`)].join(': ')
        }}
      >
        {(width) => {
          // Mirrored in right-to-left: a mark's x measured from the other side.
          const mirror = (x: number) => (rtl ? width - x : x)
          const node = (shape: SankeyNodeProps) => {
            const payload = shape.payload as { key?: string } | undefined
            const own = nodeByKey.get(payload?.key ?? '')
            if (own === undefined) return <g />
            const left = rtl ? width - shape.x - shape.width : shape.x
            const first = shape.x <= 1
            const last = shape.x + shape.width >= width - 1
            // Toward the inside: after a first node, before a last one (by the reading side).
            const after = (first || !last) !== rtl
            const labelX = after ? left + shape.width + 6 : left - 6
            const anchor = after ? 'start' : 'end'
            const middle = shape.y + shape.height / 2
            // A name is written only where it fits its room between the columns, never cut; the
            // tooltip and the table always say it.
            const room = sankeyLabelRoom(
              width,
              NODE_WIDTH,
              columns,
              sankeyColumn(shape.x, width, NODE_WIDTH, columns),
            )
            const valueText = own.value === undefined ? '' : write(own.value)
            const withName = textWidth(own.label, 12) <= room
            const withValue =
              withName && valueText !== '' && shape.height >= 30 && textWidth(valueText, 12) <= room
            const halo = {
              paintOrder: 'stroke' as const,
              stroke: 'var(--liro-surface-raised)',
              strokeWidth: 3,
              strokeLinejoin: 'round' as const,
            }
            return (
              <g data-chart-item={`node:${own.key}`}>
                <rect
                  data-chart-mark=""
                  x={left}
                  y={shape.y}
                  width={shape.width}
                  height={Math.max(shape.height, 1)}
                  rx={2}
                  style={{ fill: fill(own) }}
                />
                {withName && (
                  <text
                    x={labelX}
                    y={withValue ? middle - 8 : middle}
                    textAnchor={anchor}
                    dominantBaseline="central"
                    fontSize={12}
                    unicodeBidi="plaintext"
                    style={{ fill: 'var(--liro-text-primary)', ...halo }}
                  >
                    {own.label}
                  </text>
                )}
                {withValue && (
                  <text
                    x={labelX}
                    y={middle + 8}
                    textAnchor={anchor}
                    dominantBaseline="central"
                    fontSize={12}
                    style={{ fill: 'var(--liro-text-secondary)', ...halo }}
                  >
                    {valueText}
                  </text>
                )}
              </g>
            )
          }
          const link = (shape: SankeyLinkProps) => {
            const sx = mirror(shape.sourceX)
            const tx = mirror(shape.targetX)
            const scx = mirror(shape.sourceControlX)
            const tcx = mirror(shape.targetControlX)
            const path = `M${String(sx)},${String(shape.sourceY)}C${String(scx)},${String(shape.sourceY)} ${String(tcx)},${String(shape.targetY)} ${String(tx)},${String(shape.targetY)}`
            return (
              <path
                data-chart-item={`flow:${String(shape.index)}`}
                className="opacity-40 transition-opacity hover:opacity-70"
                d={path}
                fill="none"
                strokeWidth={Math.max(shape.linkWidth, 1)}
                style={{ stroke: 'var(--liro-chart-comparison)' }}
              />
            )
          }
          return (
            <ChartContainer config={{}} height={height}>
              <Sankey
                accessibilityLayer={false}
                data={{ nodes: data.nodes, links: data.links }}
                nameKey="label"
                node={node}
                link={link}
                nodeWidth={NODE_WIDTH}
                nodePadding={phone ? 16 : 24}
                margin={{ top: 8, right: 0, bottom: 8, left: 0 }}
              />
            </ChartContainer>
          )
        }}
      </ItemPlot>
    </ChartCard>
  )
}
