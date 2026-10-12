/*
 * Group G's example data (P5.24, working time): three examples, one dataset each.
 * 1. Kvadrat Gradnja d.o.o., the site crew at Bulevar Evrope 24: the October 2026 timesheet, the
 *    clock records of Thursday 29.10.2026 and the month locked after payroll with one correction.
 * 2. Trgovine Bačka d.o.o., Prodavnica 12 Novi Sad: two weeks of shifts (07–15, 15–23), the
 *    cashier Stefan Lukić's own shifts and three swap requests to approve.
 * 3. Dom zdravlja Novi Sad, the emergency department (24/7): a week with a rotation applied
 *    (06–14, 14–22, 22–06) and the working-time redistribution of the eight weeks before it.
 * Hours are decimal strings; every total is worked out here in whole hundredths of an hour, as
 * the application would send it — the components add nothing (D4). Every limit and rule is
 * ILLUSTRATIVE and labelled so; no legal limit is encoded. Fictitious people. No classes here.
 */
import {
  rotationAssignments,
  type AttendanceCode,
  type AttendanceColumn,
  type AttendanceCorrection,
  type AttendanceEntry,
  type AttendanceMark,
  type AttendanceRow,
  type AttendanceTotals,
  type AttendanceValue,
  type ClockRecord,
  type ClockSource,
  type MyShift,
  type RotationPattern,
  type ShiftAssignment,
  type ShiftConflicts,
  type ShiftCoverage,
  type ShiftGrouping,
  type ShiftPlannerRow,
  type ShiftTemplate,
  type SwapColleague,
  type WorkingTimePlan,
  type WorkingTimeRow,
} from '@veljaos/ui'

// ── Hours as whole hundredths ─────────────────────────────────────────────────────────────────

/** "7.5" → 750, "8.00" → 800: hours read as whole hundredths (never JavaScript decimals). */
export function hundredths(hours: string): number {
  const [whole = '0', fraction = ''] = hours.split('.')
  const sign = whole.startsWith('-') ? -1 : 1
  return sign * (Math.abs(Number(whole)) * 100 + Number((fraction + '00').slice(0, 2)))
}

/** 750 → "7.5", 800 → "8", -200 → "-2": the shortest decimal string. */
export function hoursText(value: number): string {
  const sign = value < 0 ? '-' : ''
  const whole = Math.floor(Math.abs(value) / 100)
  const rest = Math.abs(value) % 100
  if (rest === 0) return `${sign}${String(whole)}`
  const fraction = String(rest).padStart(2, '0').replace(/0$/, '')
  return `${sign}${String(whole)}.${fraction}`
}

/** The sum of hours, or null when there are none. */
function sumHours(hours: readonly (string | null | undefined)[]): string | null {
  const counted = hours.filter((each): each is string => each != null)
  return counted.length === 0 ? null : hoursText(counted.reduce((t, h) => t + hundredths(h), 0))
}

/** The days from `start` to `end`, YYYY-MM-DD, both included. */
export function daysBetweenDates(start: string, end: string): string[] {
  const days: string[] = []
  const [y = 2000, m = 1, d = 1] = start.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  for (;;) {
    const text = date.toISOString().slice(0, 10)
    if (text > end) return days
    days.push(text)
    date.setUTCDate(date.getUTCDate() + 1)
  }
}

