/*
 * The data of group D1's example screen (Phase 5, P5.18 and P5.19): Kvadrat Gradnja d.o.o.'s
 * catalogue (items with stock, services, fixed assets, and generated articles so it holds tens of
 * thousands of records) and the draft invoice to Bojović i sinovi d.o.o. whose lines are added by
 * search. Every amount is a decimal string computed here in whole paras (BigInt), never by hand:
 * line → subtotal → recap by tax category → total. Not part of the package. No classes here.
 */
import type {
  LookupKind,
  LookupOption,
  TaxCategory,
  TotalsRow,
  UnitOfMeasure,
  LineType,
} from '@veljaos/ui'
import {
  decimal as fromParas,
  toUnits,
} from '../../../../packages/ui/src/components/amounts-story-data'

// ── Lists from the Core ─────────────────────────────────────────────────────────────────────

/** Units of measure: the short name, its UN/ECE code stored (shared facts). */
export const UNITS: UnitOfMeasure[] = [
  { value: 'H87', label: 'pc' },
  { value: 'HUR', label: 'h' },
  { value: 'MTK', label: 'm²' },
  { value: 'MTQ', label: 'm³' },
  { value: 'KGM', label: 'kg' },
  { value: 'TNE', label: 't' },
  { value: 'MTR', label: 'm' },
  { value: 'LTR', label: 'l' },
  { value: 'KWH', label: 'kWh' },
  { value: 'MON', label: 'mo' },
  { value: 'LO', label: 'lot' },
]

/** Tax categories as the e-invoice system names them (illustrative). */
export const TAX_CATEGORIES: TaxCategory[] = [
  { value: 'S20', code: 'S', rate: '20' },
  { value: 'S10', code: 'S', rate: '10' },
  { value: 'AE', code: 'AE' },
  { value: 'E', code: 'E' },
  { value: 'O', code: 'O' },
  { value: 'Z', code: 'Z' },
]

/** Revenue accounts (illustrative), chosen by a one-off line. */
export const ACCOUNTS = [
  { value: '6120', label: '6120 Goods sold' },
  { value: '6140', label: '6140 Services' },
  { value: '6720', label: '6720 Fixed assets sold' },
  { value: '6790', label: '6790 Other income' },
]

export const KINDS: LookupKind[] = [
  { key: 'item', heading: 'Items', label: 'Item' },
  { key: 'service', heading: 'Services', label: 'Service' },
  { key: 'asset', heading: 'Fixed assets', label: 'Fixed asset' },
  { key: 'discount', heading: 'Discounts', label: 'Discount' },
]

export const ACCOUNT_OF: Record<string, string> = {
  item: '6120',
  service: '6140',
  asset: '6720',
  discount: '6120',
}

// ── The catalogue ───────────────────────────────────────────────────────────────────────────

/** A catalogue record with what a line takes from it. */
export interface CatalogueRecord extends LookupOption {
  kind: 'item' | 'service' | 'asset' | 'discount'
  unit: string
  /** Unit price without VAT, RSD, a decimal string. */
  price: string
  taxCategory: string
  /** Items: in stock, a decimal string. */
  stock?: string
  /** Fixed assets: the asset number and the book value (internal: never on the customer's PDF). */
  assetNumber?: string
  bookValue?: string
}

