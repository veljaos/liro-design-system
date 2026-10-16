/*
 * Group AY's example data (P5.51, the item card and transfers): Kvadrat Gradnja d.o.o.'s stock of
 * cement CEM II/A-M 42,5R in its two warehouses — Central warehouse (Novi Sad) and Site Liman 4 —
 * on 14.10.2026 at 09:40: the balance per warehouse with its value, the movements of October with
 * the running balance and value (weighted average cost), each movement's document, and the
 * transfers between the warehouses: MP-2026-0028 and MP-2026-0030 received, MP-2026-0031 a draft
 * for the fourth floor's slab (poured at night on 15.10., group AA and Y). The items are the ones
 * of group I's handheld (the same names and codes). Every figure — balances, values, averages,
 * what is available, the period's totals — is the application's, written here as decimal strings;
 * the screens compute nothing. Checked against each other in dataset-checks.ts. Invented data;
 * account numbers illustrative. Not part of the package. No classes here.
 */

export const AY_TODAY = '2026-10-14'

/** The warehouses of Kvadrat Gradnja d.o.o. (the round's shared facts). */
export const WAREHOUSES = {
  central: {
    id: 'central',
    name: 'Central warehouse',
    place: 'Primorska 88, Novi Sad',
    keeper: 'Goran Babić',
  },
  site: {
    id: 'site',
    name: 'Site Liman 4',
    place: 'Bulevar cara Lazara 4, Novi Sad',
    keeper: 'Snežana Popović',
  },
} as const

export type WarehouseId = keyof typeof WAREHOUSES

/** The cement whose card is shown. */
export const ITEM = {
  code: '8600981000101',
  name: 'Cement CEM II/A-M 42,5R, 25 kg',
  unit: 'bag',
  group: 'Building materials · Binders',
  vat: '20%',
  supplier: 'Beton Mix d.o.o.',
  account: '1010 Materials in stock (illustrative)',
  valuation: 'Weighted average cost',
  minimum: '150',
}

const TRANSFER_PATH = (number: string) => `/inventory/transfers/${number}`
const DOCUMENT_PATH = (number: string) => `/inventory/documents/${number}`

export const AY_ROUTES = {
  item: `/inventory/items/${ITEM.code}`,
  /** The card with Site Liman 4's movements. */
  itemSite: `/inventory/items/${ITEM.code}?warehouse=site`,
  transfer: TRANSFER_PATH('MP-2026-0031'),
  /** MP-2026-0031 sent: on its way to Site Liman 4. */
  transferSent: `${TRANSFER_PATH('MP-2026-0031')}?state=sent`,
  transferOf: TRANSFER_PATH,
  documentOf: DOCUMENT_PATH,
}

// ── The balance per warehouse ─────────────────────────────────────────────────────────────────

export interface WarehouseBalance {
  id: WarehouseId
  onHand: string
  reserved: string
  available: string
  value: string
  averageCost: string
}

/** On 14.10.2026 at 09:40; reserved: delivery note OT-2026-0081 to Stanogradnja Plus, a draft. */
export const BALANCES: readonly WarehouseBalance[] = [
  {
    id: 'central',
    onHand: '460',
    reserved: '60',
    available: '400',
    value: '322000.00',
    averageCost: '700.00',
  },
  {
    id: 'site',
    onHand: '55',
    reserved: '0',
    available: '55',
    value: '38200.00',
    averageCost: '694.55',
  },
]

/** The application's totals of the balances above. */
export const BALANCE_TOTALS = {
  onHand: '515',
  reserved: '60',
  available: '455',
  value: '360200.00',
  averageCost: '699.42',
}

// ── Movements ─────────────────────────────────────────────────────────────────────────────────

export type MovementKind =
  | 'Opening balance'
  | 'Goods receipt'
  | 'Transfer out'
  | 'Transfer in'
  | 'Delivery note'
  | 'Issue to works'
  | 'Issue to workshop'

export interface Movement {
  id: string
  date: string
  kind: MovementKind
  /** The document's number; none for the opening balance. */
  document?: string
  /** Where it opens: a transfer, or another stock document. */
  href?: string
  /** The partner, the other warehouse or the purpose, in the application's words. */
  note: string
  quantityIn: string | null
  quantityOut: string | null
  /** The running balance after the movement. */
  balance: string
  /** The movement's value at cost, signed (in +, out −); null for the opening balance. */
  value: string | null
  /** The running value after the movement. */
  balanceValue: string
}

