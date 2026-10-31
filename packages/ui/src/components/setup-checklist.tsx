import { ArrowRight, Check, ChevronDown, CircleCheck, Lock } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { resumeStep, setupProgress, type SetupStepState } from './admin-logic'
import { ProgressBar } from './progress'

/*
 * SetupChecklist: the first-run steps of a new company — company data, the
 * e-invoicing connection, importing customers, the first invoice … The steps, their states and
 * their actions are the Core's.
 * - One card (raised, border.default, radius lg): the steps reach its edges, so the highlighted
 *   step's band does too, and the card ends with its last step.
 * - The header: the title (the application's, h2 by default), the progress "2 of 5 done"
 *   (`messages['setup.progress']`, numbers through `format.number`) and a ProgressBar.
 * - The steps in order, rows divided by lines (no cards inside the card it stands in). Each: a
 *   24px marker — done: a check on surface.sunken in a border.strong ring (LifecycleBar's
 *   completed step, neutral); blocked: a lock; open: its number —, the title (sm semibold), the
 *   description (xs text.secondary), a done step's note ("Completed by Milica Petrović") and a
 *   blocked step's reason in words.
 * - Resume: the step to do now — the application's `current`, else the first step still to do
 *   (`resumeStep`) — is highlighted the neutral way (surface.selected with the 3px
 *   border.selected bar at its start), carries `aria-current="step"` and its action is the
 *   main button; other open steps show their action as a small neutral button; a blocked step
 *   has none (its reason says what it waits for); a done step may offer a small "Change".
 * - Actions are links (`href`, through the provider's `linkComponent`) or buttons (`onClick`).
 * - All done: the header says so in the success tone ("Setup complete" after a
 *   CircleCheck) instead of the progress; the steps fold under "Show steps"; done steps' markers
 *   are success-toned and no step offers its action again (`completeActions` keeps them).
 */

/** A step's action: a link to the page that does it, or a button. */
export interface SetupAction {
  label: string
  href?: string
  onClick?: () => void
}

/** One first-run step, from the Core. */
export interface SetupStep {
  id: string
  title: string
  description?: ReactNode
  state: SetupStepState
  /** Why a blocked step waits, in words. */
  blockedReason?: ReactNode
  /** A done step's note: who and when. */
  doneNote?: ReactNode
  /** What the step leads to ("Import customers"); a done step's is a small "Change". */
  action?: SetupAction
}

export interface SetupChecklistProps {
  steps: readonly SetupStep[]
  /** The checklist's heading, from the application ("Set up Stanić Elektro STR"). */
  title: string
  /** A line under the title, from the application. */
  description?: ReactNode
  /** The title's level in the page's outline. Default 2. */
  headingLevel?: 2 | 3 | 4
  /** Skeleton rows while the steps load. */
  loading?: boolean
  /** All done: the steps start open (default folded under "Show steps"). */
  defaultStepsOpen?: boolean
  /** All done: done steps still offer their action ("Change"). Default false. */
  completeActions?: boolean
  className?: string
}

/** The step's marker: a check, a lock or its number. */
function Marker({ step, number }: { step: SetupStep; number: string }) {
  const base =
    'box-border flex size-6 shrink-0 items-center justify-center rounded-full border border-solid text-xs font-semibold tabular-nums'
  if (step.state === 'done') {
    return (
      <span
        aria-hidden="true"
        className={cn(
          base,
          'border-status-success-border bg-status-success-bg text-status-success-fg',
        )}
      >
        <Check className="size-3.5" />
      </span>
    )
  }
  if (step.state === 'blocked') {
    return (
      <span
        aria-hidden="true"
        className={cn(base, 'border-default bg-surface-sunken text-secondary')}
      >
        <Lock className="size-3" />
      </span>
    )
  }
  return (
    <span aria-hidden="true" className={cn(base, 'border-strong bg-surface-raised text-primary')}>
      {number}
    </span>
  )
}

/** A step's action as a link or a button, main or small. */
function StepAction({ action, main }: { action: SetupAction; main: boolean }) {
  const { linkComponent: Link } = useLiro()
  const look = main
    ? 'inline-flex min-h-control items-center gap-2.5 rounded-md border border-solid border-transparent bg-family-primary-solid py-1 ps-3 pe-4.5 text-sm font-semibold text-on-accent no-underline visited:text-on-accent hover:bg-family-primary-solid-hover hover:text-on-accent active:text-on-accent'
    : 'inline-flex min-h-control-sm items-center gap-2 rounded-md border border-solid border-default bg-surface-raised px-3.5 text-xs font-semibold text-family-neutral-fg no-underline visited:text-family-neutral-fg hover:bg-surface-hover hover:text-family-neutral-fg-hover active:text-family-neutral-fg'
  const content = (
    <>
      {main && <ArrowRight aria-hidden="true" className="size-3.75 shrink-0 rtl:-scale-x-100" />}
      <span className={TEXT_DIRECTION}>{action.label}</span>
    </>
  )
  if (action.href !== undefined) {
    return (
      <Link
        href={action.href}
        onClick={action.onClick}
        className={cn('box-border font-sans', look, FOCUS_RING)}
      >
        {content}
      </Link>
    )
  }
  return (
    <ButtonPrimitive
      family={main ? 'primary' : 'neutral'}
      emphasis={main ? 'primary' : 'secondary'}
      onClick={action.onClick}
      className={main ? undefined : 'min-h-control-sm gap-2 px-3.5 text-xs'}
    >
      {content}
    </ButtonPrimitive>
  )
}

