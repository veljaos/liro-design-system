import {
  Circle,
  CircleCheck,
  CircleX,
  Lock,
  LockOpen,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ActionButton, UnavailableAction } from '../components/actions'
import { SectionCard } from '../components/cards'
import type { ConfirmAnswer, ConfirmReason } from '../components/confirm-dialog'
import { ReasonConfirmDialog } from '../components/confirm-dialog'
import { KeyFigures, type KeyFigure } from '../components/key-figures'
import { ProgressBar, Stepper } from '../components/progress'
import { usePhone } from '../components/use-phone'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { PageHeader, type PageBack } from './page-header'
import { countChecks, type RunCheckResult } from './periodic-run-logic'

/*
 * PeriodicRunPage (BUILD-PLAN P5.21): a process run once per period — payroll, depreciation, a
 * VAT period close. Generic: the steps, checks, figures and texts come from the application; the
 * Core runs the process and decides what may happen next.
 * - The header (PageHeader: back, title, status, subtitle, the step's actions at the end with the
 *   main one last); the period's lock state under it — Lock or LockOpen with "Period locked" /
 *   "Period open" (sm semibold) and the application's who and when (xs text.secondary) —, then
 *   the key figures.
 * - The steps (prepare → calculate → review → post → send; names from the application) as the
 *   Stepper: done steps checked, the current one ringed. On phones "Step 3 of 5: Review" (the
 *   LifecycleBar's message) instead: five steps do not fit 360px.
 * - The running step (`progress`): a SectionCard with a ProgressBar and the application's count
 *   ("23 of 46 employees", through format), a polite status. // INTEGRATION: JobProgress
 * - "Checks" for the current step: a flush SectionCard of rows divided by lines — the result's
 *   icon and word in its tone (Passed success, Warning warning, Failed danger, Not run yet
 *   text.tertiary; words, never colour alone), the check's name (sm medium) and the application's
 *   detail (xs text.secondary), an optional action at the end (a link to fix it); the counts
 *   ("1 failed", "2 warnings", "12 passed", through format) as the card's description.
 * - "Preview before posting" (`preview`): a SectionCard with the application's summary (KeyFigures
 *   or a KeyValueList) and a table (a DataTable `inCard`), flush.
 * - `rerun`: a "Rerun" button before the actions; it asks for a reason (ReasonConfirmDialog, the
 *   caution family) and reports it. Unavailable with the application's reason (a locked period).
 * - Further sections (`children`), 16px apart. Page padding 24px (16px on phones), the content's
 *   maximum width, as DetailPage.
 */

/** One step of the run. */
export interface RunStep {
  key: string
  /** The step's name, from the application ("Calculate"). */
  label: string
  /** A line under the name (when it was done, by whom). */
  description?: ReactNode
}

/** One check of the current step, with its result from the application. */
export interface RunCheck {
  id: string
  /** What was checked ("Bank accounts of all employees"). */
  label: ReactNode
  result: RunCheckResult
  /** The application's detail ("2 employees over 8 hours of overtime a week: …"). */
  detail?: ReactNode
  /** At the row's end: a link or small button to fix it. */
  action?: ReactNode
}

/** The period's lock state, from the application. */
export interface RunLock {
  state: 'open' | 'locked'
  /** Who and when, in the application's words ("Opened by Ivana Stojanović on 01.10.2026."). */
  detail?: ReactNode
}

/** The running step's progress (a long calculation). */
export interface RunProgress {
  /** What is running, for assistive technology and the card's title ("Calculating payroll"). */
  label: string
  /** Done so far; omit while not known. */
  value?: number
  max?: number
  /** The count in the application's words, through format ("23 of 46 employees"). */
  text?: ReactNode
}

/** The rerun: a reason first, then the application runs again. */
export interface RunRerun {
  /** The question ("Rerun payroll for September 2026?"). */
  title: ReactNode
  /** What will happen ("The calculated results are replaced. Payslips are not sent yet."). */
  message?: ReactNode
  /** The dialog's confirm button ("Rerun"). */
  confirmLabel: string
  /** The Core's reasons to choose from; without them the reason is written. */
  reasons?: readonly ConfirmReason[]
  /** The reason's label ("Reason for the rerun"). */
  reasonLabel?: string
  onConfirm: (answer: ConfirmAnswer) => void | Promise<void>
  /** Why a rerun is not possible now (the period is locked), from the application. */
  unavailableReason?: string
}

