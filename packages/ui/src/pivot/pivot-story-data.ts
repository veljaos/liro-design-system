import type {
  PivotColumn,
  PivotField,
  PivotLayout,
  PivotResult,
  PivotRow,
  PivotView,
} from './pivot-logic'

/*
 * The stories' pivot: a fictitious company's sales by region and product line over three
 * quarters. Every figure here is the application's (written out, never computed by the story).
 */

export const FIELDS: PivotField[] = [
  {
    id: 'region',
    label: 'Region',
    kind: 'dimension',
    values: [
      { id: 'north', label: 'North' },
      { id: 'south', label: 'South' },
      { id: 'west', label: 'West' },
    ],
  },
  {
    id: 'line',
    label: 'Product line',
    kind: 'dimension',
    values: [
      { id: 'hardware', label: 'Hardware' },
      { id: 'software', label: 'Software' },
      { id: 'services', label: 'Services' },
    ],
  },
  {
    id: 'quarter',
    label: 'Quarter',
    kind: 'dimension',
    values: [
      { id: 'q1', label: 'Q1 2026' },
      { id: 'q2', label: 'Q2 2026' },
      { id: 'q3', label: 'Q3 2026' },
    ],
  },
  { id: 'month', label: 'Month', kind: 'dimension' },
  {
    id: 'salesperson',
    label: 'Salesperson',
    kind: 'dimension',
    values: [
      { id: 'ana', label: 'Ana Petrović' },
      { id: 'ivan', label: 'Ivan Jović' },
      { id: 'sara', label: 'Sara Ilić' },
    ],
  },
  {
    id: 'amount',
    label: 'Amount',
    kind: 'measure',
    aggregations: [
      { id: 'sum', label: 'Sum' },
      { id: 'average', label: 'Average' },
      { id: 'min', label: 'Minimum' },
      { id: 'max', label: 'Maximum' },
    ],
  },
  {
    id: 'orders',
    label: 'Orders',
    kind: 'measure',
    aggregations: [{ id: 'count', label: 'Count' }],
  },
]

/** Region and product line down, quarters across, amount and orders; salesperson as a filter. */
export const QUARTER_LAYOUT: PivotLayout = {
  rows: ['region', 'line'],
  columns: ['quarter'],
  values: [
    { field: 'amount', aggregation: 'sum' },
    { field: 'orders', aggregation: 'count' },
  ],
  filters: [{ field: 'salesperson', values: [] }],
}

/** Each quarter over its two figures, and the total column over the same two. */
export const QUARTER_COLUMNS: PivotColumn[] = [
  ...[
    ['q1', 'Q1 2026'],
    ['q2', 'Q2 2026'],
    ['q3', 'Q3 2026'],
    ['total', 'Total'],
  ].map(([key = '', label = '']) => ({
    key,
    label,
    ...(key === 'total' ? { total: true } : {}),
    children: [
      { key: `${key}:amount`, label: 'Amount', kind: 'money' as const, currency: 'EUR' },
      { key: `${key}:orders`, label: 'Orders', decimals: 0 },
    ],
  })),
]

