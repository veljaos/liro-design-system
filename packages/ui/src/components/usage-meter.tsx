import { useId, type ReactNode } from 'react'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Progress } from '../primitives/progress'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { StatusBadge, type Tone } from './status-badge'
import { meterShare, usageWords } from './usage-logic'

/*
 * UsageMeter (BUILD-PLAN P5.36): how much of an allowance is used — users of a licence, storage,
 * documents sent this month, connections — as words and a bar. Generic: the name, the amounts,
 * the unit, the state and the note are the application's.
 * - **Words first:** the name (sm medium) at the start and "24 of 30" (or "4,2 GB of 10 GB", "412
 *   used, no limit"; `valueText` replaces them) at the end, tabular, the numbers through
 *   `format.number` exactly as given (decimal strings, D4).
 * - **The bar** under them: ProgressBar's look (5px, rounded, filling from the leading edge),
 *   named by the name, its value read as the same words (`aria-valuetext`). It is only a picture:
 *   its length is the one place a number is used (as the charts draw), and an amount over its
 *   limit fills it. No limit, no bar.
 * - **The state is the application's** (`state`: "Near the limit", warning; "Over the limit",
 *   danger) as a badge in words and tone: the meter never turns a figure into a state (D30), so
 *   the bar itself keeps one colour.
 * - A `note` under it ("Resets on 01.11.2026.", "Included in your plan: 30") and an `action`
 *   (the application's link or button, "Add users").
 * - `loading`: skeletons in place of the words and the bar.
 */

export interface UsageMeterProps {
  /** What is counted, from the application ("Users", "Storage"): names the bar. */
  label: string
  /** The amount used, a decimal string. */
  used: string
  /** The allowance, a decimal string; without it there is no bar ("412 used, no limit"). */
  limit?: string | null
  /** The unit after each amount, from the application ("GB"). */
  unit?: string
  /** The amounts in the application's own words, in place of "24 of 30". */
  valueText?: string
  /** The application's state of this allowance, in words and tone ("Near the limit"). */
  state?: { label: string; tone: Tone }
  /** A line under the bar. */
  note?: ReactNode
  /** The application's action for this allowance ("Add users"): a link or a button. */
  action?: ReactNode
  /** Skeletons while the amounts load. */
  loading?: boolean
  className?: string
}

/** Used of an allowance, in words and as a bar; the state is the application's. */
export function UsageMeter(props: UsageMeterProps) {
  const { format, messages } = useLiro()
  const labelId = useId()
  const words = props.valueText ?? usageWords(format, messages, props.used, props.limit, props.unit)
  const share = meterShare(props.used, props.limit)
  const hasNote = props.note !== undefined && props.note !== null && props.note !== false
  if (props.loading === true) {
    return (
      <div
        data-slot="usage-meter"
        aria-busy="true"
        className={cn('flex min-w-0 flex-col gap-2 font-sans', props.className)}
      >
        <span id={labelId} className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}>
          {props.label}
        </span>
        <Skeleton className="h-[5px] w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    )
  }
  return (
    <div
      data-slot="usage-meter"
      className={cn('flex min-w-0 flex-col gap-2 font-sans', props.className)}
    >
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span
          id={labelId}
          className={cn('min-w-0 text-sm font-medium text-primary', TEXT_DIRECTION)}
        >
          {props.label}
        </span>
        <span className={cn('text-sm text-primary tabular-nums', TEXT_ISOLATE)}>{words}</span>
      </div>
      {share !== null && (
        <Progress
          aria-labelledby={labelId}
          aria-valuetext={words}
          value={share * 100}
          max={100}
          className="h-[5px] rounded-full"
        />
      )}
      {(props.state !== undefined || hasNote) && (
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          {props.state !== undefined && (
            <StatusBadge label={props.state.label} tone={props.state.tone} />
          )}
          {hasNote && (
            <span className={cn('min-w-0 text-xs text-secondary', TEXT_DIRECTION)}>
              {props.note}
            </span>
          )}
        </div>
      )}
      {props.action !== undefined && props.action !== null && (
        <div className="flex flex-wrap items-center gap-2">{props.action}</div>
      )}
    </div>
  )
}
