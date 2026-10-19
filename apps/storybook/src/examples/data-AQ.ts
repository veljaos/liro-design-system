/*
 * Group AQ's example data (P5.48, travel orders): Kvadrat Gradnja d.o.o. on 14 October 2026.
 * - A new travel order PN-2026-052, issued by the site manager Snežana Popović for Nikola
 *   Marković's trip to Subotica on 19.10.2026 (formwork panels for Site Liman 4).
 * - The settlement of PN-2026-047, Jelena Stojković's two days in Beograd: the expenses with the
 *   photos of their receipts (the taxi's still missing), the per-diems and what is paid to her.
 * - Three settlements waiting for Milica Petrović's approval: one to return part of the advance,
 *   two to pay.
 * Every figure is the application's: the per-diems by the trip's hours (illustrative: a full
 * per-diem of 3.300,00 RSD over 12 hours, half from 8 to 12 hours, none under 8), the expenses'
 * total, what is paid or returned — decimal strings, never computed by the screens (D4). Every
 * name, number and amount is invented. Not part of the package. No classes here.
 */
import type { Attachment, Tone } from '@veljaos/ui'

export const AQ_TODAY = '2026-10-14'

export const AQ_ROUTES = {
  newOrder: '/travel/orders/new',
  settlement: '/travel/orders/PN-2026-047/settlement',
  /** The same after the taxi's receipt was photographed: it can be submitted. */
  settlementReady: '/travel/orders/PN-2026-047/settlement?stage=ready',
  approvals: '/travel/settlements/to-approve',
  /** The approvals with "Reject" asked for PN-2026-044. */
  approvalsReject: '/travel/settlements/to-approve?ask=reject',
} as const

/** The illustrative per-diem and its rule, in the application's words. */
export const PER_DIEM = {
  amount: '3300.00',
  rule: 'A full per-diem for every 24 hours and for a rest over 12 hours, half from 8 to 12 hours, none under 8 (illustrative).',
}

// ── A new order ───────────────────────────────────────────────────────────────────────────────

export const TRAVELLERS = [
  { value: 'markovic', label: 'Nikola Marković', description: 'Site worker, Liman 4' },
  { value: 'stojkovic', label: 'Jelena Stojković', description: 'Planning engineer' },
  { value: 'ilic', label: 'Marko Ilić', description: 'Foreman, crew Ilić' },
  { value: 'popovic', label: 'Snežana Popović', description: 'Site manager, Liman 4' },
]

export const VEHICLES = [
  { value: 'os-0133', label: 'Pickup Toyota Hilux NS-911-LM (OS-0133)' },
  { value: 'os-0118-truck', label: 'Truck MAN TGL NS-377-ZK (rented)' },
]

export const COST_CENTRES = [
  { value: '310', label: '310 Residential building Liman 4' },
  { value: '320', label: '320 Bulevar Evrope 24' },
  { value: '330', label: '330 Hall B extension' },
  { value: '100', label: '100 Administration' },
]

export type Transport = 'company' | 'own' | 'public'

export const NEW_ORDER = {
  number: 'PN-2026-052',
  traveller: 'markovic',
  destination: 'Subotica',
  purpose: 'Collecting formwork panels from Oplate Sever d.o.o. for Site Liman 4.',
  departure: '2026-10-19',
  return: '2026-10-19',
  transport: 'company' as Transport,
  vehicle: 'os-0133',
  costCentre: '310',
  advance: '3000.00',
  approver: 'Snežana Popović, site manager',
}

// ── Settlements ───────────────────────────────────────────────────────────────────────────────

export type SettlementState = 'Draft' | 'To approve' | 'Approved' | 'Rejected'

export const SETTLEMENT_TONES: Record<SettlementState, Tone> = {
  Draft: 'neutral',
  'To approve': 'warning',
  Approved: 'success',
  Rejected: 'danger',
}

export interface TravelExpense {
  id: string
  date: string
  kind: string
  description: string
  amount: string
  /** The receipt's photo (an attachment's id), or null while it is missing. */
  receipt: string | null
}

export interface PerDiemRow {
  id: string
  /** The span of the trip it covers, in the application's words. */
  span: string
  hours: string
  /** "1", "½", "—". */
  count: string
  amount: string
}

