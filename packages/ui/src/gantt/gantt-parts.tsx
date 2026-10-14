import { Flag, Trash2 } from 'lucide-react'
import { useEffect, useId, useMemo, useState, type SubmitEvent } from 'react'
import { CompactIconButton } from '../components/button'
import { DateField, DateRangeField } from '../components/date-field'
import { Dialog } from '../components/dialog'
import { MoneyText } from '../components/display-text'
import { NumberField } from '../components/number-field'
import { SelectField } from '../components/select-field'
import { StatusBadge } from '../components/status-badge'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import {
  dependencyCandidates,
  GANTT_DEPENDENCY_TYPES,
  isProgress,
  kindOf,
  movedDates,
  phaseGroups,
  predecessors,
  type GanttChange,
  type GanttDependency,
  type GanttDependencyType,
  type GanttTask,
} from './gantt-logic'

/*
 * Gantt's parts (P5.37): the words of a row, the list by phase (the phone's view and the
 * timeline's text alternative) and the four dialogs that edit a row without dragging (WCAG 2.5.7):
 * Move…, Change dates…, Set progress… and Dependencies…, each titled by its action with the row
 * bold under it (D22). The dialogs report changes; nothing is saved here.
 */

/** The message of each kind of dependency, in a business user's words. */
export const DEPENDENCY_MESSAGE: Readonly<
  Record<
    GanttDependencyType,
    'gantt.finishToStart' | 'gantt.startToStart' | 'gantt.finishToFinish' | 'gantt.startToFinish'
  >
> = {
  'finish-to-start': 'gantt.finishToStart',
  'start-to-start': 'gantt.startToStart',
  'finish-to-finish': 'gantt.finishToFinish',
  'start-to-finish': 'gantt.startToFinish',
}

/** The words of rows: dates, progress, kind, the rows each follows and the accessible name. */
export function useRowWords(tasks: readonly GanttTask[], dependencies: readonly GanttDependency[]) {
  const { messages, format } = useLiro()
  return useMemo(() => {
    const labelOf = (id: string) => tasks.find((task) => task.id === id)?.label ?? id
    const kindName = (task: GanttTask) =>
      messages[
        kindOf(task) === 'phase'
          ? 'gantt.kindPhase'
          : kindOf(task) === 'milestone'
            ? 'gantt.kindMilestone'
            : 'gantt.kindTask'
      ]
    const dates = (task: GanttTask) =>
      kindOf(task) === 'milestone'
        ? format.date(task.start)
        : `${format.date(task.start)} – ${format.date(task.end)}`
    const percent = (value: string) => format.percent(value)
    const done = (task: GanttTask) =>
      isProgress(task.progress) ? messages['gantt.done'](percent(task.progress)) : null
    const after = (task: GanttTask) => {
      const names = predecessors(dependencies, task.id).map((each) => labelOf(each.from))
      return names.length === 0 ? null : messages['gantt.after'](names.join(', '))
    }
    /** "Task: Floors 3–4, in Structure, 12.10.2026. – 06.11.2026., 20% done, Crew Ilić, At risk". */
    const name = (task: GanttTask, phase?: GanttTask) =>
      [
        messages['gantt.rowName'](kindName(task), task.label),
        phase === undefined ? null : messages['gantt.inPhase'](phase.label),
        dates(task),
        done(task),
        task.assignee ?? null,
        task.state?.label ?? null,
        after(task),
      ]
        .filter((part): part is string => part !== null)
        .join(', ')
    return { labelOf, kindName, dates, percent, done, after, name }
  }, [tasks, dependencies, messages, format])
}

// ── The list by phase ─────────────────────────────────────────────────────────────────────────

