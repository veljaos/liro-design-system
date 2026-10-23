/*
 * The data of group E's example screens (P5.19, P5.20): Kvadrat Gradnja d.o.o.'s customer
 * catalogue (the dataset's customers and 50,000 generated ones), a customer import and the VAT
 * return for September 2026. Amounts are decimal strings, added here in whole paras (BigInt) —
 * the screens play the application; components never add.
 * Legal codes, field numbers and texts are illustrative, not authoritative. No classes here.
 */

import { decimal, paras } from '../../../../packages/ui/src/components/amounts-story-data'

// ── Amounts in whole paras ────────────────────────────────────────────────────────────────────

/** Decimal strings added in whole paras. */
export function addAmounts(...values: readonly string[]): string {
  return decimal(values.reduce((total, value) => total + paras(value), 0n))
}

/** VAT at 20% of a base: exactly a fifth, in paras (the bases are chosen so it is exact). */
export function vatAt20(base: string): string {
  const amount = paras(base)
  if (amount % 5n !== 0n) throw new Error(`${base}: VAT at 20% is not whole paras`)
  return decimal(amount / 5n)
}

// ── Customers ─────────────────────────────────────────────────────────────────────────────────

export interface Customer {
  id: string
  name: string
  /** PIB, 9 digits. */
  taxId: string
  city: string
  /** Payment term in days, as text ("30"). */
  paymentTerm: string
  group: 'Construction companies' | 'Wholesale' | 'Retail'
  /** Open balance in RSD (the invoices still to be paid). */
  balance: string
  active: boolean
}

/**
 * The dataset's customers (P4.8): their open balances are the open amounts of the invoice list
 * (Panonija Agro: F-2026-0412 135.954,00 + F-2026-0403 247.809,12).
 */
export const KNOWN_CUSTOMERS: Customer[] = [
  {
    id: '104987265',
    name: 'Panonija Agro d.o.o.',
    taxId: '104987265',
    city: 'Kać',
    paymentTerm: '15',
    group: 'Wholesale',
    balance: addAmounts('135954.00', '247809.12'),
    active: true,
  },
  {
    id: '101665092',
    name: 'Drina Prevoz d.o.o.',
    taxId: '101665092',
    city: 'Loznica',
    paymentTerm: '7',
    group: 'Construction companies',
    balance: '58440.00',
    active: true,
  },
  {
    id: '107819450',
    name: 'Medic Lab Niš d.o.o.',
    taxId: '107819450',
    city: 'Niš',
    paymentTerm: '30',
    group: 'Retail',
    balance: '67762.75',
    active: true,
  },
  {
    id: '109773148',
    name: 'Bojović i sinovi d.o.o.',
    taxId: '109773148',
    city: 'Smederevo',
    paymentTerm: '15',
    group: 'Construction companies',
    balance: '0.00',
    active: true,
  },
  {
    id: '100421987',
    name: 'Vojvođanka Mlin a.d.',
    taxId: '100421987',
    city: 'Zrenjanin',
    paymentTerm: '30',
    group: 'Construction companies',
    balance: '61204.75',
    active: true,
  },
  {
    id: '112048376',
    name: 'Stanić Elektro STR',
    taxId: '112048376',
    city: 'Novi Sad',
    paymentTerm: '15',
    group: 'Retail',
    balance: '0.00',
    active: true,
  },
  {
    id: '111296603',
    name: 'Rakić Pekara SZR',
    taxId: '111296603',
    city: 'Novi Sad',
    paymentTerm: '15',
    group: 'Retail',
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
  'Savić',
  'Popović',
  'Vasić',
  'Ristić',
  'Mitić',
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
  'Keramika',
  'Krov',
  'Fasade',
  'Stolarija',
]
const FORMS = ['d.o.o.', 'd.o.o.', 'd.o.o.', 'STR', 'SZR', 'a.d.', 'PR']
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
  'Temerin',
  'Bačka Palanka',
]
const GROUPS: Customer['group'][] = ['Construction companies', 'Wholesale', 'Retail']
const TERMS = ['7', '15', '30', '45', '60']

/** How many customers the catalogue generates beside the dataset's. */
export const GENERATED_CUSTOMERS = 50000

