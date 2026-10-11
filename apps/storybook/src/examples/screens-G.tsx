import { CheckCheck, CircleX } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  Alert,
  AttendanceGrid,
  Button,
  ClockRecordList,
  createFormat,
  EmptyState,
  KeyFigures,
  KeyValueList,
  LiroProvider,
  MyShifts,
  PageHeader,
  ReasonConfirmDialog,
  ShiftPlanner,
  Toaster,
  WorkingTimeBalance,
  WorklistPage,
  notice,
  useLiro,
  type AttendanceChange,
  type AttendanceCorrection,
  type AttendanceValue,
  type ClockRecord,
  type ModuleTab,
  type MyShift,
  type ShiftAssignment,
  type ShiftChange,
  type ShellCompany,
  type WorklistItem,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Shell, statusBadge, type ExampleAccount } from './example-shell'
import {
  CLOCK_DAY,
  CLOCK_RECORDS,
  CLOCK_SOURCES,
  CORRECTED,
  CREW,
  crewSum,
  crewTotals,
  ER,
  ER_ASSIGNMENTS,
  ER_BALANCE,
  ER_CONFLICTS,
  erCoverage,
  ER_GROUPINGS,
  ER_PLAN,
  ER_PUBLISH,
  ER_ROTATIONS,
  ER_ROWS,
  ER_TEMPLATES,
  LOCKED_CORRECTIONS,
  OCTOBER,
  plannedHours,
  SITE,
  STEFAN,
  STEFAN_SHIFTS,
  STEFAN_SWAP_SHIFT,
  STORE,
  STORE_ASSIGNMENTS,
  STORE_CONFLICTS,
  STORE_GROUPINGS,
  STORE_PEOPLE,
  STORE_PUBLISH,
  STORE_TEMPLATES,
  storeColleagues,
  storeCoverage,
  SWAP_REJECT_REASONS,
  SWAP_REQUESTS,
  TIME_CODES,
  TIMESHEET_LOCKED,
  TIMESHEET_MARKS,
  TIMESHEET_OPEN,
  type SwapRequest,
} from './data-G'

/*
 * Group G's example screens (P5.24, working time), three examples with one dataset each
 * (data-G.ts): Kvadrat Gradnja's site crew (the October 2026 timesheet, the clock records, the
 * month locked after payroll), Prodavnica 12's shifts (the planner, a cashier's own shifts on a
 * phone, the swap requests to approve) and Dom zdravlja Novi Sad's emergency department (a
 * rotation applied, the working-time redistribution). Every screen plays the application: it keeps
 * the state and works out the figures (data-G.ts); the components only show them. Every limit is
 * illustrative and says so.
 */

export const G_ROUTES = {
  timesheet: '/working-time/timesheets/2026-10',
  timesheetLocked: '/working-time/timesheets/2026-10?state=locked',
  /** The locked month on a phone, on the worker whose day was corrected. */
  timesheetLockedWorker: `/working-time/timesheets/2026-10?state=locked&employee=${CORRECTED.row}`,
  clockRecords: `/working-time/clock-records/${CLOCK_DAY}`,
  storePlanner: `/shifts/prodavnica-12/${STORE.start}`,
  myShifts: '/me/shifts',
  myShiftsSwap: `/me/shifts?swap=${STEFAN_SWAP_SHIFT}`,
  swapRequests: '/shifts/prodavnica-12/swap-requests',
  /** The swap requests with Sanja Vuković's (the one with a warning) in focus. */
  swapRequestWarning: '/shifts/prodavnica-12/swap-requests?request=r3',
  erPlanner: `/shifts/emergency/${ER.start}`,
  erRotation: `/shifts/emergency/${ER.start}?rotation=open`,
  erBalance: `/shifts/emergency/balance/${ER_PLAN.start}`,
}

// ── Shared pieces ─────────────────────────────────────────────────────────────────────────────

/** The tenant's formats in its own time zone (instants with an offset are shown there). */
const TENANT_FORMAT = createFormat('sr-Latn-RS', {}, 'Europe/Belgrade')

