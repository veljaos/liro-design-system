import { ArrowRightLeft, Repeat } from 'lucide-react'
import { useState, type ReactElement } from 'react'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  Dialog as DialogRoot,
  DialogTitle,
} from '../primitives/dialog'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import { DateField } from './date-field'
import { Dialog } from './dialog'
import { MultiSelectField } from './multi-select-field'
import { SelectField } from './select-field'
import {
  moveChange,
  rotationAssignments,
  type RotationPattern,
  type ShiftAssignment,
  type ShiftChange,
} from './shift-logic'
import { TEMPLATE_TONE, timeTexts, type ShiftTemplate } from './shift-parts'

/*
 * The dialogs of ShiftPlanner (P5.24 b): "Apply rotation…" and "Move to…" — the planner's ways
 * that need no dragging (WCAG 2.5.7). Internal: not exported from the package.
 */

/** What the dialogs need of a row. */
interface RowName {
  id: string
  name: string
}

/** A day as an option: its weekday and date in words. */
function useDayOptions(days: readonly string[]) {
  const { format } = useLiro()
  return days.map((day) => ({ value: day, label: format.dateLong(day) }))
}

export interface RotationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger?: ReactElement
  rotations: readonly RotationPattern[]
  templates: readonly ShiftTemplate[]
  rows: readonly RowName[]
  /** The people chosen when it opens (the rows of the selected range). */
  defaultPeople: readonly string[]
  /** The period it fills by default. */
  start: string
  end: string
  onApply: (changes: ShiftChange[]) => void
}

/**
 * "Apply rotation…": a pattern, the people, the dates and an offset per person; Apply reports the
 * generated assignments (`rotationAssignments`) as additions. Its fields start afresh each time
 * it opens.
 */
export function RotationDialog(props: RotationDialogProps) {
  const { messages } = useLiro()
  const [round, setRound] = useState(0)
  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (open) setRound((value) => value + 1)
        props.onOpenChange(open)
      }}
      {...(props.trigger === undefined ? {} : { trigger: props.trigger })}
      title={messages['shifts.rotationTitle']}
    >
      <RotationForm key={round} {...props} />
    </Dialog>
  )
}

function RotationForm(props: RotationDialogProps) {
  const { messages, format } = useLiro()
  const [patternId, setPatternId] = useState(props.rotations[0]?.id ?? '')
  const [people, setPeople] = useState<string[]>([...props.defaultPeople])
  const [start, setStart] = useState<string | null>(props.start)
  const [end, setEnd] = useState<string | null>(props.end)
  const [offset, setOffset] = useState('0')
  const [tried, setTried] = useState(false)
  const pattern = props.rotations.find((each) => each.id === patternId) ?? props.rotations[0]
  const generated =
    pattern === undefined || start === null || end === null
      ? []
      : rotationAssignments(pattern, people, start, end, Number(offset))
  const templateOf = (id: string) => props.templates.find((template) => template.id === id)
  const noPeople = tried && people.length === 0
  const apply = () => {
    setTried(true)
    if (people.length === 0 || start === null || end === null) return
    props.onApply(generated.map((each) => ({ type: 'add', ...each })))
    props.onOpenChange(false)
  }
  return (
    <div className="flex flex-col gap-4">
      <SelectField
        label={messages['shifts.rotationPattern']}
        value={pattern?.id ?? ''}
        options={props.rotations.map((each) => ({ value: each.id, label: each.label }))}
        onChange={(value) => {
          setPatternId(value)
          setOffset('0')
        }}
      />
      {pattern !== undefined && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-secondary">
            {messages['shifts.rotationSteps']}
          </span>
          <ol className="m-0 flex list-none flex-wrap gap-1 p-0">
            {pattern.steps.map((step, index) => {
              const template = step === null ? undefined : templateOf(step)
              const name =
                template === undefined
                  ? messages['shifts.dayOff']
                  : `${template.label}, ${timeTexts(format, messages, template.start, template.end).spoken}`
              return (
                <li
                  key={index}
                  className={cn(
                    'box-border flex min-w-7 justify-center rounded-sm border border-solid px-1.5 py-0.5 text-xs',
                    template === undefined
                      ? 'border-default bg-surface-raised text-tertiary'
                      : TEMPLATE_TONE[template.tone ?? 'neutral'],
                  )}
                >
                  <span aria-hidden="true" className={cn('font-semibold', TEXT_ISOLATE)}>
                    {template === undefined ? '–' : template.short}
                  </span>
                  <span className="sr-only">{name}</span>
                </li>
              )
            })}
          </ol>
        </div>
      )}
      <MultiSelectField
        label={messages['shifts.rotationPeople']}
        required
        value={people}
        options={props.rows.map((row) => ({ value: row.id, label: row.name }))}
        onChange={setPeople}
        {...(noPeople ? { error: messages['shifts.rotationNoPeople'] } : {})}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DateField
          label={messages['shifts.rotationStart']}
          required
          value={start}
          onChange={setStart}
        />
        <DateField label={messages['shifts.rotationEnd']} required value={end} onChange={setEnd} />
      </div>
      <SelectField
        label={messages['shifts.rotationOffset']}
        value={offset}
        options={Array.from({ length: Math.max(1, pattern?.steps.length ?? 1) }, (_, days) => ({
          value: String(days),
          label: messages['shifts.rotationOffsetValue'](days, format.number(String(days))),
        }))}
        onChange={setOffset}
      />
      <p role="status" className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
        {messages['shifts.rotationSummary'](
          generated.length,
          format.number(String(generated.length)),
        )}
      </p>
      <DialogFooter>
        <Button
          intent="cancel"
          label={messages['dialog.cancel']}
          onClick={() => {
            props.onOpenChange(false)
          }}
        />
        <Button
          family="primary"
          icon={Repeat}
          emphasis="primary"
          label={messages['shifts.rotationApply']}
          onClick={apply}
        />
      </DialogFooter>
    </div>
  )
}

