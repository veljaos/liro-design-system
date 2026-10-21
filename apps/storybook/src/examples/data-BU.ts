/*
 * Group BU's dataset (P5.80, scheduled reports): Kvadrat Gradnja d.o.o.'s reports sent by e-mail
 * on a schedule, seen by Milica Petrović on 14 October 2026 at 09:40 (Europe/Belgrade). Every
 * schedule's words ("Every Monday at 07:00"), next runs, run states, sizes and messages are the
 * application's: nothing here or in the screens computes a date or a count of a schedule. The
 * figures in the e-mails are the ones the other groups already show (receivables of group X, the
 * budget of group AR, the trial balance of group AL). Invented data; addresses at example.com.
 */

export const BU_TODAY = '2026-10-14'
export const BU_NOW = '2026-10-14T09:40:00+02:00'

export const BU_ROUTES = {
  list: '/analytics/scheduled',
  schedule: (id: string) => `/analytics/scheduled/${id}`,
  /** The weekly receivables overview to the director. */
  receivables: '/analytics/scheduled/rs-01',
  /** The same, "Send now" asked, as the application restores it. */
  sendNow: '/analytics/scheduled/rs-01?send=1',
  /** The budget report whose last run failed. */
  failed: '/analytics/scheduled/rs-04',
  /** The site report the director paused. */
  paused: '/analytics/scheduled/rs-05',
  edit: '/analytics/scheduled/rs-01/edit',
  create: '/analytics/scheduled/new',
  /** The new schedule after "Save" with an outside address that is not one, and no subject. */
  createChecked: '/analytics/scheduled/new?checked=1',
} as const

/** The time zone the schedules run in, as the application writes it. */
export const TIME_ZONE = 'Europe/Belgrade (CEST, UTC+02:00)'

// ── The application's lists ──────────────────────────────────────────────────────────────────

/** A report the application can send, with its parameters (ReportPage's fields). */
export interface ReportKind {
  id: string
  name: string
  description: string
  /** Each parameter's choices, from the application; the first is the default. */
  parameters: readonly {
    id: string
    label: string
    options: readonly { value: string; label: string }[]
  }[]
}

export const REPORT_KINDS: readonly ReportKind[] = [
  {
    id: 'receivables',
    name: 'Receivables overview',
    description: 'Open and overdue invoices by customer, oldest first.',
    parameters: [
      {
        id: 'asOf',
        label: 'As of',
        options: [
          { value: 'run', label: 'The day it is sent' },
          { value: 'month-end', label: 'The last day of the previous month' },
        ],
      },
      {
        id: 'customers',
        label: 'Customers',
        options: [
          { value: 'all', label: 'All customers' },
          { value: 'overdue', label: 'Only customers with overdue invoices' },
        ],
      },
    ],
  },
  {
    id: 'trial-balance',
    name: 'Trial balance',
    description: 'Opening, turnover and closing balance of every account.',
    parameters: [
      {
        id: 'period',
        label: 'Period',
        options: [
          { value: 'previous-month', label: 'The previous month' },
          { value: 'year-to-date', label: 'From 1 January to the previous month' },
        ],
      },
      {
        id: 'level',
        label: 'Accounts',
        options: [
          { value: 'synthetic', label: 'Synthetic accounts (4 digits)' },
          { value: 'analytic', label: 'Analytic accounts' },
        ],
      },
    ],
  },
  {
    id: 'budget',
    name: 'Budget against actual',
    description: 'Plan, actual and variance by cost centre or project.',
    parameters: [
      {
        id: 'by',
        label: 'By',
        options: [
          { value: 'centres', label: 'Cost centre' },
          { value: 'projects', label: 'Project and cost type' },
        ],
      },
      {
        id: 'detail',
        label: 'Detail',
        options: [
          { value: 'lines', label: 'Lines and their entries' },
          { value: 'totals', label: 'Totals only' },
        ],
      },
    ],
  },
  {
    id: 'site',
    name: 'Project progress',
    description: 'Phases, done, spent against planned and the risks.',
    parameters: [
      {
        id: 'project',
        label: 'Project',
        options: [
          { value: 'liman-4', label: 'Residential building Liman 4' },
          { value: 'bulevar-24', label: 'Bulevar Evrope 24' },
        ],
      },
    ],
  },
  {
    id: 'cash',
    name: 'Cash book',
    description: 'The day’s receipts and payments and the balance.',
    parameters: [
      {
        id: 'desk',
        label: 'Cash desk',
        options: [{ value: 'main', label: 'Main cash desk' }],
      },
    ],
  },
  {
    id: 'vat',
    name: 'VAT summary',
    description: 'Output and input VAT by rate for the quarter.',
    parameters: [
      {
        id: 'quarter',
        label: 'Quarter',
        options: [{ value: 'previous', label: 'The previous quarter' }],
      },
    ],
  },
  {
    id: 'stock',
    name: 'Items below their minimum',
    description: 'Items whose stock is under the minimum, by warehouse.',
    parameters: [
      {
        id: 'warehouse',
        label: 'Warehouse',
        options: [
          { value: 'all', label: 'Every warehouse' },
          { value: 'central', label: 'Central warehouse' },
          { value: 'liman', label: 'Site Liman 4' },
        ],
      },
    ],
  },
]

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly'

