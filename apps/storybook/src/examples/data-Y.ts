/*
 * The example data: the employee portal of Kvadrat Gradnja d.o.o. as Nikola Marković,
 * a site worker on the building site "Residential building Liman 4", sees it on 14.10.2026 at
 * 09:40 — his payslips, his leave and its approvals, an annex to sign, his shifts and his details
 * with a change waiting for HR. Fictitious: every name, number, account and amount is invented and
 * illustrative. The payroll is the application's work (its figures add up here, and
 * dataset-checks could prove it); the components only show it. Not part of the package.
 */
import type {
  Attachment,
  ExpectedFile,
  MyShift,
  Signer,
  StatusTimelineStep,
  Tone,
} from '@veljaos/ui'
import {
  QA_CATEGORIES,
  QA_QUESTIONS,
  type StoryQuestion,
} from '../../../../packages/ui/src/components/questions-and-answers-story-data'

export const Y_TODAY = '2026-10-14'
export const Y_ROUTES = {
  home: '/me',
  payslips: '/me/payslips',
  payslip: (month: string) => `/me/payslips/${month}`,
  payslipPdf: (month: string) => `/me/payslips/${month}/pdf`,
  leave: '/me/leave',
  leaveRequest: (id: string) => `/me/leave/${id}`,
  newLeave: '/me/leave/new',
  /** A new request of a kind (and reason), as a common question starts it. */
  newLeaveOf: (kind: string, reason?: string) =>
    `/me/leave/new?kind=${kind}${reason === undefined ? '' : `&reason=${reason}`}`,
  /** The new request half written, the application's count of working days shown. */
  newLeaveDraft: '/me/leave/new?draft=december',
  shifts: '/me/my-shifts',
  documents: '/me/documents',
  document: (id: string) => `/me/documents/${id}`,
  details: '/me/details',
  /** My details with the change request open on a field (a common question starts it). */
  detailsChange: (field: string) => `/me/details?change=${field}`,
  /** Every question and its answer, searched and by category. */
  questions: '/me/questions',
  /** One answer on its own page. */
  answer: (id: string) => `/me/questions/${id}`,
} as const

export const EMPLOYEE = {
  name: 'Nikola Marković',
  role: 'Site worker',
  company: 'Kvadrat Gradnja d.o.o.',
  number: '0147',
  site: 'Residential building Liman 4',
  manager: 'Snežana Popović',
  hr: 'Jelena Marković',
  email: 'nikola.markovic@example.com',
}

export const HR_CONTACT = 'Human resources · hr@example.com · 021 555 0147 (illustrative)'

// ── Payslips ──────────────────────────────────────────────────────────────────────────────────

export interface PayslipLine {
  key: string
  label: string
  /** Hours or a rate, in words ("168 h", "14%"), when the line has one. */
  basis?: string
  /** Decimal string, RSD. */
  amount: string
}

export interface Payslip {
  /** YYYY-MM. */
  month: string
  /** YYYY-MM-DD. */
  paidOn: string
  gross: string
  net: string
  /** Every payslip of the year has its PDF; the latest three are new to him. */
  isNew?: boolean
}

/** The months he was paid for in 2026, newest first (the application's figures). */
export const PAYSLIPS: Payslip[] = [
  { month: '2026-09', paidOn: '2026-10-10', gross: '117672.00', net: '85330.37', isNew: true },
  { month: '2026-08', paidOn: '2026-09-10', gross: '115840.00', net: '83912.40' },
  { month: '2026-07', paidOn: '2026-08-10', gross: '118870.00', net: '86104.15' },
  { month: '2026-06', paidOn: '2026-07-10', gross: '112850.00', net: '81776.02' },
  { month: '2026-05', paidOn: '2026-06-10', gross: '116270.00', net: '84230.55' },
  { month: '2026-04', paidOn: '2026-05-08', gross: '110280.00', net: '79940.10' },
]