/**
 * The tenant's settings these screens need beyond the examples' provider: a Serbian tenant's week
 * starts on Monday (the planner's Today, My shifts' weeks, the calendars count from it), and its
 * instants — clock-ins, corrections, requests — are shown in Europe/Belgrade, whatever the
 * device's zone. The Core passes both from the tenant's settings.
 */
export function Tenant({ children }: { children: ReactNode }) {
  const liro = useLiro()
  return (
    <LiroProvider
      locale={liro.locale}
      direction={liro.direction}
      colorScheme={liro.colorScheme}
      messages={liro.messages}
      format={TENANT_FORMAT}
      today={liro.today}
      weekStartsOn={1}
      timeZone="Europe/Belgrade"
      linkComponent={liro.linkComponent}
    >
      {children}
    </LiroProvider>
  )
}

/** The page's frame: 24px and the content width on a desktop, 16px on a phone. */
export function Frame({
  phone,
  wide = false,
  children,
}: {
  phone: boolean
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={
        phone
          ? 'box-border flex w-full min-w-0 flex-col gap-4 p-4'
          : wide
            ? 'box-border flex w-full min-w-0 flex-col gap-6 p-6'
            : 'mx-auto box-border flex w-full max-w-content min-w-0 flex-col gap-6 p-6'
      }
    >
      {children}
    </div>
  )
}

/** Hours with their unit, the number through the provider's format. */
function useHours() {
  const { format } = useLiro()
  return (value: string) => `${format.number(value)} h`
}

/** A shift in words: "Sat 10.10.2026. · Late, 15:00–23:00". */
function useShiftText() {
  const { format } = useLiro()
  return (shift: MyShift) => {
    const [y = 2000, m = 1, d = 1] = shift.date.split('-').map(Number)
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
    const times = `${format.time(`${shift.date}T${shift.start}`)}–${format.time(`${shift.date}T${shift.end}`)}`
    return `${format.weekdayName(weekday, 'short')} ${format.date(shift.date)} · ${shift.label}, ${times}`
  }
}

/** The application applies the planner's changes: a new or moved shift is marked "Changed". */
function applyShiftChanges(
  assignments: readonly ShiftAssignment[],
  changes: readonly ShiftChange[],
): ShiftAssignment[] {
  let next = [...assignments]
  for (const change of changes) {
    if (change.type === 'add') {
      next.push({
        id: `new-${change.rowId}-${change.date}-${change.templateId}-${String(next.length)}`,
        rowId: change.rowId,
        date: change.date,
        templateId: change.templateId,
        changed: true,
      })
    } else if (change.type === 'remove') {
      next = next.filter((each) => each.id !== change.assignmentId)
    } else {
      next = next.map((each) =>
        each.id === change.assignmentId
          ? { ...each, rowId: change.to.rowId, date: change.to.date, changed: true }
          : each,
      )
    }
  }
  return next
}

// ── 1. Kvadrat Gradnja: the site timesheet ─────────────────────────────────────────────────────

const WORKING_TIME_TABS = (current: 'timesheets' | 'clock'): ModuleTab[] => [
  {
    key: 'timesheets',
    label: 'Timesheets',
    href: `#${G_ROUTES.timesheet}`,
    current: current === 'timesheets',
  },
  {
    key: 'clock',
    label: 'Clock records',
    href: `#${G_ROUTES.clockRecords}`,
    current: current === 'clock',
  },
]

/** The application applies the grid's changes to its value. */
function applyEntries(value: AttendanceValue, changes: readonly AttendanceChange[]) {
  const next: Record<string, Record<string, AttendanceChange['entry']>> = { ...value }
  for (const change of changes)
    next[change.row] = { ...next[change.row], [change.column]: change.entry }
  return next
}

