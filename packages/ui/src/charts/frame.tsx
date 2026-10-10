import { AlertTriangle, ChartColumn, Table2 } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Button, CompactIconButton } from '../components/button'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import type { ChartCategory, ChartSeries, ChartStateProps, ChartValues } from './shared'

/*
 * The card every chart stands in (P4.6, kept in P4.7a): radius lg, border.default, padding md, no
 * shadow; the title (h3, sm semibold) and a description under it; the application's controls (a
 * time range, a series toggle) and the 28px "Show as table" / "Show as chart" button at the end of
 * the header; the legend; the plot. On phones the header stacks (the controls under the title) and
 * the legend stands under the plot.
 *
 * States: loading draws a chart-shaped skeleton in the plot's place (no spinner, `aria-busy`);
 * empty says `messages['chart.noData']`; an error says its message with Retry. The plot keeps its
 * height in every state, so nothing moves when the data arrives.
 */

export type ChartSkeletonShape = 'columns' | 'bars' | 'round'

const COLUMN_HEIGHTS = [46, 62, 54, 78, 66, 88, 72, 58, 80, 70, 92, 64]

/** A chart-shaped placeholder: columns, bars (horizontal) or a ring. */
function ChartSkeleton({ shape, height }: { shape: ChartSkeletonShape; height: number }) {
  if (shape === 'round') {
    const size = Math.min(height - 16, 200)
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Skeleton className="rounded-full" style={{ width: size, height: size }} />
      </div>
    )
  }
  if (shape === 'bars') {
    return (
      <div className="flex flex-col justify-around" style={{ height }}>
        {COLUMN_HEIGHTS.slice(0, 5).map((width, index) => (
          <Skeleton key={index} className="h-4 rounded-sm" style={{ width: `${String(width)}%` }} />
        ))}
      </div>
    )
  }
  return (
    <div
      className="flex items-end justify-between gap-2 border-0 border-b border-solid border-subtle"
      style={{ height }}
    >
      {COLUMN_HEIGHTS.map((columnHeight, index) => (
        <Skeleton
          key={index}
          className="flex-1 rounded-sm rounded-b-none"
          style={{ height: `${String(columnHeight)}%` }}
        />
      ))}
    </div>
  )
}

export interface ChartCardProps extends ChartStateProps {
  title: string
  description?: string
  /** The application's controls in the header: a time-range select, a series toggle. */
  controls?: ReactNode
  legend?: ReactNode
  /** The same values as a table ("Show as table"). */
  table: ReactNode
  /** Nothing to draw: says `messages['chart.noData']`. */
  empty?: boolean
  skeleton: ChartSkeletonShape
  height: number
  phone: boolean
  className?: string
  /** The plot. */
  children: ReactNode
}

