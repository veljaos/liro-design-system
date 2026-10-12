/*
 * Group J's example data (P5.17, Learning and printouts): the occupational-safety course that
 * Kvadrat Gradnja d.o.o. requires of its site workers, as Nikola Marković (a site worker) sees it
 * on 6 October 2026 — eight lessons, five done; the final test, its grading and the certificate;
 * the printout of invoice F-2026-0412 (the lines and totals of the one dataset, never copied);
 * a pupil's report card from OŠ „Jovan Popović“ Novi Sad; a finding from Dom zdravlja Novi Sad.
 * Fictitious; rules, codes and texts are illustrative. The grading and the report card's average
 * are the application's work, played here and checked in dataset-checks.ts; components only show
 * them. Not part of the package. No classes here.
 */
import type { CourseLesson, CourseModule, QuestionAnswer, QuestionDefinition } from '@veljaos/ui'
import { FEATURED, INVOICES, LINES, TOTALS, type ExampleInvoice } from './examples-story-data'

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

/**
 * A lesson of the course at the progress the application has saved (`done` lessons done, in
 * order). The examples keep no store between screens, so the saved progress travels in the
 * route, as the Core's would come from its server.
 */
export function lessonPath(key: string, done: number): string {
  return `/learning/safety/${key}?done=${String(done)}`
}

export const J_ROUTES = {
  /** Nikola's saved progress: 5 of 8, "Manual handling of loads" next. */
  lesson: lessonPath('handling', 5),
  /** The same, with the phone's outline drawer open (the application restores it). */
  lessonOutline: `${lessonPath('handling', 5)}&outline=open`,
  /** Every lesson done, the final test to take. */
  test: lessonPath('test', 7),
  /** The first attempt, not passed (the application restores the result). */
  testNotPassed: `${lessonPath('test', 7)}&result=not-passed`,
  /** The test passed: the course completed, the certificate offered. */
  completed: lessonPath('test', 8),
  certificate: '/learning/certificates/BZR-2026-0187',
  invoicePrint: `/sales/invoices/${FEATURED}/print`,
  reportCard: '/school/pupils/2019-118/report-cards/2025-26',
  finding: '/health/findings/IM-2026-14327',
} as const

// ── The course ────────────────────────────────────────────────────────────────────────────────

export const COURSE = {
  title: 'Bezbednost i zdravlje na radu',
  subtitle: 'Occupational safety and health · required for Kvadrat Gradnja site workers',
}

/** The signed-in site worker. */
export const WORKER = {
  name: 'Nikola Marković',
  email: 'nikola.markovic@kvadratgradnja.rs',
}

interface LessonEntry {
  module: string
  key: string
  title: string
  detail: string
}

/** The course's lessons in their order; the last is the final test. */
export const LESSONS: readonly LessonEntry[] = [
  {
    module: 'basics',
    key: 'rights',
    title: 'Rights and duties on the site',
    detail: 'Reading · 8 min',
  },
  {
    module: 'basics',
    key: 'risks',
    title: 'Risk assessment of the workplace',
    detail: 'Reading · 12 min',
  },
  {
    module: 'basics',
    key: 'equipment',
    title: 'Personal protective equipment',
    detail: 'Reading · 10 min',
  },
  {
    module: 'height',
    key: 'scaffolding',
    title: 'Scaffolding: assembly and daily checks',
    detail: 'Reading · 14 min',
  },
  {
    module: 'height',
    key: 'falls',
    title: 'Fall protection and anchor points',
    detail: 'Reading · 9 min',
  },
  {
    module: 'loads',
    key: 'handling',
    title: 'Manual handling of loads',
    detail: 'Reading · 9 min',
  },
  {
    module: 'loads',
    key: 'cranes',
    title: 'Cranes, slings and signals',
    detail: 'Reading · 11 min',
  },
  { module: 'loads', key: 'test', title: 'Final test', detail: 'Quiz · 5 questions' },
]

const MODULES: readonly { key: string; title: string }[] = [
  { key: 'basics', title: '1. Basics of occupational safety' },
  { key: 'height', title: '2. Work at height' },
  { key: 'loads', title: '3. Machines and loads' },
]

