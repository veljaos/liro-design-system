/*
 * Story data for the catalogue components (P5.19): customers of Kvadrat Gradnja d.o.o.,
 * generated repeatably, and a search that plays the application (the components never search).
 * Not part of the package: nothing in src/index.ts imports this file. No classes here.
 */

import { toUnits } from './amounts-story-data'
import type { DataTableSort } from './data-table-logic'

export interface StoryCustomer {
  id: string
  name: string
  taxId: string
  city: string
  /** Open balance in RSD, a decimal string. */
  balance: string
  active: boolean
}

/** The dataset's customers (P4.8), first. */
const KNOWN: StoryCustomer[] = [
  {
    id: 'c-104987265',
    name: 'Panonija Agro d.o.o.',
    taxId: '104987265',
    city: 'Kać',
    balance: '383763.12',
    active: true,
  },
  {
    id: 'c-101665092',
    name: 'Drina Prevoz d.o.o.',
    taxId: '101665092',
    city: 'Loznica',
    balance: '58440.00',
    active: true,
  },
  {
    id: 'c-107819450',
    name: 'Medic Lab Niš d.o.o.',
    taxId: '107819450',
    city: 'Niš',
    balance: '86420.35',
    active: true,
  },
  {
    id: 'c-109773148',
    name: 'Bojović i sinovi d.o.o.',
    taxId: '109773148',
    city: 'Smederevo',
    balance: '94500.00',
    active: true,
  },
  {
    id: 'c-100421987',
    name: 'Vojvođanka Mlin a.d.',
    taxId: '100421987',
    city: 'Zrenjanin',
    balance: '61204.75',
    active: true,
  },
  {
    id: 'c-112048376',
    name: 'Stanić Elektro STR',
    taxId: '112048376',
    city: 'Novi Sad',
    balance: '0.00',
    active: true,
  },
  {
    id: 'c-111296603',
    name: 'Rakić Pekara SZR',
    taxId: '111296603',
    city: 'Novi Sad',
    balance: '0.00',
    active: false,
  },
]

const SURNAMES = [
  'Petrović',
  'Jovanović',
  'Nikolić',
  'Marković',
  'Đorđević',
  'Stojanović',
  'Ilić',
  'Pavlović',
  'Milošević',
  'Kostić',
  'Lazić',
  'Tomić',
]
const TRADES = [
  'Gradnja',
  'Prevoz',
  'Elektro',
  'Metal',
  'Drvo',
  'Komerc',
  'Agrar',
  'Instal',
  'Beton',
  'Trade',
]
const FORMS = ['d.o.o.', 'd.o.o.', 'STR', 'SZR', 'a.d.']
const CITIES = [
  'Novi Sad',
  'Zrenjanin',
  'Kikinda',
  'Sombor',
  'Subotica',
  'Čačak',
  'Kraljevo',
  'Niš',
  'Valjevo',
  'Šabac',
  'Pančevo',
  'Vršac',
  'Ruma',
  'Inđija',
]

/** The i-th generated customer: the same every time (pictures stay stable). */
export function storyCustomer(index: number): StoryCustomer {
  const surname = SURNAMES[index % SURNAMES.length] ?? ''
  const trade = TRADES[Math.floor(index / SURNAMES.length) % TRADES.length] ?? ''
  const form = FORMS[index % FORMS.length] ?? ''
  const taxId = String(102000000 + ((index * 7919) % 9000000))
  const paras = BigInt((index * 104729) % 50000000)
  return {
    id: `g-${String(index)}`,
    name: `${surname} ${trade} ${form}`,
    taxId,
    city: CITIES[index % CITIES.length] ?? '',
    balance: `${String(paras / 100n)}.${String(paras % 100n).padStart(2, '0')}`,
    active: index % 17 !== 0,
  }
}

/** The dataset's customers and `generated` more. */
export function storyCustomers(generated: number): StoryCustomer[] {
  return [...KNOWN, ...Array.from({ length: generated }, (_, index) => storyCustomer(index))]
}

/** Folded for matching: lower case, no accents (đ as d). */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

/** The application's search: every word in the name, tax number or city. */
export function searchCustomers(all: readonly StoryCustomer[], query: string): StoryCustomer[] {
  const words = fold(query)
    .split(/\s+/)
    .filter((word) => word !== '')
  if (words.length === 0) return [...all]
  return all.filter((customer) => {
    const text = fold(`${customer.name} ${customer.taxId} ${customer.city}`)
    return words.every((word) => text.includes(word))
  })
}

// ── Import (the application's side, for the stories) ─────────────────────────────────────────

/** The customer catalogue's fields a file's column can fill. */
export const IMPORT_FIELDS = [
  { id: 'name', label: 'Name', required: true },
  { id: 'taxId', label: 'Tax number', required: true, description: '9 digits (PIB)' },
  { id: 'registration', label: 'Registration number', description: '8 digits (MB)' },
  { id: 'city', label: 'City' },
  { id: 'address', label: 'Address' },
  { id: 'email', label: 'E-mail' },
  { id: 'paymentTerm', label: 'Payment term (days)' },
]

/** The file the stories "read": its header and first row, as the application would parse it. */
export const IMPORT_CSV = [
  'Naziv kupca;PIB;MB;Mesto;Adresa;E-pošta;Rok plaćanja;Napomena',
  'Panonija Agro d.o.o.;104987265;20876543;Kać;Novosadski put 14;nabavka@panonija-agro.rs;15;',
  'Lazić Beton d.o.o.;102345671;21987654;Inđija;Industrijska zona bb;office@lazicbeton.rs;30;',
].join('\n')

