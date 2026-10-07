/*
 * Fictitious data for the chart stories (P4.7a): a Serbian construction-materials trader,
 * Kvadrat Gradnja d.o.o., in RSD. Not part of the package: nothing in src/charts/index.ts imports
 * this file. No classes here: Storybook compiles classes only from *.stories.tsx files.
 */
import type { CartesianChartProps } from './cartesian'
import type { ChartCategory } from './shared'

export const MONTHS: ChartCategory[] = [
  { key: '2026-04', label: 'Apr' },
  { key: '2026-05', label: 'May' },
  { key: '2026-06', label: 'Jun' },
  { key: '2026-07', label: 'Jul' },
  { key: '2026-08', label: 'Aug' },
  { key: '2026-09', label: 'Sep' },
]

/** Revenue 2026 against 2025, thousands of RSD. */
export const REVENUE: CartesianChartProps = {
  title: 'Revenue',
  description: 'Thousands of RSD, without VAT',
  categories: MONTHS,
  series: [
    { key: 'y2026', label: '2026' },
    { key: 'y2025', label: '2025' },
  ],
  values: {
    y2026: {
      '2026-04': '4812.4',
      '2026-05': '5230.9',
      '2026-06': '4977.1',
      '2026-07': '3906.5',
      '2026-08': '4421.8',
      '2026-09': '5684.2',
    },
    y2025: {
      '2026-04': '4390.2',
      '2026-05': '4718.6',
      '2026-06': '4655.0',
      '2026-07': '3711.3',
      '2026-08': '3958.7',
      '2026-09': '4870.1',
    },
  },
  decimals: 1,
}

/** Revenue by sales channel, thousands of RSD: three series, the categorical palette. */
export const CHANNELS: CartesianChartProps = {
  title: 'Revenue by channel',
  description: 'Thousands of RSD, without VAT',
  categories: MONTHS,
  series: [
    { key: 'retail', label: 'Retail' },
    { key: 'wholesale', label: 'Wholesale' },
    { key: 'online', label: 'Online shop' },
  ],
  values: {
    retail: {
      '2026-04': '1904.6',
      '2026-05': '2110.3',
      '2026-06': '1987.2',
      '2026-07': '1522.8',
      '2026-08': '1730.1',
      '2026-09': '2245.9',
    },
    wholesale: {
      '2026-04': '2401.0',
      '2026-05': '2588.4',
      '2026-06': '2449.5',
      '2026-07': '1951.2',
      '2026-08': '2203.6',
      '2026-09': '2817.3',
    },
    online: {
      '2026-04': '506.8',
      '2026-05': '532.2',
      '2026-06': '540.4',
      '2026-07': '432.5',
      '2026-08': '488.1',
      '2026-09': '621.0',
    },
  },
  palette: 'categorical',
  decimals: 1,
}

/** Payments received by method, thousands of RSD (shown as shares when expanded). */
export const PAYMENT_METHODS: CartesianChartProps = {
  title: 'Payments by method',
  description: 'Share of payments received',
  categories: MONTHS,
  series: [
    { key: 'transfer', label: 'Bank transfer' },
    { key: 'card', label: 'Card' },
    { key: 'cash', label: 'Cash' },
  ],
  values: {
    transfer: {
      '2026-04': '3120.4',
      '2026-05': '3388.0',
      '2026-06': '3215.7',
      '2026-07': '2512.9',
      '2026-08': '2891.4',
      '2026-09': '3702.6',
    },
    card: {
      '2026-04': '1204.8',
      '2026-05': '1372.5',
      '2026-06': '1340.1',
      '2026-07': '1061.0',
      '2026-08': '1180.3',
      '2026-09': '1544.2',
    },
    cash: {
      '2026-04': '487.2',
      '2026-05': '470.4',
      '2026-06': '421.3',
      '2026-07': '332.6',
      '2026-08': '350.1',
      '2026-09': '437.4',
    },
  },
  palette: 'categorical',
  decimals: 1,
}

/** Cash at month end, thousands of RSD; July is missing (the bank statement not yet imported). */
export const CASH: CartesianChartProps = {
  title: 'Cash at month end',
  description: 'Thousands of RSD, all accounts',
  categories: MONTHS,
  series: [{ key: 'cash', label: 'Cash' }],
  values: {
    cash: {
      '2026-04': '2486.3',
      '2026-05': '2894.1',
      '2026-06': '2078.6',
      '2026-07': '1662.9',
      '2026-08': '2215.4',
      '2026-09': '3012.8',
    },
  },
  decimals: 1,
}

/** Money in and out, thousands of RSD. */
export const CASH_FLOW: CartesianChartProps = {
  title: 'Money in and out',
  description: 'Thousands of RSD, all accounts',
  categories: MONTHS,
  series: [
    { key: 'in', label: 'Received' },
    { key: 'out', label: 'Paid' },
  ],
  values: {
    in: {
      '2026-04': '4688.0',
      '2026-05': '5096.4',
      '2026-06': '4801.9',
      '2026-07': '3897.2',
      '2026-08': '4310.6',
      '2026-09': '5512.7',
    },
    out: {
      '2026-04': '4202.5',
      '2026-05': '4688.6',
      '2026-06': '5617.4',
      '2026-07': '4312.9',
      '2026-08': '3758.1',
      '2026-09': '4716.3',
    },
  },
  decimals: 1,
}

