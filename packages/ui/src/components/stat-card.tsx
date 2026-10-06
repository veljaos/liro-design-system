import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'

/*
 * StatCard (P4.6, the owner's decision, docs/decisions.md "Dashboard"): one number on a dashboard.
 * - A card: radius lg, border.default, padding md, no shadow; no decorative icon.
 * - The label xs text.secondary; the value 24px semibold with tabular digits; the change under it
 *   with an arrow (ArrowUpRight or ArrowDownRight, 14px) beside its text — green or red only when
 *   the application says the change is good or bad, otherwise neutral (text.secondary); the
 *   comparison in xs text.secondary ("vs September").
 * - An optional grey 32px sparkline (text.tertiary, 2px line, no axes), drawn from the
 *   application's values. Values are decimal strings; they become numbers only to place the line
 *   (rule D4: nothing is computed or shown from them).
 * - Loading: a skeleton 104px high.
 */

export interface StatChange {
  /** The change as the application writes it ("+12,4 %"). */
  text: string
  direction: 'up' | 'down'
  /** Whether the change is good or bad; without it, neutral. */
  sentiment?: 'good' | 'bad'
}

export interface StatCardProps {
  /** From the application ("Revenue, October"). */
  label: string
  /** The value, written by the application or through MoneyText / NumberText. */
  value?: ReactNode
  change?: StatChange
  /** What the change compares with ("vs September"). */
  comparison?: string
  /** Values for the sparkline, oldest first, as decimal strings. */
  trend?: readonly string[]
  loading?: boolean
  className?: string
}

const SPARK_WIDTH = 96
const SPARK_HEIGHT = 32

/** The sparkline's points: the values placed in a 96 × 32 box (2px of air top and bottom). */
export function sparklinePoints(values: readonly string[]): string {
  const numbers = values.map((value) => Number(value)).filter((value) => Number.isFinite(value))
  if (numbers.length < 2) return ''
  const min = Math.min(...numbers)
  const max = Math.max(...numbers)
  const span = max - min || 1
  const step = SPARK_WIDTH / (numbers.length - 1)
  return numbers
    .map((value, index) => {
      const x = index * step
      const y = 2 + (SPARK_HEIGHT - 4) * (1 - (value - min) / span)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

const CARD =
  'box-border flex min-h-26 flex-col gap-1 rounded-lg border border-solid border-default bg-surface-raised p-4 font-sans'

/** One number on a dashboard, with its change and an optional trend. */
export function StatCard(props: StatCardProps) {
  if (props.loading === true) {
    return <Skeleton className={cn('h-26 rounded-lg', props.className)} />
  }
  const change = props.change
  const Arrow = change?.direction === 'down' ? ArrowDownRight : ArrowUpRight
  const points = props.trend === undefined ? '' : sparklinePoints(props.trend)
  return (
    <section data-slot="stat-card" className={cn(CARD, props.className)}>
      <h3 className={cn('m-0 text-xs font-regular text-secondary', TEXT_DIRECTION)}>
        {props.label}
      </h3>
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="m-0 text-h1 font-semibold text-primary tabular-nums">{props.value}</p>
          {(change !== undefined || props.comparison !== undefined) && (
            <p className="m-0 flex flex-wrap items-center gap-x-1.5 text-xs text-secondary">
              {change !== undefined && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-medium tabular-nums',
                    change.sentiment === 'good' && 'text-status-success-fg',
                    change.sentiment === 'bad' && 'text-status-danger-fg',
                  )}
                >
                  <Arrow aria-hidden="true" className="size-3.5 shrink-0 rtl:-scale-x-100" />
                  <span dir="ltr">{change.text}</span>
                </span>
              )}
              {props.comparison !== undefined && (
                <span className={TEXT_DIRECTION}>{props.comparison}</span>
              )}
            </p>
          )}
        </div>
        {points !== '' && (
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${String(SPARK_WIDTH)} ${String(SPARK_HEIGHT)}`}
            width={SPARK_WIDTH}
            height={SPARK_HEIGHT}
            className="shrink-0 text-tertiary rtl:-scale-x-100"
          >
            <polyline
              points={points}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
    </section>
  )
}
