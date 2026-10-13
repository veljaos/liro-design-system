/*
 * Group H's example data (P5.17, industry examples), one dataset each.
 * 4. Health: Ambulanta Liman of Dom zdravlja Novi Sad — the doctors' week of 12.–16.10.2026,
 *    the free times the patient portal offers, Jovana Nikolić's booking (Wed 14.10. at 11:30), the
 *    clinic's schedule and dr Marko Stanković's calendar with it, and her last finding.
 * 5. School: OŠ "Jovan Popović", class 7/2, 2026/27 — the timetable, Tuesday 06.10.'s attendance
 *    (lessons 1 and 2 marked, lesson 3 being marked), the mathematics gradebook and Luka
 *    Jovanović's absences as his parent sees them.
 * Counts and averages are worked out here, in whole numbers, as the application would; the
 * components add nothing. Fictitious people and numbers. No classes here.
 */
import type {
  AttendanceCode,
  AttendanceColumn,
  AttendanceEntry,
  AttendanceRow,
  AttendanceTotals,
  AttendanceValue,
  CalendarEvent,
  FreeSlot,
  ScheduleBooking,
  ScheduleResource,
  TimetableLesson,
  TimetablePeriod,
  UnavailableTime,
  Weekday,
} from '@veljaos/ui'

// ── 4. Health: Ambulanta Liman ─────────────────────────────────────────────────────────────────

export const CLINIC = {
  companyId: 'dzns',
  company: 'Dom zdravlja Novi Sad',
  name: 'Ambulanta Liman',
  address: 'Fruškogorska 26, Novi Sad',
  phone: '021 4879 000',
  week: { start: '2026-10-12', end: '2026-10-16' },
  /** The day the schedule shows: the day of Jovana's appointment. */
  day: '2026-10-14',
  /** The clinic's clock on that day, for the "now" marker (P5.28 item 10). */
  now: '09:40',
}

export const PATIENT = {
  name: 'Jovana Nikolić',
  insurance: 'LBO 10234567891',
  born: '1979-03-22',
}

export const DOCTORS: readonly ScheduleResource[] = [
  { id: 'stankovic', name: 'dr Marko Stanković', description: 'General practice' },
  { id: 'lukic', name: 'dr Vesna Lukić', description: 'General practice' },
  { id: 'grujic', name: 'dr Nada Grujić', description: 'General practice' },
  { id: 'lab', name: 'Laboratory', description: 'Blood draw' },
]

/** Jovana's chosen doctor. */
export const CHOSEN_DOCTOR = 'stankovic'

export const SERVICES = [
  { value: 'checkup', label: 'Check-up', description: '30 minutes' },
  { value: 'pressure', label: 'Blood pressure control', description: '30 minutes' },
  { value: 'prescription', label: 'Prescription renewal', description: '30 minutes' },
  { value: 'referral', label: 'Referral to a specialist', description: '30 minutes' },
]

/** The doctors' consulting hours (the clinic's data): 07:00–13:00 in 30-minute appointments. */
const DAY_SLOTS = [
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
]

/** The break, every day, for every doctor. */
const BREAK = '10:00'

const WEEK_DAYS = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16']

/** Times still free before Jovana books (the clinic's data), per doctor and day. */
const FREE: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
  stankovic: {
    '2026-10-12': ['08:30', '12:00'],
    '2026-10-13': ['07:30', '11:00', '12:30'],
    '2026-10-14': ['09:00', '11:30'],
    '2026-10-15': ['10:30', '12:00'],
    '2026-10-16': ['07:00', '08:00', '11:30'],
  },
  grujic: {
    '2026-10-14': ['08:00', '10:30', '12:30'],
  },
}

