/*
 * Group BI's example data (P5.71, contracts): Kvadrat Gradnja d.o.o.'s contracts register on
 * 14 October 2026 at 09:40. Each contract with its partner, kind, value, term, how it renews and the
 * reminder the application sets (states in words: Active, Notice due, Expiring, Expired, Ended,
 * Draft). The framework contract for ready-mix concrete with Beton Mix d.o.o. has its versions
 * (the signed contract and two annexes) and its linked documents — the order and the invoice of
 * groups AU and U. Every number, amount and date is invented; the reminders' days are the
 * application's. No classes here.
 */
import type { FileVersion } from '@veljaos/ui'
import { AU_ROUTES } from './data-AU'
import { BE_ROUTES } from './data-BE'
import { BH_ROUTES } from './data-BH'

export const BI_TODAY = '2026-10-14'

const BASE = '/records/contracts'

export const BI_ROUTES = {
  list: BASE,
  /** Only the contracts that need attention. */
  attention: `${BASE}?view=attention`,
  /** The framework contract with Beton Mix d.o.o.: notice due in 2 days. */
  contract: `${BASE}/UGO-2025-044`,
  contractOf: (number: string) => `${BASE}/${number}`,
  /** The same, after "Let it renew": the reminder dismissed, the renewal noted. */
  renewed: `${BASE}/UGO-2025-044?renewed`,
} as const

export const CONTRACT_TONES = {
  Active: 'success',
  'Notice due': 'warning',
  Expiring: 'warning',
  Expired: 'danger',
  Ended: 'neutral',
  Draft: 'neutral',
  Renews: 'info',
} as const

export type ContractState = keyof typeof CONTRACT_TONES

export interface Contract {
  number: string
  subject: string
  partner: string
  kind: string
  /** The value in RSD; null for a framework contract without one. */
  value: string | null
  start: string
  /** null: indefinite. */
  end: string | null
  /** How it renews, in the application's words. */
  renewal: string
  /** The application's reminder: what to do and by when. */
  reminder: string | null
  state: ContractState
  owner: string
}

const c = (contract: Contract) => contract

export const CONTRACTS: Contract[] = [
  c({
    number: 'UGO-2025-044',
    subject: 'Ready-mix concrete, framework contract',
    partner: 'Beton Mix d.o.o.',
    kind: 'Supply',
    value: null,
    start: '2025-11-01',
    end: '2026-10-31',
    renewal: 'Renews for 1 year unless notice is given 15 days before the end',
    reminder: 'Give notice by 16.10.2026 or it renews on 01.11.2026',
    state: 'Notice due',
    owner: 'Marko Đorđević',
  }),
  c({
    number: 'UGO-2024-019',
    subject: 'Lease of a tower crane, Bulevar Evrope 24',
    partner: 'Kranovi Bačka d.o.o.',
    kind: 'Lease',
    value: '4320000.00',
    start: '2024-11-15',
    end: '2026-11-14',
    renewal: 'Ends; extended only by an annex',
    reminder: 'Ends in 31 days: agree an annex or plan the dismantling',
    state: 'Expiring',
    owner: 'Stefan Nikolić',
  }),
  c({
    number: 'UGO-2026-012',
    subject: 'Electrical installations, Residential building Liman 4',
    partner: 'Elektro Sistem d.o.o.',
    kind: 'Subcontract',
    value: '18650000.00',
    start: '2026-03-01',
    end: '2027-06-30',
    renewal: 'Ends with the works',
    reminder: null,
    state: 'Active',
    owner: 'Snežana Popović',
  }),
  c({
    number: 'UGO-2026-027',
    subject: 'Facade works, Residential building Liman 4',
    partner: 'Novosadske fasade d.o.o.',
    kind: 'Subcontract',
    value: '24900000.00',
    start: '2026-11-01',
    end: '2027-05-31',
    renewal: 'Ends with the works',
    reminder:
      'Not approved by the supervisory board on 08.10.2026; an amended draft goes to its next meeting',
    state: 'Draft',
    owner: 'Goran Medić',
  }),
  c({
    number: 'UGO-2023-008',
    subject: 'Heating supply, the office building',
    partner: 'Gradska toplana Novi Sad',
    kind: 'Utility',
    value: null,
    start: '2023-01-01',
    end: null,
    renewal: 'Indefinite',
    reminder: null,
    state: 'Active',
    owner: 'Ana Marić',
  }),
  c({
    number: 'UGO-2025-031',
    subject: 'Sale of flats, Residential building Liman 4, phase 1',
    partner: 'Stanogradnja Plus d.o.o.',
    kind: 'Sale',
    value: '96400000.00',
    start: '2025-09-10',
    end: '2027-09-30',
    renewal: 'Ends on handover',
    reminder: null,
    state: 'Active',
    owner: 'Dragan Ilić',
  }),
  c({
    number: 'UGO-2025-002',
    subject: 'Property and liability insurance',
    partner: 'Dunav osiguranje a.d. (illustrative)',
    kind: 'Insurance',
    value: '1284000.00',
    start: '2025-10-01',
    end: '2026-09-30',
    renewal: 'Ends; a new policy each year',
    reminder: 'Expired on 30.09.2026: the new policy is not entered',
    state: 'Expired',
    owner: 'Milica Petrović',
  }),
  c({
    number: 'UGO-2022-015',
    subject: 'Office cleaning',
    partner: 'Čisto Plus d.o.o. (illustrative)',
    kind: 'Service',
    value: '540000.00',
    start: '2022-05-01',
    end: '2026-04-30',
    renewal: 'Ended by notice',
    reminder: null,
    state: 'Ended',
    owner: 'Ana Marić',
  }),
]

