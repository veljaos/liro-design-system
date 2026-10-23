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
