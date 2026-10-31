import {
  Clock3,
  Cog,
  DiamondPlus,
  LocateFixed,
  Mail,
  SquarePlus,
  TriangleAlert,
  UserRound,
} from 'lucide-react'
import { useEffect, useId, useState, type SubmitEvent } from 'react'
import { Button } from '../components/button'
import { CheckboxField } from '../components/checkbox-field'
import { CodeDetails } from '../components/code-block'
import { Dialog } from '../components/dialog'
import { RadioGroupField } from '../components/radio-group-field'
import { StatusBadge, type Tone } from '../components/status-badge'
import { TextField } from '../components/text-field'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import {
  outgoing,
  runCounts,
  type DiagramConnection,
  type DiagramModel,
  type DiagramProblem,
  type DiagramStep,
  type DiagramStepKind,
} from './diagram-logic'
import { KIND_MESSAGE, STATE_LOOK, type DiagramRunStep } from './diagram-nodes'

/*
 * The parts of Diagram around its canvas: the kinds' small glyphs (palette and steps list), a
 * run's summary line, the problems with "Go to", the steps as a list (the diagram's accessible
 * alternative, and its view on a phone) and the three small dialogs of editing (one action
 * with one outcome each) — rename a step, connect it to another, label a connection.
 */

/** The run of a process the diagram shows (mode "run"), from the application. */
export interface DiagramRun {
  /** Each step's state; a step not listed was not reached. */
  steps: Readonly<Record<string, DiagramRunStep>>
  /** The connections the run went along, emphasised; the others are dashed. */
  path?: readonly string[]
  /** The run's own status ("Failed", danger), before the counts. */
  status?: { label: string; tone: Tone }
  /** A line the application writes about the run ("Started 06.10.2026. 02:00 · 14 min"). */
  summary?: string
}

// ── Glyphs ────────────────────────────────────────────────────────────────────────────────────

/** A kind's small sign (16px), as the canvas draws it. */
export function KindGlyph({ kind, className }: { kind: DiagramStepKind; className?: string }) {
  const classes = cn('size-4 shrink-0 text-primary', className)
  switch (kind) {
    case 'timer':
      return <Clock3 aria-hidden="true" className={classes} />
    case 'message':
      return <Mail aria-hidden="true" className={classes} />
    case 'user-task':
      return <UserRound aria-hidden="true" className={classes} />
    case 'service-task':
      return <Cog aria-hidden="true" className={classes} />
    case 'sub-process':
      return <SquarePlus aria-hidden="true" className={classes} />
    case 'parallel':
      return <DiamondPlus aria-hidden="true" className={classes} />
    default:
      break
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={classes}>
      {kind === 'start' && (
        <circle cx="8" cy="8" r="6.25" className="fill-none stroke-current" strokeWidth={1.5} />
      )}
      {kind === 'end' && (
        <circle cx="8" cy="8" r="5.75" className="fill-none stroke-current" strokeWidth={2.5} />
      )}
      {kind === 'task' && (
        <rect
          x="1.75"
          y="3.75"
          width="12.5"
          height="8.5"
          rx="2"
          className="fill-none stroke-current"
          strokeWidth={1.5}
        />
      )}
      {kind === 'exclusive' && (
        <>
          <path
            d="M8 1.5 14.5 8 8 14.5 1.5 8Z"
            className="fill-none stroke-current"
            strokeWidth={1.5}
          />
          <path d="M6 6 10 10M10 6 6 10" className="stroke-current" strokeWidth={1.5} />
        </>
      )}
    </svg>
  )
}

// ── A run's summary ───────────────────────────────────────────────────────────────────────────

