import {
  Banknote,
  Landmark,
  CreditCard,
  FileCheck,
  QrCode,
  Ticket,
  WalletCards,
} from 'lucide-react'
import type { AdvanceItem } from './advance-list'
import type { BuyerIdType } from './buyer-field'
import type { CartLine } from './cart-panel'
import type { ChoosableLine } from './line-quantity-picker'
import type { PaymentPart } from './payment-dialog'
import type { FoundReceipt } from './receipt-finder'
import type { ReceiptFact, ReceiptRecap } from './receipt-preview'
import type { ReceiptDelivery } from './receipt-result'
import type { PaymentOption, ReceiptKindOption } from './sale-logic'

/*
 * Story data of the till's sale flows (P5.28 items 21 and 22): the kinds of a receipt, the ways to
 * pay, the buyer's ID kinds, a receipt found again, the lines of a refund, open advances and an
 * issued receipt — after the Serbian fiscal system (the electronic fiscal device and the
 * processor of fiscal receipts), as an application would pass them. **Illustrative:** the kinds,
 * codes, labels and rules are written from general knowledge of the system, in English, and every
 * number is invented (no real processor numbers, no real tax numbers). The components only show
 * what they are given; these words are the application's data. Not part of the package: nothing
 * in src/index.ts imports this file. No classes here.
 */

export const STORY_CURRENCY = 'RSD'

// ── Kinds of a receipt (invoice type × transaction) ──────────────────────────────────────────

/** The receipt types; the ones that are not a real sale carry the marker the law asks for. */
export const RECEIPT_TYPES: readonly ReceiptKindOption[] = [
  { id: 'normal', label: 'Normal', description: 'A sale paid now.' },
  {
    id: 'advance',
    label: 'Advance',
    description: 'Money taken before the goods are delivered; closed on the final sale.',
  },
  {
    id: 'proforma',
    label: 'Proforma',
    description: 'An offer for the buyer before they pay.',
    marker: 'Proforma — this is not a fiscal receipt',
  },
  {
    id: 'copy',
    label: 'Copy',
    description: 'A copy of an issued receipt.',
    marker: 'Copy — this is not a fiscal receipt',
    unavailableReason: 'open the receipt in the journal to copy it.',
  },
  {
    id: 'training',
    label: 'Training',
    description: 'Practice: nothing is reported.',
    marker: 'Training — this is not a fiscal receipt',
  },
]

export const TRANSACTIONS: readonly ReceiptKindOption[] = [
  { id: 'sale', label: 'Sale' },
  {
    id: 'refund',
    label: 'Refund',
    description: 'Opens the original receipt; its number and time are carried over.',
  },
]

// ── Ways to pay ───────────────────────────────────────────────────────────────────────────────

/** The seven ways to pay of the system, as the application words them (illustrative). */
export const PAYMENT_OPTIONS: readonly PaymentOption[] = [
  { id: 'cash', label: 'Cash', kind: 'cash', icon: Banknote },
  { id: 'card', label: 'Card', kind: 'card', icon: CreditCard },
  { id: 'instant', label: 'Instant payment', kind: 'qr', icon: QrCode },
  {
    id: 'cheque',
    label: 'Cheque',
    kind: 'plain',
    icon: FileCheck,
    referenceLabel: 'Cheque number',
  },
  {
    id: 'voucher',
    label: 'Voucher',
    kind: 'plain',
    icon: Ticket,
    referenceLabel: 'Voucher code',
    note: 'Single-purpose vouchers only; a multi-purpose voucher is paid as Other cashless.',
  },
  {
    id: 'wire',
    label: 'Wire transfer',
    kind: 'plain',
    icon: Landmark,
    note: 'Deferred payment: the buyer pays to the account on the invoice.',
  },
  { id: 'other', label: 'Other cashless', kind: 'plain', icon: WalletCards },
]

/** The wire transfer while no buyer is entered: the application's rule. */
export const WIRE_WITHOUT_BUYER: PaymentOption = {
  id: 'wire',
  label: 'Wire transfer',
  kind: 'plain',
  icon: Landmark,
  unavailableReason: 'A wire transfer needs the buyer’s tax number.',
  note: 'Deferred payment: the buyer pays to the account on the invoice.',
}