/** The first-run steps of a company, with progress; the next open step stands out. */
export function SetupChecklist(props: SetupChecklistProps) {
  const { messages, format } = useLiro()
  const headingId = useId()
  const Heading = `h${String(props.headingLevel ?? 2)}` as 'h2'
  const progress = setupProgress(props.steps)
  const resume = resumeStep(props.steps)
  const complete = progress.total > 0 && progress.done === progress.total
  const [stepsOpen, setStepsOpen] = useState(props.defaultStepsOpen === true)
  const stepsId = useId()
  const showSteps = !complete || stepsOpen
  const progressText = messages['setup.progress'](
    progress.done,
    format.number(String(progress.done)),
    progress.total,
    format.number(String(progress.total)),
  )
  const stateText: Record<SetupStepState, string> = {
    done: messages['setup.done'],
    current: messages['setup.next'],
    todo: messages['setup.todo'],
    blocked: messages['setup.blocked'],
  }
  return (
    <section
      data-slot="setup-checklist"
      aria-labelledby={headingId}
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-solid border-default bg-surface-raised font-sans text-primary',
        props.className,
      )}
    >
      <div className="flex flex-col gap-1 p-4">
        <Heading id={headingId} className={cn('m-0 text-h4 text-primary', TEXT_DIRECTION)}>
          {props.title}
        </Heading>
        {props.description !== undefined && (
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{props.description}</p>
        )}
        {props.loading !== true && complete && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p
              role="status"
              className="m-0 flex items-center gap-2 text-sm font-semibold text-status-success-fg"
            >
              <CircleCheck aria-hidden="true" className="size-4.5 shrink-0" />
              <span className={TEXT_DIRECTION}>{messages['setup.complete']}</span>
              <span className="sr-only">{` (${progressText})`}</span>
            </p>
            <ButtonPrimitive
              family="neutral"
              emphasis="secondary"
              aria-expanded={stepsOpen}
              {...(stepsOpen ? { 'aria-controls': stepsId } : {})}
              onClick={() => {
                setStepsOpen((open) => !open)
              }}
              className="min-h-control-sm gap-2 px-3 text-xs"
            >
              <span className={TEXT_DIRECTION}>
                {stepsOpen ? messages['setup.hideSteps'] : messages['setup.showSteps']}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={cn('size-3.5 shrink-0 transition-transform', stepsOpen && 'rotate-180')}
              />
            </ButtonPrimitive>
          </div>
        )}
        {props.loading !== true && !complete && (
          <div className="mt-2 flex items-center gap-3">
            <ProgressBar
              label={progressText}
              value={progress.done}
              max={Math.max(progress.total, 1)}
              className="max-w-60 flex-1"
            />
            <span className={cn('text-xs font-medium text-secondary', TEXT_DIRECTION)}>
              {progressText}
            </span>
          </div>
        )}
      </div>
      {props.loading === true ? (
        <div
          aria-busy="true"
          className="flex flex-col gap-3 border-0 border-t border-solid border-subtle p-4"
        >
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      ) : !showSteps ? null : (
        <ol id={stepsId} className="m-0 list-none border-0 border-t border-solid border-subtle p-0">
          {props.steps.map((step, index) => {
            const highlighted = step.id === resume
            const number = format.number(String(index + 1))
            return (
              <li
                key={step.id}
                {...(highlighted ? { 'aria-current': 'step' as const } : {})}
                data-state={step.state}
                className={cn(
                  'relative flex gap-3 border-0 border-b border-solid border-subtle px-4 py-3 last:border-b-0',
                  highlighted &&
                    "bg-surface-selected before:absolute before:inset-y-0 before:start-0 before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']",
                )}
                {...(highlighted ? { 'data-liro-surface': 'selected' } : {})}
              >
                <Marker step={step} number={number} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
                    {step.title}
                    <span className="sr-only">{` (${stateText[step.state]})`}</span>
                  </span>
                  {step.description !== undefined && (
                    <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                      {step.description}
                    </span>
                  )}
                  {step.state === 'done' && step.doneNote !== undefined && (
                    <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                      {step.doneNote}
                    </span>
                  )}
                  {step.state === 'blocked' && step.blockedReason !== undefined && (
                    <span className={cn('text-xs font-medium text-secondary', TEXT_DIRECTION)}>
                      {step.blockedReason}
                    </span>
                  )}
                  {step.action !== undefined &&
                    step.state !== 'blocked' &&
                    (!complete || props.completeActions === true) && (
                      <div className="mt-2 flex">
                        <StepAction action={step.action} main={highlighted} />
                      </div>
                    )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
