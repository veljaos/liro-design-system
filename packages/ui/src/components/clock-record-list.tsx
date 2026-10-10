import { Pencil, TriangleAlert } from 'lucide-react'
import { useState, type ReactNode, type SyntheticEvent } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  DialogBody,
  DialogCloseButton,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../primitives/dialog'
import { Sheet, SheetContent } from '../primitives/sheet'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import { clockTimeOf, onLaterDay, parseClockTime } from './clock-record-logic'
import { DataTable, type DataTableColumn } from './data-table'
import type { EmptyAction } from './empty-state'
import { TextAreaField, TextField } from './text-field'

/*
 * ClockRecordList (BUILD-PLAN P5.24e): clock-in and clock-out records from terminals or a phone,
 * with audited corrections. The records, their sources, places, durations and corrections are the
 * application's; the list shows them and reports a correction.
 * - A DataTable (its phone cards below 48em, P3.2): name (and a second line), date, clock-in,
 *   clock-out, duration, source (and place), correction. Times are the instants' clock times
 *   through `format.time`; a clock-out after midnight says "next day". A missing clock-in or
 *   clock-out is said in words ("No clock-out", warning text with an icon), never 0 or a dash; a
 *   missing duration is "—".
 * - Corrections are audited, never silent: "Correct" in a row's menu opens a Drawer at the end
 *   (D14: a short edit, the list still visible) with the new clock-in and clock-out (typed freely,
 *   read as hh:mm) and a required reason. The application keeps the original; a corrected record
 *   shows the new time, then the original struck through ("was" for assistive technology), and
 *   who corrected it, when and why.
 */

/** A source of records: a terminal, the phone application. */
export interface ClockSource {
  id: string
  label: string
}

/** A correction, from the application: the original times kept, who, when and why. */
export interface ClockCorrection {
  /** The original clock-in and clock-out instants (ISO 8601), or null where there was none. */
  originalIn: string | null
  originalOut: string | null
  by: string
  /** An instant (ISO 8601), written by `format.dateTime`. */
  at: string
  reason: string
}

/** One record: a person's clock-in and clock-out on a day. */
export interface ClockRecord {
  id: string
  person: string
  /** A second line under the name (a job, a site). */
  personDescription?: string
  /** The working day, YYYY-MM-DD. */
  date: string
  /** Instants (ISO 8601 with the tenant's offset), or null when missing. */
  in: string | null
  out: string | null
  /** Hours as a decimal string, from the application; null when it cannot be known. */
  duration: string | null
  /** The id of a source in `sources`. */
  source: string
  /** Where it was recorded (a terminal's place, a phone's location), from the application. */
  place?: string
  correction?: ClockCorrection
}

/** What the correction drawer reports: the new clock times ("HH:MM" or null) and the reason. */
export interface ClockCorrectionRequest {
  id: string
  in: string | null
  out: string | null
  reason: string
}

export interface ClockRecordListProps {
  /** The list's accessible name ("Clock records, October 2026"). */
  label: string
  records: readonly ClockRecord[]
  sources: readonly ClockSource[]
  /** Offers "Correct" on each record; may return a promise while the application saves. */
  onCorrect?: (request: ClockCorrectionRequest) => void | Promise<void>
  /** The drawer open from the start, for this record. */
  defaultCorrecting?: string
  /** Hours shown with this many decimals (zeros added, never rounded). */
  decimals?: number
  /** The first load: skeleton rows. */
  loading?: boolean
  /** The first step offered when there are no records. */
  emptyAction?: EmptyAction
  /** Forces the table or the cards; default by the viewport (48em). */
  layout?: 'table' | 'cards'
  className?: string
}

/** A time, or its absence in words; a later day said. */
function TimeText({
  date,
  instant,
  missing,
}: {
  date: string
  instant: string | null
  missing: string
}) {
  const { messages, format } = useLiro()
  if (instant === null) {
    return (
      <span className="inline-flex items-center gap-1 font-medium whitespace-nowrap text-status-warning-fg">
        <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
        <span className={TEXT_DIRECTION}>{missing}</span>
      </span>
    )
  }
  return (
    <span className="tabular-nums">
      <bdi>{format.time(instant)}</bdi>
      {onLaterDay(date, instant) && (
        <span className="text-xs text-secondary"> ({messages['clock.nextDay']})</span>
      )}
    </span>
  )
}

