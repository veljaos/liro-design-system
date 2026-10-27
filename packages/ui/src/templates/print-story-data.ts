/*
 * Sample data for the print template stories (P5.15) and the course stories (P5.12):
 * Kvadrat Gradnja d.o.o.'s invoices, the occupational-safety certificate of a site worker, a
 * school report, a specialist's finding. Fictitious; legal texts and codes are illustrative. The
 * amounts of the long invoice are computed here in whole paras (the application's arithmetic,
 * played by the story data; components never add, D4). Not part of the package: nothing in
 * src/index.ts imports this file. No classes here: Storybook compiles classes only from
 * *.stories.tsx files.
 */
import { decimal, paras, sumUnits } from '../components/amounts-story-data'
import type { TaxRecap, TotalsRow } from '../components/document-totals'
import type { LineType } from '../components/line-types'
import type { PrintParty } from './print-document'

export const SELLER: PrintParty = {
  key: 'seller',
  label: 'Seller',
  name: 'Kvadrat Gradnja d.o.o.',
  lines: ['Temerinski put 51', '21000 Novi Sad, Serbia'],
  details: [
    { key: 'pib', label: 'PIB', value: '109876543', numeric: true },
    { key: 'mb', label: 'MB', value: '21345678', numeric: true },
    { key: 'email', label: 'E-mail', value: 'office@kvadrat-gradnja.rs' },
  ],
}

export const BUYER: PrintParty = {
  key: 'buyer',
  label: 'Buyer',
  name: 'Vojvođanka Mlin a.d.',
  lines: ['Industrijska zona bb', '21400 Bačka Palanka, Serbia'],
  details: [
    { key: 'pib', label: 'PIB', value: '100234567', numeric: true },
    { key: 'mb', label: 'MB', value: '08012345', numeric: true },
    { key: 'email', label: 'E-mail', value: 'nabavka@vojvodjanka-mlin.rs' },
  ],
}

/** One printed line of an invoice. */
export interface PrintLine {
  id: string
  type: LineType
  item: string
  quantity?: string
  unit?: string
  price?: string
  vat?: string
  amount?: string
}

const CATALOGUE: readonly { item: string; unit: string; price: string; vat: string }[] = [
  { item: 'Ready-mixed concrete C25/30, pumped', unit: 'm³', price: '11850.00', vat: 'S 20%' },
  { item: 'Reinforcing steel B500B, cut and bent', unit: 'kg', price: '118.40', vat: 'S 20%' },
  { item: 'Formwork for walls, two-sided, rented', unit: 'm²', price: '960.00', vat: 'S 20%' },
  { item: 'Hollow clay blocks 25 × 19 × 38 cm', unit: 'pc', price: '96.50', vat: 'S 20%' },
  { item: 'Cement mortar M10 in bags of 25 kg', unit: 'bag', price: '540.00', vat: 'S 20%' },
  { item: 'Waterproofing membrane SBS 4 mm', unit: 'm²', price: '1240.00', vat: 'S 20%' },
  { item: 'Mineral wool boards 100 mm, facade', unit: 'm²', price: '1385.00', vat: 'S 20%' },
  { item: 'Crane hire with operator', unit: 'h', price: '7800.00', vat: 'S 20%' },
  { item: 'Site supervision by a licensed engineer', unit: 'h', price: '4200.00', vat: 'S 20%' },
  { item: 'Transport of material to the site', unit: 'trip', price: '9600.00', vat: 'S 20%' },
  { item: 'Technical documentation, printed copies', unit: 'set', price: '6400.00', vat: 'S 10%' },
]

/** price × quantity in whole paras, the quantity with up to two decimals. */
function lineAmount(price: string, quantity: string): bigint {
  return (paras(price) * paras(quantity)) / 100n
}

/**
 * A long invoice: `sections` sections of `perSection` lines each, a heading and a subtotal per
 * section, and its totals and recap (computed here in whole paras, rounded down to the para, as
 * the Core would send them).
 */
export function longInvoice(sections: number, perSection: number) {
  const lines: PrintLine[] = []
  const bases = { 'S 20%': 0n, 'S 10%': 0n }
  for (let section = 0; section < sections; section += 1) {
    lines.push({ id: `h${String(section)}`, type: 'heading', item: `Floor ${String(section + 1)}` })
    const amounts: bigint[] = []
    for (let index = 0; index < perSection; index += 1) {
      const entry = CATALOGUE[(section * perSection + index) % CATALOGUE.length]
      if (entry === undefined) continue
      const quantity = `${String((((section + 2) * (index + 3)) % 47) + 3)}.50`
      const amount = lineAmount(entry.price, quantity)
      amounts.push(amount)
      if (entry.vat === 'S 10%') bases['S 10%'] += amount
      else bases['S 20%'] += amount
      lines.push({
        id: `${String(section)}-${String(index)}`,
        type: 'line',
        item: entry.item,
        quantity,
        unit: entry.unit,
        price: entry.price,
        vat: entry.vat,
        amount: decimal(amount),
      })
    }
    lines.push({
      id: `s${String(section)}`,
      type: 'subtotal',
      item: `Total floor ${String(section + 1)}`,
      amount: decimal(sumUnits(amounts)),
    })
  }
  const tax20 = (bases['S 20%'] * 20n) / 100n
  const tax10 = (bases['S 10%'] * 10n) / 100n
  const net = bases['S 20%'] + bases['S 10%']
  const tax = tax20 + tax10
  const rows: TotalsRow[] = [
    { key: 'net', label: 'Total without VAT', value: decimal(net), currency: 'RSD' },
    { key: 'vat', label: 'VAT', value: decimal(tax), currency: 'RSD' },
  ]
  const recap: TaxRecap = {
    label: 'Recap by tax category',
    headers: { category: 'Category', base: 'Base', rate: 'Rate', tax: 'VAT' },
    rows: [
      {
        key: 's20',
        category: 'S 20%',
        base: decimal(bases['S 20%']),
        rate: '20',
        tax: decimal(tax20),
      },
      {
        key: 's10',
        category: 'S 10%',
        base: decimal(bases['S 10%']),
        rate: '10',
        tax: decimal(tax10),
      },
    ],
  }
  const total: TotalsRow = {
    key: 'total',
    label: 'Amount due',
    value: decimal(net + tax),
    currency: 'RSD',
  }
  return { lines, rows, recap, total }
}
