/*
 * Group AU's example data (P5.49, the purchasing chain): Kvadrat Gradnja d.o.o. buys ready-mix
 * concrete for "Residential building Liman 4" from Beton Mix d.o.o. on 14.10.2026 at 09:40 —
 * purchase order NB-2026-0087 (05.10.2026), goods receipt PRI-2026-0213 at Site Liman 4
 * (12.10.2026: one cubic metre short, one pump hour more) and Beton Mix's invoice 2026-1187 of
 * 12.10.2026, the one waiting in the document inbox (group U, data-U.ts: base 245.000,00, VAT 20%
 * 49.000,00, total 294.000,00 RSD). Every figure is the application's — the received value, the
 * differences, which match rows differ and why — written here as decimal strings; the screens
 * compute nothing. The shared trade facts (the partners, the states' tones) live here too and are
 * used by groups AV and AW. Invented data: PIBs and numbers are illustrative.
 */

import type { Tone } from '@veljaos/ui'
import { U_ROUTES } from './data-U'

/** The examples' today (the application's clock, never the device's). */
export const AU_TODAY = '2026-10-14'

export const AU_ROUTES = {
  order: '/purchasing/orders/NB-2026-0087',
  receipt: '/purchasing/receipts/PRI-2026-0213',
  match: '/purchasing/match/2026-1187',
  /** The pump's extra hour accepted: the invoice matches and may be posted. */
  matchAccepted: '/purchasing/match/2026-1187?accepted',
  /** The supplier invoice where it waits: the review in the document inbox (group U). */
  invoice: U_ROUTES.reviewOf('u1'),
}

// ── Shared trade facts (groups AU, AV, AW) ───────────────────────────────────────────────────

/** The trade documents' states and their tones: the application's map. */
export const TRADE_TONES: Record<string, Tone> = {
  Draft: 'neutral',
  Sent: 'neutral',
  Accepted: 'success',
  Ordered: 'success',
  Invoiced: 'success',
  Confirmed: 'success',
  Delivered: 'success',
  Issued: 'success',
  Posted: 'success',
  Matched: 'success',
  Signed: 'success',
  Paid: 'success',
  Expired: 'neutral',
  Declined: 'danger',
  'Needs review': 'warning',
  'Awaiting match': 'warning',
  'Awaiting signatures': 'warning',
  '1 difference': 'warning',
}

export interface Party {
  name: string
  taxId: string
  address: string
}

export const KVADRAT: Party = {
  name: 'Kvadrat Gradnja d.o.o.',
  taxId: 'PIB 108452317',
  address: 'Bulevar oslobođenja 102, 21000 Novi Sad',
}

export const BETON_MIX: Party = {
  name: 'Beton Mix d.o.o.',
  taxId: 'PIB 106543218',
  address: 'Industrijska zona bb, 21000 Novi Sad',
}

export const ELEKTRO_SISTEM: Party = {
  name: 'Elektro Sistem d.o.o.',
  taxId: 'PIB 104556789',
  address: 'Futoški put 31, 21000 Novi Sad',
}

export const STANOGRADNJA: Party = {
  name: 'Stanogradnja Plus d.o.o.',
  taxId: 'PIB 108990341',
  address: 'Narodnog fronta 73, 21000 Novi Sad',
}

export const GRADSKA_TOPLANA: Party = {
  name: 'Gradska toplana Novi Sad',
  taxId: 'PIB 101234870',
  address: 'Vladimira Nikolića 1, 21000 Novi Sad',
}

/** A document of a chain, as the related-documents panel lists it. */
export interface ChainDocument {
  key: string
  type: string
  number: string
  path: string
  status: string
}

// ── Purchase order NB-2026-0087 ──────────────────────────────────────────────────────────────

export interface OrderLine {
  id: string
  text: string
  unit: string
  quantity: string
  price: string
  amount: string
}

export const ORDER = {
  number: 'NB-2026-0087',
  date: '2026-10-05',
  deliveryDate: '2026-10-12',
  deliverTo: 'Site Liman 4',
  buyer: 'Ivan Lukić, buyer',
  project: 'Residential building Liman 4',
  terms: '30 days from the invoice',
  supplierConfirmed: '2026-10-06',
  lines: [
    {
      id: 'concrete',
      text: 'Ready-mix concrete C25/30',
      unit: 'm³',
      quantity: '36',
      price: '6200.00',
      amount: '223200.00',
    },
    {
      id: 'pump',
      text: 'Concrete pump',
      unit: 'h',
      quantity: '3',
      price: '5500.00',
      amount: '16500.00',
    },
    {
      id: 'transport',
      text: 'Transport to Site Liman 4',
      unit: 'pcs',
      quantity: '1',
      price: '6000.00',
      amount: '6000.00',
    },
  ] satisfies OrderLine[],
  totals: { net: '245700.00', vat: '49140.00', total: '294840.00' },
}

