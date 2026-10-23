/*
 * Open tabs on tables (P5.28 item 22): Bistro Dunav's service keeps a tab on every open table —
 * what was ordered, what was sent to the bar or the kitchen and when, notes, discounts, what was
 * paid already — so the waiter adds items, leaves and comes back. The tabs live in the examples'
 * application above the screens (`useExampleState`). The promotions (the dessert of the day), the
 * discounts, the stations and every figure are the application's: computed here in whole paras
 * (BigInt) — line, promotion, discount, order discount, the tax included, what is paid and what
 * remains, equal shares; the components add nothing (D4). Fictitious. Not part of the package. No
 * classes here.
 */
import type { PosProduct, ProductCategory } from '@veljaos/ui'
import { decimal, paras, sumUnits } from '../../../../packages/ui/src/components/amounts-story-data'
import { BISTRO, BISTRO_TABLES, K_ROUTES } from './data-K'

// ── Venues ────────────────────────────────────────────────────────────────────────────────────

/** Where an item is prepared: the order is sent there. */
export interface Station {
  id: string
  /** "the bar", "the kitchen", in the sentence "Sent to the bar". */
  label: string
}

/** A promotion from the application's data. */
export type Promotion =
  | {
      id: string
      label: string
      /** Every `n`th of these products is free ("3 for 2": n 3, free 1). */
      kind: 'n-for-m'
      productIds: readonly string[]
      n: number
      free: number
    }
  | {
      id: string
      label: string
      /** A rate off these products between two times ("Happy hour"). */
      kind: 'percent'
      productIds: readonly string[]
      rate: bigint
      from: string
      to: string
    }

/** A discount the waiter may give, the application's list. */
export interface DiscountChoice {
  id: string
  label: string
  rate: bigint
}

/** A table that can take a tab. */
export interface TabTable {
  id: string
  number: number
  /** Its area ("Sala", "Terasa"). */
  area: string
  seats: number
}

export interface Venue {
  id: 'bistro'
  name: string
  brand: string
  register: string
  waiter: string
  currency: string
  /** The service's clock (HH:mm), the application's. */
  now: string
  products: readonly PosProduct[]
  categories: readonly ProductCategory[]
  /** The station of each category. */
  stations: Readonly<Record<string, Station>>
  promotions: readonly Promotion[]
  discounts: readonly DiscountChoice[]
  tables: readonly TabTable[]
  /** The floor's route and words ("Floor"). */
  back: { route: string; label: string }
  /** A table's tab route. */
  tableRoute: (tableId: string) => string
}

const BAR: Station = { id: 'bar', label: 'the bar' }
const KITCHEN: Station = { id: 'kitchen', label: 'the kitchen' }

const DISCOUNTS: readonly DiscountChoice[] = [
  { id: 'regular', label: 'Regular guest −10%', rate: 10n },
  { id: 'manager', label: 'Manager’s discount −20%', rate: 20n },
  { id: 'staff', label: 'Staff −50%', rate: 50n },
]

/**
 * Bistro Dunav's menu (fictitious). "Most sold" is the application's: tonight's most ordered
 * items, first and chosen when a tab opens (P5.90 item 20), so most taps need no category.
 */
const MOST_SOLD = ['pivo', 'limunada', 'cevapi', 'pastrmka', 'voda', 'palacinke']

const BISTRO_CATEGORIES: readonly ProductCategory[] = [
  { id: 'top', label: 'Most sold' },
  { id: 'starters', label: 'Predjela' },
  { id: 'mains', label: 'Glavna jela' },
  { id: 'desserts', label: 'Dezerti' },
  { id: 'drinks', label: 'Pića' },
]

const MENU: readonly PosProduct[] = [
  { id: 'proja', name: 'Proja sa sirom', price: '390.00', categoryId: 'starters' },
  { id: 'corba', name: 'Riblja čorba', price: '520.00', categoryId: 'starters' },
  { id: 'pastrmka', name: 'Pastrmka na žaru', price: '1450.00', categoryId: 'mains' },
  { id: 'smudj', name: 'Smuđ sa blitvom', price: '1890.00', categoryId: 'mains' },
  { id: 'cevapi', name: 'Ćevapi, 10 kom.', price: '980.00', categoryId: 'mains' },
  {
    id: 'pljeskavica',
    name: 'Gurmanska pljeskavica',
    price: '1120.00',
    categoryId: 'mains',
    unavailableReason: 'Sold out tonight',
  },
  { id: 'palacinke', name: 'Palačinke sa orasima', price: '420.00', categoryId: 'desserts' },
  { id: 'krempita', name: 'Krempita', price: '380.00', categoryId: 'desserts' },
  { id: 'vino', name: 'Belo vino, 0,15', price: '420.00', categoryId: 'drinks' },
  { id: 'pivo', name: 'Točeno pivo 0,5', price: '350.00', categoryId: 'drinks' },
  { id: 'voda', name: 'Kisela voda 0,33', price: '220.00', categoryId: 'drinks' },
  { id: 'limunada', name: 'Limunada', price: '320.00', categoryId: 'drinks' },
]

