import { CircleCheck, CircleSlash, TriangleAlert } from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import { clampedDone, jobOutcome, type JobOutcome, type JobState } from './job-logic'
import { ProgressBar } from './progress'
import { Spinner } from './spinner'

export { clampedDone, jobOutcome } from './job-logic'
export type { JobOutcome, JobState } from './job-logic'

/*
 * JobProgress (BUILD-PLAN P5.4; docs/decisions.md "Delivery and progress"): a long job — sending
 * 1.284 invoices, an import, a payroll run — while it runs and after it ends. It generalises
 * "Progress in a dialog" (P3.6): the same Spinner (progress not known) or ProgressBar with the
 * count, now with Cancel and the final report; inline in a card or as a Dialog's content.
 *
 * - Running: the job's label (13px semibold), the ProgressBar (5px) with "312 of 1.284" under it
 *   (`messages['job.progress']`, both counts through `format.number`) and the item being worked
 *   on at the end of that line; a Spinner with the label while the total is not known. Cancel
 *   (the cancel intent) at the end of the footer; "Cancelling…" and disabled while it stops.
 * - The count is not a live region: a job that advances several times a second would make a
 *   screen reader talk without end; the bar carries its value for those who ask. The report is:
 *   its heading and outcome lines are announced once, when the job ends.
 * - The report: a 16px icon and "Finished" / "Cancelled" (13px semibold) — a check
 *   (status.success.fg) when nothing failed, a warning triangle (status.warning.fg) when some
 *   items failed, a slashed circle (text.secondary) when cancelled; the outcome lines written by
 *   the application with its own counts and nouns ("1.270 invoices sent", "14 not sent"), each in
 *   its tone's fg; the failed items as rows (name, then the reason in 12px text.secondary) with
 *   1px border.subtle lines between them, at most 240px high and scrolling; the application's
 *   actions at the end of the footer ("Download report", then "Retry failed").
 * - The footer: 16px under the content, buttons 8px apart, at the end — DialogFooter's rule, so
 *   the component reads the same in a card and in a dialog.
 */

/** One line of the report: a count with its noun, written by the application. */
export interface JobOutcomeLine {
  key: string
  /** "1.270 invoices sent", "14 not sent". */
  text: string
  /** Default 'neutral'. A colour only says a state the words already say. */
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
}

/** An item that failed, with its reason. */
export interface JobFailure {
  key: string
  /** The item, from the application ("F-2026-0398 · Drina Prevoz d.o.o."). */
  label: ReactNode
  /** Why, from the application. */
  reason: ReactNode
}

export interface JobProgressProps {
  /** What the job does, from the application ("Sending invoices to SEF"); names the bar. */
  label: string
  /** 'running', then 'finished' or 'cancelled'. */
  state: JobState
  /** Items done so far (succeeded or failed). */
  done: number
  /** Items in all; leave out while it is not known (a Spinner instead of the bar). */
  total?: number
  /** The item being worked on now, from the application. */
  current?: ReactNode
  /** Makes the job cancellable while it runs: the Cancel button. */
  onCancel?: () => void
  /** The job is stopping after Cancel: the button says so and is disabled. */
  cancelling?: boolean
  /** The report's lines, once the job has ended. */
  outcomes?: readonly JobOutcomeLine[]
  /** The items that failed, with their reasons. */
  failures?: readonly JobFailure[]
  /** The report's actions, from the application ("Download report", "Retry failed"). */
  actions?: ReactNode
  className?: string
}

const OUTCOME_TONE = {
  neutral: 'text-primary',
  success: 'text-status-success-fg',
  warning: 'text-status-warning-fg',
  danger: 'text-status-danger-fg',
} as const

const REPORT_ICON: Record<
  Exclude<JobOutcome, 'running'>,
  { icon: typeof CircleCheck; colour: string }
> = {
  success: { icon: CircleCheck, colour: 'text-status-success-fg' },
  partial: { icon: TriangleAlert, colour: 'text-status-warning-fg' },
  cancelled: { icon: CircleSlash, colour: 'text-secondary' },
}