export const FREQUENCIES: readonly { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
  { value: 'quarterly', label: 'Every quarter' },
]

/** Weekdays by number (1 Monday … 7 Sunday); their names come from the provider's locale. */
export const WEEKDAYS = ['1', '2', '3', '4', '5', '6', '7'] as const

/** The days of a month a schedule may run on: 1–28 and the last day, from the application. */
export const MONTH_DAYS: readonly { value: string; label: string }[] = [
  ...Array.from({ length: 28 }, (_, index) => ({
    value: String(index + 1),
    label: `Day ${String(index + 1)}`,
  })),
  { value: 'last', label: 'The last day' },
]

/** The times a schedule may run at: every half hour from 06:00 to 20:00, from the application. */
export const TIMES: readonly string[] = Array.from({ length: 29 }, (_, index) => {
  const minutes = 6 * 60 + index * 30
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
  return `${hours}:${minutes % 60 === 0 ? '00' : '30'}`
})

export type ReportFormat = 'pdf' | 'xlsx' | 'csv'

export const FORMATS: readonly { value: ReportFormat; label: string; description: string }[] = [
  { value: 'pdf', label: 'PDF', description: 'To read and print.' },
  { value: 'xlsx', label: 'Excel', description: 'To work with the figures.' },
  { value: 'csv', label: 'CSV', description: 'To import into another program.' },
]

export const FORMAT_LABELS: Record<ReportFormat, string> = { pdf: 'PDF', xlsx: 'Excel', csv: 'CSV' }

export type WhenEmpty = 'send' | 'skip'

/** A person of the company who can receive reports (people of group AJ). */
export interface Recipient {
  id: string
  name: string
  detail: string
  email: string
}

export const PEOPLE: readonly Recipient[] = [
  {
    id: 'nenad',
    name: 'Nenad Kovačević',
    detail: 'Director',
    email: 'nenad.kovacevic@example.com',
  },
  {
    id: 'milica',
    name: 'Milica Petrović',
    detail: 'Head of finance and administration',
    email: 'milica.petrovic@example.com',
  },
  {
    id: 'ivana',
    name: 'Ivana Stojanović',
    detail: 'Accountant',
    email: 'ivana.stojanovic@example.com',
  },
  {
    id: 'snezana',
    name: 'Snežana Popović',
    detail: 'Site manager, Residential building Liman 4',
    email: 'snezana.popovic@example.com',
  },
  {
    id: 'dragan',
    name: 'Dragan Ilić',
    detail: 'Sales manager',
    email: 'dragan.ilic@example.com',
  },
  {
    id: 'jelena',
    name: 'Jelena Stojković',
    detail: 'Planning engineer',
    email: 'jelena.stojkovic@example.com',
  },
]

/** Addresses outside the company already used in a schedule: the accountant's firm. */
export const OUTSIDE: readonly Recipient[] = [
  {
    id: 'snezana.jelic@example.com',
    name: 'snezana.jelic@example.com',
    detail: 'Outside the company · Knjigovodstvo Jelić',
    email: 'snezana.jelic@example.com',
  },
  {
    id: 'marko.jelic@example.com',
    name: 'marko.jelic@example.com',
    detail: 'Outside the company · Knjigovodstvo Jelić',
    email: 'marko.jelic@example.com',
  },
]

