import { AY_ROUTES, ITEM } from './data-AY'
import { U_ROUTES } from './data-U'

/*
 * Group BT's data (P5.79, merging duplicates): Kvadrat Gradnja d.o.o.'s possible duplicates on
 * 14 October 2026 at 09:40, as Milica Petrović sees them. Everything is the application's: which
 * records look alike and why, which values differ, the values it preselects, what a merge moves
 * (the counts), the confirmation's code and the result. Invented.
 */

export const BT_TODAY = '2026-10-14'

const PAIR_PATH = (kind: 'partners' | 'items', id: string) =>
  `/master-data/duplicates/${kind}/${id}`

export const BT_ROUTES = {
  duplicates: '/master-data/duplicates',
  /** The duplicates already merged. */
  merged: '/master-data/duplicates?view=merged',
  partners: PAIR_PATH('partners', 'BMX'),
  /** Every value chosen: Merge is available. */
  partnersReady: `${PAIR_PATH('partners', 'BMX')}?ready`,
  /** The merge asked: the irreversible confirmation. */
  partnersConfirm: `${PAIR_PATH('partners', 'BMX')}?confirm`,
  /** The newer record chosen to stay: what would move then. */
  partnersOther: `${PAIR_PATH('partners', 'BMX')}?keep=second`,
  partnerMerged: '/partners/P-00112?merged',
  items: PAIR_PATH('items', 'CEM'),
  itemsConfirm: `${PAIR_PATH('items', 'CEM')}?confirm`,
  itemMerged: `/master-data/items/${ITEM.code}?merged`,
}

export type BtState = 'To review' | 'Merged' | 'Not duplicates'

/** One of the two records. */
export interface BtRecord {
  code: string
  name: string
  /** A second line: tax number or barcode, where it came from. */
  subtitle: string
  /** Why the application proposes it to stay, in its words. */
  reason: string
  /** The figure the choice depends on ("48 documents"). */
  figure: string
}

/** A field of the two records: its values, and whether the application says they differ. */
export interface BtField {
  id: string
  label: string
  values: readonly [string | null, string | null]
  differs?: boolean
  note?: string
}

/** What a merge does, in the application's words and counts. */
export interface BtEffect {
  label: string
  value: string
}

/** A document that moves to the kept record, as a link. */
export interface BtMoved {
  key: string
  type: string
  number: string
  path?: string
  status: string
}

/** A pair of records the application found alike. */
export interface BtPair {
  id: string
  kind: 'Partner' | 'Item'
  records: readonly [BtRecord, BtRecord]
  /** Why the application thinks they are one ("Same PIB 106543218"). */
  reason: string
  found: string
  state: BtState
  /** When decided: by whom and when. */
  decided?: string
  /** The two records' fields; only some pairs open in the examples. */
  fields?: readonly BtField[]
  /** The values the application preselects, for each record staying (row id → source index). */
  preselected?: readonly [Record<string, number>, Record<string, number>]
  /** What happens, for each record staying. */
  effects?: readonly [readonly BtEffect[], readonly BtEffect[]]
  /** The documents moving to the kept record (the first one staying). */
  moved?: readonly BtMoved[]
  path?: string
  resultPath?: string
}

const BETON_FIELDS: BtField[] = [
  { id: 'name', label: 'Name', values: ['Beton Mix d.o.o.', 'Beton-Mix doo'], differs: true },
  { id: 'pib', label: 'PIB', values: ['106543218', '106543218'] },
  { id: 'mb', label: 'Company number', values: ['20845512', '20845512'] },
  {
    id: 'address',
    label: 'Address',
    values: ['Industrijska zona bb, 21000 Novi Sad', 'Industrijska zona b.b., Novi Sad'],
    differs: true,
  },
  {
    id: 'email',
    label: 'E-mail for invoices',
    values: ['racuni@betonmix.example.com', 'office@betonmix.example.com'],
    differs: true,
  },
  { id: 'phone', label: 'Phone', values: ['+381 21 555 0142', null], differs: true },
  {
    id: 'bank',
    label: 'Bank accounts',
    values: ['160-0000000456789-12 (illustrative)', '205-0000000123456-77 (illustrative)'],
    note: 'Both accounts are kept',
  },
  { id: 'terms', label: 'Payment terms', values: ['30 days', '15 days'], differs: true },
]

