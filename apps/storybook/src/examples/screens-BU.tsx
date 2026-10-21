import { Pause, Play, Plus, Send } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  ActionGroup,
  Alert,
  Button,
  ConfirmDialog,
  DataTable,
  DetailPage,
  EmailPreview,
  FormFullWidth,
  FormSection,
  KeyValueList,
  ListPage,
  MultiSelectField,
  notice,
  RadioGroupField,
  RecordFormPage,
  SelectField,
  SwitchField,
  TextAreaField,
  TextField,
  Toaster,
  useLiro,
  type ActionItem,
  type DataTableColumn,
  type ModuleTab,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell, statusBadge, type ExampleAccount } from './example-shell'
import { useExampleState } from './example-state'
import { Tenant } from './screens-G'
import {
  BU_ROUTES,
  BU_TODAY,
  FORMAT_LABELS,
  FORMATS,
  FREQUENCIES,
  inView,
  MONTH_DAYS,
  OUTSIDE,
  outsideAddressProblem,
  PEOPLE,
  REPORT_KINDS,
  reportKind,
  SAMPLE,
  SCHEDULES,
  scheduleById,
  sentNow,
  TIME_ZONE,
  TIMES,
  VIEWS,
  WEEKDAYS,
  type Frequency,
  type ReportFormat,
  type ReportRun,
  type Schedule,
  type WhenEmpty,
} from './data-BU'
import { BV_ROUTES } from './data-BV'

/*
 * Group BU's example screens (P5.80, scheduled reports): Kvadrat Gradnja d.o.o.'s reports sent by
 * e-mail on a schedule, seen by Milica Petrović on 14 October 2026 at 09:40.
 * - The schedules (ListPage + DataTable): the report, the schedule in the application's words,
 *   who gets it, the format, the next run, the last run's state in words, and a switch that
 *   pauses or resumes it; views All / Active / Paused / Last run failed.
 * - One schedule (DetailPage): the report and its parameters, the schedule with the time zone
 *   and the application's next runs, the recipients, the last runs (sent, failed with the
 *   application's message, skipped because there was nothing to send) with their files, and
 *   the e-mail as the recipient gets it (EmailPreview). Send now (ConfirmDialog, the record as
 *   its subject), Pause or Resume, Edit. The failed budget report says why at the top (Alert,
 *   neutral actions).
 * - A new or edited schedule (RecordFormPage): the report and its parameters (ReportPage's
 *   fields), how often from the application's list (every day / week on a day / month on a day /
 *   quarter), the time from its list and the time zone shown, people of the company and outside
 *   addresses checked by the application, the format, what happens when there is nothing to
 *   send, the subject and message, and the preview.
 * Built from the library only; nothing new was needed. Every date of a next run, every count and
 * every state is the application's (data-BU.ts); the screens compute none of them.
 * Also the analytics module's shell, shared with group BV.
 */

export { BU_ROUTES }

/** The analytics module's tabs. */
const TABS = [
  { key: 'overview', label: 'Overview', path: BV_ROUTES.overview },
  { key: 'scheduled', label: 'Scheduled reports', path: BU_ROUTES.list },
]