export interface Settlement {
  number: string
  traveller: string
  role: string
  destination: string
  purpose: string
  /** Departure and return, as the application writes them. */
  departed: string
  returned: string
  duration: string
  transport: string
  costCentre: string
  expenses: readonly TravelExpense[]
  receipts: readonly Attachment[]
  perDiems: readonly PerDiemRow[]
  totals: {
    expenses: string
    perDiems: string
    costs: string
    advance: string
    /** To pay to the traveller (positive) or to return to the company. */
    result: string
    resultKind: 'pay' | 'return'
  }
  state: SettlementState
  submitted?: string
}

const photo = (id: string, name: string, sizeText: string): Attachment => ({
  id,
  name,
  sizeText,
  state: 'available',
})

/** Jelena Stojković's settlement, the taxi's receipt still to photograph. */
export const JELENA: Settlement = {
  number: 'PN-2026-047',
  traveller: 'Jelena Stojković',
  role: 'Planning engineer',
  destination: 'Beograd',
  purpose: 'Coordination meeting at Stanogradnja Plus d.o.o. on Residential building Liman 4.',
  departed: '06.10.2026. 07:00',
  returned: '07.10.2026. 19:30',
  duration: '36 h 30 min',
  transport: 'Bus',
  costCentre: '310 Residential building Liman 4',
  expenses: [
    {
      id: 'j1',
      date: '2026-10-06',
      kind: 'Ticket',
      description: 'Bus Novi Sad – Beograd',
      amount: '1120.00',
      receipt: 'r-j1',
    },
    {
      id: 'j2',
      date: '2026-10-06',
      kind: 'Lodging',
      description: 'Hotel Dunav, one night',
      amount: '9800.00',
      receipt: 'r-j2',
    },
    {
      id: 'j3',
      date: '2026-10-07',
      kind: 'Taxi',
      description: 'To Stanogradnja Plus d.o.o. and back',
      amount: '1450.00',
      receipt: null,
    },
    {
      id: 'j4',
      date: '2026-10-07',
      kind: 'Ticket',
      description: 'Bus Beograd – Novi Sad',
      amount: '1120.00',
      receipt: 'r-j4',
    },
  ],
  receipts: [
    photo('r-j1', 'Bus_ticket_06-10.jpg', '1,2 MB'),
    photo('r-j2', 'Hotel_Dunav_racun.jpg', '2,4 MB'),
    photo('r-j4', 'Bus_ticket_07-10.jpg', '1,1 MB'),
  ],
  perDiems: [
    {
      id: 'p1',
      span: '06.10. 07:00 – 07.10. 07:00',
      hours: '24 h',
      count: '1',
      amount: '3300.00',
    },
    {
      id: 'p2',
      span: '07.10. 07:00 – 19:30',
      hours: '12 h 30 min',
      count: '1',
      amount: '3300.00',
    },
  ],
  totals: {
    expenses: '13490.00',
    perDiems: '6600.00',
    costs: '20090.00',
    advance: '10000.00',
    result: '10090.00',
    resultKind: 'pay',
  },
  state: 'Draft',
}

/** The taxi's receipt as the application files it after the photo. */
export const TAXI_RECEIPT = photo('r-j3', 'Taxi_07-10.jpg', '0,9 MB')