/** The menu with the most sold items first, each also under "Most sold". */
const BISTRO_PRODUCTS: readonly PosProduct[] = [
  ...MOST_SOLD.flatMap((id) => MENU.filter((product) => product.id === id)),
  ...MENU.filter((product) => !MOST_SOLD.includes(product.id)),
].map((product) =>
  MOST_SOLD.includes(product.id) ? { ...product, categoryIds: ['top'] } : product,
)

export const BISTRO_VENUE: Venue = {
  id: 'bistro',
  name: BISTRO.name,
  brand: 'Bistro Dunav',
  register: 'Kasa Sala',
  waiter: 'Nemanja Lukić',
  currency: 'RSD',
  now: BISTRO.now,
  products: BISTRO_PRODUCTS,
  categories: BISTRO_CATEGORIES,
  stations: { starters: KITCHEN, mains: KITCHEN, desserts: KITCHEN, drinks: BAR },
  promotions: [
    {
      id: 'dessert-of-the-day',
      label: 'Dessert of the day −15%',
      kind: 'percent',
      productIds: ['palacinke'],
      rate: 15n,
      from: '12:00',
      to: '23:00',
    },
  ],
  discounts: DISCOUNTS,
  tables: BISTRO_TABLES.map((each) => ({
    id: each.id,
    number: each.number,
    area: each.areaId === 'sala' ? 'Sala' : each.areaId === 'terasa' ? 'Terasa' : 'Bar',
    seats: each.seats,
  })),
  back: { route: K_ROUTES.floor, label: 'Floor' },
  tableRoute: (id) => `/restaurant/bistro-dunav/tables/${id}`,
}

// ── Tabs ──────────────────────────────────────────────────────────────────────────────────────

/** A line of a tab. */
export interface TabLine {
  id: string
  productId: string
  /** Whole pieces. */
  quantity: number
  note?: string
  /** A discount from the venue's list. */
  discountId?: string
  /** When it was sent to its station (HH:mm); absent while not sent. */
  sentAt?: string
  /**
   * Held for a later course (P5.90 item 20): not sent when the waiter leaves the table, only with
   * "Send held".
   */
  held?: boolean
  /** Pieces paid already (a part paid by items). */
  paid?: number
}

/** A payment taken on the tab before it is closed, with its receipt. */
export interface TabPayment {
  id: string
  /** The way it was paid ("Card"). */
  label: string
  /** A decimal string. */
  amount: string
  /** What it paid ("Share 1 of 4", "2 × Kapućino"). */
  what: string
  /** The receipt issued for it (invented processor number). */
  receipt: string
}

export interface Tab {
  tableId: string
  /** Opened at (HH:mm). */
  openedAt: string
  lines: TabLine[]
  orderDiscountId?: string
  payments: TabPayment[]
}

/** Bistro Dunav's tabs open when the examples start. */
export function initialTabs(): Record<string, Tab> {
  return {
    t1: {
      tableId: 't1',
      openedAt: '19:05',
      lines: [
        { id: 'b1-1', productId: 'vino', quantity: 2, sentAt: '19:07' },
        { id: 'b1-2', productId: 'proja', quantity: 1, sentAt: '19:07' },
      ],
      payments: [],
    },
    t5: {
      tableId: 't5',
      openedAt: '19:20',
      lines: [
        { id: 'b5-1', productId: 'corba', quantity: 3, sentAt: '19:24' },
        { id: 'b5-2', productId: 'voda', quantity: 2, sentAt: '19:24' },
      ],
      payments: [],
    },
    t7: {
      tableId: 't7',
      openedAt: '18:50',
      lines: [
        { id: 'b7-1', productId: 'pivo', quantity: 3, sentAt: '18:52' },
        { id: 'b7-2', productId: 'limunada', quantity: 2, sentAt: '18:52' },
        { id: 'b7-3', productId: 'pastrmka', quantity: 2, sentAt: '19:01' },
        {
          id: 'b7-4',
          productId: 'cevapi',
          quantity: 2,
          sentAt: '19:01',
          note: 'One without onion',
        },
        { id: 'b7-5', productId: 'smudj', quantity: 1, sentAt: '19:01' },
        // The desserts wait for the main course to be eaten.
        { id: 'b7-6', productId: 'palacinke', quantity: 2, held: true },
      ],
      payments: [],
    },
    t13: {
      tableId: 't13',
      openedAt: '19:30',
      lines: [{ id: 'b13-1', productId: 'limunada', quantity: 2, sentAt: '19:31' }],
      payments: [],
    },
    t16: {
      tableId: 't16',
      openedAt: '19:10',
      lines: [{ id: 'b16-1', productId: 'pivo', quantity: 2, sentAt: '19:12' }],
      payments: [],
    },
    t18: {
      tableId: 't18',
      openedAt: '19:35',
      lines: [{ id: 'b18-1', productId: 'vino', quantity: 1, sentAt: '19:36' }],
      payments: [],
    },
  }
}

