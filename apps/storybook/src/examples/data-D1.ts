/*
 * The data of group D1's example screens (Phase 5, P5.18 and P5.19): Kvadrat Gradnja d.o.o.'s
 * catalogue (items with stock, services, fixed assets, and generated articles so it holds tens of
 * thousands of records), the draft invoice to Bojović i sinovi d.o.o. whose lines are added by
 * search, and the specification of works of the interim situation IS-2026-007. Every amount is a
 * decimal string computed here in whole paras (BigInt), never by hand: line → subtotal → recap
 * by tax category → total. Not part of the package. No classes here.
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
  due: '2026-10-21',
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
 * The draft as Milica left it: two sections with their subtotals, a text line, a fixed asset sold
 * with the materials, a 5% discount on the cement and the armature (computed here: 5% of their
 * 79.557,60 RSD is −3.977,88 RSD), mixed S 20% and S 10%, and an empty line at the end, where the
 * walk-through searches.
 */
export function initialDraft(): DraftLine[] {
  const materials = lineParas('40', '685.00') + lineParas('44', '1185.40')
  const discount = fromParas(-vatParas(materials, '5'))
  return [
    newLine('heading', { text: '1. Materials' }),
    recordLine('ART-0204', '40'),
    recordLine('ART-0118', '44'),
    recordLine('OS-0112', '1'),
    newLine('text', {
      text: 'Delivery to the site in Smederevo, Kralja Petra I 31, on 9 October.',
    }),
    newLine('subtotal', { text: 'Subtotal 1. Materials' }),
    newLine('heading', { text: '2. Services' }),
    recordLine('USL-014', '16'),
    recordLine('USL-021', '2'),
    recordLine('USL-040', '1'),
    newLine('subtotal', { text: 'Subtotal 2. Services' }),
    fromRecord(newLine('discount', { quantity: '1', price: discount }), recordOf('POP-05') ?? null),
    newLine(),
  ]
}

