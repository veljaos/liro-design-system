/*
 * The kept examples' figures checked against each other when the examples load (P4.8 "one
 * dataset", trimmed to the canonical screens in P5.89): a disagreement throws, so every example
 * story fails instead of showing two different amounts for one thing. The application's work,
 * played here; components never add.
 *
 * - A cancelled invoice (F-2026-0407) owes nothing and counts in no total, count or table.
 * - A decreased invoice (F-2026-0410, decreased by KO-2026-0009) shows its total after the
 *   decrease and owes that less what was paid, in the list and in its customer's balance.
 * - The booking's free times are free in the doctor's calendar, and the booking lands there.
 * - The till's sale and Bistro Dunav's floor add up.
 */
import { paras } from '../../../../packages/ui/src/components/amounts-story-data'
import { overlappingItems } from '../../../../packages/ui/src/components/floor-plan-logic'
import { CANCELLATION, CANCELLED_TOTALS, DECREASE, MEDIC_TOTALS } from './data-D2'
import { KNOWN_CUSTOMERS } from './data-E'
import {
  BOOKINGS_BEFORE,
  CHOSEN_DOCTOR,
  DOCTOR_EVENTS,
  FREE_SLOTS,
  JOVANA_BOOKING,
  JOVANA_SLOT,
  UNAVAILABLE,
} from './data-H'
import { cashOutcome, computeSale, QUICK_AMOUNTS, SALE, SALE_FIGURES } from './data-I'
import { BISTRO_TABLES, bistroItems } from './data-K'
import { BISTRO_VENUE, computeTab, initialTabs } from './data-K-tabs'
import { INVOICES, isOpen, LARGEST_OPEN, OVERDUE, OVERDUE_TOTAL } from './examples-story-data'

function fail(message: string): never {
  throw new Error(`Example dataset: ${message}`)
}

function invoice(number: string) {
  return INVOICES.find((each) => each.number === number) ?? fail(`${number} is missing`)
}

function balance(taxId: string): bigint {
  const customer = KNOWN_CUSTOMERS.find((each) => each.taxId === taxId)
  return customer === undefined ? fail(`customer ${taxId} is missing`) : paras(customer.balance)
}

/** What the list's open invoices of one customer owe. */
function openOf(taxId: string): bigint {
  return INVOICES.filter((each) => each.taxId === taxId && isOpen(each)).reduce(
    (total, each) => total + paras(each.open),
    0n,
  )
}

/** The checks; returns the facts they established, for the stories' play functions. */
export function checkDataset() {
  // Cancelled: F-2026-0407.
  const cancelled = invoice(CANCELLATION.invoice)
  if (cancelled.status !== 'Cancelled') fail(`${cancelled.number} is not Cancelled`)
  if (paras(cancelled.open) !== 0n) fail(`${cancelled.number} still owes ${cancelled.open}`)
  if (paras(cancelled.total) !== paras(CANCELLED_TOTALS.total)) {
    fail(`${cancelled.number}: the list's total differs from its document`)
  }
  if (isOpen(cancelled)) fail(`${cancelled.number} counts as open`)
  if (OVERDUE.includes(cancelled)) fail(`${cancelled.number} counts as overdue`)
  if (LARGEST_OPEN.includes(cancelled)) fail(`${cancelled.number} is among the largest open`)
  if (balance(cancelled.taxId) !== openOf(cancelled.taxId)) {
    fail(`${cancelled.customer}'s balance differs from its open invoices`)
  }
  for (const each of INVOICES) {
    if (each.status === 'Cancelled' && paras(each.open) !== 0n) fail(`${each.number} owes`)
  }

  // Decreased: F-2026-0410 by KO-2026-0009.
  const decreased = invoice('F-2026-0410')
  const corrected = paras(MEDIC_TOTALS.total) + paras(DECREASE.change)
  if (paras(decreased.total) !== corrected) fail(`${decreased.number}: total ignores the decrease`)
  if (paras(DECREASE.newTotal) !== corrected) fail('KO-2026-0009: new total differs')
  if (balance(decreased.taxId) !== openOf(decreased.taxId)) {
    fail(`${decreased.customer}'s balance differs from its open invoices`)
  }

  // The overview's overdue receivables: what the overdue invoices of the list still owe.
  const overdue = OVERDUE.reduce((total, each) => total + paras(each.open), 0n)
  if (paras(OVERDUE_TOTAL) !== overdue) fail('overdue receivables differ from the list')

  return { overdueCount: OVERDUE.length, overdueTotal: OVERDUE_TOTAL }
}

