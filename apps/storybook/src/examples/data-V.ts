/*
 * Group V's example data (P5.32, the accountant's workspace): Knjigovodstvo Jelić, an accounting
 * firm in Novi Sad with 214 client companies, on 14 October 2026 at 09:40, Snežana Jelić signed
 * in (Marko Jelić is the other accountant). Fourteen clients are written out — Kvadrat Gradnja
 * d.o.o. among them, with its contact Milica Petrović, who answers the firm's requests in the
 * client portal —, the other 200 are made from name parts, deterministically. Every deadline,
 * state, count, health and order is the application's, played here; the components only show
 * them. Fictitious throughout: tax numbers are illustrative, e-mail addresses at example.com.
 * Not part of the package. No classes here.
 */
import type { ShellCompany, Tone } from '@veljaos/ui'

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const V_ROUTES = {
  /** The clients overview, "My clients" (Snežana's). */
  clients: '/accountant/clients',
  allClients: '/accountant/clients?view=all',
  attention: '/accountant/clients?view=attention',
  /** The overview with the company switcher open. */
  switcher: '/accountant/clients?switch=open',
  /** The overview with "Ask the client" open for Kvadrat Gradnja d.o.o. */
  ask: '/accountant/clients?ask=kvadrat',
  /** The same, already filled in with a question asked and checked: the errors. */
  askErrors: '/accountant/clients?ask=kvadrat&errors=1',
  deadlines: '/accountant/deadlines',
  deadlinesAgenda: '/accountant/deadlines?view=agenda',
  deadlinesDay: '/accountant/deadlines?day=2026-10-15',
  close: (id: string) => `/accountant/clients/${id}/close`,
  /** The client portal of Kvadrat Gradnja d.o.o. (Milica Petrović). */
  portal: '/client-portal/requests',
  request: (id: string) => `/client-portal/requests/${id}`,
  /** Request 118 with one document uploaded and the others still to do. */
  requestUploaded: '/client-portal/requests/REQ-2026-118?uploaded=1',
  /** Request 119 answered and sent. */
  requestSent: '/client-portal/requests/REQ-2026-119?sent=1',
  documents: '/client-portal/documents',
} as const

// ── Now ───────────────────────────────────────────────────────────────────────────────────────

export const V_TODAY = '2026-10-14'
export const V_NOW = '2026-10-14T09:40:00+02:00'

// ── The firm ──────────────────────────────────────────────────────────────────────────────────

export const FIRM = {
  name: 'Knjigovodstvo Jelić',
  city: 'Novi Sad',
  clientCount: 214,
}

export type AccountantId = 'snezana' | 'marko'

export const ACCOUNTANTS: Record<AccountantId, { id: AccountantId; name: string; email: string }> =
  {
    snezana: { id: 'snezana', name: 'Snežana Jelić', email: 'snezana.jelic@example.com' },
    marko: { id: 'marko', name: 'Marko Jelić', email: 'marko.jelic@example.com' },
  }

/** The one signed in. */
export const ME: AccountantId = 'snezana'

// ── Clients ───────────────────────────────────────────────────────────────────────────────────

export type ClientHealth = 'On track' | 'Needs attention' | 'At risk' | 'New client'

/** The firm's health-to-tone map (the application's data): "At risk" waits on no one. */
export const HEALTH_TONES: Record<ClientHealth, Tone> = {
  'On track': 'success',
  'Needs attention': 'warning',
  'At risk': 'danger',
  'New client': 'neutral',
}

export type DeadlineKind = 'vat' | 'payroll' | 'annual'
export type DeadlineState = 'Submitted' | 'Prepared' | 'Not started' | 'Overdue'

/** A deadline's state in words and tone: done green, on its way blue, waiting amber, late red. */
export const DEADLINE_TONES: Record<DeadlineState, Tone> = {
  Submitted: 'success',
  Prepared: 'info',
  'Not started': 'warning',
  Overdue: 'danger',
}

export const DEADLINE_KINDS: Record<DeadlineKind, string> = {
  vat: 'VAT return',
  payroll: 'Payroll tax return',
  annual: 'Annual accounts',
}