/** The final test's key. */
export const TEST_KEY = 'test'

/**
 * The course as the application sends it with `done` lessons done: the lessons are taken in
 * order, so the next one is to do and every later one is locked, with its reason.
 */
export function courseAt(done: number): CourseModule[] {
  return MODULES.map((module) => ({
    key: module.key,
    title: module.title,
    lessons: LESSONS.filter((lesson) => lesson.module === module.key).map(
      (lesson): CourseLesson => {
        const index = LESSONS.indexOf(lesson)
        const previous = LESSONS[index - 1]
        const base = {
          key: lesson.key,
          title: lesson.title,
          detail: lesson.detail,
          href: `#${lessonPath(lesson.key, done)}`,
        }
        if (index < done) return { ...base, state: 'done' }
        if (index === done) return { ...base, state: 'todo' }
        return {
          ...base,
          state: 'locked',
          lockedReason:
            lesson.key === TEST_KEY || previous === undefined
              ? 'finish every lesson first'
              : `finish “${previous.title}” first`,
        }
      },
    ),
  }))
}

/** A lesson's place in the course, or -1. */
export function lessonIndex(key: string): number {
  return LESSONS.findIndex((lesson) => lesson.key === key)
}

// ── The final test ────────────────────────────────────────────────────────────────────────────

/** Correct answers needed to pass. */
export const PASS_MARK = 4

export const QUIZ: readonly QuestionDefinition[] = [
  {
    id: 'height',
    title: 'From what height must a worker be protected against falling?',
    type: 'single',
    options: [
      { value: '1', label: 'From 1 m' },
      { value: '2', label: 'From 2 m' },
      { value: '5', label: 'From 5 m' },
    ],
  },
  {
    id: 'scaffolding',
    title: 'Who checks the scaffolding before work starts each day?',
    type: 'single',
    options: [
      { value: 'any', label: 'Any worker who uses it' },
      { value: 'competent', label: 'A competent person named by the site manager' },
      { value: 'inspector', label: 'The labour inspector' },
    ],
  },
  {
    id: 'equipment',
    title: 'Which equipment must every worker wear on the site?',
    description: 'Choose every answer that applies.',
    type: 'multiple',
    options: [
      { value: 'helmet', label: 'Safety helmet' },
      { value: 'boots', label: 'Safety boots' },
      { value: 'vest', label: 'High-visibility vest' },
      { value: 'welding', label: 'Welding gloves' },
    ],
  },
  {
    id: 'lifting',
    title: 'What may one worker lift alone?',
    type: 'single',
    options: [
      { value: '25', label: 'Loads up to 25 kg' },
      { value: '40', label: 'Loads up to 40 kg' },
      { value: 'gloves', label: 'Any load, with gloves on' },
    ],
  },
  {
    id: 'signals',
    title: 'Who gives the signals to the crane operator?',
    type: 'single',
    options: [
      { value: 'nearest', label: 'The worker nearest to the load' },
      { value: 'signaller', label: 'One signaller named for the lift' },
      { value: 'manager', label: 'Only the site manager' },
    ],
  },
]

/** The answer key (the application's). */
const KEY: Readonly<Record<string, readonly string[]>> = {
  height: ['2'],
  scaffolding: ['competent'],
  equipment: ['helmet', 'boots', 'vest'],
  lifting: ['25'],
  signals: ['signaller'],
}

/** One answer graded, as QuizResult's review shows it. */
export interface GradedAnswer {
  key: string
  question: string
  answer: string
  correct: boolean
  correctAnswer?: string
}

export interface QuizAttempt {
  correct: number
  total: number
  passed: boolean
  review: GradedAnswer[]
}

function chosen(answer: QuestionAnswer | undefined): string[] {
  const value = answer?.value
  if (value === undefined || value === null) return []
  return typeof value === 'string' ? [value] : [...value]
}

function labelsOf(question: QuestionDefinition, values: readonly string[]): string {
  const labels = (question.options ?? [])
    .filter((option) => values.includes(option.value))
    .map((option) => option.label)
  return labels.length === 0 ? 'Not answered' : labels.join(', ')
}

