/*
 * Group BZ's example data (P5.85, transaction monitoring alerts): the alerts the application's
 * monitoring rules raised over the transactions Knjigovodstvo Jelić books and handles for its
 * clients, on 14 October 2026 and before. Each alert names the rule (with what it watches and its
 * threshold, in the application's words), the client, the transactions that triggered it, the
 * amount they add up to (given by the application, never summed here), the alert's age in the
 * application's words, who it is assigned to and its state. Closing with a reason and escalating
 * to a case are the compliance officer's decisions, recorded with the reason the application
 * requires. The monitored company of the examples is Adria Commodities d.o.o. (the invented
 * metals wholesaler of data-aml.ts); Kvadrat Gradnja d.o.o.'s receipt comes from its sales to
 * Stanogradnja Plus d.o.o. (data-AV's order NAR-2026-0024). Nothing here scores, matches or
 * decides; every rule, threshold, counterparty and amount is invented. Not part of the package.
 * No classes here.
 */
import type { ConfirmReason, HistoryEntry, Tone } from '@veljaos/ui'
import { amlAt } from './data-aml'

export const BZ_ROUTES = {
  /** The alert queue (WorklistPage). */
  alerts: '/aml/alerts',
  /** The queue on its "Closed" view (closed and escalated alerts). */
  alertsClosed: '/aml/alerts?view=closed',
  /** The queue with one alert chosen. */
  alert: (id: string) => `/aml/alerts?alert=${id}`,
  /** The queue with a decision asked on an alert. */
  alertAct: (id: string, act: 'close' | 'escalate') => `/aml/alerts?alert=${id}&act=${act}`,
} as const

export type AlertState = 'Open' | 'In review' | 'Closed' | 'Escalated'

export const ALERT_TONES: Record<AlertState, Tone> = {
  Open: 'warning',
  'In review': 'info',
  Closed: 'neutral',
  Escalated: 'danger',
}

/** A monitoring rule, as the application defines it. */
export interface AlertRule {
  id: string
  name: string
  /** What the rule watches and its threshold, in the application's words. */
  watches: string
}

export const ALERT_RULES: readonly AlertRule[] = [
  {
    id: 'new-country',
    name: 'Payments to a country outside the client’s profile',
    watches:
      'A payment to a country the client’s expected activity does not name. Illustrative rule R-04.',
  },
  {
    id: 'round-new',
    name: 'Round amounts to a new counterparty',
    watches:
      'Two or more payments in round amounts of 1.000.000,00 RSD or more, within 14 days, to a counterparty first paid less than 30 days ago. Illustrative rule R-07.',
  },
  {
    id: 'cash-threshold',
    name: 'Cash payments above the threshold',
    watches:
      'Cash payments of more than 1.000.000,00 RSD in total within 7 days. Illustrative rule R-01.',
  },
  {
    id: 'expected-activity',
    name: 'Transaction out of line with the expected activity',
    watches:
      'One receipt or payment larger than the client’s expected monthly turnover. Illustrative rule R-03.',
  },
  {
    id: 'in-out',
    name: 'Funds received and paid on within two days',
    watches:
      'A receipt of 1.000.000,00 RSD or more followed within two days by a payment of 90% or more of it. Illustrative rule R-09.',
  },
  {
    id: 'structuring',
    name: 'Several cash deposits just below the threshold',
    watches:
      'Three or more cash deposits within 7 days, each between 450.000,00 and 500.000,00 RSD. Illustrative rule R-02.',
  },
]

export function alertRule(id: string): AlertRule {
  const rule = ALERT_RULES.find((each) => each.id === id)
  if (rule === undefined) throw new Error(`No rule ${id}`)
  return rule
}

/** One transaction the application's rule looked at. */
export interface MonitoredTransaction {
  id: string
  /** YYYY-MM-DD. */
  date: string
  counterparty: string
  direction: 'In' | 'Out'
  /** A decimal string. */
  amount: string
  currency: string
  /** The payment's description, as booked. */
  description: string
  /** The application's mark on the transaction ("New counterparty", "Cash"). */
  note?: string
}