/** October 2026 in Central warehouse, at weighted average cost (the application's figures). */
export const CENTRAL_MOVEMENTS: readonly Movement[] = [
  {
    id: 'c0',
    date: '2026-10-01',
    kind: 'Opening balance',
    note: 'Closing balance of September 2026',
    quantityIn: null,
    quantityOut: null,
    balance: '320',
    value: null,
    balanceValue: '217600.00',
  },
  {
    id: 'c1',
    date: '2026-10-02',
    kind: 'Transfer out',
    document: 'MP-2026-0028',
    href: TRANSFER_PATH('MP-2026-0028'),
    note: 'To Site Liman 4',
    quantityIn: null,
    quantityOut: '160',
    balance: '160',
    value: '-108800.00',
    balanceValue: '108800.00',
  },
  {
    id: 'c2',
    date: '2026-10-06',
    kind: 'Delivery note',
    document: 'OT-2026-0077',
    href: DOCUMENT_PATH('OT-2026-0077'),
    note: 'Stanogradnja Plus d.o.o.',
    quantityIn: null,
    quantityOut: '40',
    balance: '120',
    value: '-27200.00',
    balanceValue: '81600.00',
  },
  {
    id: 'c3',
    date: '2026-10-08',
    kind: 'Goods receipt',
    document: 'PRI-2026-0207',
    href: DOCUMENT_PATH('PRI-2026-0207'),
    note: 'Beton Mix d.o.o., 705,00 a bag',
    quantityIn: '480',
    quantityOut: null,
    balance: '600',
    value: '338400.00',
    balanceValue: '420000.00',
  },
  {
    id: 'c4',
    date: '2026-10-12',
    kind: 'Transfer out',
    document: 'MP-2026-0030',
    href: TRANSFER_PATH('MP-2026-0030'),
    note: 'To Site Liman 4',
    quantityIn: null,
    quantityOut: '120',
    balance: '480',
    value: '-84000.00',
    balanceValue: '336000.00',
  },
  {
    id: 'c5',
    date: '2026-10-13',
    kind: 'Issue to workshop',
    document: 'IZ-2026-0144',
    href: DOCUMENT_PATH('IZ-2026-0144'),
    note: 'Precast workshop: lintels',
    quantityIn: null,
    quantityOut: '20',
    balance: '460',
    value: '-14000.00',
    balanceValue: '322000.00',
  },
]

/** October 2026 at Site Liman 4. */
export const SITE_MOVEMENTS: readonly Movement[] = [
  {
    id: 's0',
    date: '2026-10-01',
    kind: 'Opening balance',
    note: 'Closing balance of September 2026',
    quantityIn: null,
    quantityOut: null,
    balance: '35',
    value: null,
    balanceValue: '23800.00',
  },
  {
    id: 's1',
    date: '2026-10-02',
    kind: 'Transfer in',
    document: 'MP-2026-0028',
    href: TRANSFER_PATH('MP-2026-0028'),
    note: 'From Central warehouse',
    quantityIn: '160',
    quantityOut: null,
    balance: '195',
    value: '108800.00',
    balanceValue: '132600.00',
  },
  {
    id: 's2',
    date: '2026-10-09',
    kind: 'Issue to works',
    document: 'IZ-2026-0139',
    href: DOCUMENT_PATH('IZ-2026-0139'),
    note: 'Residential building Liman 4 · Floors 3–4',
    quantityIn: null,
    quantityOut: '150',
    balance: '45',
    value: '-102000.00',
    balanceValue: '30600.00',
  },
  {
    id: 's3',
    date: '2026-10-12',
    kind: 'Transfer in',
    document: 'MP-2026-0030',
    href: TRANSFER_PATH('MP-2026-0030'),
    note: 'From Central warehouse',
    quantityIn: '120',
    quantityOut: null,
    balance: '165',
    value: '84000.00',
    balanceValue: '114600.00',
  },
  {
    id: 's4',
    date: '2026-10-13',
    kind: 'Issue to works',
    document: 'IZ-2026-0141',
    href: DOCUMENT_PATH('IZ-2026-0141'),
    note: 'Residential building Liman 4 · Floors 3–4',
    quantityIn: null,
    quantityOut: '110',
    balance: '55',
    value: '-76400.00',
    balanceValue: '38200.00',
  },
]

export interface PeriodTotals {
  quantityIn: string
  quantityOut: string
  balance: string
  /** The period's net change in value, signed. */
  value: string
  balanceValue: string
}

/** The period's totals, the application's. */
export const MOVEMENT_TOTALS: Record<WarehouseId, PeriodTotals> = {
  central: {
    quantityIn: '480',
    quantityOut: '340',
    balance: '460',
    value: '104400.00',
    balanceValue: '322000.00',
  },
  site: {
    quantityIn: '280',
    quantityOut: '260',
    balance: '55',
    value: '14400.00',
    balanceValue: '38200.00',
  },
}

export const MOVEMENTS: Record<WarehouseId, readonly Movement[]> = {
  central: CENTRAL_MOVEMENTS,
  site: SITE_MOVEMENTS,
}

// ── Other stock documents (drill-down) ────────────────────────────────────────────────────────

