import type { ReactNode } from 'react'
import { usePhone } from '../components/use-phone'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { ChartTooltipContent } from '../primitives/chart-parts'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { CategoryLabels } from './axes'
import { ChartCard } from './frame'
import { ItemPlot } from './item-plot'
import { gridBoxes, gridKeyTarget, itemsInCell, physicalX } from './plot-logic'
import type { ChartCategory, ChartStateProps, ChartTone } from './shared'

/*
 * MatrixChart (P5.93 item 44, owner: "risk matrix likelihood × impact"): items placed in the cells
 * of two scales, each cell coloured by the level the application gives it, in our own SVG.
 * - The levels are the application's ("Low", "Medium", "High", "Critical"), each with a status
 *   tone — a state, so the tones' backgrounds, lines and text colours —, named in the legend; the
 *   level of each cell is the application's too. Never colour alone: the legend, the tooltip and
 *   the table say the level.
 * - Each cell writes how many items it holds; the tooltip lists them (the first six, then "+3
 *   more"), the table names every one.
 * - Rows top to bottom (the most likely first, as the application orders them), columns from the
 *   page's start (mirrored in right-to-left), each scale named (`rowLabel`, `columnLabel`).
 * - Keys: the plot is one Tab stop; the arrows move between the cells with the screen, Home / End
 *   to a row's ends (with Ctrl, the grid's), each cell's tooltip shown and announced.
 * - Phones: the same grid, rows 48px high; the table is the full list.
 */

/** A level of the matrix and its tone. */
export interface MatrixLevel {
  key: string
  label: string
  /** Default 'neutral'. */
  tone?: ChartTone | 'neutral'
}

/** One item placed in a cell. */
export interface MatrixItem {
  key: string
  label: string
  /** The row's and the column's keys. */
  row: string
  column: string
}

export interface MatrixChartProps extends ChartStateProps {
  title: string
  description?: string
  /** Top to bottom ("Almost certain" … "Rare"). */
  rows: readonly ChartCategory[]
  /** From the start ("Insignificant" … "Severe"). */
  columns: readonly ChartCategory[]
  /** The rows' scale ("Likelihood"). */
  rowLabel: string
  /** The columns' scale ("Impact"). */
  columnLabel: string
  levels: readonly MatrixLevel[]
  /** The level of each cell: by row key, then column key, a level's key. */
  cellLevels: Readonly<Record<string, Readonly<Record<string, string>>>>
  items: readonly MatrixItem[]
  /** A row's height in pixels. Default 56 (48 on phones). */
  rowHeight?: number
  controls?: ReactNode
  layout?: 'desktop' | 'phone'
  className?: string
}

const GAP = 2
const TOOLTIP_ITEMS = 6