/** Grades the answers: the application's work (the components only show the outcome). */
export function gradeQuiz(
  answers: Readonly<Record<string, QuestionAnswer | undefined>>,
): QuizAttempt {
  const review = QUIZ.map((question): GradedAnswer => {
    const given = chosen(answers[question.id])
    const key = KEY[question.id] ?? []
    const correct = given.length === key.length && key.every((value) => given.includes(value))
    return {
      key: question.id,
      question: question.title,
      answer: labelsOf(question, given),
      correct,
      ...(correct ? {} : { correctAnswer: labelsOf(question, key) }),
    }
  })
  const correct = review.filter((each) => each.correct).length
  return { correct, total: QUIZ.length, passed: correct >= PASS_MARK, review }
}

/** Nikola's first attempt, as the application keeps it: 3 of 5, not passed. */
export const FIRST_ATTEMPT = gradeQuiz({
  height: { value: '5' },
  scaffolding: { value: 'competent' },
  equipment: { value: ['helmet', 'boots'] },
  lifting: { value: '25' },
  signals: { value: 'signaller' },
})

/** The second attempt, passed: 4 of 5 (the course completed with it). */
export const SECOND_ATTEMPT = gradeQuiz({
  height: { value: '2' },
  scaffolding: { value: 'competent' },
  equipment: { value: ['helmet', 'boots', 'vest', 'welding'] },
  lifting: { value: '25' },
  signals: { value: 'signaller' },
})

/** The answers given before the static "final test" picture: two of five. */
export const TEST_IN_PROGRESS = {
  height: { value: '2' },
  scaffolding: { value: 'competent' },
} as const

// ── The certificate ───────────────────────────────────────────────────────────────────────────

export const CERTIFICATE = {
  title: 'Certificate',
  subtitle: 'of completed training in occupational safety and health',
  lead: 'This certifies that',
  recipient: WORKER.name,
  recipientDetail: 'Site worker, Kvadrat Gradnja d.o.o.',
  text: 'has completed the course “Bezbednost i zdravlje na radu” (occupational safety and health on construction sites, 8 lessons) and passed its final test.',
  number: 'No. BZR-2026-0187',
  /** The number as the preview's bar names it. */
  code: 'BZR-2026-0187',
  issued: { place: 'Novi Sad', date: '2026-10-06' },
  signatures: [
    {
      key: 'officer',
      label: 'Occupational safety officer',
      name: 'Jelena Savić',
      detail: 'Licence BZR-0457',
    },
    { key: 'director', label: 'Director', name: 'Vladimir Kostić' },
  ],
}

// ── Invoice F-2026-0412 on paper ──────────────────────────────────────────────────────────────

/** The invoice the printout shows: the dataset's own. */
export const PRINTED_INVOICE: ExampleInvoice =
  INVOICES.find((each) => each.number === FEATURED) ??
  (() => {
    throw new Error(`Example dataset: ${FEATURED} is missing`)
  })()

/** Its lines and totals: the dataset's, the same objects the invoice's page shows. */
export const PRINTED_LINES = LINES
export const PRINTED_TOTALS = TOTALS

/** Kvadrat Gradnja d.o.o., the seller (PIB as in the company switcher). */
export const SELLER = {
  name: 'Kvadrat Gradnja d.o.o.',
  address: 'Bulevar oslobođenja 102',
  city: '21000 Novi Sad, Serbia',
  taxId: '108452317',
  registration: '21045873',
  account: '160-0000012345678-21',
  bank: 'Banca Intesa',
  email: 'office@kvadratgradnja.rs',
}

/** The invoice's dates and references, as on its page (issued, due, the payment reference). */
export const INVOICE_FACTS = {
  supplied: '2026-09-26',
  place: 'Novi Sad',
  reference: '97 2026-0412',
  advance: 'A-2026-031',
}

// ── Report card ───────────────────────────────────────────────────────────────────────────────