export interface ClientDeadline {
  id: string
  kind: DeadlineKind
  /** In full: "VAT return, September 2026". */
  label: string
  due: string
  state: DeadlineState
}

export type ClientProblem =
  'Missing documents' | 'Deadline overdue' | 'Open questions' | 'Bank not reconciled'

export const PROBLEMS: readonly ClientProblem[] = [
  'Missing documents',
  'Deadline overdue',
  'Open questions',
  'Bank not reconciled',
]

export interface AccountingClient {
  id: string
  name: string
  taxId: string
  accountant: AccountantId
  /** Upcoming and overdue deadlines, by date. */
  deadlines: ClientDeadline[]
  /** Documents the firm waits for, and what they are. */
  missing: number
  missingNote?: string
  openTasks: number
  lastActivity: string
  lastActivityNote: string
  health: ClientHealth
  /** Why, in words, when not on track. */
  healthReason?: string
  problems: ClientProblem[]
  /** The contact person at the client. */
  contact?: string
  /** The client's own Liro account, when not active. */
  accountStatus?: { label: string; tone: Tone }
}

const VAT_SEPTEMBER = 'VAT return, September 2026'
const PAYROLL_SEPTEMBER = 'Payroll tax return, September salaries'
const ANNUAL = 'Annual accounts, fiscal year to 30.06.2026'

function vat(state: DeadlineState): ClientDeadline {
  return { id: 'vat-2026-09', kind: 'vat', label: VAT_SEPTEMBER, due: '2026-10-15', state }
}

function payroll(due: string, state: DeadlineState): ClientDeadline {
  return { id: 'payroll-2026-09', kind: 'payroll', label: PAYROLL_SEPTEMBER, due, state }
}

function annual(state: DeadlineState): ClientDeadline {
  return { id: 'annual-2026', kind: 'annual', label: ANNUAL, due: '2026-10-31', state }
}

/** At an instant of October 2026 in Belgrade. */
function at(day: number, time: string): string {
  return `2026-10-${String(day).padStart(2, '0')}T${time}:00+02:00`
}