const NAMED: CatalogueRecord[] = [
  {
    value: 'ART-0204',
    label: 'Cement CEM II 42,5 R, 25 kg',
    kind: 'item',
    description: 'ART-0204 · Magacin Novi Sad',
    detail: '1.180 pc in stock',
    unit: 'H87',
    price: '685.00',
    taxCategory: 'S20',
    stock: '1180',
  },
  {
    value: 'ART-0112',
    label: 'Armaturna mreža Q188, 2,15 × 6 m',
    kind: 'item',
    description: 'ART-0112 · Magacin Novi Sad',
    detail: '240 pc in stock',
    unit: 'H87',
    price: '2940.00',
    taxCategory: 'S20',
    stock: '240',
  },
  {
    value: 'ART-0118',
    label: 'Armatura B500B Ø12, 12 m',
    kind: 'item',
    description: 'ART-0118 · Magacin Novi Sad',
    detail: '36 pc in stock',
    unit: 'H87',
    price: '1185.40',
    taxCategory: 'S20',
    stock: '36',
  },
  {
    value: 'ART-0311',
    label: 'Blok opekarski 25 × 19 × 19 cm',
    kind: 'item',
    description: 'ART-0311 · Magacin Temerin',
    detail: '4.620 pc in stock',
    unit: 'H87',
    price: '96.80',
    taxCategory: 'S20',
    stock: '4620',
  },
  {
    value: 'ART-0420',
    label: 'Hidroizolaciona traka, 10 m',
    kind: 'item',
    description: 'ART-0420 · Magacin Novi Sad',
    detail: '18 pc in stock',
    unit: 'H87',
    price: '3420.00',
    taxCategory: 'S20',
    stock: '18',
  },
  {
    value: 'USL-014',
    label: 'Montaža armature',
    kind: 'service',
    description: 'USL-014 · per hour',
    unit: 'HUR',
    price: '2850.00',
    taxCategory: 'S20',
  },
  {
    value: 'USL-021',
    label: 'Prevoz kamionom do 10 t',
    kind: 'service',
    description: 'USL-021 · per trip',
    unit: 'H87',
    price: '14500.00',
    taxCategory: 'S20',
  },
  {
    value: 'USL-033',
    label: 'Iskop zemlje mašinski',
    kind: 'service',
    description: 'USL-033 · per m³',
    unit: 'MTQ',
    price: '1260.00',
    taxCategory: 'S20',
  },
  {
    value: 'USL-040',
    label: 'Izrada tehničke dokumentacije',
    kind: 'service',
    description: 'USL-040 · per set',
    unit: 'LO',
    price: '42500.00',
    taxCategory: 'S10',
  },
  {
    value: 'OS-0047',
    label: 'Savijačica armature Sima CEL-32',
    kind: 'asset',
    description: 'OS-0047 · in use since 2019',
    detail: 'OS-0047',
    unit: 'H87',
    price: '186000.00',
    taxCategory: 'S20',
    assetNumber: 'OS-0047',
    bookValue: '41320.55',
  },
  {
    value: 'OS-0112',
    label: 'Mešalica za beton 350 l',
    kind: 'asset',
    description: 'OS-0112 · in use since 2021',
    detail: 'OS-0112',
    unit: 'H87',
    price: '64800.00',
    taxCategory: 'S20',
    assetNumber: 'OS-0112',
    bookValue: '29160.00',
  },
  {
    value: 'POP-05',
    label: 'Popust 5% na materijal',
    kind: 'discount',
    description: 'POP-05 · agreed with the customer',
    unit: 'H87',
    price: '0.00',
    taxCategory: 'S20',
  },
]

const MATERIALS = [
  'Armatura B500B',
  'Blok opekarski',
  'Crep glineni',
  'Daska jelova',
  'Fasadna boja',
  'Gips ploča',
  'Kamena vuna',
  'Keramičke pločice',
  'Lepak za pločice',
  'Malter produžni',
  'Metalni profil',
  'OSB ploča',
  'PVC cev',
  'Stiropor EPS',
  'Žica paljena',
]
const SIZES = ['Ø6', 'Ø8', 'Ø10', 'Ø12', 'Ø16', '5 cm', '8 cm', '10 cm']
const GRADES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
const PACKS = ['1 kg', '5 kg', '10 kg', '25 kg', '1 m', '2 m', '3 m', '6 m', '12 m', '50 kg']
const STORES = ['Magacin Novi Sad', 'Magacin Temerin', 'Magacin Zrenjanin']

/** 12,000 generated articles: every material in every size, grade and pack. */
function generated(): CatalogueRecord[] {
  const list: CatalogueRecord[] = []
  let number = 1000
  for (const material of MATERIALS) {
    for (const size of SIZES) {
      for (const grade of GRADES) {
        for (const pack of PACKS) {
          number += 1
          const code = `ART-${String(number)}`
          const stock = String((number * 37) % 900)
          const paras = 10000n + ((BigInt(number) * 7919n) % 900000n)
          list.push({
            value: code,
            label: `${material} ${size}, klasa ${grade}, ${pack}`,
            kind: 'item',
            description: `${code} · ${STORES[number % STORES.length] ?? ''}`,
            detail: `${stock} pc in stock`,
            unit: 'H87',
            price: fromParas(paras),
            taxCategory: 'S20',
            stock,
          })
        }
      }
    }
  }
  return list
}

