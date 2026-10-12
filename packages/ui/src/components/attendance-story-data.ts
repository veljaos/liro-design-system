/*
 * Fictitious data for the AttendanceGrid and ClockRecordList stories (P5.13, P5.24): a class of
 * OŠ "Jovan Popović" and the site workers of Kvadrat Gradnja d.o.o. Not part of the package:
 * nothing in src/index.ts imports this file. No classes here: Storybook compiles classes only from
 * *.stories.tsx files.
 *
 * The codes, totals and rules are the application's data. Every total below is what an
 * application would send, worked out here in whole tenths of an hour (never JavaScript decimals,
 * D4). Legal limits are not encoded; allowance names are illustrative.
 */
import type {
  AttendanceCode,
  AttendanceColumn,
  AttendanceCorrection,
  AttendanceMark,
  AttendanceRow,
  AttendanceTotals,
} from './attendance-grid'
import { weekdayOf, type AttendanceEntry, type AttendanceValue } from './attendance-logic'
import type { ClockRecord, ClockSource } from './clock-record-list'

// ── School: OŠ "Jovan Popović", class 6-2 ──────────────────────────────────────────────────

export const SCHOOL_CODES: readonly AttendanceCode[] = [
  { code: 'present', label: 'Present', short: 'P', key: 'p' },
  { code: 'absent', label: 'Absent', short: 'A', key: 'a', tone: 'danger' },
  { code: 'late', label: 'Late', short: 'L', key: 'l', tone: 'warning' },
  { code: 'excused', label: 'Excused', short: 'E', key: 'e', tone: 'neutral' },
]

export const PUPILS: readonly AttendanceRow[] = [
  'Aleksa Babić',
  'Ana Đurić',
  'Petar Ilić',
  'Jovana Jovanović',
  'Luka Kostić',
  'Mila Lazarević',
  'Nikola Marković',
  'Sara Milošević',
  'Stefan Nikolić',
  'Tamara Pavlović',
  'Uroš Popović',
  'Vasilije Ristić',
  'Teodora Savić',
  'Dunja Stojanović',
].map((label, index) => ({ id: `p${String(index + 1)}`, label }))

/** Monday's six lessons, 05.10.2026.; the subject in each header's note. */
export const LESSONS: readonly AttendanceColumn[] = [
  ['1 Ser', 'Lesson 1: Serbian language'],
  ['2 Mat', 'Lesson 2: Mathematics'],
  ['3 Eng', 'Lesson 3: English'],
  ['4 His', 'Lesson 4: History'],
  ['5 PE', 'Lesson 5: Physical education'],
  ['6 Bio', 'Lesson 6: Biology'],
].map(([label = '', note = ''], index) => ({ id: `l${String(index + 1)}`, label, note }))

/** Lessons 1–3 are marked, 4–6 not yet. */
export const SCHOOL_VALUE: AttendanceValue = Object.fromEntries(
  PUPILS.map((pupil, index) => {
    const cells: Record<string, AttendanceEntry> = {}
    for (const lesson of ['l1', 'l2', 'l3']) cells[lesson] = { code: 'present' }
    if (index === 3) for (const lesson of ['l1', 'l2', 'l3']) cells[lesson] = { code: 'excused' }
    if (index === 6) cells.l1 = { code: 'late' }
    if (index === 10) {
      cells.l2 = { code: 'absent' }
      cells.l3 = { code: 'absent' }
    }
    return [pupil.id, cells]
  }),
)

/** The application's counts: per lesson (present, absent) and per pupil (lessons missed). */
export function schoolTotals(value: AttendanceValue): {
  rowTotals: AttendanceTotals
  columnTotals: AttendanceTotals
} {
  const count = (codes: readonly string[], cells: readonly (AttendanceEntry | undefined)[]) => {
    const marked = cells.filter((cell) => cell?.code != null)
    return marked.length === 0
      ? null
      : String(marked.filter((cell) => codes.includes(cell?.code ?? '')).length)
  }
  return {
    rowTotals: {
      totals: [{ id: 'missed', label: 'Lessons missed', short: 'Miss' }],
      values: Object.fromEntries(
        PUPILS.map((pupil) => [
          pupil.id,
          {
            missed: count(
              ['absent', 'excused'],
              LESSONS.map((lesson) => value[pupil.id]?.[lesson.id]),
            ),
          },
        ]),
      ),
    },
    columnTotals: {
      totals: [
        { id: 'present', label: 'Present' },
        { id: 'absent', label: 'Absent' },
      ],
      values: {
        present: Object.fromEntries(
          LESSONS.map((lesson) => [
            lesson.id,
            count(
              ['present', 'late'],
              PUPILS.map((pupil) => value[pupil.id]?.[lesson.id]),
            ),
          ]),
        ),
        absent: Object.fromEntries(
          LESSONS.map((lesson) => [
            lesson.id,
            count(
              ['absent', 'excused'],
              PUPILS.map((pupil) => value[pupil.id]?.[lesson.id]),
            ),
          ]),
        ),
      },
    },
  }
}