// ── Goods receipt PRI-2026-0213 ──────────────────────────────────────────────────────────────

export interface ReceiptLine {
  id: string
  text: string
  unit: string
  ordered: string
  /** Received less ordered, signed: the application's. */
  difference: string
  received: string
  /** Why, in the receiver's words. */
  note: string | null
}

export const RECEIPT = {
  number: 'PRI-2026-0213',
  date: '2026-10-12',
  warehouse: 'Site Liman 4',
  receivedBy: 'Snežana Popović, site manager',
  supplierNote: 'Delivery note 2026-0941',
  lines: [
    {
      id: 'concrete',
      text: 'Ready-mix concrete C25/30',
      unit: 'm³',
      ordered: '36',
      difference: '-1',
      received: '35',
      note: 'The fifth truck brought 6 m³ instead of 7 m³; the driver signed the note.',
    },
    {
      id: 'pump',
      text: 'Concrete pump',
      unit: 'h',
      ordered: '3',
      difference: '1',
      received: '4',
      note: 'Pumping took 4 h by the pump’s log; the site manager signed it.',
    },
    {
      id: 'transport',
      text: 'Transport to Site Liman 4',
      unit: 'pcs',
      ordered: '1',
      difference: '0',
      received: '1',
      note: null,
    },
  ] satisfies ReceiptLine[],
  /** The received quantities at the order's prices, and against the order: the application's. */
  receivedValue: '245000.00',
  orderedValue: '245700.00',
  valueDifference: '-700.00',
  differences: 2,
}

// ── The three-way match of invoice 2026-1187 ─────────────────────────────────────────────────

export const INVOICE = {
  number: '2026-1187',
  date: '2026-10-12',
  due: '2026-11-11',
  net: '245000.00',
  vat: '49000.00',
  total: '294000.00',
}

/** One row of the match: the three documents' values and the application's verdict. */
export interface MatchRow {
  id: string
  label: string
  kind: 'quantity' | 'money' | 'text' | 'date'
  unit?: string
  order: string | null
  receipt: string | null
  invoice: string | null
  differs?: boolean
  note?: string
}

export const MATCH_ROWS: MatchRow[] = [
  {
    id: 'concrete-qty',
    label: 'Ready-mix concrete C25/30, quantity',
    kind: 'quantity',
    unit: 'm³',
    order: '36',
    receipt: '35',
    invoice: '35',
    note: 'Invoiced as received',
  },
  {
    id: 'concrete-price',
    label: 'Ready-mix concrete C25/30, price',
    kind: 'money',
    order: '6200.00',
    receipt: null,
    invoice: '6200.00',
  },
  {
    id: 'pump-qty',
    label: 'Concrete pump, quantity',
    kind: 'quantity',
    unit: 'h',
    order: '3',
    receipt: '4',
    invoice: '4',
    differs: true,
    note: 'More than ordered: needs approval',
  },
  {
    id: 'pump-price',
    label: 'Concrete pump, price',
    kind: 'money',
    order: '5500.00',
    receipt: null,
    invoice: '5500.00',
  },
  {
    id: 'transport-qty',
    label: 'Transport, quantity',
    kind: 'quantity',
    unit: 'pcs',
    order: '1',
    receipt: '1',
    invoice: '1',
  },
  {
    id: 'net',
    label: 'Total without VAT',
    kind: 'money',
    order: ORDER.totals.net,
    receipt: RECEIPT.receivedValue,
    invoice: INVOICE.net,
    note: 'Invoiced as received',
  },
  {
    id: 'vat',
    label: 'VAT 20%',
    kind: 'money',
    order: ORDER.totals.vat,
    receipt: null,
    invoice: INVOICE.vat,
    note: 'At the order’s rate',
  },
  {
    id: 'due',
    label: 'Due date',
    kind: 'date',
    order: null,
    receipt: null,
    invoice: INVOICE.due,
    note: '30 days, as ordered',
  },
]

/** After the extra pump hour is accepted: the application's new verdict on that row. */
export const PUMP_ACCEPTED_NOTE = 'Accepted by Milica Petrović'

/** The chain, in its order: every page's related documents. */
export const PURCHASE_CHAIN: ChainDocument[] = [
  {
    key: 'order',
    type: 'Purchase order',
    number: ORDER.number,
    path: AU_ROUTES.order,
    status: 'Awaiting match',
  },
  {
    key: 'receipt',
    type: 'Goods receipt',
    number: RECEIPT.number,
    path: AU_ROUTES.receipt,
    status: 'Posted',
  },
  {
    key: 'invoice',
    type: 'Supplier invoice',
    number: INVOICE.number,
    path: AU_ROUTES.invoice,
    status: 'Needs review',
  },
]
