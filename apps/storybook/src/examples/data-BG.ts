/*
 * Group BG's example data (P5.69, the archive book and retention): Kvadrat Gradnja d.o.o.'s
 * archive on 14 October 2026 at 09:40, kept by Ana Marić. The archive book (one entry per unit of
 * archived material: its years, content, classification, how much, where, its retention and the
 * day it may be disposed of — the application's dates), the retention period of each category of
 * documents (the classification plan's list, data), what expires, and disposal list LB-2026-01
 * with its commission, the archive's consent and the minutes (a document of group BE). The
 * retention periods, legal bases and the archive's consent are invented and illustrative.
 * No classes here.
 */
import type { Signer } from '@veljaos/ui'
import { BE_ROUTES } from './data-BE'

export const BG_TODAY = '2026-10-14'

const BASE = '/records/archive'

export const BG_ROUTES = {
  /** The archive book. */
  book: BASE,
  /** The retention periods by category. */
  retention: `${BASE}/retention`,
  /** What expires: retention ended or ending this year. */
  expiring: `${BASE}/expiring`,
  /** Expiring, with four units chosen for a disposal list. */
  expiringChosen: `${BASE}/expiring?chosen`,
  /** Disposal list LB-2026-01: signed, consent received, ready to dispose. */
  disposal: `${BASE}/disposal/LB-2026-01`,
  /** The disposal confirmed: the units disposed, the minutes numbered. */
  disposed: `${BASE}/disposal/LB-2026-01?disposed`,
} as const

export const ARCHIVE_TONES = {
  'In the archive': 'neutral',
  'Retention ended': 'warning',
  'On a disposal list': 'info',
  Disposed: 'neutral',
  Permanent: 'success',
} as const

export type ArchiveState = keyof typeof ARCHIVE_TONES

export interface ArchiveUnit {
  number: string
  entered: string
  /** The years of the material ("2013–2015"). */
  years: string
  classification: string
  content: string
  /** How much, in the application's words ("3 binders"). */
  quantity: string
  medium: 'Paper' | 'Electronic'
  /** The category's retention, in words. */
  retention: string
  /** The day it may be disposed of; null: kept permanently. */
  keptUntil: string | null
  location: string
  state: ArchiveState
  /** The application's note: the disposal it went with. */
  note?: string
  locked?: boolean
}

const u = (unit: ArchiveUnit) => unit

export const ARCHIVE: ArchiveUnit[] = [
  u({
    number: '38',
    entered: '2016-02-15',
    years: '2010–2015',
    classification: '01.1',
    content: 'Founding act, articles of association and their amendments',
    quantity: '2 binders',
    medium: 'Paper',
    retention: 'Permanently',
    keptUntil: null,
    location: 'Archive room, cabinet A-1',
    state: 'Permanent',
    locked: true,
  }),
  u({
    number: '41',
    entered: '2016-02-15',
    years: '2013–2015',
    classification: '05.1',
    content: 'Purchase orders and delivery notes',
    quantity: '4 binders',
    medium: 'Paper',
    retention: '10 years',
    keptUntil: '2025-12-31',
    location: 'Archive room, shelf B-2',
    state: 'On a disposal list',
    note: 'Disposal list LB-2026-01',
    locked: true,
  }),
  u({
    number: '42',
    entered: '2016-02-15',
    years: '2014–2015',
    classification: '05.3',
    content: 'Offers sent and received',
    quantity: '2 binders',
    medium: 'Paper',
    retention: '5 years',
    keptUntil: '2020-12-31',
    location: 'Archive room, shelf B-2',
    state: 'On a disposal list',
    note: 'Disposal list LB-2026-01',
    locked: true,
  }),
  u({
    number: '47',
    entered: '2017-01-20',
    years: '2016',
    classification: '03.1',
    content: 'Bookkeeping records: journals, ledgers, the trial balances',
    quantity: '6 binders',
    medium: 'Paper',
    retention: '10 years',
    keptUntil: '2026-12-31',
    location: 'Archive room, shelf C-1',
    state: 'In the archive',
  }),
  u({
    number: '48',
    entered: '2017-01-20',
    years: '2016',
    classification: '03.4',
    content: 'Tax returns and their records',
    quantity: '2 binders',
    medium: 'Paper',
    retention: '10 years',
    keptUntil: '2026-12-31',
    location: 'Archive room, shelf C-1',
    state: 'In the archive',
  }),
  u({
    number: '52',
    entered: '2017-03-01',
    years: '2016',
    classification: '05.1',
    content: 'Purchase orders and delivery notes',
    quantity: '3 binders',
    medium: 'Paper',
    retention: '10 years',
    keptUntil: '2026-12-31',
    location: 'Archive room, shelf B-3',
    state: 'In the archive',
  }),
  u({
    number: '55',
    entered: '2018-01-15',
    years: '2017',
    classification: '02.3',
    content: 'Leave decisions and the leave plan',
    quantity: '1 binder',
    medium: 'Paper',
    retention: '5 years',
    keptUntil: '2022-12-31',
    location: 'Archive room, shelf D-1',
    state: 'On a disposal list',
    note: 'Disposal list LB-2026-01',
  }),
  u({
    number: '56',
    entered: '2018-01-15',
    years: '2017',
    classification: '02.1',
    content: 'Employment records of employees who left',
    quantity: '3 binders',
    medium: 'Paper',
    retention: 'Permanently',
    keptUntil: null,
    location: 'Archive room, cabinet A-2',
    state: 'Permanent',
  }),
  u({
    number: '61',
    entered: '2019-01-18',
    years: '2018',
    classification: '05.3',
    content: 'Offers sent and received',
    quantity: '2 binders',
    medium: 'Paper',
    retention: '5 years',
    keptUntil: '2023-12-31',
    location: 'Archive room, shelf B-4',
    state: 'Retention ended',
  }),
  u({
    number: '63',
    entered: '2019-01-18',
    years: '2018',
    classification: '04.2',
    content: 'Site diaries, Residential building Sajmište 7',
    quantity: '5 binders',
    medium: 'Paper',
    retention: 'Permanently',
    keptUntil: null,
    location: 'Archive room, cabinet A-3',
    state: 'Permanent',
  }),
  u({
    number: '70',
    entered: '2020-01-22',
    years: '2019',
    classification: '02.3',
    content: 'Leave decisions and the leave plan',
    quantity: '1 binder',
    medium: 'Paper',
    retention: '5 years',
    keptUntil: '2024-12-31',
    location: 'Archive room, shelf D-1',
    state: 'On a disposal list',
    note: 'Disposal list LB-2026-01',
  }),
  u({
    number: '84',
    entered: '2026-01-26',
    years: '2025',
    classification: '01.2',
    content: 'Registry book 2025 with its acts',
    quantity: '1 book, 12 binders; scans in the document store',
    medium: 'Paper',
    retention: 'Permanently',
    keptUntil: null,
    location: 'Archive room, cabinet A-4',
    state: 'Permanent',
  }),
]