/** The clients written out, in no order (the application orders them). */
const FEATURED: AccountingClient[] = [
  {
    id: 'kvadrat',
    name: 'Kvadrat Gradnja d.o.o.',
    taxId: '108452317',
    accountant: 'snezana',
    deadlines: [payroll('2026-10-15', 'Submitted'), vat('Prepared')],
    missing: 3,
    missingNote: 'A supplier invoice, a bank statement and a credit note',
    openTasks: 2,
    lastActivity: at(13, '15:20'),
    lastActivityNote: 'Milica Petrović uploaded 2 documents',
    health: 'At risk',
    healthReason: 'VAT return due tomorrow; 3 documents missing',
    problems: ['Missing documents', 'Open questions'],
    contact: 'Milica Petrović',
  },
  {
    id: 'rakic',
    name: 'Rakić Pekara SZR',
    taxId: '111296603',
    accountant: 'snezana',
    deadlines: [payroll('2026-10-10', 'Overdue'), vat('Not started')],
    missing: 5,
    missingNote: 'Payroll data for September and 4 purchase invoices',
    openTasks: 3,
    lastActivity: at(8, '11:02'),
    lastActivityNote: 'Snežana Jelić called about the payroll data',
    health: 'At risk',
    healthReason: 'Payroll tax return overdue since 10.10.2026.',
    problems: ['Deadline overdue', 'Missing documents'],
    contact: 'Dragana Rakić',
    accountStatus: { label: 'Suspended', tone: 'danger' },
  },
  {
    id: 'medic',
    name: 'Medic Lab Niš d.o.o.',
    taxId: '107819450',
    accountant: 'snezana',
    deadlines: [vat('Prepared'), payroll('2026-10-20', 'Not started')],
    missing: 2,
    missingNote: 'Bank statements since 30.09.2026.',
    openTasks: 1,
    lastActivity: at(12, '14:45'),
    lastActivityNote: 'Sales invoices synced from SEF',
    health: 'Needs attention',
    healthReason: 'Bank statements missing since 30.09.2026.',
    problems: ['Missing documents', 'Bank not reconciled'],
    contact: 'Jelena Stojković',
  },
  {
    id: 'zlatni-klas',
    name: 'Pekara Zlatni klas d.o.o.',
    taxId: '109338271',
    accountant: 'snezana',
    deadlines: [vat('Not started'), payroll('2026-10-15', 'Prepared')],
    missing: 1,
    missingNote: 'Daily fiscal reports for 28.–30.09.',
    openTasks: 1,
    lastActivity: at(13, '18:10'),
    lastActivityNote: 'Daily fiscal report imported',
    health: 'Needs attention',
    healthReason: 'VAT return not started; 1 document missing',
    problems: ['Missing documents'],
    contact: 'Jovana Marković',
  },
  {
    id: 'panonija',
    name: 'Panonija Agro d.o.o.',
    taxId: '104987265',
    accountant: 'snezana',
    deadlines: [vat('Prepared'), payroll('2026-10-15', 'Submitted')],
    missing: 0,
    openTasks: 1,
    lastActivity: at(14, '08:55'),
    lastActivityNote: 'Snežana Jelić asked about an advance payment',
    health: 'Needs attention',
    healthReason: 'One question waits for the client',
    problems: ['Open questions'],
    contact: 'Petar Vuković',
  },
  {
    id: 'stanic',
    name: 'Stanić Elektro STR',
    taxId: '112048376',
    accountant: 'snezana',
    deadlines: [payroll('2026-10-20', 'Not started')],
    missing: 0,
    openTasks: 4,
    lastActivity: at(14, '08:30'),
    lastActivityNote: 'Opening balances entered',
    health: 'New client',
    healthReason: 'Setting up: 2 of 5 steps done',
    problems: [],
    contact: 'Milan Stanić',
  },
  {
    id: 'kod-mike',
    name: 'Kafić Kod Mike SZR',
    taxId: '112590337',
    accountant: 'snezana',
    deadlines: [payroll('2026-10-15', 'Submitted')],
    missing: 0,
    openTasks: 0,
    lastActivity: at(13, '22:40'),
    lastActivityNote: 'Daily fiscal report imported',
    health: 'On track',
    problems: [],
    contact: 'Mika Jovanović',
  },
  {
    id: 'jelic',
    name: 'Knjigovodstvo Jelić',
    taxId: '110583224',
    accountant: 'snezana',
    deadlines: [vat('Submitted'), payroll('2026-10-15', 'Submitted')],
    missing: 0,
    openTasks: 0,
    lastActivity: at(10, '12:00'),
    lastActivityNote: 'VAT return submitted',
    health: 'On track',
    problems: [],
  },
  {
    id: 'drina',
    name: 'Drina Prevoz d.o.o.',
    taxId: '101665092',
    accountant: 'marko',
    deadlines: [vat('Submitted'), payroll('2026-10-15', 'Submitted')],
    missing: 0,
    openTasks: 0,
    lastActivity: at(12, '09:15'),
    lastActivityNote: 'VAT return submitted',
    health: 'On track',
    problems: [],
    contact: 'Nenad Ilić',
  },
  {
    id: 'bojovic',
    name: 'Bojović i sinovi d.o.o.',
    taxId: '109773148',
    accountant: 'marko',
    deadlines: [vat('Not started'), payroll('2026-10-20', 'Not started')],
    missing: 0,
    openTasks: 12,
    lastActivity: at(13, '10:05'),
    lastActivityNote: 'Purchase invoices imported',
    health: 'Needs attention',
    healthReason: '12 tasks open; VAT return not started',
    problems: [],
    contact: 'Zoran Bojović',
  },
  {
    id: 'vojvodjanka',
    name: 'Vojvođanka Mlin a.d.',
    taxId: '100421987',
    accountant: 'marko',
    deadlines: [vat('Submitted'), annual('Prepared')],
    missing: 0,
    openTasks: 1,
    lastActivity: at(13, '13:30'),
    lastActivityNote: 'Marko Jelić prepared the annual accounts',
    health: 'On track',
    problems: [],
    contact: 'Sava Petrov',
  },
  {
    id: 'dunav',
    name: 'Bistro Dunav d.o.o.',
    taxId: '108771904',
    accountant: 'marko',
    deadlines: [vat('Submitted'), payroll('2026-10-15', 'Submitted')],
    missing: 0,
    openTasks: 0,
    lastActivity: at(14, '07:50'),
    lastActivityNote: 'Daily fiscal report imported',
    health: 'On track',
    problems: [],
    contact: 'Ivan Lukić',
  },
  {
    id: 'fruska',
    name: 'Hotel Fruška d.o.o.',
    taxId: '106234519',
    accountant: 'marko',
    deadlines: [payroll('2026-10-15', 'Not started'), vat('Prepared')],
    missing: 0,
    openTasks: 2,
    lastActivity: at(13, '16:40'),
    lastActivityNote: 'Payroll for September approved',
    health: 'Needs attention',
    healthReason: 'Payroll tax return due tomorrow, not started',
    problems: [],
    contact: 'Ana Marić',
  },
  {
    id: 'medija',
    name: 'Medija Print d.o.o.',
    taxId: '105612398',
    accountant: 'marko',
    deadlines: [vat('Overdue')],
    missing: 4,
    missingNote: 'Sales invoices for August and September',
    openTasks: 2,
    lastActivity: at(1, '10:20'),
    lastActivityNote: 'Marko Jelić sent a reminder',
    health: 'At risk',
    healthReason: 'VAT return for August overdue since 15.09.2026.',
    problems: ['Deadline overdue', 'Missing documents'],
    contact: 'Goran Medić',
  },
]