/** The compliance officer's decision on an alert, with the reason the application requires. */
export interface AlertDecision {
  state: 'Closed' | 'Escalated'
  reason: string
  details: string
  by: string
  at: string
  /** The case an escalated alert went to. */
  caseId?: string
}

export interface MonitoringAlert {
  id: string
  clientId: string
  ruleId: string
  /** When the application raised it. */
  raised: string
  /** The alert's age, in the application's words ("5 days"). */
  ageText: string
  /** The transactions’ total, as the application gives it. */
  amount: string
  currency: string
  /** Who reviews it; null while unassigned. */
  assignee: string | null
  state: AlertState
  /** The application's summary of what the rule found. */
  summary: string
  transactions: readonly MonitoredTransaction[]
  history: readonly HistoryEntry[]
  decision?: AlertDecision
}

function raised(id: string, at: string, rule: string): HistoryEntry {
  return {
    id: `${id}-raised`,
    at,
    actor: { name: 'Liro monitoring', kind: 'system' },
    text: `Alert raised by the rule “${rule}”.`,
  }
}

function assigned(id: string, at: string, by: string, to: string): HistoryEntry {
  return {
    id: `${id}-assigned`,
    at,
    actor: { name: by },
    text: `Assigned to ${to}.`,
    changes: [{ field: 'Assignee', to }],
  }
}