export function SiteTimesheet({
  phone,
  locked,
  worker,
}: {
  phone: boolean
  locked: boolean
  worker?: string
}) {
  const hours = useHours()
  const [value, setValue] = useState<AttendanceValue>(locked ? TIMESHEET_LOCKED : TIMESHEET_OPEN)
  const [corrections, setCorrections] = useState<
    Record<string, Record<string, AttendanceCorrection>>
  >(locked ? LOCKED_CORRECTIONS : {})
  const [handedOff, setHandedOff] = useState(locked)
  // The application works the totals out again from what the grid holds.
  const totals = crewTotals(value)
  const figures = [
    { key: 'worked', label: 'Hours worked' },
    { key: 'night', label: 'Night hours' },
    { key: 'overtime', label: 'Overtime hours' },
    { key: 'leave', label: 'Leave and holiday hours' },
  ].map((each) => ({ ...each, value: hours(crewSum(totals.rowTotals, each.key)) }))
  return (
    <Tenant>
      <Shell
        phone={phone}
        crumbs={[{ label: 'Working time', href: `#${G_ROUTES.timesheet}` }, { label: SITE.month }]}
        tabs={WORKING_TIME_TABS('timesheets')}
      >
        <Frame phone={phone} wide>
          <PageHeader
            title={`Timesheet, ${SITE.month}`}
            status={statusBadge(locked ? 'Locked' : handedOff ? 'Submitted' : 'In progress')}
            subtitle={`Site ${SITE.name} · ${String(CREW.length)} workers`}
          />
          <KeyFigures layout={phone ? 'phone' : 'desktop'} items={figures} />
          <AttendanceGrid
            label={`Timesheet, ${SITE.month}`}
            rowsLabel="Worker"
            mode="hours"
            rows={CREW}
            columns={OCTOBER}
            codes={TIME_CODES}
            defaultCode="RW"
            marks={TIMESHEET_MARKS}
            layout={phone ? 'phone' : 'desktop'}
            {...(worker === undefined ? {} : { defaultRow: worker })}
            {...totals}
            value={value}
            corrections={corrections}
            {...(locked
              ? {
                  locked: {
                    reason: 'Payroll for October 2026 has been calculated.',
                    detail: SITE.lockedDetail,
                  },
                  onCorrect: (request) => {
                    setValue((current) => applyEntries(current, [request]))
                    setCorrections((current) => ({
                      ...current,
                      [request.row]: {
                        ...current[request.row],
                        [request.column]: {
                          original: request.previous,
                          by: 'Milica Petrović',
                          at: '2026-11-06T10:05:00+01:00',
                          reason: request.reason,
                        },
                      },
                    }))
                    notice.success('Correction saved. Payroll will include it next month.')
                  },
                }
              : {
                  onChange: (changes) => {
                    setValue((current) => applyEntries(current, changes))
                  },
                })}
            handOff={{
              state: handedOff ? 'done' : 'open',
              label: 'Hand off to payroll',
              doneText: 'Handed off to payroll on 02.11.2026.',
              onHandOff: () => {
                setHandedOff(true)
                notice.success('October 2026 handed off to payroll.')
              },
            }}
          />
        </Frame>
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

export function ClockRecords({ phone }: { phone: boolean }) {
  const { format, linkComponent: Link } = useLiro()
  const [records, setRecords] = useState<readonly ClockRecord[]>(CLOCK_RECORDS)
  return (
    <Tenant>
      <Shell
        phone={phone}
        crumbs={[
          { label: 'Working time', href: `#${G_ROUTES.timesheet}` },
          { label: 'Clock records' },
        ]}
        tabs={WORKING_TIME_TABS('clock')}
      >
        <Frame phone={phone}>
          <PageHeader
            title="Clock records"
            subtitle={`${format.dateLong(CLOCK_DAY)} · site ${SITE.name}`}
          />
          <p className="bidi-content m-0 text-sm text-secondary">
            The hours each record gives are the day’s hours in the{' '}
            <Link href={`#${G_ROUTES.timesheet}`} className="text-link underline visited:text-link">
              October 2026 timesheet
            </Link>
            . A correction keeps the original and says who changed it, when and why.
          </p>
          <ClockRecordList
            label={`Clock records, ${format.date(CLOCK_DAY)}`}
            records={records}
            sources={CLOCK_SOURCES}
            decimals={2}
            layout={phone ? 'cards' : 'table'}
            onCorrect={(request) => {
              setRecords((current) =>
                current.map((record) =>
                  record.id === request.id
                    ? {
                        ...record,
                        in: request.in === null ? null : `${record.date}T${request.in}:00+01:00`,
                        out: request.out === null ? null : `${record.date}T${request.out}:00+01:00`,
                        correction: {
                          originalIn: record.correction?.originalIn ?? record.in,
                          originalOut: record.correction?.originalOut ?? record.out,
                          by: 'Milica Petrović',
                          at: '2026-10-30T10:20:00+01:00',
                          reason: request.reason,
                        },
                      }
                    : record,
                ),
              )
              notice.success('Clock record corrected.')
            }}
          />
        </Frame>
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

// ── 2. Prodavnica 12: shifts ───────────────────────────────────────────────────────────────────

const STORE_COMPANY: ShellCompany = {
  id: STORE.companyId,
  name: STORE.company,
  description: STORE.name,
}

const STORE_MANAGER: ExampleAccount = {
  name: 'Tamara Đukić',
  email: 'tamara.djukic@trgovinebacka.rs',
  companies: [STORE_COMPANY],
  links: [
    { label: 'Shift schedule', path: G_ROUTES.storePlanner },
    { label: 'Swap requests', path: G_ROUTES.swapRequests },
  ],
}

const STORE_CASHIER: ExampleAccount = {
  name: STEFAN.name,
  email: STEFAN.email,
  companies: [STORE_COMPANY],
  links: [{ label: 'My shifts', path: G_ROUTES.myShifts }],
}

const STORE_TABS = (current: 'schedule' | 'swaps'): ModuleTab[] => [
  {
    key: 'schedule',
    label: 'Schedule',
    href: `#${G_ROUTES.storePlanner}`,
    current: current === 'schedule',
  },
  {
    key: 'swaps',
    label: 'Swap requests',
    href: `#${G_ROUTES.swapRequests}`,
    current: current === 'swaps',
  },
]

export function StorePlanner({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const [assignments, setAssignments] = useState<ShiftAssignment[]>(STORE_ASSIGNMENTS)
  const [changed, setChanged] = useState(true)
  // The application works the hours and the coverage out again after each change.
  const rows = STORE_PEOPLE.map((person) => ({
    id: person.id,
    name: person.name,
    subtitle: person.subtitle,
    hours: plannedHours(assignments, person.id),
  }))
  const coverage = storeCoverage(assignments)
  return (
    <Tenant>
      <Shell
        phone={phone}
        account={STORE_MANAGER}
        company={STORE.companyId}
        crumbs={[{ label: 'Shifts', href: `#${G_ROUTES.storePlanner}` }, { label: STORE.name }]}
        tabs={STORE_TABS('schedule')}
      >
        <Frame phone={phone} wide>
          <PageHeader
            title={`Shifts, ${STORE.name}`}
            subtitle={`Week ${format.date(STORE.start)}–${format.date(STORE.end)} · open 07:00–23:00`}
          />
          <ShiftPlanner
            label={`Shifts, ${STORE.name}`}
            layout={phone ? 'phone' : 'desktop'}
            rows={rows}
            templates={STORE_TEMPLATES}
            assignments={assignments}
            start={STORE.start}
            end={STORE.end}
            conflicts={STORE_CONFLICTS}
            coverage={coverage}
            groupings={STORE_GROUPINGS}
            status="published"
            changedSincePublishing={changed}
            publishCounts={STORE_PUBLISH}
            onChange={(changes) => {
              setAssignments((current) => applyShiftChanges(current, changes))
              setChanged(true)
            }}
            onPublish={() => {
              setAssignments((current) => current.map((each) => ({ ...each, changed: false })))
              setChanged(false)
              notice.success(
                `Changes published. ${format.number(String(STORE_PUBLISH.people))} people were notified.`,
              )
            }}
          />
        </Frame>
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

/** Stefan Lukić's own shifts, made for his phone: "Request swap" on each. */
export function StefanShifts({ phone, swap }: { phone: boolean; swap?: string }) {
  const [shifts, setShifts] = useState<MyShift[]>(STEFAN_SHIFTS)
  return (
    <Tenant>
      <Shell
        phone={phone}
        account={STORE_CASHIER}
        company={STORE.companyId}
        crumbs={[{ label: 'My shifts' }]}
      >
        <div
          className={
            phone
              ? 'box-border flex w-full min-w-0 flex-col gap-4 p-4'
              : 'box-border flex w-full max-w-xl min-w-0 flex-col gap-4 p-6'
          }
        >
          <MyShifts
            shifts={shifts}
            colleagues={storeColleagues}
            swapReasonRequired
            {...(swap === undefined ? {} : { defaultSwapShift: swap })}
            onSwapSubmit={(request) => {
              const colleague = storeColleagues({ date: '2026-10-12' }).find(
                (each) => each.id === request.colleagueId,
              )
              setShifts((current) =>
                current.map((shift) =>
                  shift.id === request.shiftId
                    ? {
                        ...shift,
                        swapState:
                          colleague === undefined
                            ? 'Swap requested · waiting for approval'
                            : `Swap requested with ${colleague.name} · waiting for approval`,
                      }
                    : shift,
                ),
              )
              notice.success('Swap request sent to Tamara Đukić.')
            }}
          />
        </div>
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

function SwapDetail({ request, phone }: { request: SwapRequest; phone: boolean }) {
  const { format } = useLiro()
  const shiftText = useShiftText()
  return (
    <div className={phone ? 'flex flex-col gap-4' : 'flex flex-col gap-6 p-6'}>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="bidi-content m-0 text-h2 text-primary">{request.from}</h2>
        <p className="bidi-content m-0 text-sm text-secondary">
          Asks to hand over a shift · {format.dateTime(request.requested)}
        </p>
      </div>
      <KeyValueList
        columns={1}
        items={[
          { label: 'Shift', value: shiftText(request.shift) },
          { label: 'Taken by', value: request.to ?? 'Anyone qualified' },
          ...(request.back === null
            ? []
            : [{ label: 'Shift taken instead', value: shiftText(request.back) }]),
          { label: 'Reason', value: request.reason },
        ]}
      />
      <Alert
        tone={request.check.tone}
        title={request.check.tone === 'warning' ? 'Check before approving' : 'Checked'}
      >
        {request.check.text}
      </Alert>
    </div>
  )
}

export function SwapRequests({ phone, focus }: { phone: boolean; focus?: string }) {
  const shiftText = useShiftText()
  const [rows, setRows] = useState<readonly SwapRequest[]>(SWAP_REQUESTS)
  const [selected, setSelected] = useState<string | undefined>(
    focus ?? (phone ? undefined : SWAP_REQUESTS[0]?.id),
  )
  const [asking, setAsking] = useState(false)
  const row = rows.find((each) => each.id === selected)
  const index = rows.findIndex((each) => each.id === selected)
  const decide = (id: string, done: string) => {
    const rest = rows.filter((each) => each.id !== id)
    setRows(rest)
    if (!phone || selected !== undefined) {
      setSelected(rest[Math.min(Math.max(index, 0), rest.length - 1)]?.id)
    }
    notice.success(done)
  }
  const items: WorklistItem[] = rows.map((each) => ({
    id: each.id,
    label: each.from,
    title: each.from,
    subtitle: shiftText(each.shift),
    status: statusBadge('To approve'),
  }))
  const decisions =
    row === undefined ? undefined : (
      <>
        <Button
          family="destructive"
          icon={CircleX}
          label="Reject"
          onClick={() => {
            setAsking(true)
          }}
        />
        <Button
          family="positive"
          icon={CheckCheck}
          label="Approve"
          emphasis="primary"
          onClick={() => {
            decide(row.id, `Swap of ${row.from} approved. Both were notified.`)
          }}
        />
      </>
    )
  return (
    <Tenant>
      <Shell
        phone={phone}
        account={STORE_MANAGER}
        company={STORE.companyId}
        crumbs={[
          { label: 'Shifts', href: `#${G_ROUTES.storePlanner}` },
          { label: 'Swap requests' },
        ]}
        tabs={STORE_TABS('swaps')}
        {...(phone && decisions !== undefined
          ? { bottomBar: <div className="flex gap-2 [&>*]:flex-1">{decisions}</div> }
          : {})}
      >
        <WorklistPage
          layout={phone ? 'stacked' : 'split'}
          title="Swap requests"
          subtitle={STORE.name}
          label="Swap requests to approve"
          items={items}
          {...(selected === undefined ? {} : { selected })}
          onSelect={setSelected}
          empty={
            <EmptyState
              title="No swap requests"
              description="Requests appear here when someone asks to hand over a shift."
            />
          }
          {...(row === undefined ? {} : { detail: <SwapDetail request={row} phone={phone} /> })}
          {...(decisions === undefined || phone ? {} : { detailActions: decisions })}
          onBack={() => {
            setSelected(undefined)
          }}
          onPrevious={() => {
            setSelected(rows[(index - 1 + rows.length) % rows.length]?.id)
          }}
          onNext={() => {
            setSelected(rows[(index + 1) % rows.length]?.id)
          }}
        />
        <ReasonConfirmDialog
          open={asking}
          onOpenChange={setAsking}
          family="destructive"
          actionIcon={CircleX}
          title={`Reject the swap of ${row?.from ?? ''}?`}
          message="The reason is sent to the person who asked."
          reasonLabel="Reason for rejection"
          reasons={SWAP_REJECT_REASONS}
          confirmLabel="Reject"
          onConfirm={() => {
            if (row !== undefined) decide(row.id, `Swap of ${row.from} rejected.`)
          }}
        />
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

// ── 3. Dom zdravlja Novi Sad: the emergency department ─────────────────────────────────────────

const ER_COMPANY: ShellCompany = { id: ER.companyId, name: ER.company, description: ER.department }

const HEAD_NURSE: ExampleAccount = {
  name: 'Snežana Ilić',
  email: 'snezana.ilic@dzns.rs',
  companies: [ER_COMPANY],
  links: [
    { label: 'Shift schedule', path: G_ROUTES.erPlanner },
    { label: 'Working-time balance', path: G_ROUTES.erBalance },
  ],
}

const ER_TABS = (current: 'schedule' | 'balance'): ModuleTab[] => [
  {
    key: 'schedule',
    label: 'Schedule',
    href: `#${G_ROUTES.erPlanner}`,
    current: current === 'schedule',
  },
  {
    key: 'balance',
    label: 'Working-time balance',
    href: `#${G_ROUTES.erBalance}`,
    current: current === 'balance',
  },
]

export function EmergencyPlanner({ phone, rotation }: { phone: boolean; rotation: boolean }) {
  const { format } = useLiro()
  const [assignments, setAssignments] = useState<ShiftAssignment[]>(ER_ASSIGNMENTS)
  const [published, setPublished] = useState(false)
  const rows = ER_ROWS.map((row) => ({ ...row, hours: plannedHours(assignments, row.id) }))
  // The application's coverage, again after each change: one doctor and two nurses a shift.
  const coverage = erCoverage(assignments)
  return (
    <Tenant>
      <Shell
        phone={phone}
        account={HEAD_NURSE}
        company={ER.companyId}
        crumbs={[{ label: 'Shifts', href: `#${G_ROUTES.erPlanner}` }, { label: ER.department }]}
        tabs={ER_TABS('schedule')}
      >
        <Frame phone={phone} wide>
          <PageHeader
            title={`Shifts, ${ER.department}`}
            subtitle={`Week ${format.date(ER.start)}–${format.date(ER.end)} · 24/7, three shifts`}
          />
          <Alert tone="neutral" title="Rotation applied">
            {`${ER_ROTATIONS[0]?.label ?? ''} for all 12 people. Since then: Sonja Kovač’s shifts on 08.10. and 09.10. taken off (sick leave), two shifts added to cover.`}
          </Alert>
          <ShiftPlanner
            label={`Shifts, ${ER.department}`}
            layout={phone ? 'phone' : 'desktop'}
            rows={rows}
            templates={ER_TEMPLATES}
            assignments={assignments}
            start={ER.start}
            end={ER.end}
            conflicts={ER_CONFLICTS}
            coverage={coverage}
            groupings={ER_GROUPINGS}
            defaultGroupBy="team"
            rotations={ER_ROTATIONS}
            defaultRotationOpen={rotation}
            status={published ? 'published' : 'draft'}
            publishCounts={ER_PUBLISH}
            onChange={(changes) => {
              setAssignments((current) => applyShiftChanges(current, changes))
            }}
            onPublish={() => {
              setPublished(true)
              notice.success(
                `Schedule published. ${format.number(String(ER_PUBLISH.people))} people were notified.`,
              )
            }}
          />
        </Frame>
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

export function EmergencyBalance({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  return (
    <Tenant>
      <Shell
        phone={phone}
        account={HEAD_NURSE}
        company={ER.companyId}
        crumbs={[
          { label: 'Shifts', href: `#${G_ROUTES.erPlanner}` },
          { label: 'Working-time balance' },
        ]}
        tabs={ER_TABS('balance')}
      >
        <Frame phone={phone}>
          <PageHeader
            title="Working-time redistribution"
            subtitle={`${ER.department} · ${format.date(ER_PLAN.start)}–${format.date(ER_PLAN.end)}`}
          />
          <p className="bidi-content m-0 text-sm text-secondary">
            The hours are spread unevenly over the eight weeks; the average over the period counts.
            The limits in the warnings are illustrative: the application passes its own.
          </p>
          <WorkingTimeBalance
            label="Working-time balance, emergency department"
            title="Eight weeks, planned and worked"
            plan={ER_PLAN}
            rows={ER_BALANCE}
            layout={phone ? 'cards' : 'table'}
          />
        </Frame>
      </Shell>
    </Tenant>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_G_ROUTES: ExampleRoute[] = [
  { path: G_ROUTES.timesheet, render: (phone) => <SiteTimesheet phone={phone} locked={false} /> },
  {
    path: G_ROUTES.timesheetLocked,
    render: (phone) => <SiteTimesheet phone={phone} locked />,
  },
  {
    path: G_ROUTES.timesheetLockedWorker,
    render: (phone) => <SiteTimesheet phone={phone} locked worker={CORRECTED.row} />,
  },
  { path: G_ROUTES.clockRecords, render: (phone) => <ClockRecords phone={phone} /> },
  { path: G_ROUTES.storePlanner, render: (phone) => <StorePlanner phone={phone} /> },
  { path: G_ROUTES.myShifts, render: (phone) => <StefanShifts phone={phone} /> },
  {
    path: G_ROUTES.myShiftsSwap,
    render: (phone) => <StefanShifts phone={phone} swap={STEFAN_SWAP_SHIFT} />,
  },
  { path: G_ROUTES.swapRequests, render: (phone) => <SwapRequests phone={phone} /> },
  {
    path: G_ROUTES.swapRequestWarning,
    render: (phone) => <SwapRequests phone={phone} focus="r3" />,
  },
  {
    path: G_ROUTES.erPlanner,
    render: (phone) => <EmergencyPlanner phone={phone} rotation={false} />,
  },
  { path: G_ROUTES.erRotation, render: (phone) => <EmergencyPlanner phone={phone} rotation /> },
  { path: G_ROUTES.erBalance, render: (phone) => <EmergencyBalance phone={phone} /> },
]