/** One row of the list: name, dates, who, progress, state, what it follows. */
function ListRow({ task, words }: { task: GanttTask; words: ReturnType<typeof useRowWords> }) {
  const milestone = kindOf(task) === 'milestone'
  const done = words.done(task)
  const after = words.after(task)
  return (
    <li
      data-slot="gantt-list-row"
      className="flex flex-col gap-1 border-0 border-b border-solid border-subtle py-3 last:border-b-0"
    >
      <div className="flex min-w-0 items-start gap-2">
        {milestone && <Flag aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-secondary" />}
        <span className={cn('min-w-0 flex-1 text-sm font-medium text-primary', TEXT_DIRECTION)}>
          {milestone && <span className="sr-only">{words.kindName(task)}: </span>}
          {task.label}
        </span>
        {task.state !== undefined && (
          <StatusBadge label={task.state.label} tone={task.state.tone} />
        )}
      </div>
      <span className={cn('text-xs text-secondary tabular-nums', TEXT_DIRECTION)}>
        {[words.dates(task), done, task.assignee].filter((part) => part != null).join(' · ')}
      </span>
      {after !== null && (
        <span className={cn('text-xs text-tertiary', TEXT_DIRECTION)}>{after}</span>
      )}
    </li>
  )
}

/** A phase's money under its name: planned and spent, the application's verdict. */
function PhaseBudget({ task }: { task: GanttTask }) {
  const { messages } = useLiro()
  const budget = task.budget
  if (budget === undefined) return null
  return (
    <dl className="m-0 flex flex-wrap gap-x-6 gap-y-1 text-xs">
      <div className="flex gap-1">
        <dt className={cn('text-secondary', TEXT_DIRECTION)}>{messages['gantt.planned']}</dt>
        <dd className="m-0 font-medium text-primary">
          <MoneyText value={budget.planned} currency={budget.currency} />
        </dd>
      </div>
      <div className="flex gap-1">
        <dt className={cn('text-secondary', TEXT_DIRECTION)}>{messages['gantt.actual']}</dt>
        <dd className="m-0 font-medium text-primary">
          <MoneyText value={budget.actual} currency={budget.currency} />
        </dd>
      </div>
      {budget.state !== undefined && (
        <div className="flex gap-1">
          <dt className="sr-only">{messages['gantt.actual']}</dt>
          <dd className="m-0">
            <StatusBadge label={budget.state.label} tone={budget.state.tone} />
          </dd>
        </div>
      )}
    </dl>
  )
}

/**
 * The plan as a list by phase: each phase a heading with its dates, progress and money, its rows
 * under it. The phone's view, and the timeline's text alternative on every width.
 */
export function GanttList({
  tasks,
  dependencies,
  label,
}: {
  tasks: readonly GanttTask[]
  dependencies: readonly GanttDependency[]
  label: string
}) {
  const words = useRowWords(tasks, dependencies)
  const groups = phaseGroups(tasks)
  return (
    <div data-slot="gantt-list" role="region" aria-label={label} className="flex flex-col gap-3">
      {groups.map((group, index) =>
        group.phase === null ? (
          <ul
            key={group.rows[0]?.id ?? String(index)}
            className="m-0 list-none rounded-md border border-solid border-default bg-surface-raised px-4 py-0"
          >
            {group.rows.map((task) => (
              <ListRow key={task.id} task={task} words={words} />
            ))}
          </ul>
        ) : (
          <section
            key={group.phase.id}
            aria-labelledby={`gantt-phase-${group.phase.id}`}
            className="flex flex-col gap-1 rounded-md border border-solid border-default bg-surface-raised px-4 pt-3"
          >
            <div className="flex min-w-0 items-start gap-2">
              <h3
                id={`gantt-phase-${group.phase.id}`}
                className={cn(
                  'm-0 min-w-0 flex-1 text-md font-semibold text-primary',
                  TEXT_DIRECTION,
                )}
              >
                {group.phase.label}
              </h3>
              {group.phase.state !== undefined && (
                <StatusBadge label={group.phase.state.label} tone={group.phase.state.tone} />
              )}
            </div>
            <span className={cn('text-xs text-secondary tabular-nums', TEXT_DIRECTION)}>
              {[words.dates(group.phase), words.done(group.phase), group.phase.assignee]
                .filter((part) => part != null)
                .join(' · ')}
            </span>
            <PhaseBudget task={group.phase} />
            {group.rows.length > 0 && (
              <ul className="m-0 mt-1 list-none border-0 border-t border-solid border-subtle p-0">
                {group.rows.map((task) => (
                  <ListRow key={task.id} task={task} words={words} />
                ))}
              </ul>
            )}
            {group.rows.length === 0 && <div className="pb-3" />}
          </section>
        ),
      )}
    </div>
  )
}

// ── The dialogs ───────────────────────────────────────────────────────────────────────────────

/** The dialog open on a row. */
export interface GanttDialog {
  type: 'move' | 'dates' | 'progress' | 'dependencies'
  id: string
}

function DialogActions({
  formId,
  submit,
  onCancel,
}: {
  formId: string
  submit: string
  onCancel: () => void
}) {
  const { messages } = useLiro()
  return (
    <>
      <ButtonPrimitive family="neutral" emphasis="secondary" onClick={onCancel}>
        <span className={TEXT_DIRECTION}>{messages['dialog.cancel']}</span>
      </ButtonPrimitive>
      <ButtonPrimitive family="primary" emphasis="primary" type="submit" form={formId}>
        <span className={TEXT_DIRECTION}>{submit}</span>
      </ButtonPrimitive>
    </>
  )
}

/** Its first field takes the focus when the dialog opens. */
function useFirstFocus(id: string) {
  useEffect(() => {
    document.getElementById(id)?.querySelector<HTMLElement>('input')?.focus()
  }, [id])
}

function MoveForm(props: {
  formId: string
  task: GanttTask
  onSubmit: (start: string, end: string) => void
}) {
  const { messages, format } = useLiro()
  const [start, setStart] = useState<string | null>(props.task.start)
  const [invalid, setInvalid] = useState(false)
  const fieldId = `${props.formId}-start`
  useFirstFocus(`${fieldId}-box`)
  const dates = start === null ? null : movedDates(props.task, start)
  return (
    <form
      id={props.formId}
      noValidate
      onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (dates === null) {
          setInvalid(true)
          return
        }
        props.onSubmit(dates.start, dates.end)
      }}
    >
      <div id={`${fieldId}-box`}>
        <DateField
          label={messages['gantt.newStart']}
          required
          value={start}
          onChange={(next) => {
            setStart(next)
            setInvalid(false)
          }}
          {...(dates !== null && kindOf(props.task) !== 'milestone'
            ? { description: messages['gantt.keepsLength'](format.date(dates.end)) }
            : {})}
          {...(invalid ? { error: messages['field.required'] } : {})}
        />
      </div>
    </form>
  )
}

