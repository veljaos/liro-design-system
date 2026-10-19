/*
 * Group AV's example data (P5.50, the sales chain): Kvadrat Gradnja d.o.o. sells precast
 * concrete stairs to Stanogradnja Plus d.o.o. — quote PON-2026-0031 (28.09.2026, accepted
 * 01.10.2026), order NAR-2026-0024 (02.10.2026), delivery note OTP-2026-0058 from the Central
 * warehouse (12.10.2026) and invoice F-2026-0430 (14.10.2026). Each next document is the
 * application's to create from the one before ("Create order", "Create delivery note", "Create
 * invoice"); every amount is the application's, written here as decimal strings. Plus the list of
 * quotes. Invented data: numbers and PIBs are illustrative.
 */

import type { ChainDocument } from './data-AU'

export const AV_ROUTES = {
  quotes: '/sales/quotes',
  quote: '/sales/quotes/PON-2026-0031',
  order: '/sales/orders/NAR-2026-0024',
  delivery: '/sales/delivery-notes/OTP-2026-0058',
  invoice: '/sales/invoices/F-2026-0430',
  /** The quote after the whole chain was created: every later document in its panel. */
  quoteDone: '/sales/quotes/PON-2026-0031?chain=done',
}

/** How far the chain is: 1 the quote only, 4 every document up to the invoice. */
export type ChainStage = 1 | 2 | 3 | 4

export interface SalesLine {
  id: string
  text: string
  unit: string
  quantity: string
  price: string
  amount: string
}

const LINES: SalesLine[] = [
  {
    id: 'flight',
    text: 'Precast stair flight PS-1',
    unit: 'pcs',
    quantity: '8',
    price: '38500.00',
    amount: '308000.00',
  },
  {
    id: 'landing',
    text: 'Precast landing PL-1',
    unit: 'pcs',
    quantity: '8',
    price: '14200.00',
    amount: '113600.00',
  },
  {
    id: 'delivery',
    text: 'Delivery and crane unloading',
    unit: 'pcs',
    quantity: '2',
    price: '18000.00',
    amount: '36000.00',
  },
]

const TOTALS = { net: '457600.00', vat: '91520.00', total: '549120.00' }

export const QUOTE = {
  number: 'PON-2026-0031',
  date: '2026-09-28',
  validUntil: '2026-10-28',
  accepted: '2026-10-01',
  preparedBy: 'Milena Jović, sales engineer',
  subject: 'Precast stairs for building B, Novo naselje',
  lines: LINES,
  totals: TOTALS,
}

export const SALES_ORDER = {
  number: 'NAR-2026-0024',
  date: '2026-10-02',
  customerReference: 'Order 2026/311',
  deliveryDate: '2026-10-12',
  deliverTo: 'Site Novo naselje, building B',
  lines: LINES,
  totals: TOTALS,
}

export interface DeliveryLine {
  id: string
  text: string
  unit: string
  quantity: string
}

export const DELIVERY = {
  number: 'OTP-2026-0058',
  date: '2026-10-12',
  warehouse: 'Central warehouse',
  vehicle: 'Two trucks, NS 214-KG and NS 377-KG',
  receivedBy: 'Vesna Ilić, Stanogradnja Plus d.o.o.',
  lines: LINES.map(({ id, text, unit, quantity }) => ({ id, text, unit, quantity })),
}

export const SALES_INVOICE = {
  number: 'F-2026-0430',
  date: '2026-10-14',
  due: '2026-11-13',
  reference: '97 30-2026-0430',
  lines: LINES,
  totals: TOTALS,
}

/** The chain at a stage, with each document's state then: the application's. */
export function salesChain(stage: ChainStage): ChainDocument[] {
  const all: ChainDocument[] = [
    {
      key: 'quote',
      type: 'Quote',
      number: QUOTE.number,
      path: AV_ROUTES.quote,
      status: stage > 1 ? 'Ordered' : 'Accepted',
    },
    {
      key: 'order',
      type: 'Order',
      number: SALES_ORDER.number,
      path: AV_ROUTES.order,
      status: stage > 2 ? 'Delivered' : 'Confirmed',
    },
    {
      key: 'delivery',
      type: 'Delivery note',
      number: DELIVERY.number,
      path: AV_ROUTES.delivery,
      status: stage > 3 ? 'Invoiced' : 'Delivered',
    },
    {
      key: 'invoice',
      type: 'Invoice',
      number: SALES_INVOICE.number,
      path: AV_ROUTES.invoice,
      status: 'Issued',
    },
  ]
  return all.slice(0, stage)
}

// ── The quotes ────────────────────────────────────────────────────────────────────────────────

export type QuoteState = 'Draft' | 'Sent' | 'Accepted' | 'Ordered' | 'Declined' | 'Expired'

export interface QuoteRow {
  number: string
  customer: string
  subject: string
  date: string
  validUntil: string
  total: string
  state: QuoteState
}

export const QUOTES: QuoteRow[] = [
  {
    number: 'PON-2026-0034',
    customer: 'Gradska toplana Novi Sad',
    subject: 'Heat substation foundations, Detelinara',
    date: '2026-10-13',
    validUntil: '2026-11-12',
    total: '1284000.00',
    state: 'Draft',
  },
  {
    number: 'PON-2026-0033',
    customer: 'Novi Dom Invest d.o.o.',
    subject: 'Formwork rental, 60 days',
    date: '2026-10-09',
    validUntil: '2026-10-23',
    total: '342000.00',
    state: 'Sent',
  },
  {
    number: 'PON-2026-0032',
    customer: 'Stanogradnja Plus d.o.o.',
    subject: 'Precast balcony slabs for building C',
    date: '2026-10-06',
    validUntil: '2026-11-05',
    total: '688800.00',
    state: 'Sent',
  },
  {
    number: QUOTE.number,
    customer: 'Stanogradnja Plus d.o.o.',
    subject: QUOTE.subject,
    date: QUOTE.date,
    validUntil: QUOTE.validUntil,
    total: QUOTE.totals.total,
    state: 'Accepted',
  },
  {
    number: 'PON-2026-0030',
    customer: 'Projektni biro Linija',
    subject: 'Site office containers, 6 months',
    date: '2026-09-24',
    validUntil: '2026-10-08',
    total: '216000.00',
    state: 'Expired',
  },
  {
    number: 'PON-2026-0029',
    customer: 'Gradska toplana Novi Sad',
    subject: 'Trench works, Bulevar Evrope',
    date: '2026-09-18',
    validUntil: '2026-10-18',
    total: '2160000.00',
    state: 'Declined',
  },
  {
    number: 'PON-2026-0027',
    customer: 'Stanogradnja Plus d.o.o.',
    subject: 'Ready-mix concrete deliveries, September',
    date: '2026-09-02',
    validUntil: '2026-09-30',
    total: '914400.00',
    state: 'Ordered',
  },
]

export const QUOTE_VIEWS: { id: string; label: string; states: readonly QuoteState[] }[] = [
  { id: 'open', label: 'Open', states: ['Draft', 'Sent', 'Accepted'] },
  { id: 'ordered', label: 'Ordered', states: ['Ordered'] },
  { id: 'closed', label: 'Declined or expired', states: ['Declined', 'Expired'] },
  {
    id: 'all',
    label: 'All',
    states: ['Draft', 'Sent', 'Accepted', 'Ordered', 'Declined', 'Expired'],
  },
]