const FIRST = [
  'Agro',
  'Auto',
  'Bačka',
  'Bel',
  'Dunav',
  'Elektro',
  'Fruška',
  'Grad',
  'Info',
  'Lim',
  'Metal',
  'Novi',
  'Panon',
  'Petro',
  'Sava',
  'Sirmium',
  'Srem',
  'Tisa',
  'Zlatni',
  'Zora',
]
const SECOND = [
  'Promet',
  'Servis',
  'Trade',
  'Gradnja',
  'Plast',
  'Mlin',
  'Prevoz',
  'Kom',
  'Tim',
  'Dent',
  'Market',
  'Projekt',
]
const FORMS = ['d.o.o.', 'SZR', 'd.o.o.', 'STR', 'd.o.o.', 'PR', 'a.d.']
const ACTIVITY_NOTES = [
  'Uploaded 3 documents',
  'Bank statement imported',
  'Answered a question',
  'Sales invoices synced from SEF',
  'Payroll approved',
  'Purchase invoices imported',
]

/** The 200 other clients, from name parts: the same every time. */
function generated(index: number): AccountingClient {
  const name = `${FIRST[index % FIRST.length] ?? ''} ${SECOND[Math.floor(index / FIRST.length) % SECOND.length] ?? ''} ${FORMS[index % FORMS.length] ?? ''}`
  const vatPayer = index % 5 !== 4
  const employs = index % 3 !== 2
  const vatState: DeadlineState = (['Submitted', 'Prepared', 'Submitted', 'Not started'] as const)[
    index % 4
  ] as DeadlineState
  const payrollDue = ['2026-10-15', '2026-10-20', '2026-10-30'][(index >> 1) % 3] ?? '2026-10-15'
  const payrollState: DeadlineState =
    payrollDue === '2026-10-15' && index % 2 === 0 ? 'Submitted' : 'Not started'
  const deadlines = [
    ...(vatPayer ? [vat(vatState)] : []),
    ...(employs ? [payroll(payrollDue, payrollState)] : []),
    ...(index % 23 === 0 ? [annual('Prepared')] : []),
  ].sort((a, b) => a.due.localeCompare(b.due))
  const missing = [0, 0, 0, 1, 0, 2, 0, 0, 3, 0][index % 10] ?? 0
  const openTasks = index % 7 === 0 ? 2 : index % 4 === 0 ? 1 : 0
  const day = 14 - (index % 9)
  const time =
    day === 14
      ? `08:${String((index * 7) % 60).padStart(2, '0')}`
      : `${String(8 + (index % 9)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}`
  const vatLate = vatPayer && vatState === 'Not started'
  const health: ClientHealth =
    vatLate && missing > 0
      ? 'At risk'
      : vatLate || missing > 0 || openTasks > 1
        ? 'Needs attention'
        : 'On track'
  const reasons = [
    ...(vatLate ? ['VAT return due tomorrow, not started'] : []),
    ...(missing > 0
      ? [`${String(missing)} ${missing === 1 ? 'document' : 'documents'} missing`]
      : []),
    ...(openTasks > 1 ? [`${String(openTasks)} tasks open`] : []),
  ]
  return {
    id: `client-${String(index + 1).padStart(3, '0')}`,
    name,
    taxId: String(101000000 + index * 48611),
    accountant: index % 2 === 0 ? 'snezana' : 'marko',
    deadlines,
    missing,
    ...(missing > 0
      ? { missingNote: missing === 1 ? 'A purchase invoice' : 'Purchase invoices' }
      : {}),
    openTasks,
    lastActivity: at(day, time),
    lastActivityNote: ACTIVITY_NOTES[index % ACTIVITY_NOTES.length] ?? '',
    health,
    ...(reasons.length > 0 ? { healthReason: reasons.join('; ') } : {}),
    problems: missing > 0 ? ['Missing documents'] : [],
  }
}