export function contractByNumber(number: string): Contract | undefined {
  return CONTRACTS.find((contract) => contract.number === number)
}

/** The register's views: the application's. */
export const CONTRACT_VIEWS = [
  { id: 'active', label: 'In force' },
  { id: 'attention', label: 'Need attention' },
  { id: 'ended', label: 'Ended and expired' },
  { id: 'all', label: 'All' },
] as const

export type ContractView = (typeof CONTRACT_VIEWS)[number]['id']

export function inContractView(contract: Contract, view: ContractView): boolean {
  if (view === 'all') return true
  if (view === 'attention') return contract.reminder !== null
  if (view === 'ended') return contract.state === 'Ended' || contract.state === 'Expired'
  return contract.state !== 'Ended' && contract.state !== 'Expired' && contract.state !== 'Draft'
}

// ── UGO-2025-044 ──────────────────────────────────────────────────────────────────────────────

export const UGO_044 = {
  notice: '2026-10-16',
  renewsOn: '2026-11-01',
  renewedUntil: '2027-10-31',
  prices: 'Price list of Beton Mix d.o.o. for 2026, Annex 2',
  ordered: '14860200.00',
  orders: '23 orders in 2026',
}

export const UGO_044_VERSIONS: FileVersion[] = [
  {
    id: 'v3',
    label: 'Annex 2',
    at: '2026-01-12T11:20:00+01:00',
    by: 'Marko Đorđević',
    size: '0.6',
    sizeUnit: 'MB',
    note: 'Prices for 2026; signed by both parties',
    current: true,
  },
  {
    id: 'v2',
    label: 'Annex 1',
    at: '2025-12-03T09:05:00+01:00',
    by: 'Marko Đorđević',
    size: '0.4',
    sizeUnit: 'MB',
    note: 'Pump hours added; signed by both parties',
  },
  {
    id: 'v1',
    label: 'Contract',
    at: '2025-10-24T14:30:00+02:00',
    by: 'Marko Đorđević',
    size: '1.8',
    sizeUnit: 'MB',
    note: 'Signed by both parties',
  },
]

export const UGO_044_LINKED = [
  { key: 'order', type: 'Purchase order', number: 'NB-2026-0087', href: `#${AU_ROUTES.order}` },
  {
    key: 'receipt',
    type: 'Goods receipt',
    number: 'PRI-2026-0213',
    href: `#${AU_ROUTES.receipt}`,
  },
  {
    key: 'invoice',
    type: 'Supplier invoice',
    number: '2026-1187',
    href: `#${AU_ROUTES.invoice}`,
  },
  {
    key: 'notice',
    type: 'Notice letter',
    number: 'Draft',
    href: `#${BE_ROUTES.draft('letter')}`,
  },
]

/** The facade contract's link to the meeting that did not approve it. */
export const UGO_027_MEETING = BH_ROUTES.held
