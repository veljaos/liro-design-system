/*
 * The examples' figures checked against each other when the examples load (P4.8 "one dataset",
 * extended for corrective documents in P5): a disagreement throws, so every example story fails
 * instead of showing two different amounts for one invoice. The application's work, played here;
 * components never add. No classes here.
 *
 * - A cancelled invoice (F-2026-0407, cancelled by ST-2026-0004) owes nothing and counts in no
 *   total, count or table: not open, not overdue, not in the overview's largest open invoices,
 *   not in the bank matching's open items, its customer's balance without it.
 * - A decreased invoice (F-2026-0410, decreased by KO-2026-0009) shows its total after the
 *   decrease and owes that less what was paid, in the list, on its page, in the overview, in its
 *   customer's balance.
 */
import { paras } from '../../../../packages/ui/src/components/amounts-story-data'
import { TOTALS_0410 } from './data-A'
import { CANCELLATION, CANCELLED_TOTALS, DECREASE, MEDIC_TOTALS } from './data-D2'
import { KNOWN_CUSTOMERS } from './data-E'
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
  if (paras(TOTALS_0410.corrected) !== corrected) fail(`${decreased.number}: page total differs`)
  if (paras(TOTALS_0410.due) !== paras(decreased.open))
    fail(`${decreased.number}: page due differs`)
  if (paras(DECREASE.newTotal) !== corrected) fail('KO-2026-0009: new total differs')
  if (balance(decreased.taxId) !== openOf(decreased.taxId)) {
    fail(`${decreased.customer}'s balance differs from its open invoices`)
  }

  // The overview's overdue receivables: what the overdue invoices of the list still owe.
  const overdue = OVERDUE.reduce((total, each) => total + paras(each.open), 0n)
  if (paras(OVERDUE_TOTAL) !== overdue) fail('overdue receivables differ from the list')

  return { overdueCount: OVERDUE.length, overdueTotal: OVERDUE_TOTAL }
}

/** Run once, when the examples load. */
export const DATASET = checkDataset()