const HEALTH_RANK: Record<ClientHealth, number> = {
  'At risk': 0,
  'Needs attention': 1,
  'New client': 2,
  'On track': 3,
}

/** The next deadline not yet submitted, or undefined. */
export function nextOpenDeadline(client: AccountingClient): ClientDeadline | undefined {
  return client.deadlines.find((deadline) => deadline.state !== 'Submitted')
}

/**
 * Every client in the application's order of urgency: at risk first, then needing attention, new
 * clients, on track; within each, the nearest open deadline first, then the most missing
 * documents, then by name.
 */
export const CLIENTS: readonly AccountingClient[] = [
  ...FEATURED,
  ...Array.from({ length: FIRM.clientCount - FEATURED.length }, (_, index) => generated(index)),
].sort(
  (a, b) =>
    HEALTH_RANK[a.health] - HEALTH_RANK[b.health] ||
    (nextOpenDeadline(a)?.due ?? '9999').localeCompare(nextOpenDeadline(b)?.due ?? '9999') ||
    b.missing - a.missing ||
    a.name.localeCompare(b.name, 'sr-Latn'),
)

export const KVADRAT: AccountingClient = (() => {
  const first = FEATURED[0]
  if (first === undefined) throw new Error('No featured client')
  return first
})()

export function clientById(id: string): AccountingClient | undefined {
  return CLIENTS.find((client) => client.id === id)
}

/** The clients in the company switcher: name and tax number, the account's state, a note. */
export const SWITCHER_COMPANIES: ShellCompany[] = [...CLIENTS]
  .sort((a, b) => a.name.localeCompare(b.name, 'sr-Latn'))
  .map((client) => ({
    id: client.id,
    name: client.name,
    description: `PIB ${client.taxId}`,
    ...(client.accountStatus === undefined ? {} : { status: client.accountStatus }),
    ...(client.missing > 0
      ? { note: `${String(client.missing)} missing` }
      : client.openTasks > 0
        ? { note: `${String(client.openTasks)} ${client.openTasks === 1 ? 'task' : 'tasks'}` }
        : {}),
  }))

export const PINNED = ['kvadrat', 'rakic', 'medic']
export const RECENT = ['panonija', 'zlatni-klas', 'stanic']

// ── The month-end checklist ───────────────────────────────────────────────────────────────────

export type CloseStepState = 'done' | 'current' | 'todo' | 'blocked'

export interface CloseStep {
  id: string
  title: string
  description: string
  state: CloseStepState
  doneNote?: string
  blockedReason?: string
  /** What the step leads to. */
  action?: 'ask' | 'open'
  actionLabel?: string
}

