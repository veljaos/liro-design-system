import { paras, sumUnits } from '../../../../packages/ui/src/components/amounts-story-data'

/*
 * Group X (P5.34): the Liro Assistant at Kvadrat Gradnja d.o.o. on 14.10.2026 at 09:40, asked by
 * Milica Petrović. Nothing calls a model: every answer is a fixed object of this file, chosen by
 * its question. Invented data; amounts are decimal strings, dates YYYY-MM-DD.
 */

export const X_TODAY = '2026-10-14'
export const X_NOW = '2026-10-14T09:40:00+02:00'

export const X_ROUTES = {
  /** Receivables with the assistant's panel closed (its button in the header). */
  receivables: '/finance/receivables',
  /** The panel open on Receivables, one answer each. */
  overdue: '/finance/receivables/assistant/overdue',
  revenue: '/finance/receivables/assistant/revenue',
  post: '/finance/receivables/assistant/post',
  salaries: '/finance/receivables/assistant/salaries',
  /** The panel before the first question. */
  start: '/finance/receivables/assistant',
  /** An answer's states. */
  thinking: '/finance/receivables/assistant/thinking',
  streaming: '/finance/receivables/assistant/streaming',
  stopped: '/finance/receivables/assistant/stopped',
  failed: '/finance/receivables/assistant/error',
  /** One receivable or supplier invoice the answers link to. */
  record: (id: string) => `/finance/records/${id}`,
  /** The "Ask" page, before a question and with each answer. */
  ask: '/ask',
  askAnswer: (key: AnswerKey) => `/ask/${key}`,
}

export type AnswerKey = 'overdue' | 'revenue' | 'post' | 'salaries'

export const ASSISTANT = 'Liro Assistant'

export const QUESTIONS: Record<AnswerKey, string> = {
  overdue: 'Which invoices are overdue more than 30 days?',
  revenue: 'How did revenue change this quarter?',
  post: 'Post the Beton Mix invoice',
  salaries: 'What is the average gross salary on the sites?',
}

/** The key of a question the examples can answer; a typed one is matched loosely. */
export function answerKeyOf(question: string): AnswerKey | null {
  const text = question.toLowerCase()
  for (const key of Object.keys(QUESTIONS) as AnswerKey[]) {
    if (QUESTIONS[key].toLowerCase() === text) return key
  }
  if (text.includes('overdue') || text.includes('late')) return 'overdue'
  if (text.includes('revenue') || text.includes('quarter')) return 'revenue'
  if (text.includes('beton') || text.includes('post')) return 'post'
  if (text.includes('salar') || text.includes('wage') || text.includes('pay ')) return 'salaries'
  return null
}

export const SUGGESTED: readonly string[] = [
  QUESTIONS.overdue,
  QUESTIONS.revenue,
  QUESTIONS.post,
  QUESTIONS.salaries,
]

export const RECENT: readonly string[] = [
  'Which suppliers did we pay the most in September?',
  'What did we spend on fuel for the sites in September?',
  'Who has not signed the 2025 Work Rulebook yet?',
]

export const INTRO =
  'Ask about Kvadrat Gradnja d.o.o.’s invoices, payments, VAT and people in your own words. I answer from the data you may see, link the records I used, and propose actions that wait for you.'

export const NOTE = 'Answers use only the data you may see. Check them before you act.'

export const REPORT_REASONS = [
  { value: 'figures', label: 'The figures are wrong' },
  { value: 'missing', label: 'Something is missing' },
  { value: 'other-question', label: 'It answers another question' },
  { value: 'other', label: 'Something else' },
]

// ── Receivables (the page under the panel) ───────────────────────────────────────────────────

export interface Receivable {
  id: string
  customer: string
  issued: string
  due: string
  /** Decimal strings, RSD. */
  total: string
  open: string
  /** Whole days past due on 14.10.2026, from the application; 0 when not due yet. */
  daysLate: number
}