/** The application's check of an outside address, in its words (null when it is fine). */
export function outsideAddressProblem(text: string, known: readonly string[]): string | null {
  const value = text.trim()
  if (value === '') return 'Enter an address.'
  const at = value.indexOf('@')
  const dot = value.lastIndexOf('.')
  if (/\s/.test(value) || at <= 0 || at !== value.lastIndexOf('@') || dot < at + 2) {
    return 'Enter a whole address, like name@example.com.'
  }
  if (known.includes(value.toLowerCase())) return 'This address already gets the report.'
  return null
}

// ── The schedules ─────────────────────────────────────────────────────────────────────────────

export type RunState = 'Sent' | 'Failed' | 'Skipped'

/** One run of a schedule, from the application's log. */
export interface ReportRun {
  id: string
  /** When it ran (an instant). */
  at: string
  state: RunState
  /** "1 of 1" — the application's count of who got it. */
  delivered: string
  /** The file sent, with its size in the application's words; null when nothing was sent. */
  file: { name: string; size: string } | null
  /** Why it failed or was skipped, in the application's words. */
  note?: string
}

export interface Schedule {
  id: string
  name: string
  report: string
  /** The chosen value of each of the report's parameters. */
  parameters: Record<string, string>
  frequency: Frequency
  /** The weekday (1–7) for a weekly schedule, the day ("1"…"28", "last") for the others. */
  day: string
  time: string
  /** The schedule in the application's words. */
  when: string
  people: readonly string[]
  outside: readonly string[]
  format: ReportFormat
  whenEmpty: WhenEmpty
  subject: string
  message: string
  active: boolean
  /** Who paused it, when and why, in the application's words. */
  pausedNote?: string
  /** The next runs, from the application (instants); empty while paused. */
  next: readonly string[]
  runs: readonly ReportRun[]
  createdBy: string
}

const run = (
  id: string,
  at: string,
  state: RunState,
  delivered: string,
  file: ReportRun['file'],
  note?: string,
): ReportRun => ({ id, at, state, delivered, file, ...(note === undefined ? {} : { note }) })