/** Whether an element's content is taller than its box (it scrolls). */
function useScrolls(element: HTMLElement | null): boolean {
  const [scrolls, setScrolls] = useState(false)
  useEffect(() => {
    if (element === null) return
    const measure = () => {
      setScrolls(element.scrollHeight > element.clientHeight)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    const content = element.firstElementChild
    if (content !== null) observer.observe(content)
    return () => {
      observer.disconnect()
    }
  }, [element])
  return scrolls
}

/** A long job: how far it has come, a way to stop it, and what it did. */
export function JobProgress(props: JobProgressProps) {
  const { messages, format } = useLiro()
  const failuresId = useId()
  const failures = props.failures ?? []
  const outcome = jobOutcome(props.state, failures.length)
  const shown = clampedDone(props.done, props.total)
  const running = outcome === 'running'
  const look = outcome === 'running' ? null : REPORT_ICON[outcome]
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)
  const scrolls = useScrolls(scroller)
  return (
    <div
      data-slot="job-progress"
      data-state={props.state}
      className={cn('flex min-w-0 flex-col gap-3 font-sans', props.className)}
    >
      {running &&
        (shown === null || props.total === undefined ? (
          <Spinner size="sm">{props.label}</Spinner>
        ) : (
          <div className="flex flex-col gap-2">
            <p className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
              {props.label}
            </p>
            <ProgressBar label={props.label} value={shown} max={props.total} />
            <p className="m-0 flex flex-wrap items-baseline justify-between gap-x-4 text-xs text-secondary">
              <span className={cn('tabular-nums', TEXT_DIRECTION)}>
                {messages['job.progress'](
                  shown,
                  format.number(String(shown)),
                  props.total,
                  format.number(String(props.total)),
                )}
              </span>
              {props.current !== undefined && (
                <span className={cn('min-w-0 truncate', TEXT_DIRECTION)}>{props.current}</span>
              )}
            </p>
          </div>
        ))}
      {/* Always in the page, so the report is announced when the job ends. */}
      <div role="status" className={running ? 'sr-only' : 'flex flex-col gap-2'}>
        {look !== null && (
          <>
            <p className="m-0 flex items-center gap-2 text-sm font-semibold text-primary">
              <look.icon aria-hidden="true" className={cn('size-4 shrink-0', look.colour)} />
              <span className={TEXT_DIRECTION}>
                {props.state === 'cancelled' ? messages['job.cancelled'] : messages['job.finished']}
              </span>
              <span className="sr-only">: {props.label}</span>
            </p>
            {props.outcomes !== undefined && props.outcomes.length > 0 && (
              <ul className="m-0 flex list-none flex-col gap-1 p-0 ps-6">
                {props.outcomes.map((line) => (
                  <li
                    key={line.key}
                    className={cn('text-sm', OUTCOME_TONE[line.tone ?? 'neutral'], TEXT_DIRECTION)}
                  >
                    {line.text}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      {!running && failures.length > 0 && (
        <div className="flex min-w-0 flex-col gap-1">
          <p
            id={failuresId}
            className={cn('m-0 text-xs font-semibold text-secondary', TEXT_DIRECTION)}
          >
            {messages['job.failures']}
          </p>
          {/* Focusable while it scrolls, so the keyboard can scroll it (axe
              scrollable-region-focusable), as WorklistPage's detail pane. */}
          <div
            ref={setScroller}
            {...(scrolls ? { tabIndex: 0, role: 'region', 'aria-labelledby': failuresId } : {})}
            className={cn('max-h-60 overflow-y-auto rounded-sm', FOCUS_RING)}
          >
            <ul aria-labelledby={failuresId} className="m-0 flex list-none flex-col p-0">
              {failures.map((failure) => (
                <li
                  key={failure.key}
                  className="flex min-w-0 flex-col border-0 border-b border-solid border-subtle py-2 last:border-b-0"
                >
                  <span className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}>
                    {failure.label}
                  </span>
                  <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                    {failure.reason}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {running && props.onCancel !== undefined && (
        <div className="mt-1 flex flex-wrap items-center justify-end gap-2">
          <Button
            intent="cancel"
            label={props.cancelling === true ? messages['job.cancelling'] : messages['job.cancel']}
            disabled={props.cancelling === true}
            onClick={props.onCancel}
          />
        </div>
      )}
      {!running && props.actions !== undefined && (
        <div className="mt-1 flex flex-wrap items-center justify-end gap-2">{props.actions}</div>
      )}
    </div>
  )
}