/** The September 2026 payslip, line by line. */
export const SEPTEMBER = {
  month: '2026-09',
  period: { from: '2026-09-01', to: '2026-09-30' },
  paidOn: '2026-10-10',
  number: 'OL-2026-09-0147',
  account: '160-0000000147258-36 (illustrative)',
  bank: 'Banca Intesa',
  hours: [
    { key: 'regular', label: 'Regular work', value: '168 h' },
    { key: 'overtime', label: 'Overtime', value: '12 h' },
    { key: 'night', label: 'Night work', value: '16 h' },
  ],
  earnings: [
    { key: 'base', label: 'Base pay', basis: '168 h', amount: '96000.00' },
    { key: 'overtime', label: 'Overtime (+26%)', basis: '12 h', amount: '8640.00' },
    { key: 'night', label: 'Night work (+26%)', basis: '16 h', amount: '2880.00' },
    { key: 'service', label: 'Past service', basis: '3 years × 0.4%', amount: '1152.00' },
    { key: 'meal', label: 'Meal allowance', amount: '6600.00' },
    { key: 'holiday', label: 'Holiday allowance', amount: '2400.00' },
  ] satisfies PayslipLine[],
  gross: '117672.00',
  deductions: [
    { key: 'pension', label: 'Pension and disability', basis: '14%', amount: '16474.08' },
    { key: 'health', label: 'Health insurance', basis: '5.15%', amount: '6060.11' },
    { key: 'unemployment', label: 'Unemployment insurance', basis: '0.75%', amount: '882.54' },
    {
      key: 'tax',
      label: 'Income tax',
      basis: '10% of 89.249,00',
      amount: '8924.90',
    },
  ] satisfies PayslipLine[],
  deductionsTotal: '32341.63',
  net: '85330.37',
  employer: [
    { key: 'pension', label: 'Pension and disability', basis: '10%', amount: '11767.20' },
    { key: 'health', label: 'Health insurance', basis: '5.15%', amount: '6060.11' },
  ] satisfies PayslipLine[],
  employerTotal: '17827.31',
  cost: '135499.31',
}

// ── Leave ─────────────────────────────────────────────────────────────────────────────────────

export const LEAVE_BALANCE = {
  year: '2026',
  entitlement: '22',
  used: '11',
  requested: '5',
  /** 22 − 11 − 5, the application's figure. */
  available: '6',
}

export type LeaveState =
  'Waiting for HR' | 'Waiting for site manager' | 'Approved' | 'Rejected' | 'Taken'

export const LEAVE_TONES: Readonly<Record<LeaveState, Tone>> = {
  'Waiting for HR': 'warning',
  'Waiting for site manager': 'warning',
  Approved: 'success',
  Rejected: 'danger',
  Taken: 'neutral',
}

export interface LeaveRequest {
  id: string
  kind: string
  /** A paid leave's reason ("Moving"). */
  cause?: string
  /** The proof sent with it: what the approvers open. */
  attachments?: Attachment[]
  from: string
  to: string
  /** Working days, the application's count. */
  days: string
  submitted: string
  state: LeaveState
  note?: string
  /** The steps of its approval, as the application records them. */
  steps: StatusTimelineStep[]
  current: number
  reason?: string
}

const SUBMITTED = (at: string): StatusTimelineStep => ({
  key: 'submitted',
  label: 'Submitted',
  at,
  detail: EMPLOYEE.name,
})

/** The approval of a request sent now: the site manager first, then HR. */
export function sentSteps(): StatusTimelineStep[] {
  return [
    SUBMITTED(`${Y_TODAY}T09:40:00+02:00`),
    { key: 'manager', label: 'Site manager approval', detail: EMPLOYEE.manager },
    { key: 'hr', label: 'HR approval', detail: EMPLOYEE.hr },
    { key: 'approved', label: 'Approved' },
  ]
}