export const SCHEDULES: readonly Schedule[] = [
  {
    id: 'rs-01',
    name: 'Weekly receivables for the director',
    report: 'receivables',
    parameters: { asOf: 'run', customers: 'all' },
    frequency: 'weekly',
    day: '1',
    time: '07:00',
    when: 'Every Monday at 07:00',
    people: ['nenad'],
    outside: [],
    format: 'pdf',
    whenEmpty: 'send',
    subject: 'Receivables on {{date}}',
    message:
      'Good morning,\n\nthe receivables overview of Kvadrat Gradnja d.o.o. is attached: open and overdue invoices by customer, oldest first.',
    active: true,
    next: ['2026-10-19T07:00:00+02:00', '2026-10-26T07:00:00+01:00', '2026-11-02T07:00:00+01:00'],
    runs: [
      run('r-112', '2026-10-12T07:00:00+02:00', 'Sent', '1 of 1', {
        name: 'receivables-2026-10-12.pdf',
        size: '412 KB',
      }),
      run('r-105', '2026-10-05T07:00:00+02:00', 'Sent', '1 of 1', {
        name: 'receivables-2026-10-05.pdf',
        size: '398 KB',
      }),
      run('r-098', '2026-09-28T07:00:00+02:00', 'Sent', '1 of 1', {
        name: 'receivables-2026-09-28.pdf',
        size: '405 KB',
      }),
      run(
        'r-091',
        '2026-09-21T07:00:00+02:00',
        'Failed',
        '0 of 1',
        null,
        'The mail server did not answer. The report was sent again at 07:15.',
      ),
      run('r-092', '2026-09-21T07:15:00+02:00', 'Sent', '1 of 1', {
        name: 'receivables-2026-09-21.pdf',
        size: '401 KB',
      }),
      run('r-084', '2026-09-14T07:00:00+02:00', 'Sent', '1 of 1', {
        name: 'receivables-2026-09-14.pdf',
        size: '387 KB',
      }),
    ],
    createdBy: 'Milica Petrović on 02.03.2026.',
  },
  {
    id: 'rs-02',
    name: 'Monthly trial balance for Knjigovodstvo Jelić',
    report: 'trial-balance',
    parameters: { period: 'previous-month', level: 'analytic' },
    frequency: 'monthly',
    day: '3',
    time: '06:00',
    when: 'Every month on the 3rd at 06:00',
    people: ['milica'],
    outside: ['snezana.jelic@example.com', 'marko.jelic@example.com'],
    format: 'xlsx',
    whenEmpty: 'send',
    subject: 'Kvadrat Gradnja d.o.o. — trial balance for {{period}}',
    message:
      'Dear Snežana and Marko,\n\nthe trial balance for the previous month is attached, by analytic account.',
    active: true,
    next: ['2026-11-03T06:00:00+01:00', '2026-12-03T06:00:00+01:00', '2027-01-03T06:00:00+01:00'],
    runs: [
      run('r-108', '2026-10-03T06:00:00+02:00', 'Sent', '3 of 3', {
        name: 'trial-balance-2026-09.xlsx',
        size: '1,2 MB',
      }),
      run('r-071', '2026-09-03T06:00:00+02:00', 'Sent', '3 of 3', {
        name: 'trial-balance-2026-08.xlsx',
        size: '1,1 MB',
      }),
    ],
    createdBy: 'Milica Petrović on 15.01.2026.',
  },
  {
    id: 'rs-03',
    name: 'Daily cash book',
    report: 'cash',
    parameters: { desk: 'main' },
    frequency: 'daily',
    day: '',
    time: '19:00',
    when: 'Every day at 19:00',
    people: ['ivana', 'milica'],
    outside: [],
    format: 'pdf',
    whenEmpty: 'skip',
    subject: 'Cash book, {{date}}',
    message: 'The day’s receipts and payments of the main cash desk.',
    active: true,
    next: ['2026-10-14T19:00:00+02:00', '2026-10-15T19:00:00+02:00', '2026-10-16T19:00:00+02:00'],
    runs: [
      run('r-114', '2026-10-13T19:00:00+02:00', 'Sent', '2 of 2', {
        name: 'cash-book-2026-10-13.pdf',
        size: '96 KB',
      }),
      run(
        'r-111',
        '2026-10-11T19:00:00+02:00',
        'Skipped',
        '—',
        null,
        'Nothing to send: no receipts or payments that day.',
      ),
    ],
    createdBy: 'Milica Petrović on 10.06.2026.',
  },
  {
    id: 'rs-04',
    name: 'Budget against actual by cost centre',
    report: 'budget',
    parameters: { by: 'centres', detail: 'lines' },
    frequency: 'monthly',
    day: '5',
    time: '07:00',
    when: 'Every month on the 5th at 07:00',
    people: ['nenad', 'milica', 'snezana', 'jelena'],
    outside: [],
    format: 'xlsx',
    whenEmpty: 'send',
    subject: 'Budget 2026 against actual, {{period}}',
    message: 'Plan, actual and variance by cost centre, with the entries of each line.',
    active: true,
    next: ['2026-11-05T07:00:00+01:00', '2026-12-05T07:00:00+01:00', '2027-01-05T07:00:00+01:00'],
    runs: [
      run(
        'r-109',
        '2026-10-05T07:00:00+02:00',
        'Failed',
        '0 of 4',
        null,
        'Not sent: the file (12,4 MB) is larger than the 10 MB the mail server accepts. Choose “Totals only” or CSV, or send it now with fewer cost centres.',
      ),
      run('r-073', '2026-09-05T07:00:00+02:00', 'Sent', '4 of 4', {
        name: 'budget-2026-08.xlsx',
        size: '9,6 MB',
      }),
      run('r-041', '2026-08-05T07:00:00+02:00', 'Sent', '4 of 4', {
        name: 'budget-2026-07.xlsx',
        size: '8,9 MB',
      }),
    ],
    createdBy: 'Nenad Kovačević on 20.01.2026.',
  },
  {
    id: 'rs-05',
    name: 'Liman 4 progress, Friday',
    report: 'site',
    parameters: { project: 'liman-4' },
    frequency: 'weekly',
    day: '5',
    time: '15:00',
    when: 'Every Friday at 15:00',
    people: ['nenad', 'snezana'],
    outside: [],
    format: 'pdf',
    whenEmpty: 'send',
    subject: 'Residential building Liman 4 — the week to {{date}}',
    message: 'Phases, done, spent against planned and the risks of the week.',
    active: false,
    pausedNote: 'Paused by Nenad Kovačević on 01.10.2026.: until the roof works start.',
    next: [],
    runs: [
      run('r-102', '2026-09-26T15:00:00+02:00', 'Sent', '2 of 2', {
        name: 'liman-4-2026-09-26.pdf',
        size: '2,3 MB',
      }),
      run('r-095', '2026-09-19T15:00:00+02:00', 'Sent', '2 of 2', {
        name: 'liman-4-2026-09-19.pdf',
        size: '2,2 MB',
      }),
    ],
    createdBy: 'Snežana Popović on 06.04.2026.',
  },
  {
    id: 'rs-06',
    name: 'Quarterly VAT summary',
    report: 'vat',
    parameters: { quarter: 'previous' },
    frequency: 'quarterly',
    day: '10',
    time: '08:00',
    when: 'Every quarter on the 10th of its first month at 08:00',
    people: ['milica'],
    outside: ['snezana.jelic@example.com'],
    format: 'csv',
    whenEmpty: 'send',
    subject: 'VAT summary, {{period}}',
    message: 'Output and input VAT by rate for the previous quarter.',
    active: true,
    next: ['2027-01-10T08:00:00+01:00', '2027-04-10T08:00:00+02:00', '2027-07-10T08:00:00+02:00'],
    runs: [
      run('r-110', '2026-10-10T08:00:00+02:00', 'Sent', '2 of 2', {
        name: 'vat-2026-q3.csv',
        size: '18 KB',
      }),
    ],
    createdBy: 'Milica Petrović on 05.01.2026.',
  },
  {
    id: 'rs-07',
    name: 'Items below their minimum, Monday',
    report: 'stock',
    parameters: { warehouse: 'all' },
    frequency: 'weekly',
    day: '1',
    time: '06:30',
    when: 'Every Monday at 06:30',
    people: ['jelena', 'snezana'],
    outside: [],
    format: 'csv',
    whenEmpty: 'skip',
    subject: 'Items below their minimum on {{date}}',
    message: 'Order these items before they run out.',
    active: true,
    next: ['2026-10-19T06:30:00+02:00', '2026-10-26T06:30:00+01:00', '2026-11-02T06:30:00+01:00'],
    runs: [
      run(
        'r-113',
        '2026-10-12T06:30:00+02:00',
        'Skipped',
        '—',
        null,
        'Nothing to send: no item is below its minimum.',
      ),
      run('r-106', '2026-10-05T06:30:00+02:00', 'Sent', '2 of 2', {
        name: 'below-minimum-2026-10-05.csv',
        size: '4 KB',
      }),
    ],
    createdBy: 'Jelena Stojković on 12.05.2026.',
  },
]

export function scheduleById(id: string): Schedule | undefined {
  return SCHEDULES.find((each) => each.id === id)
}

export function reportKind(id: string): ReportKind | undefined {
  return REPORT_KINDS.find((each) => each.id === id)
}

/** The run "Send now" adds, as the application reports it at 09:40. */
export function sentNow(schedule: Schedule): ReportRun {
  const count = String(schedule.people.length + schedule.outside.length)
  return run(
    `now-${schedule.id}`,
    BU_NOW,
    'Sent',
    `${count} of ${count}`,
    { name: `${schedule.report}-2026-10-14.${schedule.format}`, size: '409 KB' },
    'Sent now by Milica Petrović; the schedule is unchanged.',
  )
}

/** The views of the list, by state, from the application. */
export const VIEWS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
  { id: 'failed', label: 'Last run failed' },
] as const

export function inView(schedule: Schedule, view: string): boolean {
  if (view === 'active') return schedule.active
  if (view === 'paused') return !schedule.active
  if (view === 'failed') return schedule.runs[0]?.state === 'Failed'
  return true
}

/** The sample values of the e-mail's preview, from the application. */
export const SAMPLE = {
  date: '19.10.2026.',
  period: 'September 2026',
  from: 'Liro reports <reports@example.com>',
}
