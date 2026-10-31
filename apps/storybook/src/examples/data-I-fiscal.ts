/*
 * The fiscal data: the till of Pekara Zlatni klas (data-I.ts) issuing
 * receipts after the Serbian fiscal system — the receipt's kind (type × transaction), seven ways to
 * pay, the buyer's ID, refunds of a receipt from the day's journal, advances and the offline queue.
 * **Illustrative:** the kinds, codes, labels, counters and rules are written from general knowledge
 * of the system, in English; every processor number, tax number and person is invented. The
 * application's arithmetic is here, in whole paras (BigInt): the remaining amount, the change, a
 * refund's amount, the advances deducted; the components add nothing. Not part of the
 * package. No classes here.
 */
import type {
  AdvanceItem,
  BuyerValue,
  ChoosableLine,
  FoundReceipt,
  PaymentOption,
  PaymentPart,
  ReceiptFact,
} from '@veljaos/ui'
import { decimal, paras, sumUnits } from '../../../../packages/ui/src/components/amounts-story-data'
import {
  BUYER_ID_TYPES,
  BUYER_OPTIONAL_TYPES,
  PAYMENT_OPTIONS,
  RECEIPT_TYPES,
  TRANSACTIONS,
} from '../../../../packages/ui/src/components/sale-story-data'
import { computeSale, type SaleLine } from './data-I'

export { BUYER_ID_TYPES, BUYER_OPTIONAL_TYPES, PAYMENT_OPTIONS, RECEIPT_TYPES, TRANSACTIONS }

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

const TILL = '/pos/zlatni-klas'

/** Where the till's menu and its offline strip lead (the journal and the report are not examples). */
export const TILL_ROUTES = {
  /** The day's receipts on the till. */
  journal: `${TILL}/journal`,
  /** The receipts waiting to be sent or refused. */
  journalQueue: `${TILL}/journal?queue`,
  /** The daily report. */
  dailyReport: `${TILL}/journal?report`,
}

// ── The fiscal device ─────────────────────────────────────────────────────────────────────────

/** Invented: the processor's signer prefix of this till and its link to check a receipt. */
export const FISCAL = {
  prefix: 'ZK7Q2M4P-ZK7Q2M4P',
  linkBase: 'https://example.com/receipts/',
  device: 'ESIR Zlatni klas 1.4',
  /** The till's local numbers for receipts issued offline. */
  localPrefix: 'ZK-01-L-',
  /** The rule of the tenant (illustrative): a refund paid out in cash is signed by the buyer. */
  signatureRule: 'A refund paid out in cash is signed by the buyer.',
  /** The rule (illustrative): a refund names the buyer. */
  refundBuyerRule: 'A refund names the buyer.',
  /** The rule (illustrative): a deferred payment names a company buyer by its tax number. */
  deferredBuyerRule: 'A wire transfer needs the buyer’s tax number.',
}

export type ReceiptTypeId = 'normal' | 'advance' | 'proforma' | 'copy' | 'training'
export type TransactionId = 'sale' | 'refund'

/** The kind's words on the screen ("Normal · Sale"). */
export function kindLabel(type: string, transaction: string): string {
  const typeLabel = RECEIPT_TYPES.find((each) => each.id === type)?.label ?? type
  const transactionLabel = TRANSACTIONS.find((each) => each.id === transaction)?.label ?? ''
  return `${typeLabel} · ${transactionLabel}`
}

/** The counter's suffix per kind (illustrative, after the system's two letters). */
const COUNTER_SUFFIX: Record<string, string> = {
  'normal-sale': 'ПП',
  'normal-refund': 'ПР',
  'advance-sale': 'АП',
  'advance-refund': 'АР',
  'proforma-sale': 'ПрП',
  'proforma-refund': 'ПрР',
  'copy-sale': 'КП',
  'copy-refund': 'КР',
  'training-sale': 'ОП',
  'training-refund': 'ОР',
}

/** The receipts' counter at the start of the example (the 2318th receipt of the till). */
export const COUNTER_START = {
  total: 2317,
  byKind: { 'normal-sale': 2289 } as Record<string, number>,
}

// ── The day's journal ─────────────────────────────────────────────────────────────────────────

/** A receipt the till issued: its kind, lines, payments, number and where it stands. */
export interface JournalEntry {
  id: string
  /** The processor's number, or the till's local number while waiting. */
  number: string
  counter: string
  /** HH:mm:ss. */
  time: string
  type: ReceiptTypeId
  transaction: TransactionId
  lines: readonly SaleLine[]
  payments: readonly PaymentPart[]
  /** 'sent' (the processor has it), 'waiting' (kept on the till), 'refused' (not accepted). */
  state: 'sent' | 'waiting' | 'refused'
  /** The processor's words when refused. */
  stateText?: string
  /** A refund's original: its number and time. */
  reference?: { number: string; time: string }
  buyer?: BuyerValue
  /** Quantities already refunded per product (an original's). */
  refunded?: Readonly<Record<string, string>>
  /** An advance's purpose ("12 krempite for Saturday"). */
  advanceText?: string
  /** A sale without compensation (a gift, a sample). */
  withoutCompensation?: boolean
}