/** dr Vesna Lukić is on annual leave on 14.10. (the clinic's data). */
export const UNAVAILABLE: readonly UnavailableTime[] = [
  ...['stankovic', 'grujic'].map((resourceId) => ({
    resourceId,
    start: `${CLINIC.day}T${BREAK}`,
    end: `${CLINIC.day}T10:30`,
    reason: 'Break',
  })),
  {
    resourceId: 'lukic',
    start: `${CLINIC.day}T07:00`,
    end: `${CLINIC.day}T13:00`,
    reason: 'Annual leave',
  },
  {
    resourceId: 'lab',
    start: `${CLINIC.day}T10:00`,
    end: `${CLINIC.day}T13:00`,
    reason: 'Samples go to the laboratory',
  },
]

const PATIENTS = [
  'Marko Ilić',
  'Ana Petrović',
  'Petar Đurić',
  'Dragana Nikolić',
  'Milan Savić',
  'Vera Tomić',
  'Uroš Pavlović',
  'Zorica Mitić',
  'Saša Kostić',
  'Ivana Marković',
  'Nikola Babić',
  'Jelena Simić',
  'Đorđe Lazić',
  'Branka Jovanović',
  'Stevan Popov',
  'Olivera Kis',
]

const SERVICE_CYCLE = [
  'Check-up',
  'Blood pressure control',
  'Prescription renewal',
  'Check-up',
  'Referral to a specialist',
]

/** "09:30" plus 30 minutes. */
function plus30(time: string): string {
  const [h = 0, m = 0] = time.split(':').map(Number)
  const minutes = h * 60 + m + 30
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** The doctors' appointments before Jovana books: every consulting slot that is not free. */
function doctorBookings(doctor: string, days: readonly string[]): ScheduleBooking[] {
  let n = doctor.length
  return days.flatMap((day) =>
    DAY_SLOTS.filter((slot) => slot !== BREAK && !(FREE[doctor]?.[day] ?? []).includes(slot)).map(
      (slot) => {
        n += 1
        return {
          id: `${doctor}-${day}-${slot}`,
          resourceId: doctor,
          title: PATIENTS[n % PATIENTS.length] ?? '',
          description: SERVICE_CYCLE[n % SERVICE_CYCLE.length] ?? '',
          start: `${day}T${slot}`,
          end: `${day}T${plus30(slot)}`,
        }
      },
    ),
  )
}

const LAB_BOOKINGS: ScheduleBooking[] = ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30'].map(
  (slot, index) => ({
    id: `lab-${slot}`,
    resourceId: 'lab',
    title: PATIENTS[(index * 5 + 3) % PATIENTS.length] ?? '',
    description: 'Blood count and glucose',
    start: `${CLINIC.day}T${slot}`,
    end: `${CLINIC.day}T${plus30(slot)}`,
  }),
)

/** Every booking of the week before Jovana's. */
export const BOOKINGS_BEFORE: readonly ScheduleBooking[] = [
  ...doctorBookings('stankovic', WEEK_DAYS),
  ...doctorBookings('grujic', [CLINIC.day]),
  ...LAB_BOOKINGS,
]

/** The free times the portal offers for her chosen doctor (the application's search). */
export const FREE_SLOTS: readonly FreeSlot[] = WEEK_DAYS.flatMap((day) =>
  (FREE.stankovic?.[day] ?? []).map((slot) => ({
    id: `stankovic-${day}-${slot}`,
    start: `${day}T${slot}`,
    end: `${day}T${plus30(slot)}`,
    resourceId: 'stankovic',
  })),
)

/** Jovana's booking: Wednesday 14.10.2026 at 11:30, a check-up with dr Marko Stanković. */
export const JOVANA_SLOT = 'stankovic-2026-10-14-11:30'
export const JOVANA_BOOKING: ScheduleBooking = {
  id: 'jovana',
  resourceId: 'stankovic',
  title: PATIENT.name,
  description: 'Check-up · booked online',
  start: '2026-10-14T11:30',
  end: '2026-10-14T12:00',
}

/** Every booking after hers: the clinic's schedule and the doctor's calendar. */
export const BOOKINGS: readonly ScheduleBooking[] = [...BOOKINGS_BEFORE, JOVANA_BOOKING]