// ── Gradebook: Mathematics, class 6-2 ──────────────────────────────────────────────────────

export const MARK_CODES: readonly AttendanceCode[] = [
  { code: '1', label: 'Insufficient (1)', short: '1', key: '1', tone: 'danger' },
  { code: '2', label: 'Sufficient (2)', short: '2', key: '2' },
  { code: '3', label: 'Good (3)', short: '3', key: '3' },
  { code: '4', label: 'Very good (4)', short: '4', key: '4' },
  { code: '5', label: 'Excellent (5)', short: '5', key: '5' },
]

export const ASSESSMENTS: readonly AttendanceColumn[] = [
  { id: 't1', label: 'T1', date: '2026-09-15', note: 'Written test 1: fractions' },
  { id: 'o1', label: 'O1', date: '2026-09-22', note: 'Oral answer' },
  { id: 'h1', label: 'H1', date: '2026-09-29', note: 'Homework: geometry' },
  { id: 't2', label: 'T2', date: '2026-10-02', note: 'Written test 2: decimals' },
  { id: 'o2', label: 'O2', date: '2026-10-05', note: 'Oral answer' },
]

const GRADES: readonly (readonly string[])[] = [
  ['5', '4', '3', '4'],
  ['4', '5', '4', '5'],
  ['3', '3', '2', '3'],
  ['5', '5', '5', '5'],
  ['2', '3', '1', '2'],
  ['4', '4', '4', '3'],
  ['3', '4', '3', '4'],
  ['5', '5', '4', '5'],
  ['4', '3', '3', '5'],
  ['5', '4', '5', '4'],
  ['2', '2', '2', '2'],
  ['3', '4', '4', '3'],
  ['4', '5', '5', '4'],
  ['5', '4', '5', '5'],
]

export const GRADEBOOK_VALUE: AttendanceValue = Object.fromEntries(
  PUPILS.map((pupil, index) => [
    pupil.id,
    Object.fromEntries(
      (GRADES[index] ?? []).map((grade, column) => [
        ASSESSMENTS[column]?.id ?? '',
        { code: grade },
      ]),
    ),
  ]),
)

/** The application's averages, sent as decimal strings. */
export const GRADEBOOK_TOTALS: AttendanceTotals = {
  totals: [{ id: 'average', label: 'Average', short: 'Avg', decimals: 2 }],
  values: Object.fromEntries(
    PUPILS.map((pupil, index) => {
      const grades = GRADES[index] ?? []
      const sum = grades.reduce((total, grade) => total + Number(grade), 0)
      // Hundredths in whole numbers: sum × 100 / count, rounded half up by the application.
      const hundredths = Math.floor((sum * 100 * 2 + grades.length) / (2 * grades.length))
      const text = `${String(Math.floor(hundredths / 100))}.${String(hundredths % 100).padStart(2, '0')}`
      return [pupil.id, { average: text }]
    }),
  ),
}

// ── Kvadrat Gradnja d.o.o.: site workers ───────────────────────────────────────────────────

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

export const WORKERS: readonly AttendanceRow[] = [
  { id: 'w1', label: 'Dragan Marković', description: 'Site foreman' },
  { id: 'w2', label: 'Milan Jovanović', description: 'Mason' },
  { id: 'w3', label: 'Nenad Ilić', description: 'Mason' },
  { id: 'w4', label: 'Zoran Petrović', description: 'Carpenter' },
  { id: 'w5', label: 'Stefan Nikolić', description: 'Crane operator' },
  { id: 'w6', label: 'Bojan Đorđević', description: 'Electrician' },
  { id: 'w7', label: 'Ivan Stojanović', description: 'Labourer' },
  { id: 'w8', label: 'Marko Pavlović', description: 'Site guard, nights' },
]

/** An illustrative public holiday: the stories mark Tue 20 October 2026 as one. */
export const OCTOBER_HOLIDAY = '2026-10-20'

