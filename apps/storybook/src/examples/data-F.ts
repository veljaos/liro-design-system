/*
 * Group F's example data (P5.21): journal entry NK-2026-0912 and the September 2026 payroll for
 * 46 employees of Kvadrat Gradnja d.o.o. (bank statement 188 moved to data-bank.ts in P5.23).
 * Amounts are whole paras (BigInt) and every total is computed here, as the Core would; the
 * components add nothing. Not part of the package. No classes here.
 */
import {
  decimal as decimalOf,
  paras as parasOf,
  sumUnits as sumParas,
} from '../../../../packages/ui/src/components/amounts-story-data'
import {
  payrollLines,
  payrollTotals,
} from '../../../../packages/ui/src/templates/periodic-run-story-data'

export { decimalOf, parasOf, sumParas }

// ── Journal entry NK-2026-0912 ────────────────────────────────────────────────────────────────

export interface JournalLine {
  id: string
  account: { value: string; label: string } | null
  text: string
  /** A decimal string, or null when the line has no debit. */
  debit: string | null
  credit: string | null
}

export const ACCOUNTS = [
  { value: '2040', label: '2040 Customers in the country' },
  { value: '2410', label: '2410 Current account, Banca Intesa' },
  { value: '2700', label: '2700 Input VAT 20%' },
  { value: '4350', label: '4350 Suppliers in the country' },
  { value: '5120', label: '5120 Construction materials' },
  { value: '5330', label: '5330 Equipment rental' },
  { value: '5530', label: '5530 Bank charges' },
]

function account(value: string) {
  return ACCOUNTS.find((each) => each.value === value) ?? null
}

/** The supplier invoice UF-2026-1204 of Gradska mehanizacija d.o.o.: material, crane, VAT. */
export const JOURNAL = {
  number: 'NK-2026-0912',
  date: '2026-10-06',
  journal: 'General journal',
  document: 'UF-2026-1204',
  supplier: 'Gradska mehanizacija d.o.o.',
}

const MATERIAL = 84_600_00n
const CRANE = 36_000_00n
/** VAT 20% of the base, computed in whole paras. */
const VAT = ((MATERIAL + CRANE) * 20n) / 100n
const SUPPLIER = MATERIAL + CRANE + VAT

export const JOURNAL_LINES: JournalLine[] = [
  {
    id: '1',
    account: account('5120'),
    text: 'Concrete C25/30, Temerinski put',
    debit: decimalOf(MATERIAL),
    credit: null,
  },
  {
    id: '2',
    account: account('5330'),
    text: 'Crane rental, September',
    debit: decimalOf(CRANE),
    credit: null,
  },
  { id: '3', account: account('2700'), text: 'Input VAT 20%', debit: decimalOf(VAT), credit: null },
  {
    id: '4',
    account: account('4350'),
    text: 'Gradska mehanizacija d.o.o., UF-2026-1204',
    debit: null,
    credit: decimalOf(SUPPLIER),
  },
]

/** The same entry with the supplier's amount mistyped: 2.000,00 RSD short. */
export const JOURNAL_LINES_UNBALANCED: JournalLine[] = JOURNAL_LINES.map((each) =>
  each.id === '4' ? { ...each, credit: decimalOf(SUPPLIER - 2_000_00n) } : each,
)

/** Debit, credit and their difference in whole paras; whether every line has an amount. */
export function journalBalance(lines: readonly JournalLine[]) {
  const debit = sumParas(lines.map((each) => (each.debit === null ? 0n : parasOf(each.debit))))
  const credit = sumParas(lines.map((each) => (each.credit === null ? 0n : parasOf(each.credit))))
  const missing = lines.filter((each) => each.debit === null && each.credit === null)
  const both = lines.filter((each) => each.debit !== null && each.credit !== null)
  return {
    debit: decimalOf(debit),
    credit: decimalOf(credit),
    difference: decimalOf(debit - credit),
    absoluteDifference: decimalOf(debit < credit ? credit - debit : debit - credit),
    state:
      missing.length > 0 || both.length > 0
        ? ('incomplete' as const)
        : debit === credit
          ? ('balanced' as const)
          : ('unbalanced' as const),
    missing: missing.map((each) => each.id),
    both: both.map((each) => each.id),
  }
}

// ── Payroll September 2026 ────────────────────────────────────────────────────────────────────

/** 46 employees of Kvadrat Gradnja d.o.o. (Jelena Marković among them), computed in paras. */
export const PAYROLL_LINES = payrollLines(46)
export const PAYROLL_TOTALS = payrollTotals(PAYROLL_LINES)

export const PAYROLL_STEPS = [
  { key: 'prepare', label: 'Prepare', description: '01.10.2026.' },
  { key: 'calculate', label: 'Calculate', description: '05.10.2026.' },
  { key: 'review', label: 'Review' },
  { key: 'post', label: 'Post' },
  { key: 'send', label: 'Send' },
]

export const RERUN_REASONS = [
  { value: 'hours', label: 'Corrected working hours' },
  { value: 'sick', label: 'Sick leave reported late' },
  { value: 'bonus', label: 'A bonus was approved' },
  { value: 'other', label: 'Other' },
]