export const LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'LR-2026-031',
    kind: 'Annual leave',
    from: '2026-10-26',
    to: '2026-10-30',
    days: '5',
    submitted: '2026-10-08',
    state: 'Waiting for HR',
    note: 'Family visit in Kraljevo.',
    steps: [
      SUBMITTED('2026-10-08T07:12:00+02:00'),
      {
        key: 'manager',
        label: 'Approved by the site manager',
        at: '2026-10-09T15:40:00+02:00',
        detail: EMPLOYEE.manager,
      },
      { key: 'hr', label: 'HR approval', detail: EMPLOYEE.hr },
      { key: 'approved', label: 'Approved' },
    ],
    current: 2,
  },
  {
    id: 'LR-2026-029',
    kind: 'Paid leave',
    cause: 'Moving',
    from: '2026-09-21',
    to: '2026-09-22',
    days: '2',
    submitted: '2026-09-14',
    state: 'Taken',
    note: 'Moving to Narodnog fronta 12.',
    attachments: [
      {
        id: 'residence',
        name: 'Residence certificate.jpg',
        sizeText: '1,8 MB',
        state: 'available',
        detail: 'Proof of the new address',
      },
    ],
    steps: [
      SUBMITTED('2026-09-14T06:40:00+02:00'),
      {
        key: 'manager',
        label: 'Approved by the site manager',
        at: '2026-09-14T10:15:00+02:00',
        detail: EMPLOYEE.manager,
      },
      {
        key: 'hr',
        label: 'Approved by HR',
        at: '2026-09-15T08:30:00+02:00',
        detail: EMPLOYEE.hr,
      },
      { key: 'approved', label: 'Approved', at: '2026-09-15T08:30:00+02:00' },
    ],
    current: 4,
  },
  {
    id: 'LR-2026-027',
    kind: 'Annual leave',
    from: '2026-09-07',
    to: '2026-09-11',
    days: '5',
    submitted: '2026-08-28',
    state: 'Rejected',
    reason: 'The foundation slab of Liman 4 is poured that week. Please choose another week.',
    steps: [
      SUBMITTED('2026-08-28T06:58:00+02:00'),
      {
        key: 'manager',
        label: 'Rejected by the site manager',
        at: '2026-08-29T09:05:00+02:00',
        detail: EMPLOYEE.manager,
        error: 'The foundation slab of Liman 4 is poured that week. Please choose another week.',
      },
      { key: 'hr', label: 'HR approval' },
      { key: 'approved', label: 'Approved' },
    ],
    current: 1,
  },
  {
    id: 'LR-2026-024',
    kind: 'Annual leave',
    from: '2026-08-10',
    to: '2026-08-21',
    days: '10',
    submitted: '2026-07-01',
    state: 'Taken',
    steps: [
      SUBMITTED('2026-07-01T16:20:00+02:00'),
      {
        key: 'manager',
        label: 'Approved by the site manager',
        at: '2026-07-02T08:10:00+02:00',
        detail: EMPLOYEE.manager,
      },
      {
        key: 'hr',
        label: 'Approved by HR',
        at: '2026-07-03T11:30:00+02:00',
        detail: EMPLOYEE.hr,
      },
      { key: 'approved', label: 'Approved', at: '2026-07-03T11:30:00+02:00' },
    ],
    current: 4,
  },
  {
    id: 'LR-2026-012',
    kind: 'Annual leave',
    from: '2026-04-03',
    to: '2026-04-03',
    days: '1',
    submitted: '2026-03-30',
    state: 'Taken',
    steps: [
      SUBMITTED('2026-03-30T12:02:00+02:00'),
      {
        key: 'manager',
        label: 'Approved by the site manager',
        at: '2026-03-30T14:45:00+02:00',
        detail: EMPLOYEE.manager,
      },
      {
        key: 'hr',
        label: 'Approved by HR',
        at: '2026-03-31T09:00:00+02:00',
        detail: EMPLOYEE.hr,
      },
      { key: 'approved', label: 'Approved', at: '2026-03-31T09:00:00+02:00' },
    ],
    current: 4,
  },
]