/** The clinic's schedule of 14.10.: every row's bookings of that day. */
export const DAY_BOOKINGS: readonly ScheduleBooking[] = BOOKINGS.filter((each) =>
  each.start.startsWith(CLINIC.day),
)

/** dr Marko Stanković's week as calendar events: the patient first, then the service. */
export const DOCTOR_EVENTS: readonly CalendarEvent[] = [
  ...BOOKINGS.filter((each) => each.resourceId === CHOSEN_DOCTOR).map((each) => ({
    id: each.id,
    title: `${each.title}, ${each.description?.split(' · ')[0] ?? ''}`,
    start: each.start,
    end: each.end,
  })),
  {
    id: 'meeting',
    title: 'Team meeting',
    start: '2026-10-15T13:00',
    end: '2026-10-15T14:00',
    tone: 'premium' as const,
    description: 'Room 2, ground floor',
  },
]

/** Her last finding: the diagnosis and the finding are sensitive (MaskedValue). */
export const FINDING = {
  number: 'IZ-2026-03417',
  date: '2026-09-14',
  doctor: 'dr Marko Stanković',
  kind: 'Check-up, general practice',
  diagnosis: 'I10 Essential (primary) hypertension',
  text: 'Blood pressure 150/95 mmHg in two measurements. Less salt, a walk every day; a control in a month with the readings from home.',
  next: '2026-10-14T11:30',
}

export const REVEAL_REASONS = [
  { value: 'care', label: 'I am treating the patient now' },
  { value: 'referral', label: 'Preparing a referral the doctor asked for' },
  { value: 'control', label: 'Preparing the patient’s control appointment' },
]

// ── 5. School: OŠ "Jovan Popović", class 7/2 ───────────────────────────────────────────────────

export const SCHOOL = {
  companyId: 'jovan-popovic',
  name: 'OŠ „Jovan Popović“ Novi Sad',
  className: '7/2',
  year: '2026/27',
  /** Today in the examples: Tuesday 06.10.2026, during lesson 3. */
  day: '2026-10-06',
  now: '10:05',
  teacher: 'Dragana Simić',
}

export const PERIODS: readonly TimetablePeriod[] = [
  { id: 'p1', label: '1.', start: '08:00', end: '08:45' },
  { id: 'p2', label: '2.', start: '08:50', end: '09:35' },
  { id: 'p3', label: '3.', start: '09:55', end: '10:40' },
  { id: 'p4', label: '4.', start: '10:45', end: '11:30' },
  { id: 'p5', label: '5.', start: '11:35', end: '12:20' },
  { id: 'p6', label: '6.', start: '12:25', end: '13:10' },
]

const TEACHERS: Readonly<Record<string, { teacher: string; room: string }>> = {
  'Serbian language': { teacher: 'Marija Đorđević', room: 'Room 12' },
  Mathematics: { teacher: 'Dragana Simić', room: 'Room 14' },
  English: { teacher: 'Ivana Kovačević', room: 'Room 21' },
  German: { teacher: 'Sandra Huber', room: 'Room 21' },
  History: { teacher: 'Milan Bošković', room: 'Room 9' },
  Geography: { teacher: 'Snežana Rakić', room: 'Room 9' },
  Biology: { teacher: 'Jasmina Perić', room: 'Biology lab' },
  Physics: { teacher: 'Nebojša Lukić', room: 'Physics lab' },
  Chemistry: { teacher: 'Gordana Vasić', room: 'Chemistry lab' },
  'Physical education': { teacher: 'Goran Matić', room: 'Gym' },
  Art: { teacher: 'Tijana Mirić', room: 'Art room' },
  Music: { teacher: 'Aleksandra Ivić', room: 'Music room' },
  'Technology and IT': { teacher: 'Dejan Vukić', room: 'IT room' },
}

