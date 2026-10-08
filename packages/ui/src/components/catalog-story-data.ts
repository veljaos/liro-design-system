/*
 * Story data for the catalogue components (P5.19): customers of Kvadrat Gradnja d.o.o.,
 * generated repeatably, and a search that plays the application (the components never search).
 * Not part of the package: nothing in src/index.ts imports this file. No classes here.
 */

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

/** A page of results by cursor (the index of the first row), as a keyset page from the server. */
export function pageOf<Row>(rows: readonly Row[], cursor: number, size: number) {
  return {
    rows: rows.slice(cursor, cursor + size),
    hasNext: cursor + size < rows.length,
    hasPrevious: cursor > 0,
  }
}
