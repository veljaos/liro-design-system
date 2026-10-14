/*
 * Group Y's example data (P5.35): the employee portal of Kvadrat Gradnja d.o.o. as Nikola Marković,
 * a site worker on the building site "Residential building Liman 4", sees it on 14.10.2026 at
 * 09:40 — his payslips, his leave and its approvals, an annex to sign, his shifts and his details
 * with a change waiting for HR. Fictitious: every name, number, account and amount is invented and
 * illustrative. The payroll is the application's work (its figures add up here, and
 * dataset-checks could prove it); the components only show it. Not part of the package.
 */
import type { MyShift, Signer, StatusTimelineStep, Tone } from '@veljaos/ui'

export const Y_TODAY = '2026-10-14'
export const Y_NOW = '09:40'

export const Y_ROUTES = {
  home: '/me',
  payslips: '/me/payslips',
  payslip: (month: string) => `/me/payslips/${month}`,
  payslipPdf: (month: string) => `/me/payslips/${month}/pdf`,
  leave: '/me/leave',
  leaveRequest: (id: string) => `/me/leave/${id}`,
  newLeave: '/me/leave/new',
  /** The new request half written, the application's count of working days shown. */
  newLeaveDraft: '/me/leave/new?draft=december',
  shifts: '/me/shifts',
  documents: '/me/documents',
  document: (id: string) => `/me/documents/${id}`,
  details: '/me/details',
  /** My details with the change form open, as the application restores it. */
  detailsChange: '/me/details?change=address',
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

export const LEAVE_KINDS = [
  { value: 'annual', label: 'Annual leave' },
  { value: 'paid', label: 'Paid leave (wedding, moving, a death in the family)' },
  { value: 'unpaid', label: 'Unpaid leave' },
]

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
    { id: 'director', name: 'Vladimir Kostić', role: 'Director', state: 'waiting' },
  ]
}

/** The annex's text (what the preview shows). */
export const ANNEX = {
  title: 'Annex 2 to employment contract RU-2025-088',
  parties:
    'Kvadrat Gradnja d.o.o., Novi Sad (the employer), represented by director Vladimir Kostić, and Nikola Marković, site worker (the employee).',
  articles: [
    {
      heading: 'Article 1',
      text: 'From 15 October 2026 until the structure of Residential building Liman 4 is complete, the employee may be scheduled for night work when concrete is poured, at most two nights a week.',
    },
    {
      heading: 'Article 2',
      text: 'Each hour of night work is paid 26% above the base hourly pay, as in the contract. A night shift is followed by at least 12 hours of rest.',
    },
    {
      heading: 'Article 3',
      text: 'All other terms of the employment contract stay unchanged. The annex is made in electronic form and signed with qualified electronic signatures.',
    },
  ],
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

/** The fields he may ask HR to change, and the proof each needs. */
export const CHANGEABLE = [
  {
    value: 'address',
    label: 'Address',
    proof: 'A copy of the ID card or the residence certificate.',
  },
  { value: 'phone', label: 'Mobile phone' },
  { value: 'email', label: 'Private e-mail' },
  { value: 'account', label: 'Salary account', proof: 'A bank statement with the account number.' },
]