export const QUARTER_ROWS: PivotRow[] = [
  {
    key: 'north',
    label: 'North',
    cells: {
      'q1:amount': '1563013.37',
      'q1:orders': '104',
      'q2:amount': '1712821.17',
      'q2:orders': '73',
      'q3:amount': '1969544.80',
      'q3:orders': '53',
      'total:amount': '5245379.34',
      'total:orders': '230',
    },
    children: [
      {
        key: 'north/hardware',
        label: 'Hardware',
        cells: {
          'q1:amount': '459563.19',
          'q1:orders': '29',
          'q2:amount': '802554.06',
          'q2:orders': '8',
          'q3:amount': '681913.12',
          'q3:orders': '27',
          'total:amount': '1944030.37',
          'total:orders': '64',
        },
      },
      {
        key: 'north/software',
        label: 'Software',
        cells: {
          'q1:amount': '731097.07',
          'q1:orders': '36',
          'q2:amount': '345127.04',
          'q2:orders': '9',
          'q3:amount': '574710.53',
          'q3:orders': '8',
          'total:amount': '1650934.64',
          'total:orders': '53',
        },
      },
      {
        key: 'north/services',
        label: 'Services',
        cells: {
          'q1:amount': '372353.11',
          'q1:orders': '39',
          'q2:amount': '565140.07',
          'q2:orders': '56',
          'q3:amount': '712921.15',
          'q3:orders': '18',
          'total:amount': '1650414.33',
          'total:orders': '113',
        },
      },
    ],
  },
  {
    key: 'south',
    label: 'South',
    cells: {
      'q1:amount': '1668751.90',
      'q1:orders': '138',
      'q2:amount': '1420281.97',
      'q2:orders': '86',
      'q3:amount': '1035273.49',
      'q3:orders': '69',
      'total:amount': '4124307.36',
      'total:orders': '293',
    },
    children: [
      {
        key: 'south/hardware',
        label: 'Hardware',
        cells: {
          'q1:amount': '781259.80',
          'q1:orders': '41',
          'q2:amount': '184867.73',
          'q2:orders': '41',
          'q3:amount': '535949.06',
          'q3:orders': '18',
          'total:amount': '1502076.59',
          'total:orders': '100',
        },
      },
      {
        key: 'south/software',
        label: 'Software',
        cells: {
          'q1:amount': '168845.71',
          'q1:orders': '58',
          'q2:amount': '259643.37',
          'q2:orders': '30',
          'q3:amount': '271262.69',
          'q3:orders': '11',
          'total:amount': '699751.77',
          'total:orders': '99',
        },
      },
      {
        key: 'south/services',
        label: 'Services',
        cells: {
          'q1:amount': '718646.39',
          'q1:orders': '39',
          'q2:amount': '975770.87',
          'q2:orders': '15',
          'q3:amount': '228061.74',
          'q3:orders': '40',
          'total:amount': '1922479.00',
          'total:orders': '94',
        },
      },
    ],
  },
  {
    key: 'west',
    label: 'West',
    cells: {
      'q1:amount': '1559027.50',
      'q1:orders': '62',
      'q2:amount': '1789621.96',
      'q2:orders': '107',
      'q3:amount': '1555151.43',
      'q3:orders': '94',
      'total:amount': '4903800.89',
      'total:orders': '263',
    },
    children: [
      {
        key: 'west/hardware',
        label: 'Hardware',
        cells: {
          'q1:amount': '789949.24',
          'q1:orders': '27',
          'q2:amount': '222163.70',
          'q2:orders': '49',
          'q3:amount': '185839.72',
          'q3:orders': '7',
          'total:amount': '1197952.66',
          'total:orders': '83',
        },
      },
      {
        key: 'west/software',
        label: 'Software',
        cells: {
          'q1:amount': '769078.26',
          'q1:orders': '35',
          'q2:amount': '833451.68',
          'q2:orders': '31',
          'q3:amount': '934983.40',
          'q3:orders': '33',
          'total:amount': '2537513.34',
          'total:orders': '99',
        },
      },
      {
        key: 'west/services',
        label: 'Services',
        cells: {
          'q1:amount': null,
          'q1:orders': null,
          'q2:amount': '734006.58',
          'q2:orders': '27',
          'q3:amount': '434328.31',
          'q3:orders': '54',
          'total:amount': '1168334.89',
          'total:orders': '81',
        },
      },
    ],
  },
]
export const QUARTER_TOTAL: PivotRow = {
  key: 'total',
  label: 'Total',
  cells: {
    'q1:amount': '4790792.77',
    'q1:orders': '304',
    'q2:amount': '4922725.10',
    'q2:orders': '266',
    'q3:amount': '4559969.72',
    'q3:orders': '216',
    'total:amount': '14273487.59',
    'total:orders': '786',
  },
}
export const MONTH_ROWS: PivotRow[] = [
  {
    key: 'north',
    label: 'North',
    cells: {
      '2026-07': '576998.89',
      '2026-08': '711907.10',
      '2026-09': '1404653.38',
      total: '2693559.37',
    },
  },
  {
    key: 'south',
    label: 'South',
    cells: {
      '2026-07': '1301416.63',
      '2026-08': '920320.93',
      '2026-09': '1141273.36',
      total: '3363010.92',
    },
  },
  {
    key: 'west',
    label: 'West',
    cells: {
      '2026-07': '1477079.09',
      '2026-08': '447601.65',
      '2026-09': '1076867.21',
      total: '3001547.95',
    },
  },
]
export const MONTH_TOTAL: PivotRow = {
  key: 'total',
  label: 'Total',
  cells: {
    '2026-07': '3355494.61',
    '2026-08': '2079829.68',
    '2026-09': '3622793.95',
    total: '9058118.24',
  },
}

export const QUARTER_RESULT: PivotResult = {
  columns: QUARTER_COLUMNS,
  rows: QUARTER_ROWS,
  total: QUARTER_TOTAL,
}

/** Region down, months across, one figure: one header row. */
export const MONTH_LAYOUT: PivotLayout = {
  rows: ['region'],
  columns: ['month'],
  values: [{ field: 'amount', aggregation: 'sum' }],
  filters: [],
}