/** "Failed · 4 of 7 steps done · 1 failed · Started …": the run's status, counts and line. */
export function RunSummary({ steps, run }: { steps: readonly DiagramStep[]; run: DiagramRun }) {
  const { messages, format } = useLiro()
  const counts = runCounts(steps, run.steps)
  const divider = (
    <span aria-hidden="true" className="h-4 border-0 border-s border-solid border-default" />
  )
  return (
    <div
      data-slot="diagram-run-summary"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-sm text-primary"
    >
      {run.status !== undefined && <StatusBadge label={run.status.label} tone={run.status.tone} />}
      <span className={cn('font-medium', TEXT_ISOLATE)}>
        {messages['diagram.runSummary'](
          counts.done,
          counts.total,
          format.number(String(counts.done)),
          format.number(String(counts.total)),
        )}
      </span>
      {counts.failed > 0 && (
        <>
          {divider}
          <span className={cn('text-status-danger-fg', TEXT_ISOLATE)}>
            {messages['diagram.failedCount'](counts.failed, format.number(String(counts.failed)))}
          </span>
        </>
      )}
      {run.summary !== undefined && (
        <>
          {divider}
          <span className={cn('text-secondary', TEXT_ISOLATE)}>{run.summary}</span>
        </>
      )}
    </div>
  )
}

// ── What a run needs ──────────────────────────────────────────────────────────────────────────

/**
 * The steps of a run that offer actions (a failed step's Skip and Retry), above the canvas: the
 * step's name and state, its reason and the application's buttons, the main one last. In the
 * danger tone for a failed step, neutral otherwise; full size whatever the diagram's zoom.
 */