/** Monday to Friday, lessons 1–6 (a seventh-grade week). */
const WEEK: Readonly<Record<number, readonly string[]>> = {
  1: ['Serbian language', 'Mathematics', 'History', 'English', 'Biology', 'Physical education'],
  2: ['Serbian language', 'English', 'Mathematics', 'Physics', 'Physical education', 'Geography'],
  3: ['Mathematics', 'Chemistry', 'Serbian language', 'German', 'Art', 'Technology and IT'],
  4: ['Physics', 'Serbian language', 'Mathematics', 'History', 'Music', 'Biology'],
  5: ['English', 'Mathematics', 'Geography', 'Chemistry', 'German', 'Technology and IT'],
}

export const LESSONS: readonly TimetableLesson[] = Object.entries(WEEK).flatMap(([day, subjects]) =>
  subjects.map((subject, index) => {
    const period = PERIODS[index]?.id ?? 'p1'
    const who = TEACHERS[subject]
    const base = {
      id: `${day}-${period}`,
      day: Number(day) as Weekday,
      periodId: period,
      subject,
      ...(who === undefined ? {} : { teacher: who.teacher, room: who.room }),
    }
    // Wednesday's mathematics is a written test; Thursday's history has a substitute.
    if (day === '3' && subject === 'Mathematics') {
      return { ...base, tone: 'warning' as const, note: 'Written test 2' }
    }
    if (day === '4' && subject === 'History') {
      return { ...base, teacher: 'Ivan Grujić', tone: 'neutral' as const, note: 'Substitute' }
    }
    return base
  }),
)

/** Tuesday's lessons as the attendance grid's columns. */
export const TODAY_LESSONS: readonly AttendanceColumn[] = (WEEK[2] ?? []).map((subject, index) => ({
  id: `l${String(index + 1)}`,
  label: `${String(index + 1)}. ${subject.slice(0, 3)}`,
  note: `Lesson ${String(index + 1)}: ${subject}`,
}))

/** The lesson being marked now: the third, mathematics with Dragana Simić. */
export const CURRENT_LESSON = 'l3'

export const ATTENDANCE_CODES: readonly AttendanceCode[] = [
  { code: 'present', label: 'Present', short: 'P', key: 'p' },
  { code: 'absent', label: 'Absent', short: 'A', key: 'a', tone: 'danger' },
  { code: 'late', label: 'Late', short: 'L', key: 'l', tone: 'warning' },
  { code: 'excused', label: 'Excused', short: 'E', key: 'e', tone: 'neutral' },
]

/** A class of 30, in the register's order (by surname); Luka is the fourth. */
export const PUPILS: readonly AttendanceRow[] = [
  'Aleksa Babić',
  'Ana Đurić',
  'Petar Ilić',
  'Luka Jovanović',
  'Jovana Kostić',
  'Stefan Kovačević',
  'Mila Lazarević',
  'Ivana Lukić',
  'Marko Marić',
  'Nikola Marković',
  'Sara Milošević',
  'Katarina Mitrović',
  'Vuk Nedeljković',
  'Đorđe Nikolić',
  'Milica Obradović',
  'Tamara Pavlović',
  'Filip Pešić',
  'Uroš Popović',
  'Anđela Radović',
  'Vasilije Ristić',
  'Teodora Savić',
  'Ognjen Simić',
  'Jelena Stanković',
  'Dunja Stojanović',
  'Mihajlo Todorović',
  'Lazar Tomić',
  'Nina Vasić',
  'Hana Vuković',
  'Lena Zorić',
  'Andrej Živković',
].map((label, index) => ({ id: `u${String(index + 1)}`, label }))

/** Luka Jovanović: the child of the parent portal. */
export const LUKA = 'u4'