export interface StockDocumentLine {
  id: string
  item: string
  code: string
  unit: string
  quantity: string
  price: string
  value: string
}

export interface StockDocument {
  number: string
  kind: MovementKind
  date: string
  warehouse: WarehouseId
  /** The partner, or the purpose, with its label. */
  party: { label: string; name: string; taxId?: string }
  /** What it was based on, in words. */
  basedOn?: string
  postedBy: string
  lines: readonly StockDocumentLine[]
  total: string
}

const CEMENT = { item: ITEM.name, code: ITEM.code, unit: ITEM.unit }

export const STOCK_DOCUMENTS: readonly StockDocument[] = [
  {
    number: 'PRI-2026-0207',
    kind: 'Goods receipt',
    date: '2026-10-08',
    warehouse: 'central',
    party: { label: 'Supplier', name: 'Beton Mix d.o.o.', taxId: 'PIB 106543218' },
    basedOn: 'Purchase order NB-2026-0084, delivery note BM-2026-3310',
    postedBy: 'Goran Babić',
    lines: [
      { id: 'l1', ...CEMENT, quantity: '480', price: '705.00', value: '338400.00' },
      {
        id: 'l2',
        item: 'Lepak za pločice C2TE, 25 kg',
        code: '8600981000118',
        unit: 'bag',
        quantity: '60',
        price: '890.00',
        value: '53400.00',
      },
    ],
    total: '391800.00',
  },
  {
    number: 'OT-2026-0077',
    kind: 'Delivery note',
    date: '2026-10-06',
    warehouse: 'central',
    party: { label: 'Customer', name: 'Stanogradnja Plus d.o.o.', taxId: 'PIB 108990341' },
    basedOn: 'Sales order PO-2026-0119',
    postedBy: 'Goran Babić',
    lines: [{ id: 'l1', ...CEMENT, quantity: '40', price: '680.00', value: '27200.00' }],
    total: '27200.00',
  },
  {
    number: 'IZ-2026-0144',
    kind: 'Issue to workshop',
    date: '2026-10-13',
    warehouse: 'central',
    party: { label: 'Issued to', name: 'Precast workshop' },
    basedOn: 'Requisition of Dragan Ilić: lintels for Floors 3–4',
    postedBy: 'Goran Babić',
    lines: [{ id: 'l1', ...CEMENT, quantity: '20', price: '700.00', value: '14000.00' }],
    total: '14000.00',
  },
  {
    number: 'IZ-2026-0139',
    kind: 'Issue to works',
    date: '2026-10-09',
    warehouse: 'site',
    party: { label: 'Issued to', name: 'Residential building Liman 4 · Floors 3–4' },
    basedOn: 'Site diary of 03.–09.10.2026, Crew Ilić',
    postedBy: 'Snežana Popović',
    lines: [{ id: 'l1', ...CEMENT, quantity: '150', price: '680.00', value: '102000.00' }],
    total: '102000.00',
  },
  {
    number: 'IZ-2026-0141',
    kind: 'Issue to works',
    date: '2026-10-13',
    warehouse: 'site',
    party: { label: 'Issued to', name: 'Residential building Liman 4 · Floors 3–4' },
    basedOn: 'Site diary of 12.–13.10.2026, Crew Ilić',
    postedBy: 'Snežana Popović',
    lines: [{ id: 'l1', ...CEMENT, quantity: '110', price: '694.55', value: '76400.00' }],
    total: '76400.00',
  },
]

// ── Transfers ─────────────────────────────────────────────────────────────────────────────────

/** A transfer's state in the application's words. */
export type TransferState = 'Draft' | 'In transit' | 'Received'

export const TRANSFER_STATES: readonly TransferState[] = ['Draft', 'In transit', 'Received']

export interface TransferLine {
  id: string
  /** The item's code; null on a new line until an item is chosen. */
  code: string | null
  item: string
  unit: string
  /** What the source warehouse can give now (on hand less reserved), from the application. */
  available: string | null
  quantity: string | null
  /** What the receiving warehouse counted in; on a received transfer. */
  received?: string
}

export interface Transfer {
  number: string
  date: string
  from: WarehouseId
  to: WarehouseId
  state: TransferState
  purpose: string
  preparedBy: string
  /** "Sent 12.10.2026. 07:15 by Goran Babić", the application's words. */
  sent?: string
  received?: string
  lines: readonly TransferLine[]
}