/** The settlements waiting for Milica Petrović's approval. */
export const TO_APPROVE: readonly Settlement[] = [
  {
    number: 'PN-2026-044',
    traveller: 'Nikola Marković',
    role: 'Site worker',
    destination: 'Subotica',
    purpose: 'Collecting formwork ties from Oplate Sever d.o.o.',
    departed: '01.10.2026. 06:00',
    returned: '01.10.2026. 18:30',
    duration: '12 h 30 min',
    transport: 'Pickup Toyota Hilux NS-911-LM',
    costCentre: '310 Residential building Liman 4',
    expenses: [
      {
        id: 'n1',
        date: '2026-10-01',
        kind: 'Fuel',
        description: 'Diesel, 24 l',
        amount: '4200.00',
        receipt: 'r-n1',
      },
      {
        id: 'n2',
        date: '2026-10-01',
        kind: 'Tolls',
        description: 'Novi Sad – Subotica and back',
        amount: '580.00',
        receipt: 'r-n2',
      },
    ],
    receipts: [
      photo('r-n1', 'Gorivo_01-10.jpg', '1,6 MB'),
      photo('r-n2', 'Putarina_01-10.jpg', '0,8 MB'),
    ],
    perDiems: [
      {
        id: 'p1',
        span: '01.10. 06:00 – 18:30',
        hours: '12 h 30 min',
        count: '1',
        amount: '3300.00',
      },
    ],
    totals: {
      expenses: '4780.00',
      perDiems: '3300.00',
      costs: '8080.00',
      advance: '10000.00',
      result: '1920.00',
      resultKind: 'return',
    },
    state: 'To approve',
    submitted: '2026-10-08',
  },
  {
    number: 'PN-2026-045',
    traveller: 'Stefan Nikolić',
    role: 'Site manager, Bulevar Evrope 24',
    destination: 'Zrenjanin',
    purpose: 'Inspection of the precast elements at Beton Mix d.o.o.’s plant.',
    departed: '02.10.2026. 07:30',
    returned: '02.10.2026. 15:00',
    duration: '7 h 30 min',
    transport: 'Pickup Toyota Hilux NS-911-LM',
    costCentre: '320 Bulevar Evrope 24',
    expenses: [
      {
        id: 's1',
        date: '2026-10-02',
        kind: 'Fuel',
        description: 'Diesel, 17 l',
        amount: '2950.00',
        receipt: 'r-s1',
      },
      {
        id: 's2',
        date: '2026-10-02',
        kind: 'Parking',
        description: 'Zrenjanin, 3 hours',
        amount: '300.00',
        receipt: 'r-s2',
      },
    ],
    receipts: [
      photo('r-s1', 'Gorivo_02-10.jpg', '1,4 MB'),
      photo('r-s2', 'Parking_Zrenjanin.jpg', '0,6 MB'),
    ],
    perDiems: [
      {
        id: 'p1',
        span: '02.10. 07:30 – 15:00',
        hours: '7 h 30 min',
        count: '—',
        amount: '0.00',
      },
    ],
    totals: {
      expenses: '3250.00',
      perDiems: '0.00',
      costs: '3250.00',
      advance: '0.00',
      result: '3250.00',
      resultKind: 'pay',
    },
    state: 'To approve',
    submitted: '2026-10-09',
  },
  {
    number: 'PN-2026-046',
    traveller: 'Goran Medić',
    role: 'Head of construction',
    destination: 'Beograd',
    purpose: 'Meeting at the Illustrative Ministry’s building inspection.',
    departed: '05.10.2026. 08:00',
    returned: '05.10.2026. 19:00',
    duration: '11 h',
    transport: 'Train',
    costCentre: '100 Administration',
    expenses: [
      {
        id: 'g1',
        date: '2026-10-05',
        kind: 'Ticket',
        description: 'Train Novi Sad – Beograd and back',
        amount: '2760.00',
        receipt: 'r-g1',
      },
      {
        id: 'g2',
        date: '2026-10-05',
        kind: 'Taxi',
        description: 'Station – ministry and back',
        amount: '1200.00',
        receipt: 'r-g2',
      },
    ],
    receipts: [photo('r-g1', 'Voz_05-10.pdf', '0,3 MB'), photo('r-g2', 'Taxi_05-10.jpg', '0,7 MB')],
    perDiems: [
      {
        id: 'p1',
        span: '05.10. 08:00 – 19:00',
        hours: '11 h',
        count: '½',
        amount: '1650.00',
      },
    ],
    totals: {
      expenses: '3960.00',
      perDiems: '1650.00',
      costs: '5610.00',
      advance: '0.00',
      result: '5610.00',
      resultKind: 'pay',
    },
    state: 'To approve',
    submitted: '2026-10-12',
  },
]

export const REJECT_REASONS = [
  { value: 'receipt', label: 'A receipt is missing or cannot be read' },
  { value: 'expense', label: 'An expense is not covered by the order' },
  { value: 'times', label: 'The departure or return time is wrong' },
]