/** Lessons 1 and 2 marked by their teachers; lesson 3 not yet. */
export const ATTENDANCE_VALUE: AttendanceValue = Object.fromEntries(
  PUPILS.map((pupil) => {
    const cells: Record<string, AttendanceEntry> = {}
    for (const lesson of ['l1', 'l2']) cells[lesson] = { code: 'present' }
    if (pupil.id === LUKA) {
      cells.l1 = { code: 'absent' }
      cells.l2 = { code: 'absent' }
    }
    // Mila came late to the first lesson; Teodora is at a competition with the school's leave.
    if (pupil.label === 'Mila Lazarević') cells.l1 = { code: 'late' }
    if (pupil.label === 'Teodora Savić') {
      cells.l1 = { code: 'excused' }
      cells.l2 = { code: 'excused' }
    }
    return [pupil.id, cells]
  }),
)

/** The application's counts: per lesson (present, absent) and per pupil (lessons missed today). */
export function attendanceTotals(value: AttendanceValue): {
  rowTotals: AttendanceTotals
  columnTotals: AttendanceTotals
} {
  const count = (codes: readonly string[], cells: readonly (AttendanceEntry | undefined)[]) => {
    const marked = cells.filter((cell) => cell?.code != null)
    return marked.length === 0
      ? null
      : String(marked.filter((cell) => codes.includes(cell?.code ?? '')).length)
  }
  const column = (codes: readonly string[]) =>
    Object.fromEntries(
      TODAY_LESSONS.map((lesson) => [
        lesson.id,
        count(
          codes,
          PUPILS.map((pupil) => value[pupil.id]?.[lesson.id]),
        ),
      ]),
    )
  return {
    rowTotals: {
      totals: [{ id: 'missed', label: 'Lessons missed today', short: 'Missed' }],
      values: Object.fromEntries(
        PUPILS.map((pupil) => [
          pupil.id,
          {
            missed: count(
              ['absent', 'excused'],
              TODAY_LESSONS.map((lesson) => value[pupil.id]?.[lesson.id]),
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
      values: { present: column(['present', 'late']), absent: column(['absent', 'excused']) },
    },
  }
}

// ── The mathematics gradebook ─────────────────────────────────────────────────────────────────

export const MARK_CODES: readonly AttendanceCode[] = [
  { code: '1', label: 'Insufficient (1)', short: '1', key: '1', tone: 'danger' },
  { code: '2', label: 'Sufficient (2)', short: '2', key: '2' },
  { code: '3', label: 'Good (3)', short: '3', key: '3' },
  { code: '4', label: 'Very good (4)', short: '4', key: '4' },
  { code: '5', label: 'Excellent (5)', short: '5', key: '5' },
]

export const ASSESSMENTS: readonly AttendanceColumn[] = [
  { id: 't1', label: 'T1', date: '2026-09-15', note: 'Written test 1: rational numbers' },
  { id: 'o1', label: 'O1', date: '2026-09-22', note: 'Oral answer' },
  { id: 'h1', label: 'H1', date: '2026-09-29', note: 'Homework: powers' },
  { id: 'o2', label: 'O2', date: '2026-10-05', note: 'Oral answer' },
]

/** The marks, in the pupils' order; "-" where there is none (Luka was ill on 22.09.). */
const MARKS: readonly string[] = [
  '5434',
  '4545',
  '332-',
  '4-43',
  '2312',
  '3443',
  '4443',
  '5455',
  '3323',
  '3434',
  '5545',
  '4434',
  '2332',
  '435-',
  '5554',
  '5454',
  '343-',
  '2222',
  '4544',
  '344-',
  '4554',
  '3232',
  '5445',
  '5455',
  '4343',
  '3-33',
  '2423',
  '4445',
  '5544',
  '3334',
]

export const GRADEBOOK_VALUE: AttendanceValue = Object.fromEntries(
  PUPILS.map((pupil, index) => [
    pupil.id,
    Object.fromEntries(
      (MARKS[index] ?? '')
        .split('')
        .flatMap((mark, column) =>
          mark === '-' ? [] : [[ASSESSMENTS[column]?.id ?? '', { code: mark }]],
        ),
    ),
  ]),
)

/** The average with two decimals, rounded half up by the application, from whole marks. */
export function averageOf(marks: readonly string[]): string | null {
  if (marks.length === 0) return null
  const sum = marks.reduce((total, mark) => total + Number(mark), 0)
  const hundredths = Math.floor((sum * 200 + marks.length) / (2 * marks.length))
  return `${String(Math.floor(hundredths / 100))}.${String(hundredths % 100).padStart(2, '0')}`
}

/** The application's averages of a gradebook. */
export function gradebookTotals(value: AttendanceValue): AttendanceTotals {
  return {
    totals: [{ id: 'average', label: 'Average', short: 'Avg', decimals: 2 }],
    values: Object.fromEntries(
      PUPILS.map((pupil) => [
        pupil.id,
        {
          average: averageOf(
            ASSESSMENTS.map((each) => value[pupil.id]?.[each.id]?.code ?? null).filter(
              (mark): mark is string => mark !== null,
            ),
          ),
        },
      ]),
    ),
  }
}

export const GRADEBOOK_TOTALS = gradebookTotals(GRADEBOOK_VALUE)

// ── The parent portal: Luka Jovanović's absences ───────────────────────────────────────────────

export const PARENT = { name: 'Snežana Jovanović', detail: 'Parent of Luka Jovanović, 7/2' }

/** One absence from a lesson, as the school records it. */
export interface Absence {
  id: string
  date: string
  lesson: number
  subject: string
  excused: boolean
  note?: string
  /** The parent's excuse is sent and waits for the class teacher (P5.28). */
  excuseSent?: boolean
}

function subjectOf(date: string, lesson: number): string {
  const [y = 2000, m = 1, d = 1] = date.split('-').map(Number)
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return WEEK[day]?.[lesson - 1] ?? ''
}

/** Luka's absences this term, newest first; today's from the grid's lessons 1 and 2. */
export const ABSENCES: readonly Absence[] = [
  ...[1, 2].map((lesson) => ({
    id: `a-${SCHOOL.day}-${String(lesson)}`,
    date: SCHOOL.day,
    lesson,
    subject: subjectOf(SCHOOL.day, lesson),
    excused: false,
  })),
  {
    id: 'a-2026-09-29-5',
    date: '2026-09-29',
    lesson: 5,
    subject: subjectOf('2026-09-29', 5),
    excused: true,
    note: 'Dentist, note from the parent',
  },
  ...[1, 2, 3, 4, 5, 6].map((lesson) => ({
    id: `a-2026-09-22-${String(lesson)}`,
    date: '2026-09-22',
    lesson,
    subject: subjectOf('2026-09-22', lesson),
    excused: true,
    note: 'Ill, note from the doctor',
  })),
]

export const ABSENCE_COUNTS = {
  total: ABSENCES.length,
  excused: ABSENCES.filter((each) => each.excused).length,
  open: ABSENCES.filter((each) => !each.excused).length,
}

// ── P5.28 screens ──────────────────────────────────────────────────────────────────────────────

/** Where the patient's messages go (illustrative). */
export const PATIENT_PHONE = '064 123 4567'

/**
 * A move of Jovana's appointment proposed on the schedule (a drag to dr Nada Grujić's free 12:30):
 * the confirmation open on it, as the reception would see it before anything changes.
 */
export const JOVANA_MOVE = {
  id: JOVANA_BOOKING.id,
  resourceId: 'grujic',
  start: `${CLINIC.day}T12:30`,
  end: `${CLINIC.day}T13:00`,
}

/** The reasons a parent gives when excusing an absence (the school's list). */
export const EXCUSE_REASONS = [
  { value: 'illness', label: 'Illness' },
  { value: 'doctor', label: 'Doctor’s appointment' },
  { value: 'family', label: 'Family reason' },
  { value: 'other', label: 'Other' },
]

/** The kinds of note the school accepts with an excuse. */
export const EXCUSE_FILES = {
  accept: ['image/*', '.pdf'],
  acceptText: 'A photo or a PDF of the doctor’s note',
  maxSize: 10 * 1024 * 1024,
  maxSizeText: '10 MB',
}
