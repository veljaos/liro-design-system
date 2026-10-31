import { useId, type ReactNode } from 'react'
import { usePhone } from '../components/use-phone'
import { TEXT_ISOLATE } from '../primitives/classes'
import { ChartTooltipContent } from '../primitives/chart-parts'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { CategoryLabels } from './axes'
import { ChartCard, ValuesTable } from './frame'
import { ItemPlot } from './item-plot'
import { gridBoxes, gridKeyTarget, physicalX, spacedLabels } from './plot-logic'
import {
  useFormatValue,
  type ChartCategory,
  type ChartStateProps,
  type ChartValues,
} from './shared'
import { NoDataPattern, StepLegend, useStepText } from './step-legend'
import { stepCount, stepShade, valueStep, type StepRamp } from './steps'

/*
 * Heatmap ("sales by weekday × hour"): a value per cell of rows × columns,
 * each cell shaded by its value's step, in our own SVG (Recharts has no heatmap).
 * - One meaning in shades, as RegionChart: the application's `breaks` cut the values into at most
 *   five steps, compared exactly as decimal strings; each step the main blue (or neutral
 *   grey) laid on the card at 25% up to 100%. A missing value is hatched and says "No data",
 *   never 0. The legend writes the steps' ranges through `format`, or the application's words.
 * - Rows stand top to bottom, their names at the page's start; columns run from the start (the
 *   hours from the right in right-to-left), their names under the plot, as many as fit.
 * - Cells are 2px apart; a row is 28px high (24px on phones).
 * - Keys: the plot is one Tab stop; the arrows move between the cells with the screen, Home / End
 *   to a row's ends (with Ctrl, the grid's), each cell's tooltip shown and announced
 *   ("Fri, 18:00: 412,300.00 RSD").
 */

export interface HeatmapProps extends ChartStateProps {
  title: string
  description?: string
  /** Top to bottom ("Mon" … "Sun"). */
  rows: readonly ChartCategory[]
  /** From the start ("08:00" … "20:00"). */
  columns: readonly ChartCategory[]
  /** By row key, then column key: decimal strings; null (or missing) for "No data". */
  values: ChartValues
  /** The values' name, in the tooltip ("Sales"). */
  valueLabel: string
  /**
   * Where the steps change, ascending decimal strings: n breaks make n + 1 steps (at most five;
   * four breaks). A value at a break belongs to the step above it.
   */
  breaks: readonly string[]
  /** The application's words for the steps, lowest first; default the ranges through `format`. */
  stepLabels?: readonly string[]
  /** The shades' meaning: the charts' main blue (default) or neutral grey. */
  ramp?: StepRamp
  currency?: string
  decimals?: number
  /** A row's height in pixels. Default 28 (24 on phones). */
  rowHeight?: number
  controls?: ReactNode
  /** The key figures as toggle buttons (a ChartSeriesToggle) at the header's end. */
  toggle?: ReactNode
  layout?: 'desktop' | 'phone'
  className?: string
}

const GAP = 2