/** The number the book gives the next unit (the application's). */
export const ARCHIVE_COUNT = 84

/** The units whose retention ended or ends this year (the application's list, its dates). */
export const EXPIRING = ['41', '42', '55', '70', '61', '47', '48', '52']

/** The units chosen for the next list in the "chosen" state. */
export const CHOSEN = ['47', '48', '52', '61']

export interface RetentionPeriod {
  code: string
  category: string
  retention: string
  /** From when the period runs, in the application's words. */
  from: string
  basis: string
}

export const RETENTION: RetentionPeriod[] = [
  {
    code: '01.1',
    category: 'Founding acts, articles of association, registration decisions',
    retention: 'Permanently',
    from: '—',
    basis: 'Archive law, art. 11 (illustrative)',
  },
  {
    code: '01.2',
    category: 'Decisions and minutes of company bodies; the registry book',
    retention: 'Permanently',
    from: '—',
    basis: 'Archive law, art. 11 (illustrative)',
  },
  {
    code: '02.1',
    category: 'Employment records, contracts, payroll records',
    retention: 'Permanently',
    from: '—',
    basis: 'Labour law, art. 49 (illustrative)',
  },
  {
    code: '02.3',
    category: 'Leave decisions and leave plans',
    retention: '5 years',
    from: 'The end of the year the document was made',
    basis: 'Classification plan, item 14 (illustrative)',
  },
  {
    code: '02.6',
    category: 'Safety at work: risk assessments, injury register',
    retention: 'Permanently',
    from: '—',
    basis: 'Safety at work law, art. 47 (illustrative)',
  },
  {
    code: '03.1',
    category: 'Bookkeeping records: journals, ledgers, trial balances',
    retention: '10 years',
    from: 'The end of the business year',
    basis: 'Accounting law, art. 28 (illustrative)',
  },
  {
    code: '03.2',
    category: 'Financial statements and annual reports',
    retention: 'Permanently',
    from: '—',
    basis: 'Accounting law, art. 28 (illustrative)',
  },
  {
    code: '03.4',
    category: 'Tax returns and tax records',
    retention: '10 years',
    from: 'The end of the year of the return',
    basis: 'Tax procedure law, art. 36 (illustrative)',
  },
  {
    code: '04.2',
    category: 'Construction sites: site diaries, permits, as-built documentation',
    retention: 'Permanently',
    from: '—',
    basis: 'Planning and construction law, art. 129 (illustrative)',
  },
  {
    code: '05.1',
    category: 'Purchasing: orders, delivery notes, complaints',
    retention: '10 years',
    from: 'The end of the business year',
    basis: 'Accounting law, art. 28 (illustrative)',
  },
  {
    code: '05.3',
    category: 'Sales: offers sent and received',
    retention: '5 years',
    from: 'The end of the year the offer was made',
    basis: 'Classification plan, item 31 (illustrative)',
  },
]

// ── Disposal list LB-2026-01 ──────────────────────────────────────────────────────────────────

export const DISPOSAL = {
  number: 'LB-2026-01',
  proposed: '2026-09-22',
  units: ['41', '42', '55', '70'],
  quantity: '8 binders',
  consent: 'Historical Archive of Novi Sad (illustrative), no. 03-1187/2026',
  consentDate: '2026-10-06',
  contractor: 'Papir Reciklaža d.o.o. (illustrative)',
  minutesNumber: '01-416/2026',
}

export const DISPOSAL_STEPS = ['Proposed', 'Commission signed', 'Archive consented', 'Disposed']

export const COMMISSION: Signer[] = [
  {
    id: 'ana',
    name: 'Ana Marić',
    role: 'Chair of the commission',
    state: 'signed',
    at: '2026-09-22T11:10:00+02:00',
  },
  {
    id: 'milica',
    name: 'Milica Petrović',
    role: 'Member',
    state: 'signed',
    at: '2026-09-22T12:02:00+02:00',
    current: true,
  },
  {
    id: 'ivan',
    name: 'Ivan Lukić',
    role: 'Member',
    state: 'signed',
    at: '2026-09-23T08:41:00+02:00',
  },
]

/** The minutes' values as the application fills them from the list (group BE's definition). */
export const DISPOSAL_MINUTES_ROUTE = BE_ROUTES.draft('minutes-disposal')