/** A voucher of 500,00 and a card payment of 400,00 taken; 111,00 remaining of 1.011,00. */
export const MIXED_PAID: readonly PaymentPart[] = [
  { id: 'v1', label: 'Voucher', value: '500.00', detail: 'VC-2026-7741' },
  { id: 'c1', label: 'Card', value: '400.00', detail: 'Visa •••• 4821' },
]

// ── The buyer ─────────────────────────────────────────────────────────────────────────────────

/** The buyer's ID kinds with their codes (illustrative words): more than ten, so searchable. */
export const BUYER_ID_TYPES: readonly BuyerIdType[] = [
  { value: '10', label: '10 · Tax number (PIB)', hint: '9 digits' },
  { value: '11', label: '11 · Personal number (JMBG)', hint: '13 digits' },
  {
    value: '12',
    label: '12 · Tax number and public funds user number',
    hint: 'PIB:JBKJS, e.g. 101234567:12345',
  },
  { value: '13', label: '13 · Pension card number' },
  { value: '20', label: '20 · Identity card number' },
  { value: '21', label: '21 · Refugee ID number' },
  { value: '22', label: '22 · Foreigner’s registration number' },
  { value: '23', label: '23 · Passport number' },
  { value: '30', label: '30 · Foreign passport number' },
  { value: '31', label: '31 · Diplomatic ID number' },
  { value: '32', label: '32 · Identity card, North Macedonia' },
  { value: '33', label: '33 · Identity card, Montenegro' },
  { value: '34', label: '34 · Identity card, Albania' },
  { value: '35', label: '35 · Identity card, Bosnia and Herzegovina' },
  { value: '40', label: '40 · Tax number issued abroad' },
]

/** The optional buyer field's kinds (illustrative). */
export const BUYER_OPTIONAL_TYPES: readonly BuyerIdType[] = [
  { value: '10', label: '10 · Business unit' },
  { value: '20', label: '20 · Public funds user number' },
  { value: '30', label: '30 · Corporate card number', hint: 'The last four digits' },
]

/** An invented company buyer. */
export const STORY_BUYER = { typeId: '10', id: '100000017', optionalTypeId: '', optional: '' }

// ── A receipt found again, and the lines of a refund ──────────────────────────────────────────

/** Invented processor numbers: "ZK7Q2M4P-ZK7Q2M4P-<counter>". */
export const FOUND_RECEIPTS: readonly FoundReceipt[] = [
  {
    id: 'r2318',
    number: 'ZK7Q2M4P-ZK7Q2M4P-2318',
    date: '2026-10-06',
    time: '09:42',
    total: '1011.00',
    kindLabel: 'Normal sale',
    detail: '1 line refunded already',
  },
  {
    id: 'r2297',
    number: 'ZK7Q2M4P-ZK7Q2M4P-2297',
    date: '2026-10-05',
    time: '17:05',
    total: '1011.00',
    kindLabel: 'Normal sale',
  },
  {
    id: 'r2240',
    number: 'ZK7Q2M4P-ZK7Q2M4P-2240',
    date: '2026-10-03',
    time: '08:12',
    total: '1011.00',
    kindLabel: 'Normal sale',
    unavailableReason: 'Refunded in full on 03.10.2026.',
  },
]

/** The original's lines: what can still be refunded (one kifla went back already). */
export const REFUND_LINES: readonly ChoosableLine[] = [
  {
    id: 'c1',
    name: 'Kifla',
    detail: '60 g',
    available: '3',
    unit: 'pc',
    unitPrice: '25.00',
    note: '1 of 4 refunded already on 06.10.2026.',
  },
  {
    id: 'c2',
    name: 'Burek sa mesom',
    detail: '250 g',
    available: '2',
    unit: 'pc',
    unitPrice: '190.00',
  },
  { id: 'c3', name: 'Jogurt', detail: '1 l', available: '1', unit: 'pc', unitPrice: '135.00' },
  {
    id: 'c4',
    name: 'Krempita',
    available: '2',
    unit: 'pc',
    unitPrice: '198.00',
    note: 'Price after the 10% loyalty discount',
  },
]

/** Two kifle and one burek chosen: 2 × 25,00 + 190,00 = 240,00 (the application's sum). */
export const REFUND_CHOSEN = { c1: '2', c2: '1' }
export const REFUND_CHOSEN_TOTAL = '240.00'

// ── Advances ──────────────────────────────────────────────────────────────────────────────────

