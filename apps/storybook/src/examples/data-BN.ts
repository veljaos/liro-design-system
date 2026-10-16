/*
 * Group BN's example data (P5.73, University): the Illustrative Faculty of Engineering, Novi Sad,
 * on 14.10.2026 at 09:40 — its exam periods, Prof. Milan Radović's exam records with the written
 * exam in Operating Systems of 07.10.2026 being graded, and the student Teodora Pavlović's portal:
 * her registered exams, her grades with ECTS and the average, and the registration for the
 * October 2 period. The faculty, its grading scale, its conditions, fees and every person and
 * number are invented and illustrative. The faculty's application decides everything: who may
 * register and why not, what an exam costs, the totals of points, the grade the scale gives, the
 * average and the ECTS; it is played here (`recordFigures`, `expectedGrade`, `gradeAverage`,
 * `registrationFee`), and the components only show it. Not part of the package. No classes here.
 */
import { compareDecimal, type Signer } from '@veljaos/ui'
import {
  decimal,
  paras,
  sumUnits,
  toUnits,
  fromUnits,
} from '../../../../packages/ui/src/components/amounts-story-data'
import { averageOf } from './data-H'

export const BN_TODAY = '2026-10-14'
/** Now, in the faculty's time zone (Europe/Belgrade). */
export const BN_NOW = '2026-10-14T09:40:00+02:00'

export const BN_ROUTES = {
  /** The student portal's home: my exams. */
  portal: '/portal/university',
  grades: '/portal/university/grades',
  registration: '/portal/university/registration',
  /** Two exams chosen and the confirmation open, as the application restores it. */
  registrationConfirm: '/portal/university/registration?confirm=open',
  /** Both exams registered: the list as the application shows it afterwards. */
  registrationDone: '/portal/university/registration?state=registered',
  periods: '/faculty/exam-periods',
  records: '/faculty/exam-records',
  record: '/faculty/exam-records/ZI-2026-0417',
  /** Every grade entered: the examiner may sign. */
  recordReady: '/faculty/exam-records/ZI-2026-0417?state=ready',
  /** Every grade entered and the signing confirmation open. */
  recordSign: '/faculty/exam-records/ZI-2026-0417?state=sign',
  /** Signed by the examiner: locked. */
  recordLocked: '/faculty/exam-records/ZI-2026-0417?state=locked',
} as const

export const FACULTY = {
  id: 'illustrative-fe',
  name: 'Illustrative Faculty of Engineering, Novi Sad',
  /** The portal's lockup: the brand and the product. */
  brand: 'Illustrative FE',
  address: 'Trg nauke 6, Novi Sad',
  services: 'Student services · studentska@example.com · 021 485 2000 (illustrative), 09–13 h',
}

export const STUDENT = {
  name: 'Teodora Pavlović',
  firstName: 'Teodora',
  index: 'RA 112/2024',
  programme: 'Computer Engineering',
  year: 'Year 3',
  funding: 'Budget-funded',
  email: 'teodora.pavlovic@example.com',
  /** Her student account at the faculty: fees are charged to it (decimal string, RSD). */
  balance: '2300.00',
}

export const PROFESSOR = {
  name: 'Prof. Milan Radović',
  email: 'milan.radovic@example.com',
  department: 'Department of Computing',
}

export const HEAD_OF_DEPARTMENT = { name: 'Prof. Zorana Lukić', role: 'Head of department' }

// ── Exam periods ──────────────────────────────────────────────────────────────────────────────

export type PeriodState = 'Upcoming' | 'Registration open' | 'Grading' | 'Finished'

export interface ExamPeriod {
  id: string
  name: string
  schoolYear: string
  /** YYYY-MM-DD. */
  examsFrom: string
  examsTo: string
  registrationFrom: string
  registrationTo: string
  /** The number of exams held in it, from the timetable of exams. */
  exams: string
  /** Exam records signed, in words, from the application ("23 of 214 signed"). */
  records: string
  state: PeriodState
}

/** The period students register for now. */
export const OPEN_PERIOD: ExamPeriod = {
  id: 'oct2-2026',
  name: 'October 2 2026',
  schoolYear: '2025/2026',
  examsFrom: '2026-10-26',
  examsTo: '2026-10-31',
  registrationFrom: '2026-10-12',
  registrationTo: '2026-10-20',
  exams: '118',
  records: 'Opens after the exams',
  state: 'Registration open',
}