/** A chart's card: header, legend, plot or table, and the loading, empty and error states. */
export function ChartCard(props: ChartCardProps) {
  const { messages } = useLiro()
  const [asTable, setAsTable] = useState(props.defaultView === 'table')
  const titleId = useId()
  const descriptionId = useId()
  const ready = props.loading !== true && props.error === undefined && props.empty !== true
  const showTable = ready && asTable

  let body: ReactNode
  if (props.loading === true) {
    body = (
      <div role="status" aria-label={messages['chart.loading']}>
        <ChartSkeleton shape={props.skeleton} height={props.height} />
      </div>
    )
  } else if (props.error !== undefined) {
    const { onRetry } = props.error
    body = (
      <div
        className="flex flex-col items-center justify-center gap-3 text-center"
        style={{ height: props.height }}
      >
        <p
          role="alert"
          className={cn(
            'm-0 flex items-center gap-1.5 text-sm text-status-danger-fg',
            TEXT_ISOLATE,
          )}
        >
          <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
          {props.error.message ?? messages['chart.error']}
        </p>
        <Button
          intent="refresh"
          emphasis="secondary"
          label={messages['chart.retry']}
          onClick={() => {
            onRetry()
          }}
        />
      </div>
    )
  } else if (props.empty === true) {
    body = (
      <div className="flex items-center justify-center" style={{ height: props.height }}>
        <p className={cn('m-0 text-center text-sm text-secondary', TEXT_ISOLATE)}>
          {messages['chart.noData']}
        </p>
      </div>
    )
  } else if (showTable) {
    body = props.table
  } else {
    body = (
      <div
        role="group"
        aria-labelledby={titleId}
        {...(props.description === undefined ? {} : { 'aria-describedby': descriptionId })}
        className="min-w-0"
      >
        {props.children}
      </div>
    )
  }

  const legend = ready && !showTable ? props.legend : undefined
  return (
    <section
      data-slot="chart"
      aria-labelledby={titleId}
      aria-busy={props.loading === true}
      className={cn(
        'box-border flex min-w-0 flex-col gap-3 rounded-lg border border-solid border-default bg-surface-raised p-4 font-sans',
        props.className,
      )}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            'flex min-w-0 flex-1 gap-x-4 gap-y-2',
            props.phone ? 'flex-col' : 'flex-wrap items-start justify-between',
          )}
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <h3
              id={titleId}
              className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}
            >
              {props.title}
            </h3>
            {props.description !== undefined && (
              <p id={descriptionId} className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
                {props.description}
              </p>
            )}
          </div>
          {props.controls !== undefined && (
            <div className="flex flex-wrap items-center gap-2">{props.controls}</div>
          )}
        </div>
        {ready && (
          <CompactIconButton
            icon={asTable ? ChartColumn : Table2}
            label={asTable ? messages['chart.showChart'] : messages['chart.showTable']}
            aria-pressed={asTable}
            onClick={() => {
              setAsTable(!asTable)
            }}
          />
        )}
      </div>
      {!props.phone && legend}
      {body}
      {props.phone && legend}
    </section>
  )
}

/**
 * The values as a table: the chart's text alternative and its "Show as table" view.
 * Right-to-left (P4.9, the owner's review: headers and columns stood on the wrong sides): a cell
 * keeps the page's direction and its `text-start` / `text-end`; only the text inside it is
 * isolated (an inline span or `bdi`), because `unicode-bidi: plaintext` on the cell itself
 * resolves start and end against the text — a header of digits ("2026") is left to right and
 * moved to the other side of a right-to-left cell.
 */
export function ValuesTable({
  title,
  categories,
  series,
  values,
  write,
  total,
}: {
  title: string
  categories: readonly ChartCategory[]
  series: readonly Pick<ChartSeries, 'key' | 'label'>[]
  values: ChartValues
  write: (value: string | null | undefined) => string
  /** A total per category, from the application, as the last column. */
  total?: { label: string; values: Readonly<Record<string, string | null>> }
}) {
  const head = 'border-0 border-b border-solid border-default px-2 py-1.5 font-semibold'
  const cell = 'border-0 border-b border-solid border-subtle px-2 py-1.5'
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-sans text-sm text-primary">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr>
            <th scope="col" className={cn(head, 'text-start')} />
            {series.map((each) => (
              <th key={each.key} scope="col" className={cn(head, 'text-end')}>
                <span className={TEXT_ISOLATE}>{each.label}</span>
              </th>
            ))}
            {total !== undefined && (
              <th scope="col" className={cn(head, 'text-end')}>
                <span className={TEXT_ISOLATE}>{total.label}</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.key}>
              <th scope="row" className={cn(cell, 'text-start font-regular')}>
                <span className={TEXT_ISOLATE}>{category.label}</span>
              </th>
              {series.map((each) => (
                <td key={each.key} className={cn(cell, 'text-end tabular-nums')}>
                  <bdi>{write(values[each.key]?.[category.key])}</bdi>
                </td>
              ))}
              {total !== undefined && (
                <td className={cn(cell, 'text-end font-semibold tabular-nums')}>
                  <bdi>{write(total.values[category.key])}</bdi>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
