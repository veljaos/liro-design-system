import type { TaxCategory, UnitOfMeasure } from './line-types'
import type { LookupKind, LookupOption } from './lookup-logic'

/*
 * A catalogue for the LookupField and EditableGrid stories (P5.18, P5.19): the items, services and
 * fixed assets of a construction-materials trader — fictitious, realistic Serbian names, codes and
 * stock — plus generated articles, so the catalogue holds tens of thousands of records as the
 * Core's would. The search plays the application's server. Not part of the package: nothing in
 * src/index.ts imports this file. No classes here.
 */

export const KINDS: LookupKind[] = [
  { key: 'item', heading: 'Items', label: 'Item' },
  { key: 'service', heading: 'Services', label: 'Service' },
  { key: 'asset', heading: 'Fixed assets', label: 'Fixed asset' },
]

/** Units of measure from the Core: the short name, its UN/ECE code stored. */
export const UNITS: UnitOfMeasure[] = [
  { value: 'H87', label: 'pc' },
  { value: 'HUR', label: 'h' },
  { value: 'MTK', label: 'm²' },
  { value: 'MTQ', label: 'm³' },
  { value: 'KGM', label: 'kg' },
  { value: 'TNE', label: 't' },
  { value: 'MTR', label: 'm' },
  { value: 'LO', label: 'lot' },
]

/** Tax categories from the Core, as the e-invoice system names them (illustrative). */
export const TAX_CATEGORIES: TaxCategory[] = [
  { value: 'S20', code: 'S', rate: '20' },
  { value: 'S10', code: 'S', rate: '10' },
  { value: 'AE', code: 'AE' },
  { value: 'E', code: 'E' },
  { value: 'O', code: 'O' },
]

/** A record with what a line needs from it (price, unit, tax category; stock for items). */
export interface CatalogueRecord extends LookupOption {
  kind: 'item' | 'service' | 'asset'
  unit: string
  /** The unit price as a decimal string (RSD). */
  price: string
  taxCategory: string
  /** Items: the quantity in stock, a decimal string. */
  stock?: string
  /** Fixed assets: the asset number and the book value (internal). */
  assetNumber?: string
  bookValue?: string
}

const NAMED: CatalogueRecord[] = [
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
]

const MATERIALS = [
  'Armatura B500B',
  'Blok opekarski',
  'Crep glineni',
  'Daska jelova',
  'Fasadna boja',
  'Gips ploča',
  'Hidroizolacija',
  'Kamena vuna',
  'Keramičke pločice',
  'Lepak za pločice',
  'Malter produžni',
  'Metalni profil',
  'OSB ploča',
  'Pesak rečni',
  'PVC cev',
  'Šljunak separisani',
  'Stiropor EPS',
  'Šraf za drvo',
  'Tegola bitumenska',
  'Žica paljena',
]
const SIZES = ['Ø6', 'Ø8', 'Ø10', 'Ø12', 'Ø16', '5 cm', '8 cm', '10 cm', '12 cm', '15 cm']
const GRADES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
const PACKS = ['1 kg', '5 kg', '10 kg', '25 kg', '50 kg', '1 m', '2 m', '3 m', '6 m', '12 m']
const STORES = ['Magacin Novi Sad', 'Magacin Temerin', 'Magacin Zrenjanin']

/** 20,000 generated articles: every material in every size, grade and pack. */
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
          list.push({
            value: code,
            label: `${material} ${size}, klasa ${grade}, ${pack}`,
            kind: 'item',
            description: `${code} · ${STORES[number % STORES.length] ?? ''}`,
            detail: `${stock} pc in stock`,
            unit: 'H87',
            price: `${String(100 + ((number * 7919) % 9000))}.${String((number * 13) % 100).padStart(2, '0')}`,
            taxCategory: 'S20',
            stock,
          })
        }
      }
    }
  }
  return list
}

/** The whole catalogue: the named records first, then the generated articles. */
export const CATALOGUE: CatalogueRecord[] = [...NAMED, ...generated()]

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
 * The application's search: every word typed must appear in the name, the code or the second
 * line; at most `perKind` records of each kind, as a server would answer with its first page.
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

const BY_VALUE = new Map(CATALOGUE.map((record) => [record.value, record]))

export function recordOf(value: string): CatalogueRecord | undefined {
  return BY_VALUE.get(value)
}

/** Records the user picked lately, the latest first (shown while nothing is typed). */
export const RECENT: CatalogueRecord[] = ['ART-0204', 'USL-021', 'ART-0112'].flatMap((value) => {
  const record = recordOf(value)
  return record === undefined ? [] : [record]
})