/** Newest first. */
export const EXAM_PERIODS: readonly ExamPeriod[] = [
  {
    id: 'jan-2027',
    name: 'January 2027',
    schoolYear: '2026/2027',
    examsFrom: '2027-01-18',
    examsTo: '2027-02-06',
    registrationFrom: '2027-01-04',
    registrationTo: '2027-01-11',
    exams: '236',
    records: 'Opens after the exams',
    state: 'Upcoming',
  },
  OPEN_PERIOD,
  {
    id: 'oct-2026',
    name: 'October 2026',
    schoolYear: '2025/2026',
    examsFrom: '2026-09-28',
    examsTo: '2026-10-10',
    registrationFrom: '2026-09-14',
    registrationTo: '2026-09-21',
    exams: '214',
    records: '23 of 214 signed',
    state: 'Grading',
  },
  {
    id: 'sep-2026',
    name: 'September 2026',
    schoolYear: '2025/2026',
    examsFrom: '2026-08-24',
    examsTo: '2026-09-12',
    registrationFrom: '2026-08-10',
    registrationTo: '2026-08-17',
    exams: '231',
    records: 'All 231 signed',
    state: 'Finished',
  },
  {
    id: 'jun-2026',
    name: 'June 2026',
    schoolYear: '2025/2026',
    examsFrom: '2026-06-08',
    examsTo: '2026-06-27',
    registrationFrom: '2026-05-25',
    registrationTo: '2026-06-01',
    exams: '244',
    records: 'All 244 signed',
    state: 'Finished',
  },
  {
    id: 'apr-2026',
    name: 'April 2026 (final-year students)',
    schoolYear: '2025/2026',
    examsFrom: '2026-04-13',
    examsTo: '2026-04-18',
    registrationFrom: '2026-03-30',
    registrationTo: '2026-04-03',
    exams: '61',
    records: 'All 61 signed',
    state: 'Finished',
  },
  {
    id: 'jan-2026',
    name: 'January 2026',
    schoolYear: '2025/2026',
    examsFrom: '2026-01-19',
    examsTo: '2026-02-07',
    registrationFrom: '2026-01-05',
    registrationTo: '2026-01-12',
    exams: '229',
    records: 'All 229 signed',
    state: 'Finished',
  },
]

// ── The grading scale (the faculty's, illustrative) ────────────────────────────────────────────

export interface ScaleStep {
  /** The grade as the record stores it. */
  grade: string
  words: string
  /** The ECTS letter. */
  ects: string
  /** The lowest total of points for the grade (decimal string); the next step's lowest is above. */
  from: string
  /** The points in words ("91–100"). */
  points: string
}

/** Best first. A total below the last step's `from` fails (grade 5). */
export const GRADING_SCALE: readonly ScaleStep[] = [
  { grade: '10', words: 'Outstanding', ects: 'A', from: '91', points: '91–100' },
  { grade: '9', words: 'Excellent', ects: 'B', from: '81', points: '81–90' },
  { grade: '8', words: 'Very good', ects: 'C', from: '71', points: '71–80' },
  { grade: '7', words: 'Good', ects: 'D', from: '61', points: '61–70' },
  { grade: '6', words: 'Sufficient', ects: 'E', from: '51', points: '51–60' },
  { grade: '5', words: 'Fail', ects: 'F', from: '0', points: '0–50' },
]

/** The record's value for a student who did not come to the exam. */
export const ABSENT = 'absent'

/** The grade options of the record, from the scale and the faculty's "did not take the exam". */
export const GRADE_OPTIONS = [
  ...GRADING_SCALE.map((step) => ({
    value: step.grade,
    label: `${step.grade} · ${step.words.toLowerCase()} (${step.ects})`,
  })),
  { value: ABSENT, label: 'Did not take the exam' },
]

/** The grade in words: "9 · excellent (B)", "Did not take the exam", "—". */
export function gradeText(grade: string): string {
  return GRADE_OPTIONS.find((option) => option.value === grade)?.label ?? '—'
}

/** The application's grade for a total of points, from the scale. */
export function expectedGrade(total: string): string {
  const step = GRADING_SCALE.find((each) => compareDecimal(total, each.from) >= 0)
  return step?.grade ?? '5'
}

/** A grade that passes the exam (6 or more). */
export function passes(grade: string): boolean {
  return grade !== '' && grade !== ABSENT && grade !== '5'
}