/** The preview before posting. */
export interface RunPreview {
  /** Default: `messages['run.preview']`. */
  title?: string
  /** A line under the title. */
  description?: ReactNode
  /** The totals: KeyFigures or a KeyValueList. */
  summary?: ReactNode
  /** The rows: a DataTable `inCard`. */
  table?: ReactNode
}

export interface PeriodicRunPageProps {
  /** The run's name and period: the page's h1 ("Payroll September 2026"). */
  title: string
  back?: PageBack
  /** After the title: a StatusBadge. */
  status?: ReactNode
  /** A line under the title. */
  subtitle?: ReactNode
  /** The current step's actions (an ActionGroup or buttons), the main one last. */
  actions?: ReactNode
  /** Two to four figures under the header. */
  keyFigures?: readonly KeyFigure[]
  steps: readonly RunStep[]
  /** The current step, from 0; `steps.length` when every step is done. */
  active: number
  /** Makes the steps buttons (to look at an earlier step's checks). */
  onStepClick?: (index: number) => void
  lock: RunLock
  /** The current step's checks. */
  checks?: readonly RunCheck[]
  /** The checks card's title. Default: `messages['run.checks']`. */
  checksTitle?: string
  progress?: RunProgress
  preview?: RunPreview
  rerun?: RunRerun
  /** Further sections (SectionCards). */
  children?: ReactNode
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** Literal classes, so Tailwind finds them. */
const RESULT = {
  passed: { Icon: CircleCheck, text: 'text-status-success-fg', word: 'run.passed' },
  warning: { Icon: TriangleAlert, text: 'text-status-warning-fg', word: 'run.warning' },
  failed: { Icon: CircleX, text: 'text-status-danger-fg', word: 'run.failed' },
  notRun: { Icon: Circle, text: 'text-tertiary', word: 'run.notRun' },
} as const

const COUNT = {
  passed: 'run.passedCount',
  warning: 'run.warningCount',
  failed: 'run.failedCount',
} as const

function CheckRow({ check }: { check: RunCheck }) {
  const { messages } = useLiro()
  const look = RESULT[check.result]
  return (
    <li
      data-result={check.result}
      className="flex flex-wrap items-start gap-x-3 gap-y-1 border-0 border-b border-solid border-subtle px-4 py-3 last:border-b-0"
    >
      <look.Icon aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', look.text)} />
      <div className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
        <span className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}>
          {check.label}
        </span>
        {check.detail !== undefined && (
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{check.detail}</span>
        )}
      </div>
      <div className="ms-auto flex shrink-0 items-center gap-3">
        {check.action}
        <span className={cn('text-xs font-semibold', look.text, TEXT_DIRECTION)}>
          {messages[look.word]}
        </span>
      </div>
    </li>
  )
}