/** Kvadrat Gradnja's September, as the firm's application keeps it. */
const KVADRAT_CLOSE: CloseStep[] = [
  {
    id: 'bank',
    title: 'Bank statements imported',
    description: 'Banca Intesa and AIK Banka, 01.–30.09.2026.',
    state: 'done',
    doneNote: 'Completed by Snežana Jelić on 06.10.2026.',
  },
  {
    id: 'sales',
    title: 'Sales invoices matched with SEF',
    description: '42 invoices issued, 42 accepted.',
    state: 'done',
    doneNote: 'Completed by Snežana Jelić on 07.10.2026.',
  },
  {
    id: 'purchases',
    title: 'Purchase invoices posted',
    description: '18 of 21 posted; 3 documents are still missing from the client.',
    state: 'current',
    action: 'ask',
    actionLabel: 'Ask for the missing documents…',
  },
  {
    id: 'payroll',
    title: 'Payroll for September posted',
    description: '27 employees; the payroll tax return was submitted on 10.10.2026.',
    state: 'done',
    doneNote: 'Completed by Snežana Jelić on 10.10.2026.',
  },
  {
    id: 'assets',
    title: 'Depreciation of fixed assets',
    description: 'Monthly depreciation for 64 assets.',
    state: 'todo',
    action: 'open',
    actionLabel: 'Run depreciation',
  },
  {
    id: 'vat',
    title: 'VAT return',
    description: 'Due 15.10.2026.',
    state: 'blocked',
    blockedReason: 'Waits for the purchase invoices (step 3).',
  },
  {
    id: 'lock',
    title: 'Lock September',
    description: 'No more postings in September after this.',
    state: 'blocked',
    blockedReason: 'Waits for every step above.',
  },
]

/** A client's month-end checklist: Kvadrat's as written, the others' from their state. */
export function closeSteps(client: AccountingClient): CloseStep[] {
  if (client.id === KVADRAT.id) return KVADRAT_CLOSE
  const accountant = ACCOUNTANTS[client.accountant].name
  const vatDeadline = client.deadlines.find((deadline) => deadline.kind === 'vat')
  const missing = client.missing > 0
  return [
    {
      id: 'bank',
      title: 'Bank statements imported',
      description: 'Every account, 01.–30.09.2026.',
      state: client.problems.includes('Bank not reconciled') ? 'current' : 'done',
      ...(client.problems.includes('Bank not reconciled')
        ? { action: 'ask' as const, actionLabel: 'Ask for the bank statements…' }
        : { doneNote: `Completed by ${accountant} on 06.10.2026.` }),
    },
    {
      id: 'purchases',
      title: 'Purchase invoices posted',
      description: missing ? `${client.missingNote ?? 'Documents'} still missing.` : 'All posted.',
      state: missing ? 'current' : 'done',
      ...(missing
        ? { action: 'ask' as const, actionLabel: 'Ask for the missing documents…' }
        : { doneNote: `Completed by ${accountant} on 08.10.2026.` }),
    },
    ...(vatDeadline === undefined
      ? []
      : [
          {
            id: 'vat',
            title: 'VAT return',
            description: 'Due 15.10.2026.',
            state:
              vatDeadline.state === 'Submitted'
                ? ('done' as const)
                : missing
                  ? ('blocked' as const)
                  : ('todo' as const),
            ...(vatDeadline.state === 'Submitted'
              ? { doneNote: `Submitted by ${accountant}.` }
              : missing
                ? { blockedReason: 'Waits for the purchase invoices.' }
                : { action: 'open' as const, actionLabel: 'Prepare the return' }),
          },
        ]),
    {
      id: 'lock',
      title: 'Lock September',
      description: 'No more postings in September after this.',
      state: 'blocked',
      blockedReason: 'Waits for every step above.',
    },
  ]
}

// ── Requests to the client ────────────────────────────────────────────────────────────────────

export type RequestKind = 'documents' | 'answers'
export type RequestStatus = 'Open' | 'Answered' | 'Done'

/** On both sides: open waits on the client, answered on the accountant. */
export const REQUEST_TONES: Record<RequestStatus, Tone> = {
  Open: 'warning',
  Answered: 'info',
  Done: 'success',
}

export interface RequestItem {
  id: string
  /** The document asked for, or the question. */
  text: string
  /** A document uploaded for it. */
  file?: { name: string; sizeText: string }
  /** The client's answer to a question. */
  answer?: string
}

export interface ClientRequest {
  id: string
  clientId: string
  kind: RequestKind
  title: string
  from: AccountantId
  sentAt: string
  due: string
  message: string
  items: RequestItem[]
  status: RequestStatus
  /** When the client sent the answers. */
  answeredAt?: string
}