// ── The exam record ZI-2026-0417 ─────────────────────────────────────────────────────────────

export const RECORD = {
  number: 'ZI-2026-0417',
  course: 'Operating Systems',
  code: 'RA-204',
  ects: '6',
  period: 'October 2026',
  exam: 'Written exam',
  date: '2026-10-07',
  time: '09:00',
  room: 'Amphitheatre A-101',
  /** The most points of each part (decimal strings). */
  preExamMax: '40',
  examMax: '60',
  /** When the examiner signs in the locked story. */
  signedAt: '2026-10-14T09:52:00+02:00',
}

/** One student registered for the exam, as the record stores it. */
export interface RecordRow {
  id: string
  index: string
  name: string
  /** Which registration of this exam it is (1 = the first). */
  attempt: number
  /** Pre-exam obligations (laboratory and colloquium), from the course's records. */
  preExam: string
  /** The exam's points as the examiner enters them; null until entered. */
  exam: string | null
  /** A grade of the scale, `ABSENT`, or '' until entered. */
  grade: string
}

/** The students in the order of their index numbers. */
export const RECORD_ROWS: readonly RecordRow[] = [
  {
    id: 's04',
    index: 'RA 4/2024',
    name: 'Aleksa Babić',
    attempt: 1,
    preExam: '36',
    exam: '52',
    grade: '9',
  },
  {
    id: 's17',
    index: 'RA 17/2024',
    name: 'Milica Đorđević',
    attempt: 1,
    preExam: '31.5',
    exam: '41',
    grade: '8',
  },
  {
    id: 's23',
    index: 'RA 23/2024',
    name: 'Stefan Ilić',
    attempt: 2,
    preExam: '28',
    exam: '25',
    grade: '6',
  },
  {
    id: 's38',
    index: 'RA 38/2024',
    name: 'Ana Jovanović',
    attempt: 1,
    preExam: '39',
    exam: '57',
    grade: '10',
  },
  {
    id: 's41',
    index: 'RA 41/2024',
    name: 'Nemanja Kostić',
    attempt: 3,
    preExam: '22',
    exam: '18',
    grade: '5',
  },
  {
    id: 's56',
    index: 'RA 56/2024',
    name: 'Jovana Lazarević',
    attempt: 1,
    preExam: '34',
    exam: '33.5',
    grade: '7',
  },
  {
    id: 's62',
    index: 'RA 62/2024',
    name: 'Luka Marić',
    attempt: 2,
    preExam: '26',
    exam: null,
    grade: ABSENT,
  },
  {
    id: 's75',
    index: 'RA 75/2024',
    name: 'Sara Nikolić',
    attempt: 1,
    preExam: '37.5',
    exam: '48',
    grade: '9',
  },
  {
    id: 's88',
    index: 'RA 88/2024',
    name: 'Vuk Obradović',
    attempt: 1,
    preExam: '30',
    exam: '29',
    grade: '6',
  },
  {
    id: 's94',
    index: 'RA 94/2024',
    name: 'Tamara Popov',
    attempt: 2,
    preExam: '33',
    exam: '39',
    grade: '8',
  },
  {
    id: 's101',
    index: 'RA 101/2024',
    name: 'Filip Radić',
    attempt: 1,
    preExam: '35',
    exam: '44',
    grade: '',
  },
  {
    id: 's109',
    index: 'RA 109/2024',
    name: 'Katarina Savić',
    attempt: 1,
    preExam: '38',
    exam: null,
    grade: '',
  },
  {
    id: 's120',
    index: 'RA 120/2024',
    name: 'Ognjen Tomić',
    attempt: 4,
    preExam: '24',
    exam: '31',
    grade: '6',
  },
  {
    id: 's133',
    index: 'RA 133/2024',
    name: 'Ivana Vuković',
    attempt: 1,
    preExam: '32',
    exam: '45',
    grade: '7',
  },
]

/** What the examiner enters to finish the record (the ready and locked stories). */
export const RECORD_FINISH: Readonly<Record<string, Partial<RecordRow>>> = {
  s101: { grade: '8' },
  s109: { exam: '46.5', grade: '9' },
  s133: { grade: '8' },
}

export const RECORD_ROWS_READY: readonly RecordRow[] = RECORD_ROWS.map((row) => ({
  ...row,
  ...RECORD_FINISH[row.id],
}))