function DatesForm(props: {
  formId: string
  task: GanttTask
  onSubmit: (start: string, end: string) => void
}) {
  const { messages } = useLiro()
  const milestone = kindOf(props.task) === 'milestone'
  const [range, setRange] = useState<{ start: string | null; end: string | null }>({
    start: props.task.start,
    end: props.task.end,
  })
  const [day, setDay] = useState<string | null>(props.task.start)
  const [valid, setValid] = useState(true)
  const [invalid, setInvalid] = useState(false)
  const boxId = `${props.formId}-dates`
  useFirstFocus(boxId)
  return (
    <form
      id={props.formId}
      noValidate
      onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (milestone) {
          if (day === null) {
            setInvalid(true)
            return
          }
          props.onSubmit(day, day)
          return
        }
        if (!valid || range.start === null || range.end === null) {
          setInvalid(true)
          return
        }
        props.onSubmit(range.start, range.end)
      }}
    >
      <div id={boxId}>
        {milestone ? (
          <DateField
            label={messages['gantt.date']}
            required
            value={day}
            onChange={(next) => {
              setDay(next)
              setInvalid(false)
            }}
            {...(invalid ? { error: messages['field.required'] } : {})}
          />
        ) : (
          <DateRangeField
            label={messages['gantt.dates']}
            required
            value={range}
            onChange={(next) => {
              setRange(next)
              setInvalid(false)
            }}
            onValidityChange={setValid}
            {...(invalid && valid ? { error: messages['field.required'] } : {})}
          />
        )}
      </div>
    </form>
  )
}

function ProgressForm(props: {
  formId: string
  task: GanttTask
  onSubmit: (progress: string) => void
}) {
  const { messages } = useLiro()
  const [value, setValue] = useState<string | null>(
    isProgress(props.task.progress) ? props.task.progress : null,
  )
  const [readable, setReadable] = useState(true)
  const [invalid, setInvalid] = useState(false)
  const boxId = `${props.formId}-progress`
  useFirstFocus(boxId)
  return (
    <form
      id={props.formId}
      noValidate
      onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!isProgress(value)) {
          setInvalid(true)
          return
        }
        props.onSubmit(value)
      }}
    >
      <div id={boxId}>
        <NumberField
          label={messages['gantt.doneField']}
          required
          value={value}
          onChange={(next) => {
            setValue(next)
            setInvalid(false)
          }}
          onValidityChange={setReadable}
          {...(invalid && readable ? { error: messages['gantt.progressRange'] } : {})}
        />
      </div>
    </form>
  )
}