export function RunAttention({
  steps,
  run,
  onStepAction,
}: {
  steps: readonly DiagramStep[]
  run: DiagramRun
  onStepAction: ((stepId: string, action: string) => void) | undefined
}) {
  const { messages } = useLiro()
  const items = steps.flatMap((step) => {
    const state = run.steps[step.id]
    return state?.actions !== undefined && state.actions.length > 0 ? [{ step, state }] : []
  })
  if (items.length === 0) return null
  return (
    <ul
      data-slot="diagram-run-attention"
      className="m-0 flex list-none flex-col gap-2 p-0 font-sans"
    >
      {items.map(({ step, state }) => {
        const look = STATE_LOOK[state.state]
        const Icon = look.icon
        const failed = state.state === 'failed'
        return (
          <li
            key={step.id}
            className={cn(
              'flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md p-3',
              failed ? 'bg-status-danger-bg' : 'bg-status-neutral-bg',
            )}
          >
            <div className="flex min-w-0 flex-1 basis-60 flex-col gap-0.5">
              <p className={cn('m-0 flex items-center gap-1.5 text-sm font-semibold', look.text)}>
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                <span className={TEXT_ISOLATE}>
                  {messages['diagram.stepState'](step.label, messages[look.message])}
                </span>
              </p>
              {state.reason !== undefined && (
                <p className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>{state.reason}</p>
              )}
              {state.log !== undefined && state.log !== '' && (
                <CodeDetails
                  code={state.log}
                  language={state.logLanguage}
                  label={messages['diagram.stepLog'](step.label)}
                />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(state.actions ?? []).map((action) => (
                <Button
                  key={action.key}
                  family={action.family ?? 'neutral'}
                  icon={action.icon}
                  label={action.label}
                  aria-label={messages['diagram.stepAction'](action.label, step.label)}
                  onClick={() => {
                    onStepAction?.(step.id, action.key)
                  }}
                />
              ))}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ── Problems ──────────────────────────────────────────────────────────────────────────────────

/** What a problem is about, in words: the step's name, or the connection's ends. */
export function problemTarget(model: DiagramModel, problem: DiagramProblem): string | null {
  const name = (id: string) => model.steps.find((step) => step.id === id)?.label ?? id
  if (problem.stepId !== undefined) return name(problem.stepId)
  const connection = model.connections.find((each) => each.id === problem.connectionId)
  return connection === undefined ? null : `${name(connection.from)} → ${name(connection.to)}`
}

/** "3 problems": each problem in the application's words, with Go to when it has a place. */
export function ProblemsList({
  model,
  problems,
  onGoTo,
}: {
  model: DiagramModel
  problems: readonly DiagramProblem[]
  onGoTo: (problem: DiagramProblem) => void
}) {
  const { messages, format } = useLiro()
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      data-slot="diagram-problems"
      className="flex flex-col gap-2 rounded-md border border-solid border-status-danger-border bg-status-danger-bg p-3 font-sans"
    >
      <h3
        id={headingId}
        className="m-0 flex items-center gap-1.5 text-sm font-semibold text-status-danger-fg"
      >
        <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
        <span className={TEXT_ISOLATE}>
          {messages['diagram.problems'](problems.length, format.number(String(problems.length)))}
        </span>
      </h3>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {problems.map((problem) => {
          const target = problemTarget(model, problem)
          return (
            <li
              key={problem.id}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-primary"
            >
              <p className={cn('m-0 min-w-0', TEXT_DIRECTION)}>
                {target !== null && <span className="font-semibold">{target}: </span>}
                {problem.message}
              </p>
              {target !== null && (
                <Button
                  family="neutral"
                  icon={LocateFixed}
                  label={messages['diagram.goToButton']}
                  aria-label={messages['diagram.goTo'](target)}
                  onClick={() => {
                    onGoTo(problem)
                  }}
                />
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// ── The steps as a list ───────────────────────────────────────────────────────────────────────

/** What follows a step, in words: the next steps with their conditions. */
export function nextText(
  model: DiagramModel,
  id: string,
  write: (label: string, condition: string | undefined) => string,
  defaultFlow: string,
  locale: string,
): string | null {
  const names = outgoing(model, id).map((connection: DiagramConnection) => {
    const target = model.steps.find((step) => step.id === connection.to)?.label ?? connection.to
    const condition = connection.label ?? (connection.isDefault === true ? defaultFlow : undefined)
    return write(target, condition)
  })
  if (names.length === 0) return null
  return new Intl.ListFormat(locale, { type: 'unit', style: 'short' }).format(names)
}

/** A step's state in the list: icon, words, note, reason and actions. */
function ListRunState({
  label,
  run,
  onAction,
}: {
  label: string
  run: DiagramRunStep | undefined
  onAction: (key: string) => void
}) {
  const { messages } = useLiro()
  const state = run?.state ?? 'not-reached'
  const look = STATE_LOOK[state]
  const Icon = look.icon
  return (
    <>
      <p className={cn('m-0 flex flex-wrap items-center gap-x-1.5 text-xs font-medium', look.text)}>
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
        <span className={TEXT_ISOLATE}>{messages[look.message]}</span>
        {run?.note !== undefined && (
          <span className={cn('font-regular text-secondary', TEXT_ISOLATE)}>{run.note}</span>
        )}
      </p>
      {run?.reason !== undefined && (
        <p
          className={cn(
            'm-0 text-xs',
            state === 'failed' ? 'text-status-danger-fg' : 'text-secondary',
            TEXT_DIRECTION,
          )}
        >
          {run.reason}
        </p>
      )}
      {run?.log !== undefined && run.log !== '' && (
        <CodeDetails
          code={run.log}
          language={run.logLanguage}
          label={messages['diagram.stepLog'](label)}
        />
      )}
      {run?.actions !== undefined && run.actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {run.actions.map((action) => (
            <Button
              key={action.key}
              family={action.family ?? 'neutral'}
              icon={action.icon}
              label={action.label}
              aria-label={messages['diagram.stepAction'](action.label, label)}
              onClick={() => {
                onAction(action.key)
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}

/**
 * The steps in the flow's order, each with its kind, lane, state, problems and what follows:
 * the diagram as text, for assistive technology and for a small screen.
 */
export function StepsList({
  label,
  model,
  order,
  lanes,
  mode,
  run,
  stepProblems,
  onStepAction,
}: {
  label: string
  model: DiagramModel
  order: readonly string[]
  lanes: ReadonlyMap<string, string>
  mode: 'view' | 'edit' | 'run'
  run: DiagramRun | undefined
  stepProblems: ReadonlyMap<string, DiagramProblem[]>
  onStepAction: ((stepId: string, action: string) => void) | undefined
}) {
  const { messages, locale } = useLiro()
  return (
    <ol
      aria-label={label}
      data-slot="diagram-steps"
      className="m-0 flex list-none flex-col rounded-lg border border-solid border-default bg-surface-raised px-4 py-1 font-sans"
    >
      {order.map((id) => {
        const step = model.steps.find((each) => each.id === id)
        if (step === undefined) return null
        const next = nextText(
          model,
          id,
          messages['diagram.nextStep'],
          messages['diagram.defaultFlow'],
          locale,
        )
        const lane = step.lane === undefined ? undefined : lanes.get(step.lane)
        const problems = stepProblems.get(id) ?? []
        return (
          <li
            key={id}
            data-step={id}
            className="flex gap-3 border-0 border-b border-solid border-subtle py-3 last:border-b-0"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-sunken">
              <KindGlyph kind={step.kind} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className={cn('m-0 text-sm font-medium text-primary', TEXT_DIRECTION)}>
                {step.label}
              </p>
              <p className="m-0 flex flex-wrap gap-x-3 text-xs text-secondary">
                <span className={TEXT_ISOLATE}>{messages[KIND_MESSAGE[step.kind]]}</span>
                {lane !== undefined && (
                  <span className={TEXT_ISOLATE}>{messages['diagram.inLane'](lane)}</span>
                )}
              </p>
              {mode === 'run' && run !== undefined && (
                <ListRunState
                  label={step.label}
                  run={run.steps[id]}
                  onAction={(key) => {
                    onStepAction?.(id, key)
                  }}
                />
              )}
              {problems.map((problem) => (
                <p
                  key={problem.id}
                  className="m-0 flex items-start gap-1.5 text-xs text-status-danger-fg"
                >
                  <TriangleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                  <span className={TEXT_DIRECTION}>{problem.message}</span>
                </p>
              ))}
              {next !== null && (
                <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
                  {messages['diagram.next'](next)}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// ── Dialogs ───────────────────────────────────────────────────────────────────────────────────

function DialogActions({
  formId,
  submit,
  onCancel,
}: {
  formId: string
  submit: string | null
  onCancel: () => void
}) {
  const { messages } = useLiro()
  return (
    <>
      <ButtonPrimitive family="neutral" emphasis="secondary" onClick={onCancel}>
        <span className={TEXT_DIRECTION}>{messages['dialog.cancel']}</span>
      </ButtonPrimitive>
      {submit !== null && (
        <ButtonPrimitive family="primary" emphasis="primary" type="submit" form={formId}>
          <span className={TEXT_DIRECTION}>{submit}</span>
        </ButtonPrimitive>
      )}
    </>
  )
}

/** The dialogs of editing; one at a time. */
export type DiagramDialog =
  { type: 'rename'; id: string } | { type: 'label'; id: string } | { type: 'connect'; id: string }

/** Its first field takes the focus when the dialog opens. */
function useFirstFocus(id: string) {
  useEffect(() => {
    document.getElementById(id)?.focus()
  }, [id])
}

function RenameForm(props: {
  formId: string
  step: DiagramStep
  onRename: (label: string) => void
}) {
  const { messages } = useLiro()
  const [text, setText] = useState(props.step.label)
  const [invalid, setInvalid] = useState(false)
  const inputId = `${props.formId}-name`
  useFirstFocus(inputId)
  return (
    <form
      id={props.formId}
      noValidate
      onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (text.trim() === '') {
          setInvalid(true)
          return
        }
        props.onRename(text.trim())
      }}
    >
      <TextField
        id={inputId}
        label={messages['diagram.name']}
        required
        value={text}
        onChange={(next) => {
          setText(next)
          setInvalid(false)
        }}
        {...(invalid ? { error: messages['field.required'] } : {})}
      />
    </form>
  )
}

function LabelForm(props: {
  formId: string
  connection: DiagramConnection
  /** The connection leaves a decision: it may be its default way out. */
  fromDecision: boolean
  onLabel: (label: string | undefined, isDefault: boolean) => void
}) {
  const { messages } = useLiro()
  const [text, setText] = useState(props.connection.label ?? '')
  const [isDefault, setIsDefault] = useState(props.connection.isDefault === true)
  const inputId = `${props.formId}-label`
  useFirstFocus(inputId)
  return (
    <form
      id={props.formId}
      noValidate
      onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        props.onLabel(text.trim() === '' ? undefined : text.trim(), isDefault)
      }}
      className="flex flex-col gap-4"
    >
      <TextField
        id={inputId}
        label={messages['diagram.condition']}
        value={text}
        onChange={setText}
      />
      {props.fromDecision && (
        <CheckboxField
          label={messages['diagram.defaultWay']}
          checked={isDefault}
          onChange={setIsDefault}
        />
      )}
    </form>
  )
}

function ConnectForm(props: {
  formId: string
  targets: readonly DiagramStep[]
  onConnect: (to: string, label: string | undefined) => void
}) {
  const { messages } = useLiro()
  const [to, setTo] = useState(props.targets[0]?.id ?? '')
  const [text, setText] = useState('')
  if (props.targets.length === 0) {
    return (
      <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
        {messages['diagram.noTargets']}
      </p>
    )
  }
  return (
    <form
      id={props.formId}
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (to !== '') props.onConnect(to, text.trim() === '' ? undefined : text.trim())
      }}
    >
      <RadioGroupField
        label={messages['diagram.connectTarget']}
        value={to}
        onChange={setTo}
        options={props.targets.map((step) => ({
          value: step.id,
          label: step.label,
          description: messages[KIND_MESSAGE[step.kind]],
        }))}
      />
      <TextField label={messages['diagram.connectLabel']} value={text} onChange={setText} />
    </form>
  )
}

/** The open dialog of editing: rename, label or connect. */
export function EditDialog({
  dialog,
  model,
  targets,
  onClose,
  onRename,
  onLabel,
  onConnect,
}: {
  dialog: DiagramDialog | null
  model: DiagramModel
  targets: readonly DiagramStep[]
  onClose: () => void
  onRename: (id: string, label: string) => void
  onLabel: (id: string, label: string | undefined, isDefault: boolean) => void
  onConnect: (from: string, to: string, label: string | undefined) => void
}) {
  const { messages } = useLiro()
  const formId = useId()
  const step =
    dialog !== null && dialog.type !== 'label'
      ? model.steps.find((each) => each.id === dialog.id)
      : undefined
  const connection =
    dialog?.type === 'label' ? model.connections.find((each) => each.id === dialog.id) : undefined
  const open = dialog !== null && (step !== undefined || connection !== undefined)
  // The action as the title, the step or connection it acts on bold under it.
  const title =
    dialog?.type === 'rename'
      ? messages['diagram.renameTitle']
      : dialog?.type === 'label'
        ? messages['diagram.labelTitle']
        : messages['diagram.connectTitle']
  const stepLabel = (id: string) => model.steps.find((each) => each.id === id)?.label ?? ''
  const subject =
    connection !== undefined
      ? messages['diagram.connectionName'](stepLabel(connection.from), stepLabel(connection.to))
      : (step?.label ?? '')
  const submit = dialog?.type === 'connect' ? messages['diagram.connect'] : messages['diagram.save']
  const canSubmit = dialog?.type !== 'connect' || targets.length > 0
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title={title}
      subject={subject}
      actions={
        <DialogActions formId={formId} submit={canSubmit ? submit : null} onCancel={onClose} />
      }
    >
      {open && dialog.type === 'rename' && step !== undefined && (
        <RenameForm
          formId={formId}
          step={step}
          onRename={(label) => {
            onRename(step.id, label)
          }}
        />
      )}
      {open && dialog.type === 'label' && connection !== undefined && (
        <LabelForm
          formId={formId}
          connection={connection}
          fromDecision={
            model.steps.find((each) => each.id === connection.from)?.kind === 'exclusive'
          }
          onLabel={(label, isDefault) => {
            onLabel(connection.id, label, isDefault)
          }}
        />
      )}
      {open && dialog.type === 'connect' && step !== undefined && (
        <ConnectForm
          formId={formId}
          targets={targets}
          onConnect={(to, label) => {
            onConnect(step.id, to, label)
          }}
        />
      )}
    </Dialog>
  )
}