function entry(
  counter: number,
  kindCount: number,
  time: string,
  type: ReceiptTypeId,
  transaction: TransactionId,
  lines: SaleLine[],
  payments: PaymentPart[],
  extra: Partial<JournalEntry> = {},
): JournalEntry {
  return {
    id: `r${String(counter)}`,
    number: `${FISCAL.prefix}-${String(counter)}`,
    counter: `${String(kindCount)}/${String(counter)}${COUNTER_SUFFIX[`${type}-${transaction}`] ?? ''}`,
    time,
    type,
    transaction,
    lines,
    payments,
    state: 'sent',
    ...extra,
  }
}

/**
 * An entry's total in paras: its lines' (negative for a refund); an advance's is the money taken
 * (its lines are what was ordered).
 */
export function entryTotal(each: JournalEntry): bigint {
  const total =
    each.type === 'advance'
      ? sumUnits(each.payments.map((part) => paras(part.value)))
      : computeSale(each.lines).total
  return each.transaction === 'refund' ? -total : total
}

/** The original of the refund example: 08:40, four lines with the loyalty discount on the cakes. */
const ORIGINAL: SaleLine[] = [
  { productId: 'kifla', quantity: '4' },
  { productId: 'burek-meso', quantity: '2' },
  { productId: 'jogurt', quantity: '1' },
  { productId: 'krempita', quantity: '2', discount: { rate: 10n, reason: 'Loyalty discount' } },
]

/** The day before the sale in the cart: eight receipts from 07:02. */
export const JOURNAL: readonly JournalEntry[] = [
  entry(
    2310,
    2284,
    '07:02:41',
    'normal',
    'sale',
    [
      { productId: 'beli', quantity: '2' },
      { productId: 'kifla', quantity: '3' },
    ],
    [{ id: 'p', label: 'Cash', value: '205.00' }],
  ),
  entry(
    2311,
    2285,
    '07:15:09',
    'normal',
    'sale',
    [
      { productId: 'burek-sir', quantity: '2' },
      { productId: 'jogurt', quantity: '1' },
    ],
    [{ id: 'p', label: 'Card', value: '495.00', detail: 'Mastercard •••• 1180' }],
  ),
  entry(2312, 1, '07:31:55', 'proforma', 'sale', [{ productId: 'reforma', quantity: '20' }], [], {
    buyer: { typeId: '10', id: '100100100' },
  }),
  entry(
    2313,
    12,
    '07:48:20',
    'advance',
    'sale',
    [{ productId: 'krempita', quantity: '20' }],
    [{ id: 'p', label: 'Wire transfer', value: '3000.00' }],
    { buyer: { typeId: '10', id: '100100100' } },
  ),
  entry(
    2314,
    2286,
    '08:05:12',
    'normal',
    'sale',
    [{ productId: 'kafa', quantity: '2' }],
    [{ id: 'p', label: 'Instant payment', value: '240.00' }],
  ),
  entry(
    2315,
    2287,
    '08:40:33',
    'normal',
    'sale',
    ORIGINAL,
    [{ id: 'p', label: 'Cash', value: '1011.00' }],
    { refunded: { kifla: '1' } },
  ),
  entry(
    2316,
    41,
    '08:52:06',
    'normal',
    'refund',
    [{ productId: 'kifla', quantity: '1' }],
    [{ id: 'p', label: 'Cash', value: '25.00' }],
    {
      reference: { number: `${FISCAL.prefix}-2315`, time: '06.10.2026. 08:40:33' },
      buyer: { typeId: '11', id: '0000000000000' },
    },
  ),
  entry(
    2317,
    2288,
    '09:20:47',
    'normal',
    'sale',
    [
      { productId: 'kroasan', quantity: '2' },
      { productId: 'sok', quantity: '1' },
    ],
    [{ id: 'p', label: 'Card', value: '370.00', detail: 'Visa •••• 4821' }],
  ),
]

/** The refund example's original. */
export const ORIGINAL_ID = 'r2315'

/** Offline, the last three receipts were kept on the till; two of them later refused. */
export function journalWith(state: 'online' | 'offline' | 'failed'): JournalEntry[] {
  return JOURNAL.map((each, index) => {
    if (state === 'online' || index < JOURNAL.length - 3) return each
    if (state === 'offline') {
      return { ...each, number: `${FISCAL.localPrefix}${String(index + 25)}`, state: 'waiting' }
    }
    return index === JOURNAL.length - 1
      ? each
      : {
          ...each,
          state: 'refused',
          stateText:
            'The processor refused the signature: the device’s certificate was renewed. Send again.',
        }
  })
}