/** A corrected time: the new one, then the original struck through. */
function CorrectedTime({
  date,
  instant,
  original,
  corrected,
  missing,
}: {
  date: string
  instant: string | null
  original: string | null
  corrected: boolean
  missing: string
}) {
  const { messages, format } = useLiro()
  const now = <TimeText date={date} instant={instant} missing={missing} />
  if (!corrected || original === instant) return now
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      {now}
      <span className="text-xs text-secondary">
        <span className="sr-only">{messages['clock.was']} </span>
        <s className="tabular-nums">
          {original === null ? missing : <bdi>{format.time(original)}</bdi>}
        </s>
      </span>
    </span>
  )
}

/** Clock-in and clock-out records with audited corrections. */
export function ClockRecordList(props: ClockRecordListProps) {
  const { messages, format } = useLiro()
  const [correcting, setCorrecting] = useState<string | null>(props.defaultCorrecting ?? null)
  const sourceLabel = (id: string) => props.sources.find((source) => source.id === id)?.label ?? id
  const hours = (value: string) =>
    messages['clock.hours'](
      format.number(value, props.decimals === undefined ? {} : { decimals: props.decimals }),
    )

  const columns: DataTableColumn<ClockRecord>[] = [
    {
      id: 'person',
      header: messages['clock.person'],
      minWidth: 160,
      cell: (record) => (
        <span className="flex min-w-0 flex-col">
          <span className={cn('font-medium', TEXT_DIRECTION)}>{record.person}</span>
          {record.personDescription !== undefined && (
            <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
              {record.personDescription}
            </span>
          )}
        </span>
      ),
    },
    {
      id: 'date',
      header: messages['clock.date'],
      numeric: true,
      cell: (record) => <bdi>{format.date(record.date)}</bdi>,
    },
    {
      id: 'in',
      header: messages['clock.in'],
      numeric: true,
      cell: (record) => (
        <CorrectedTime
          date={record.date}
          instant={record.in}
          original={record.correction?.originalIn ?? null}
          corrected={record.correction !== undefined}
          missing={messages['clock.noClockIn']}
        />
      ),
    },
    {
      id: 'out',
      header: messages['clock.out'],
      numeric: true,
      cell: (record) => (
        <CorrectedTime
          date={record.date}
          instant={record.out}
          original={record.correction?.originalOut ?? null}
          corrected={record.correction !== undefined}
          missing={messages['clock.noClockOut']}
        />
      ),
    },
    {
      id: 'duration',
      header: messages['clock.duration'],
      align: 'end',
      numeric: true,
      cell: (record) =>
        record.duration === null ? (
          <span className="text-secondary">—</span>
        ) : (
          <bdi>{hours(record.duration)}</bdi>
        ),
    },
    {
      id: 'source',
      header: messages['clock.source'],
      cell: (record) => (
        <span className="flex min-w-0 flex-col">
          <span className={TEXT_DIRECTION}>{sourceLabel(record.source)}</span>
          {record.place !== undefined && (
            <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{record.place}</span>
          )}
        </span>
      ),
    },
    {
      id: 'correction',
      header: messages['clock.correction'],
      minWidth: 200,
      cell: (record) =>
        record.correction === undefined ? null : (
          <span className={cn('block text-xs text-secondary', TEXT_DIRECTION)}>
            {messages['clock.corrected'](
              record.correction.by,
              format.dateTime(record.correction.at),
              record.correction.reason,
            )}
          </span>
        ),
    },
  ]

  const record = props.records.find((each) => each.id === correcting)
  return (
    <div data-slot="clock-record-list" className={cn('min-w-0 font-sans', props.className)}>
      <DataTable
        label={props.label}
        columns={columns}
        rows={props.records}
        getRowId={(each) => each.id}
        getRowLabel={(each) => `${each.person}, ${format.date(each.date)}`}
        mobile={{
          title: (each) => each.person,
          subtitle: (each) => format.date(each.date),
          details: ['in', 'out', 'duration', 'source', 'correction'],
        }}
        {...(props.layout === undefined ? {} : { layout: props.layout })}
        {...(props.loading === undefined ? {} : { loading: props.loading })}
        {...(props.emptyAction === undefined ? {} : { emptyAction: props.emptyAction })}
        {...(props.onCorrect === undefined
          ? {}
          : {
              rowActions: (each: ClockRecord) => [
                {
                  label: messages['clock.correct'],
                  icon: Pencil,
                  onSelect: () => {
                    setCorrecting(each.id)
                  },
                },
              ],
            })}
      />
      {record !== undefined && props.onCorrect !== undefined && (
        <CorrectionDrawer
          record={record}
          onCorrect={props.onCorrect}
          onClose={() => {
            setCorrecting(null)
          }}
        />
      )}
    </div>
  )
}