/** Points to one decimal place, as the faculty writes them: "72.5", "88". */
function points(units: bigint): string {
  return fromUnits(units, 1).replace(/\.0$/, '')
}

/** The application's total of a student's points; null until the exam's points are entered. */
export function totalPoints(row: RecordRow): string | null {
  if (row.exam === null) return null
  return points(toUnits(row.preExam, 1) + toUnits(row.exam, 1))
}

/** The application's checks of one row, in words, with the column they concern. */
export function rowChecks(
  row: RecordRow,
): { tone: 'danger' | 'warning'; text: string; column: string }[] {
  const checks: { tone: 'danger' | 'warning'; text: string; column: string }[] = []
  if (row.exam !== null && compareDecimal(row.exam, RECORD.examMax) > 0) {
    checks.push({
      tone: 'danger',
      text: `The exam has at most ${RECORD.examMax} points.`,
      column: 'exam',
    })
  }
  const total = totalPoints(row)
  if (row.grade === ABSENT && row.exam !== null) {
    checks.push({
      tone: 'warning',
      text: 'Points are entered for a student who did not take the exam.',
      column: 'grade',
    })
  } else if (total !== null && row.grade !== '' && row.grade !== ABSENT) {
    const expected = expectedGrade(total)
    if (expected !== row.grade) {
      checks.push({
        tone: 'warning',
        text: `${total} points is grade ${expected} on the faculty’s scale.`,
        column: 'grade',
      })
    }
  }
  return checks
}

/** The application's figures of the record. */
export function recordFigures(rows: readonly RecordRow[]) {
  const graded = rows.filter((row) => row.grade !== '')
  const passed = rows.filter((row) => passes(row.grade))
  const failed = rows.filter((row) => row.grade === '5')
  const absent = rows.filter((row) => row.grade === ABSENT)
  return {
    registered: String(rows.length),
    graded: String(graded.length),
    missing: String(rows.length - graded.length),
    passed: String(passed.length),
    failed: String(failed.length),
    absent: String(absent.length),
    /** The average grade of those who passed, two decimals; null when nobody passed. */
    average: averageOf(passed.map((row) => row.grade)),
    complete: graded.length === rows.length,
    problems: rows.reduce((count, row) => count + rowChecks(row).length, 0),
  }
}

/** The record's signers: the examiner first, then the head of department. */
export function recordSigners(signedByExaminer: boolean, mayExaminerSign: boolean): Signer[] {
  return [
    {
      id: 'examiner',
      name: PROFESSOR.name,
      role: 'Examiner',
      state: signedByExaminer ? 'signed' : 'waiting',
      ...(signedByExaminer ? { at: RECORD.signedAt } : {}),
      ...(mayExaminerSign || signedByExaminer ? { current: true } : {}),
    },
    {
      id: 'head',
      name: HEAD_OF_DEPARTMENT.name,
      role: HEAD_OF_DEPARTMENT.role,
      state: 'waiting',
    },
  ]
}

/** The examiner's records, newest first. Only ZI-2026-0417 has a page in the examples. */
export interface ExamRecordSummary {
  number: string
  course: string
  period: string
  date: string
  registered: string
  /** In words, from the application ("12 of 14"). */
  graded: string
  state: 'Draft' | 'Locked'
}

export const MY_RECORDS: readonly ExamRecordSummary[] = [
  {
    number: 'ZI-2026-0421',
    course: 'Systems Programming',
    period: 'October 2026',
    date: '2026-10-09',
    registered: '9',
    graded: '0 of 9',
    state: 'Draft',
  },
  {
    number: RECORD.number,
    course: RECORD.course,
    period: RECORD.period,
    date: RECORD.date,
    registered: String(RECORD_ROWS.length),
    graded: `${recordFigures(RECORD_ROWS).graded} of ${String(RECORD_ROWS.length)}`,
    state: 'Draft',
  },
  {
    number: 'ZI-2026-0371',
    course: 'Systems Programming',
    period: 'September 2026',
    date: '2026-09-08',
    registered: '22',
    graded: '22 of 22',
    state: 'Locked',
  },
  {
    number: 'ZI-2026-0362',
    course: 'Operating Systems',
    period: 'September 2026',
    date: '2026-09-03',
    registered: '31',
    graded: '31 of 31',
    state: 'Locked',
  },
  {
    number: 'ZI-2026-0298',
    course: 'Operating Systems',
    period: 'June 2026',
    date: '2026-06-15',
    registered: '87',
    graded: '87 of 87',
    state: 'Locked',
  },
]

