import { useId, type ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { dayOf } from './day-groups'
import { lifecycleState, StepDot, type StepState } from './lifecycle-bar'

/*
 * StatusTimeline (BUILD-PLAN P5.4; docs/decisions.md "Delivery and progress"): the states of a
 * process in order — a delivery to the e-invoice system: Prepared → Sent → Delivered — with the
 * current one highlighted, when each was reached, and the next step under the current state
 * ("Delivery pending — action needed" with Retry and "Export for manual upload").
 *
 * - A vertical list: a 16px dot per state on a 1px border.default line that joins the dots, the
 *   name (13px) beside it with the time (12px text.tertiary) on the same line, an optional detail
 *   line (12px text.secondary) under it; 16px between states.
 * - The dots and names are LifecycleBar's (one look for states, `lifecycleState`): reached states
 *   neutral with a check, the current one brand.solid with its name semibold in text.brand
 *   (`aria-current="step"`), later ones an empty ring in text.tertiary, a failed one
 *   status.danger.solid with an X and its reason under it in status.danger.fg.
 * - The next step: under the current state, an inset block (not a card: radius md, 12px padding,
 *   the tone's subtle background, no border) with its title (13px semibold in the tone's fg), a
 *   description and the application's actions, 8px apart. Neutral by default, warning or danger
 *   when the application says the user must act.
 * - Which one: StatusTimeline for one process's states with what comes next (delivery, a payment
 *   order, an import); LifecycleBar for the dots above a document; HistoryList (P5.1) for the
 *   full record of who changed what; ActivityList for the compact side-panel list.
 */

/** One state of the process. */
export interface StatusTimelineStep {
  key: string
  /** The state's name, from the application ("Sent to SEF"). */
  label: string
  /**
   * When the state was reached: an ISO instant in the tenant's offset. Its date (`format.date`)
   * and clock (`format.time`) are shown as written, the tenant's clock (P4.9), never shifted.
   */
  at?: string
  /** A line under the name, from the application ("SEF ID 2f6c…", "by Dragan Ilić"). */
  detail?: ReactNode
  /** The state failed: its reason, shown under the name ("Rejected: the buyer's PIB is unknown"). */
  error?: string
}

/** What comes next, shown under the current state. */
export interface StatusNextStep {
  /** From the application: "Delivery pending — action needed". */
  title: ReactNode
  description?: ReactNode
  /** The application's buttons (Retry, "Export for manual upload"), the main one last. */
  actions?: ReactNode
  /** Default 'neutral'; 'warning' or 'danger' when the user must act. Never blue. */
  tone?: 'neutral' | 'warning' | 'danger'
}

export interface StatusTimelineProps {
  /** Names the list for assistive technology ("Delivery to SEF"), from the application. */
  label: string
  steps: readonly StatusTimelineStep[]
  /** The index of the current state; earlier ones are reached, later ones are still to come. */
  current: number
  /** The next step, under the current state. */
  next?: StatusNextStep
  className?: string
}

const NAME: Record<StepState, string> = {
  completed: 'text-primary',
  current: 'font-semibold text-brand',
  future: 'text-tertiary',
  error: 'font-semibold text-status-danger-fg',
}

const NEXT_TONE = {
  neutral: { box: 'bg-status-neutral-bg', title: 'text-primary' },
  warning: { box: 'bg-status-warning-bg', title: 'text-status-warning-fg' },
  danger: { box: 'bg-status-danger-bg', title: 'text-status-danger-fg' },
} as const

function NextStep({ next }: { next: StatusNextStep }) {
  const { messages } = useLiro()
  const titleId = useId()
  const tone = NEXT_TONE[next.tone ?? 'neutral']
  return (
    <div
      role="group"
      aria-labelledby={titleId}
      data-slot="status-next"
      className={cn('mt-2 flex flex-col gap-2 rounded-md p-3', tone.box)}
    >
      <p id={titleId} className={cn('m-0 text-sm font-semibold', tone.title, TEXT_DIRECTION)}>
        <span className="sr-only">{messages['timeline.next']}: </span>
        {next.title}
      </p>
      {next.description !== undefined && (
        <div className={cn('text-sm text-primary', TEXT_DIRECTION)}>{next.description}</div>
      )}
      {next.actions !== undefined && (
        <div className="flex flex-wrap items-center gap-2">{next.actions}</div>
      )}
    </div>
  )
}

/** A process's states in order, the current one highlighted, and what comes next. */
export function StatusTimeline({ label, steps, current, next, className }: StatusTimelineProps) {
  const { messages, format } = useLiro()
  return (
    <ol
      aria-label={label}
      data-slot="status-timeline"
      className={cn('m-0 flex list-none flex-col p-0 font-sans', className)}
    >
      {steps.map((step, index) => {
        const state = lifecycleState(step, index, current)
        const last = index === steps.length - 1
        return (
          <li
            key={step.key}
            data-state={state}
            className={cn('relative flex gap-3', !last && 'pb-4')}
            {...(index === current ? { 'aria-current': 'step' as const } : {})}
          >
            {!last && (
              // The line to the next dot: from under this dot to the next one's top.
              <span
                aria-hidden="true"
                className="absolute start-[7.5px] top-5 bottom-0 border-0 border-s border-solid border-default"
              />
            )}
            <span className="flex h-5 items-center">
              <StepDot state={state} onLine />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="m-0 flex flex-wrap items-baseline gap-x-2 leading-5">
                <span className={cn('text-sm', NAME[state], TEXT_DIRECTION)}>
                  {step.label}
                  {state === 'completed' && (
                    <span className="sr-only">, {messages['stepper.completed']}</span>
                  )}
                  {state === 'error' && (
                    <span className="sr-only">, {messages['timeline.failed']}</span>
                  )}
                </span>
                {step.at !== undefined && (
                  <time
                    dateTime={step.at}
                    dir="auto"
                    className="text-xs whitespace-nowrap text-tertiary tabular-nums"
                  >
                    {format.date(dayOf(step.at))} {format.time(step.at)}
                  </time>
                )}
              </p>
              {step.error !== undefined && (
                <p className={cn('m-0 text-xs text-status-danger-fg', TEXT_DIRECTION)}>
                  {step.error}
                </p>
              )}
              {step.detail !== undefined && (
                <div className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{step.detail}</div>
              )}
              {index === current && next !== undefined && <NextStep next={next} />}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