export interface MoveDialogProps {
  /** The assignment to move; the dialog is open while it is set. */
  assignment: ShiftAssignment | null
  /** Its template's name. */
  label: string
  rows: readonly RowName[]
  days: readonly string[]
  onClose: () => void
  onMove: (change: ShiftChange) => void
  /** Where the focus goes when it closes (it was opened from a menu that is gone). */
  onCloseFocus: () => void
}

/** "Move to…": a person and a day for one assignment, without dragging. */
export function MoveDialog(props: MoveDialogProps) {
  const { messages } = useLiro()
  return (
    <DialogRoot
      open={props.assignment !== null}
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          props.onCloseFocus()
        }}
      >
        <DialogHeader>
          <DialogTitle>{messages['shifts.moveTitle'](props.label)}</DialogTitle>
          <DialogCloseButton label={messages['dialog.close']} />
        </DialogHeader>
        <DialogBody>
          {props.assignment !== null && (
            <MoveForm key={props.assignment.id} {...props} assignment={props.assignment} />
          )}
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  )
}

function MoveForm(props: MoveDialogProps & { assignment: ShiftAssignment }) {
  const { messages } = useLiro()
  const [rowId, setRowId] = useState(props.assignment.rowId)
  const [date, setDate] = useState(props.assignment.date)
  const dayOptions = useDayOptions(props.days)
  return (
    <div className="flex flex-col gap-4">
      <SelectField
        label={messages['shifts.movePerson']}
        value={rowId}
        options={props.rows.map((row) => ({ value: row.id, label: row.name }))}
        onChange={setRowId}
      />
      <SelectField
        label={messages['shifts.moveDay']}
        value={date}
        options={dayOptions}
        onChange={setDate}
      />
      <DialogFooter>
        <Button intent="cancel" label={messages['dialog.cancel']} onClick={props.onClose} />
        <Button
          family="primary"
          icon={ArrowRightLeft}
          emphasis="primary"
          label={messages['shifts.moveButton']}
          onClick={() => {
            const change = moveChange(props.assignment, { rowId, date })
            if (change !== null) props.onMove(change)
            props.onClose()
          }}
        />
      </DialogFooter>
    </div>
  )
}