/**
 * What a request must be sent with: every kind of request may need proof, set by
 * the application's data — a death certificate, a marriage certificate, proof of a new address,
 * a doctor's note. A `required` one blocks sending until a file is attached.
 */
export type ProofRule = ExpectedFile

/** A paid leave's reason: its days by the company's rules (illustrative) and its proof. */
export interface LeaveReason {
  value: string
  label: string
  /** Working days allowed, the application's figure. */
  days: string
  proof: ProofRule[]
}

export interface LeaveKind {
  value: string
  label: string
  /** Paid leave: chosen by its reason, each with its days and its proof. */
  reasons?: LeaveReason[]
  /** The proof the kind itself needs (sick leave: the doctor's note). */
  proof?: ProofRule[]
  /** Taken from the annual balance. */
  fromBalance?: boolean
}

export const LEAVE_KINDS: LeaveKind[] = [
  { value: 'annual', label: 'Annual leave', fromBalance: true },
  {
    value: 'paid',
    label: 'Paid leave',
    reasons: [
      {
        value: 'wedding',
        label: 'Wedding',
        days: '5',
        proof: [{ key: 'marriage', label: 'Marriage certificate', required: true }],
      },
      {
        value: 'birth',
        label: 'Birth of a child',
        days: '5',
        proof: [{ key: 'birth', label: 'Birth certificate of the child', required: true }],
      },
      {
        value: 'death',
        label: 'Death of a family member',
        days: '5',
        proof: [
          { key: 'death', label: 'Death certificate', required: true },
          {
            key: 'kinship',
            label: 'Proof of kinship',
            detail: 'Only when the surname differs: a birth or marriage certificate',
          },
        ],
      },
      {
        value: 'illness',
        label: 'Serious illness of a family member',
        days: '5',
        proof: [{ key: 'medical', label: 'Doctor’s confirmation of the illness', required: true }],
      },
      {
        value: 'moving',
        label: 'Moving',
        days: '2',
        proof: [
          {
            key: 'address',
            label: 'Proof of the new address',
            required: true,
            detail: 'The residence certificate or the new ID card',
          },
        ],
      },
      {
        value: 'blood',
        label: 'Blood donation',
        days: '2',
        proof: [{ key: 'blood', label: 'Blood donation certificate', required: true }],
      },
    ],
  },
  {
    value: 'sick',
    label: 'Sick leave',
    proof: [
      {
        key: 'note',
        label: 'Doctor’s note',
        required: true,
        detail: 'A photo of the paper is enough; bring the original when you are back.',
      },
    ],
  },
  { value: 'unpaid', label: 'Unpaid leave' },
]

/** The proof a kind (and its reason) needs; none for annual and unpaid leave. */
export function leaveProof(kind: string, reason: string): ProofRule[] {
  const chosen = LEAVE_KINDS.find((each) => each.value === kind)
  if (chosen?.reasons !== undefined) {
    return chosen.reasons.find((each) => each.value === reason)?.proof ?? []
  }
  return chosen?.proof ?? []
}

/** The request he is writing: 21.–31.12.2026., 9 working days by the application's count. */
export const DECEMBER_DRAFT = {
  kind: 'annual',
  from: '2026-12-21',
  to: '2026-12-31',
  note: 'Holidays with the family.',
}

/** The working days of a range, as the application counts them (weekends and holidays out). */
export function workingDays(from: string | null, to: string | null): string | null {
  if (from === null || to === null || to < from) return null
  let count = 0
  const day = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  while (day <= end) {
    const weekday = day.getUTCDay()
    if (weekday !== 0 && weekday !== 6) count += 1
    day.setUTCDate(day.getUTCDate() + 1)
  }
  return String(count)
}