/** The correction: new clock times and a required reason, in a Drawer at the end. */
function CorrectionDrawer({
  record,
  onCorrect,
  onClose,
}: {
  record: ClockRecord
  onCorrect: (request: ClockCorrectionRequest) => void | Promise<void>
  onClose: () => void
}) {
  const { messages, format } = useLiro()
  const [inText, setInText] = useState(clockTimeOf(record.in) ?? '')
  const [outText, setOutText] = useState(clockTimeOf(record.out) ?? '')
  const [reason, setReason] = useState('')
  const [checked, setChecked] = useState(false)
  const [pending, setPending] = useState(false)
  const read = (text: string) => (text.trim() === '' ? null : parseClockTime(text))
  const timeError = (text: string): ReactNode =>
    checked && text.trim() !== '' && parseClockTime(text) === null
      ? messages['clock.timeInvalid']
      : undefined
  const reasonError = checked && reason.trim() === '' ? messages['field.required'] : undefined
  const keep = (event: Event) => {
    if (pending) event.preventDefault()
  }

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    setChecked(true)
    const bad = [inText, outText].some(
      (text) => text.trim() !== '' && parseClockTime(text) === null,
    )
    if (bad || reason.trim() === '') return
    const result = onCorrect({
      id: record.id,
      in: read(inText),
      out: read(outText),
      reason: reason.trim(),
    })
    if (result instanceof Promise) {
      setPending(true)
      result.then(
        () => {
          setPending(false)
          onClose()
        },
        () => {
          setPending(false)
        },
      )
    } else {
      onClose()
    }
  }

  const errorProps = (error: ReactNode) => (error === undefined ? {} : { error })
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose()
      }}
    >
      <SheetContent
        side="end"
        aria-describedby={undefined}
        aria-busy={pending || undefined}
        onEscapeKeyDown={keep}
        onPointerDownOutside={keep}
        onInteractOutside={keep}
      >
        <DialogHeader>
          <DialogTitle>
            {messages['clock.correctTitle'](record.person, format.date(record.date))}
          </DialogTitle>
          {!pending && <DialogCloseButton label={messages['dialog.close']} />}
        </DialogHeader>
        <form noValidate onSubmit={submit} className="contents">
          <DialogBody>
            <TextField
              label={messages['clock.in']}
              description={messages['clock.time']}
              direction="ltr"
              value={inText}
              onChange={setInText}
              {...errorProps(timeError(inText))}
            />
            <TextField
              label={messages['clock.out']}
              description={messages['clock.time']}
              direction="ltr"
              value={outText}
              onChange={setOutText}
              {...errorProps(timeError(outText))}
            />
            <TextAreaField
              label={messages['clock.reason']}
              required
              rows={3}
              value={reason}
              onChange={setReason}
              {...errorProps(reasonError)}
            />
            <DialogFooter>
              <Button
                intent="cancel"
                label={messages['dialog.cancel']}
                disabled={pending}
                onClick={onClose}
              />
              <Button
                intent="save"
                type="submit"
                label={messages['clock.save']}
                disabled={pending}
              />
            </DialogFooter>
          </DialogBody>
        </form>
      </SheetContent>
    </Sheet>
  )
}