export const RECEIVABLES: readonly Receivable[] = [
  {
    id: 'F-2026-0341',
    customer: 'Stanogradnja Plus d.o.o.',
    issued: '2026-07-29',
    due: '2026-08-28',
    total: '236000.00',
    open: '236000.00',
    daysLate: 47,
  },
  {
    id: 'F-2026-0352',
    customer: 'Gradska toplana Novi Sad',
    issued: '2026-08-06',
    due: '2026-09-05',
    total: '284800.00',
    open: '184800.00',
    daysLate: 39,
  },
  {
    id: 'F-2026-0358',
    customer: 'Stanogradnja Plus d.o.o.',
    issued: '2026-08-12',
    due: '2026-09-11',
    total: '91600.00',
    open: '91600.00',
    daysLate: 33,
  },
  {
    id: 'F-2026-0397',
    customer: 'Gradska toplana Novi Sad',
    issued: '2026-08-27',
    due: '2026-09-26',
    total: '412500.00',
    open: '412500.00',
    daysLate: 18,
  },
  {
    id: 'F-2026-0414',
    customer: 'Stanogradnja Plus d.o.o.',
    issued: '2026-09-08',
    due: '2026-10-08',
    total: '158400.00',
    open: '158400.00',
    daysLate: 6,
  },
  {
    id: 'F-2026-0423',
    customer: 'Gradska toplana Novi Sad',
    issued: '2026-09-30',
    due: '2026-10-30',
    total: '1284600.00',
    open: '1284600.00',
    daysLate: 0,
  },
  {
    id: 'F-2026-0428',
    customer: 'Stanogradnja Plus d.o.o.',
    issued: '2026-10-07',
    due: '2026-11-06',
    total: '322800.00',
    open: '322800.00',
    daysLate: 0,
  },
]

/** The open total of the list, from the application. */
export const RECEIVABLES_OPEN = '2690700.00'
/** Overdue more than 30 days: three invoices, from the application. */
export const OVERDUE_30 = RECEIVABLES.filter((each) => each.daysLate > 30)
export const OVERDUE_30_TOTAL = '512400.00'

// ── The answers' figures ─────────────────────────────────────────────────────────────────────

/** Revenue by month, thousands of RSD without VAT: this year and last. */
export const REVENUE = {
  categories: [
    { key: 'jul', label: 'Jul' },
    { key: 'aug', label: 'Aug' },
    { key: 'sep', label: 'Sep' },
  ],
  values: {
    this: { jul: '4620', aug: '4410', sep: '5830' },
    last: { jul: '4180', aug: '4050', sep: '4990' },
  },
  /** The quarter's revenue and its change, from the application. */
  total: '14860000.00',
  lastTotal: '13220000.00',
  change: '12.4',
}

/** The supplier invoice in the inbox (the shared facts of Round 7). */
export const BETON_MIX = {
  id: 'UF-2026-1187',
  supplier: 'Beton Mix d.o.o.',
  number: '2026-1187',
  date: '2026-10-12',
  due: '2026-11-11',
  base: '245000.00',
  vatRate: '20',
  vat: '49000.00',
  total: '294000.00',
  account: '5120 Construction material',
  order: 'NB-2026-0213',
  /** What posting gives, from the application. */
  entry: '2026-0884',
}

export const NO_SALARIES =
  'You do not have permission to see salaries. Ask Kvadrat Gradnja d.o.o.’s administrator for the Payroll role if you need them.'

export const ERROR_TEXT =
  'The sales data could not be read just now. Your question was kept; try again in a minute.'

// ── The application's sums, checked when the examples load (as dataset-checks.ts) ──────────────

function check(name: string, actual: bigint, expected: string) {
  if (actual !== paras(expected)) throw new Error(`data-X: ${name} does not add up`)
}
check('Open receivables', sumUnits(RECEIVABLES.map((each) => paras(each.open))), RECEIVABLES_OPEN)
check(
  'Overdue more than 30 days',
  sumUnits(OVERDUE_30.map((each) => paras(each.open))),
  OVERDUE_30_TOTAL,
)
check('Beton Mix total', paras(BETON_MIX.base) + paras(BETON_MIX.vat), BETON_MIX.total)