export interface ReportRow {
  id: string
  type: 'line' | 'subtotal'
  subject: string
  /** A grade 1–5, or the average as a decimal string. */
  grade: string
  /** Hours absent, a decimal string. */
  absences: string
}

/** The words of a grade, as the school writes them. */
export const GRADE_WORDS: Readonly<Record<string, string>> = {
  '5': 'excellent',
  '4': 'very good',
  '3': 'good',
  '2': 'sufficient',
  '1': 'insufficient',
}

export const PUPIL = {
  name: 'Mila Stojanović',
  class: '7/3',
  born: '2012-11-04',
  register: '118/2019',
  teacher: 'Snežana Ilić',
  principal: 'Zoran Stojanović',
}

/** The subjects of the 7th grade with the year's final grades and hours absent. */
export const SUBJECTS: readonly ReportRow[] = [
  {
    id: 'srp',
    type: 'line',
    subject: 'Serbian language and literature',
    grade: '4',
    absences: '6',
  },
  { id: 'eng', type: 'line', subject: 'English language', grade: '5', absences: '0' },
  { id: 'ger', type: 'line', subject: 'German language', grade: '5', absences: '2' },
  { id: 'art', type: 'line', subject: 'Fine arts', grade: '5', absences: '0' },
  { id: 'mus', type: 'line', subject: 'Music', grade: '5', absences: '0' },
  { id: 'his', type: 'line', subject: 'History', grade: '5', absences: '4' },
  { id: 'geo', type: 'line', subject: 'Geography', grade: '4', absences: '2' },
  { id: 'phy', type: 'line', subject: 'Physics', grade: '3', absences: '3' },
  { id: 'mat', type: 'line', subject: 'Mathematics', grade: '4', absences: '5' },
  { id: 'bio', type: 'line', subject: 'Biology', grade: '5', absences: '0' },
  { id: 'che', type: 'line', subject: 'Chemistry', grade: '4', absences: '2' },
  { id: 'tec', type: 'line', subject: 'Technology', grade: '5', absences: '0' },
  { id: 'inf', type: 'line', subject: 'Informatics and computing', grade: '5', absences: '0' },
  {
    id: 'pe',
    type: 'line',
    subject: 'Physical and health education',
    grade: '5',
    absences: '4',
  },
]

/** The school's figures for the year: the average to two decimals, the hours absent. */
export const REPORT_TOTALS = {
  average: '4.57',
  success: 'Excellent',
  absences: '28',
  excused: '26',
  unexcused: '2',
}

/** The table's rows: the subjects, then the average as a subtotal row. */
export const REPORT_ROWS: readonly ReportRow[] = [
  ...SUBJECTS,
  {
    id: 'average',
    type: 'subtotal',
    subject: 'Average grade',
    grade: REPORT_TOTALS.average,
    absences: REPORT_TOTALS.absences,
  },
]

// ── Medical finding ───────────────────────────────────────────────────────────────────────────

export const PATIENT = {
  name: 'Svetlana Đorđević',
  born: '1962-07-19',
  insurance: '10498217733',
  chosenDoctor: 'dr Milan Popov',
}

export interface LabResult {
  id: string
  test: string
  /** Decimal strings. */
  value: string
  /** The reference range; without a lower limit, "below the upper". */
  low?: string
  high: string
  unit: string
  /** The laboratory's flag, in words. */
  flag?: string
}

export const LAB_RESULTS: readonly LabResult[] = [
  {
    id: 'glu',
    test: 'Glucose (fasting)',
    value: '6.4',
    low: '3.9',
    high: '6.1',
    unit: 'mmol/L',
    flag: 'High',
  },
  {
    id: 'chol',
    test: 'Total cholesterol',
    value: '6.8',
    high: '5.2',
    unit: 'mmol/L',
    flag: 'High',
  },
  { id: 'ldl', test: 'LDL cholesterol', value: '4.6', high: '3.0', unit: 'mmol/L', flag: 'High' },
  { id: 'crea', test: 'Creatinine', value: '78', low: '49', high: '90', unit: 'µmol/L' },
  { id: 'k', test: 'Potassium', value: '4.3', low: '3.5', high: '5.1', unit: 'mmol/L' },
]