// ── Shifts ────────────────────────────────────────────────────────────────────────────────────

const SITE = 'Liman 4, Novi Sad'

/** His shifts on the site from Monday 12.10.: the morning shift, one night pour, Saturday. */
export const NIKOLA_SHIFTS: MyShift[] = [
  {
    id: 's-1012',
    date: '2026-10-12',
    label: 'Morning',
    start: '07:00',
    end: '15:00',
    place: SITE,
    team: 'Crew Ilić',
  },
  {
    id: 's-1013',
    date: '2026-10-13',
    label: 'Morning',
    start: '07:00',
    end: '15:00',
    place: SITE,
    team: 'Crew Ilić',
  },
  {
    id: 's-1014',
    date: '2026-10-14',
    label: 'Morning',
    start: '07:00',
    end: '15:00',
    place: SITE,
    team: 'Crew Ilić',
  },
  {
    id: 's-1015',
    date: '2026-10-15',
    label: 'Night pour',
    start: '22:00',
    end: '06:00',
    place: SITE,
    team: 'Crew Ilić',
    changed: 'Was Morning, 07:00–15:00 — the 4th-floor slab is poured at night',
  },
  {
    id: 's-1017',
    date: '2026-10-17',
    label: 'Saturday',
    start: '07:00',
    end: '13:00',
    place: SITE,
    team: 'Crew Ilić',
  },
  {
    id: 's-1019',
    date: '2026-10-19',
    label: 'Morning',
    start: '07:00',
    end: '15:00',
    place: SITE,
    team: 'Crew Ilić',
  },
  {
    id: 's-1020',
    date: '2026-10-20',
    label: 'Morning',
    start: '07:00',
    end: '15:00',
    place: SITE,
    team: 'Crew Ilić',
  },
  {
    id: 's-1021',
    date: '2026-10-21',
    label: 'Morning',
    start: '07:00',
    end: '15:00',
    place: SITE,
    team: 'Crew Ilić',
    swapState: 'Swap requested with Marko Ilić · waiting for the site manager',
  },
  {
    id: 's-1022',
    date: '2026-10-22',
    label: 'Morning',
    start: '07:00',
    end: '15:00',
    place: SITE,
    team: 'Crew Ilić',
  },
  {
    id: 's-1023',
    date: '2026-10-23',
    label: 'Morning',
    start: '07:00',
    end: '15:00',
    place: SITE,
    team: 'Crew Ilić',
  },
]

export const CREW = [
  { id: 'marko', name: 'Marko Ilić', note: 'Crew Ilić' },
  { id: 'petar', name: 'Petar Jovanović', note: 'Crew Ilić' },
  { id: 'dusan', name: 'Dušan Lazić', note: 'Crew Petrović' },
]

// ── Documents to sign ─────────────────────────────────────────────────────────────────────────

export type DocumentState = 'To sign' | 'Signed' | 'Declined'

export const DOCUMENT_TONES: Readonly<Record<DocumentState, Tone>> = {
  'To sign': 'warning',
  Signed: 'success',
  Declined: 'danger',
}

export interface EmployeeDocument {
  id: string
  title: string
  kind: string
  sent: string
  state: DocumentState
  /** YYYY-MM-DD: sign by. */
  due?: string
  signedOn?: string
}

export const DOCUMENTS: EmployeeDocument[] = [
  {
    id: 'ANX-2026-014',
    title: 'Annex 2 to the employment contract — night work on Liman 4',
    kind: 'Annex to the contract',
    sent: '2026-10-12',
    due: '2026-10-16',
    state: 'To sign',
  },
  {
    id: 'BZR-2026-0187',
    title: 'Statement: occupational safety training completed',
    kind: 'Statement',
    sent: '2026-10-06',
    state: 'Signed',
    signedOn: '2026-10-06',
  },
  {
    id: 'RU-2025-088',
    title: 'Employment contract',
    kind: 'Contract',
    sent: '2025-03-28',
    state: 'Signed',
    signedOn: '2025-03-31',
  },
]