/** The alerts, newest first (the application's order). */
export const MONITORING_ALERTS: readonly MonitoringAlert[] = [
  {
    id: 'TM-2026-0231',
    clientId: 'adria',
    ruleId: 'new-country',
    raised: amlAt('2026-10-12', '06:10'),
    ageText: '2 days',
    amount: '186400.00',
    currency: 'EUR',
    assignee: 'Snežana Jelić',
    state: 'Open',
    summary:
      'Three payments in four days to Horizon Metals FZE in the United Arab Emirates. The client’s profile expects payments abroad in euros to buyers in the region only.',
    transactions: [
      {
        id: 't-0231-1',
        date: '2026-10-09',
        counterparty: 'Horizon Metals FZE, United Arab Emirates',
        direction: 'Out',
        amount: '68400.00',
        currency: 'EUR',
        description: 'Advance for copper cathodes, PI 2026/118',
        note: 'Country not in the profile',
      },
      {
        id: 't-0231-2',
        date: '2026-10-10',
        counterparty: 'Horizon Metals FZE, United Arab Emirates',
        direction: 'Out',
        amount: '59000.00',
        currency: 'EUR',
        description: 'Advance for copper cathodes, PI 2026/119',
        note: 'Country not in the profile',
      },
      {
        id: 't-0231-3',
        date: '2026-10-12',
        counterparty: 'Horizon Metals FZE, United Arab Emirates',
        direction: 'Out',
        amount: '59000.00',
        currency: 'EUR',
        description: 'Advance for copper cathodes, PI 2026/120',
        note: 'Country not in the profile',
      },
    ],
    history: [
      assigned('TM-2026-0231', amlAt('2026-10-12', '08:45'), 'Snežana Jelić', 'Snežana Jelić'),
      raised(
        'TM-2026-0231',
        amlAt('2026-10-12', '06:10'),
        'Payments to a country outside the client’s profile',
      ),
    ],
  },
  {
    id: 'TM-2026-0229',
    clientId: 'adria',
    ruleId: 'round-new',
    raised: amlAt('2026-10-10', '06:05'),
    ageText: '4 days',
    amount: '20000000.00',
    currency: 'RSD',
    assignee: null,
    state: 'Open',
    summary:
      'Four payments of exactly 5.000.000,00 RSD on four consecutive days to Balkan Scrap Trade d.o.o., a counterparty first paid on 01.10.2026.',
    transactions: ['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'].map((date, index) => ({
      id: `t-0229-${String(index + 1)}`,
      date,
      counterparty: 'Balkan Scrap Trade d.o.o.',
      direction: 'Out' as const,
      amount: '5000000.00',
      currency: 'RSD',
      description: `Scrap metal, contract 14/2026, instalment ${String(index + 1)}`,
      note: 'New counterparty',
    })),
    history: [
      raised('TM-2026-0229', amlAt('2026-10-10', '06:05'), 'Round amounts to a new counterparty'),
    ],
  },
  {
    id: 'TM-2026-0228',
    clientId: 'panonija',
    ruleId: 'cash-threshold',
    raised: amlAt('2026-10-09', '06:05'),
    ageText: '5 days',
    amount: '2460000.00',
    currency: 'RSD',
    assignee: 'Marko Jelić',
    state: 'Open',
    summary:
      'Five cash payments to farmers in five days, 2.460.000,00 RSD in total; the threshold is 1.000.000,00 RSD in 7 days. The client’s profile names seasonal cash purchases from farmers.',
    transactions: [
      [
        't-0228-1',
        '2026-10-05',
        'Milan Đurić, farmer',
        '520000.00',
        'Sunflower seed, receipt 2026/341',
      ],
      [
        't-0228-2',
        '2026-10-06',
        'Zorica Vasić, farmer',
        '480000.00',
        'Sunflower seed, receipt 2026/342',
      ],
      ['t-0228-3', '2026-10-07', 'Dragan Mitić, farmer', '610000.00', 'Soybean, receipt 2026/343'],
      ['t-0228-4', '2026-10-08', 'Jovan Perić, farmer', '450000.00', 'Soybean, receipt 2026/344'],
      [
        't-0228-5',
        '2026-10-09',
        'Milan Đurić, farmer',
        '400000.00',
        'Sunflower seed, receipt 2026/345',
      ],
    ].map(([id, date, counterparty, amount, description]) => ({
      id: id ?? '',
      date: date ?? '',
      counterparty: counterparty ?? '',
      direction: 'Out' as const,
      amount: amount ?? '',
      currency: 'RSD',
      description: description ?? '',
      note: 'Cash',
    })),
    history: [
      assigned('TM-2026-0228', amlAt('2026-10-09', '09:00'), 'Snežana Jelić', 'Marko Jelić'),
      raised('TM-2026-0228', amlAt('2026-10-09', '06:05'), 'Cash payments above the threshold'),
    ],
  },
  {
    id: 'TM-2026-0226',
    clientId: 'kvadrat',
    ruleId: 'expected-activity',
    raised: amlAt('2026-10-08', '06:05'),
    ageText: '6 days',
    amount: '48600000.00',
    currency: 'RSD',
    assignee: 'Snežana Jelić',
    state: 'Open',
    summary:
      'One receipt of 48.600.000,00 RSD from Stanogradnja Plus d.o.o.; the client’s expected monthly turnover is 25–40 million RSD.',
    transactions: [
      {
        id: 't-0226-1',
        date: '2026-10-07',
        counterparty: 'Stanogradnja Plus d.o.o.',
        direction: 'In',
        amount: '48600000.00',
        currency: 'RSD',
        description: 'Advance for precast stairs, order NAR-2026-0024',
        note: 'Above the expected turnover',
      },
    ],
    history: [
      assigned('TM-2026-0226', amlAt('2026-10-08', '08:30'), 'Snežana Jelić', 'Snežana Jelić'),
      raised(
        'TM-2026-0226',
        amlAt('2026-10-08', '06:05'),
        'Transaction out of line with the expected activity',
      ),
    ],
  },
  {
    id: 'TM-2026-0224',
    clientId: 'drina',
    ruleId: 'in-out',
    raised: amlAt('2026-10-06', '06:05'),
    ageText: '8 days',
    amount: '3200000.00',
    currency: 'RSD',
    assignee: 'Marko Jelić',
    state: 'Escalated',
    summary:
      '3.200.000,00 RSD received from Trans Balkan Logistik d.o.o. on 05.10.2026 and 3.150.000,00 RSD paid to Autoprevoz Ilić the next day.',
    transactions: [
      {
        id: 't-0224-1',
        date: '2026-10-05',
        counterparty: 'Trans Balkan Logistik d.o.o.',
        direction: 'In',
        amount: '3200000.00',
        currency: 'RSD',
        description: 'Transport services, invoice 2026-088',
      },
      {
        id: 't-0224-2',
        date: '2026-10-06',
        counterparty: 'Autoprevoz Ilić',
        direction: 'Out',
        amount: '3150000.00',
        currency: 'RSD',
        description: 'Subcontracted transport, invoice 41/26',
        note: 'Paid on within two days',
      },
    ],
    history: [
      {
        id: 'TM-2026-0224-escalated',
        at: amlAt('2026-10-08', '14:30'),
        actor: { name: 'Marko Jelić' },
        text: 'Escalated to case CM-2026-0006.',
        changes: [{ field: 'State', from: 'In review', to: 'Escalated' }],
      },
      {
        id: 'TM-2026-0224-note',
        at: amlAt('2026-10-08', '14:10'),
        actor: { name: 'Marko Jelić' },
        text: 'Asked the client’s accountant for the transport contracts behind both invoices (an ordinary bookkeeping question).',
      },
      assigned('TM-2026-0224', amlAt('2026-10-06', '08:40'), 'Snežana Jelić', 'Marko Jelić'),
      raised(
        'TM-2026-0224',
        amlAt('2026-10-06', '06:05'),
        'Funds received and paid on within two days',
      ),
    ],
    decision: {
      state: 'Escalated',
      reason: 'Pattern not explained',
      details:
        'Received and paid on within a day; the contracts behind both invoices are asked for.',
      by: 'Marko Jelić',
      at: amlAt('2026-10-08', '14:30'),
      caseId: 'CM-2026-0006',
    },
  },
  {
    id: 'TM-2026-0219',
    clientId: 'fruska',
    ruleId: 'structuring',
    raised: amlAt('2026-10-02', '06:05'),
    ageText: '12 days',
    amount: '2925000.00',
    currency: 'RSD',
    assignee: 'Snežana Jelić',
    state: 'In review',
    summary:
      'Six cash deposits in four days, each between 480.000,00 and 495.000,00 RSD. The same pattern in August was explained by the restaurant’s weekend takings (case CM-2026-0005).',
    transactions: [
      ['t-0219-1', '2026-09-29', '490000.00'],
      ['t-0219-2', '2026-09-29', '485000.00'],
      ['t-0219-3', '2026-09-30', '495000.00'],
      ['t-0219-4', '2026-10-01', '480000.00'],
      ['t-0219-5', '2026-10-01', '490000.00'],
      ['t-0219-6', '2026-10-02', '485000.00'],
    ].map(([id, date, amount]) => ({
      id: id ?? '',
      date: date ?? '',
      counterparty: 'Hotel Fruška d.o.o. (own deposit)',
      direction: 'In' as const,
      amount: amount ?? '',
      currency: 'RSD',
      description: 'Cash deposit, restaurant takings',
      note: 'Just below the threshold',
    })),
    history: [
      assigned('TM-2026-0219', amlAt('2026-10-02', '08:50'), 'Snežana Jelić', 'Snežana Jelić'),
      raised(
        'TM-2026-0219',
        amlAt('2026-10-02', '06:05'),
        'Several cash deposits just below the threshold',
      ),
    ],
  },
  {
    id: 'TM-2026-0218',
    clientId: 'adria',
    ruleId: 'round-new',
    raised: amlAt('2026-09-28', '06:05'),
    ageText: '16 days',
    amount: '9800000.00',
    currency: 'RSD',
    assignee: 'Snežana Jelić',
    state: 'Escalated',
    summary:
      'Two payments of 4.900.000,00 RSD to Balkan Scrap Trade d.o.o. within a week of the counterparty’s first payment.',
    transactions: [
      {
        id: 't-0218-1',
        date: '2026-09-24',
        counterparty: 'Balkan Scrap Trade d.o.o.',
        direction: 'Out',
        amount: '4900000.00',
        currency: 'RSD',
        description: 'Scrap metal, contract 14/2026, advance',
        note: 'New counterparty',
      },
      {
        id: 't-0218-2',
        date: '2026-09-26',
        counterparty: 'Balkan Scrap Trade d.o.o.',
        direction: 'Out',
        amount: '4900000.00',
        currency: 'RSD',
        description: 'Scrap metal, contract 14/2026, advance',
        note: 'New counterparty',
      },
    ],
    history: [
      {
        id: 'TM-2026-0218-escalated',
        at: amlAt('2026-10-14', '08:30'),
        actor: { name: 'Snežana Jelić' },
        text: 'Escalated to case CM-2026-0007 together with the screening match SH-2026-0413.',
        changes: [{ field: 'State', from: 'In review', to: 'Escalated' }],
      },
      assigned('TM-2026-0218', amlAt('2026-09-28', '09:15'), 'Snežana Jelić', 'Snežana Jelić'),
      raised('TM-2026-0218', amlAt('2026-09-28', '06:05'), 'Round amounts to a new counterparty'),
    ],
    decision: {
      state: 'Escalated',
      reason: 'Linked to a screening match',
      details:
        'The owner of the client is a potential match on the Illustrative sanctions list (SH-2026-0413); the payments are reviewed with it.',
      by: 'Snežana Jelić',
      at: amlAt('2026-10-14', '08:30'),
      caseId: 'CM-2026-0007',
    },
  },
  {
    id: 'TM-2026-0215',
    clientId: 'stanic',
    ruleId: 'expected-activity',
    raised: amlAt('2026-09-26', '06:05'),
    ageText: '18 days',
    amount: '2800000.00',
    currency: 'RSD',
    assignee: 'Marko Jelić',
    state: 'Closed',
    summary:
      'One receipt of 2.800.000,00 RSD from Stanogradnja Plus d.o.o.; the client’s expected monthly turnover is 1–2 million RSD.',
    transactions: [
      {
        id: 't-0215-1',
        date: '2026-09-25',
        counterparty: 'Stanogradnja Plus d.o.o.',
        direction: 'In',
        amount: '2800000.00',
        currency: 'RSD',
        description: 'Electrical installation, building B, invoice 31/2026',
        note: 'Above the expected turnover',
      },
    ],
    history: [
      {
        id: 'TM-2026-0215-closed',
        at: amlAt('2026-10-08', '11:20'),
        actor: { name: 'Marko Jelić' },
        text: 'Closed: explained by the client’s business.',
        changes: [{ field: 'State', from: 'In review', to: 'Closed' }],
      },
      assigned('TM-2026-0215', amlAt('2026-09-26', '09:00'), 'Snežana Jelić', 'Marko Jelić'),
      raised(
        'TM-2026-0215',
        amlAt('2026-09-26', '06:05'),
        'Transaction out of line with the expected activity',
      ),
    ],
    decision: {
      state: 'Closed',
      reason: 'Explained by the client’s business',
      details:
        'A subcontract for the electrical installation of building B, signed 02.06.2026; the invoice and the acceptance record are in the client’s books.',
      by: 'Marko Jelić',
      at: amlAt('2026-10-08', '11:20'),
    },
  },
  {
    id: 'TM-2026-0210',
    clientId: 'medic',
    ruleId: 'new-country',
    raised: amlAt('2026-09-19', '06:05'),
    ageText: '25 days',
    amount: '42300.00',
    currency: 'EUR',
    assignee: 'Snežana Jelić',
    state: 'Closed',
    summary: 'One payment to Labortechnik Weber GmbH in Germany; the profile names Serbia only.',
    transactions: [
      {
        id: 't-0210-1',
        date: '2026-09-18',
        counterparty: 'Labortechnik Weber GmbH, Germany',
        direction: 'Out',
        amount: '42300.00',
        currency: 'EUR',
        description: 'Haematology analyser, invoice 2026-7731',
        note: 'Country not in the profile',
      },
    ],
    history: [
      {
        id: 'TM-2026-0210-closed',
        at: amlAt('2026-10-03', '10:05'),
        actor: { name: 'Snežana Jelić' },
        text: 'Closed: source of funds documented.',
        changes: [{ field: 'State', from: 'In review', to: 'Closed' }],
      },
      assigned('TM-2026-0210', amlAt('2026-09-19', '08:30'), 'Snežana Jelić', 'Snežana Jelić'),
      raised(
        'TM-2026-0210',
        amlAt('2026-09-19', '06:05'),
        'Payments to a country outside the client’s profile',
      ),
    ],
    decision: {
      state: 'Closed',
      reason: 'Source of funds documented',
      details:
        'Laboratory equipment bought with a documented bank loan; the profile is updated to name equipment suppliers in the EU.',
      by: 'Snežana Jelić',
      at: amlAt('2026-10-03', '10:05'),
    },
  },
  {
    id: 'TM-2026-0197',
    clientId: 'fruska',
    ruleId: 'structuring',
    raised: amlAt('2026-08-18', '06:05'),
    ageText: '57 days',
    amount: '2415000.00',
    currency: 'RSD',
    assignee: 'Snežana Jelić',
    state: 'Escalated',
    summary: 'Five cash deposits in three days, each between 470.000,00 and 495.000,00 RSD.',
    transactions: [
      ['t-0197-1', '2026-08-15', '495000.00'],
      ['t-0197-2', '2026-08-15', '490000.00'],
      ['t-0197-3', '2026-08-16', '480000.00'],
      ['t-0197-4', '2026-08-17', '470000.00'],
      ['t-0197-5', '2026-08-17', '480000.00'],
    ].map(([id, date, amount]) => ({
      id: id ?? '',
      date: date ?? '',
      counterparty: 'Hotel Fruška d.o.o. (own deposit)',
      direction: 'In' as const,
      amount: amount ?? '',
      currency: 'RSD',
      description: 'Cash deposit, restaurant takings',
      note: 'Just below the threshold',
    })),
    history: [
      {
        id: 'TM-2026-0197-escalated',
        at: amlAt('2026-08-26', '09:10'),
        actor: { name: 'Snežana Jelić' },
        text: 'Escalated to case CM-2026-0005.',
        changes: [{ field: 'State', from: 'In review', to: 'Escalated' }],
      },
      assigned('TM-2026-0197', amlAt('2026-08-18', '08:30'), 'Snežana Jelić', 'Snežana Jelić'),
      raised(
        'TM-2026-0197',
        amlAt('2026-08-18', '06:05'),
        'Several cash deposits just below the threshold',
      ),
    ],
    decision: {
      state: 'Escalated',
      reason: 'Possible structuring',
      details: 'The deposits are checked against the restaurant’s fiscal journal.',
      by: 'Snežana Jelić',
      at: amlAt('2026-08-26', '09:10'),
      caseId: 'CM-2026-0005',
    },
  },
]

export function monitoringAlert(id: string): MonitoringAlert {
  const alert = MONITORING_ALERTS.find((each) => each.id === id)
  if (alert === undefined) throw new Error(`No alert ${id}`)
  return alert
}

/** The reasons the application accepts for closing an alert. */
export const CLOSE_REASONS: readonly ConfirmReason[] = [
  { value: 'business', label: 'Explained by the client’s business' },
  { value: 'funds', label: 'Source of funds documented' },
  { value: 'duplicate', label: 'Duplicate of another alert' },
  { value: 'other', label: 'Another reason, in the details' },
]

/** The reasons the application accepts for escalating an alert to a case. */
export const ESCALATE_REASONS: readonly ConfirmReason[] = [
  { value: 'pattern', label: 'Pattern not explained' },
  { value: 'match', label: 'Linked to a screening match' },
  { value: 'structuring', label: 'Possible structuring' },
  { value: 'other', label: 'Another reason, in the details' },
]