// ── The student: grades ──────────────────────────────────────────────────────────────────────

export interface PassedExam {
  id: string
  course: string
  /** The year of study the course belongs to. */
  year: string
  /** Decimal string. */
  ects: string
  grade: string
  date: string
  period: string
}

export const PASSED_EXAMS: readonly PassedExam[] = [
  {
    id: 'ma1',
    course: 'Mathematical Analysis 1',
    year: '1',
    ects: '7',
    grade: '9',
    date: '2025-01-27',
    period: 'January 2025',
  },
  {
    id: 'la',
    course: 'Linear Algebra',
    year: '1',
    ects: '7',
    grade: '8',
    date: '2025-02-03',
    period: 'January 2025',
  },
  {
    id: 'fee',
    course: 'Fundamentals of Electrical Engineering',
    year: '1',
    ects: '7',
    grade: '7',
    date: '2025-02-14',
    period: 'February 2025',
  },
  {
    id: 'pf',
    course: 'Programming Fundamentals',
    year: '1',
    ects: '8',
    grade: '10',
    date: '2025-01-21',
    period: 'January 2025',
  },
  {
    id: 'dld',
    course: 'Digital Logic Design',
    year: '1',
    ects: '6',
    grade: '9',
    date: '2025-01-30',
    period: 'January 2025',
  },
  {
    id: 'ma2',
    course: 'Mathematical Analysis 2',
    year: '1',
    ects: '7',
    grade: '8',
    date: '2025-06-16',
    period: 'June 2025',
  },
  {
    id: 'phy',
    course: 'Physics',
    year: '1',
    ects: '6',
    grade: '7',
    date: '2025-09-02',
    period: 'September 2025',
  },
  {
    id: 'oop',
    course: 'Object-Oriented Programming',
    year: '1',
    ects: '6',
    grade: '10',
    date: '2025-06-10',
    period: 'June 2025',
  },
  {
    id: 'ics',
    course: 'Introduction to Computer Systems',
    year: '1',
    ects: '4',
    grade: '9',
    date: '2025-06-20',
    period: 'June 2025',
  },
  {
    id: 'en1',
    course: 'English Language 1',
    year: '1',
    ects: '2',
    grade: '10',
    date: '2025-06-24',
    period: 'June 2025',
  },
  {
    id: 'dsa',
    course: 'Data Structures and Algorithms',
    year: '2',
    ects: '7',
    grade: '9',
    date: '2026-01-26',
    period: 'January 2026',
  },
  {
    id: 'ca',
    course: 'Computer Architecture',
    year: '2',
    ects: '6',
    grade: '8',
    date: '2026-02-02',
    period: 'January 2026',
  },
  {
    id: 'ss',
    course: 'Signals and Systems',
    year: '2',
    ects: '6',
    grade: '7',
    date: '2026-02-16',
    period: 'February 2026',
  },
  {
    id: 'dm',
    course: 'Discrete Mathematics',
    year: '2',
    ects: '6',
    grade: '9',
    date: '2026-01-22',
    period: 'January 2026',
  },
  {
    id: 'web',
    course: 'Web Programming',
    year: '2',
    ects: '6',
    grade: '10',
    date: '2026-06-12',
    period: 'June 2026',
  },
  {
    id: 'sef',
    course: 'Software Engineering Fundamentals',
    year: '2',
    ects: '5',
    grade: '8',
    date: '2026-06-18',
    period: 'June 2026',
  },
  {
    id: 'en2',
    course: 'English Language 2',
    year: '2',
    ects: '2',
    grade: '10',
    date: '2026-06-23',
    period: 'June 2026',
  },
  {
    id: 'nm',
    course: 'Numerical Methods',
    year: '2',
    ects: '4',
    grade: '9',
    date: '2026-09-07',
    period: 'September 2026',
  },
]

/** ECTS the programme needs. */
export const ECTS_REQUIRED = '240'

/** The application's figures of the student's studies so far. */
export const STUDIES = {
  ects: decimal(sumUnits(PASSED_EXAMS.map((each) => paras(each.ects)))).replace(/\.00$/, ''),
  passed: String(PASSED_EXAMS.length),
  average: averageOf(PASSED_EXAMS.map((each) => each.grade)) ?? '',
}

