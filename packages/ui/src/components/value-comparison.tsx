import { Check, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Skeleton } from './progress'
import { usePhone } from './use-phone'

/*
 * ValueComparison (BUILD-PLAN P5.33): the same things as two sources record them, side by side,
 * the differences marked — our open items beside a partner's, a record beside its copy, a
 * document's fields beside what the other side sent. It compares nothing: which rows differ, and
 * why, is the application's (`differs`, `note`).
 * - Desktop: a table — the row's name (sm medium), the two sources' values (sm, numbers tabular
 *   at the end of their cell), then the result in words: "Same" with a Check in text.secondary,
 *   or "Differs" (or the application's `note`: "Only in their statement") with a TriangleAlert in
 *   status.warning.fg, weight 500. A differing row lies on status.warning.bg — with the icon and
 *   the words, never colour alone. Above it "2 of 5 differ", politely announced as rows change.
 * - Phones (`layout`, default below 48em): one card per row, each value labelled with its
 *   source's name, the result under them.
 * - Two sources, or three (P5.49: a purchase order, its goods receipt and the supplier's invoice
 *   side by side — the three-way match); every row has one value per source.
 * - A value the source does not have is the application's words ("Not in our books"); `null`
 *   shows "—". Loading: three skeleton rows; no rows: `empty` ("Nothing to compare").
 */

/** The sources' names or values: two, or three (P5.49). */
export type ComparisonValues =
  readonly [ReactNode, ReactNode] | readonly [ReactNode, ReactNode, ReactNode]

export interface ComparisonRow {
  id: string
  /** The thing compared ("ES-2026-0412, invoice of 05.08.2026"). From the application. */
  label: ReactNode
  /** One value per source, in the order of `columns`; null shows "—". */
  values: ComparisonValues
  /** The application says the two differ. */
  differs?: boolean
  /** The result in the application's words ("Only in their statement"), in place of "Differs". */
  note?: ReactNode
  /** The values are figures: tabular, at the end of their cells. */
  numeric?: boolean
}

export interface ValueComparisonProps {
  /** Names the comparison ("Open items at 30.09.2026"). */
  label: string
  /**
   * The sources' names ("Our books", "Their statement"): two, or three ("Order", "Receipt",
   * "Invoice"; P5.49). Each row gives a value for every source.
   */
  columns: ComparisonValues
  rows: readonly ComparisonRow[]
  /** The first column's heading. Default `messages['comparison.item']`. */
  rowHeader?: ReactNode
  /** 'phone' shows cards; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  /** The application is gathering the values: three skeleton rows. */
  loading?: boolean
  /** Shown instead of the rows when there are none. Default `messages['comparison.empty']`. */
  empty?: ReactNode
  className?: string
}

/** How many rows the application marks as differing, and how many there are. */
export function valueComparisonCounts(rows: readonly Pick<ComparisonRow, 'differs'>[]): {
  differ: number
  total: number
} {
  return { differ: rows.filter((row) => row.differs === true).length, total: rows.length }
}

function Value({ value }: { value: ReactNode }) {
  return value === null || value === undefined || value === '' ? '—' : value
}