/** The journal's rows as ReceiptFinder shows them. */
export function foundReceipts(entries: readonly JournalEntry[]): FoundReceipt[] {
  return entries
    .filter((each) => each.transaction === 'sale' && each.type === 'normal')
    .map((each) => ({
      id: each.id,
      number: each.number,
      date: '2026-10-06',
      time: each.time.slice(0, 5),
      total: decimal(entryTotal(each)),
      kindLabel: kindLabel(each.type, each.transaction),
      ...(each.refunded === undefined ? {} : { detail: 'One line refunded already' }),
    }))
}

/** What the cashier searched for: by number (its end), by total; the application's search. */
export function searchJournal(
  entries: readonly JournalEntry[],
  query: { number: string; total: string | null },
): FoundReceipt[] {
  return foundReceipts(entries).filter(
    (each) =>
      (query.number === '' || each.number.endsWith(query.number)) &&
      (query.total === null || paras(each.total) === paras(query.total)),
  )
}

/**
 * The one search field's text read as the application reads it: a day (as the
 * provider writes dates), an amount (as it writes numbers), or the end of a receipt's number —
 * a receipt matches any of them.
 */
export function searchJournalText(
  entries: readonly JournalEntry[],
  text: string,
  read: {
    parseDate: (text: string) => string | null
    parseNumber: (text: string) => string | null
  },
): FoundReceipt[] {
  const date = read.parseDate(text)
  const amount = read.parseNumber(text)
  return foundReceipts(entries).filter(
    (each) =>
      each.number.toLowerCase().endsWith(text.toLowerCase()) ||
      (date !== null && each.date === date) ||
      (amount !== null && paras(each.total) === paras(amount)),
  )
}

// ── Refunds ───────────────────────────────────────────────────────────────────────────────────

/** Half up, for positive amounts. */
function halfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator * 2n + denominator) / (denominator * 2n)
}

/** The original's lines as they can be refunded: what is left of each, at the price paid. */
export function refundableLines(original: JournalEntry): ChoosableLine[] {
  const sale = computeSale(original.lines)
  return sale.lines.map(({ line, product, total }) => {
    const refunded = BigInt(original.refunded?.[product.id] ?? '0')
    const left = BigInt(line.quantity) - refunded
    // The price paid for one, after the line's discount (the application's rule: half up).
    const each = halfUp(total, BigInt(line.quantity))
    return {
      id: product.id,
      name: product.name,
      ...(product.detail === undefined ? {} : { detail: product.detail }),
      available: left.toString(),
      unit: 'pc',
      unitPrice: decimal(each),
      ...(refunded === 0n
        ? line.discount === undefined
          ? {}
          : { note: `Price after the ${line.discount.reason.toLowerCase()}` }
        : { note: `${refunded.toString()} of ${line.quantity} refunded already` }),
      ...(left === 0n ? { unavailableReason: 'Refunded in full' } : {}),
    }
  })
}

/** The refund's lines and its amount: the price paid for one × the quantity chosen. */
export function refundFigures(
  original: JournalEntry,
  chosen: Readonly<Record<string, string | null>>,
): { lines: SaleLine[]; total: bigint } {
  const sale = computeSale(original.lines)
  const lines: SaleLine[] = []
  const totals: bigint[] = []
  for (const { line, product, total } of sale.lines) {
    const quantity = chosen[product.id]
    if (quantity === null || quantity === undefined || !/^\d+$/.test(quantity)) continue
    const count = BigInt(quantity)
    if (count === 0n) continue
    lines.push({
      productId: product.id,
      quantity,
      ...(line.discount === undefined ? {} : { discount: line.discount }),
    })
    totals.push(halfUp(total * count, BigInt(line.quantity)))
  }
  return { lines, total: sumUnits(totals) }
}

/** The refund example's choice: two kifle and a burek. */
export const REFUND_CHOICE: Readonly<Record<string, string | null>> = {
  kifla: '2',
  'burek-meso': '1',
}

/** The refund's buyer: a person, by an invented personal number. */
export const REFUND_BUYER: BuyerValue = { typeId: '11', id: '0101990000000' }

// ── Buyers and advances ───────────────────────────────────────────────────────────────────────

/** An invented company buyer: a restaurant ordering cakes. */
export const COMPANY_BUYER = {
  name: 'Restoran Dunavski cvet d.o.o.',
  value: { typeId: '10', id: '100100100' } as BuyerValue,
  /** Its corporate card's last digits in the optional field. */
  card: { typeId: '10', id: '100100100', optionalTypeId: '30', optional: '7310' } as BuyerValue,
}