/** The days of a month as columns: weekends and the given holidays named. */
export function monthColumns(
  year: number,
  month: number,
  holidays: Readonly<Record<string, string>> = {},
): AttendanceColumn[] {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return Array.from({ length: days }, (_, index) => {
    const date = `${String(year)}-${String(month).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`
    const weekday = weekdayOf(date)
    const holiday = holidays[date]
    return {
      id: date,
      label: String(index + 1),
      date,
      ...(holiday !== undefined
        ? { kind: 'holiday' as const, note: holiday }
        : weekday === 0 || weekday === 6
          ? { kind: 'weekend' as const }
          : {}),
    }
  })
}

export const OCTOBER = monthColumns(2026, 10, {
  [OCTOBER_HOLIDAY]: 'Illustrative public holiday',
})
export const SEPTEMBER = monthColumns(2026, 9)

const NIGHT_ALLOWANCE: AttendanceMark = { label: 'Night work allowance (illustrative)' }
const HOLIDAY_ALLOWANCE: AttendanceMark = { label: 'Public holiday work allowance (illustrative)' }

const entry = (code: string, hours: string | null): AttendanceEntry => ({ code, hours })

/** Each worker's entry on a day, or nothing. `open` leaves Nenad's last week to be entered. */
function workerDay(
  worker: string,
  column: AttendanceColumn,
  open: boolean,
): AttendanceEntry | null {
  const date = column.date ?? ''
  const day = Number(date.slice(8, 10))
  const october = date.startsWith('2026-10')
  if (column.kind === 'holiday') return worker === 'w8' ? entry('WH', '8') : entry('PH', '8')
  if (worker === 'w8') {
    // Nights on weekdays and on the first Saturday of the month.
    if (column.kind === 'weekend')
      return day <= 7 && weekdayOf(date) === 6 ? entry('NW', '8') : null
    return entry('NW', '8')
  }
  if (column.kind === 'weekend') return null
  if (!october)
    return worker === 'w2' && day >= 21 && day <= 25 ? entry('AL', '8') : entry('RW', '8')
  if (worker === 'w2' && day >= 12 && day <= 16) return entry('AL', '8')
  if (worker === 'w3' && day >= 7 && day <= 9) return entry('SL', '8')
  if (worker === 'w3' && open && day >= 26) return null
  if (worker === 'w4' && weekdayOf(date) === 4) return entry('OT', '10')
  if (worker === 'w5' && day >= 21 && day <= 23) return entry('BT', '8')
  if (worker === 'w6' && day === 26) return entry('PL', '8')
  if (worker === 'w6' && day === 27) return entry('UL', null)
  if (worker === 'w7' && day === 28) return entry('AB', null)
  if (worker === 'w7' && day === 29) return entry('RW', '7.5')
  return entry('RW', '8')
}

/** A month's timesheet: the entries and the marks (night and holiday allowances). */
export function timesheet(
  columns: readonly AttendanceColumn[],
  open = false,
): {
  value: AttendanceValue
  marks: Record<string, Record<string, readonly AttendanceMark[]>>
} {
  const value: Record<string, Record<string, AttendanceEntry>> = {}
  const marks: Record<string, Record<string, readonly AttendanceMark[]>> = {}
  for (const worker of WORKERS) {
    const cells: Record<string, AttendanceEntry> = {}
    const workerMarks: Record<string, readonly AttendanceMark[]> = {}
    for (const column of columns) {
      const day = workerDay(worker.id, column, open)
      if (day === null) continue
      cells[column.id] = day
      if (day.code === 'NW') workerMarks[column.id] = [NIGHT_ALLOWANCE]
      if (day.code === 'WH') workerMarks[column.id] = [HOLIDAY_ALLOWANCE]
    }
    value[worker.id] = cells
    marks[worker.id] = workerMarks
  }
  return { value, marks }
}

/** Hours as whole tenths, and back: "7.5" ↔ 75. */
function tenths(hours: string): number {
  const [whole = '0', fraction = ''] = hours.split('.')
  return Number(whole) * 10 + Number((fraction + '0').slice(0, 1))
}
function hoursText(value: number): string {
  return value % 10 === 0
    ? String(value / 10)
    : `${String(Math.floor(value / 10))}.${String(value % 10)}`
}

const WORKED = ['RW', 'NW', 'OT', 'WH', 'BT']
const LEAVE = ['AL', 'SL', 'PL', 'PH']