/** A story helper (never in the package): the columns of a CSV's header and first data row. */
export function csvColumns(text: string): { id: string; name: string; sample?: string }[] {
  const [header = '', first = ''] = text.split(/\r?\n/)
  const separator = header.includes(';') ? ';' : ','
  const samples = first.split(separator)
  return header.split(separator).map((name, index) => {
    const sample = samples[index]
    return {
      id: `col-${String(index)}`,
      name: name.trim(),
      ...(sample === undefined || sample === '' ? {} : { sample: sample.trim() }),
    }
  })
}

/** Reads a chosen file's text (the application's work; stories only). */
export function readFileText(file: File): Promise<string> {
  return file.text()
}

/** The application's suggestion for IMPORT_CSV: the field → column by name. */
export const IMPORT_SUGGESTION: Record<string, string | null> = {
  name: 'col-0',
  taxId: 'col-1',
  registration: 'col-2',
  city: 'col-3',
  address: 'col-4',
  email: 'col-5',
  paymentTerm: 'col-6',
}

/** Rows of the validation preview: the first lines of the file, three with problems. */
export const IMPORT_PREVIEW = [
  {
    id: 'l2',
    line: 2,
    values: {
      name: 'Panonija Agro d.o.o.',
      taxId: '104987265',
      city: 'Kać',
      email: 'nabavka@panonija-agro.rs',
      paymentTerm: '15',
    },
    issues: [{ tone: 'warning' as const, text: 'A customer with this tax number exists' }],
  },
  {
    id: 'l3',
    line: 3,
    values: {
      name: 'Lazić Beton d.o.o.',
      taxId: '102345671',
      city: 'Inđija',
      email: 'office@lazicbeton.rs',
      paymentTerm: '30',
    },
    issues: [],
  },
  {
    id: 'l4',
    line: 4,
    values: {
      name: 'Tomić Instal STR',
      taxId: '10234567',
      city: 'Ruma',
      email: 'tomic.instal@gmail',
      paymentTerm: '30',
    },
    issues: [
      { field: 'taxId', tone: 'danger' as const, text: 'A tax number has 9 digits' },
      { field: 'email', tone: 'danger' as const, text: 'Not an e-mail address' },
    ],
  },
  {
    id: 'l5',
    line: 5,
    values: {
      name: 'Kostić Metal d.o.o.',
      taxId: '105112398',
      city: 'Šabac',
      email: 'racuni@kosticmetal.rs',
      paymentTerm: '120',
    },
    issues: [
      { field: 'paymentTerm', tone: 'warning' as const, text: 'Longer than the usual 60 days' },
    ],
  },
  {
    id: 'l6',
    line: 6,
    values: {
      name: 'Ilić Drvo SZR',
      taxId: '108765432',
      city: 'Valjevo',
      email: 'ilicdrvo@mts.rs',
      paymentTerm: '15',
    },
    issues: [],
  },
]

/** The whole file's counts (1.213 rows): from the application's check. */
export const IMPORT_COUNTS = { ready: 1198, errors: 12, duplicates: 3 }

/** A page of results by cursor (the index of the first row), as a keyset page from the server. */
export function pageOf<Row>(rows: readonly Row[], cursor: number, size: number) {
  return {
    rows: rows.slice(cursor, cursor + size),
    hasNext: cursor + size < rows.length,
    hasPrevious: cursor > 0,
  }
}

/**
 * How the application sorts a catalogue column (P5.23: every catalogue list sorts by its
 * columns): text by the language's collation ("Č" after "C", "10" after "9"); numbers and amounts
 * exactly, the decimal strings read as whole units (BigInt), never as JavaScript numbers (D4).
 */
export type SortKey<Row> =
  | { kind: 'text'; value: (row: Row) => string }
  | { kind: 'decimal'; value: (row: Row) => string; places?: number }

/** The rows in the sort's order (a new array; equal values keep their order). */
export function sortRows<Row>(
  rows: readonly Row[],
  sort: DataTableSort,
  keys: Readonly<Partial<Record<string, SortKey<Row>>>>,
  locale: string,
): Row[] {
  const key = sort === null ? undefined : keys[sort.column]
  if (sort === null || key === undefined) return [...rows]
  const sign = sort.direction === 'asc' ? 1 : -1
  if (key.kind === 'text') {
    const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' })
    // Each value read once, not on every comparison (50,000 rows).
    const decorated = rows.map((row) => ({ row, value: key.value(row) }))
    decorated.sort((a, b) => sign * collator.compare(a.value, b.value))
    return decorated.map(({ row }) => row)
  }
  const places = key.places ?? 2
  const decorated = rows.map((row) => ({ row, value: toUnits(key.value(row), places) }))
  decorated.sort((a, b) => (a.value === b.value ? 0 : a.value < b.value ? -sign : sign))
  return decorated.map(({ row }) => row)
}

/** Whether a customer matches a choice filter of one value (select) or several (multiSelect). */
export function matchesChoice(value: unknown, actual: string): boolean {
  if (typeof value === 'string') return value === '' || value === actual
  if (Array.isArray(value)) return value.length === 0 || value.includes(actual)
  return true
}