function DependenciesForm(props: {
  formId: string
  task: GanttTask
  tasks: readonly GanttTask[]
  dependencies: readonly GanttDependency[]
  onChange: (change: GanttChange) => void
}) {
  const { messages } = useLiro()
  const candidates = dependencyCandidates(props.tasks, props.dependencies, props.task.id)
  const [from, setFrom] = useState(candidates[0]?.id ?? '')
  const [how, setHow] = useState<GanttDependencyType>('finish-to-start')
  const current = predecessors(props.dependencies, props.task.id)
  const labelOf = (id: string) => props.tasks.find((task) => task.id === id)?.label ?? id
  const chosen = candidates.some((each) => each.id === from) ? from : (candidates[0]?.id ?? '')
  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby={`${props.formId}-current`} className="flex flex-col gap-2">
        <h3
          id={`${props.formId}-current`}
          className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}
        >
          {messages['gantt.follows']}
        </h3>
        {current.length === 0 ? (
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
            {messages['gantt.followsNothing']}
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {current.map((dependency) => (
              <li
                key={dependency.id}
                className="flex min-h-9 items-center gap-2 rounded-sm bg-surface-sunken ps-3 pe-1"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}>
                    {labelOf(dependency.from)}
                  </span>
                  <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                    {messages[DEPENDENCY_MESSAGE[dependency.type ?? 'finish-to-start']]}
                  </span>
                </span>
                <CompactIconButton
                  icon={Trash2}
                  label={messages['gantt.removeDependency'](labelOf(dependency.from))}
                  onClick={() => {
                    props.onChange({ type: 'remove-dependency', id: dependency.id })
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      {candidates.length === 0 ? (
        <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
          {messages['gantt.noCandidates']}
        </p>
      ) : (
        <form
          id={props.formId}
          noValidate
          aria-labelledby={`${props.formId}-add`}
          className="flex flex-col gap-3 border-0 border-t border-solid border-subtle pt-4"
          onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
            event.preventDefault()
            if (chosen === '') return
            props.onChange({
              type: 'add-dependency',
              from: chosen,
              to: props.task.id,
              dependencyType: how,
            })
          }}
        >
          <h3
            id={`${props.formId}-add`}
            className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}
          >
            {messages['gantt.addFollows']}
          </h3>
          <SelectField
            label={messages['gantt.kindTask']}
            value={chosen}
            onChange={setFrom}
            options={candidates.map((task) => ({ value: task.id, label: task.label }))}
          />
          <SelectField
            label={messages['gantt.dependencyHow']}
            value={how}
            onChange={(next) => {
              const found = GANTT_DEPENDENCY_TYPES.find((type) => type === next)
              if (found !== undefined) setHow(found)
            }}
            options={GANTT_DEPENDENCY_TYPES.map((type) => ({
              value: type,
              label: messages[DEPENDENCY_MESSAGE[type]],
            }))}
          />
          <div className="flex justify-end">
            <ButtonPrimitive family="neutral" emphasis="secondary" type="submit">
              <span className={TEXT_DIRECTION}>{messages['gantt.addDependency']}</span>
            </ButtonPrimitive>
          </div>
        </form>
      )}
    </div>
  )
}

/** The open dialog: Move, Change dates, Set progress or Dependencies. */
export function GanttDialogs({
  dialog,
  tasks,
  dependencies,
  onClose,
  onChange,
}: {
  dialog: GanttDialog | null
  tasks: readonly GanttTask[]
  dependencies: readonly GanttDependency[]
  onClose: () => void
  onChange: (change: GanttChange) => void
}) {
  const { messages } = useLiro()
  const formId = useId()
  const task = dialog === null ? undefined : tasks.find((each) => each.id === dialog.id)
  const open = dialog !== null && task !== undefined
  const title =
    dialog?.type === 'move'
      ? messages['gantt.moveTitle']
      : dialog?.type === 'dates'
        ? messages['gantt.datesTitle']
        : dialog?.type === 'progress'
          ? messages['gantt.progressTitle']
          : messages['gantt.dependenciesTitle']
  const submit = dialog?.type === 'move' ? messages['gantt.moveButton'] : messages['gantt.save']
  const dates = (start: string, end: string) => {
    if (task !== undefined) onChange({ type: 'dates', id: task.id, start, end })
    onClose()
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title={title}
      subject={<span className={TEXT_ISOLATE}>{task?.label ?? ''}</span>}
      actions={
        dialog?.type === 'dependencies' ? (
          <ButtonPrimitive family="neutral" emphasis="secondary" onClick={onClose}>
            <span className={TEXT_DIRECTION}>{messages['gantt.close']}</span>
          </ButtonPrimitive>
        ) : (
          <DialogActions formId={formId} submit={submit} onCancel={onClose} />
        )
      }
    >
      {open && dialog.type === 'move' && <MoveForm formId={formId} task={task} onSubmit={dates} />}
      {open && dialog.type === 'dates' && (
        <DatesForm formId={formId} task={task} onSubmit={dates} />
      )}
      {open && dialog.type === 'progress' && (
        <ProgressForm
          formId={formId}
          task={task}
          onSubmit={(progress) => {
            onChange({ type: 'progress', id: task.id, progress })
            onClose()
          }}
        />
      )}
      {open && dialog.type === 'dependencies' && (
        <DependenciesForm
          formId={formId}
          task={task}
          tasks={tasks}
          dependencies={dependencies}
          onChange={onChange}
        />
      )}
    </Dialog>
  )
}
