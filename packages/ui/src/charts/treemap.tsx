import type { ReactElement, ReactNode } from 'react'
import { Treemap as TreemapRoot, type TreemapNode } from 'recharts'
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
import { sequenceKeyTarget, textWidth, treemapLeaves } from './plot-logic'
import {
  CHART_MOTION_MS,
  categoricalColour,
  plotValue,
  toneColour,
  useChartMotion,
  useFormatValue,
  type ChartPalette,
  type ChartStateProps,
  type ChartTone,
} from './shared'

/*
 * Treemap (P5.93 item 44, owner: "expenses by account group"): parts of a whole as rectangles
 * whose areas follow their values, optionally in groups, on Recharts' Treemap with our own blocks.
 * - Without groups every block is the main blue; with groups each group takes a hue of the
 *   categorical palette (they are the categories), named in the legend; a block that means a state
 *   takes its tone. Blocks are 2px apart (the card between them). Areas follow the values (drawing
 *   only, D4); a group's total and every share are the application's.
 * - A block names itself on a small raised tag when the name fits (and its value under it when
 *   there is room); a smaller block leaves it out — the tooltip and the table say it, never cut.
 * - Right-to-left: the blocks are laid out from the right.
 * - Keys: the plot is one Tab stop; the arrows walk the blocks in the application's order (group by
 *   group), show the tooltip (name, group, value, share) and announce it.
 * - More than five parts with values to compare precisely: a horizontal BarChart reads better.
 */

/** One block, or a group of blocks (one level). */
export interface TreemapItem {
  key: string
  label: string
  /** A decimal string; a group's total is the application's. */
  value: string | null
  /** The application's share, written ("12,4%"). */
  share?: string
  /** A block that means a state takes the tone's colour. */
  tone?: ChartTone
  /** The group's blocks. */
  children?: readonly TreemapItem[]
}

export interface TreemapProps extends ChartStateProps {
  title: string
  description?: string
  items: readonly TreemapItem[]
  /** The values' name, in the tooltip and the table ("Amount"). Default: the title. */
  valueLabel?: string
  /** The shares' name, in the tooltip and the table ("Share"). */
  shareLabel?: string
  currency?: string
  decimals?: number
  /** Default: 'categorical' with groups (a hue per group), else 'default' (the main blue). */
  palette?: ChartPalette
  /** The plot's height in pixels. Default 300 (260 on phones). */
  height?: number
  controls?: ReactNode
  /** The key figures as toggle buttons (a ChartSeriesToggle) at the header's end (P5.93 item 42). */
  toggle?: ReactNode
  layout?: 'desktop' | 'phone'
  className?: string
}

