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

// ── P5.17 group J ──
// Invoice F-2026-0412 on paper shows the lines and totals of its page (the same objects); they
// must add up: each tax category's lines to its base, the bases, VAT and the exempt deposit to
// the total, the total less the advance to the amount due, as in the invoice list. The report
// card's average is the school's arithmetic: the mean of the final grades to two decimals, half
// up; its hours absent add up to the subjects' and to excused and unexcused.
import {
  FIRST_ATTEMPT,
  PASS_MARK,
  PRINTED_INVOICE,
  PRINTED_LINES,
  PRINTED_TOTALS,
  REPORT_TOTALS,
  SECOND_ATTEMPT,
  SUBJECTS,
} from './data-J'

function checkGroupJ() {
  const base = (vat: string) =>
    PRINTED_LINES.filter((line) => line.vat === vat).reduce(
      (total, line) => total + paras(line.amount),
      0n,
    )
  for (const line of PRINTED_LINES) {
    if ((paras(line.price) * paras(line.quantity)) / 100n !== paras(line.amount)) {
      fail(`${PRINTED_INVOICE.number}: line ${line.id} is not quantity × price`)
    }
  }
  const totals = PRINTED_TOTALS
  if (base('S 20%') !== paras(totals.base20)) fail(`${PRINTED_INVOICE.number}: base S 20% differs`)
  if (base('S 10%') !== paras(totals.base10)) fail(`${PRINTED_INVOICE.number}: base S 10% differs`)
  if (base('E') !== paras(totals.exempt)) fail(`${PRINTED_INVOICE.number}: exempt amount differs`)
  if ((paras(totals.base20) * 20n) / 100n !== paras(totals.vat20)) fail('VAT S 20% differs')
  if ((paras(totals.base10) * 10n) / 100n !== paras(totals.vat10)) fail('VAT S 10% differs')
  const total =
    paras(totals.base20) +
    paras(totals.vat20) +
    paras(totals.base10) +
    paras(totals.vat10) +
    paras(totals.exempt)
  if (total !== paras(totals.total)) fail(`${PRINTED_INVOICE.number}: total differs from its rows`)
  if (paras(PRINTED_INVOICE.total) !== total) fail(`${PRINTED_INVOICE.number}: list total differs`)
  if (total + paras(totals.advance) !== paras(totals.due)) fail('amount due differs')
  if (paras(PRINTED_INVOICE.open) !== paras(totals.due)) fail('list amount due differs')

  // The report card: the mean of the grades in hundredths, half up.
  const sum = SUBJECTS.reduce((total, row) => total + BigInt(row.grade), 0n)
  const thousandths = (sum * 1000n) / BigInt(SUBJECTS.length)
  if ((thousandths + 5n) / 10n !== paras(REPORT_TOTALS.average)) {
    fail('report card: the average grade differs from the grades')
  }
  const absent = SUBJECTS.reduce((total, row) => total + BigInt(row.absences), 0n)
  if (absent !== BigInt(REPORT_TOTALS.absences)) fail('report card: hours absent differ')
  if (BigInt(REPORT_TOTALS.excused) + BigInt(REPORT_TOTALS.unexcused) !== absent) {
    fail('report card: excused and unexcused hours differ from the total')
  }

  // The final test: the first attempt not passed, the second passed.
  if (FIRST_ATTEMPT.passed || FIRST_ATTEMPT.correct >= PASS_MARK) fail('first attempt passes')
  if (!SECOND_ATTEMPT.passed) fail('second attempt does not pass')
}

checkGroupJ()