/** Items placed by two scales, each cell coloured by its level: a risk matrix. */
export function MatrixChart(props: MatrixChartProps) {
  const { direction, format, messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const rowHeight = props.rowHeight ?? (phone ? 48 : 56)
  const rows = props.rows.length
  const columns = props.columns.length
  const height = Math.max(rows * rowHeight + (rows - 1) * GAP, 0)
  const levels = new Map(props.levels.map((level) => [level.key, level]))

  const at = (row: number, column: number) => {
    const rowKey = props.rows[row]?.key ?? ''
    const columnKey = props.columns[column]?.key ?? ''
    const level = levels.get(props.cellLevels[rowKey]?.[columnKey] ?? '')
    return { level, items: itemsInCell(props.items, rowKey, columnKey) }
  }
  const cellName = (row: number, column: number) =>
    messages['chart.cellName'](props.rows[row]?.label ?? '', props.columns[column]?.label ?? '')
  const keys = props.rows.flatMap((_, row) =>
    props.columns.map((__, column) => `${String(row)}:${String(column)}`),
  )
  const parse = (key: string) => {
    const [row, column] = key.split(':').map(Number)
    return { row: row ?? 0, column: column ?? 0 }
  }
  const tone = (level: MatrixLevel | undefined) => level?.tone ?? 'neutral'

  const legend = (
    <ul
      data-slot="chart-legend"
      className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-secondary"
    >
      {props.levels.map((level) => (
        <li key={level.key} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block size-3 shrink-0 rounded-xs border border-solid"
            style={{
              backgroundColor: `var(--liro-status-${tone(level)}-bg)`,
              borderColor: `var(--liro-status-${tone(level)}-border)`,
            }}
          />
          <span className={TEXT_DIRECTION}>{level.label}</span>
        </li>
      ))}
    </ul>
  )

  const head = 'border-0 border-b border-solid border-default px-2 py-1.5 font-semibold'
  const cell = 'border-0 border-b border-solid border-subtle px-2 py-1.5 align-top'
  const table = (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-sans text-sm text-primary">
        <caption className="sr-only">{props.title}</caption>
        <thead>
          <tr>
            <th scope="col" className={cn(head, 'text-start')}>
              <span className={TEXT_ISOLATE}>{props.rowLabel}</span>
            </th>
            {props.columns.map((column) => (
              <th key={column.key} scope="col" className={cn(head, 'text-start')}>
                <span className={TEXT_ISOLATE}>{column.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row, rowIndex) => (
            <tr key={row.key}>
              <th scope="row" className={cn(cell, 'text-start font-regular')}>
                <span className={TEXT_ISOLATE}>{row.label}</span>
              </th>
              {props.columns.map((column, columnIndex) => {
                const { level, items } = at(rowIndex, columnIndex)
                return (
                  <td key={column.key} className={cn(cell, 'text-start')}>
                    <span className={cn('block text-secondary', TEXT_DIRECTION)}>
                      {level?.label ?? ''}
                    </span>
                    {items.map((item) => (
                      <span key={item.key} className={cn('block', TEXT_DIRECTION)}>
                        {item.label}
                      </span>
                    ))}
                  </td>
                )
              })}
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
      {...(props.className === undefined ? {} : { className: props.className })}
      {...(props.loading === undefined ? {} : { loading: props.loading })}
      {...(props.defaultView === undefined ? {} : { defaultView: props.defaultView })}
      {...(props.error === undefined ? {} : { error: props.error })}
      empty={rows === 0 || columns === 0}
      skeleton="block"
      height={Math.max(height, 120)}
      phone={phone}
      legend={legend}
      table={table}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)]">
        <p
          aria-hidden="true"
          className={cn('col-span-2 m-0 pb-1 text-xs text-secondary', TEXT_DIRECTION)}
        >
          {props.rowLabel}
        </p>
        <div
          aria-hidden="true"
          className="flex max-w-32 flex-col pe-2 text-xs text-secondary"
          style={{ gap: GAP }}
        >
          {props.rows.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-end"
              style={{ height: rowHeight }}
            >
              <span className={cn('text-end', TEXT_ISOLATE)}>{row.label}</span>
            </div>
          ))}
        </div>
        <ItemPlot
          label={props.title}
          keys={keys}
          height={height}
          keyTarget={(from, event) => {
            const next = gridKeyTarget(
              from === null ? null : parse(from),
              event.key,
              rows,
              columns,
              direction,
              event.ctrlKey || event.metaKey,
            )
            return next === null ? null : `${String(next.row)}:${String(next.column)}`
          }}
          tooltip={(key) => {
            const { row, column } = parse(key)
            const { level, items } = at(row, column)
            const listed = items.slice(0, TOOLTIP_ITEMS)
            const rest = items.length - listed.length
            return (
              <ChartTooltipContent
                direction={direction}
                indicator="none"
                label={
                  <>
                    {cellName(row, column)}
                    {level !== undefined && (
                      <span className={cn('block font-regular text-secondary', TEXT_DIRECTION)}>
                        {level.label}
                      </span>
                    )}
                  </>
                }
                rows={[
                  ...(items.length === 0
                    ? [{ key: 'none', name: messages['chart.none'], text: '', color: '' }]
                    : listed.map((item) => ({
                        key: item.key,
                        name: item.label,
                        text: '',
                        color: '',
                      }))),
                  ...(rest > 0
                    ? [
                        {
                          key: 'more',
                          name: messages['chart.more'](rest, format.number(String(rest))),
                          text: '',
                          color: '',
                        },
                      ]
                    : []),
                ]}
              />
            )
          }}
          announce={(key) => {
            const { row, column } = parse(key)
            const { level, items } = at(row, column)
            const names =
              items.length === 0
                ? messages['chart.none']
                : items.map((item) => item.label).join(', ')
            return [cellName(row, column), level?.label, names].filter(Boolean).join(': ')
          }}
          after={(width) => {
            const boxes = gridBoxes(1, columns, width, rowHeight, GAP)[0] ?? []
            return (
              <>
                <CategoryLabels
                  labels={props.columns.flatMap((column, index) => {
                    const box = boxes[index]
                    if (box === undefined) return []
                    const x = physicalX(box.fromStart, box.width, width, direction) + box.width / 2
                    return [{ key: column.key, text: column.label, x }]
                  })}
                />
                <p
                  aria-hidden="true"
                  dir={direction}
                  className={cn('m-0 pt-1 text-center text-xs text-secondary', TEXT_DIRECTION)}
                >
                  {props.columnLabel}
                </p>
              </>
            )
          }}
        >
          {(width) => (
            <svg aria-hidden="true" width={width} height={height} className="block">
              {gridBoxes(rows, columns, width, height, GAP).flatMap((line, row) =>
                line.map((box, column) => {
                  const { level, items } = at(row, column)
                  const x = physicalX(box.fromStart, box.width, width, direction)
                  const colour = tone(level)
                  return (
                    <g
                      key={`${String(row)}:${String(column)}`}
                      data-chart-item={`${String(row)}:${String(column)}`}
                    >
                      <rect
                        x={x + 0.5}
                        y={box.top + 0.5}
                        width={Math.max(box.width - 1, 0)}
                        height={Math.max(box.height - 1, 0)}
                        rx={4}
                        strokeWidth={1}
                        style={{
                          fill: `var(--liro-status-${colour}-bg)`,
                          stroke: `var(--liro-status-${colour}-border)`,
                        }}
                      />
                      {items.length > 0 && (
                        <text
                          x={x + box.width / 2}
                          y={box.top + box.height / 2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={14}
                          fontWeight={600}
                          style={{ fill: `var(--liro-status-${colour}-fg)` }}
                        >
                          {format.number(String(items.length))}
                        </text>
                      )}
                    </g>
                  )
                }),
              )}
            </svg>
          )}
        </ItemPlot>
      </div>
    </ChartCard>
  )
}