export const MONTH_RESULT: PivotResult = {
  columns: [
    { key: '2026-07', label: 'Jul 2026', kind: 'money', currency: 'EUR' },
    { key: '2026-08', label: 'Aug 2026', kind: 'money', currency: 'EUR' },
    { key: '2026-09', label: 'Sep 2026', kind: 'money', currency: 'EUR' },
    { key: 'total', label: 'Total', total: true, kind: 'money', currency: 'EUR' },
  ],
  rows: MONTH_ROWS,
  total: MONTH_TOTAL,
}

/** The labels of a result's rows and columns replaced (another language, long names). */
export function relabel(
  result: PivotResult,
  labels: Readonly<Record<string, string>>,
): PivotResult {
  const rows = (list: readonly PivotRow[]): PivotRow[] =>
    list.map((row) => ({
      ...row,
      label: labels[row.label] ?? row.label,
      ...(row.children === undefined ? {} : { children: rows(row.children) }),
    }))
  const columns = (list: readonly PivotColumn[]): PivotColumn[] =>
    list.map((column) => ({
      ...column,
      label: labels[column.label] ?? column.label,
      ...(column.children === undefined ? {} : { children: columns(column.children) }),
    }))
  return {
    columns: columns(result.columns),
    rows: rows(result.rows),
    ...(result.total === undefined
      ? {}
      : { total: { ...result.total, label: labels[result.total.label] ?? result.total.label } }),
  }
}

/** The fields' names (and their choices) replaced. */
export function relabelFields(labels: Readonly<Record<string, string>>): PivotField[] {
  const option = (each: { id: string; label: string }) => ({
    ...each,
    label: labels[each.label] ?? each.label,
  })
  return FIELDS.map((field) => ({
    ...field,
    label: labels[field.label] ?? field.label,
    ...(field.values === undefined ? {} : { values: field.values.map(option) }),
    ...(field.aggregations === undefined ? {} : { aggregations: field.aggregations.map(option) }),
  }))
}

export const ARABIC_LABELS: Record<string, string> = {
  Region: 'المنطقة',
  'Product line': 'خط المنتجات',
  Quarter: 'الربع',
  Month: 'الشهر',
  Salesperson: 'مندوب المبيعات',
  Amount: 'المبلغ',
  Orders: 'الطلبات',
  Sum: 'المجموع',
  Average: 'المتوسط',
  Minimum: 'الأدنى',
  Maximum: 'الأعلى',
  Count: 'العدد',
  North: 'الشمال',
  South: 'الجنوب',
  West: 'الغرب',
  Hardware: 'الأجهزة',
  Software: 'البرمجيات',
  Services: 'الخدمات',
  'Q1 2026': 'الربع الأول 2026',
  'Q2 2026': 'الربع الثاني 2026',
  'Q3 2026': 'الربع الثالث 2026',
  Total: 'الإجمالي',
  'Ana Petrović': 'آنا بتروفيتش',
  'Ivan Jović': 'إيفان يوفيتش',
  'Sara Ilić': 'سارة إيليتش',
}

export const JAPANESE_LABELS: Record<string, string> = {
  Region: '地域',
  'Product line': '製品ライン',
  Quarter: '四半期',
  Month: '月',
  Salesperson: '営業担当',
  Amount: '金額',
  Orders: '注文数',
  Sum: '合計',
  Average: '平均',
  Minimum: '最小',
  Maximum: '最大',
  Count: '件数',
  North: '北部',
  South: '南部',
  West: '西部',
  Hardware: 'ハードウェア',
  Software: 'ソフトウェア',
  Services: 'サービス',
  'Q1 2026': '2026年第1四半期',
  'Q2 2026': '2026年第2四半期',
  'Q3 2026': '2026年第3四半期',
  Total: '総計',
  'Ana Petrović': 'アナ・ペトロヴィッチ',
  'Ivan Jović': 'イヴァン・ヨヴィッチ',
  'Sara Ilić': 'サラ・イリッチ',
}

export const LONG_LABELS: Record<string, string> = {
  North: 'Northern region with the coastal districts, the islands and the mountain valleys',
  Hardware: 'Hardware, spare parts and accessories delivered with installation on site',
  'Product line': 'Product line as registered in the catalogue of the previous year',
}

/** The views the stories' application suggests (P5.93 item 45): the user starts from one. */
export const VIEWS: PivotView[] = [
  { id: 'quarter', label: 'By region and quarter', layout: QUARTER_LAYOUT },
  { id: 'month', label: 'By region and month', layout: MONTH_LAYOUT },
  {
    id: 'salesperson',
    label: 'By salesperson',
    layout: {
      rows: ['salesperson'],
      columns: ['quarter'],
      values: [{ field: 'amount', aggregation: 'sum' }],
      filters: [],
    },
  },
]