/** A process run once per period: its steps, checks, preview and the period's lock. */
export function PeriodicRunPage(props: PeriodicRunPageProps) {
  const { messages, format } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const [asking, setAsking] = useState(false)
  const rerun = props.rerun
  const locked = props.lock.state === 'locked'
  const LockIcon = locked ? Lock : LockOpen

  const rerunAction = { family: 'neutral' as const, icon: RotateCcw, label: messages['run.rerun'] }
  const actions =
    rerun === undefined && props.actions === undefined ? undefined : (
      <>
        {rerun !== undefined &&
          (rerun.unavailableReason === undefined ? (
            <ActionButton
              action={rerunAction}
              type="button"
              onClick={() => {
                setAsking(true)
              }}
            />
          ) : (
            <UnavailableAction {...rerunAction} reason={rerun.unavailableReason} />
          ))}
        {props.actions}
      </>
    )

  const checks = props.checks ?? []
  const counts = countChecks(checks).filter(
    (entry): entry is { result: 'passed' | 'warning' | 'failed'; count: number } =>
      entry.result !== 'notRun',
  )
  const step = props.steps[Math.min(props.active, props.steps.length - 1)]

  return (
    <div
      data-slot="periodic-run-page"
      className={cn(
        'mx-auto box-border flex w-full max-w-content flex-col font-sans text-primary',
        phone ? 'gap-4 p-4' : 'gap-6 p-6',
        props.className,
      )}
    >
      <div className="flex flex-col gap-4">
        <PageHeader
          title={props.title}
          {...(props.back === undefined ? {} : { back: props.back })}
          {...(props.status === undefined ? {} : { status: props.status })}
          {...(props.subtitle === undefined ? {} : { subtitle: props.subtitle })}
          {...(actions === undefined ? {} : { actions })}
        />
        <p
          data-slot="run-lock"
          data-state={props.lock.state}
          className="m-0 flex items-start gap-2"
        >
          <LockIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-secondary" />
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
              {locked ? messages['run.periodLocked'] : messages['run.periodOpen']}
            </span>
            {props.lock.detail !== undefined && (
              <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                {props.lock.detail}
              </span>
            )}
          </span>
        </p>
        {props.keyFigures !== undefined && props.keyFigures.length > 0 && (
          <KeyFigures items={props.keyFigures} layout={phone ? 'phone' : 'desktop'} />
        )}
      </div>
      {phone ? (
        step !== undefined && (
          <p className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
            {messages['lifecycle.step'](
              Math.min(props.active + 1, props.steps.length),
              format.number(String(Math.min(props.active + 1, props.steps.length))),
              props.steps.length,
              format.number(String(props.steps.length)),
              step.label,
            )}
          </p>
        )
      ) : (
        <Stepper
          steps={props.steps.map((each) => ({
            label: each.label,
            ...(each.description === undefined ? {} : { description: each.description }),
          }))}
          active={props.active}
          {...(props.onStepClick === undefined ? {} : { onStepClick: props.onStepClick })}
        />
      )}
      {props.progress !== undefined && (
        // INTEGRATION: JobProgress (group B) replaces this block once it exists.
        <SectionCard title={props.progress.label} headingLevel={2}>
          <div className="flex flex-col gap-2">
            <ProgressBar
              label={props.progress.label}
              {...(props.progress.value === undefined ? {} : { value: props.progress.value })}
              {...(props.progress.max === undefined ? {} : { max: props.progress.max })}
            />
            {props.progress.text !== undefined && (
              <p role="status" className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
                {props.progress.text}
              </p>
            )}
          </div>
        </SectionCard>
      )}
      {checks.length > 0 && (
        <SectionCard
          title={props.checksTitle ?? messages['run.checks']}
          headingLevel={2}
          flush
          description={
            <span className="flex flex-wrap gap-x-3">
              {counts.map((entry) => (
                <span key={entry.result} className={TEXT_DIRECTION}>
                  {messages[COUNT[entry.result]](entry.count, format.number(String(entry.count)))}
                </span>
              ))}
            </span>
          }
        >
          <ul className="m-0 list-none border-0 border-t border-solid border-subtle p-0">
            {checks.map((check) => (
              <CheckRow key={check.id} check={check} />
            ))}
          </ul>
        </SectionCard>
      )}
      {props.preview !== undefined && (
        <SectionCard
          title={props.preview.title ?? messages['run.preview']}
          headingLevel={2}
          flush
          {...(props.preview.description === undefined
            ? {}
            : { description: props.preview.description })}
        >
          {props.preview.summary !== undefined && (
            <div className="px-4 pb-4">{props.preview.summary}</div>
          )}
          {props.preview.table}
        </SectionCard>
      )}
      {props.children}
      {rerun !== undefined && (
        <ReasonConfirmDialog
          open={asking}
          onOpenChange={setAsking}
          family="caution"
          actionIcon={RotateCcw}
          title={rerun.title}
          {...(rerun.message === undefined ? {} : { message: rerun.message })}
          confirmLabel={rerun.confirmLabel}
          {...(rerun.reasons === undefined ? {} : { reasons: rerun.reasons })}
          {...(rerun.reasonLabel === undefined ? {} : { reasonLabel: rerun.reasonLabel })}
          onConfirm={rerun.onConfirm}
        />
      )}
    </div>
  )
}