// ── The application's arithmetic ──────────────────────────────────────────────────────────────

/** Half up, for positive amounts. */
function halfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator * 2n + denominator) / (denominator * 2n)
}

/** Whether a time (HH:mm) is within [from, to). */
function within(now: string, from: string, to: string): boolean {
  return now >= from && now < to
}

export interface ComputedTabLine {
  line: TabLine
  product: PosProduct
  gross: bigint
  /** The promotion that applies and its amount. */
  promotion?: { label: string; amount: bigint }
  /** The waiter's discount and its amount. */
  discount?: { label: string; amount: bigint }
  total: bigint
}

/** A tab's figures: lines, promotions, discounts, the order discount, the tax, paid, remaining. */
export function computeTab(venue: Venue, tab: Tab) {
  const lines: ComputedTabLine[] = tab.lines.flatMap((line) => {
    const product = venue.products.find((each) => each.id === line.productId)
    if (product === undefined) return []
    const price = paras(product.price)
    const gross = price * BigInt(line.quantity)
    let promotion: ComputedTabLine['promotion']
    for (const each of venue.promotions) {
      if (!each.productIds.includes(product.id)) continue
      if (each.kind === 'n-for-m') {
        const free = BigInt(Math.floor(line.quantity / each.n) * each.free)
        if (free > 0n) promotion = { label: each.label, amount: price * free }
      } else if (within(venue.now, each.from, each.to)) {
        promotion = { label: each.label, amount: halfUp(gross * each.rate, 100n) }
      }
    }
    const afterPromotion = gross - (promotion?.amount ?? 0n)
    const choice = venue.discounts.find((each) => each.id === line.discountId)
    const discount =
      choice === undefined
        ? undefined
        : { label: choice.label, amount: halfUp(afterPromotion * choice.rate, 100n) }
    return [
      {
        line,
        product,
        gross,
        ...(promotion === undefined ? {} : { promotion }),
        ...(discount === undefined ? {} : { discount }),
        total: afterPromotion - (discount?.amount ?? 0n),
      },
    ]
  })
  const subtotal = sumUnits(lines.map((each) => each.gross))
  const promotions = new Map<string, bigint>()
  for (const each of lines) {
    if (each.promotion !== undefined) {
      promotions.set(
        each.promotion.label,
        (promotions.get(each.promotion.label) ?? 0n) + each.promotion.amount,
      )
    }
  }
  const lineDiscounts = sumUnits(lines.map((each) => each.discount?.amount ?? 0n))
  const linesTotal = sumUnits(lines.map((each) => each.total))
  const orderChoice = venue.discounts.find((each) => each.id === tab.orderDiscountId)
  const orderDiscount = orderChoice === undefined ? 0n : halfUp(linesTotal * orderChoice.rate, 100n)
  const total = linesTotal - orderDiscount
  // VAT 20% included: total × 20 / 120, half up.
  const vat = halfUp(total * 20n, 120n)
  const paid = sumUnits(tab.payments.map((each) => paras(each.amount)))
  return {
    lines,
    subtotal,
    promotions: [...promotions.entries()],
    lineDiscounts,
    orderDiscount:
      orderChoice === undefined ? null : { label: orderChoice.label, amount: orderDiscount },
    total,
    vat,
    paid,
    remaining: total - paid,
  }
}

/** What chosen pieces of the lines cost, after their promotions, discounts and the order's. */
export function itemsAmount(
  venue: Venue,
  tab: Tab,
  chosen: Readonly<Record<string, string | null>>,
): bigint {
  const figures = computeTab(venue, tab)
  const rate = venue.discounts.find((each) => each.id === tab.orderDiscountId)?.rate ?? 0n
  return sumUnits(
    figures.lines.map((each) => {
      const quantity = chosen[each.line.id]
      if (quantity === null || quantity === undefined || !/^\d+$/.test(quantity)) return 0n
      const part = halfUp(each.total * BigInt(quantity), BigInt(each.line.quantity))
      return part - halfUp(part * rate, 100n)
    }),
  )
}