function Result({ row }: { row: ComparisonRow }) {
  const { messages } = useLiro()
  if (row.differs === true) {
    return (
      <span className="inline-flex items-start gap-1 text-sm font-medium text-status-warning-fg">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <span className={TEXT_DIRECTION}>{row.note ?? messages['comparison.differs']}</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-start gap-1 text-sm text-secondary">
      <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      <span className={TEXT_DIRECTION}>{row.note ?? messages['comparison.same']}</span>
    </span>
  )
}

/** Two or three sources' values side by side, the differences the application found marked in words. */
export function ValueComparison(props: ValueComparisonProps) {
  const { messages, format } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const counts = valueComparisonCounts(props.rows)
  const countText = messages['comparison.count'](
    counts.differ,
    format.number(String(counts.differ)),
    counts.total,
    format.number(String(counts.total)),
  )
  const sources = props.columns
  // The sources' headings stand over their values: at the end when every row holds figures.
  const numericColumns = props.rows.length > 0 && props.rows.every((row) => row.numeric === true)

  return (
    <div
      data-slot="value-comparison"
      className={cn('flex min-w-0 flex-col gap-2 font-sans', props.className)}
    >
      <p role="status" className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
        {props.loading === true || props.rows.length === 0 ? '' : countText}
      </p>
      {props.loading === true ? (
        <div
          aria-busy="true"
          aria-label={props.label}
          role="group"
          data-slot="value-comparison-loading"
          className="flex flex-col gap-3 rounded-md border border-solid border-default bg-surface-raised p-3"
        >
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-5 w-full" />
          ))}
        </div>
      ) : props.rows.length === 0 ? (
        <p
          className={cn(
            'm-0 rounded-md border border-solid border-default bg-surface-raised p-3 text-sm text-secondary',
            TEXT_DIRECTION,
          )}
        >
          {props.empty ?? messages['comparison.empty']}
        </p>
      ) : phone ? (
        <ul aria-label={props.label} className="m-0 flex list-none flex-col gap-2 p-0">
          {props.rows.map((row) => (
            <li
              key={row.id}
              data-differs={row.differs === true ? 'true' : undefined}
              className={cn(
                'flex flex-col gap-2 rounded-md border border-solid p-3',
                row.differs === true
                  ? 'border-status-warning-border bg-status-warning-bg'
                  : 'border-default bg-surface-raised',
              )}
            >
              <span className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}>
                {row.label}
              </span>
              <dl
                className={cn(
                  'm-0 grid gap-x-4 gap-y-1',
                  sources.length === 3 ? 'grid-cols-3' : 'grid-cols-2',
                )}
              >
                {sources.map((source, index) => (
                  <div key={index} className="flex min-w-0 flex-col gap-0.5">
                    <dt className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{source}</dt>
                    <dd
                      className={cn(
                        'm-0 text-sm text-primary',
                        row.numeric === true && 'tabular-nums',
                        TEXT_ISOLATE,
                      )}
                    >
                      <Value value={row.values[index]} />
                    </dd>
                  </div>
                ))}
              </dl>
              <Result row={row} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="min-w-0 overflow-x-auto rounded-md border border-solid border-default">
          <table className="w-full border-collapse bg-surface-raised text-start">
            <caption className="sr-only">{props.label}</caption>
            <thead>
              <tr className="border-0 border-b border-solid border-default">
                {[props.rowHeader ?? messages['comparison.item'], ...sources].map(
                  (heading, index) => (
                    <th
                      key={index}
                      scope="col"
                      className={cn(
                        'px-3 py-2 text-xs font-medium text-secondary',
                        index > 0 && numericColumns ? 'text-end' : 'text-start',
                      )}
                    >
                      <span className={TEXT_ISOLATE}>{heading}</span>
                    </th>
                  ),
                )}
                <th scope="col" className="px-3 py-2 text-start text-xs font-medium text-secondary">
                  <span className={TEXT_ISOLATE}>{messages['comparison.result']}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {props.rows.map((row) => (
                <tr
                  key={row.id}
                  data-differs={row.differs === true ? 'true' : undefined}
                  className={cn(
                    'border-0 border-b border-solid border-subtle last:border-b-0',
                    row.differs === true && 'bg-status-warning-bg',
                  )}
                >
                  <th
                    scope="row"
                    className="px-3 py-2 text-start align-top text-sm font-medium text-primary"
                  >
                    <span className={TEXT_DIRECTION}>{row.label}</span>
                  </th>
                  {row.values.map((value, index) => (
                    <td
                      key={index}
                      className={cn(
                        'px-3 py-2 align-top text-sm text-primary',
                        row.numeric === true
                          ? 'text-end whitespace-nowrap tabular-nums'
                          : 'text-start',
                      )}
                    >
                      <span className={TEXT_ISOLATE}>
                        <Value value={value} />
                      </span>
                    </td>
                  ))}
                  <td className="px-3 py-2 align-top">
                    <Result row={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