/** Parts of a whole as nested rectangles: many parts, in groups. */
export function Treemap(props: TreemapProps) {
  const { direction } = useLiro()
  const rtl = direction === 'rtl'
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const animate = useChartMotion()
  const write = useFormatValue(props.currency, props.decimals)
  const height = props.height ?? (phone ? 260 : 300)
  const valueLabel = props.valueLabel ?? props.title
  const grouped = props.items.some((item) => item.children !== undefined)
  const palette = props.palette ?? (grouped ? 'categorical' : 'default')

  const groupColour = (index: number) =>
    palette === 'categorical' ? categoricalColour(index) : 'var(--liro-chart-main)'
  const leaves = treemapLeaves(props.items)
  const byKey = new Map(leaves.map((leaf) => [leaf.item.key, leaf]))
  const colourOf = (key: string) => {
    const leaf = byKey.get(key)
    if (leaf === undefined) return 'currentColor'
    if (leaf.item.tone !== undefined) return toneColour(leaf.item.tone)
    return groupColour(leaf.groupIndex)
  }
  const keys = leaves.map((leaf) => leaf.item.key)
  const config: ChartConfig = {}

  const toData = (item: TreemapItem): Record<string, unknown> =>
    item.children === undefined
      ? { key: item.key, label: item.label, plot: plotValue(item.value) ?? 0 }
      : {
          key: item.key,
          label: item.label,
          children: item.children.filter((child) => (plotValue(child.value) ?? 0) > 0).map(toData),
        }
  const data = props.items
    .filter((item) =>
      item.children === undefined
        ? (plotValue(item.value) ?? 0) > 0
        : item.children.some((child) => (plotValue(child.value) ?? 0) > 0),
    )
    .map(toData)

  const rows = (item: TreemapItem) => [
    { key: 'value', name: valueLabel, text: write(item.value), color: colourOf(item.key) },
    ...(item.share === undefined
      ? []
      : [
          {
            key: 'share',
            name: props.shareLabel ?? '',
            text: item.share,
            color: colourOf(item.key),
          },
        ]),
  ]

  const legend = grouped ? (
    <ChartLegendContent
      items={props.items.map((item, index) => ({
        key: item.key,
        label: item.label,
        color: item.tone === undefined ? groupColour(index) : toneColour(item.tone),
      }))}
    />
  ) : undefined

  const head = 'border-0 border-b border-solid border-default px-2 py-1.5 font-semibold'
  const cell = 'border-0 border-b border-solid border-subtle px-2 py-1.5'
  const withShare = leaves.some((leaf) => leaf.item.share !== undefined)
  const tableRow = (item: TreemapItem, child: boolean) => (
    <tr key={item.key}>
      <th
        scope="row"
        className={cn(
          cell,
          'text-start',
          child ? 'ps-6 font-regular' : item.children === undefined ? 'font-regular' : '',
        )}
      >
        <span className={TEXT_ISOLATE}>{item.label}</span>
      </th>
      <td
        className={cn(
          cell,
          'text-end tabular-nums',
          item.children !== undefined && 'font-semibold',
        )}
      >
        <bdi>{write(item.value)}</bdi>
      </td>
      {withShare && (
        <td
          className={cn(
            cell,
            'text-end tabular-nums',
            item.children !== undefined && 'font-semibold',
          )}
        >
          <bdi>{item.share ?? ''}</bdi>
        </td>
      )}
    </tr>
  )
  const table = (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-sans text-sm text-primary">
        <caption className="sr-only">{props.title}</caption>
        <thead>
          <tr>
            <th scope="col" className={cn(head, 'text-start')} />
            <th scope="col" className={cn(head, 'text-end')}>
              <span className={TEXT_ISOLATE}>{valueLabel}</span>
            </th>
            {withShare && (
              <th scope="col" className={cn(head, 'text-end')}>
                <span className={TEXT_ISOLATE}>{props.shareLabel ?? ''}</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {props.items.flatMap((item) => [
            tableRow(item, false),
            ...(item.children ?? []).map((child) => tableRow(child, true)),
          ])}
        </tbody>
      </table>
    </div>
  )

  const describe = (key: string) => byKey.get(key) ?? null

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
      empty={data.length === 0}
      skeleton="block"
      height={height}
      phone={phone}
      legend={legend}
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
          const leaf = describe(key)
          if (leaf === null) return null
          return (
            <ChartTooltipContent
              direction={direction}
              label={
                <>
                  {leaf.item.label}
                  {leaf.group !== undefined && (
                    <span className={cn('block font-regular text-secondary', TEXT_DIRECTION)}>
                      {leaf.group.label}
                    </span>
                  )}
                </>
              }
              rows={rows(leaf.item)}
            />
          )
        }}
        announce={(key) => {
          const leaf = describe(key)
          if (leaf === null) return ''
          const parts = rows(leaf.item).map((row) => `${row.name} ${row.text}`.trim())
          const name = [leaf.item.label, leaf.group?.label].filter(Boolean).join(', ')
          return `${name}: ${parts.join(', ')}`
        }}
      >
        {(width) => {
          const content = (node: TreemapNode): ReactElement => {
            const key = typeof node.key === 'string' ? node.key : ''
            const leaf = byKey.get(key)
            // Groups are not drawn: their blocks cover them.
            if (node.depth === 0 || leaf === undefined) return <g />
            const x = rtl ? width - node.x - node.width : node.x
            const text = leaf.item.label
            const second = write(leaf.item.value)
            const fitsName = textWidth(text, 12) + 12 <= node.width - 8 && node.height >= 26
            const twoLines =
              fitsName && node.height >= 48 && textWidth(second, 12) + 12 <= node.width - 8
            const tagWidth =
              Math.max(textWidth(text, 12), twoLines ? textWidth(second, 12) : 0) + 12
            const tagHeight = twoLines ? 36 : 20
            const tagStart = rtl ? x + node.width - 4 - tagWidth : x + 4
            return (
              <g data-chart-item={key}>
                <rect
                  x={x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx={2}
                  strokeWidth={2}
                  style={{ fill: colourOf(key), stroke: 'var(--liro-surface-raised)' }}
                />
                {fitsName && (
                  // On a raised tag at the block's start: the text never stands on the colour.
                  <g aria-hidden="true">
                    <rect
                      x={tagStart}
                      y={node.y + 4}
                      width={tagWidth}
                      height={tagHeight}
                      rx={4}
                      style={{ fill: 'var(--liro-surface-raised)' }}
                    />
                    <text
                      x={tagStart + tagWidth / 2}
                      y={node.y + 4 + (twoLines ? 10 : tagHeight / 2)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={12}
                      unicodeBidi="plaintext"
                      style={{ fill: 'var(--liro-text-primary)' }}
                    >
                      {text}
                    </text>
                    {twoLines && (
                      <text
                        x={tagStart + tagWidth / 2}
                        y={node.y + 4 + 26}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={12}
                        style={{ fill: 'var(--liro-text-secondary)' }}
                      >
                        {second}
                      </text>
                    )}
                  </g>
                )}
              </g>
            )
          }
          return (
            <ChartContainer config={config} height={height}>
              <TreemapRoot
                data={data}
                dataKey="plot"
                nameKey="label"
                type="flat"
                aspectRatio={4 / 3}
                content={content}
                isAnimationActive={animate}
                animationDuration={CHART_MOTION_MS}
              />
            </ChartContainer>
          )
        }}
      </ItemPlot>
    </ChartCard>
  )
}