/** The line's amount in paras, or null while it has no quantity or price. */
export function draftLineParas(line: DraftLine): bigint | null {
  if (line.type === 'heading' || line.type === 'text' || line.type === 'subtotal') return null
  if (line.quantity === null || line.price === null) return null
  return lineParas(line.quantity, line.price)
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

// ── IS-2026-007: the specification of works (the recipe shared with group D2) ────────────────

export const SITUATION = {
  number: 'IS-2026-007',
  customer: 'Vojvođanka Mlin a.d.',
  taxId: '100421987',
  address: 'Industrijska 4, 23000 Zrenjanin',
  contract: '12/2026',
  site: 'Hall B extension, Temerinski put 51',
  period: 'September 2026',
}

export const SPEC_GROUPS = [
  '1. Preparatory works',
  '2. Earthworks',
  '3. Concrete works',
  '4. Masonry',
  '5. Steel structure',
  '6. Roofing',
  '7. Facade',
  '8. Carpentry',
  '9. Plumbing',
  '10. Electrical installation',
  '11. Floors',
  '12. Finishing works',
]

/** One row of the specification: a group heading, a position, or a group's subtotal. */
export interface SpecRow {
  id: string
  type: LineType
  /** The group (1-based). */
  group: number
  /** The position within the group (1-based); 0 for a heading or a subtotal. */
  position: number
  /** "3.12 Concrete works, position 12"; the heading's or the subtotal's text. */
  text: string
  /** Contracted quantity, a decimal string. */
  quantity: string | null
  /** "MTK" (m²) for odd positions, "H87" (pc) for even ones. */
  unit: string
  /** Unit price, a decimal string with paras. */
  price: string | null
  tax: string
  /** Quantity done in earlier periods. */
  previous: string
  /** Quantity done this period (what this situation bills). */
  current: string | null
}

/**
 * The specification of IS-2026-007, generated with the recipe both groups share: 12 groups of 25
 * positions; position i of group g has quantity ((g·7 + i·3) mod 40) + 1, in m² for odd i and pc
 * for even i; unit price 50000 + ((g·1301 + i·977) mod 950000) paras; the previous share
 * (i mod 3)·25 % of the quantity and this period ((i + g) mod 2)·25 %, each rounded down to whole
 * units; amounts quantity × price exactly; every position S 20%.
 */
export function specificationOf(): SpecRow[] {
  const rows: SpecRow[] = []
  SPEC_GROUPS.forEach((title, index) => {
    const g = index + 1
    const name = title.replace(/^\d+\.\s*/, '')
    rows.push({
      id: `g${String(g)}`,
      type: 'heading',
      group: g,
      position: 0,
      text: title,
      quantity: null,
      unit: 'H87',
      price: null,
      tax: 'S20',
      previous: '0',
      current: null,
    })
    for (let i = 1; i <= 25; i += 1) {
      const quantity = ((g * 7 + i * 3) % 40) + 1
      const price = 50000n + ((BigInt(g) * 1301n + BigInt(i) * 977n) % 950000n)
      rows.push({
        id: `p${String(g)}-${String(i)}`,
        type: 'line',
        group: g,
        position: i,
        text: `${String(g)}.${String(i)} ${name}, position ${String(i)}`,
        quantity: String(quantity),
        unit: i % 2 === 1 ? 'MTK' : 'H87',
        price: fromParas(price),
        tax: 'S20',
        previous: String(Math.floor((quantity * (i % 3) * 25) / 100)),
        current: String(Math.floor((quantity * ((i + g) % 2) * 25) / 100)),
      })
    }
    rows.push({
      id: `s${String(g)}`,
      type: 'subtotal',
      group: g,
      position: 0,
      text: `Subtotal ${title}`,
      quantity: null,
      unit: 'H87',
      price: null,
      tax: 'S20',
      previous: '0',
      current: null,
    })
  })
  return rows
}

/** A position's contracted amount and this period's amount, in paras. */
export function specAmounts(row: SpecRow): { contract: bigint; current: bigint } | null {
  if (row.type !== 'line' || row.price === null) return null
  return {
    contract: row.quantity === null ? 0n : lineParas(row.quantity, row.price),
    current: row.current === null ? 0n : lineParas(row.current, row.price),
  }
}

/** Quantities added, without trailing zeros ("12", "12.5"). */
export function addQuantities(a: string, b: string | null): string {
  const sum = toUnits(a, 3) + toUnits(b ?? '0', 3)
  const negative = sum < 0n
  const digits = (negative ? -sum : sum).toString().padStart(4, '0')
  const fraction = digits.slice(-3).replace(/0+$/, '')
  return `${negative ? '-' : ''}${digits.slice(0, -3)}${fraction === '' ? '' : `.${fraction}`}`
}

/** Each group's subtotals (contract and this period) and the specification's totals. */
export function specTotals(rows: readonly SpecRow[]): {
  groups: Map<string, { contract: bigint; current: bigint }>
  contract: bigint
  current: bigint
  positions: number
  recap: { rows: TotalsRow[]; total: TotalsRow }
} {
  const groups = new Map<string, { contract: bigint; current: bigint }>()
  let contract = 0n
  let current = 0n
  let positions = 0
  let running = { contract: 0n, current: 0n }
  for (const row of rows) {
    if (row.type === 'heading') running = { contract: 0n, current: 0n }
    else if (row.type === 'subtotal') groups.set(row.id, running)
    else {
      const amounts = specAmounts(row)
      if (amounts === null) continue
      positions += 1
      running = {
        contract: running.contract + amounts.contract,
        current: running.current + amounts.current,
      }
      contract += amounts.contract
      current += amounts.current
    }
  }
  const vat = vatParas(current, '20')
  return {
    groups,
    contract,
    current,
    positions,
    recap: {
      rows: [
        { key: 'base', label: 'Tax base S 20%', value: fromParas(current), currency: 'RSD' },
        { key: 'vat', label: 'VAT S 20%', value: fromParas(vat), currency: 'RSD' },
      ],
      total: {
        key: 'total',
        label: 'This situation, total',
        value: fromParas(current + vat),
        currency: 'RSD',
      },
    },
  }
}