/** 0 = Sunday … 6 = Saturday. */
function weekday(date: string): number {
  const [y = 2000, m = 1, d = 1] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

// ── 1. Kvadrat Gradnja d.o.o.: the site crew ───────────────────────────────────────────────────

export const SITE = {
  name: 'Bulevar Evrope 24, Novi Sad',
  month: 'October 2026',
  /** The hand-off and the lock (the walk-through reads the month at its end, P5.24). */
  handedOff: '2026-11-02',
  lockedDetail: 'Locked by Milica Petrović on 04.11.2026. at 14:20',
}

export const TIME_CODES: readonly AttendanceCode[] = [
  { code: 'RW', label: 'Regular work', short: 'RW', key: 'r' },
  { code: 'NW', label: 'Night work', short: 'NW', key: 'n' },
  { code: 'OT', label: 'Overtime', short: 'OT', key: 'o' },
  { code: 'WH', label: 'Work on a public holiday', short: 'WH', key: 'w' },
  { code: 'AL', label: 'Annual leave', short: 'AL', key: 'a' },
  { code: 'SL', label: 'Sick leave', short: 'SL', key: 's', tone: 'warning' },
  { code: 'PL', label: 'Paid leave', short: 'PL', key: 'p' },
  { code: 'UL', label: 'Unpaid leave', short: 'UL', key: 'u' },
  { code: 'PH', label: 'Public holiday', short: 'PH', key: 'h' },
  { code: 'BT', label: 'Business trip', short: 'BT', key: 'b' },
  { code: 'AB', label: 'Absence', short: 'AB', key: 'x', tone: 'danger' },
]

export const CREW: readonly AttendanceRow[] = [
  { id: 'w1', label: 'Dragan Marković', description: 'Site foreman' },
  { id: 'w2', label: 'Milan Jovanović', description: 'Mason' },
  { id: 'w3', label: 'Nenad Ilić', description: 'Mason' },
  { id: 'w4', label: 'Zoran Petrović', description: 'Carpenter' },
  { id: 'w5', label: 'Goran Stevanović', description: 'Crane operator' },
  { id: 'w6', label: 'Bojan Đorđević', description: 'Electrician' },
  { id: 'w7', label: 'Vladimir Tomić', description: 'Labourer' },
  { id: 'w8', label: 'Marko Pavlović', description: 'Site guard, nights' },
]

/** The illustrative public holiday of the example: Tuesday 20.10.2026, labelled as such. */
export const HOLIDAY = '2026-10-20'

export const OCTOBER: readonly AttendanceColumn[] = daysBetweenDates(
  '2026-10-01',
  '2026-10-31',
).map((date) => {
  const day = weekday(date)
  return {
    id: date,
    label: String(Number(date.slice(8))),
    date,
    ...(date === HOLIDAY
      ? { kind: 'holiday' as const, note: 'Illustrative public holiday' }
      : day === 0 || day === 6
        ? { kind: 'weekend' as const }
        : {}),
  }
})

const entry = (code: string, hours: string | null): AttendanceEntry => ({ code, hours })

/** Each worker's day, or nothing (the month as the crew worked it, before any correction). */
function crewDay(worker: string, column: AttendanceColumn): AttendanceEntry | null {
  const date = column.date ?? ''
  const day = Number(date.slice(8))
  const thursday = weekday(date) === 4
  if (worker === 'w8') {
    // The guard works nights on weekdays and the first Saturday; the holiday night as well.
    if (column.kind === 'holiday') return entry('WH', '8')
    if (column.kind === 'weekend') return day === 3 ? entry('NW', '8') : null
    return entry('NW', '8')
  }
  if (column.kind === 'holiday') return entry('PH', '8')
  if (column.kind === 'weekend') return null
  if (worker === 'w2' && day >= 12 && day <= 16) return entry('AL', '8')
  if (worker === 'w3' && day >= 7 && day <= 9) return entry('SL', '8')
  if (worker === 'w4' && thursday) return entry('OT', '10')
  if (worker === 'w5' && day >= 21 && day <= 23) return entry('BT', '8')
  if (worker === 'w6' && day === 26) return entry('PL', '8')
  if (worker === 'w6' && day === 27) return entry('UL', null)
  if (worker === 'w7' && day === 28) return entry('AB', null)
  if (worker === 'w7' && day === 29) return entry('RW', '7.5')
  return entry('RW', '8')
}

const NIGHT: AttendanceMark = { label: 'Night work allowance (illustrative)' }
const HOLIDAY_WORK: AttendanceMark = { label: 'Public holiday work allowance (illustrative)' }

function buildMonth() {
  const value: Record<string, Record<string, AttendanceEntry>> = {}
  const marks: Record<string, Record<string, readonly AttendanceMark[]>> = {}
  for (const worker of CREW) {
    const cells: Record<string, AttendanceEntry> = {}
    const workerMarks: Record<string, readonly AttendanceMark[]> = {}
    for (const column of OCTOBER) {
      const day = crewDay(worker.id, column)
      if (day === null) continue
      cells[column.id] = day
      if (day.code === 'NW') workerMarks[column.id] = [NIGHT]
      if (day.code === 'WH') workerMarks[column.id] = [NIGHT, HOLIDAY_WORK]
    }
    value[worker.id] = cells
    marks[worker.id] = workerMarks
  }
  return { value, marks }
}

const MONTH = buildMonth()

/** The month as handed off to payroll. */
export const TIMESHEET_OPEN: AttendanceValue = MONTH.value
export const TIMESHEET_MARKS = MONTH.marks

/** The one correction after payroll: Vladimir Tomić's absence on 28.10. was sick leave. */
export const CORRECTED = { row: 'w7', column: '2026-10-28' }
export const CORRECTION: AttendanceCorrection = {
  original: entry('AB', null),
  by: 'Milica Petrović',
  at: '2026-11-05T09:15:00+01:00',
  reason: 'Sick-leave certificate for 28.10. delivered after the payroll run.',
}
export const TIMESHEET_LOCKED: AttendanceValue = {
  ...TIMESHEET_OPEN,
  [CORRECTED.row]: { ...TIMESHEET_OPEN[CORRECTED.row], [CORRECTED.column]: entry('SL', '8') },
}
export const LOCKED_CORRECTIONS = { [CORRECTED.row]: { [CORRECTED.column]: CORRECTION } }

const WORKED = ['RW', 'NW', 'OT', 'WH', 'BT']
const LEAVE = ['AL', 'SL', 'PL', 'PH']

/** The application's totals of the month: per worker by type, and per day. */
export function crewTotals(value: AttendanceValue): {
  rowTotals: AttendanceTotals
  columnTotals: AttendanceTotals
} {
  const of = (cells: readonly (AttendanceEntry | undefined)[], codes: readonly string[]) =>
    sumHours(
      cells.map((cell) =>
        cell?.code != null && codes.includes(cell.code) ? (cell.hours ?? null) : null,
      ),
    )
  const nightOf = (worker: string) =>
    sumHours(
      OCTOBER.map((column) =>
        (TIMESHEET_MARKS[worker]?.[column.id] ?? []).includes(NIGHT)
          ? (value[worker]?.[column.id]?.hours ?? null)
          : null,
      ),
    )
  // Overtime: the hours of an overtime day over the regular 8 (the application's rule).
  const overtimeOf = (cells: readonly (AttendanceEntry | undefined)[]) => {
    const days = cells.filter((cell) => cell?.code === 'OT' && cell.hours != null)
    return days.length === 0
      ? null
      : hoursText(days.reduce((t, cell) => t + hundredths(cell?.hours ?? '0') - 800, 0))
  }
  return {
    rowTotals: {
      totals: [
        { id: 'worked', label: 'Hours worked', short: 'Work' },
        { id: 'night', label: 'Night hours', short: 'Night' },
        { id: 'overtime', label: 'Overtime hours', short: 'OT' },
        { id: 'leave', label: 'Leave and holiday hours', short: 'Leave' },
        { id: 'total', label: 'Total hours', short: 'Total' },
      ],
      values: Object.fromEntries(
        CREW.map((worker) => {
          const cells = OCTOBER.map((column) => value[worker.id]?.[column.id])
          return [
            worker.id,
            {
              worked: of(cells, WORKED),
              night: nightOf(worker.id),
              overtime: overtimeOf(cells),
              leave: of(cells, LEAVE),
              total: of(cells, [...WORKED, ...LEAVE]),
            },
          ]
        }),
      ),
    },
    columnTotals: {
      totals: [
        { id: 'worked', label: 'Hours worked' },
        { id: 'leave', label: 'Leave and holiday hours' },
      ],
      values: {
        worked: Object.fromEntries(
          OCTOBER.map((column) => [
            column.id,
            of(
              CREW.map((worker) => value[worker.id]?.[column.id]),
              WORKED,
            ),
          ]),
        ),
        leave: Object.fromEntries(
          OCTOBER.map((column) => [
            column.id,
            of(
              CREW.map((worker) => value[worker.id]?.[column.id]),
              LEAVE,
            ),
          ]),
        ),
      },
    },
  }
}

export const TOTALS_OPEN = crewTotals(TIMESHEET_OPEN)
export const TOTALS_LOCKED = crewTotals(TIMESHEET_LOCKED)

/** The crew's hours of the month, all workers (the summary above the grid). */
export function crewSum(totals: AttendanceTotals, id: string): string {
  return sumHours(CREW.map((worker) => totals.values[worker.id]?.[id] ?? null)) ?? hoursText(0)
}

// ── The clock records of Thursday 29.10.2026 ───────────────────────────────────────────────────

export const CLOCK_DAY = '2026-10-29'

export const CLOCK_SOURCES: readonly ClockSource[] = [
  { id: 'gate', label: 'Site terminal' },
  { id: 'phone', label: 'Phone' },
]

const GATE = 'Bulevar Evrope 24, gate terminal'

/** One record: clock-in and clock-out on 29.10. (+01:00, after the clocks went back). */
function clock(
  worker: string,
  from: string,
  to: string,
  duration: string,
  extra: Partial<ClockRecord> = {},
): ClockRecord {
  const row = CREW.find((each) => each.id === worker)
  const outDay = to < from ? '2026-10-30' : CLOCK_DAY
  return {
    id: `c-${worker}`,
    person: row?.label ?? worker,
    ...(row?.description === undefined ? {} : { personDescription: row.description }),
    date: CLOCK_DAY,
    in: `${CLOCK_DAY}T${from}:00+01:00`,
    out: `${outDay}T${to}:00+01:00`,
    duration,
    source: 'gate',
    place: GATE,
    ...extra,
  }
}

export const CLOCK_RECORDS: readonly ClockRecord[] = [
  clock('w1', '06:50', '14:50', '8.00'),
  clock('w2', '07:02', '15:02', '8.00', {
    correction: {
      originalIn: `${CLOCK_DAY}T07:02:00+01:00`,
      originalOut: null,
      by: 'Dragan Marković',
      at: '2026-10-30T07:40:00+01:00',
      reason: 'Forgot to clock out; the foreman confirmed the end of the shift.',
    },
  }),
  clock('w3', '06:58', '14:58', '8.00'),
  clock('w4', '06:55', '16:55', '10.00'),
  clock('w5', '06:45', '14:45', '8.00', {
    source: 'phone',
    place: 'Bulevar Evrope 24, at the crane (phone location)',
  }),
  clock('w6', '07:00', '15:00', '8.00'),
  clock('w7', '07:00', '14:30', '7.50'),
  clock('w8', '21:58', '05:58', '8.00'),
]

// ── 2. Trgovine Bačka d.o.o., Prodavnica 12 Novi Sad ───────────────────────────────────────────

export const STORE = {
  companyId: 'backa',
  company: 'Trgovine Bačka d.o.o.',
  name: 'Prodavnica 12, Novi Sad',
  /** The week being planned (published on 02.10., changed since). */
  start: '2026-10-12',
  end: '2026-10-18',
  /** This week, published: Stefan's shifts and the swap requests. */
  thisStart: '2026-10-05',
  thisEnd: '2026-10-11',
}

export const STORE_TEMPLATES: ShiftTemplate[] = [
  { id: 'early', label: 'Early', short: 'E', start: '07:00', end: '15:00', key: 'E' },
  {
    id: 'late',
    label: 'Late',
    short: 'L',
    start: '15:00',
    end: '23:00',
    key: 'L',
    tone: 'success',
  },
]

interface StorePerson {
  id: string
  name: string
  subtitle: string
  /** Monday to Sunday of this week and of the planned week: E, L or - (off). */
  thisWeek: string
  plannedWeek: string
}

export const STORE_PEOPLE: readonly StorePerson[] = [
  {
    id: 'tamara',
    name: 'Tamara Đukić',
    subtitle: 'Store manager',
    thisWeek: 'EEEEE--',
    plannedWeek: 'EEEEE--',
  },
  {
    id: 'stefan',
    name: 'Stefan Lukić',
    subtitle: 'Cashier',
    thisWeek: 'EELL-L-',
    plannedWeek: 'LLEE--L',
  },
  {
    id: 'jelena',
    name: 'Jelena Rakić',
    subtitle: 'Cashier',
    thisWeek: 'LL-EE-E',
    plannedWeek: 'EELLL--',
  },
  {
    id: 'nemanja',
    name: 'Nemanja Pavlović',
    subtitle: 'Cashier, students’ contract',
    thisWeek: '----LL-',
    plannedWeek: '----LL-',
  },
  {
    id: 'sanja',
    name: 'Sanja Vuković',
    subtitle: 'Cashier',
    thisWeek: '-LEEL-L',
    plannedWeek: '-LL-EEE',
  },
  {
    id: 'teodora',
    name: 'Teodora Kovačević',
    subtitle: 'Shelves and stock',
    thisWeek: 'EEE--EE',
    plannedWeek: 'EEEE-E-',
  },
  {
    id: 'luka',
    name: 'Luka Đorđević',
    subtitle: 'Shelves and stock',
    thisWeek: 'LLLL--L',
    plannedWeek: 'LLLEE--',
  },
  {
    id: 'dejan',
    name: 'Dejan Mitrović',
    subtitle: 'Deli counter',
    thisWeek: 'L-LLLE-',
    plannedWeek: 'L--LLL-',
  },
]

/** Assignments from the people's week strings. */
function weekAssignments(
  people: readonly StorePerson[],
  week: 'thisWeek' | 'plannedWeek',
  start: string,
  end: string,
): ShiftAssignment[] {
  const days = daysBetweenDates(start, end)
  return people.flatMap((person) =>
    days.flatMap((date, index) => {
      const mark = person[week][index]
      if (mark !== 'E' && mark !== 'L') return []
      return [
        {
          id: `${week === 'thisWeek' ? 't' : 'p'}-${person.id}-${date}`,
          rowId: person.id,
          date,
          templateId: mark === 'E' ? 'early' : 'late',
        },
      ]
    }),
  )
}

/** The planned week's changes since publishing (from the application). */
export const STORE_CHANGED = ['p-stefan-2026-10-14', 'p-dejan-2026-10-16']

export const STORE_ASSIGNMENTS: ShiftAssignment[] = weekAssignments(
  STORE_PEOPLE,
  'plannedWeek',
  STORE.start,
  STORE.end,
).map((each) => (STORE_CHANGED.includes(each.id) ? { ...each, changed: true } : each))

export const STORE_THIS_WEEK: ShiftAssignment[] = weekAssignments(
  STORE_PEOPLE,
  'thisWeek',
  STORE.thisStart,
  STORE.thisEnd,
)

/** What the published version had where the planned week changed. */
export const STORE_WAS: Readonly<Record<string, string>> = {
  'p-stefan-2026-10-14': 'late',
  'p-dejan-2026-10-16': 'early',
}

/** Planned hours: 8 per shift (the application's figure). */
export function plannedHours(assignments: readonly ShiftAssignment[], rowId: string): string {
  return hoursText(assignments.filter((each) => each.rowId === rowId).length * 800)
}

export const STORE_ROWS: ShiftPlannerRow[] = STORE_PEOPLE.map((person) => ({
  id: person.id,
  name: person.name,
  subtitle: person.subtitle,
  hours: plannedHours(STORE_ASSIGNMENTS, person.id),
}))

export const STORE_GROUPINGS: ShiftGrouping[] = [
  {
    id: 'team',
    label: 'By team',
    groups: [
      { id: 'tills', label: 'Tills', rows: ['tamara', 'stefan', 'jelena', 'nemanja', 'sanja'] },
      { id: 'stock', label: 'Shelves, stock and deli', rows: ['teodora', 'luka', 'dejan'] },
    ],
  },
]

/** The conflicts the application found (illustrative rules). */
export const STORE_CONFLICTS: ShiftConflicts = {
  luka: {
    '2026-10-15': [
      {
        tone: 'warning',
        text: 'Less than the illustrative 12 hours of rest after the late shift (8 h)',
      },
    ],
  },
  sanja: {
    '2026-10-18': [{ tone: 'danger', text: 'Approved annual leave on 18.10.2026' }],
  },
}

/** How many of each shift a day needs (the store's data): weekdays 3 + 3, Saturday 2 + 2, Sunday 1 + 1. */
function storeNeed(date: string): { early: number; late: number } {
  const day = weekday(date)
  return day === 0
    ? { early: 1, late: 1 }
    : day === 6
      ? { early: 2, late: 2 }
      : { early: 3, late: 3 }
}

/** The coverage of a day, with the words of a shortage. */
export function coverageOf(
  assignments: readonly ShiftAssignment[],
  date: string,
  need: Readonly<Record<string, number>>,
  names: Readonly<Record<string, string>>,
): ShiftCoverage {
  const day = assignments.filter((each) => each.date === date)
  const needed = Object.values(need).reduce((t, n) => t + n, 0)
  const short = Object.entries(need)
    .map(([template, count]) => ({
      template,
      missing: count - day.filter((each) => each.templateId === template).length,
    }))
    .filter((each) => each.missing > 0)
  const missing = short.reduce((t, each) => t + each.missing, 0)
  return {
    planned: String(day.length),
    needed: String(needed),
    ...(missing === 0
      ? {}
      : {
          tone: missing === 1 ? ('warning' as const) : ('danger' as const),
          note: short
            .map(
              (each) =>
                `${each.missing === 1 ? 'One' : String(each.missing)} short in the ${names[each.template] ?? each.template} shift`,
            )
            .join('; '),
        }),
  }
}

/** The application's coverage of the planned week, worked out from its assignments. */
export function storeCoverage(
  assignments: readonly ShiftAssignment[],
): Record<string, ShiftCoverage> {
  return Object.fromEntries(
    daysBetweenDates(STORE.start, STORE.end).map((date) => [
      date,
      coverageOf(assignments, date, storeNeed(date), { early: 'early', late: 'late' }),
    ]),
  )
}

export const STORE_COVERAGE = storeCoverage(STORE_ASSIGNMENTS)

export const STORE_PUBLISH = {
  shifts: STORE_ASSIGNMENTS.length,
  people: new Set(STORE_ASSIGNMENTS.map((each) => each.rowId)).size,
  conflicts: Object.values(STORE_CONFLICTS).reduce(
    (t, days) => t + Object.values(days).reduce((n, list) => n + list.length, 0),
    0,
  ),
}

/** A shift of the store as a person sees it. */
function storeShift(assignment: ShiftAssignment): MyShift {
  const template = STORE_TEMPLATES.find((each) => each.id === assignment.templateId)
  return {
    id: assignment.id,
    date: assignment.date,
    label: template?.label ?? '',
    start: template?.start ?? '',
    end: template?.end ?? '',
    place: STORE.name,
  }
}

/** A published shift of one person (this week or the planned week as published). */
function publishedShift(rowId: string, date: string): ShiftAssignment | undefined {
  const mine = [...STORE_THIS_WEEK, ...STORE_ASSIGNMENTS].find(
    (each) => each.rowId === rowId && each.date === date,
  )
  if (mine === undefined) return undefined
  const was = STORE_WAS[mine.id]
  return was === undefined ? mine : { ...mine, templateId: was }
}

export const STEFAN = { id: 'stefan', name: 'Stefan Lukić', email: 'stefan.lukic@trgovinebacka.rs' }

/** Stefan's upcoming shifts as published (from today, 06.10.): the swap request on Saturday. */
export const STEFAN_SHIFTS: MyShift[] = [...STORE_THIS_WEEK, ...STORE_ASSIGNMENTS]
  .filter((each) => each.rowId === STEFAN.id && each.date >= '2026-10-06')
  .map((each) => publishedShift(each.rowId, each.date) ?? each)
  .map((each) => {
    const shift = storeShift(each)
    if (each.date === '2026-10-10') {
      return { ...shift, swapState: 'Swap requested with Jelena Rakić · waiting for approval' }
    }
    if (each.date === '2026-10-08') return { ...shift, changed: 'Was Early, 07:00–15:00' }
    return shift
  })

/** The shift whose swap dialog the static story opens: Thursday 15.10., Early. */
export const STEFAN_SWAP_SHIFT = 'p-stefan-2026-10-15'

/** Who may take one of Stefan's shifts: the tills, with their shifts that week. */
export function storeColleagues(shift: { date: string }): SwapColleague[] {
  const weekStart = shift.date < STORE.start ? STORE.thisStart : STORE.start
  const weekEnd = shift.date < STORE.start ? STORE.thisEnd : STORE.end
  return ['jelena', 'sanja', 'nemanja'].map((id) => {
    const person = STORE_PEOPLE.find((each) => each.id === id)
    const shifts = daysBetweenDates(weekStart, weekEnd)
      .map((date) => publishedShift(id, date))
      .filter((each): each is ShiftAssignment => each !== undefined)
      .map(storeShift)
    return {
      id,
      name: person?.name ?? id,
      note: person?.subtitle ?? '',
      ...(shifts.length === 0 ? {} : { shifts }),
    }
  })
}

/** A swap request waiting for the manager (the application's record). */
export interface SwapRequest {
  id: string
  from: string
  shift: MyShift
  /** Who takes it; null: anyone qualified. */
  to: string | null
  /** The shift given back, if any. */
  back: MyShift | null
  reason: string
  requested: string
  /** The application's check of the swap. */
  check: { tone: 'success' | 'info' | 'warning'; text: string }
}

function shiftOf(rowId: string, date: string): MyShift {
  const assignment = publishedShift(rowId, date)
  if (assignment === undefined) throw new Error(`Example dataset: no shift of ${rowId} on ${date}`)
  return storeShift(assignment)
}

export const SWAP_REQUESTS: readonly SwapRequest[] = [
  {
    id: 'r1',
    from: 'Stefan Lukić',
    shift: shiftOf('stefan', '2026-10-10'),
    to: 'Jelena Rakić',
    back: shiftOf('jelena', '2026-10-11'),
    reason: 'My sister’s wedding on Saturday.',
    requested: '2026-10-05T18:12:00+02:00',
    check: { tone: 'success', text: 'No conflicts for either of them.' },
  },
  {
    id: 'r2',
    from: 'Nemanja Pavlović',
    shift: shiftOf('nemanja', '2026-10-09'),
    to: null,
    back: null,
    reason: 'Exam at the faculty on Friday at 16:00.',
    requested: '2026-10-05T21:40:00+02:00',
    check: {
      tone: 'info',
      text: 'Stefan Lukić is free on Friday and can take it without conflicts.',
    },
  },
  {
    id: 'r3',
    from: 'Sanja Vuković',
    shift: shiftOf('sanja', '2026-10-08'),
    to: 'Nemanja Pavlović',
    back: null,
    reason: 'Doctor’s appointment on Thursday morning.',
    requested: '2026-10-06T07:55:00+02:00',
    check: {
      tone: 'warning',
      text: 'Nemanja Pavlović would work 24 h this week, above the illustrative 16 h of a students’ contract.',
    },
  },
]

export const SWAP_REJECT_REASONS = [
  { value: 'cover', label: 'Nobody qualified can take the shift' },
  { value: 'limit', label: 'The colleague would go over the hours of their contract' },
  { value: 'late', label: 'Asked too late for this week' },
]

// ── 3. Dom zdravlja Novi Sad, emergency department ─────────────────────────────────────────────

export const ER = {
  companyId: 'dzns',
  company: 'Dom zdravlja Novi Sad',
  department: 'Emergency department',
  start: '2026-10-05',
  end: '2026-10-11',
}

export const ER_TEMPLATES: ShiftTemplate[] = [
  { id: 'morning', label: 'Morning', short: 'M', start: '06:00', end: '14:00', key: 'M' },
  {
    id: 'afternoon',
    label: 'Afternoon',
    short: 'A',
    start: '14:00',
    end: '22:00',
    key: 'A',
    tone: 'success',
  },
  {
    id: 'night',
    label: 'Night',
    short: 'N',
    start: '22:00',
    end: '06:00',
    key: 'N',
    tone: 'premium',
  },
]

export const ER_PEOPLE: readonly { id: string; name: string; subtitle: string }[] = [
  { id: 'popovic', name: 'Jelena Popović', subtitle: 'Doctor' },
  { id: 'simic', name: 'Dušan Simić', subtitle: 'Doctor' },
  { id: 'lukic', name: 'Vladimir Lukić', subtitle: 'Doctor' },
  { id: 'radic', name: 'Ana Radić', subtitle: 'Doctor' },
  { id: 'petrovic', name: 'Ana Petrović', subtitle: 'Nurse' },
  { id: 'ilic', name: 'Nikola Ilić', subtitle: 'Nurse' },
  { id: 'jovanovic', name: 'Marko Jovanović', subtitle: 'Nurse' },
  { id: 'lazic', name: 'Ivana Lazić', subtitle: 'Nurse' },
  { id: 'radovic', name: 'Katarina Radović', subtitle: 'Nurse' },
  { id: 'todorovic', name: 'Miloš Todorović', subtitle: 'Medical technician' },
  { id: 'kovac', name: 'Sonja Kovač', subtitle: 'Nurse' },
  { id: 'vasic', name: 'Petar Vasić', subtitle: 'Medical technician' },
]

export const ER_TEAMS = {
  doctors: ['popovic', 'simic', 'lukic', 'radic'],
  nursesA: ['petrovic', 'ilic', 'jovanovic', 'lazic'],
  nursesB: ['radovic', 'todorovic', 'kovac', 'vasic'],
}

/** The department's rotation: two mornings, two afternoons, two nights, two days off. */
export const ER_ROTATIONS: RotationPattern[] = [
  {
    id: 'mmaann',
    label: 'Rotating 8 days: 2 morning, 2 afternoon, 2 night, 2 off (illustrative)',
    steps: ['morning', 'morning', 'afternoon', 'afternoon', 'night', 'night', null, null],
  },
  {
    id: 'mornings',
    label: 'Mornings, weekdays',
    steps: ['morning', 'morning', 'morning', 'morning', 'morning', null, null],
  },
]

const ROTATION = ER_ROTATIONS[0] ?? { steps: [] }

/** The rotation applied to a team of four, two days apart; `lead` days ahead of the week. */
function rotated(team: readonly string[], lead: number) {
  const before = daysBetweenDates('2026-09-01', ER.start)
  const from = before[before.length - 1 - lead] ?? ER.start
  return rotationAssignments(ROTATION, team, from, ER.end, 2).filter(
    (each) => each.date >= ER.start,
  )
}

/** The week as the rotation made it; nurses' team B one day further on in the cycle. */
const ER_ROTATED = [
  ...rotated(ER_TEAMS.doctors, 0),
  ...rotated(ER_TEAMS.nursesA, 0),
  ...rotated(ER_TEAMS.nursesB, 1),
].map((each) => ({ ...each, id: `er-${each.rowId}-${each.date}` }))

/** Sonja Kovač's shifts on 08.–09.10. taken off: sick leave from HR. */
const SICK = { rowId: 'kovac', dates: ['2026-10-08', '2026-10-09'] }

/** The changes after the rotation (from the application): who covers, and where it clashes. */
const ER_ADDED: ShiftAssignment[] = [
  // Nikola Ilić covers an afternoon on Friday after his night shift: rest too short.
  {
    id: 'er-ilic-extra',
    rowId: 'ilic',
    date: '2026-10-09',
    templateId: 'afternoon',
    changed: true,
  },
  // Jelena Popović takes a Sunday morning straight after her night shift.
  {
    id: 'er-popovic-extra',
    rowId: 'popovic',
    date: '2026-10-11',
    templateId: 'morning',
    changed: true,
  },
]

export const ER_ASSIGNMENTS: ShiftAssignment[] = [
  ...ER_ROTATED.filter((each) => !(each.rowId === SICK.rowId && SICK.dates.includes(each.date))),
  ...ER_ADDED,
]

export const ER_CONFLICTS: ShiftConflicts = {
  ilic: {
    '2026-10-09': [
      {
        tone: 'warning',
        text: 'Less than the illustrative 11 hours of rest after the night shift (8 h)',
      },
    ],
  },
  popovic: {
    '2026-10-11': [
      { tone: 'danger', text: 'No rest: the morning shift starts when the night shift ends' },
      { tone: 'warning', text: '56 h this week, above the illustrative weekly limit of 48 h' },
    ],
  },
}

export const ER_ROWS: ShiftPlannerRow[] = ER_PEOPLE.map((person) => ({
  id: person.id,
  name: person.name,
  subtitle: person.subtitle,
  hours: plannedHours(ER_ASSIGNMENTS, person.id),
}))

/** Per team, the people and the planned hours (the application's note after the heading). */
function teamNote(rows: readonly string[]): string {
  const total = ER_ASSIGNMENTS.filter((each) => rows.includes(each.rowId)).length * 800
  return `${String(rows.length)} people · ${hoursText(total)} h`
}

export const ER_GROUPINGS: ShiftGrouping[] = [
  {
    id: 'team',
    label: 'By team',
    groups: [
      {
        id: 'doctors',
        label: 'Doctors',
        rows: ER_TEAMS.doctors,
        note: teamNote(ER_TEAMS.doctors),
      },
      {
        id: 'nursesA',
        label: 'Nurses and technicians, team A',
        rows: ER_TEAMS.nursesA,
        note: teamNote(ER_TEAMS.nursesA),
      },
      {
        id: 'nursesB',
        label: 'Nurses and technicians, team B',
        rows: ER_TEAMS.nursesB,
        note: teamNote(ER_TEAMS.nursesB),
      },
    ],
  },
]

/**
 * The application's coverage: one doctor and two nurses or technicians on every shift, every day
 * (the department's data), worked out from the assignments.
 */
export function erCoverage(assignments: readonly ShiftAssignment[]): Record<string, ShiftCoverage> {
  const nursing = [...ER_TEAMS.nursesA, ...ER_TEAMS.nursesB]
  return Object.fromEntries(
    daysBetweenDates(ER.start, ER.end).map((date): [string, ShiftCoverage] => {
      const nurses = coverageOf(
        assignments.filter((each) => nursing.includes(each.rowId)),
        date,
        { morning: 2, afternoon: 2, night: 2 },
        { morning: 'morning', afternoon: 'afternoon', night: 'night' },
      )
      const doctors = coverageOf(
        assignments.filter((each) => ER_TEAMS.doctors.includes(each.rowId)),
        date,
        { morning: 1, afternoon: 1, night: 1 },
        { morning: 'morning', afternoon: 'afternoon', night: 'night' },
      )
      const notes = [
        ...(doctors.note === undefined ? [] : [`Doctors: ${doctors.note}`]),
        ...(nurses.note === undefined ? [] : [`Nurses: ${nurses.note}`]),
      ]
      const tone =
        doctors.tone === 'danger' || nurses.tone === 'danger'
          ? 'danger'
          : (doctors.tone ?? nurses.tone)
      return [
        date,
        {
          planned: String(Number(nurses.planned) + Number(doctors.planned)),
          needed: String(Number(nurses.needed ?? '0') + Number(doctors.needed ?? '0')),
          ...(tone === undefined ? {} : { tone }),
          ...(notes.length === 0 ? {} : { note: notes.join('; ') }),
        },
      ]
    }),
  )
}

export const ER_COVERAGE = erCoverage(ER_ASSIGNMENTS)

export const ER_PUBLISH = {
  shifts: ER_ASSIGNMENTS.length,
  people: new Set(ER_ASSIGNMENTS.map((each) => each.rowId)).size,
  conflicts: Object.values(ER_CONFLICTS).reduce(
    (t, days) => t + Object.values(days).reduce((n, list) => n + list.length, 0),
    0,
  ),
}

// ── The redistribution period: 10.08.–04.10.2026, eight weeks ──────────────────────────────────

const PLAN_WEEKS = ['48', '48', '40', '40', '32', '32', '40', '40']

export const ER_PLAN: WorkingTimePlan = {
  start: '2026-08-10',
  end: '2026-10-04',
  weeks: PLAN_WEEKS.map((hours, index) => {
    const days = daysBetweenDates('2026-08-10', '2026-10-04')
    return {
      start: days[index * 7] ?? '',
      end: days[index * 7 + 6] ?? '',
      hours,
    }
  }),
  reference: { label: 'Reference average per week (illustrative)', hours: '40' },
}

const PLANNED = hoursText(PLAN_WEEKS.reduce((t, h) => t + hundredths(h), 0))

/** Worked hours of the period, and the application's warnings (illustrative limits). */
const WORKED_HOURS: readonly {
  id: string
  worked: string | null
  warnings?: WorkingTimeRow['warnings']
}[] = [
  {
    id: 'popovic',
    worked: '392',
    warnings: [
      { tone: 'danger', text: 'Average above the illustrative limit of 48 h a week' },
      {
        tone: 'warning',
        text: 'Week of 24.08.: 60 h, above the illustrative weekly limit of 56 h',
      },
    ],
  },
  { id: 'simic', worked: '320' },
  { id: 'lukic', worked: '328' },
  {
    id: 'radic',
    worked: '296',
    warnings: [{ tone: 'warning', text: '24 h fewer than planned: to make up by 31.12.2026.' }],
  },
  { id: 'petrovic', worked: '320' },
  {
    id: 'ilic',
    worked: '356',
    warnings: [{ tone: 'warning', text: '36 h more than planned (illustrative limit: 32 h)' }],
  },
  { id: 'jovanovic', worked: '316' },
  { id: 'lazic', worked: '324' },
  { id: 'radovic', worked: '320' },
  { id: 'todorovic', worked: null },
  { id: 'kovac', worked: '304' },
  { id: 'vasic', worked: '332' },
]

export const ER_BALANCE: WorkingTimeRow[] = WORKED_HOURS.map((each) => {
  const person = ER_PEOPLE.find((one) => one.id === each.id)
  // Miloš Todorović started on 05.10.2026: no plan and no hours in this period.
  const planned = each.worked === null ? null : PLANNED
  const difference =
    each.worked === null || planned === null
      ? null
      : hoursText(hundredths(each.worked) - hundredths(planned))
  // The running average per week, exact (eight weeks: at most three decimals).
  const average =
    each.worked === null
      ? null
      : (() => {
          const thousandths = (hundredths(each.worked) * 10) / PLAN_WEEKS.length
          const whole = Math.floor(thousandths / 1000)
          const rest = String(thousandths % 1000)
            .padStart(3, '0')
            .replace(/0+$/, '')
          return rest === '' ? String(whole) : `${String(whole)}.${rest}`
        })()
  return {
    id: each.id,
    name: person?.name ?? each.id,
    subtitle:
      each.worked === null
        ? `${person?.subtitle ?? ''}, since 05.10.2026`
        : (person?.subtitle ?? ''),
    planned,
    worked: each.worked,
    difference,
    average,
    ...(each.warnings === undefined ? {} : { warnings: each.warnings }),
  }
})

export const ER_PLANNED_TOTAL = PLANNED