/** The annex's signers: Nikola first, then the director. */
export function annexSigners(nikola: 'waiting' | 'signed' | 'declined', reason?: string): Signer[] {
  return [
    {
      id: 'nikola',
      name: EMPLOYEE.name,
      role: 'Employee',
      state: nikola,
      current: true,
      ...(nikola === 'waiting' ? {} : { at: '2026-10-14T09:42:00+02:00' }),
      ...(reason === undefined ? {} : { reason }),
    },
    { id: 'director', name: 'Nenad Kovačević', role: 'Director', state: 'waiting' },
  ]
}

/** The annex (its PDF is liro-folio's). */
export const ANNEX = {
  title: 'Annex 2 to employment contract RU-2025-088',
}

export const DECLINE_REASONS = [
  { value: 'terms', label: 'I do not agree with the terms' },
  { value: 'questions', label: 'I have questions first' },
]

// ── My details ────────────────────────────────────────────────────────────────────────────────

export const DETAILS = {
  personal: [
    { key: 'name', label: 'Name', value: EMPLOYEE.name },
    { key: 'born', label: 'Date of birth', value: '1994-05-17', date: true },
    { key: 'address', label: 'Address', value: 'Bulevar oslobođenja 41, 21000 Novi Sad' },
    { key: 'phone', label: 'Mobile phone', value: '064 555 0147 (illustrative)' },
    { key: 'email', label: 'Private e-mail', value: EMPLOYEE.email },
  ],
  work: [
    { key: 'number', label: 'Employee number', value: EMPLOYEE.number },
    { key: 'role', label: 'Position', value: EMPLOYEE.role },
    { key: 'site', label: 'Site', value: EMPLOYEE.site },
    { key: 'manager', label: 'Site manager', value: EMPLOYEE.manager },
    { key: 'since', label: 'Employed since', value: '2025-04-01', date: true },
  ],
  pay: [
    { key: 'account', label: 'Salary account', value: SEPTEMBER.account },
    { key: 'bank', label: 'Bank', value: SEPTEMBER.bank },
  ],
}

export interface ChangeRequest {
  id: string
  field: string
  from: string
  to: string
  submitted: string
  state: 'Waiting for HR' | 'Approved'
  note?: string
  /** The proof sent with it. */
  attachments?: Attachment[]
}

export const CHANGE_REQUESTS: ChangeRequest[] = [
  {
    id: 'CR-2026-009',
    field: 'Mobile phone',
    from: '064 555 0147 (illustrative)',
    to: '065 555 0741 (illustrative)',
    submitted: '2026-10-13',
    state: 'Waiting for HR',
  },
  {
    id: 'CR-2026-004',
    field: 'Private e-mail',
    from: 'n.markovic@example.com',
    to: EMPLOYEE.email,
    submitted: '2026-05-04',
    state: 'Approved',
  },
]

/** The fields he may ask HR to change, and the proof each needs (as data). */
export const CHANGEABLE: {
  value: string
  label: string
  /** Its value now, when My details shows it inside another (the surname in the name). */
  now?: string
  proof?: ProofRule[]
}[] = [
  {
    value: 'address',
    label: 'Address',
    proof: [
      {
        key: 'address',
        label: 'Proof of the new address',
        required: true,
        detail: 'The residence certificate or the new ID card',
      },
    ],
  },
  {
    value: 'surname',
    label: 'Surname',
    now: 'Marković',
    proof: [
      { key: 'marriage', label: 'Marriage certificate', required: true },
      { key: 'id', label: 'The new ID card', detail: 'When you already have it' },
    ],
  },
  { value: 'phone', label: 'Mobile phone' },
  { value: 'email', label: 'Private e-mail' },
  {
    value: 'account',
    label: 'Salary account',
    proof: [
      {
        key: 'statement',
        label: 'Bank statement with the account number',
        required: true,
        detail: 'Or the account contract, with your name on it',
      },
    ],
  },
]