/** Kvadrat Gradnja's catalogue: 12 named records and 12,000 generated articles. */
export const CATALOGUE: CatalogueRecord[] = [...NAMED, ...generated()]

const BY_VALUE = new Map(CATALOGUE.map((record) => [record.value, record]))

export function recordOf(value: string): CatalogueRecord | undefined {
  return BY_VALUE.get(value)
}

function fold(text: string): string {
  return text
    .toLocaleLowerCase('sr-Latn')
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/đ/g, 'dj')
}

const FOLDED = CATALOGUE.map((record) =>
  fold(`${record.label} ${record.value} ${record.description ?? ''}`),
)

/** The Core's full search ("Search all…"): every record whose name, code or line has every word. */
export function findInCatalogue(query: string): CatalogueRecord[] {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return CATALOGUE
  return CATALOGUE.filter((_, index) =>
    words.every((word) => FOLDED[index]?.includes(word) === true),
  )
}

/**
 * The Core's search, played here: every word typed must appear in the name, the code or the
 * second line; the first eight records of each kind.
 */
export function searchCatalogue(query: string, perKind = 8): CatalogueRecord[] {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const counts = new Map<string, number>()
  const found: CatalogueRecord[] = []
  CATALOGUE.forEach((record, index) => {
    const used = counts.get(record.kind) ?? 0
    if (used >= perKind) return
    if (!words.every((word) => FOLDED[index]?.includes(word) === true)) return
    counts.set(record.kind, used + 1)
    found.push(record)
  })
  return found
}

/** What Milica used lately (shown while nothing is typed). */
export const RECENT: CatalogueRecord[] = ['ART-0204', 'USL-021', 'ART-0112'].flatMap((value) => {
  const record = recordOf(value)
  return record === undefined ? [] : [record]
})

/** The service the walk-through creates with "+ Create service …". */
export const NEW_SERVICE = {
  value: 'USL-102',
  name: 'Montaža skele',
  unit: 'HUR',
  price: '1850.00',
  taxCategory: 'S20',
}

// ── Arithmetic in whole paras ───────────────────────────────────────────────────────────────

/** quantity × price to the para, half away from zero (the Core's rounding of a line). */
export { fromParas, toUnits }

export function lineParas(quantity: string, price: string): bigint {
  const product = toUnits(quantity, 3) * toUnits(price, 2)
  const half = product < 0n ? -500n : 500n
  return (product + half) / 1000n
}

/** VAT on a base at a rate (percent, decimal string), to the para, half up. */
function vatParas(base: bigint, rate: string): bigint {
  const product = base * toUnits(rate, 2)
  const half = product < 0n ? -5000n : 5000n
  return (product + half) / 10000n
}

// ── The draft invoice to Bojović i sinovi (lines by search) ───────────────────────────────────

export const DRAFT = {
  number: 'F-2026-0419',
  customer: 'Bojović i sinovi d.o.o.',
  taxId: '109773148',
  address: 'Kralja Petra I 31, 11300 Smederevo',
  issued: '2026-10-06',
  /** The date of supply (datum prometa): the goods delivered and the work done. */
  supplied: '2026-10-06',
  due: '2026-10-21',
  /** The place of issue: Kvadrat Gradnja d.o.o.'s seat. */
  place: 'Novi Sad',
}

export interface DraftLine {
  id: string
  type: LineType
  /** A heading's or a text line's text; a subtotal's label. */
  text: string
  item: LookupOption | null
  quantity: string | null
  unit: string
  price: string | null
  /** The line's discount in percent (a decimal string), or null: none. */
  discount: string | null
  tax: string
  account: string
}

let lineNumber = 0
export function newLine(type: LineType = 'line', extra: Partial<DraftLine> = {}): DraftLine {
  lineNumber += 1
  return {
    id: `d1-${String(lineNumber)}`,
    type,
    text: '',
    item: null,
    quantity: type === 'line' ? null : '1',
    unit: 'H87',
    price: null,
    discount: null,
    tax: 'S20',
    account: '',
    ...extra,
  }
}

