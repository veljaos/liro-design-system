/*
 * Group AO's example data (P5.56): late-payment interest that Kvadrat Gradnja d.o.o. charges
 * Stanogradnja Plus d.o.o. for 01.01.–14.10.2026, and the interest note it issues. The rates are
 * "Illustrative statutory default interest" (invented: an illustrative reference rate plus eight
 * points); the days, the split at a change of rate and every interest amount are the Core's
 * (simple interest, actual days over 365, rounded to the para), written here as decimal strings.
 * F-2026-0389 is the overdue invoice of group W's statement of open items. Not part of the
 * package. No classes here.
 */

export const AO_ROUTES = {
  calculation: '/accounting/interest',
  /** The calculation with "Issue interest note" asked. */
  calculationIssue: '/accounting/interest?issue',
  note: '/accounting/interest/KM-2026-0007',
}

export const PARTNER = {
  name: 'Stanogradnja Plus d.o.o.',
  taxId: 'PIB 108990341',
  address: 'Futoški put 46, 21000 Novi Sad',
}

/** The partners the calculation can be run for (the Core's list). */
export const PARTNERS = [
  { value: 'stanogradnja', label: 'Stanogradnja Plus d.o.o.' },
  { value: 'toplana', label: 'Gradska toplana Novi Sad' },
  { value: 'drina', label: 'Drina Prevoz d.o.o.' },
]

/** One period of the rate table. */
export interface InterestRate {
  id: string
  from: string
  /** null: still in force. */
  to: string | null
  /** The illustrative reference rate, a percentage as a decimal string. */
  reference: string
  /** The points added to it. */
  margin: string
  /** The default interest rate, a year. */
  rate: string
}

export const RATES: readonly InterestRate[] = [
  {
    id: 'r2025b',
    from: '2025-07-01',
    to: '2025-12-31',
    reference: '5.00',
    margin: '8.00',
    rate: '13.00',
  },
  {
    id: 'r2026a',
    from: '2026-01-01',
    to: '2026-06-30',
    reference: '4.75',
    margin: '8.00',
    rate: '12.75',
  },
  { id: 'r2026b', from: '2026-07-01', to: null, reference: '4.50', margin: '8.00', rate: '12.50' },
]

/** One line of the calculation: an amount late for some days at one rate. */
export interface InterestLine {
  id: string
  /** The invoice. */
  document: string
  due: string
  /** When it was paid; null while it is open. */
  paid: string | null
  /** The days counted, first and last included. */
  from: string
  to: string
  days: string
  /** The rate period applied (`RATES`). */
  rateId: string
  rate: string
  /** The amount late in those days. */
  base: string
  interest: string
  /** Why the line ends or splits where it does, with its day. */
  note?: { kind: 'rateChange' | 'partPaid' | 'open'; date?: string; amount?: string }
}

export const LINES: readonly InterestLine[] = [
  {
    id: 'l1',
    document: 'F-2026-0118',
    due: '2026-03-31',
    paid: '2026-04-17',
    from: '2026-04-01',
    to: '2026-04-17',
    days: '17',
    rateId: 'r2026a',
    rate: '12.75',
    base: '1284000.00',
    interest: '7624.85',
  },
  {
    id: 'l2',
    document: 'F-2026-0241',
    due: '2026-06-20',
    paid: '2026-07-15',
    from: '2026-06-21',
    to: '2026-06-30',
    days: '10',
    rateId: 'r2026a',
    rate: '12.75',
    base: '846300.00',
    interest: '2956.25',
    note: { kind: 'rateChange', date: '2026-07-01' },
  },
  {
    id: 'l3',
    document: 'F-2026-0241',
    due: '2026-06-20',
    paid: '2026-07-15',
    from: '2026-07-01',
    to: '2026-07-15',
    days: '15',
    rateId: 'r2026b',
    rate: '12.50',
    base: '846300.00',
    interest: '4347.43',
  },
  {
    id: 'l4',
    document: 'F-2026-0337',
    due: '2026-08-31',
    paid: '2026-10-02',
    from: '2026-09-01',
    to: '2026-09-15',
    days: '15',
    rateId: 'r2026b',
    rate: '12.50',
    base: '1120000.00',
    interest: '5753.42',
    note: { kind: 'partPaid', date: '2026-09-15', amount: '500000.00' },
  },
  {
    id: 'l5',
    document: 'F-2026-0337',
    due: '2026-08-31',
    paid: '2026-10-02',
    from: '2026-09-16',
    to: '2026-10-02',
    days: '17',
    rateId: 'r2026b',
    rate: '12.50',
    base: '620000.00',
    interest: '3609.59',
  },
  {
    id: 'l6',
    document: 'F-2026-0389',
    due: '2026-09-30',
    paid: null,
    from: '2026-10-01',
    to: '2026-10-14',
    days: '14',
    rateId: 'r2026b',
    rate: '12.50',
    base: '2360500.00',
    interest: '11317.47',
    note: { kind: 'open' },
  },
]

/** The calculation's totals, from the Core. */
export const TOTALS = {
  interest: '35609.01',
  invoices: '4',
  /** What is still late today. */
  open: '2360500.00',
}

/** The interest note the calculation issues. */
export const INTEREST_NOTE = {
  number: 'KM-2026-0007',
  date: '2026-10-14',
  due: '2026-10-29',
  period: { from: '2026-01-01', to: '2026-10-14' },
  account: '6620 Interest income',
}