/** The National Bank of Serbia's key policy rate: a value that changes in steps. */
export const POLICY_RATE: CartesianChartProps = {
  title: 'NBS key policy rate',
  description: 'Percent per year, at month end',
  categories: [
    { key: '2025-10', label: 'Oct 25' },
    { key: '2025-12', label: 'Dec 25' },
    { key: '2026-02', label: 'Feb 26' },
    { key: '2026-04', label: 'Apr 26' },
    { key: '2026-06', label: 'Jun 26' },
    { key: '2026-08', label: 'Aug 26' },
    { key: '2026-09', label: 'Sep 26' },
  ],
  series: [{ key: 'rate', label: 'Key policy rate' }],
  values: {
    rate: {
      '2025-10': '5.75',
      '2025-12': '5.75',
      '2026-02': '5.50',
      '2026-04': '5.50',
      '2026-06': '5.25',
      '2026-08': '5.00',
      '2026-09': '5.00',
    },
  },
  decimals: 2,
}

/** The five largest customers, January–September 2026, thousands of RSD. */
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

/** Costs by kind, thousands of RSD. */
export const COSTS: CartesianChartProps = {
  title: 'Costs by kind',
  description: 'Thousands of RSD',
  categories: MONTHS,
  series: [
    { key: 'goods', label: 'Goods sold' },
    { key: 'salaries', label: 'Salaries' },
    { key: 'transport', label: 'Transport' },
  ],
  values: {
    goods: {
      '2026-04': '2950.1',
      '2026-05': '3204.7',
      '2026-06': '3011.2',
      '2026-07': '2398.0',
      '2026-08': '2702.9',
      '2026-09': '3480.4',
    },
    salaries: {
      '2026-04': '842.0',
      '2026-05': '842.0',
      '2026-06': '856.5',
      '2026-07': '856.5',
      '2026-08': '856.5',
      '2026-09': '871.2',
    },
    transport: {
      '2026-04': '312.4',
      '2026-05': '355.9',
      '2026-06': '341.7',
      '2026-07': '268.3',
      '2026-08': '295.0',
      '2026-09': '388.6',
    },
  },
  palette: 'categorical',
  decimals: 1,
}

/** The monthly result: profit and loss, thousands of RSD. */
export const RESULT: CartesianChartProps = {
  title: 'Result by month',
  description: 'Thousands of RSD, before tax',
  categories: MONTHS,
  series: [{ key: 'result', label: 'Result' }],
  values: {
    result: {
      '2026-04': '486.7',
      '2026-05': '612.3',
      '2026-06': '-118.4',
      '2026-07': '-251.9',
      '2026-08': '204.5',
      '2026-09': '731.8',
    },
  },
  decimals: 1,
}

/** Revenue by region: five categories, a hue each. */
export const REGIONS: CartesianChartProps = {
  title: 'Revenue by region',
  description: 'Thousands of RSD, September 2026',
  categories: [
    { key: 'bg', label: 'Beograd' },
    { key: 'ns', label: 'Novi Sad' },
    { key: 'ni', label: 'Niš' },
    { key: 'kg', label: 'Kragujevac' },
    { key: 'su', label: 'Subotica' },
  ],
  series: [{ key: 'revenue', label: 'Revenue' }],
  values: {
    revenue: { bg: '2410.5', ns: '1388.2', ni: '842.9', kg: '611.4', su: '431.2' },
  },
  decimals: 1,
}

/** Day labels as a Serbian tenant writes them ("06.10."). */
function dayLabel(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${day}.${month}.`
}

/**
 * Daily sales of the two stores for 92 days to 6 October 2026, thousands of RSD: a weekly rhythm
 * (Saturday strongest, Sunday closed in Novi Sad), written out as decimal strings.
 */
function dailySales() {
  const end = Date.UTC(2026, 9, 6)
  const categories: ChartCategory[] = []
  const beograd: Record<string, string> = {}
  const noviSad: Record<string, string> = {}
  for (let offset = 91; offset >= 0; offset -= 1) {
    const date = new Date(end - offset * 86_400_000)
    const key = date.toISOString().slice(0, 10)
    categories.push({ key, label: dayLabel(date) })
    const weekday = date.getUTCDay()
    const rhythm = [0.55, 0.95, 1, 1.02, 1.05, 1.18, 1.4][weekday] ?? 1
    const wave = 1 + 0.08 * Math.sin(offset / 6.3) + 0.05 * Math.cos(offset / 2.1)
    const bg = Math.round(18640 * rhythm * wave) / 100
    const ns = weekday === 0 ? 0 : Math.round(11270 * rhythm * (2 - wave)) / 100
    beograd[key] = bg.toFixed(2)
    noviSad[key] = ns.toFixed(2)
  }
  return { categories, values: { beograd, noviSad } }
}

export const DAILY = dailySales()

/**
 * A store's total over the chosen days, as the application would send it: a decimal string,
 * added in whole paras (the stories play the application; components never add).
 */
export function dailyTotal(store: 'beograd' | 'noviSad', days: number): string {
  const keys = DAILY.categories.slice(-days).map((category) => category.key)
  const paras = keys.reduce(
    (sum, key) => sum + Math.round(Number(DAILY.values[store][key] ?? '0') * 100),
    0,
  )
  return `${String(Math.trunc(paras / 100))}.${String(paras % 100).padStart(2, '0')}`
}
