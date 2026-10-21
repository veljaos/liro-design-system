/*
 * Group BR's example data (P5.77, pivot analysis) on 14 October 2026 at 09:40:
 * - Kvadrat Gradnja d.o.o.'s costs of July–September 2026 by site, account (the illustrative chart
 *   of accounts) and supplier, from its supplier invoices (UF-2026-…): the amounts and the number
 *   of documents.
 * - Pekara Zlatni klas's sales of July–September 2026 by product (the till's products, group I),
 *   month and customer: its own shop and the shops it supplies (group AX's customer group Shops),
 *   in RSD and pieces.
 * The application has computed its figures for each saved view (`views`): every cell, subtotal and
 * total is a decimal string written out here, never computed by the screens (D4); null is a cell
 * with nothing. For any other layout this illustrative application has no figures. The records
 * behind a figure are the application's documents, newest first; the screens take those of the
 * figure's members. Every name, number and amount is invented. Not part of the package.
 */
import type {
  PivotColumn,
  PivotField,
  PivotLayout,
  PivotResult,
  PivotRow,
} from '../../../../packages/ui/src/pivot'

export const BR_TODAY = '2026-10-14'

export const BR_ROUTES = {
  costs: '/analytics/costs',
  /** The saved view by supplier. */
  costsBySupplier: '/analytics/costs?view=suppliers',
  /** The documents behind Liman 4's material in September, opened. */
  costsDocuments: '/analytics/costs?cell=liman4-material-sep',
  sales: '/sales/analysis',
  /** The saved view by shop. */
  salesByShop: '/sales/analysis?view=shops',
  /** The records behind Kifla's revenue in September, opened. */
  salesDocuments: '/sales/analysis?cell=kifla-sep',
  /** On a phone: the field chooser open in its sheet. */
  salesFields: '/sales/analysis?fields',
} as const

/** A saved view: its layout and the figures the application computed for it. */
export interface AnalysisView {
  id: string
  label: string
  layout: PivotLayout
  result: PivotResult
}

/** The layout's signature: rows, columns, values and the filters that keep something. */
function signature(layout: PivotLayout): string {
  return JSON.stringify([
    layout.rows,
    layout.columns,
    layout.values,
    layout.filters.filter((filter) => filter.values.length > 0),
  ])
}

/** The application's figures for a layout: a saved view's, or none (an empty result). */
export function resultFor(views: readonly AnalysisView[], layout: PivotLayout): PivotResult {
  return (
    views.find((view) => signature(view.layout) === signature(layout))?.result ?? {
      columns: [],
      rows: [],
    }
  )
}

/** The saved view whose layout this is, if any. */
export function viewOf(views: readonly AnalysisView[], layout: PivotLayout): string {
  return views.find((view) => signature(view.layout) === signature(layout))?.id ?? ''
}

/**
 * The members a row or column key stands for ("site=liman4|account=5120"): what the records
 * behind a figure must match. A total has none.
 */
export function membersOf(...keys: string[]): Record<string, string> {
  const members: Record<string, string> = {}
  for (const key of keys) {
    for (const part of key.split('|')) {
      const [field, value] = part.split('=')
      if (field !== undefined && value !== undefined && field !== 'value') members[field] = value
    }
  }
  return members
}

const MONTHS = [
  { id: '2026-07', label: 'Jul 2026' },
  { id: '2026-08', label: 'Aug 2026' },
  { id: '2026-09', label: 'Sep 2026' },
]

// ── Kvadrat Gradnja d.o.o.: costs ────────────────────────────────────────────────────────────

export const COST_SITES = [
  { id: 'liman4', label: 'Liman 4' },
  { id: 'bulevar', label: 'Bulevar Evrope 24' },
  { id: 'hallb', label: 'Hall B extension' },
]

export const COST_ACCOUNTS = [
  { id: '5120', label: '5120 Material' },
  { id: '5130', label: '5130 Machinery and fuel' },
  { id: '5330', label: '5330 Subcontractors' },
]

export const COST_SUPPLIERS = [
  { id: 'beton', label: 'Beton Mix d.o.o.' },
  { id: 'elektro', label: 'Elektro Sistem d.o.o.' },
  { id: 'novak', label: 'Novak Mehanizacija d.o.o.' },
  { id: 'izolacija', label: 'Izolacija Plus d.o.o.' },
]