/** Values over two dimensions as shaded cells: when, and where, the most happens. */
export function Heatmap(props: HeatmapProps) {
  const { direction, messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const write = useFormatValue(props.currency, props.decimals)
  const ramp = props.ramp ?? 'main'
  const pattern = `liro-heat-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const rowHeight = props.rowHeight ?? (phone ? 24 : 28)
  const rows = props.rows.length
  const columns = props.columns.length
  const height = Math.max(rows * rowHeight + (rows - 1) * GAP, 0)
  const count = stepCount(props.breaks)
  const stepText = useStepText(props.breaks, write, props.stepLabels)

  const value = (row: number, column: number) =>
    props.values[props.rows[row]?.key ?? '']?.[props.columns[column]?.key ?? ''] ?? null
  const valueText = (raw: string | null | undefined) =>
    valueStep(raw, []) === null ? messages['map.noData'] : write(raw)
  const cellName = (row: number, column: number) =>
    messages['chart.cellName'](props.rows[row]?.label ?? '', props.columns[column]?.label ?? '')

  const keys = props.rows.flatMap((_, row) =>
    props.columns.map((__, column) => `${String(row)}:${String(column)}`),
  )
  const parse = (key: string) => {
    const [row, column] = key.split(':').map(Number)
    return { row: row ?? 0, column: column ?? 0 }
  }
  let missing = false
  let any = false
  for (const key of keys) {
    const { row, column } = parse(key)
    if (valueStep(value(row, column), props.breaks) === null) missing = true
    else any = true
  }

  const table = (
    <ValuesTable
      title={props.title}
      categories={props.rows}
      series={props.columns}
      values={Object.fromEntries(
        props.columns.map((column) => [
          column.key,
          Object.fromEntries(
            props.rows.map((row) => [row.key, props.values[row.key]?.[column.key] ?? null]),
          ),
        ]),
      )}
      write={valueText}
    />
  )

  const shown = new Set(spacedLabels(columns, phone ? 4 : 8))

  return (
    <div data-slot="heatmap" className={props.className}>
      <NoDataPattern id={pattern} />
      <ChartCard
        title={props.title}
        {...(props.description === undefined ? {} : { description: props.description })}
        {...(props.controls === undefined ? {} : { controls: props.controls })}
        {...(props.toggle === undefined ? {} : { toggle: props.toggle })}
        {...(props.loading === undefined ? {} : { loading: props.loading })}
        {...(props.defaultView === undefined ? {} : { defaultView: props.defaultView })}
        {...(props.error === undefined ? {} : { error: props.error })}
        empty={!any}
        skeleton="block"
        height={Math.max(height, 120)}
        phone={phone}
        legend={
          <StepLegend
            breaks={props.breaks}
            ramp={ramp}
            stepText={stepText}
            pattern={pattern}
            missing={missing}
          />
        }
        table={table}
      >
        <div className="grid grid-cols-[auto_minmax(0,1fr)]">
          <div
            aria-hidden="true"
            className="flex flex-col pe-2 text-xs text-secondary"
            style={{ gap: GAP }}
          >
            {props.rows.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-end"
                style={{ height: rowHeight }}
              >
                <span className={cn('whitespace-nowrap', TEXT_ISOLATE)}>{row.label}</span>
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
              return (
                <ChartTooltipContent
                  direction={direction}
                  indicator="none"
                  label={cellName(row, column)}
                  rows={[
                    {
                      key: 'value',
                      name: props.valueLabel,
                      text: valueText(value(row, column)),
                      color: '',
                    },
                  ]}
                />
              )
            }}
            announce={(key) => {
              const { row, column } = parse(key)
              return `${cellName(row, column)}: ${valueText(value(row, column))}`
            }}
            after={(width) => {
              const boxes = gridBoxes(1, columns, width, rowHeight, GAP)[0] ?? []
              return (
                <CategoryLabels
                  labels={props.columns.flatMap((column, index) => {
                    const box = boxes[index]
                    if (!shown.has(index) || box === undefined) return []
                    const x = physicalX(box.fromStart, box.width, width, direction) + box.width / 2
                    return [{ key: column.key, text: column.label, x }]
                  })}
                />
              )
            }}
          >
            {(width) => (
              <svg aria-hidden="true" width={width} height={height} className="block">
                {gridBoxes(rows, columns, width, height, GAP).flatMap((line, row) =>
                  line.map((box, column) => {
                    const step = valueStep(value(row, column), props.breaks)
                    const shade = step === null ? null : stepShade(step, count, ramp)
                    return (
                      <rect
                        key={`${String(row)}:${String(column)}`}
                        data-chart-item={`${String(row)}:${String(column)}`}
                        x={physicalX(box.fromStart, box.width, width, direction)}
                        y={box.top}
                        width={box.width}
                        height={box.height}
                        rx={2}
                        style={
                          shade === null
                            ? { fill: `url(#${pattern})` }
                            : { fill: shade.colour, fillOpacity: shade.opacity }
                        }
                      />
                    )
                  }),
                )}
              </svg>
            )}
          </ItemPlot>
        </div>
      </ChartCard>
    </div>
  )
}