// ── Questions and answers ──────────────────────────────────────────────────────────

/** The categories of the portal's questions (ten). */
export const QUESTION_CATEGORIES = QA_CATEGORIES

/** A common question; `request` is the request that does it (its label and its route). */
export interface EmployeeQuestion {
  id: string
  category: string
  question: string
  answer: string
  steps?: string[]
  documents?: string[]
  keywords?: string
  request?: { label: string; route: string }
}

/**
 * What Kvadrat Gradnja's employees keep asking HR, the most asked first. Illustrative: the days
 * and the documents are this fictitious company's rules, not legal advice.
 */
export const EMPLOYEE_QUESTIONS: EmployeeQuestion[] = [
  {
    id: 'id-card',
    category: 'personal',
    question: 'I changed my ID card. Do I have to tell my employer?',
    answer:
      'Only when your address or surname on it changed. A new card with the same details needs nothing.',
    steps: [
      'Check your address and surname in My details.',
      'If one changed, report the change and attach a photo of the new card.',
    ],
    documents: ['A photo of the new ID card, both sides'],
    keywords: 'identity card lična karta',
    request: { label: 'Report a change of address', route: Y_ROUTES.detailsChange('address') },
  },
  {
    id: 'address',
    category: 'personal',
    question: 'What do I need to change my address?',
    answer: 'A change request with proof of the new address. HR updates it within two days.',
    steps: [
      'Report the change of address and write the new one.',
      'Attach the proof; a photo is enough.',
      'You get a notification when HR has updated it.',
    ],
    documents: ['The residence certificate, or the new ID card with the new address'],
    keywords: 'moving moved residence adresa',
    request: { label: 'Report a change of address', route: Y_ROUTES.detailsChange('address') },
  },
  {
    id: 'married',
    category: 'leave',
    question: 'I got married. What changes, and what do I bring?',
    answer:
      'You have 5 working days of paid leave for the wedding. If you take a new surname, HR changes it with the marriage certificate.',
    steps: [
      'Request paid leave with the reason Wedding and attach the marriage certificate.',
      'For a new surname, report the change with the same certificate.',
    ],
    documents: ['Marriage certificate', 'The new ID card, when the surname changes'],
    keywords: 'wedding marriage surname name venčanje',
    request: {
      label: 'Request leave for the wedding',
      route: Y_ROUTES.newLeaveOf('paid', 'wedding'),
    },
  },
  {
    id: 'child',
    category: 'leave',
    question: 'I had a child. What changes, and what do I bring?',
    answer:
      'You have 5 working days of paid leave for the birth, and a tax relief for the child from the next pay.',
    steps: [
      'Request paid leave with the reason Birth of a child.',
      'Attach the birth certificate; HR adds the tax relief and the health insurance.',
    ],
    documents: ['Birth certificate of the child'],
    keywords: 'baby birth born maternity parental',
    request: { label: 'Request leave for the birth', route: Y_ROUTES.newLeaveOf('paid', 'birth') },
  },
  {
    id: 'account',
    category: 'pay',
    question: 'How do I change the bank account my pay goes to?',
    answer:
      'Send a change request with a bank statement before the 25th; the next pay goes to the new account.',
    documents: ['A bank statement or the account contract, with your name and the account number'],
    keywords: 'salary bank account račun',
    request: { label: 'Change the salary account', route: Y_ROUTES.detailsChange('account') },
  },
  {
    id: 'sick',
    category: 'leave',
    question: 'I am sick. How do I report it?',
    answer:
      'Tell your site manager before the shift; then request sick leave and attach the doctor’s note.',
    steps: [
      `Call or message ${EMPLOYEE.manager} before your shift.`,
      'Request sick leave; a photo of the doctor’s note is enough.',
    ],
    documents: ['Doctor’s note'],
    keywords: 'ill illness doctor bolovanje',
    request: { label: 'Request sick leave', route: Y_ROUTES.newLeaveOf('sick') },
  },
  {
    id: 'surname',
    category: 'personal',
    question: 'What do I need to change my surname?',
    answer: 'A change request with the marriage certificate; the new ID card when you have it.',
    documents: ['Marriage certificate', 'The new ID card'],
    keywords: 'name prezime',
    request: { label: 'Report a new surname', route: Y_ROUTES.detailsChange('surname') },
  },
  {
    id: 'relief',
    category: 'pay',
    question: 'How do I claim a tax relief for a family member who depends on me?',
    answer:
      'Bring HR the documents that show the person depends on you; the relief is in your pay from the next month.',
    documents: [
      'Birth or marriage certificate of the family member',
      'Proof that they have no income of their own',
    ],
    keywords: 'tax relief dependent child spouse olakšica',
  },
  {
    id: 'death',
    category: 'leave',
    question: 'A family member died. How many days do I have?',
    answer:
      'You have 5 working days of paid leave. Attach the death certificate; a photo of it is enough.',
    documents: ['Death certificate'],
    keywords: 'funeral death bereavement',
    request: { label: 'Request paid leave', route: Y_ROUTES.newLeaveOf('paid', 'death') },
  },
  {
    id: 'certificate',
    category: 'documents',
    question: 'I need a certificate of employment for the bank. How do I get one?',
    answer: `Write to ${EMPLOYEE.hr} in HR; she signs it electronically, usually the same day, and it appears in Documents.`,
    keywords: 'certificate confirmation loan bank potvrda',
  },
]