/** The booking's free times (F6) are free in the clinic, and the booking is in the calendar (F7). */
export function checkBooking() {
  const minutes = (local: string) => {
    const [hours = 0, mins = 0] = local.slice(11, 16).split(':').map(Number)
    return hours * 60 + mins
  }
  const overlaps = (a: { start: string; end?: string }, b: { start: string; end: string }) =>
    a.start.slice(0, 10) === b.start.slice(0, 10) &&
    minutes(a.start) < minutes(b.end) &&
    minutes(b.start) < minutes(a.end ?? a.start)
  for (const slot of FREE_SLOTS) {
    const busy = BOOKINGS_BEFORE.find(
      (each) => each.resourceId === slot.resourceId && overlaps(slot, each),
    )
    if (busy !== undefined) fail(`free time ${slot.start} is booked`)
    const away = UNAVAILABLE.find(
      (each) => each.resourceId === slot.resourceId && overlaps(slot, each),
    )
    if (away !== undefined) fail(`free time ${slot.start} is unavailable`)
  }
  const chosen = FREE_SLOTS.find((each) => each.id === JOVANA_SLOT)
  if (chosen?.start !== JOVANA_BOOKING.start) fail('Jovana’s booking is not a free time')
  const own = [...BOOKINGS_BEFORE, JOVANA_BOOKING].filter((b) => b.resourceId === CHOSEN_DOCTOR)
  if (own.some((b) => !DOCTOR_EVENTS.some((event) => event.id === b.id))) {
    fail('the doctor’s calendar misses a booking')
  }
}

/**
 * The till's sale (F7): what the screen computes from the lines equals what the data states —
 * the subtotal, the loyalty discount, the total, the tax per category, the change.
 */
export function checkTill() {
  const sale = computeSale(SALE)
  const vat = (category: string) =>
    sale.vat.find((each) => each.category === category)?.vat ?? fail(`no VAT ${category}`)
  if (sale.subtotal !== paras(SALE_FIGURES.subtotal)) fail('the till’s subtotal differs')
  if (sale.discounts !== paras(SALE_FIGURES.discounts)) fail('the till’s discount differs')
  if (sale.total !== paras(SALE_FIGURES.total)) fail('the till’s total differs')
  if (sale.subtotal - sale.discounts !== sale.total) fail('the till’s total ignores the discount')
  if (vat('E') !== paras(SALE_FIGURES.vatE)) fail('the till’s VAT 10% differs')
  if (vat('Đ') !== paras(SALE_FIGURES.vatD)) fail('the till’s VAT 20% differs')
  const first = QUICK_AMOUNTS[0] ?? fail('no banknote offered')
  if (paras(first) !== paras(SALE_FIGURES.tendered)) fail('the cash tendered is not offered')
  const cash = cashOutcome(sale.total, SALE_FIGURES.tendered)
  if (cash.change === null || paras(cash.change) !== paras(SALE_FIGURES.change)) {
    fail('the till’s change differs')
  }
}

/** Bistro Dunav's floor (F7): no two tables overlap, a party fits its table, table 7's tab. */
export function checkRestaurant() {
  const items = bistroItems(BISTRO_TABLES, (value) => value).filter((item) => item.kind === 'table')
  if (overlappingItems(items).length > 0) fail('Bistro Dunav: two tables overlap')
  for (const table of BISTRO_TABLES) {
    if (table.party?.size !== undefined && table.party.size > table.seats) {
      fail(`Bistro Dunav: table ${String(table.number)} has more guests than seats`)
    }
  }
  const t7 = initialTabs().t7
  if (t7 === undefined || computeTab(BISTRO_VENUE, t7).promotions.length !== 1) {
    fail('Bistro Dunav: table 7’s dessert promotion is missing')
  }
}

// Run once, when the examples load.
checkDataset()
checkBooking()
checkTill()
checkRestaurant()
