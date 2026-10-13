import { ArrowRight, Save } from 'lucide-react'
import { useState, type ReactElement, type ReactNode } from 'react'
import { LoadingButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { DialogFooter } from '../primitives/dialog'
import type { LiroMessages } from '../provider/messages'
import { useLiro } from '../provider/liro-provider'
import { Alert } from './alert'
import { Button } from './button'
import { CheckboxField } from './checkbox-field'
import { Dialog } from './dialog'

/*
 * ChangeConfirmDialog (BUILD-PLAN P5.28 item 9, the owner's review): moving something other people
 * rely on — an appointment, a shift, a reservation, a seat, a room or a bed — is never final, and
 * never messages anyone, until the user confirms it. A drag, a "Move to…" or a "Transfer…" only
 * proposes the change: the application opens this dialog with it, and applies it on Save.
 * - Title: the action ("Move appointment"); `subject`: the record, bold on its own line (item 6).
 * - The change, old → new, one line per field ("Doctor  dr Marko Stanković → dr Nada Grujić";
 *   the old value text.secondary, the new one medium; "Before:" and "After:" for assistive
 *   technology; the arrow follows the direction). `affected`: who it concerns, in the
 *   application's words. `warning`: the application's own check (a clash, a rule), a warning
 *   Alert; the dialog decides nothing.
 * - "Notify …" is an explicit choice: one checkbox per message the application can send
 *   ("Notify Jovana Nikolić by SMS"), each as the application sets it (`defaultChecked`), so
 *   nobody is messaged without seeing it here. With any checked the button says "Save and
 *   notify"; `onConfirm` receives the checked ids.
 * - Cancel, then Save (primary, last). Cancel changes nothing: the record stays where it was.
 *   A returned promise keeps the dialog working (Save busy, Cancel disabled, not dismissible); it
 *   closes when the promise resolves and stays open when it rejects.
 * - `children` (P5.28, floor plans): the application's own choice that makes the change, above
 *   it — the free tables a party can move to, the free beds by room —, so the move is chosen and
 *   confirmed in one dialog; the changes follow the choice.
 * - Pending changes: where the user makes several changes before deciding (a seating plan, a week
 *   of shifts), the application keeps them pending on the page ("3 changes not saved") and opens
 *   this dialog from its Save with every change as a line (the record in the line's label).
 * - When not: a change only the user relies on (their own draft) needs no confirmation; a delete
 *   or an action that cannot be undone is a ConfirmDialog.
 */

/** One field that changes: its name, the old value and the new one, from the application. */
export interface ChangeLine {
  /** Stable key; default the label. */
  key?: string
  /** The field ("Doctor", "Time", "Table 7 · Guests"). */
  label: string
  /** The value now; null or '' when there was none (shown "—"). */
  from: ReactNode
  /** The value after the change. */
  to: ReactNode
}

/** A message the application can send with the change, offered as a checkbox. */
export interface NotifyOption {
  id: string
  /** "Notify Jovana Nikolić by SMS". */
  label: string
  /** A line under it: what the message says, or where it goes. */
  description?: string
  /** Checked when the dialog opens; the application decides. Default false. */
  defaultChecked?: boolean
}

/** What the user confirmed: the ids of the messages to send. */
export interface ChangeConfirmAnswer {
  notify: string[]
}

export interface ChangeConfirmDialogProps {
  /** Controlled open state. */
  open?: boolean
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The element that opens it, usually a Button. */
  trigger?: ReactElement
  /** The action, from the application: "Move appointment". */
  title: ReactNode
  /** The record it acts on, from the application: "Jovana Nikolić, check-up". */
  subject?: ReactNode
  /** A line under the title, from the application. */
  description?: ReactNode
  /**
   * The application's choice that makes the change, above it (P5.28: the free tables with
   * enough seats as a CandidateList); the application keeps `changes` in step with it.
   */
  children?: ReactNode
  /** The change, old → new, one line per field. */
  changes: readonly ChangeLine[]
  /** Who the change concerns, in the application's words ("Jovana Nikolić, patient; dr …"). */
  affected?: ReactNode
  /** The messages the application can send, each an explicit choice. */
  notify?: readonly NotifyOption[]
  /** The application's check of the change (a clash, a rule): a warning Alert. */
  warning?: ReactNode
  /**
   * The button's text. Default: `messages['change.save']`, or `messages['change.saveAndNotify']`
   * while a message is checked.
   */
  confirmLabel?: string
  /** Saves the change (and sends the checked messages); a promise keeps the dialog working. */
  onConfirm: (answer: ChangeConfirmAnswer) => void | Promise<void>
  /** The application is saving (when `onConfirm` returns no promise). */
  loading?: boolean
}

/** The ids checked when the dialog opens: the options the application checks. */
export function initialNotify(options: readonly NotifyOption[] | undefined): string[] {
  return (options ?? []).filter((each) => each.defaultChecked === true).map((each) => each.id)
}

/** The checked ids after one checkbox changes, in the options' order. */
export function toggleNotify(
  options: readonly NotifyOption[],
  checked: readonly string[],
  id: string,
  on: boolean,
): string[] {
  return options
    .map((each) => each.id)
    .filter((each) => (each === id ? on : checked.includes(each)))
}

/** The Save button's text: the application's, else "Save and notify" while a message is checked. */
export function changeConfirmLabel(
  messages: Pick<LiroMessages, 'change.save' | 'change.saveAndNotify'>,
  checked: number,
  confirmLabel: string | undefined,
): string {
  if (confirmLabel !== undefined) return confirmLabel
  return checked > 0 ? messages['change.saveAndNotify'] : messages['change.save']
}

function isEmpty(value: ReactNode): boolean {
  return value === undefined || value === null || value === false || value === ''
}

function Line({ change }: { change: ChangeLine }) {
  const { messages } = useLiro()
  return (
    // One row of the list's two columns (subgrid): the labels line up, the values beside them.
    <li className="col-span-2 grid min-w-0 grid-cols-subgrid items-baseline text-sm">
      <span className={cn('min-w-0 text-secondary', TEXT_DIRECTION)}>{change.label}</span>
      <span className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1.5">
        <span className="sr-only">{messages['history.before']}</span>
        <bdi className="text-secondary tabular-nums">
          {isEmpty(change.from) ? '—' : change.from}
        </bdi>
        <ArrowRight
          aria-hidden="true"
          className="size-3 shrink-0 self-center text-tertiary rtl:-scale-x-100"
        />
        <span className="sr-only">{messages['history.after']}</span>
        <bdi className="font-medium text-primary tabular-nums">
          {isEmpty(change.to) ? '—' : change.to}
        </bdi>
      </span>
    </li>
  )
}

/**
 * The "Notify …" checkboxes, one per message the application can send, in a group named
 * "Messages to send". Shared by ChangeConfirmDialog and ConfirmDialog's `notify` (P5.28 item 9);
 * not exported from the package. Nothing when there are no options.
 */
export function NotifyChoices(props: {
  options: readonly NotifyOption[]
  checked: readonly string[]
  disabled?: boolean
  onChange: (checked: string[]) => void
  className?: string
}) {
  const { messages } = useLiro()
  if (props.options.length === 0) return null
  return (
    <div
      role="group"
      aria-label={messages['change.notifyGroup']}
      className={cn('flex flex-col gap-3', props.className)}
    >
      {props.options.map((option) => (
        <CheckboxField
          key={option.id}
          label={option.label}
          {...(option.description === undefined ? {} : { description: option.description })}
          checked={props.checked.includes(option.id)}
          disabled={props.disabled === true}
          onChange={(on) => {
            props.onChange(toggleNotify(props.options, props.checked, option.id, on))
          }}
        />
      ))}
    </div>
  )
}

/** Confirms a change others rely on: old → new, who it concerns, "Notify …" as a choice, Save. */
export function ChangeConfirmDialog(props: ChangeConfirmDialogProps) {
  const [innerOpen, setInnerOpen] = useState(props.defaultOpen === true)
  const [round, setRound] = useState(0)
  const [busy, setBusy] = useState(false)
  const open = props.open ?? innerOpen
  const working = busy || props.loading === true
  const setOpen = (next: boolean) => {
    if (working && !next) return
    if (next) setRound((value) => value + 1)
    setInnerOpen(next)
    props.onOpenChange?.(next)
  }
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      {...(props.trigger === undefined ? {} : { trigger: props.trigger })}
      dismissible={!working}
      title={props.title}
      {...(props.subject === undefined ? {} : { subject: props.subject })}
      {...(props.description === undefined ? {} : { description: props.description })}
    >
      {/* A new round each time it opens: the checkboxes start as the application sets them. */}
      <ChangeForm
        key={round}
        {...props}
        working={working}
        onCancel={() => {
          setOpen(false)
        }}
        onSave={(answer) => {
          const result = props.onConfirm(answer)
          if (result instanceof Promise) {
            setBusy(true)
            result.then(
              () => {
                setBusy(false)
                setInnerOpen(false)
                props.onOpenChange?.(false)
              },
              () => {
                setBusy(false)
              },
            )
          } else if (props.loading !== true) {
            setOpen(false)
          }
        }}
      />
    </Dialog>
  )
}