export const REQUESTS: ClientRequest[] = [
  {
    id: 'REQ-2026-118',
    clientId: 'kvadrat',
    kind: 'documents',
    title: 'Documents for the VAT return, September 2026',
    from: 'snezana',
    sentAt: at(13, '16:05'),
    due: '2026-10-15',
    message:
      'Dear Milica, to finish the VAT return for September we still need the three documents below. Please upload them by Thursday morning. Thank you, Snežana',
    items: [
      { id: 'beton-mix', text: 'Beton Mix d.o.o., invoice 2026-1187 of 12.10.2026.' },
      { id: 'statement', text: 'Banca Intesa, statement 189 of 12.10.2026.' },
      {
        id: 'credit-note',
        text: 'Elektro Sistem d.o.o., credit note for invoice 2026-0933',
      },
    ],
    status: 'Open',
  },
  {
    id: 'REQ-2026-119',
    clientId: 'kvadrat',
    kind: 'answers',
    title: 'Two payments to explain',
    from: 'snezana',
    sentAt: at(13, '16:12'),
    due: '2026-10-16',
    message: 'Two payments in September need a word from you before I post them.',
    items: [
      {
        id: 'stanogradnja',
        text: 'Stanogradnja Plus d.o.o. paid 120.000,00 RSD on 03.10.2026. Which invoice does it pay?',
      },
      {
        id: 'toplana',
        text: 'Gradska toplana Novi Sad paid 36.000,00 RSD less than invoice F-2026-0398. Was a discount agreed?',
      },
    ],
    status: 'Open',
  },
  {
    id: 'REQ-2026-102',
    clientId: 'kvadrat',
    kind: 'documents',
    title: 'Documents for August 2026',
    from: 'snezana',
    sentAt: '2026-09-04T10:30:00+02:00',
    due: '2026-09-10',
    message: 'The bank statements and two supplier invoices for August.',
    items: [
      {
        id: 'statements',
        text: 'Banca Intesa, statements 160–171',
        file: { name: 'izvodi-160-171.pdf', sizeText: '1,2 MB' },
      },
    ],
    status: 'Done',
    answeredAt: '2026-09-08T09:12:00+02:00',
  },
  {
    id: 'REQ-2026-087',
    clientId: 'kvadrat',
    kind: 'answers',
    title: 'The advance from Stanogradnja Plus d.o.o.',
    from: 'snezana',
    sentAt: '2026-08-11T14:00:00+02:00',
    due: '2026-08-14',
    message: 'Is the advance of 500.000,00 RSD for the Liman 4 building?',
    items: [
      {
        id: 'advance',
        text: 'Is the advance of 500.000,00 RSD for the Liman 4 building?',
        answer: 'Yes, for the Liman 4 residential building, phase Structure.',
      },
    ],
    status: 'Done',
    answeredAt: '2026-08-12T08:40:00+02:00',
  },
]

/** What "Ask the client" offers for Kvadrat Gradnja first (the application's suggestion). */
export const ASK_DEFAULTS = {
  kind: 'documents' as RequestKind,
  items: [
    'Contract with Elektro Sistem d.o.o. for the excavator rental',
    'Delivery notes from Beton Mix d.o.o., October 2026',
  ],
  due: '2026-10-16',
  message:
    'Dear Milica, for the Liman 4 site we need two more documents. Please upload them in the portal by Friday. Thank you, Snežana',
}

/** The client portal's other documents: what Kvadrat Gradnja sent the firm earlier. */
export const SHARED_DOCUMENTS = [
  { id: 'd1', name: 'izvodi-160-171.pdf', sizeText: '1,2 MB', sent: '2026-09-08' },
  { id: 'd2', name: 'beton-mix-2026-1012.pdf', sizeText: '214 KB', sent: '2026-09-08' },
  { id: 'd3', name: 'ugovor-stanogradnja-avans.pdf', sizeText: '640 KB', sent: '2026-08-12' },
]

/** Milica Petrović at Kvadrat Gradnja d.o.o., in the client portal. */
export const PORTAL_PERSON = {
  name: 'Milica Petrović',
  company: 'Kvadrat Gradnja d.o.o.',
  email: 'milica.petrovic@example.com',
}