/** The analytics module's screen on 14 October 2026, with its toasts. */
export function AnalyticsShell({
  phone,
  tab,
  crumbs,
  account,
  children,
}: {
  phone: boolean
  tab: string
  crumbs: { label: string; href?: string }[]
  account?: ExampleAccount
  children: ReactNode
}) {
  const tabs: ModuleTab[] = TABS.map((each) => ({
    key: each.key,
    label: each.label,
    href: `#${each.path}`,
    current: each.key === tab,
  }))
  return (
    <Tenant today={BU_TODAY}>
      <Shell
        phone={phone}
        crumbs={crumbs}
        tabs={tabs}
        {...(account === undefined ? {} : { account })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

/** An instant as the tenant writes it, isolated so it reads in order in right-to-left pages. */
function When({ at }: { at: string }) {
  const { format } = useLiro()
  return <bdi>{format.dateTime(at)}</bdi>
}

/** The schedules as the application keeps them (above the screens). */
function useSchedules() {
  return useExampleState<readonly Schedule[]>('BU.schedules', () => SCHEDULES)
}

/** Who gets a report, in the application's words. */
function recipientsText(schedule: Schedule): string {
  const people = schedule.people.length
  const outside = schedule.outside.length
  if (people === 1 && outside === 0) {
    return PEOPLE.find((each) => each.id === schedule.people[0])?.name ?? '1 person'
  }
  const peopleText = `${String(people)} ${people === 1 ? 'person' : 'people'}`
  if (outside === 0) return peopleText
  return `${peopleText}, ${String(outside)} outside`
}

/** The application pauses or resumes a schedule and says what happens next. */
function useToggle() {
  const [, setSchedules] = useSchedules()
  return (schedule: Schedule, active: boolean) => {
    setSchedules((list) =>
      list.map((each) => {
        if (each.id !== schedule.id) return each
        if (!active) {
          return {
            ...each,
            active: false,
            pausedNote: 'Paused by Milica Petrović on 14.10.2026.',
            next: [],
          }
        }
        const rest: Schedule = { ...each }
        delete rest.pausedNote
        return {
          ...rest,
          active: true,
          next: RESUMED_NEXT[each.id] ?? scheduleById(each.id)?.next ?? [],
        }
      }),
    )
    if (active) notice.success(`${schedule.name} is resumed.`)
    else notice.success(`${schedule.name} is paused. Nothing is sent until you resume it.`)
  }
}

/** The next runs the application plans when a paused schedule resumes. */
const RESUMED_NEXT: Record<string, readonly string[]> = {
  'rs-05': ['2026-10-16T15:00:00+02:00', '2026-10-23T15:00:00+02:00', '2026-10-30T15:00:00+01:00'],
}

// ── The schedules ─────────────────────────────────────────────────────────────────────────────

function lastRun(schedule: Schedule) {
  const last = schedule.runs[0]
  if (last === undefined) return <span className="text-secondary">—</span>
  return (
    <span className="flex flex-col items-start gap-1">
      {statusBadge(last.state)}
      <span className="text-xs text-secondary tabular-nums">
        <When at={last.at} />
      </span>
    </span>
  )
}

function nextRun(schedule: Schedule) {
  const next = schedule.next[0]
  if (!schedule.active) return <span className="bidi-content text-secondary">Paused</span>
  if (next === undefined) return <span className="text-secondary">—</span>
  return <When at={next} />
}

export function ScheduledReportsScreen({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [schedules] = useSchedules()
  const toggle = useToggle()
  const [view, setView] = useState('all')
  const rows = schedules.filter((each) => inView(each, view))
  const columns: DataTableColumn<Schedule>[] = [
    {
      id: 'name',
      header: 'Report',
      minWidth: 240,
      cell: (row) => (
        <span className="flex flex-col">
          <span className="bidi-content font-medium">{row.name}</span>
          <span className="bidi-content text-xs text-secondary">
            {reportKind(row.report)?.name}
          </span>
        </span>
      ),
    },
    {
      id: 'when',
      header: 'Schedule',
      minWidth: 200,
      cell: (row) => <span className="bidi-content">{row.when}</span>,
    },
    {
      id: 'recipients',
      header: 'Recipients',
      minWidth: 160,
      cell: (row) => <span className="bidi-content">{recipientsText(row)}</span>,
    },
    { id: 'format', header: 'Format', cell: (row) => FORMAT_LABELS[row.format] },
    { id: 'next', header: 'Next run', numeric: true, cell: nextRun },
    { id: 'last', header: 'Last run', cell: lastRun },
    {
      id: 'active',
      header: 'Sending',
      cell: (row) => (
        <SwitchField
          label={`Sending: ${row.name}`}
          hideLabel
          checked={row.active}
          onChange={(active) => {
            toggle(row, active)
          }}
        />
      ),
    },
  ]
  return (
    <AnalyticsShell
      phone={phone}
      tab="scheduled"
      crumbs={[{ label: 'Analytics' }, { label: 'Scheduled reports' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Scheduled reports"
        actions={
          <Button
            intent="create"
            label="New schedule"
            onClick={() => {
              navigate(BU_ROUTES.create)
            }}
          />
        }
        views={VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: schedules.filter((schedule) => inView(schedule, each.id)).length,
        }))}
        view={view}
        onViewChange={setView}
      >
        <DataTable
          label="Scheduled reports"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          count={rows.length}
          onRowClick={(row) => {
            navigate(BU_ROUTES.schedule(row.id))
          }}
          rowActions={(row) => [
            {
              label: 'Edit',
              onSelect: () => {
                if (row.id === 'rs-01') navigate(BU_ROUTES.edit)
                else
                  notice.info('In the examples, “Weekly receivables for the director” is edited.')
              },
            },
            {
              label: row.active ? 'Pause' : 'Resume',
              onSelect: () => {
                toggle(row, !row.active)
              },
            },
          ]}
          mobile={{
            title: (row) => row.name,
            subtitle: (row) => <span className="bidi-content">{row.when}</span>,
            badge: (row) => (row.active ? statusBadge('Active') : statusBadge('Paused')),
            details: ['recipients', 'next', 'last', 'active'],
          }}
        />
      </ListPage>
    </AnalyticsShell>
  )
}

// ── One schedule ──────────────────────────────────────────────────────────────────────────────

/** The e-mail's text with the sample values filled in, as the recipient reads it. */
function filled(text: string): string {
  return text.replaceAll('{{date}}', SAMPLE.date).replaceAll('{{period}}', SAMPLE.period)
}

function addresses(schedule: Pick<Schedule, 'people' | 'outside'>): string[] {
  return [
    ...schedule.people.flatMap((id) => {
      const person = PEOPLE.find((each) => each.id === id)
      return person === undefined ? [] : [person.email]
    }),
    ...schedule.outside,
  ]
}

/** The e-mail as its recipient gets it. */
function Preview({
  schedule,
  phone,
}: {
  schedule: Pick<
    Schedule,
    'people' | 'outside' | 'subject' | 'message' | 'report' | 'format' | 'when'
  >
  phone: boolean
}) {
  const to = addresses(schedule)
  return (
    <EmailPreview
      layout={phone ? 'phone' : 'desktop'}
      from={SAMPLE.from}
      to={<span dir="ltr">{to.length === 0 ? '—' : to.join(', ')}</span>}
      subject={filled(schedule.subject)}
      footer={`Kvadrat Gradnja d.o.o. sends this report ${schedule.when.charAt(0).toLowerCase()}${schedule.when.slice(1)} (Belgrade). To stop getting it, ask Milica Petrović.`}
    >
      {filled(schedule.message)
        .split('\n\n')
        .map((paragraph, index) => (
          <p key={index} className="bidi-content m-0 mb-3 whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      <p className="bidi-content m-0 text-secondary">
        Attached:{' '}
        <span dir="ltr">
          {schedule.report}-19.10.2026.{schedule.format}
        </span>{' '}
        ({FORMAT_LABELS[schedule.format]})
      </p>
    </EmailPreview>
  )
}

const RUN_COLUMNS: DataTableColumn<ReportRun>[] = [
  { id: 'at', header: 'Ran', numeric: true, cell: (row) => <When at={row.at} /> },
  { id: 'state', header: 'State', cell: (row) => statusBadge(row.state) },
  {
    id: 'delivered',
    header: 'Delivered',
    numeric: true,
    cell: (row) => <span className="bidi-isolate whitespace-nowrap">{row.delivered}</span>,
  },
  {
    id: 'file',
    header: 'File',
    minWidth: 220,
    cell: (row) =>
      row.file === null ? (
        <span className="text-secondary">—</span>
      ) : (
        <span className="flex flex-col">
          <span dir="ltr" className="text-start">
            {row.file.name}
          </span>
          <span className="bidi-content text-xs text-secondary">{row.file.size}</span>
        </span>
      ),
  },
  {
    id: 'note',
    header: 'Note',
    minWidth: 260,
    cell: (row) =>
      row.note === undefined ? (
        <span className="text-secondary">—</span>
      ) : (
        <span className="bidi-content">{row.note}</span>
      ),
  },
]

export function ScheduleScreen({
  phone,
  id,
  sendOpen = false,
}: {
  phone: boolean
  id: string
  sendOpen?: boolean
}) {
  const navigate = useContext(Navigate)
  const [schedules, setSchedules] = useSchedules()
  const toggle = useToggle()
  const [send, setSend] = useState(sendOpen)
  const schedule = schedules.find((each) => each.id === id)
  if (schedule === undefined) return null
  const kind = reportKind(schedule.report)
  const last = schedule.runs[0]
  const count = schedule.people.length + schedule.outside.length
  const edit = () => {
    if (schedule.id === 'rs-01') navigate(BU_ROUTES.edit)
    else notice.info('In the examples, “Weekly receivables for the director” is edited.')
  }
  const actions: ActionItem[] = [
    schedule.active
      ? {
          key: 'pause',
          family: 'neutral',
          icon: Pause,
          label: 'Pause',
          onClick: () => {
            toggle(schedule, false)
          },
        }
      : {
          key: 'resume',
          family: 'neutral',
          icon: Play,
          label: 'Resume',
          onClick: () => {
            toggle(schedule, true)
          },
        },
    {
      key: 'send',
      family: 'neutral',
      icon: Send,
      label: 'Send now',
      onClick: () => {
        setSend(true)
      },
    },
    { key: 'edit', intent: 'edit', label: 'Edit', emphasis: 'primary', onClick: edit },
  ]
  const failed = last?.state === 'Failed'
  return (
    <AnalyticsShell
      phone={phone}
      tab="scheduled"
      crumbs={[
        { label: 'Scheduled reports', href: `#${BU_ROUTES.list}` },
        { label: schedule.name },
      ]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={schedule.name}
        back={{ href: `#${BU_ROUTES.list}`, label: 'Scheduled reports' }}
        status={schedule.active ? statusBadge('Active') : statusBadge('Paused')}
        subtitle={`${kind?.name ?? ''} · ${FORMAT_LABELS[schedule.format]} · ${schedule.when}`}
        keyFigures={[
          {
            label: 'Next run',
            value: schedule.active ? (
              schedule.next[0] === undefined ? (
                '—'
              ) : (
                <When at={schedule.next[0]} />
              )
            ) : (
              'Paused'
            ),
          },
          {
            label: 'Last run',
            value: last === undefined ? '—' : <When at={last.at} />,
          },
          { label: 'Last run’s state', value: last === undefined ? '—' : statusBadge(last.state) },
          {
            label: 'Recipients',
            value: <span className="bidi-isolate">{String(count)}</span>,
          },
        ]}
        actions={<ActionGroup actions={actions} />}
        sections={[
          ...(failed && last.note !== undefined
            ? [
                {
                  id: 'last-run',
                  label: 'Last run',
                  content: (
                    <Alert
                      tone="danger"
                      title="The last run failed"
                      actions={
                        <>
                          <Button
                            family="neutral"
                            icon={Send}
                            label="Send now"
                            onClick={() => {
                              setSend(true)
                            }}
                          />
                          <Button intent="edit" emphasis="secondary" label="Edit" onClick={edit} />
                        </>
                      }
                    >
                      {last.note}
                    </Alert>
                  ),
                },
              ]
            : []),
          {
            id: 'report',
            label: 'Report',
            content: (
              <KeyValueList
                items={[
                  { label: 'Report', value: kind?.name },
                  ...(kind?.parameters ?? []).map((parameter) => ({
                    key: parameter.id,
                    label: parameter.label,
                    value: parameter.options.find(
                      (option) => option.value === schedule.parameters[parameter.id],
                    )?.label,
                  })),
                  { label: 'Format', value: FORMAT_LABELS[schedule.format] },
                  {
                    label: 'When there is nothing to send',
                    value:
                      schedule.whenEmpty === 'skip' ? 'That run is skipped' : 'It is sent anyway',
                  },
                ]}
              />
            ),
          },
          {
            id: 'schedule',
            label: 'Schedule',
            content: (
              <KeyValueList
                items={[
                  { label: 'Repeats', value: schedule.when },
                  { label: 'Time zone', value: TIME_ZONE },
                  {
                    label: 'Next runs',
                    numeric: true,
                    value: schedule.active ? (
                      <span className="flex flex-col items-end gap-0.5">
                        {schedule.next.map((at) => (
                          <When key={at} at={at} />
                        ))}
                      </span>
                    ) : (
                      'None while it is paused'
                    ),
                  },
                  ...(schedule.pausedNote === undefined
                    ? []
                    : [{ label: 'Paused', value: schedule.pausedNote, fullWidth: true }]),
                  { label: 'Created by', value: schedule.createdBy },
                ]}
              />
            ),
          },
          {
            id: 'recipients',
            label: 'Recipients',
            content: (
              <KeyValueList
                columns={1}
                items={[
                  ...schedule.people.flatMap((personId) => {
                    const person = PEOPLE.find((each) => each.id === personId)
                    return person === undefined
                      ? []
                      : [
                          {
                            key: person.id,
                            label: `${person.name}, ${person.detail}`,
                            value: <span dir="ltr">{person.email}</span>,
                          },
                        ]
                  }),
                  ...schedule.outside.map((address) => ({
                    key: address,
                    label:
                      OUTSIDE.find((each) => each.id === address)?.detail ?? 'Outside the company',
                    value: <span dir="ltr">{address}</span>,
                  })),
                ]}
              />
            ),
          },
          {
            id: 'runs',
            label: 'Last runs',
            description: 'Newest first. A file is kept for 90 days.',
            flush: true,
            content: (
              <DataTable
                label="Last runs"
                layout={phone ? 'cards' : 'table'}
                inCard
                columns={RUN_COLUMNS}
                rows={schedule.runs}
                getRowId={(row) => row.id}
                getRowLabel={(row) => `${row.state}, ${row.at}`}
                rowActions={(row) =>
                  row.file === null
                    ? []
                    : [
                        {
                          label: `Download ${row.file.name}`,
                          onSelect: () => {
                            notice.success(`${row.file?.name ?? ''} is downloaded.`)
                          },
                        },
                      ]
                }
                mobile={{
                  title: (row) => <When at={row.at} />,
                  badge: (row) => statusBadge(row.state),
                  details: ['delivered', 'file', 'note'],
                }}
              />
            ),
          },
          {
            id: 'email',
            label: 'What recipients get',
            description: `With the values of the next run filled in.`,
            content: <Preview schedule={schedule} phone={phone} />,
          },
        ]}
      />
      <ConfirmDialog
        open={send}
        onOpenChange={setSend}
        title="Send now"
        subject={schedule.name}
        message={`${String(count)} ${count === 1 ? 'recipient gets' : 'recipients get'} the report as of today. The schedule does not change${
          schedule.active && schedule.next[0] !== undefined ? '; its next run stays as planned' : ''
        }.`}
        family="primary"
        actionIcon={Send}
        confirmLabel="Send now"
        onConfirm={() => {
          setSchedules((list) =>
            list.map((each) =>
              each.id === schedule.id ? { ...each, runs: [sentNow(each), ...each.runs] } : each,
            ),
          )
          notice.success(`Sent to ${String(count)} ${count === 1 ? 'recipient' : 'recipients'}.`)
        }}
      />
    </AnalyticsShell>
  )
}

// ── A new or edited schedule ──────────────────────────────────────────────────────────────────

interface Draft {
  name: string
  report: string
  parameters: Record<string, string>
  frequency: Frequency
  day: string
  time: string
  people: string[]
  outside: string[]
  format: ReportFormat
  whenEmpty: WhenEmpty
  subject: string
  message: string
}

interface DraftErrors {
  name?: string
  recipients?: string
  subject?: string
  address?: string
}

function draftOf(schedule: Schedule): Draft {
  return {
    name: schedule.name,
    report: schedule.report,
    parameters: { ...schedule.parameters },
    frequency: schedule.frequency,
    day: schedule.day,
    time: schedule.time,
    people: [...schedule.people],
    outside: [...schedule.outside],
    format: schedule.format,
    whenEmpty: schedule.whenEmpty,
    subject: schedule.subject,
    message: schedule.message,
  }
}

/** A new schedule as it starts: the first report with its default parameters. */
function newDraft(): Draft {
  return {
    name: '',
    report: 'receivables',
    parameters: { asOf: 'run', customers: 'all' },
    frequency: 'weekly',
    day: '1',
    time: '07:00',
    people: [],
    outside: [],
    format: 'pdf',
    whenEmpty: 'send',
    subject: '',
    message: '',
  }
}

/** The new schedule after "Save" with a misspelt outside address and no subject. */
function checkedDraft(): Draft {
  return {
    ...newDraft(),
    name: 'Weekly sales by customer',
    people: ['dragan'],
  }
}

/** The errors without the ones the user has just put right. */
function without(errors: DraftErrors, keys: readonly (keyof DraftErrors)[]): DraftErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([key]) => !keys.includes(key as keyof DraftErrors)),
  )
}

function draftErrors(draft: Draft): DraftErrors {
  return {
    ...(draft.name.trim() === '' ? { name: 'Enter a name.' } : {}),
    ...(draft.people.length + draft.outside.length === 0
      ? { recipients: 'Choose at least one person, or add an outside address.' }
      : {}),
    ...(draft.subject.trim() === '' ? { subject: 'Enter a subject.' } : {}),
  }
}

/** The schedule in the application's words. */
function whenText(draft: Draft, weekday: (day: string) => string): string {
  const day = MONTH_DAYS.find((each) => each.value === draft.day)?.label.toLowerCase() ?? ''
  switch (draft.frequency) {
    case 'daily':
      return `Every day at ${draft.time}`
    case 'weekly':
      return `Every ${weekday(draft.day)} at ${draft.time}`
    case 'monthly':
      return `Every month on ${day} at ${draft.time}`
    case 'quarterly':
      return `Every quarter on ${day} of its first month at ${draft.time}`
  }
}

/** The form's screen: the shell (the tenant's day and time zone) around the form. */
export function ScheduleFormScreen({
  phone,
  id,
  checked = false,
}: {
  phone: boolean
  id?: string
  checked?: boolean
}) {
  const [schedules] = useSchedules()
  const existing = id === undefined ? undefined : schedules.find((each) => each.id === id)
  return (
    <AnalyticsShell
      phone={phone}
      tab="scheduled"
      crumbs={[
        { label: 'Scheduled reports', href: `#${BU_ROUTES.list}` },
        ...(existing === undefined
          ? []
          : [{ label: existing.name, href: `#${BU_ROUTES.schedule(existing.id)}` }]),
        { label: existing === undefined ? 'New' : 'Edit' },
      ]}
    >
      <ScheduleForm phone={phone} {...(id === undefined ? {} : { id })} checked={checked} />
    </AnalyticsShell>
  )
}

/** The form itself, inside the shell so its dates and times are the tenant's. */
function ScheduleForm({ phone, id, checked }: { phone: boolean; id?: string; checked: boolean }) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [schedules, setSchedules] = useSchedules()
  const existing = id === undefined ? undefined : schedules.find((each) => each.id === id)
  const [draft, setDraft] = useState<Draft>(() =>
    existing !== undefined ? draftOf(existing) : checked ? checkedDraft() : newDraft(),
  )
  const [errors, setErrors] = useState<DraftErrors>(() =>
    checked
      ? {
          ...draftErrors(checkedDraft()),
          address: 'Enter a whole address, like name@example.com.',
        }
      : {},
  )
  const [address, setAddress] = useState(checked ? 'stanogradnja-plus@example' : '')
  const [dirty, setDirty] = useState(checked)
  const set = (patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setDirty(true)
  }
  const kind = reportKind(draft.report)
  // Weekdays by the provider's locale: 1 Monday … 7 Sunday.
  const weekday = (day: string) => format.weekdayName(Number(day) % 7, 'long')
  const columns = phone ? 1 : 2
  const back = existing === undefined ? BU_ROUTES.list : BU_ROUTES.schedule(existing.id)
  const unchangedSchedule =
    existing?.frequency === draft.frequency &&
    existing.day === draft.day &&
    existing.time === draft.time
  const outsideOptions = [
    ...OUTSIDE.map((each) => ({ value: each.id, label: each.email })),
    ...draft.outside
      .filter((value) => !OUTSIDE.some((each) => each.id === value))
      .map((value) => ({ value, label: value })),
  ]
  const addAddress = () => {
    const problem = outsideAddressProblem(address, addresses(draft))
    if (problem !== null) {
      setErrors((current) => ({ ...current, address: problem }))
      return
    }
    const value = address.trim().toLowerCase()
    set({ outside: [...draft.outside, value] })
    setAddress('')
    setErrors((current) => without(current, ['address', 'recipients']))
  }
  const save = () => {
    const found = draftErrors(draft)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      notice.error('Check the fields marked in red.')
      return
    }
    const when = whenText(draft, weekday)
    if (existing !== undefined) {
      setSchedules((list) =>
        list.map((each) =>
          each.id === existing.id
            ? { ...each, ...draft, when, next: unchangedSchedule ? each.next : [] }
            : each,
        ),
      )
      notice.success(`${draft.name} is saved.`)
      navigate(BU_ROUTES.schedule(existing.id))
      return
    }
    setSchedules((list) => [
      ...list,
      {
        ...draft,
        id: `rs-${String(list.length + 1).padStart(2, '0')}`,
        when,
        active: true,
        next: [],
        runs: [],
        createdBy: 'Milica Petrović on 14.10.2026.',
      },
    ])
    notice.success(`${draft.name} is saved. The application plans its first run.`)
    navigate(BU_ROUTES.list)
  }
  const title = existing?.name ?? 'New scheduled report'
  return (
    <RecordFormPage
      layout={phone ? 'phone' : 'desktop'}
      title={title}
      back={{
        href: `#${back}`,
        label: existing === undefined ? 'Scheduled reports' : existing.name,
      }}
      dirty={dirty}
      actions={
        <ActionGroup
          actions={[
            {
              key: 'cancel',
              intent: 'cancel',
              label: 'Cancel',
              onClick: () => {
                navigate(back)
              },
            },
            { key: 'save', intent: 'save', label: 'Save', onClick: save },
          ]}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <FormSection title="Report" columns={columns}>
          <FormFullWidth>
            <TextField
              label="Name"
              required
              description="How the schedule is listed."
              value={draft.name}
              onChange={(name) => {
                set({ name })
              }}
              {...(errors.name === undefined ? {} : { error: errors.name })}
            />
          </FormFullWidth>
          <SelectField
            label="Report"
            required
            options={REPORT_KINDS.map((each) => ({ value: each.id, label: each.name }))}
            value={draft.report}
            description={kind?.description}
            onChange={(report) => {
              const next = reportKind(report)
              if (next === undefined) return
              set({
                report,
                parameters: Object.fromEntries(
                  next.parameters.map((parameter) => [
                    parameter.id,
                    parameter.options[0]?.value ?? '',
                  ]),
                ),
              })
            }}
          />
          {(kind?.parameters ?? []).map((parameter) => (
            <SelectField
              key={parameter.id}
              label={parameter.label}
              options={parameter.options}
              value={draft.parameters[parameter.id] ?? ''}
              onChange={(value) => {
                set({ parameters: { ...draft.parameters, [parameter.id]: value } })
              }}
            />
          ))}
        </FormSection>
        <FormSection
          title="Schedule"
          description="The application runs it in the company’s time zone."
          columns={columns}
        >
          <SelectField
            label="Repeats"
            options={FREQUENCIES}
            value={draft.frequency}
            onChange={(value) => {
              const frequency = FREQUENCIES.find((each) => each.value === value)?.value
              if (frequency === undefined) return
              set({
                frequency,
                day: frequency === 'weekly' ? '1' : frequency === 'daily' ? '' : '1',
              })
            }}
          />
          {draft.frequency === 'weekly' && (
            <SelectField
              label="On"
              options={WEEKDAYS.map((day) => ({ value: day, label: weekday(day) }))}
              value={draft.day}
              onChange={(day) => {
                set({ day })
              }}
            />
          )}
          {(draft.frequency === 'monthly' || draft.frequency === 'quarterly') && (
            <SelectField
              label={draft.frequency === 'monthly' ? 'On' : 'On, in the quarter’s first month'}
              options={MONTH_DAYS}
              value={draft.day}
              onChange={(day) => {
                set({ day })
              }}
            />
          )}
          <SelectField
            label="At"
            options={TIMES.map((time) => ({ value: time, label: time }))}
            value={draft.time}
            onChange={(time) => {
              set({ time })
            }}
          />
          <TextField label="Time zone" readOnly value={TIME_ZONE} />
          <TextField
            label="Next run"
            readOnly
            value={
              unchangedSchedule && existing.next[0] !== undefined
                ? format.dateTime(existing.next[0])
                : 'The application plans it when you save.'
            }
          />
        </FormSection>
        <FormSection
          title="Recipients"
          description="Reports sent outside the company leave it: add only addresses you trust."
          columns={columns}
        >
          <MultiSelectField
            label="People of the company"
            options={PEOPLE.map((each) => ({ value: each.id, label: each.name }))}
            value={draft.people}
            placeholder="Search people"
            onChange={(people) => {
              set({ people })
              setErrors((current) => without(current, ['recipients']))
            }}
            {...(errors.recipients === undefined ? {} : { error: errors.recipients })}
          />
          <MultiSelectField
            label="Outside addresses"
            options={outsideOptions}
            value={draft.outside}
            placeholder="Search addresses used before"
            onChange={(outside) => {
              set({ outside })
            }}
          />
          <FormFullWidth>
            <div className="flex flex-col items-start gap-2">
              <TextField
                label="Add an outside address"
                direction="ltr"
                className="w-full max-w-120"
                value={address}
                description="The application checks it before it is added."
                onChange={(value) => {
                  setAddress(value)
                }}
                {...(errors.address === undefined ? {} : { error: errors.address })}
              />
              <Button family="neutral" icon={Plus} label="Add address" onClick={addAddress} />
            </div>
          </FormFullWidth>
        </FormSection>
        <FormSection title="Delivery" columns={columns}>
          <RadioGroupField
            label="Format"
            options={FORMATS}
            value={draft.format}
            onChange={(value) => {
              const chosen = FORMATS.find((each) => each.value === value)?.value
              if (chosen !== undefined) set({ format: chosen })
            }}
          />
          <RadioGroupField
            label="When there is nothing to send"
            options={[
              { value: 'send', label: 'Send it anyway', description: 'The report says so.' },
              {
                value: 'skip',
                label: 'Skip that run',
                description: 'The run is listed as skipped.',
              },
            ]}
            value={draft.whenEmpty}
            onChange={(value) => {
              set({ whenEmpty: value === 'skip' ? 'skip' : 'send' })
            }}
          />
        </FormSection>
        <FormSection title="E-mail" columns={1}>
          <TextField
            label="Subject"
            required
            description="{{date}} and {{period}} are filled in when it is sent."
            value={draft.subject}
            onChange={(subject) => {
              set({ subject })
            }}
            {...(errors.subject === undefined ? {} : { error: errors.subject })}
          />
          <TextAreaField
            label="Message"
            rows={4}
            value={draft.message}
            onChange={(message) => {
              set({ message })
            }}
          />
        </FormSection>
        <FormSection
          title="Preview"
          description="As the next run will send it, with its values filled in."
          columns={1}
        >
          <Preview phone={phone} schedule={{ ...draft, when: whenText(draft, weekday) }} />
        </FormSection>
      </div>
    </RecordFormPage>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BU_ROUTES: ExampleRoute[] = [
  { path: BU_ROUTES.list, render: (phone) => <ScheduledReportsScreen phone={phone} /> },
  ...SCHEDULES.map((schedule) => ({
    path: BU_ROUTES.schedule(schedule.id),
    render: (phone: boolean) => <ScheduleScreen phone={phone} id={schedule.id} />,
  })),
  {
    path: BU_ROUTES.sendNow,
    render: (phone) => <ScheduleScreen phone={phone} id="rs-01" sendOpen />,
  },
  { path: BU_ROUTES.edit, render: (phone) => <ScheduleFormScreen phone={phone} id="rs-01" /> },
  { path: BU_ROUTES.create, render: (phone) => <ScheduleFormScreen phone={phone} /> },
  {
    path: BU_ROUTES.createChecked,
    render: (phone) => <ScheduleFormScreen phone={phone} checked />,
  },
]
