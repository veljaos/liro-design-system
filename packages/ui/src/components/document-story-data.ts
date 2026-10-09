/*
 * Sample data for the document block stories (P5.18): Kvadrat Gradnja d.o.o.'s final invoice
 * F-2026-0418 to Vojvođanka Mlin a.d. and its references. Fictitious; legal texts and codes are
 * illustrative. Not part of the package: nothing in src/index.ts imports this file. No classes
 * here: Storybook compiles classes only from *.stories.tsx files.
 */
import type { DocumentReferenceGroup } from './document-blocks'
import type { NoteTemplate } from './document-logic'
import type { LineType } from './line-types'
import type { TaxRecap, TotalsFootnote, TotalsRow } from './document-totals'

/** "Based on: Proforma PR-2026-031 · Advances A-2026-038, A-2026-044 · Contract 12/2026". */
export const REFERENCES: DocumentReferenceGroup[] = [
  {
    key: 'proforma',
    label: 'Proforma',
    items: [
      {
        key: 'pr',
        number: 'PR-2026-031',
        href: '#sales/proformas/PR-2026-031',
        status: { label: 'Accepted' },
      },
    ],
  },
  {
    key: 'advances',
    label: 'Advances',
    kind: 'Advance invoice',
    items: [
      {
        key: 'a38',
        number: 'A-2026-038',
        href: '#sales/invoices/A-2026-038',
        status: { label: 'Paid', tone: 'success' },
      },
      {
        key: 'a44',
        number: 'A-2026-044',
        href: '#sales/invoices/A-2026-044',
        status: { label: 'Paid', tone: 'success' },
      },
    ],
  },
  {
    key: 'contract',
    label: 'Contract',
    items: [
      {
        key: 'c12',
        number: '12/2026',
        href: '#sales/contracts/12-2026',
        status: { label: 'Active' },
      },
    ],
  },
]

/** One line of the final invoice, with its type (P5.18). */
export interface FinalLine {
  id: string
  type: LineType
  item: string
  kind?: string
  quantity?: string
  unit?: string
  vat?: string
  amount?: string
}

/**
 * The lines of F-2026-0418 as the Core sends them (the examples compute the same amounts in whole
 * paras: apps/storybook/src/examples/data-D2.ts).
 */
export const FINAL_LINES: FinalLine[] = [
  { id: 'h1', type: 'heading', item: 'Steel structure' },
  {
    id: '1',
    type: 'line',
    item: 'Steel beams HEA 200, S275JR',
    kind: 'Item',
    quantity: '12.6',
    unit: 't',
    vat: 'S 20%',
    amount: '1799280.00',
  },
  {
    id: '2',
    type: 'line',
    item: 'Steel columns HEB 240, S275JR',
    kind: 'Item',
    quantity: '8.4',
    unit: 't',
    vat: 'S 20%',
    amount: '1230600.00',
  },
  {
    id: '3',
    type: 'line',
    item: 'High-strength bolts M20 10.9 with nuts and washers',
    kind: 'Item',
    quantity: '640',
    unit: 'pc',
    vat: 'S 20%',
    amount: '119296.00',
  },
  { id: 's1', type: 'subtotal', item: 'Total steel structure', amount: '3149176.00' },
  { id: 'h2', type: 'heading', item: 'Roofing' },
  {
    id: '4',
    type: 'line',
    item: 'Sandwich roof panels PUR 100 mm, RAL 9002',
    kind: 'Item',
    quantity: '820',
    unit: 'm²',
    vat: 'S 20%',
    amount: '3595700.00',
  },
  {
    id: '5',
    type: 'line',
    item: 'Ridge and edge flashings, 0,6 mm',
    kind: 'Item',
    quantity: '96',
    unit: 'm',
    vat: 'S 20%',
    amount: '119040.00',
  },
  { id: 's2', type: 'subtotal', item: 'Total roofing', amount: '3714740.00' },
  {
    id: '6',
    type: 'line',
    item: 'Assembly drawings, printed and bound',
    kind: 'Service',
    quantity: '2',
    unit: 'lot',
    vat: 'S 10%',
    amount: '12800.00',
  },
  {
    id: 't',
    type: 'text',
    item: 'Delivered to the site at Temerinski put 51, Novi Sad, from 14 to 25 September 2026; delivery notes OTP-2026-0388 to OTP-2026-0402.',
  },
  {
    id: 'd',
    type: 'discount',
    item: 'Contract discount 3% on the steel structure and the roofing',
    kind: 'Discount',
    vat: 'S 20%',
    amount: '-205917.48',
  },
]

/** The totals of a final invoice (amounts as the Core sends them; nothing computed here). */
export const FINAL_ROWS: TotalsRow[] = [
  { key: 'net', label: 'Total without VAT', value: '6670798.52', currency: 'RSD' },
  { key: 'vat', label: 'VAT', value: '1332879.70', currency: 'RSD' },
  {
    key: 'total',
    label: 'Invoice total',
    value: '8003678.22',
    currency: 'RSD',
    group: true,
  },
]

export const FINAL_RECAP: TaxRecap = {
  label: 'Recap by tax category',
  headers: { category: 'Category', base: 'Base', rate: 'Rate', tax: 'VAT' },
  rows: [
    { key: 's20', category: 'S 20%', base: '6657998.52', rate: '20', tax: '1331599.70' },
    { key: 's10', category: 'S 10%', base: '12800.00', rate: '10', tax: '1280.00' },
  ],
}

export const FINAL_DEDUCTIONS: TotalsRow[] = [
  {
    key: 'a38',
    label: 'Advance A-2026-038',
    value: '-1200000.00',
    currency: 'RSD',
    href: '#sales/invoices/A-2026-038',
  },
  {
    key: 'a44',
    label: 'Advance A-2026-044',
    value: '-1800000.00',
    currency: 'RSD',
    href: '#sales/invoices/A-2026-044',
  },
]

export const FINAL_DUE: TotalsRow = {
  key: 'due',
  label: 'Amount due',
  value: '5003678.22',
  currency: 'RSD',
}

/** Exemption and reverse-charge reasons (illustrative texts, not legal advice). */
export const FOOTNOTES: TotalsFootnote[] = [
  {
    key: 'e',
    marker: '¹',
    text: 'Exempt E: supply exempt under Article 24 of the VAT Act (illustrative).',
  },
  {
    key: 'ae',
    marker: '²',
    text: 'AE: reverse charge — the recipient accounts for the VAT (illustrative).',
  },
]

/** The Core's template texts for a document's notes. */
export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    value: 'payment',
    label: 'Payment terms',
    text: 'Payment within 15 days to account 160-0000000456789-12 (Banca Intesa), reference 97 2026-0418.',
  },
  {
    value: 'warranty',
    label: 'Warranty',
    text: 'Warranty on the steel structure and the roofing panels: 24 months from the handover record.',
  },
  {
    value: 'advances',
    label: 'Advances deducted',
    text: 'Advances A-2026-038 and A-2026-044 are deducted with their VAT as invoiced.',
  },
  {
    value: 'retention',
    label: 'Retention of title',
    text: 'The goods remain the property of Kvadrat Gradnja d.o.o. until paid in full.',
  },
]