/** An invented buyer's open advances for a cake order. */
export const ADVANCES: readonly AdvanceItem[] = [
  {
    id: 'a2201',
    number: 'ZK7Q2M4P-ZK7Q2M4P-2201',
    date: '2026-09-28',
    paid: '5000.00',
    open: '5000.00',
    state: { label: 'Open', tone: 'neutral' },
    note: 'Wedding cake, 120 slices, for 10.10.2026.',
  },
  {
    id: 'a2265',
    number: 'ZK7Q2M4P-ZK7Q2M4P-2265',
    date: '2026-10-02',
    paid: '3000.00',
    open: '1200.00',
    state: { label: 'Partly used', tone: 'warning' },
  },
]

// ── An issued receipt ─────────────────────────────────────────────────────────────────────────

export const ISSUED_FACTS: readonly ReceiptFact[] = [
  { id: 'number', label: 'Processor receipt number', value: 'ZK7Q2M4P-ZK7Q2M4P-2318' },
  { id: 'time', label: 'Processor time', value: '06.10.2026. 09:42:17' },
  { id: 'counter', label: 'Receipt counter', value: '2290/2318ПП' },
]

export const RECEIPT_LINK = {
  href: 'https://example.com/receipts/ZK7Q2M4P-ZK7Q2M4P-2318',
  label: 'example.com/receipts/ZK7Q2M4P-ZK7Q2M4P-2318',
}

export const DELIVERIES: readonly ReceiptDelivery[] = [
  { id: 'print', label: 'Print' },
  {
    id: 'email',
    label: 'Send by e-mail',
    address: { label: 'Customer’s e-mail', type: 'email' },
  },
  {
    id: 'sms',
    label: 'Send a link by SMS',
    address: { label: 'Customer’s mobile number', type: 'tel' },
  },
]

/** The same ways after the cashier used them: printed, e-mail sent, SMS failed. */
export const DELIVERED: readonly ReceiptDelivery[] = [
  { id: 'print', label: 'Print', state: 'sent', stateText: 'Printed' },
  {
    id: 'email',
    label: 'Send by e-mail',
    address: { label: 'Customer’s e-mail', type: 'email', defaultValue: 'ana@example.com' },
    state: 'sent',
    stateText: 'Sent to ana@example.com',
  },
  {
    id: 'sms',
    label: 'Send a link by SMS',
    address: { label: 'Customer’s mobile number', type: 'tel', defaultValue: '+381 60 000 0000' },
    state: 'failed',
    stateText: 'The SMS service did not answer. Try again in a minute.',
  },
]

// ── The fiscal receipt's printed parts (illustrative English texts) ───────────────────────────

export const FISCAL_BANNER = 'FISCAL RECEIPT'
export const FISCAL_END = 'END OF FISCAL RECEIPT'
export const NOT_FISCAL = 'THIS IS NOT A FISCAL RECEIPT'

/** The tax per label of the 1.011,00 sale (Đ 20% included: 1.011,00 × 20 / 120 = 168,50). */
export const TAX_RECAP: ReceiptRecap = {
  columns: [
    { id: 'label', label: 'Label' },
    { id: 'name', label: 'Name' },
    { id: 'rate', label: 'Rate' },
    { id: 'tax', label: 'Tax', amount: true },
  ],
  rows: [{ id: 'd', cells: { label: 'Đ', name: 'VAT', rate: '20,00%', tax: '168.50' } }],
  totals: [{ id: 'all', label: 'Total tax', value: '168.50' }],
}

// ── An open tab (P5.28 item 22) ───────────────────────────────────────────────────────────────

/** Table 3's tab: two lines sent to the bar, one new with a note, a promotion and a discount. */
export const TAB_LINES: readonly CartLine[] = [
  {
    id: 't1',
    name: 'Kapućino',
    quantity: '3',
    unit: 'pc',
    unitPrice: '220.00',
    total: '440.00',
    discount: 'Promotion 3 for 2: −220,00',
    state: { label: 'Sent to the bar · 18:15' },
  },
  {
    id: 't2',
    name: 'Limunada',
    quantity: '1',
    unit: 'pc',
    unitPrice: '250.00',
    total: '200.00',
    discount: 'Happy hour −20%: −50,00',
    state: { label: 'Sent to the bar · 18:15' },
  },
  {
    id: 't3',
    name: 'Baklava',
    quantity: '2',
    unit: 'pc',
    unitPrice: '230.00',
    total: '460.00',
    note: 'One without walnuts',
    state: { label: 'Not sent yet', tone: 'warning' },
  },
]