/** The application's totals of a timesheet: per worker by type, and per day. */
export function timesheetTotals(
  value: AttendanceValue,
  columns: readonly AttendanceColumn[],
): { rowTotals: AttendanceTotals; columnTotals: AttendanceTotals } {
  const sum = (
    cells: readonly (AttendanceEntry | undefined)[],
    codes: readonly string[] | null,
  ) => {
    const counted = cells.filter(
      (cell) =>
        cell?.hours != null &&
        (codes === null || (cell.code !== null && codes.includes(cell.code))),
    )
    return counted.length === 0
      ? null
      : hoursText(counted.reduce((total, cell) => total + tenths(cell?.hours ?? '0'), 0))
  }
  const overtime = (cells: readonly (AttendanceEntry | undefined)[]) => {
    const days = cells.filter((cell) => cell?.code === 'OT' && cell.hours != null)
    return days.length === 0
      ? null
      : hoursText(days.reduce((total, cell) => total + tenths(cell?.hours ?? '0') - 80, 0))
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
        WORKERS.map((worker) => {
          const cells = columns.map((column) => value[worker.id]?.[column.id])
          return [
            worker.id,
            {
              worked: sum(cells, WORKED),
              night: sum(cells, ['NW']),
              overtime: overtime(cells),
              leave: sum(cells, LEAVE),
              total: sum(cells, [...WORKED, ...LEAVE]),
            },
          ]
        }),
      ),
    },
    columnTotals: {
      totals: [{ id: 'hours', label: 'Hours' }],
      values: {
        hours: Object.fromEntries(
          columns.map((column) => [
            column.id,
            sum(
              WORKERS.map((worker) => value[worker.id]?.[column.id]),
              null,
            ),
          ]),
        ),
      },
    },
  }
}

/** September 2026, locked after payroll; one sick day entered afterwards as a correction. */
export const SEPTEMBER_SHEET = (() => {
  const sheet = timesheet(SEPTEMBER)
  const value = {
    ...sheet.value,
    w3: { ...sheet.value.w3, '2026-09-16': entry('SL', '8') },
  }
  const corrections: Record<string, Record<string, AttendanceCorrection>> = {
    w3: {
      '2026-09-16': {
        original: entry('RW', '8'),
        by: 'Milica Petrović',
        at: '2026-10-05T09:15:00+02:00',
        reason: 'Sick-leave certificate delivered after the payroll run.',
      },
    },
  }
  return { value, marks: sheet.marks, corrections }
})()

// ── Clock records ──────────────────────────────────────────────────────────────────────────

export const CLOCK_SOURCES: readonly ClockSource[] = [
  { id: 'gate', label: 'Gate terminal' },
  { id: 'phone', label: 'Phone' },
]

export const CLOCK_RECORDS: readonly ClockRecord[] = [
  {
    id: 'c1',
    person: 'Dragan Marković',
    personDescription: 'Site foreman',
    date: '2026-10-05',
    in: '2026-10-05T06:52:00+02:00',
    out: '2026-10-05T15:04:00+02:00',
    duration: '8.20',
    source: 'gate',
    place: 'Novi Sad, Bulevar Evrope site',
  },
  {
    id: 'c2',
    person: 'Milan Jovanović',
    personDescription: 'Mason',
    date: '2026-10-05',
    in: '2026-10-05T06:58:00+02:00',
    out: '2026-10-05T16:30:00+02:00',
    duration: '9.53',
    source: 'gate',
    place: 'Novi Sad, Bulevar Evrope site',
    correction: {
      originalIn: '2026-10-05T06:58:00+02:00',
      originalOut: null,
      by: 'Dragan Marković',
      at: '2026-10-06T07:40:00+02:00',
      reason: 'Forgot to clock out; the foreman confirmed the end of the shift.',
    },
  },
  {
    id: 'c3',
    person: 'Stefan Nikolić',
    personDescription: 'Crane operator',
    date: '2026-10-05',
    in: '2026-10-05T07:01:00+02:00',
    out: null,
    duration: null,
    source: 'phone',
    place: 'Novi Sad, 45.2551° N, 19.8452° E',
  },
  {
    id: 'c4',
    person: 'Marko Pavlović',
    personDescription: 'Site guard, nights',
    date: '2026-10-05',
    in: '2026-10-05T21:56:00+02:00',
    out: '2026-10-06T06:02:00+02:00',
    duration: '8.10',
    source: 'gate',
    place: 'Novi Sad, Bulevar Evrope site',
  },
  {
    id: 'c5',
    person: 'Bojan Đorđević',
    personDescription: 'Electrician',
    date: '2026-10-06',
    in: null,
    out: '2026-10-06T15:10:00+02:00',
    duration: null,
    source: 'phone',
  },
]