/** Her latest results, newest first (the faculty publishes them when a record is signed). */
export const LATEST_RESULTS = [
  {
    id: 'os-sep',
    course: 'Operating Systems',
    period: 'September 2026',
    date: '2026-09-03',
    grade: '5',
    points: '44',
  },
  {
    id: 'nm-sep',
    course: 'Numerical Methods',
    period: 'September 2026',
    date: '2026-09-07',
    grade: '9',
    points: '86',
  },
  {
    id: 'ps-sep',
    course: 'Probability and Statistics',
    period: 'September 2026',
    date: '2026-09-10',
    grade: ABSENT,
    points: null,
  },
] as const

// ── The student: registration for October 2 2026 ──────────────────────────────────────────────

export interface RegistrableExam {
  id: string
  course: string
  year: string
  ects: string
  /** Which registration of this exam it would be. */
  attempt: number
  /** YYYY-MM-DD and HH:mm. */
  date: string
  time: string
  room: string
  /** Whether the application lets her register, and the conditions in its words. */
  allowed: boolean
  conditions: string
  /** The fee (decimal string, RSD); '0.00' is free. */
  fee: string
  /** The fee's rule, in the application's words. */
  feeRule: string
  /** Registered on this day, or not registered. */
  registeredOn?: string
}

export const REGISTRABLE: readonly RegistrableExam[] = [
  {
    id: 'os',
    course: 'Operating Systems',
    year: '2',
    ects: '6',
    attempt: 3,
    date: '2026-10-28',
    time: '09:00',
    room: 'Amphitheatre A-101',
    allowed: true,
    conditions: 'Pre-exam obligations met: 33 of 40 points',
    fee: '0.00',
    feeRule: 'Free: the first three registrations of an exam',
    registeredOn: '2026-10-12',
  },
  {
    id: 'ps',
    course: 'Probability and Statistics',
    year: '2',
    ects: '6',
    attempt: 4,
    date: '2026-10-29',
    time: '12:00',
    room: 'Room 2-14',
    allowed: true,
    conditions: 'Pre-exam obligations met: both homework assignments accepted',
    fee: '1500.00',
    feeRule: '1.500,00 RSD: the fourth registration of an exam and later (illustrative)',
  },
  {
    id: 'el',
    course: 'Electronics',
    year: '2',
    ects: '6',
    attempt: 1,
    date: '2026-10-27',
    time: '10:00',
    room: 'Room 1-03',
    allowed: true,
    conditions: 'Pre-exam obligations met: laboratory 4 of 4',
    fee: '0.00',
    feeRule: 'Free: the first three registrations of an exam',
  },
  {
    id: 'db',
    course: 'Databases',
    year: '3',
    ects: '7',
    attempt: 1,
    date: '2026-10-30',
    time: '09:00',
    room: 'Room 2-14',
    allowed: false,
    conditions: 'Pre-exam obligations not met: laboratory exercises 1 of 5',
    fee: '0.00',
    feeRule: 'Free: the first three registrations of an exam',
  },
  {
    id: 'cn',
    course: 'Computer Networks',
    year: '3',
    ects: '6',
    attempt: 1,
    date: '2026-10-31',
    time: '09:00',
    room: 'Amphitheatre A-101',
    allowed: false,
    conditions: 'Taught in the winter term: the exam is first held in January 2027',
    fee: '0.00',
    feeRule: 'Free: the first three registrations of an exam',
  },
]

/** The exams she chooses in the confirmation and registered stories. */
export const CHOSEN_EXAMS: readonly string[] = ['ps', 'el']

/** The application's fee for a set of exams (decimal string, RSD). */
export function registrationFee(ids: readonly string[]): string {
  return decimal(
    sumUnits(REGISTRABLE.filter((each) => ids.includes(each.id)).map((each) => paras(each.fee))),
  )
}

// ── The application's sums, checked when the examples load (as dataset-checks.ts) ────────────

if (STUDIES.ects !== '102' || STUDIES.passed !== '18' || STUDIES.average !== '8.72') {
  throw new Error('data-BN: the student’s ECTS, exams passed or average do not add up')
}
if (registrationFee(CHOSEN_EXAMS) !== '1500.00') {
  throw new Error('data-BN: the registration fee does not add up')
}