/** The items Central warehouse holds, as the transfer's item search offers them. */
export const CENTRAL_STOCK: readonly {
  code: string
  item: string
  unit: string
  available: string
}[] = [
  { code: ITEM.code, item: ITEM.name, unit: ITEM.unit, available: '400' },
  {
    code: '8600981000118',
    item: 'Lepak za pločice C2TE, 25 kg',
    unit: 'bag',
    available: '74',
  },
  {
    code: '8600981000231',
    item: 'Armaturna mreža Q188, 2,15 × 6 m',
    unit: 'pc',
    available: '86',
  },
  {
    code: '8600981000125',
    item: 'Armaturna mreža Q131, 2,15 × 6 m',
    unit: 'pc',
    available: '0',
  },
  {
    code: '8600981000248',
    item: 'Vezivna žica 1,2 mm, 25 kg',
    unit: 'roll',
    available: '9',
  },
  {
    code: '8600981000132',
    item: 'Hidroizolaciona traka, rolna 10 m',
    unit: 'roll',
    available: '3',
  },
  {
    code: '8600981000194',
    item: 'Silikon građevinski, beli, 300 ml',
    unit: 'pc',
    available: '48',
  },
  {
    code: '8600981000170',
    item: 'UW profil 50 mm, 3 m',
    unit: 'pc',
    available: '140',
  },
]

export const TRANSFERS: readonly Transfer[] = [
  {
    number: 'MP-2026-0031',
    date: '2026-10-14',
    from: 'central',
    to: 'site',
    state: 'Draft',
    purpose: 'Floors 3–4: the fourth floor’s slab, poured on 15.10.2026',
    preparedBy: 'Goran Babić',
    lines: [
      {
        id: 't1',
        code: ITEM.code,
        item: ITEM.name,
        unit: ITEM.unit,
        available: '400',
        quantity: '200',
      },
      {
        id: 't2',
        code: '8600981000231',
        item: 'Armaturna mreža Q188, 2,15 × 6 m',
        unit: 'pc',
        available: '86',
        quantity: '60',
      },
      {
        id: 't3',
        code: '8600981000248',
        item: 'Vezivna žica 1,2 mm, 25 kg',
        unit: 'roll',
        available: '9',
        quantity: '4',
      },
      {
        id: 't4',
        code: '8600981000132',
        item: 'Hidroizolaciona traka, rolna 10 m',
        unit: 'roll',
        available: '3',
        quantity: '6',
      },
    ],
  },
  {
    number: 'MP-2026-0030',
    date: '2026-10-12',
    from: 'central',
    to: 'site',
    state: 'Received',
    purpose: 'Floors 3–4: walls of the third floor',
    preparedBy: 'Goran Babić',
    sent: 'Sent 12.10.2026. 07:15 by Goran Babić',
    received: 'Received 12.10.2026. 08:40 by Snežana Popović',
    lines: [
      {
        id: 't1',
        code: ITEM.code,
        item: ITEM.name,
        unit: ITEM.unit,
        available: null,
        quantity: '120',
        received: '120',
      },
      {
        id: 't2',
        code: '8600981000248',
        item: 'Vezivna žica 1,2 mm, 25 kg',
        unit: 'roll',
        available: null,
        quantity: '3',
        received: '3',
      },
    ],
  },
  {
    number: 'MP-2026-0028',
    date: '2026-10-02',
    from: 'central',
    to: 'site',
    state: 'Received',
    purpose: 'Floors 1–2: finishing the second floor',
    preparedBy: 'Goran Babić',
    sent: 'Sent 02.10.2026. 06:50 by Goran Babić',
    received: 'Received 02.10.2026. 09:05 by Snežana Popović',
    lines: [
      {
        id: 't1',
        code: ITEM.code,
        item: ITEM.name,
        unit: ITEM.unit,
        available: null,
        quantity: '160',
        received: '160',
      },
    ],
  },
]

/** What MP-2026-0031 looks like once sent (the application's record). */
export const SENT_NOTE = 'Sent 14.10.2026. 09:40 by Goran Babić'

/**
 * The application's check of a transfer's lines: a line asking for more than the source can give
 * (compared exactly, as decimal strings). A line still without an item or a quantity is not an
 * error yet; it only keeps the transfer from being sent (`transferIncomplete`).
 */
export function transferProblems(
  lines: readonly TransferLine[],
  compare: (a: string, b: string) => number,
  number: (value: string) => string,
): Record<string, { text: string; columns: string[] }> {
  const problems: Record<string, { text: string; columns: string[] }> = {}
  for (const line of lines) {
    if (line.quantity !== null && line.available !== null) {
      if (compare(line.quantity, line.available) > 0) {
        problems[line.id] = {
          text: `Only ${number(line.available)} ${line.unit} available in Central warehouse.`,
          columns: ['quantity'],
        }
      }
    }
  }
  return problems
}

/** A line without an item or a quantity above zero: the transfer cannot be sent yet. */
export function transferIncomplete(
  lines: readonly TransferLine[],
  compare: (a: string, b: string) => number,
): boolean {
  return lines.some(
    (line) => line.code === null || line.quantity === null || compare(line.quantity, '0') <= 0,
  )
}