/** The i-th generated customer: the same every time, so pictures stay stable. */
function generatedCustomer(index: number): Customer {
  const surname = SURNAMES[index % SURNAMES.length] ?? ''
  const trade = TRADES[Math.floor(index / SURNAMES.length) % TRADES.length] ?? ''
  const form = FORMS[index % FORMS.length] ?? ''
  const branch = Math.floor(index / (SURNAMES.length * TRADES.length))
  const city = CITIES[(index + branch) % CITIES.length] ?? ''
  const balance = BigInt((index * 104729) % 90000000)
  return {
    id: `g${String(index)}`,
    name: branch === 0 ? `${surname} ${trade} ${form}` : `${surname} ${trade} ${city} ${form}`,
    taxId: String(102000000 + ((index * 7919) % 9000000)),
    city,
    paymentTerm: TERMS[index % TERMS.length] ?? '30',
    group: GROUPS[index % GROUPS.length] ?? 'Retail',
    balance: index % 4 === 0 ? '0.00' : decimal(balance),
    active: index % 23 !== 0,
  }
}

let catalogue: Customer[] | null = null

/** The whole catalogue: the dataset's customers first, then the generated ones. */
export function allCustomers(): Customer[] {
  catalogue ??= [
    ...KNOWN_CUSTOMERS,
    ...Array.from({ length: GENERATED_CUSTOMERS }, (_, index) => generatedCustomer(index)),
  ]
  return catalogue
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

const folded = new WeakMap<Customer, string>()

/** The application's search: every word in the name, the tax number or the city. */
export function searchCustomers(rows: readonly Customer[], query: string): Customer[] {
  const words = fold(query)
    .split(/\s+/)
    .filter((word) => word !== '')
  if (words.length === 0) return [...rows]
  return rows.filter((customer) => {
    let text = folded.get(customer)
    if (text === undefined) {
      text = fold(`${customer.name} ${customer.taxId} ${customer.city}`)
      folded.set(customer, text)
    }
    const found = text
    return words.every((word) => found.includes(word))
  })
}

// ── Customer import ───────────────────────────────────────────────────────────────────────────

/** The catalogue's fields a column of the file can fill. */
export const CUSTOMER_FIELDS = [
  { id: 'name', label: 'Name', required: true },
  { id: 'taxId', label: 'Tax number', required: true, description: '9 digits (PIB)' },
  { id: 'registration', label: 'Registration number', description: '8 digits (MB)' },
  { id: 'city', label: 'City' },
  { id: 'address', label: 'Address' },
  { id: 'email', label: 'E-mail' },
  { id: 'paymentTerm', label: 'Payment term (days)' },
]

/** The example file: Milica's export from the old system (its first lines). */
export const IMPORT_FILE = [
  'Naziv kupca;PIB;MB;Mesto;Adresa;E-pošta;Rok plaćanja;Napomena',
  'Panonija Agro d.o.o.;104987265;20876543;Kać;Novosadski put 14;nabavka@panonija-agro.rs;15;stari kupac',
  'Lazić Beton d.o.o.;102345671;21987654;Inđija;Industrijska zona bb;office@lazicbeton.rs;30;',
  'Tomić Instal STR;10234567;;Ruma;Glavna 18;tomic.instal@gmail;30;',
  'Kostić Metal d.o.o.;105112398;20334455;Šabac;Pocerska 7;racuni@kosticmetal.rs;120;',
  'Ilić Drvo SZR;108765432;;Valjevo;Karađorđeva 52;ilicdrvo@mts.rs;15;',
].join('\n')

export const IMPORT_FILE_DESCRIPTION = '1.213 rows, 8 columns, 96 KB'

/** The columns of a CSV's header and first data row (the application's parser, for the example). */
export function csvColumns(text: string): { id: string; name: string; sample?: string }[] {
  const [header = '', first = ''] = text.split(/\r?\n/)
  const samples = first.split(';')
  return header.split(';').map((name, index) => {
    const sample = samples[index]
    return {
      id: `col-${String(index)}`,
      name: name.trim(),
      ...(sample === undefined || sample === '' ? {} : { sample: sample.trim() }),
    }
  })
}

/**
 * Reads a chosen file as the application would (for the example): a text CSV whose first row
 * names at least two columns separated by ";" gives its columns; anything else — a damaged or
 * binary file, an Excel file the example cannot open, a text without columns — gives the error in
 * words, never what was read (P5.90 item 7).
 */
export function readImportFile(
  name: string,
  text: string,
): { columns: ReturnType<typeof csvColumns> } | { error: string } {
  // A control character other than tab and line breaks, or the replacement character: not text.
  const head = text.slice(0, 4096)
  let binary = false
  for (let index = 0; index < head.length && !binary; index += 1) {
    const code = head.charCodeAt(index)
    binary = (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 0xfffd
  }
  if (binary) {
    return {
      error: `${name} could not be read: it is not a text CSV file. Open it in Excel and save it as CSV (separated by ;), then choose it again.`,
    }
  }
  const columns = csvColumns(text)
  if (columns.length < 2) {
    return {
      error: `${name} could not be read: its first row has no column names separated by ;.`,
    }
  }
  return { columns }
}

/** The application's suggested mapping for the file (by the columns' names). */
export const IMPORT_SUGGESTION: Record<string, string | null> = {
  name: 'col-0',
  taxId: 'col-1',
  registration: 'col-2',
  city: 'col-3',
  address: 'col-4',
  email: 'col-5',
  paymentTerm: 'col-6',
}

/** The first rows of the validation preview, as the application checked them. */
export const IMPORT_PREVIEW = [
  {
    id: 'l2',
    line: 2,
    values: {
      name: 'Panonija Agro d.o.o.',
      taxId: '104987265',
      registration: '20876543',
      city: 'Kać',
      address: 'Novosadski put 14',
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
      registration: '21987654',
      city: 'Inđija',
      address: 'Industrijska zona bb',
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
      registration: '',
      city: 'Ruma',
      address: 'Glavna 18',
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
      registration: '20334455',
      city: 'Šabac',
      address: 'Pocerska 7',
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
      registration: '',
      city: 'Valjevo',
      address: 'Karađorđeva 52',
      email: 'ilicdrvo@mts.rs',
      paymentTerm: '15',
    },
    issues: [],
  },
]

/** The whole file (1.213 rows): ready, with errors, matching existing customers. */
export const IMPORT_COUNTS = { ready: 1198, errors: 12, duplicates: 3 }

// ── VAT return, September 2026 (an illustrative form; numbers and texts as an example) ────────

/** The invoices of the dataset in September's sales at 20% (the whole total at 20%). */
export const SEPTEMBER_SALES_20 = [
  {
    number: 'F-2026-0412',
    customer: 'Panonija Agro d.o.o.',
    date: '2026-09-28',
    base: '144920.00',
    status: 'Sent',
  },
  {
    number: 'F-2026-0411',
    customer: 'Drina Prevoz d.o.o.',
    date: '2026-09-26',
    base: '48700.00',
    status: 'Overdue',
  },
  {
    number: 'F-2026-0409',
    customer: 'Stanić Elektro STR',
    date: '2026-09-22',
    base: '19932.00',
    status: 'Paid',
  },
  {
    number: 'F-2026-0407',
    customer: 'Bojović i sinovi d.o.o.',
    date: '2026-09-18',
    base: '78750.00',
    // Cancelled on 06.10.2026. (ST-2026-0004): the cancellation belongs to October's return.
    status: 'Cancelled',
  },
  {
    number: 'F-2026-0404',
    customer: 'Knjigovodstvo Jelić',
    date: '2026-09-12',
    base: '12000.00',
    status: 'Paid',
  },
  {
    number: 'F-2026-0403',
    customer: 'Panonija Agro d.o.o.',
    date: '2026-09-10',
    base: '206507.60',
    status: 'Sent',
  },
] as const

/** September's supplier invoices at 20% (the approvals' dataset). */
export const SEPTEMBER_PURCHASES_20 = [
  {
    number: 'UF-2026-1179',
    supplier: 'Beočinska fabrika cementa',
    date: '2026-09-27',
    base: '322000.00',
    status: 'Query sent',
  },
  {
    number: 'UF-2026-1176',
    supplier: 'NIS a.d. Novi Sad',
    date: '2026-09-26',
    base: '22788.00',
    status: 'To approve',
  },
] as const

/** F-2026-0412's 10% line and its exempt deposit (P4.8 TOTALS). */
export const SEPTEMBER_10 = { base: '8500.00', exempt: '2700.00' }

/** September's advance e-invoice at 20% (the return's 1.2.1). */
export const SEPTEMBER_ADVANCES = [
  {
    number: 'AV-2026-0031',
    customer: 'Mlinpek d.o.o.',
    date: '2026-09-15',
    base: '50000.00',
    status: 'Paid',
  },
] as const

/** September's construction works invoiced with reverse charge (the return's 1.4: base only). */
export const SEPTEMBER_REVERSE_CHARGE = [
  {
    number: 'F-2026-0426',
    customer: 'Vojvođanka Mlin a.d.',
    date: '2026-09-14',
    base: '96000.00',
    status: 'Sent',
  },
] as const

/** Ivana Stojanović left UF-2026-1179 out of 3.1.1's VAT: a query about its price is open. */
export const VAT_INPUT_OVERRIDE = vatAt20('22788.00')