/** The restaurant's open advances (invented). */
export const COMPANY_ADVANCES: readonly AdvanceItem[] = [
  {
    id: 'a2201',
    number: `${FISCAL.prefix}-2201`,
    date: '2026-09-28',
    paid: '5000.00',
    open: '5000.00',
    state: { label: 'Open', tone: 'neutral' },
    note: 'Wedding cake, 120 slices, for 10.10.2026.',
  },
  {
    id: 'a2265',
    number: `${FISCAL.prefix}-2265`,
    date: '2026-10-02',
    paid: '3000.00',
    open: '1200.00',
    state: { label: 'Partly used', tone: 'warning' },
    note: 'Cakes for the restaurant, weekly',
  },
]

/** The advances deducted from a sale: what is open, at most the sale's total. In paras. */
export function advanceDeduction(total: bigint, chosen: readonly string[]): bigint {
  const open = sumUnits(
    COMPANY_ADVANCES.filter((each) => chosen.includes(each.id)).map((each) => paras(each.open)),
  )
  return open < total ? open : total
}

/** The advance taken in the example: for 12 cakes on Saturday. */
export const ADVANCE_TAKEN = { amount: '2000', note: '12 krempite for Saturday, 10.10.2026.' }

// ── Payments ──────────────────────────────────────────────────────────────────────────────────

/** The ways to pay, the wire transfer unavailable until a company buyer is named. */
export function paymentOptionsFor(buyer: BuyerValue | null): PaymentOption[] {
  return PAYMENT_OPTIONS.map((each) =>
    each.id === 'wire' && (buyer?.typeId !== '10' || buyer.id === '')
      ? { ...each, unavailableReason: FISCAL.deferredBuyerRule }
      : each,
  )
}

/** What remains after the parts, and the change from the cash tendered. Null when none. */
export function paymentFigures(
  total: bigint,
  parts: readonly PaymentPart[],
  tendered: string | null,
  cash: boolean,
): { remaining: bigint; remainingText: string | null; change: string | null } {
  const paid = sumUnits(parts.map((each) => paras(each.value)))
  const remaining = total - paid
  if (!cash || tendered === null) {
    return { remaining, remainingText: decimal(remaining), change: null }
  }
  const given = paras(tendered)
  return given >= remaining
    ? { remaining, remainingText: null, change: decimal(given - remaining) }
    : { remaining, remainingText: decimal(remaining - given), change: null }
}

/** The mixed example: a voucher of 500,00 and 1.000,00 by card for the 1.907,00 sale. */
export const MIXED_PARTS: readonly PaymentPart[] = [
  { id: 'voucher-1', label: 'Voucher', value: '500.00', detail: 'VC-2026-7741' },
  { id: 'card-1', label: 'Card', value: '1000.00', detail: 'Visa •••• 4821', state: 'approved' },
]

// ── An issued receipt ─────────────────────────────────────────────────────────────────────────

/** The facts of an issued receipt: the processor's number and time, the counter. */
export function issuedFacts(each: JournalEntry): ReceiptFact[] {
  return each.state === 'sent'
    ? [
        { id: 'number', label: 'Processor receipt number', value: each.number },
        { id: 'time', label: 'Processor time', value: `06.10.2026. ${each.time}` },
        { id: 'counter', label: 'Receipt counter', value: each.counter },
      ]
    : [
        { id: 'number', label: 'Local number', value: each.number },
        { id: 'time', label: 'Issued', value: `06.10.2026. ${each.time}` },
      ]
}

/** The next receipt the till issues: the next counters, the processor's time of the example. */
export function nextEntry(
  journal: readonly JournalEntry[],
  init: Omit<JournalEntry, 'id' | 'number' | 'counter' | 'time' | 'state'> & {
    offline?: boolean
    time?: string
  },
): JournalEntry {
  const counter = COUNTER_START.total + 1 + journal.length - JOURNAL.length
  const key = `${init.type}-${init.transaction}`
  const kindCount =
    journal.filter((each) => `${each.type}-${each.transaction}` === key).length +
    (key === 'normal-sale' ? 2284 : key === 'normal-refund' ? 40 : 1)
  const { offline, time, ...rest } = init
  return {
    ...rest,
    id: `r${String(counter)}`,
    number:
      offline === true
        ? `${FISCAL.localPrefix}${String(counter - 2290)}`
        : `${FISCAL.prefix}-${String(counter)}`,
    counter: `${String(kindCount)}/${String(counter)}${COUNTER_SUFFIX[key] ?? ''}`,
    time: time ?? '09:42:17',
    state: offline === true ? 'waiting' : 'sent',
  }
}