export const COST_FIELDS: PivotField[] = [
  { id: 'site', label: 'Site', kind: 'dimension', values: COST_SITES },
  { id: 'account', label: 'Account', kind: 'dimension', values: COST_ACCOUNTS },
  { id: 'supplier', label: 'Supplier', kind: 'dimension', values: COST_SUPPLIERS },
  { id: 'month', label: 'Month', kind: 'dimension', values: MONTHS },
  {
    id: 'amount',
    label: 'Amount',
    kind: 'measure',
    aggregations: [
      { id: 'sum', label: 'Sum' },
      { id: 'average', label: 'Average' },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    kind: 'measure',
    aggregations: [{ id: 'count', label: 'Count' }],
  },
]

/** A supplier invoice booked to a site's cost account. */
export interface CostDocument {
  date: string
  number: string
  supplier: string
  site: string
  account: string
  month: string
  text: string
  amount: string
}

function doc(
  date: string,
  number: string,
  supplier: string,
  site: string,
  account: string,
  text: string,
  amount: string,
): CostDocument {
  return { date, number, supplier, site, account, month: date.slice(0, 7), text, amount }
}

/** The months over the amount and the number of documents; the total column the same. */
const COST_MONTH_COLUMNS: PivotColumn[] = [
  ...MONTHS.map((month) => ({
    key: `month=${month.id}`,
    label: month.label,
    children: [
      {
        key: `month=${month.id}|value=amount`,
        label: 'Amount',
        kind: 'money' as const,
        currency: 'RSD',
      },
      { key: `month=${month.id}|value=documents`, label: 'Documents', decimals: 0 },
    ],
  })),
  {
    key: 'total',
    label: 'Total',
    total: true,
    children: [
      { key: 'value=amount', label: 'Amount', kind: 'money', currency: 'RSD' },
      { key: 'value=documents', label: 'Documents', decimals: 0 },
    ],
  },
]

/** One figure: the months and the total. */
const COST_AMOUNT_COLUMNS: PivotColumn[] = [
  ...MONTHS.map((month) => ({
    key: `month=${month.id}|value=amount`,
    label: month.label,
    kind: 'money' as const,
    currency: 'RSD',
  })),
  { key: 'value=amount', label: 'Total', total: true, kind: 'money', currency: 'RSD' },
]

export const COST_DOCUMENTS: CostDocument[] = [
  doc('2026-09-29', 'UF-2026-1151', 'izolacija', 'hallb', '5330', 'Facade insulation', '680820.00'),
  doc(
    '2026-09-28',
    'UF-2026-1150',
    'izolacija',
    'hallb',
    '5330',
    'Waterproofing of the foundations',
    '352623.33',
  ),
  doc(
    '2026-09-28',
    'UF-2026-1146',
    'elektro',
    'hallb',
    '5120',
    'Electrical installation, stage 2',
    '167823.33',
  ),
  doc('2026-09-22', 'UF-2026-1141', 'novak', 'bulevar', '5130', 'Crane hours', '310033.33'),
  doc('2026-09-21', 'UF-2026-1137', 'novak', 'liman4', '5130', 'Excavator rental', '1627980.00'),
  doc(
    '2026-09-15',
    'UF-2026-1149',
    'novak',
    'hallb',
    '5130',
    'Diesel for site machinery',
    '224336.67',
  ),
  doc('2026-09-15', 'UF-2026-1143', 'izolacija', 'bulevar', '5330', 'Roof insulation', '635276.67'),
  doc('2026-09-15', 'UF-2026-1139', 'elektro', 'bulevar', '5120', 'Lighting fixtures', '586190.00'),
  doc(
    '2026-09-14',
    'UF-2026-1140',
    'novak',
    'bulevar',
    '5130',
    'Diesel for site machinery',
    '1038580.00',
  ),
  doc(
    '2026-09-13',
    'UF-2026-1135',
    'elektro',
    'liman4',
    '5120',
    'Cables and distribution boards',
    '788660.00',
  ),
  doc('2026-09-12', 'UF-2026-1147', 'beton', 'hallb', '5120', 'Concrete pump hours', '298663.33'),
  doc(
    '2026-09-11',
    'UF-2026-1138',
    'elektro',
    'liman4',
    '5330',
    'Electrical installation, stage 2',
    '1423570.00',
  ),
  doc('2026-09-10', 'UF-2026-1148', 'novak', 'hallb', '5130', 'Crane hours', '698553.33'),
  doc(
    '2026-09-07',
    'UF-2026-1142',
    'novak',
    'bulevar',
    '5130',
    'Diesel for site machinery',
    '593383.33',
  ),
  doc(
    '2026-09-06',
    'UF-2026-1145',
    'izolacija',
    'bulevar',
    '5330',
    'Facade insulation',
    '627823.33',
  ),
  doc(
    '2026-09-05',
    'UF-2026-1144',
    'izolacija',
    'bulevar',
    '5330',
    'Roof insulation',
    '1566936.67',
  ),
  doc(
    '2026-09-01',
    'UF-2026-1136',
    'elektro',
    'liman4',
    '5120',
    'Cables and distribution boards',
    '614490.00',
  ),
  doc(
    '2026-08-31',
    'UF-2026-1133',
    'izolacija',
    'hallb',
    '5330',
    'Waterproofing of the foundations',
    '749370.00',
  ),
  doc('2026-08-31', 'UF-2026-1126', 'novak', 'bulevar', '5130', 'Crane hours', '296163.33'),
  doc('2026-08-30', 'UF-2026-1124', 'elektro', 'bulevar', '5120', 'Lighting fixtures', '388560.00'),
  doc('2026-08-26', 'UF-2026-1121', 'novak', 'liman4', '5130', 'Crane hours', '2321620.00'),
  doc(
    '2026-08-26',
    'UF-2026-1119',
    'elektro',
    'liman4',
    '5120',
    'Cables and distribution boards',
    '1826550.00',
  ),
  doc('2026-08-23', 'UF-2026-1132', 'novak', 'hallb', '5130', 'Excavator rental', '244690.00'),
  doc('2026-08-23', 'UF-2026-1122', 'elektro', 'liman4', '5330', 'Lighting fixtures', '2168590.00'),
  doc('2026-08-22', 'UF-2026-1134', 'elektro', 'hallb', '5330', 'Lighting fixtures', '278503.33'),
  doc('2026-08-22', 'UF-2026-1118', 'elektro', 'liman4', '5120', 'Lighting fixtures', '1440700.00'),
  doc(
    '2026-08-20',
    'UF-2026-1130',
    'beton',
    'hallb',
    '5120',
    'Ready-mix concrete C30/37',
    '121626.67',
  ),
  doc(
    '2026-08-19',
    'UF-2026-1129',
    'elektro',
    'bulevar',
    '5330',
    'Cables and distribution boards',
    '347446.67',
  ),
  doc(
    '2026-08-18',
    'UF-2026-1123',
    'elektro',
    'bulevar',
    '5120',
    'Electrical installation, stage 2',
    '211703.33',
  ),
  doc(
    '2026-08-15',
    'UF-2026-1128',
    'izolacija',
    'bulevar',
    '5330',
    'Waterproofing of the foundations',
    '158110.00',
  ),
  doc(
    '2026-08-15',
    'UF-2026-1125',
    'novak',
    'bulevar',
    '5130',
    'Diesel for site machinery',
    '619873.33',
  ),
  doc(
    '2026-08-12',
    'UF-2026-1127',
    'novak',
    'bulevar',
    '5130',
    'Diesel for site machinery',
    '383573.33',
  ),
  doc(
    '2026-08-05',
    'UF-2026-1131',
    'novak',
    'hallb',
    '5130',
    'Diesel for site machinery',
    '67400.00',
  ),
  doc(
    '2026-08-01',
    'UF-2026-1120',
    'novak',
    'liman4',
    '5130',
    'Diesel for site machinery',
    '315190.00',
  ),
  doc(
    '2026-07-28',
    'UF-2026-1116',
    'novak',
    'hallb',
    '5130',
    'Diesel for site machinery',
    '227133.33',
  ),
  doc(
    '2026-07-26',
    'UF-2026-1106',
    'elektro',
    'bulevar',
    '5120',
    'Lighting fixtures',
    '1148283.33',
  ),
  doc(
    '2026-07-26',
    'UF-2026-1102',
    'novak',
    'liman4',
    '5130',
    'Diesel for site machinery',
    '2190960.00',
  ),
  doc(
    '2026-07-25',
    'UF-2026-1114',
    'beton',
    'hallb',
    '5120',
    'Ready-mix concrete C30/37',
    '236060.00',
  ),
  doc(
    '2026-07-24',
    'UF-2026-1107',
    'beton',
    'bulevar',
    '5120',
    'Ready-mix concrete C30/37',
    '1049443.33',
  ),
  doc(
    '2026-07-23',
    'UF-2026-1115',
    'beton',
    'hallb',
    '5120',
    'Ready-mix concrete C25/30',
    '646600.00',
  ),
  doc(
    '2026-07-22',
    'UF-2026-1117',
    'novak',
    'hallb',
    '5130',
    'Diesel for site machinery',
    '701576.67',
  ),
  doc('2026-07-17', 'UF-2026-1113', 'elektro', 'hallb', '5120', 'Lighting fixtures', '767030.00'),
  doc(
    '2026-07-17',
    'UF-2026-1101',
    'elektro',
    'liman4',
    '5120',
    'Cables and distribution boards',
    '2276820.00',
  ),
  doc(
    '2026-07-15',
    'UF-2026-1104',
    'izolacija',
    'liman4',
    '5330',
    'Facade insulation',
    '227870.00',
  ),
  doc(
    '2026-07-14',
    'UF-2026-1111',
    'izolacija',
    'bulevar',
    '5330',
    'Roof insulation',
    '1503626.67',
  ),
  doc(
    '2026-07-13',
    'UF-2026-1112',
    'elektro',
    'bulevar',
    '5330',
    'Electrical installation, stage 2',
    '1552330.00',
  ),
  doc(
    '2026-07-10',
    'UF-2026-1108',
    'novak',
    'bulevar',
    '5130',
    'Diesel for site machinery',
    '1368846.67',
  ),
  doc(
    '2026-07-07',
    'UF-2026-1105',
    'elektro',
    'bulevar',
    '5120',
    'Electrical installation, stage 2',
    '1204986.67',
  ),
  doc(
    '2026-07-03',
    'UF-2026-1110',
    'novak',
    'bulevar',
    '5130',
    'Diesel for site machinery',
    '1209406.67',
  ),
  doc('2026-07-01', 'UF-2026-1109', 'novak', 'bulevar', '5130', 'Crane hours', '1127126.67'),
  doc(
    '2026-07-01',
    'UF-2026-1103',
    'izolacija',
    'liman4',
    '5330',
    'Facade insulation',
    '510140.00',
  ),
]
const SITE_ROWS: PivotRow[] = [
  {
    key: 'site=liman4',
    label: 'Liman 4',
    cells: {
      'month=2026-07|value=amount': '5205790.00',
      'month=2026-07|value=documents': '4',
      'month=2026-08|value=amount': '8072650.00',
      'month=2026-08|value=documents': '5',
      'month=2026-09|value=amount': '4454700.00',
      'month=2026-09|value=documents': '4',
      'value=amount': '17733140.00',
      'value=documents': '13',
    },
    children: [
      {
        key: 'site=liman4|account=5120',
        label: '5120 Material',
        cells: {
          'month=2026-07|value=amount': '2276820.00',
          'month=2026-07|value=documents': '1',
          'month=2026-08|value=amount': '3267250.00',
          'month=2026-08|value=documents': '2',
          'month=2026-09|value=amount': '1403150.00',
          'month=2026-09|value=documents': '2',
          'value=amount': '6947220.00',
          'value=documents': '5',
        },
      },
      {
        key: 'site=liman4|account=5130',
        label: '5130 Machinery and fuel',
        cells: {
          'month=2026-07|value=amount': '2190960.00',
          'month=2026-07|value=documents': '1',
          'month=2026-08|value=amount': '2636810.00',
          'month=2026-08|value=documents': '2',
          'month=2026-09|value=amount': '1627980.00',
          'month=2026-09|value=documents': '1',
          'value=amount': '6455750.00',
          'value=documents': '4',
        },
      },
      {
        key: 'site=liman4|account=5330',
        label: '5330 Subcontractors',
        cells: {
          'month=2026-07|value=amount': '738010.00',
          'month=2026-07|value=documents': '2',
          'month=2026-08|value=amount': '2168590.00',
          'month=2026-08|value=documents': '1',
          'month=2026-09|value=amount': '1423570.00',
          'month=2026-09|value=documents': '1',
          'value=amount': '4330170.00',
          'value=documents': '4',
        },
      },
    ],
  },
  {
    key: 'site=bulevar',
    label: 'Bulevar Evrope 24',
    cells: {
      'month=2026-07|value=amount': '10164050.01',
      'month=2026-07|value=documents': '8',
      'month=2026-08|value=amount': '2405429.99',
      'month=2026-08|value=documents': '7',
      'month=2026-09|value=amount': '5358223.33',
      'month=2026-09|value=documents': '7',
      'value=amount': '17927703.33',
      'value=documents': '22',
    },
    children: [
      {
        key: 'site=bulevar|account=5120',
        label: '5120 Material',
        cells: {
          'month=2026-07|value=amount': '3402713.33',
          'month=2026-07|value=documents': '3',
          'month=2026-08|value=amount': '600263.33',
          'month=2026-08|value=documents': '2',
          'month=2026-09|value=amount': '586190.00',
          'month=2026-09|value=documents': '1',
          'value=amount': '4589166.66',
          'value=documents': '6',
        },
      },
      {
        key: 'site=bulevar|account=5130',
        label: '5130 Machinery and fuel',
        cells: {
          'month=2026-07|value=amount': '3705380.01',
          'month=2026-07|value=documents': '3',
          'month=2026-08|value=amount': '1299609.99',
          'month=2026-08|value=documents': '3',
          'month=2026-09|value=amount': '1941996.66',
          'month=2026-09|value=documents': '3',
          'value=amount': '6946986.66',
          'value=documents': '9',
        },
      },
      {
        key: 'site=bulevar|account=5330',
        label: '5330 Subcontractors',
        cells: {
          'month=2026-07|value=amount': '3055956.67',
          'month=2026-07|value=documents': '2',
          'month=2026-08|value=amount': '505556.67',
          'month=2026-08|value=documents': '2',
          'month=2026-09|value=amount': '2830036.67',
          'month=2026-09|value=documents': '3',
          'value=amount': '6391550.01',
          'value=documents': '7',
        },
      },
    ],
  },
  {
    key: 'site=hallb',
    label: 'Hall B extension',
    cells: {
      'month=2026-07|value=amount': '2578400.00',
      'month=2026-07|value=documents': '5',
      'month=2026-08|value=amount': '1461590.00',
      'month=2026-08|value=documents': '5',
      'month=2026-09|value=amount': '2422819.99',
      'month=2026-09|value=documents': '6',
      'value=amount': '6462809.99',
      'value=documents': '16',
    },
    children: [
      {
        key: 'site=hallb|account=5120',
        label: '5120 Material',
        cells: {
          'month=2026-07|value=amount': '1649690.00',
          'month=2026-07|value=documents': '3',
          'month=2026-08|value=amount': '121626.67',
          'month=2026-08|value=documents': '1',
          'month=2026-09|value=amount': '466486.66',
          'month=2026-09|value=documents': '2',
          'value=amount': '2237803.33',
          'value=documents': '6',
        },
      },
      {
        key: 'site=hallb|account=5130',
        label: '5130 Machinery and fuel',
        cells: {
          'month=2026-07|value=amount': '928710.00',
          'month=2026-07|value=documents': '2',
          'month=2026-08|value=amount': '312090.00',
          'month=2026-08|value=documents': '2',
          'month=2026-09|value=amount': '922890.00',
          'month=2026-09|value=documents': '2',
          'value=amount': '2163690.00',
          'value=documents': '6',
        },
      },
      {
        key: 'site=hallb|account=5330',
        label: '5330 Subcontractors',
        cells: {
          'month=2026-07|value=amount': null,
          'month=2026-07|value=documents': null,
          'month=2026-08|value=amount': '1027873.33',
          'month=2026-08|value=documents': '2',
          'month=2026-09|value=amount': '1033443.33',
          'month=2026-09|value=documents': '2',
          'value=amount': '2061316.66',
          'value=documents': '4',
        },
      },
    ],
  },
]
const SITE_TOTAL: PivotRow = {
  key: 'all',
  label: 'Total',
  cells: {
    'month=2026-07|value=amount': '17948240.01',
    'month=2026-07|value=documents': '17',
    'month=2026-08|value=amount': '11939669.99',
    'month=2026-08|value=documents': '17',
    'month=2026-09|value=amount': '12235743.32',
    'month=2026-09|value=documents': '17',
    'value=amount': '42123653.32',
    'value=documents': '51',
  },
}
const SUPPLIER_ROWS: PivotRow[] = [
  {
    key: 'supplier=beton',
    label: 'Beton Mix d.o.o.',
    cells: {
      'month=2026-07|value=amount': '1932103.33',
      'month=2026-08|value=amount': '121626.67',
      'month=2026-09|value=amount': '298663.33',
      'value=amount': '2352393.33',
    },
  },
  {
    key: 'supplier=elektro',
    label: 'Elektro Sistem d.o.o.',
    cells: {
      'month=2026-07|value=amount': '6949450.00',
      'month=2026-08|value=amount': '6662053.33',
      'month=2026-09|value=amount': '3580733.33',
      'value=amount': '17192236.66',
    },
  },
  {
    key: 'supplier=novak',
    label: 'Novak Mehanizacija d.o.o.',
    cells: {
      'month=2026-07|value=amount': '6825050.01',
      'month=2026-08|value=amount': '4248509.99',
      'month=2026-09|value=amount': '4492866.66',
      'value=amount': '15566426.66',
    },
  },
  {
    key: 'supplier=izolacija',
    label: 'Izolacija Plus d.o.o.',
    cells: {
      'month=2026-07|value=amount': '2241636.67',
      'month=2026-08|value=amount': '907480.00',
      'month=2026-09|value=amount': '3863480.00',
      'value=amount': '7012596.67',
    },
  },
]
const SUPPLIER_TOTAL: PivotRow = {
  key: 'all',
  label: 'Total',
  cells: {
    'month=2026-07|value=amount': '17948240.01',
    'month=2026-08|value=amount': '11939669.99',
    'month=2026-09|value=amount': '12235743.32',
    'value=amount': '42123653.32',
  },
}

export const COST_VIEWS: AnalysisView[] = [
  {
    id: 'sites',
    label: 'By site and account',
    layout: {
      rows: ['site', 'account'],
      columns: ['month'],
      values: [
        { field: 'amount', aggregation: 'sum' },
        { field: 'documents', aggregation: 'count' },
      ],
      filters: [{ field: 'supplier', values: [] }],
    },
    result: { columns: COST_MONTH_COLUMNS, rows: SITE_ROWS, total: SITE_TOTAL },
  },
  {
    id: 'suppliers',
    label: 'By supplier',
    layout: {
      rows: ['supplier'],
      columns: ['month'],
      values: [{ field: 'amount', aggregation: 'sum' }],
      filters: [{ field: 'site', values: [] }],
    },
    result: { columns: COST_AMOUNT_COLUMNS, rows: SUPPLIER_ROWS, total: SUPPLIER_TOTAL },
  },
]

/** The figure opened in the documents' story: Liman 4's material in September. */
export const COST_OPENED = {
  rowKey: 'site=liman4|account=5120',
  columnKey: 'month=2026-09|value=amount',
  rowPath: ['Liman 4', '5120 Material'],
  columnPath: ['Sep 2026', 'Amount'],
}

// ── Pekara Zlatni klas: sales ────────────────────────────────────────────────────────────────

export const SALES_CATEGORIES = [
  { id: 'bread', label: 'Hleb' },
  { id: 'pastry', label: 'Peciva' },
  { id: 'savoury', label: 'Slano' },
  { id: 'cakes', label: 'Kolači' },
]

export const SALES_PRODUCTS = [
  { id: 'beli', label: 'Beli hleb', category: 'bread' },
  { id: 'polubeli', label: 'Polubeli hleb', category: 'bread' },
  { id: 'integralni', label: 'Integralni hleb', category: 'bread' },
  { id: 'razeni', label: 'Raženi hleb', category: 'bread' },
  { id: 'kifla', label: 'Kifla', category: 'pastry' },
  { id: 'perec', label: 'Perec sa susamom', category: 'pastry' },
  { id: 'kroasan', label: 'Kroasan sa čokoladom', category: 'pastry' },
  { id: 'burek-sir', label: 'Burek sa sirom', category: 'savoury' },
  { id: 'burek-meso', label: 'Burek sa mesom', category: 'savoury' },
  { id: 'pogacice', label: 'Pogačice sa čvarcima', category: 'savoury' },
  { id: 'krempita', label: 'Krempita', category: 'cakes' },
  { id: 'reforma', label: 'Reforma torta, parče', category: 'cakes' },
  { id: 'tulumbe', label: 'Tulumbe', category: 'cakes' },
]

/** The bakery's own shop and the shops it supplies (group AX's customer group Shops). */
export const SALES_CUSTOMERS = [
  { id: 'shop', label: 'Shop Bulevar oslobođenja 46', channel: 'shop' },
  { id: 'sunce', label: 'Market Sunce d.o.o.', channel: 'wholesale' },
  { id: 'lipa', label: 'Mini market Lipa', channel: 'wholesale' },
  { id: 'detelinara', label: 'Prodavnica Detelinara', channel: 'wholesale' },
  { id: 'liman', label: 'Market Liman 3', channel: 'wholesale' },
  { id: 'podbara', label: 'Samoposluga Podbara', channel: 'wholesale' },
  { id: 'telep', label: 'Market Telep d.o.o.', channel: 'wholesale' },
]

export const SALES_CHANNELS = [
  { id: 'shop', label: 'Own shop' },
  { id: 'wholesale', label: 'Wholesale' },
]

export const SALES_FIELDS: PivotField[] = [
  { id: 'category', label: 'Category', kind: 'dimension', values: SALES_CATEGORIES },
  { id: 'product', label: 'Product', kind: 'dimension', values: SALES_PRODUCTS },
  { id: 'month', label: 'Month', kind: 'dimension', values: MONTHS },
  { id: 'customer', label: 'Customer', kind: 'dimension', values: SALES_CUSTOMERS },
  { id: 'channel', label: 'Channel', kind: 'dimension', values: SALES_CHANNELS },
  {
    id: 'revenue',
    label: 'Revenue',
    kind: 'measure',
    aggregations: [
      { id: 'sum', label: 'Sum' },
      { id: 'average', label: 'Average' },
    ],
  },
  {
    id: 'quantity',
    label: 'Quantity',
    kind: 'measure',
    aggregations: [{ id: 'sum', label: 'Sum' }],
  },
]

/** A line of a sale: a wholesale invoice's line, or the shop's sales of a month. */
export interface SalesRecord {
  date: string
  number: string
  customer: string
  channel: string
  category: string
  product: string
  month: string
  quantity: string
  amount: string
}

function sale(
  date: string,
  number: string,
  customer: string,
  product: string,
  quantity: string,
  amount: string,
): SalesRecord {
  return {
    date,
    number,
    customer,
    channel: SALES_CUSTOMERS.find((each) => each.id === customer)?.channel ?? '',
    category: SALES_PRODUCTS.find((each) => each.id === product)?.category ?? '',
    product,
    month: date.slice(0, 7),
    quantity,
    amount,
  }
}

const SALES_MONTH_COLUMNS: PivotColumn[] = [
  ...MONTHS.map((month) => ({
    key: `month=${month.id}`,
    label: month.label,
    children: [
      {
        key: `month=${month.id}|value=revenue`,
        label: 'Revenue',
        kind: 'money' as const,
        currency: 'RSD',
      },
      { key: `month=${month.id}|value=quantity`, label: 'Quantity', decimals: 0 },
    ],
  })),
  {
    key: 'total',
    label: 'Total',
    total: true,
    children: [
      { key: 'value=revenue', label: 'Revenue', kind: 'money', currency: 'RSD' },
      { key: 'value=quantity', label: 'Quantity', decimals: 0 },
    ],
  },
]

const SALES_SHOP_COLUMNS: PivotColumn[] = [
  ...SALES_CUSTOMERS.map((customer) => ({
    key: `customer=${customer.id}|value=revenue`,
    label: customer.label,
    kind: 'money' as const,
    currency: 'RSD',
  })),
  { key: 'value=revenue', label: 'Total', total: true, kind: 'money', currency: 'RSD' },
]

export const SALES_RECORDS: SalesRecord[] = [
  sale('2026-09-30', 'Shop sales Sep 2026', 'shop', 'tulumbe', '159', '25440.00'),
  sale('2026-09-30', 'Shop sales Sep 2026', 'shop', 'reforma', '128', '33280.00'),
  sale('2026-09-30', 'Shop sales Sep 2026', 'shop', 'razeni', '1631', '179410.00'),
  sale('2026-09-30', 'Shop sales Sep 2026', 'shop', 'polubeli', '599', '44925.00'),
  sale('2026-09-30', 'Shop sales Sep 2026', 'shop', 'pogacice', '1637', '114590.00'),
  sale('2026-09-30', 'Shop sales Sep 2026', 'shop', 'perec', '1396', '62820.00'),
  sale('2026-09-30', 'Shop sales Sep 2026', 'shop', 'kroasan', '1397', '153670.00'),
  sale('2026-09-30', 'Shop sales Sep 2026', 'shop', 'krempita', '85', '18700.00'),
  sale('2026-09-30', 'Shop sales Sep 2026', 'shop', 'kifla', '1727', '43175.00'),
  sale('2026-09-30', 'Shop sales Sep 2026', 'shop', 'integralni', '2167', '205865.00'),
  sale('2026-09-30', 'Shop sales Sep 2026', 'shop', 'burek-sir', '1159', '208620.00'),
  sale('2026-09-30', 'Shop sales Sep 2026', 'shop', 'burek-meso', '1998', '379620.00'),
  sale('2026-09-30', 'Shop sales Sep 2026', 'shop', 'beli', '1807', '117455.00'),
  sale('2026-09-30', 'F-ZK-2026-0428', 'telep', 'razeni', '745', '65560.00'),
  sale('2026-09-30', 'F-ZK-2026-0428', 'telep', 'polubeli', '874', '52440.00'),
  sale('2026-09-30', 'F-ZK-2026-0428', 'telep', 'pogacice', '591', '33096.00'),
  sale('2026-09-30', 'F-ZK-2026-0428', 'telep', 'perec', '166', '5976.00'),
  sale('2026-09-30', 'F-ZK-2026-0428', 'telep', 'kroasan', '546', '48048.00'),
  sale('2026-09-30', 'F-ZK-2026-0428', 'telep', 'kifla', '481', '9620.00'),
  sale('2026-09-30', 'F-ZK-2026-0428', 'telep', 'integralni', '212', '16112.00'),
  sale('2026-09-30', 'F-ZK-2026-0428', 'telep', 'burek-sir', '666', '95904.00'),
  sale('2026-09-30', 'F-ZK-2026-0428', 'telep', 'burek-meso', '315', '47880.00'),
  sale('2026-09-30', 'F-ZK-2026-0428', 'telep', 'beli', '784', '40768.00'),
  sale('2026-09-30', 'F-ZK-2026-0427', 'podbara', 'polubeli', '888', '53280.00'),
  sale('2026-09-30', 'F-ZK-2026-0427', 'podbara', 'perec', '186', '6696.00'),
  sale('2026-09-30', 'F-ZK-2026-0427', 'podbara', 'kroasan', '137', '12056.00'),
  sale('2026-09-30', 'F-ZK-2026-0427', 'podbara', 'kifla', '712', '14240.00'),
  sale('2026-09-30', 'F-ZK-2026-0427', 'podbara', 'integralni', '811', '61636.00'),
  sale('2026-09-30', 'F-ZK-2026-0427', 'podbara', 'burek-sir', '382', '55008.00'),
  sale('2026-09-30', 'F-ZK-2026-0427', 'podbara', 'beli', '149', '7748.00'),
  sale('2026-09-30', 'F-ZK-2026-0426', 'liman', 'razeni', '220', '19360.00'),
  sale('2026-09-30', 'F-ZK-2026-0426', 'liman', 'pogacice', '418', '23408.00'),
  sale('2026-09-30', 'F-ZK-2026-0426', 'liman', 'perec', '279', '10044.00'),
  sale('2026-09-30', 'F-ZK-2026-0426', 'liman', 'kroasan', '730', '64240.00'),
  sale('2026-09-30', 'F-ZK-2026-0426', 'liman', 'integralni', '836', '63536.00'),
  sale('2026-09-30', 'F-ZK-2026-0426', 'liman', 'burek-sir', '758', '109152.00'),
  sale('2026-09-30', 'F-ZK-2026-0426', 'liman', 'burek-meso', '691', '105032.00'),
  sale('2026-09-30', 'F-ZK-2026-0425', 'detelinara', 'razeni', '545', '47960.00'),
  sale('2026-09-30', 'F-ZK-2026-0425', 'detelinara', 'polubeli', '550', '33000.00'),
  sale('2026-09-30', 'F-ZK-2026-0425', 'detelinara', 'pogacice', '323', '18088.00'),
  sale('2026-09-30', 'F-ZK-2026-0425', 'detelinara', 'perec', '598', '21528.00'),
  sale('2026-09-30', 'F-ZK-2026-0425', 'detelinara', 'kifla', '257', '5140.00'),
  sale('2026-09-30', 'F-ZK-2026-0425', 'detelinara', 'integralni', '129', '9804.00'),
  sale('2026-09-30', 'F-ZK-2026-0425', 'detelinara', 'burek-sir', '50', '7200.00'),
  sale('2026-09-30', 'F-ZK-2026-0425', 'detelinara', 'burek-meso', '78', '11856.00'),
  sale('2026-09-30', 'F-ZK-2026-0425', 'detelinara', 'beli', '169', '8788.00'),
  sale('2026-09-30', 'F-ZK-2026-0424', 'lipa', 'razeni', '781', '68728.00'),
  sale('2026-09-30', 'F-ZK-2026-0424', 'lipa', 'polubeli', '160', '9600.00'),
  sale('2026-09-30', 'F-ZK-2026-0424', 'lipa', 'perec', '495', '17820.00'),
  sale('2026-09-30', 'F-ZK-2026-0424', 'lipa', 'kroasan', '449', '39512.00'),
  sale('2026-09-30', 'F-ZK-2026-0424', 'lipa', 'kifla', '862', '17240.00'),
  sale('2026-09-30', 'F-ZK-2026-0424', 'lipa', 'burek-sir', '449', '64656.00'),
  sale('2026-09-30', 'F-ZK-2026-0424', 'lipa', 'burek-meso', '534', '81168.00'),
  sale('2026-09-30', 'F-ZK-2026-0423', 'sunce', 'razeni', '615', '54120.00'),
  sale('2026-09-30', 'F-ZK-2026-0423', 'sunce', 'polubeli', '671', '40260.00'),
  sale('2026-09-30', 'F-ZK-2026-0423', 'sunce', 'perec', '160', '5760.00'),
  sale('2026-09-30', 'F-ZK-2026-0423', 'sunce', 'kroasan', '509', '44792.00'),
  sale('2026-09-30', 'F-ZK-2026-0423', 'sunce', 'kifla', '398', '7960.00'),
  sale('2026-09-30', 'F-ZK-2026-0423', 'sunce', 'integralni', '393', '29868.00'),
  sale('2026-09-30', 'F-ZK-2026-0423', 'sunce', 'burek-sir', '703', '101232.00'),
  sale('2026-09-30', 'F-ZK-2026-0423', 'sunce', 'burek-meso', '861', '130872.00'),
  sale('2026-09-30', 'F-ZK-2026-0423', 'sunce', 'beli', '584', '30368.00'),
  sale('2026-08-31', 'Shop sales Aug 2026', 'shop', 'tulumbe', '112', '17920.00'),
  sale('2026-08-31', 'Shop sales Aug 2026', 'shop', 'reforma', '271', '70460.00'),
  sale('2026-08-31', 'Shop sales Aug 2026', 'shop', 'razeni', '1252', '137720.00'),
  sale('2026-08-31', 'Shop sales Aug 2026', 'shop', 'polubeli', '666', '49950.00'),
  sale('2026-08-31', 'Shop sales Aug 2026', 'shop', 'pogacice', '999', '69930.00'),
  sale('2026-08-31', 'Shop sales Aug 2026', 'shop', 'perec', '1006', '45270.00'),
  sale('2026-08-31', 'Shop sales Aug 2026', 'shop', 'kroasan', '482', '53020.00'),
  sale('2026-08-31', 'Shop sales Aug 2026', 'shop', 'krempita', '81', '17820.00'),
  sale('2026-08-31', 'Shop sales Aug 2026', 'shop', 'kifla', '1069', '26725.00'),
  sale('2026-08-31', 'Shop sales Aug 2026', 'shop', 'integralni', '530', '50350.00'),
  sale('2026-08-31', 'Shop sales Aug 2026', 'shop', 'burek-sir', '1894', '340920.00'),
  sale('2026-08-31', 'Shop sales Aug 2026', 'shop', 'burek-meso', '848', '161120.00'),
  sale('2026-08-31', 'Shop sales Aug 2026', 'shop', 'beli', '1925', '125125.00'),
  sale('2026-08-31', 'F-ZK-2026-0422', 'telep', 'razeni', '359', '31592.00'),
  sale('2026-08-31', 'F-ZK-2026-0422', 'telep', 'polubeli', '365', '21900.00'),
  sale('2026-08-31', 'F-ZK-2026-0422', 'telep', 'pogacice', '761', '42616.00'),
  sale('2026-08-31', 'F-ZK-2026-0422', 'telep', 'perec', '626', '22536.00'),
  sale('2026-08-31', 'F-ZK-2026-0422', 'telep', 'kifla', '694', '13880.00'),
  sale('2026-08-31', 'F-ZK-2026-0422', 'telep', 'integralni', '408', '31008.00'),
  sale('2026-08-31', 'F-ZK-2026-0422', 'telep', 'burek-sir', '405', '58320.00'),
  sale('2026-08-31', 'F-ZK-2026-0422', 'telep', 'burek-meso', '835', '126920.00'),
  sale('2026-08-31', 'F-ZK-2026-0421', 'podbara', 'razeni', '847', '74536.00'),
  sale('2026-08-31', 'F-ZK-2026-0421', 'podbara', 'polubeli', '572', '34320.00'),
  sale('2026-08-31', 'F-ZK-2026-0421', 'podbara', 'perec', '752', '27072.00'),
  sale('2026-08-31', 'F-ZK-2026-0421', 'podbara', 'kroasan', '127', '11176.00'),
  sale('2026-08-31', 'F-ZK-2026-0421', 'podbara', 'kifla', '458', '9160.00'),
  sale('2026-08-31', 'F-ZK-2026-0421', 'podbara', 'integralni', '448', '34048.00'),
  sale('2026-08-31', 'F-ZK-2026-0421', 'podbara', 'burek-sir', '342', '49248.00'),
  sale('2026-08-31', 'F-ZK-2026-0421', 'podbara', 'burek-meso', '404', '61408.00'),
  sale('2026-08-31', 'F-ZK-2026-0421', 'podbara', 'beli', '362', '18824.00'),
  sale('2026-08-31', 'F-ZK-2026-0420', 'liman', 'razeni', '601', '52888.00'),
  sale('2026-08-31', 'F-ZK-2026-0420', 'liman', 'polubeli', '311', '18660.00'),
  sale('2026-08-31', 'F-ZK-2026-0420', 'liman', 'perec', '58', '2088.00'),
  sale('2026-08-31', 'F-ZK-2026-0420', 'liman', 'kifla', '895', '17900.00'),
  sale('2026-08-31', 'F-ZK-2026-0420', 'liman', 'integralni', '194', '14744.00'),
  sale('2026-08-31', 'F-ZK-2026-0420', 'liman', 'burek-meso', '531', '80712.00'),
  sale('2026-08-31', 'F-ZK-2026-0420', 'liman', 'beli', '530', '27560.00'),
  sale('2026-08-31', 'F-ZK-2026-0419', 'detelinara', 'razeni', '510', '44880.00'),
  sale('2026-08-31', 'F-ZK-2026-0419', 'detelinara', 'polubeli', '883', '52980.00'),
  sale('2026-08-31', 'F-ZK-2026-0419', 'detelinara', 'pogacice', '207', '11592.00'),
  sale('2026-08-31', 'F-ZK-2026-0419', 'detelinara', 'perec', '771', '27756.00'),
  sale('2026-08-31', 'F-ZK-2026-0419', 'detelinara', 'kroasan', '717', '63096.00'),
  sale('2026-08-31', 'F-ZK-2026-0419', 'detelinara', 'kifla', '402', '8040.00'),
  sale('2026-08-31', 'F-ZK-2026-0419', 'detelinara', 'integralni', '267', '20292.00'),
  sale('2026-08-31', 'F-ZK-2026-0419', 'detelinara', 'burek-sir', '846', '121824.00'),
  sale('2026-08-31', 'F-ZK-2026-0418', 'lipa', 'razeni', '245', '21560.00'),
  sale('2026-08-31', 'F-ZK-2026-0418', 'lipa', 'perec', '788', '28368.00'),
  sale('2026-08-31', 'F-ZK-2026-0418', 'lipa', 'kroasan', '568', '49984.00'),
  sale('2026-08-31', 'F-ZK-2026-0418', 'lipa', 'kifla', '536', '10720.00'),
  sale('2026-08-31', 'F-ZK-2026-0418', 'lipa', 'integralni', '288', '21888.00'),
  sale('2026-08-31', 'F-ZK-2026-0418', 'lipa', 'burek-sir', '795', '114480.00'),
  sale('2026-08-31', 'F-ZK-2026-0418', 'lipa', 'burek-meso', '684', '103968.00'),
  sale('2026-08-31', 'F-ZK-2026-0417', 'sunce', 'razeni', '322', '28336.00'),
  sale('2026-08-31', 'F-ZK-2026-0417', 'sunce', 'polubeli', '606', '36360.00'),
  sale('2026-08-31', 'F-ZK-2026-0417', 'sunce', 'pogacice', '70', '3920.00'),
  sale('2026-08-31', 'F-ZK-2026-0417', 'sunce', 'kroasan', '429', '37752.00'),
  sale('2026-08-31', 'F-ZK-2026-0417', 'sunce', 'integralni', '51', '3876.00'),
  sale('2026-08-31', 'F-ZK-2026-0417', 'sunce', 'burek-sir', '307', '44208.00'),
  sale('2026-08-31', 'F-ZK-2026-0417', 'sunce', 'burek-meso', '233', '35416.00'),
  sale('2026-08-31', 'F-ZK-2026-0417', 'sunce', 'beli', '845', '43940.00'),
  sale('2026-07-31', 'Shop sales Jul 2026', 'shop', 'tulumbe', '357', '57120.00'),
  sale('2026-07-31', 'Shop sales Jul 2026', 'shop', 'reforma', '94', '24440.00'),
  sale('2026-07-31', 'Shop sales Jul 2026', 'shop', 'razeni', '735', '80850.00'),
  sale('2026-07-31', 'Shop sales Jul 2026', 'shop', 'polubeli', '1186', '88950.00'),
  sale('2026-07-31', 'Shop sales Jul 2026', 'shop', 'pogacice', '1537', '107590.00'),
  sale('2026-07-31', 'Shop sales Jul 2026', 'shop', 'perec', '1590', '71550.00'),
  sale('2026-07-31', 'Shop sales Jul 2026', 'shop', 'kroasan', '1832', '201520.00'),
  sale('2026-07-31', 'Shop sales Jul 2026', 'shop', 'krempita', '357', '78540.00'),
  sale('2026-07-31', 'Shop sales Jul 2026', 'shop', 'kifla', '1352', '33800.00'),
  sale('2026-07-31', 'Shop sales Jul 2026', 'shop', 'integralni', '715', '67925.00'),
  sale('2026-07-31', 'Shop sales Jul 2026', 'shop', 'burek-sir', '1486', '267480.00'),
  sale('2026-07-31', 'Shop sales Jul 2026', 'shop', 'burek-meso', '529', '100510.00'),
  sale('2026-07-31', 'Shop sales Jul 2026', 'shop', 'beli', '1971', '128115.00'),
  sale('2026-07-31', 'F-ZK-2026-0416', 'telep', 'razeni', '835', '73480.00'),
  sale('2026-07-31', 'F-ZK-2026-0416', 'telep', 'polubeli', '175', '10500.00'),
  sale('2026-07-31', 'F-ZK-2026-0416', 'telep', 'pogacice', '227', '12712.00'),
  sale('2026-07-31', 'F-ZK-2026-0416', 'telep', 'perec', '162', '5832.00'),
  sale('2026-07-31', 'F-ZK-2026-0416', 'telep', 'kroasan', '378', '33264.00'),
  sale('2026-07-31', 'F-ZK-2026-0416', 'telep', 'kifla', '398', '7960.00'),
  sale('2026-07-31', 'F-ZK-2026-0416', 'telep', 'burek-meso', '711', '108072.00'),
  sale('2026-07-31', 'F-ZK-2026-0416', 'telep', 'beli', '626', '32552.00'),
  sale('2026-07-31', 'F-ZK-2026-0415', 'podbara', 'razeni', '54', '4752.00'),
  sale('2026-07-31', 'F-ZK-2026-0415', 'podbara', 'polubeli', '314', '18840.00'),
  sale('2026-07-31', 'F-ZK-2026-0415', 'podbara', 'pogacice', '264', '14784.00'),
  sale('2026-07-31', 'F-ZK-2026-0415', 'podbara', 'perec', '476', '17136.00'),
  sale('2026-07-31', 'F-ZK-2026-0415', 'podbara', 'kroasan', '64', '5632.00'),
  sale('2026-07-31', 'F-ZK-2026-0415', 'podbara', 'kifla', '630', '12600.00'),
  sale('2026-07-31', 'F-ZK-2026-0415', 'podbara', 'integralni', '861', '65436.00'),
  sale('2026-07-31', 'F-ZK-2026-0415', 'podbara', 'burek-sir', '390', '56160.00'),
  sale('2026-07-31', 'F-ZK-2026-0415', 'podbara', 'burek-meso', '651', '98952.00'),
  sale('2026-07-31', 'F-ZK-2026-0415', 'podbara', 'beli', '400', '20800.00'),
  sale('2026-07-31', 'F-ZK-2026-0414', 'liman', 'perec', '260', '9360.00'),
  sale('2026-07-31', 'F-ZK-2026-0414', 'liman', 'kroasan', '793', '69784.00'),
  sale('2026-07-31', 'F-ZK-2026-0414', 'liman', 'kifla', '136', '2720.00'),
  sale('2026-07-31', 'F-ZK-2026-0414', 'liman', 'burek-sir', '60', '8640.00'),
  sale('2026-07-31', 'F-ZK-2026-0413', 'detelinara', 'razeni', '362', '31856.00'),
  sale('2026-07-31', 'F-ZK-2026-0413', 'detelinara', 'polubeli', '788', '47280.00'),
  sale('2026-07-31', 'F-ZK-2026-0413', 'detelinara', 'pogacice', '426', '23856.00'),
  sale('2026-07-31', 'F-ZK-2026-0413', 'detelinara', 'perec', '453', '16308.00'),
  sale('2026-07-31', 'F-ZK-2026-0413', 'detelinara', 'kroasan', '876', '77088.00'),
  sale('2026-07-31', 'F-ZK-2026-0413', 'detelinara', 'burek-sir', '466', '67104.00'),
  sale('2026-07-31', 'F-ZK-2026-0412', 'lipa', 'razeni', '105', '9240.00'),
  sale('2026-07-31', 'F-ZK-2026-0412', 'lipa', 'polubeli', '609', '36540.00'),
  sale('2026-07-31', 'F-ZK-2026-0412', 'lipa', 'pogacice', '404', '22624.00'),
  sale('2026-07-31', 'F-ZK-2026-0412', 'lipa', 'perec', '771', '27756.00'),
  sale('2026-07-31', 'F-ZK-2026-0412', 'lipa', 'kroasan', '297', '26136.00'),
  sale('2026-07-31', 'F-ZK-2026-0412', 'lipa', 'integralni', '215', '16340.00'),
  sale('2026-07-31', 'F-ZK-2026-0412', 'lipa', 'burek-sir', '165', '23760.00'),
  sale('2026-07-31', 'F-ZK-2026-0412', 'lipa', 'beli', '726', '37752.00'),
  sale('2026-07-31', 'F-ZK-2026-0411', 'sunce', 'razeni', '323', '28424.00'),
  sale('2026-07-31', 'F-ZK-2026-0411', 'sunce', 'perec', '661', '23796.00'),
  sale('2026-07-31', 'F-ZK-2026-0411', 'sunce', 'kroasan', '737', '64856.00'),
  sale('2026-07-31', 'F-ZK-2026-0411', 'sunce', 'kifla', '55', '1100.00'),
  sale('2026-07-31', 'F-ZK-2026-0411', 'sunce', 'integralni', '138', '10488.00'),
  sale('2026-07-31', 'F-ZK-2026-0411', 'sunce', 'burek-sir', '827', '119088.00'),
  sale('2026-07-31', 'F-ZK-2026-0411', 'sunce', 'burek-meso', '155', '23560.00'),
  sale('2026-07-31', 'F-ZK-2026-0411', 'sunce', 'beli', '893', '46436.00'),
]
const MONTH_ROWS: PivotRow[] = [
  {
    key: 'category=bread',
    label: 'Hleb',
    cells: {
      'month=2026-07|value=revenue': '856556.00',
      'month=2026-07|value=quantity': '12031',
      'month=2026-08|value=revenue': '997337.00',
      'month=2026-08|value=quantity': '13387',
      'month=2026-09|value=revenue': '1260591.00',
      'month=2026-09|value=quantity': '16320',
      'value=revenue': '3114484.00',
      'value=quantity': '41738',
    },
    children: [
      {
        key: 'category=bread|product=beli',
        label: 'Beli hleb',
        cells: {
          'month=2026-07|value=revenue': '265655.00',
          'month=2026-07|value=quantity': '4616',
          'month=2026-08|value=revenue': '215449.00',
          'month=2026-08|value=quantity': '3662',
          'month=2026-09|value=revenue': '205127.00',
          'month=2026-09|value=quantity': '3493',
          'value=revenue': '686231.00',
          'value=quantity': '11771',
        },
      },
      {
        key: 'category=bread|product=polubeli',
        label: 'Polubeli hleb',
        cells: {
          'month=2026-07|value=revenue': '202110.00',
          'month=2026-07|value=quantity': '3072',
          'month=2026-08|value=revenue': '214170.00',
          'month=2026-08|value=quantity': '3403',
          'month=2026-09|value=revenue': '233505.00',
          'month=2026-09|value=quantity': '3742',
          'value=revenue': '649785.00',
          'value=quantity': '10217',
        },
      },
      {
        key: 'category=bread|product=integralni',
        label: 'Integralni hleb',
        cells: {
          'month=2026-07|value=revenue': '160189.00',
          'month=2026-07|value=quantity': '1929',
          'month=2026-08|value=revenue': '176206.00',
          'month=2026-08|value=quantity': '2186',
          'month=2026-09|value=revenue': '386821.00',
          'month=2026-09|value=quantity': '4548',
          'value=revenue': '723216.00',
          'value=quantity': '8663',
        },
      },
      {
        key: 'category=bread|product=razeni',
        label: 'Raženi hleb',
        cells: {
          'month=2026-07|value=revenue': '228602.00',
          'month=2026-07|value=quantity': '2414',
          'month=2026-08|value=revenue': '391512.00',
          'month=2026-08|value=quantity': '4136',
          'month=2026-09|value=revenue': '435138.00',
          'month=2026-09|value=quantity': '4537',
          'value=revenue': '1055252.00',
          'value=quantity': '11087',
        },
      },
    ],
  },
  {
    key: 'category=pastry',
    label: 'Peciva',
    cells: {
      'month=2026-07|value=revenue': '708198.00',
      'month=2026-07|value=quantity': '11921',
      'month=2026-08|value=revenue': '454543.00',
      'month=2026-08|value=quantity': '10378',
      'month=2026-09|value=revenue': '590337.00',
      'month=2026-09|value=quantity': '11485',
      'value=revenue': '1753078.00',
      'value=quantity': '33784',
    },
    children: [
      {
        key: 'category=pastry|product=kifla',
        label: 'Kifla',
        cells: {
          'month=2026-07|value=revenue': '58180.00',
          'month=2026-07|value=quantity': '2571',
          'month=2026-08|value=revenue': '86425.00',
          'month=2026-08|value=quantity': '4054',
          'month=2026-09|value=revenue': '97375.00',
          'month=2026-09|value=quantity': '4437',
          'value=revenue': '241980.00',
          'value=quantity': '11062',
        },
      },
      {
        key: 'category=pastry|product=perec',
        label: 'Perec sa susamom',
        cells: {
          'month=2026-07|value=revenue': '171738.00',
          'month=2026-07|value=quantity': '4373',
          'month=2026-08|value=revenue': '153090.00',
          'month=2026-08|value=quantity': '4001',
          'month=2026-09|value=revenue': '130644.00',
          'month=2026-09|value=quantity': '3280',
          'value=revenue': '455472.00',
          'value=quantity': '11654',
        },
      },
      {
        key: 'category=pastry|product=kroasan',
        label: 'Kroasan sa čokoladom',
        cells: {
          'month=2026-07|value=revenue': '478280.00',
          'month=2026-07|value=quantity': '4977',
          'month=2026-08|value=revenue': '215028.00',
          'month=2026-08|value=quantity': '2323',
          'month=2026-09|value=revenue': '362318.00',
          'month=2026-09|value=quantity': '3768',
          'value=revenue': '1055626.00',
          'value=quantity': '11068',
        },
      },
    ],
  },
  {
    key: 'category=savoury',
    label: 'Slano',
    cells: {
      'month=2026-07|value=revenue': '1054892.00',
      'month=2026-07|value=quantity': '8298',
      'month=2026-08|value=revenue': '1426602.00',
      'month=2026-08|value=quantity': '10161',
      'month=2026-09|value=revenue': '1587382.00',
      'month=2026-09|value=quantity': '11613',
      'value=revenue': '4068876.00',
      'value=quantity': '30072',
    },
    children: [
      {
        key: 'category=savoury|product=burek-sir',
        label: 'Burek sa sirom',
        cells: {
          'month=2026-07|value=revenue': '542232.00',
          'month=2026-07|value=quantity': '3394',
          'month=2026-08|value=revenue': '729000.00',
          'month=2026-08|value=quantity': '4589',
          'month=2026-09|value=revenue': '641772.00',
          'month=2026-09|value=quantity': '4167',
          'value=revenue': '1913004.00',
          'value=quantity': '12150',
        },
      },
      {
        key: 'category=savoury|product=burek-meso',
        label: 'Burek sa mesom',
        cells: {
          'month=2026-07|value=revenue': '331094.00',
          'month=2026-07|value=quantity': '2046',
          'month=2026-08|value=revenue': '569544.00',
          'month=2026-08|value=quantity': '3535',
          'month=2026-09|value=revenue': '756428.00',
          'month=2026-09|value=quantity': '4477',
          'value=revenue': '1657066.00',
          'value=quantity': '10058',
        },
      },
      {
        key: 'category=savoury|product=pogacice',
        label: 'Pogačice sa čvarcima',
        cells: {
          'month=2026-07|value=revenue': '181566.00',
          'month=2026-07|value=quantity': '2858',
          'month=2026-08|value=revenue': '128058.00',
          'month=2026-08|value=quantity': '2037',
          'month=2026-09|value=revenue': '189182.00',
          'month=2026-09|value=quantity': '2969',
          'value=revenue': '498806.00',
          'value=quantity': '7864',
        },
      },
    ],
  },
  {
    key: 'category=cakes',
    label: 'Kolači',
    cells: {
      'month=2026-07|value=revenue': '160100.00',
      'month=2026-07|value=quantity': '808',
      'month=2026-08|value=revenue': '106200.00',
      'month=2026-08|value=quantity': '464',
      'month=2026-09|value=revenue': '77420.00',
      'month=2026-09|value=quantity': '372',
      'value=revenue': '343720.00',
      'value=quantity': '1644',
    },
    children: [
      {
        key: 'category=cakes|product=krempita',
        label: 'Krempita',
        cells: {
          'month=2026-07|value=revenue': '78540.00',
          'month=2026-07|value=quantity': '357',
          'month=2026-08|value=revenue': '17820.00',
          'month=2026-08|value=quantity': '81',
          'month=2026-09|value=revenue': '18700.00',
          'month=2026-09|value=quantity': '85',
          'value=revenue': '115060.00',
          'value=quantity': '523',
        },
      },
      {
        key: 'category=cakes|product=reforma',
        label: 'Reforma torta, parče',
        cells: {
          'month=2026-07|value=revenue': '24440.00',
          'month=2026-07|value=quantity': '94',
          'month=2026-08|value=revenue': '70460.00',
          'month=2026-08|value=quantity': '271',
          'month=2026-09|value=revenue': '33280.00',
          'month=2026-09|value=quantity': '128',
          'value=revenue': '128180.00',
          'value=quantity': '493',
        },
      },
      {
        key: 'category=cakes|product=tulumbe',
        label: 'Tulumbe',
        cells: {
          'month=2026-07|value=revenue': '57120.00',
          'month=2026-07|value=quantity': '357',
          'month=2026-08|value=revenue': '17920.00',
          'month=2026-08|value=quantity': '112',
          'month=2026-09|value=revenue': '25440.00',
          'month=2026-09|value=quantity': '159',
          'value=revenue': '100480.00',
          'value=quantity': '628',
        },
      },
    ],
  },
]
const MONTH_TOTAL: PivotRow = {
  key: 'all',
  label: 'Total',
  cells: {
    'month=2026-07|value=revenue': '2779746.00',
    'month=2026-07|value=quantity': '33058',
    'month=2026-08|value=revenue': '2984682.00',
    'month=2026-08|value=quantity': '34390',
    'month=2026-09|value=revenue': '3515730.00',
    'month=2026-09|value=quantity': '39790',
    'value=revenue': '9280158.00',
    'value=quantity': '107238',
  },
}
const SHOP_ROWS: PivotRow[] = [
  {
    key: 'category=bread',
    label: 'Hleb',
    cells: {
      'customer=shop|value=revenue': '1276640.00',
      'customer=sunce|value=revenue': '352476.00',
      'customer=lipa|value=revenue': '221648.00',
      'customer=detelinara|value=revenue': '296840.00',
      'customer=liman|value=revenue': '196748.00',
      'customer=podbara|value=revenue': '394220.00',
      'customer=telep|value=revenue': '375912.00',
      'value=revenue': '3114484.00',
    },
    children: [
      {
        key: 'category=bread|product=beli',
        label: 'Beli hleb',
        cells: {
          'customer=shop|value=revenue': '370695.00',
          'customer=sunce|value=revenue': '120744.00',
          'customer=lipa|value=revenue': '37752.00',
          'customer=detelinara|value=revenue': '8788.00',
          'customer=liman|value=revenue': '27560.00',
          'customer=podbara|value=revenue': '47372.00',
          'customer=telep|value=revenue': '73320.00',
          'value=revenue': '686231.00',
        },
      },
      {
        key: 'category=bread|product=polubeli',
        label: 'Polubeli hleb',
        cells: {
          'customer=shop|value=revenue': '183825.00',
          'customer=sunce|value=revenue': '76620.00',
          'customer=lipa|value=revenue': '46140.00',
          'customer=detelinara|value=revenue': '133260.00',
          'customer=liman|value=revenue': '18660.00',
          'customer=podbara|value=revenue': '106440.00',
          'customer=telep|value=revenue': '84840.00',
          'value=revenue': '649785.00',
        },
      },
      {
        key: 'category=bread|product=integralni',
        label: 'Integralni hleb',
        cells: {
          'customer=shop|value=revenue': '324140.00',
          'customer=sunce|value=revenue': '44232.00',
          'customer=lipa|value=revenue': '38228.00',
          'customer=detelinara|value=revenue': '30096.00',
          'customer=liman|value=revenue': '78280.00',
          'customer=podbara|value=revenue': '161120.00',
          'customer=telep|value=revenue': '47120.00',
          'value=revenue': '723216.00',
        },
      },
      {
        key: 'category=bread|product=razeni',
        label: 'Raženi hleb',
        cells: {
          'customer=shop|value=revenue': '397980.00',
          'customer=sunce|value=revenue': '110880.00',
          'customer=lipa|value=revenue': '99528.00',
          'customer=detelinara|value=revenue': '124696.00',
          'customer=liman|value=revenue': '72248.00',
          'customer=podbara|value=revenue': '79288.00',
          'customer=telep|value=revenue': '170632.00',
          'value=revenue': '1055252.00',
        },
      },
    ],
  },
  {
    key: 'category=pastry',
    label: 'Peciva',
    cells: {
      'customer=shop|value=revenue': '691550.00',
      'customer=sunce|value=revenue': '186016.00',
      'customer=lipa|value=revenue': '217536.00',
      'customer=detelinara|value=revenue': '218956.00',
      'customer=liman|value=revenue': '176136.00',
      'customer=podbara|value=revenue': '115768.00',
      'customer=telep|value=revenue': '147116.00',
      'value=revenue': '1753078.00',
    },
    children: [
      {
        key: 'category=pastry|product=kifla',
        label: 'Kifla',
        cells: {
          'customer=shop|value=revenue': '103700.00',
          'customer=sunce|value=revenue': '9060.00',
          'customer=lipa|value=revenue': '27960.00',
          'customer=detelinara|value=revenue': '13180.00',
          'customer=liman|value=revenue': '20620.00',
          'customer=podbara|value=revenue': '36000.00',
          'customer=telep|value=revenue': '31460.00',
          'value=revenue': '241980.00',
        },
      },
      {
        key: 'category=pastry|product=perec',
        label: 'Perec sa susamom',
        cells: {
          'customer=shop|value=revenue': '179640.00',
          'customer=sunce|value=revenue': '29556.00',
          'customer=lipa|value=revenue': '73944.00',
          'customer=detelinara|value=revenue': '65592.00',
          'customer=liman|value=revenue': '21492.00',
          'customer=podbara|value=revenue': '50904.00',
          'customer=telep|value=revenue': '34344.00',
          'value=revenue': '455472.00',
        },
      },
      {
        key: 'category=pastry|product=kroasan',
        label: 'Kroasan sa čokoladom',
        cells: {
          'customer=shop|value=revenue': '408210.00',
          'customer=sunce|value=revenue': '147400.00',
          'customer=lipa|value=revenue': '115632.00',
          'customer=detelinara|value=revenue': '140184.00',
          'customer=liman|value=revenue': '134024.00',
          'customer=podbara|value=revenue': '28864.00',
          'customer=telep|value=revenue': '81312.00',
          'value=revenue': '1055626.00',
        },
      },
    ],
  },
  {
    key: 'category=savoury',
    label: 'Slano',
    cells: {
      'customer=shop|value=revenue': '1750380.00',
      'customer=sunce|value=revenue': '458296.00',
      'customer=lipa|value=revenue': '410656.00',
      'customer=detelinara|value=revenue': '261520.00',
      'customer=liman|value=revenue': '326944.00',
      'customer=podbara|value=revenue': '335560.00',
      'customer=telep|value=revenue': '525520.00',
      'value=revenue': '4068876.00',
    },
    children: [
      {
        key: 'category=savoury|product=burek-sir',
        label: 'Burek sa sirom',
        cells: {
          'customer=shop|value=revenue': '817020.00',
          'customer=sunce|value=revenue': '264528.00',
          'customer=lipa|value=revenue': '202896.00',
          'customer=detelinara|value=revenue': '196128.00',
          'customer=liman|value=revenue': '117792.00',
          'customer=podbara|value=revenue': '160416.00',
          'customer=telep|value=revenue': '154224.00',
          'value=revenue': '1913004.00',
        },
      },
      {
        key: 'category=savoury|product=burek-meso',
        label: 'Burek sa mesom',
        cells: {
          'customer=shop|value=revenue': '641250.00',
          'customer=sunce|value=revenue': '189848.00',
          'customer=lipa|value=revenue': '185136.00',
          'customer=detelinara|value=revenue': '11856.00',
          'customer=liman|value=revenue': '185744.00',
          'customer=podbara|value=revenue': '160360.00',
          'customer=telep|value=revenue': '282872.00',
          'value=revenue': '1657066.00',
        },
      },
      {
        key: 'category=savoury|product=pogacice',
        label: 'Pogačice sa čvarcima',
        cells: {
          'customer=shop|value=revenue': '292110.00',
          'customer=sunce|value=revenue': '3920.00',
          'customer=lipa|value=revenue': '22624.00',
          'customer=detelinara|value=revenue': '53536.00',
          'customer=liman|value=revenue': '23408.00',
          'customer=podbara|value=revenue': '14784.00',
          'customer=telep|value=revenue': '88424.00',
          'value=revenue': '498806.00',
        },
      },
    ],
  },
  {
    key: 'category=cakes',
    label: 'Kolači',
    cells: {
      'customer=shop|value=revenue': '343720.00',
      'customer=sunce|value=revenue': null,
      'customer=lipa|value=revenue': null,
      'customer=detelinara|value=revenue': null,
      'customer=liman|value=revenue': null,
      'customer=podbara|value=revenue': null,
      'customer=telep|value=revenue': null,
      'value=revenue': '343720.00',
    },
    children: [
      {
        key: 'category=cakes|product=krempita',
        label: 'Krempita',
        cells: {
          'customer=shop|value=revenue': '115060.00',
          'customer=sunce|value=revenue': null,
          'customer=lipa|value=revenue': null,
          'customer=detelinara|value=revenue': null,
          'customer=liman|value=revenue': null,
          'customer=podbara|value=revenue': null,
          'customer=telep|value=revenue': null,
          'value=revenue': '115060.00',
        },
      },
      {
        key: 'category=cakes|product=reforma',
        label: 'Reforma torta, parče',
        cells: {
          'customer=shop|value=revenue': '128180.00',
          'customer=sunce|value=revenue': null,
          'customer=lipa|value=revenue': null,
          'customer=detelinara|value=revenue': null,
          'customer=liman|value=revenue': null,
          'customer=podbara|value=revenue': null,
          'customer=telep|value=revenue': null,
          'value=revenue': '128180.00',
        },
      },
      {
        key: 'category=cakes|product=tulumbe',
        label: 'Tulumbe',
        cells: {
          'customer=shop|value=revenue': '100480.00',
          'customer=sunce|value=revenue': null,
          'customer=lipa|value=revenue': null,
          'customer=detelinara|value=revenue': null,
          'customer=liman|value=revenue': null,
          'customer=podbara|value=revenue': null,
          'customer=telep|value=revenue': null,
          'value=revenue': '100480.00',
        },
      },
    ],
  },
]
const SHOP_TOTAL: PivotRow = {
  key: 'all',
  label: 'Total',
  cells: {
    'customer=shop|value=revenue': '4062290.00',
    'customer=sunce|value=revenue': '996788.00',
    'customer=lipa|value=revenue': '849840.00',
    'customer=detelinara|value=revenue': '777316.00',
    'customer=liman|value=revenue': '699828.00',
    'customer=podbara|value=revenue': '845548.00',
    'customer=telep|value=revenue': '1048548.00',
    'value=revenue': '9280158.00',
  },
}

export const SALES_VIEWS: AnalysisView[] = [
  {
    id: 'months',
    label: 'By product and month',
    layout: {
      rows: ['category', 'product'],
      columns: ['month'],
      values: [
        { field: 'revenue', aggregation: 'sum' },
        { field: 'quantity', aggregation: 'sum' },
      ],
      filters: [{ field: 'channel', values: [] }],
    },
    result: { columns: SALES_MONTH_COLUMNS, rows: MONTH_ROWS, total: MONTH_TOTAL },
  },
  {
    id: 'shops',
    label: 'By product and shop',
    layout: {
      rows: ['category', 'product'],
      columns: ['customer'],
      values: [{ field: 'revenue', aggregation: 'sum' }],
      filters: [{ field: 'month', values: [] }],
    },
    result: { columns: SALES_SHOP_COLUMNS, rows: SHOP_ROWS, total: SHOP_TOTAL },
  },
]

/** The figure opened in the records' story: Kifla's revenue in September. */
export const SALES_OPENED = {
  rowKey: 'category=pastry|product=kifla',
  columnKey: 'month=2026-09|value=revenue',
  rowPath: ['Peciva', 'Kifla'],
  columnPath: ['Sep 2026', 'Revenue'],
}
