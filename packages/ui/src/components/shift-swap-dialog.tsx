import { Send } from 'lucide-react'
import { useState, type ReactElement } from 'react'
import { LoadingButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { DialogFooter } from '../primitives/dialog'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import { Dialog } from './dialog'
import { RadioGroupField } from './radio-group-field'
import { SelectField } from './select-field'
import { ShiftTime, timeTexts } from './shift-parts'
import { TextAreaField } from './text-field'

/*
 * ShiftSwapDialog (BUILD-PLAN P5.24 b): one person asks to hand a shift over — to a colleague
 * from the application's list (who may give one of their shifts back) or to anyone qualified —
 * with a reason. It reports the request (`onSubmit`); who may take the shift, and the approval,
 * are the application's (the approval is a worklist, P4.3).
 * - The shift on top as text (its day in words, name, times — "22:00–06:00 (+1)" read as "… the
 *   next day" —, place); then "Who takes it" (Anyone qualified / A colleague), the colleague
 *   (required when chosen), their shift taken instead (optional), the reason.
 * - Cancel, then Send request (the main action, last). A returned promise keeps the dialog working
 *   and open until it settles (closed when it resolves, open when it rejects).
 */

/** A shift as the dialog shows it, from the application. */
export interface SwapShift {
  id: string
  /** YYYY-MM-DD. */
  date: string
  /** The template's name ("Night"). */
  label: string
  /** HH:mm. */
  start: string
  /** HH:mm; not after the start: the next day. */
  end: string
  /** Where ("Dom zdravlja, Emergency"). */
  place?: string
}

/** A colleague who may take the shift, from the application. */
export interface SwapColleague {
  id: string
  name: string
  /** A short line after the name ("Night shifts"). */
  note?: string
  /** Their shifts the requester may take back instead. */
  shifts?: readonly SwapShift[]
}

/** The request: to a colleague (null: anyone qualified), their shift taken back, the reason. */
export interface ShiftSwapRequest {
  shiftId: string
  colleagueId: string | null
  takeShiftId: string | null
  reason: string
}

export interface ShiftSwapDialogProps {
  /** The shift to hand over. */
  shift: SwapShift
  colleagues: readonly SwapColleague[]
  /** Offers "Anyone qualified". Default true. */
  allowAnyone?: boolean
  /** The reason must be written. Default false. */
  reasonRequired?: boolean
  /** Sends the request; a returned promise keeps the dialog working until it settles. */
  onSubmit: (request: ShiftSwapRequest) => void | Promise<void>
  /** The application is sending it (when `onSubmit` returns no promise). */
  loading?: boolean
  /** The values it opens with (a request being written, restored). */
  defaultValue?: Partial<Omit<ShiftSwapRequest, 'shiftId'>>
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The element that opens it, usually a Button. */
  trigger?: ReactElement
}

/** The dialog that asks to swap a shift. */
export function ShiftSwapDialog(props: ShiftSwapDialogProps) {
  const { messages } = useLiro()
  const [innerOpen, setInnerOpen] = useState(props.defaultOpen === true)
  const [round, setRound] = useState(0)
  const [busy, setBusy] = useState(false)
  const open = props.open ?? innerOpen
  const setOpen = (next: boolean) => {
    if (next) setRound((value) => value + 1)
    setInnerOpen(next)
    props.onOpenChange?.(next)
  }
  const working = busy || props.loading === true
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!working) setOpen(next)
      }}
      {...(props.trigger === undefined ? {} : { trigger: props.trigger })}
      dismissible={!working}
      title={messages['swap.title']}
    >
      <SwapForm
        key={round}
        {...props}
        working={working}
        onCancel={() => {
          setOpen(false)
        }}
        onSend={(request) => {
          const result = props.onSubmit(request)
          if (result instanceof Promise) {
            setBusy(true)
            result.then(
              () => {
                setBusy(false)
                setOpen(false)
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

function SwapForm(
  props: ShiftSwapDialogProps & {
    working: boolean
    onCancel: () => void
    onSend: (request: ShiftSwapRequest) => void
  },
) {
  const { messages, format } = useLiro()
  const allowAnyone = props.allowAnyone ?? true
  const initial = props.defaultValue
  const [who, setWho] = useState<'anyone' | 'colleague'>(
    !allowAnyone || (initial?.colleagueId !== undefined && initial.colleagueId !== null)
      ? 'colleague'
      : 'anyone',
  )
  const [colleagueId, setColleagueId] = useState(initial?.colleagueId ?? '')
  const [takeShiftId, setTakeShiftId] = useState(initial?.takeShiftId ?? '')
  const [reason, setReason] = useState(initial?.reason ?? '')
  const [tried, setTried] = useState(false)
  const colleague = props.colleagues.find((each) => each.id === colleagueId)
  const theirShifts = colleague?.shifts ?? []
  const missingColleague = who === 'colleague' && colleague === undefined
  const missingReason = props.reasonRequired === true && reason.trim() === ''
  const shiftText = (shift: SwapShift) =>
    [
      format.dateLong(shift.date),
      shift.label,
      timeTexts(format, messages, shift.start, shift.end).shown,
      ...(shift.place === undefined ? [] : [shift.place]),
    ].join(' · ')
  const send = () => {
    setTried(true)
    if (missingColleague || missingReason) return
    props.onSend({
      shiftId: props.shift.id,
      colleagueId: who === 'anyone' ? null : colleagueId,
      takeShiftId: who === 'anyone' || takeShiftId === '' ? null : takeShiftId,
      reason: reason.trim(),
    })
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 rounded-md border border-solid border-default bg-surface-sunken p-3">
        <span className="text-xs font-semibold text-secondary">{messages['swap.shift']}</span>
        <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
          {format.dateLong(props.shift.date)}
        </span>
        <span className="flex flex-wrap items-baseline gap-x-2 text-sm text-primary">
          <span className={TEXT_ISOLATE}>{props.shift.label}</span>
          <ShiftTime start={props.shift.start} end={props.shift.end} />
        </span>
        {props.shift.place !== undefined && (
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{props.shift.place}</span>
        )}
      </div>
      {allowAnyone && (
        <RadioGroupField
          label={messages['swap.who']}
          value={who}
          options={[
            { value: 'anyone', label: messages['swap.anyone'] },
            { value: 'colleague', label: messages['swap.colleague'] },
          ]}
          onChange={(value) => {
            setWho(value === 'colleague' ? 'colleague' : 'anyone')
          }}
        />
      )}
      {who === 'colleague' && (
        <>
          <SelectField
            label={messages['swap.colleagueField']}
            required
            value={colleagueId}
            options={props.colleagues.map((each) => ({
              value: each.id,
              label: each.note === undefined ? each.name : `${each.name} · ${each.note}`,
            }))}
            onChange={(value) => {
              setColleagueId(value)
              setTakeShiftId('')
            }}
            {...(tried && missingColleague ? { error: messages['swap.colleagueRequired'] } : {})}
          />
          {theirShifts.length > 0 && (
            <SelectField
              label={messages['swap.takeBack']}
              value={takeShiftId === '' ? '-' : takeShiftId}
              options={[
                { value: '-', label: messages['swap.takeNone'] },
                ...theirShifts.map((shift) => ({ value: shift.id, label: shiftText(shift) })),
              ]}
              onChange={(value) => {
                setTakeShiftId(value === '-' ? '' : value)
              }}
            />
          )}
        </>
      )}
      <TextAreaField
        label={messages['swap.reason']}
        rows={3}
        value={reason}
        onChange={setReason}
        {...(props.reasonRequired === true ? { required: true } : {})}
        {...(tried && missingReason ? { error: messages['swap.reasonRequired'] } : {})}
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
          onClick={send}
        >
          <Send aria-hidden="true" className="size-3.75 shrink-0" />
          <span>{messages['swap.submit']}</span>
        </LoadingButtonPrimitive>
      </DialogFooter>
    </div>
  )
}