/** A line filled from a catalogue record, as the Core fills it. */
export function fromRecord(line: DraftLine, option: LookupOption | null): DraftLine {
  if (option === null) return { ...line, item: null }
  if (option.oneOff === true) return { ...line, item: option, account: '' }
  if (option.value === NEW_SERVICE.value) {
    return {
      ...line,
      item: option,
      unit: NEW_SERVICE.unit,
      price: NEW_SERVICE.price,
      tax: NEW_SERVICE.taxCategory,
      account: ACCOUNT_OF.service ?? '',
    }
  }
  const record = recordOf(option.value)
  if (record === undefined) return { ...line, item: option }
  return {
    ...line,
    item: record,
    unit: record.unit,
    price: record.kind === 'discount' ? line.price : record.price,
    tax: record.taxCategory,
    account: ACCOUNT_OF[record.kind] ?? '',
  }
}

function recordLine(value: string, quantity: string): DraftLine {
  return fromRecord(newLine('line', { quantity }), recordOf(value) ?? null)
}

/**
 * The draft as Milica left it (P5.90 item 4, simple by default): plain lines only — the cement
 * and the armature (more than the 36 pc in stock), a fixed asset sold with the materials, three
 * services at S 20% and S 10% — and an empty line at the end, where the walk-through searches.
 * No line has a discount, so the grid shows no discount column; section headings, text lines,
 * discount lines and a line's discount are a choice of "Add line ▾".
 */
export function initialDraft(): DraftLine[] {
  return [
    recordLine('ART-0204', '40'),
    recordLine('ART-0118', '44'),
    recordLine('OS-0112', '1'),
    recordLine('USL-014', '16'),
    recordLine('USL-021', '2'),
    recordLine('USL-040', '1'),
    newLine(),
  ]
}

/**
 * The line's amount in paras, or null while it has no quantity or price: quantity × price, less
 * the line's discount (its percent of that, to the para, half up).
 */
export function draftLineParas(line: DraftLine): bigint | null {
  if (line.type === 'heading' || line.type === 'text' || line.type === 'subtotal') return null
  if (line.quantity === null || line.price === null) return null
  const base = lineParas(line.quantity, line.price)
  return line.discount === null ? base : base - vatParas(base, line.discount)
}

/** Each subtotal's amount: the lines since the heading before it. */
export function draftSubtotals(lines: readonly DraftLine[]): Map<string, bigint> {
  const result = new Map<string, bigint>()
  let running = 0n
  for (const line of lines) {
    if (line.type === 'heading') running = 0n
    else if (line.type === 'subtotal') result.set(line.id, running)
    else running += draftLineParas(line) ?? 0n
  }
  return result
}

/** The line amount shown in the grid (a subtotal's from its section). */
export function draftAmount(line: DraftLine, subtotals: Map<string, bigint>): string | null {
  if (line.type === 'subtotal') return fromParas(subtotals.get(line.id) ?? 0n)
  const paras = draftLineParas(line)
  return paras === null ? null : fromParas(paras)
}

/** The recap by tax category, the total without VAT and the invoice total: what the Core sends. */
export function draftTotals(lines: readonly DraftLine[]): {
  rows: TotalsRow[]
  total: TotalsRow
  net: string
} {
  const rows: TotalsRow[] = []
  let net = 0n
  let total = 0n
  for (const category of TAX_CATEGORIES) {
    const base = lines
      .filter((line) => line.tax === category.value)
      .reduce((sum, line) => sum + (draftLineParas(line) ?? 0n), 0n)
    if (base === 0n) continue
    const label = category.rate === undefined ? category.code : `${category.code} ${category.rate}%`
    const vat = category.rate === undefined ? 0n : vatParas(base, category.rate)
    net += base
    total += base + vat
    rows.push({
      key: `base-${category.value}`,
      label: `Tax base ${label}`,
      value: fromParas(base),
      currency: 'RSD',
      ...(rows.length > 0 ? { group: true } : {}),
    })
    rows.push({
      key: `vat-${category.value}`,
      label: `VAT ${label}`,
      value: fromParas(vat),
      currency: 'RSD',
    })
  }
  return {
    rows,
    total: { key: 'total', label: 'Invoice total', value: fromParas(total), currency: 'RSD' },
    net: fromParas(net),
  }
}