function ChangeForm(
  props: ChangeConfirmDialogProps & {
    working: boolean
    onCancel: () => void
    onSave: (answer: ChangeConfirmAnswer) => void
  },
) {
  const { messages } = useLiro()
  const options = props.notify ?? []
  const [checked, setChecked] = useState<string[]>(() => initialNotify(options))
  const label = changeConfirmLabel(messages, checked.length, props.confirmLabel)
  return (
    <div data-slot="change-confirm" className="flex flex-col gap-4">
      {props.children}
      <ul
        aria-label={messages['change.changes']}
        // The labels' column as wide as the longest, up to 40%; the values take the rest.
        className="m-0 grid list-none grid-cols-[fit-content(40%)_minmax(0,1fr)] gap-x-4 gap-y-1.5 rounded-md border border-solid border-default p-3"
      >
        {props.changes.map((change) => (
          <Line key={change.key ?? change.label} change={change} />
        ))}
      </ul>
      {!isEmpty(props.affected) && (
        <p className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>
          <span className="text-secondary">{messages['change.affected']} </span>
          {props.affected}
        </p>
      )}
      {!isEmpty(props.warning) && <Alert tone="warning">{props.warning}</Alert>}
      <NotifyChoices
        options={options}
        checked={checked}
        disabled={props.working}
        onChange={setChecked}
      />
      <DialogFooter>
        <Button
          intent="cancel"
          label={messages['dialog.cancel']}
          disabled={props.working}
          onClick={props.onCancel}
        />
        <LoadingButtonPrimitive
          family="primary"
          emphasis="primary"
          loading={props.working}
          onClick={() => {
            props.onSave({ notify: checked })
          }}
        >
          <Save aria-hidden="true" className="size-3.75 shrink-0" />
          <span className={TEXT_DIRECTION}>{label}</span>
        </LoadingButtonPrimitive>
      </DialogFooter>
    </div>
  )
}
