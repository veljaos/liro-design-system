/*
 * Fictitious data for the dashboard, report and settings stories. Not part of the package: nothing
 * in src/index.ts imports this file. No classes here: Storybook compiles classes only from
 * *.stories.tsx files.
 */
import type { CartesianChartProps } from '../charts'

export const MONTHS = [
  { key: '04', label: 'Apr' },
  { key: '05', label: 'May' },
  { key: '06', label: 'Jun' },
  { key: '07', label: 'Jul' },
  { key: '08', label: 'Aug' },
  { key: '09', label: 'Sep' },
]

export const REVENUE: CartesianChartProps = {
  title: 'Revenue',
  description: 'Thousands of RSD, without VAT',
  categories: MONTHS,
  series: [
    { key: 'y2026', label: '2026', role: 'main' },
    { key: 'y2025', label: '2025', role: 'comparison' },
  ],
  values: {
    y2026: {
      '04': '4812.4',
      '05': '5230.9',
      '06': '4977.1',
      '07': '3906.5',
      '08': '4421.8',
      '09': '5684.2',
    },
    y2025: {
      '04': '4390.2',
      '05': '4718.6',
      '06': '4655.0',
      '07': '3711.3',
      '08': '3958.7',
      '09': '4870.1',
    },
  },
  decimals: 1,
}

export const TOP_CUSTOMERS: CartesianChartProps = {
  title: 'Top 5 customers by revenue',
  description: 'Thousands of RSD, January–September 2026',
  categories: [
    { key: 'panonija', label: 'Panonija Agro d.o.o.' },
    { key: 'bojovic', label: 'Bojović i sinovi d.o.o.' },
    { key: 'vojvodjanka', label: 'Vojvođanka Mlin a.d.' },
    { key: 'medic', label: 'Medic Lab Niš d.o.o.' },
    { key: 'stanic', label: 'Stanić Elektro STR' },
  ],
  series: [{ key: 'revenue', label: 'Revenue' }],
  values: {
    revenue: {
      panonija: '6842.5',
      bojovic: '5120.8',
      vojvodjanka: '3977.2',
      medic: '2415.6',
      stanic: '1988.3',
    },
  },
  decimals: 1,
}

export const CASH: CartesianChartProps = {
  title: 'Cash at month end',
  description: 'Thousands of RSD, all accounts',
  categories: MONTHS,
  series: [{ key: 'cash', label: 'Cash' }],
  values: {
    cash: {
      '04': '2481.3',
      '05': '2913.8',
      '06': '2104.3',
      '07': '1688.4',
      '08': '2245.9',
      '09': '3012.8',
    },
  },
  decimals: 1,
}

/** Account card 2040 (customers in the country), the result of a report run. */
export interface LedgerRow {
  id: string
  date: string
  document: string
  description: string
  debit: string | null
  credit: string | null
  balance: string
}

export const LEDGER: LedgerRow[] = [
  {
    id: '1',
    date: '2026-09-01',
    document: 'Opening',
    description: 'Balance brought forward',
    debit: null,
    credit: null,
    balance: '1904211.40',
  },
  {
    id: '2',
    date: '2026-09-04',
    document: 'F-2026-0398',
    description: 'Panonija Agro d.o.o.',
    debit: '84600.00',
    credit: null,
    balance: '1988811.40',
  },
  {
    id: '3',
    date: '2026-09-08',
    document: 'IZ-2026-171',
    description: 'Payment, Drina Prevoz d.o.o.',
    debit: null,
    credit: '120000.00',
    balance: '1868811.40',
  },
  {
    id: '4',
    date: '2026-09-12',
    document: 'F-2026-0404',
    description: 'Knjigovodstvo Jelić',
    debit: '14400.00',
    credit: null,
    balance: '1883211.40',
  },
  {
    id: '5',
    date: '2026-09-22',
    document: 'F-2026-0409',
    description: 'Stanić Elektro STR',
    debit: '23918.40',
    credit: null,
    balance: '1907129.80',
  },
  {
    id: '6',
    date: '2026-09-26',
    document: 'IZ-2026-184',
    description: 'Payment, Stanić Elektro STR',
    debit: null,
    credit: '23918.40',
    balance: '1883211.40',
  },
]