const CEMENT_FIELDS: BtField[] = [
  {
    id: 'name',
    label: 'Name',
    values: [ITEM.name, 'Cement PC 20M 42,5R vreća 25kg'],
    differs: true,
  },
  { id: 'code', label: 'Code', values: [ITEM.code, 'CEM-25-S'], differs: true },
  { id: 'barcode', label: 'Barcode', values: [ITEM.code, ITEM.code] },
  {
    id: 'unit',
    label: 'Unit',
    values: ['bag', 'piece'],
    differs: true,
    note: 'Counted one to one: 1 piece is 1 bag',
  },
  {
    id: 'group',
    label: 'Item group',
    values: [ITEM.group, 'Building materials'],
    differs: true,
  },
  { id: 'vat', label: 'VAT', values: ['20%', '20%'] },
  { id: 'supplier', label: 'Supplier', values: [ITEM.supplier, ITEM.supplier] },
  { id: 'minimum', label: 'Minimum stock', values: ['150 bags', null], differs: true },
]

export const BT_PAIRS: BtPair[] = [
  {
    id: 'BMX',
    kind: 'Partner',
    records: [
      {
        code: 'P-00112',
        name: 'Beton Mix d.o.o.',
        subtitle: 'P-00112 · PIB 106543218 · supplier since 2019',
        reason: 'The older record, used on every order and payment',
        figure: '48 documents',
      },
      {
        code: 'P-00431',
        name: 'Beton-Mix doo',
        subtitle: 'P-00431 · PIB 106543218 · created 12.10.2026 by the document inbox',
        reason: 'Created from invoice 2026-1187 when no partner matched its name',
        figure: '1 document',
      },
    ],
    reason: 'Same PIB 106543218',
    found: '2026-10-12',
    state: 'To review',
    fields: BETON_FIELDS,
    preselected: [
      { name: 0, address: 0, phone: 0, terms: 0 },
      { name: 1, address: 1, phone: 0, terms: 1 },
    ],
    effects: [
      [
        { label: 'Documents moved to Beton Mix d.o.o.', value: '1: invoice 2026-1187' },
        { label: 'Open items moved', value: '1, 294.000,00 RSD' },
        { label: 'Bank accounts', value: '2, both kept' },
        {
          label: 'Document inbox',
          value: 'Invoices with PIB 106543218 are matched to Beton Mix d.o.o.',
        },
        { label: 'Beton-Mix doo (P-00431)', value: 'Closed; its code leads to Beton Mix d.o.o.' },
      ],
      [
        {
          label: 'Documents moved to Beton-Mix doo',
          value: '48: orders, receipts, invoices, payments',
        },
        { label: 'Open items moved', value: '3, 1.284.600,00 RSD' },
        { label: 'Bank accounts', value: '2, both kept' },
        {
          label: 'Printouts',
          value: 'Documents printed again show the name Beton-Mix doo.',
        },
        { label: 'Beton Mix d.o.o. (P-00112)', value: 'Closed; its code leads to Beton-Mix doo' },
      ],
    ],
    moved: [
      {
        key: 'invoice',
        type: 'Supplier invoice',
        number: '2026-1187',
        path: U_ROUTES.reviewOf('u1'),
        status: 'Needs review',
      },
    ],
    path: BT_ROUTES.partners,
    resultPath: BT_ROUTES.partnerMerged,
  },
  {
    id: 'STP',
    kind: 'Partner',
    records: [
      {
        code: 'P-00087',
        name: 'Stanogradnja Plus d.o.o.',
        subtitle: 'PIB 108990341',
        reason: '',
        figure: '',
      },
      {
        code: 'P-00418',
        name: 'Stanogradnja plus doo',
        subtitle: 'PIB 108990341',
        reason: '',
        figure: '',
      },
    ],
    reason: 'Same PIB 108990341',
    found: '2026-10-07',
    state: 'To review',
  },
  {
    id: 'CEM',
    kind: 'Item',
    records: [
      {
        code: ITEM.code,
        name: ITEM.name,
        subtitle: `${ITEM.code} · ${ITEM.group} · bag`,
        reason: 'Used in the central warehouse, the price lists and every order',
        figure: '412 bags in stock',
      },
      {
        code: 'CEM-25-S',
        name: 'Cement PC 20M 42,5R vreća 25kg',
        subtitle: 'CEM-25-S · created 03.10.2026 at Site Liman 4 · piece',
        reason: 'Created at the site for a receipt',
        figure: '40 pieces in stock',
      },
    ],
    reason: 'Same barcode 8600981000101',
    found: '2026-10-04',
    state: 'To review',
    fields: CEMENT_FIELDS,
    preselected: [
      { name: 0, code: 0, unit: 0, group: 0, minimum: 0 },
      { name: 1, code: 1, unit: 1, group: 0, minimum: 0 },
    ],
    effects: [
      [
        { label: 'Stock moved', value: '40 bags at Site Liman 4' },
        { label: 'Documents moved', value: '6: receipts and issues at Site Liman 4' },
        { label: 'Price lists', value: 'The kept item’s prices stay; CEM-25-S has none' },
        { label: 'CEM-25-S', value: 'Closed; scanning its code finds the kept item' },
      ],
      [
        { label: 'Stock moved', value: '412 bags as pieces, in both warehouses' },
        { label: 'Documents moved', value: '64: receipts, issues, transfers, stocktaking' },
        { label: 'Price lists', value: '3 prices move to CEM-25-S' },
        { label: ITEM.code, value: 'Closed; scanning its code finds the kept item' },
      ],
    ],
    moved: [
      {
        key: 'pri',
        type: 'Goods receipt',
        number: 'PRI-2026-0198',
        path: AY_ROUTES.itemSite,
        status: 'Posted',
      },
      {
        key: 'iz',
        type: 'Issue to site',
        number: 'IZ-2026-0441',
        path: AY_ROUTES.itemSite,
        status: 'Posted',
      },
    ],
    path: BT_ROUTES.items,
    resultPath: BT_ROUTES.itemMerged,
  },
  {
    id: 'ARM',
    kind: 'Item',
    records: [
      {
        code: '3830012004412',
        name: 'Rebar B500B Ø12, 12 m',
        subtitle: '',
        reason: '',
        figure: '',
      },
      { code: 'ARM-12', name: 'Rebar B500B 12 mm', subtitle: '', reason: '', figure: '' },
    ],
    reason: 'Same supplier code 12-B500B',
    found: '2026-10-02',
    state: 'To review',
  },
  {
    id: 'ELS',
    kind: 'Partner',
    records: [
      { code: 'P-00064', name: 'Elektro Sistem d.o.o.', subtitle: '', reason: '', figure: '' },
      { code: 'P-00377', name: 'Elektro-Sistem Novi Sad', subtitle: '', reason: '', figure: '' },
    ],
    reason: 'Similar name and address',
    found: '2026-09-28',
    state: 'Not duplicates',
    decided: 'Different PIB; marked 05.10.2026. by Milica Petrović',
  },
  {
    id: 'GTN',
    kind: 'Partner',
    records: [
      { code: 'P-00031', name: 'Gradska toplana Novi Sad', subtitle: '', reason: '', figure: '' },
      { code: 'P-00402', name: 'JKP Gradska toplana', subtitle: '', reason: '', figure: '' },
    ],
    reason: 'Same PIB 101234870',
    found: '2026-09-25',
    state: 'Merged',
    decided: 'Merged 02.10.2026. by Milica Petrović into P-00031',
  },
]

export const BT_VIEWS = [
  { id: 'review', label: 'To review', states: ['To review'] },
  { id: 'merged', label: 'Merged', states: ['Merged'] },
  { id: 'not', label: 'Not duplicates', states: ['Not duplicates'] },
  { id: 'all', label: 'All', states: ['To review', 'Merged', 'Not duplicates'] },
] as const

/** The merge in the history of the kept record. */
export const BT_MERGED_AT = '14.10.2026. 09:40'