/** Equal shares of what remains: all but the last rounded half up, the last the rest. */
export function equalShares(remaining: bigint, people: number): bigint[] {
  if (people < 1 || remaining <= 0n) return []
  const share = halfUp(remaining, BigInt(people))
  return Array.from({ length: people }, (_, index) =>
    index === people - 1 ? remaining - share * BigInt(people - 1) : share,
  )
}

/**
 * The lines waiting to be sent, by station: "2 to the bar, 1 to the kitchen" — the new ones
 * ('new': not sent, not held), or those held for a later course ('held').
 */
export function unsentByStation(
  venue: Venue,
  tab: Tab,
  which: 'new' | 'held' = 'new',
): { station: Station; count: number }[] {
  const counts = new Map<string, { station: Station; count: number }>()
  for (const line of tab.lines) {
    if (line.sentAt !== undefined || (line.held === true) !== (which === 'held')) continue
    const product = venue.products.find((each) => each.id === line.productId)
    if (product === undefined) continue
    const station = venue.stations[product.categoryId ?? ''] ?? BAR
    const entry = counts.get(station.id) ?? { station, count: 0 }
    entry.count += line.quantity
    counts.set(station.id, entry)
  }
  return [...counts.values()]
}

/**
 * Sends the new lines (or the held ones) to their stations at `now` (P5.90 item 20): the till
 * sends by itself when the waiter leaves the table, and on "Send now" / "Send held". Returns the
 * tab and what went where; the sending itself is the application's.
 */
export function sendLines(
  venue: Venue,
  tab: Tab,
  now: string,
  which: 'new' | 'held' = 'new',
): { tab: Tab; sent: { station: Station; count: number }[] } {
  const sent = unsentByStation(venue, tab, which)
  return {
    tab: {
      ...tab,
      lines: tab.lines.map((line) => {
        if (line.sentAt !== undefined || (line.held === true) !== (which === 'held')) return line
        const next: TabLine = { ...line, sentAt: now }
        delete next.held
        return next
      }),
    },
    sent,
  }
}

/** "2 to the kitchen, 1 to the bar". */
export function sentText(sent: readonly { station: Station; count: number }[]): string {
  return sent.map((each) => `${String(each.count)} to ${each.station.label}`).join(', ')
}

/** How many pieces of each product the tab holds (the tiles' counts). */
export function inOrder(tab: Tab | undefined): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const line of tab?.lines ?? []) {
    counts[line.productId] = (counts[line.productId] ?? 0) + line.quantity
  }
  return counts
}

/** Moves the chosen pieces (or every line) to another table's tab, joining it when open. */
export function moveItems(
  tabs: Readonly<Record<string, Tab>>,
  from: string,
  to: string,
  chosen: Readonly<Record<string, string | null>> | 'all',
  now: string,
): Record<string, Tab> {
  const source = tabs[from]
  if (source === undefined || from === to) return { ...tabs }
  const target: Tab = tabs[to] ?? { tableId: to, openedAt: now, lines: [], payments: [] }
  const moved: TabLine[] = []
  const kept: TabLine[] = []
  for (const line of source.lines) {
    const take =
      chosen === 'all'
        ? line.quantity
        : Math.min(line.quantity, Number.parseInt(chosen[line.id] ?? '0', 10) || 0)
    if (take > 0) moved.push({ ...line, id: `${line.id}-to-${to}`, quantity: take, paid: 0 })
    if (line.quantity - take > 0) kept.push({ ...line, quantity: line.quantity - take })
  }
  const next: Record<string, Tab> = { ...tabs }
  next[to] = { ...target, lines: [...target.lines, ...moved] }
  if (chosen === 'all' || kept.length === 0) {
    const rest: Record<string, Tab> = {}
    for (const [id, tab] of Object.entries(next)) if (id !== from) rest[id] = tab
    return rest
  }
  next[from] = { ...source, lines: kept }
  return next
}

/** Marks the chosen pieces paid. */
export function markPaid(tab: Tab, chosen: Readonly<Record<string, string | null>>): Tab {
  return {
    ...tab,
    lines: tab.lines.map((line) => {
      const quantity = Number.parseInt(chosen[line.id] ?? '0', 10) || 0
      return quantity === 0 ? line : { ...line, paid: (line.paid ?? 0) + quantity }
    }),
  }
}

/** The tab's total for the floor's label ("18:15 · 1.200,00 RSD"), a decimal string. */
export function tabTotal(venue: Venue, tab: Tab | undefined): string | null {
  return tab === undefined || tab.lines.length === 0
    ? null
    : decimal(computeTab(venue, tab).remaining)
}

/** The receipts the example issues for a tab's payments (invented processor numbers). */
export function tabReceiptNumber(count: number): string {
  return `BD5R2N7X-BD5R2N7X-${String(1200 + count)}`
}