/** A generated leave situation's request, started filled in where the portal has that kind. */
const LEAVE_BY_SITUATION: Readonly<Record<string, string>> = {
  annual: Y_ROUTES.newLeaveOf('annual'),
  'annual-split': Y_ROUTES.newLeaveOf('annual'),
  moving: Y_ROUTES.newLeaveOf('paid', 'moving'),
  blood: Y_ROUTES.newLeaveOf('paid', 'blood'),
  care: Y_ROUTES.newLeaveOf('sick'),
}

/**
 * The request of a generated question that asks how to request something ("What do I need …",
 * "… on my phone?"): leave opens the leave request (filled in where the portal has the kind), a
 * personal-data question the change request or My details.
 */
function generatedRequest(question: StoryQuestion): EmployeeQuestion['request'] {
  if (!/-(need|phone)$/.test(question.id)) return undefined
  const situation = question.id.replace(/^[a-z]+-/, '').replace(/-(need|phone)$/, '')
  if (question.request === 'leave') {
    return { label: 'Request leave', route: LEAVE_BY_SITUATION[situation] ?? Y_ROUTES.newLeave }
  }
  if (question.request === 'change') {
    return situation === 'phone'
      ? { label: 'Request a change', route: Y_ROUTES.detailsChange('phone') }
      : { label: 'Open My details', route: Y_ROUTES.details }
  }
  return undefined
}

/**
 * Every question of the portal: the ten most asked first, then 320 more from the
 * library's story data (fictitious, made without randomness) — 330 in all.
 */
export const ALL_EMPLOYEE_QUESTIONS: EmployeeQuestion[] = [
  ...EMPLOYEE_QUESTIONS,
  ...QA_QUESTIONS.map((question) => {
    const request = generatedRequest(question)
    return {
      id: question.id,
      category: question.category,
      question: question.question,
      answer: question.answer,
      ...(question.steps === undefined ? {} : { steps: [...question.steps] }),
      ...(question.documents === undefined ? {} : { documents: [...question.documents] }),
      ...(question.keywords === undefined ? {} : { keywords: question.keywords }),
      ...(request === undefined ? {} : { request }),
    }
  }),
]
