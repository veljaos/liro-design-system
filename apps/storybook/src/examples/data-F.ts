/*
 * Group F's example data (P5.21): bank statement 188 of 6 October 2026 (Banca Intesa) matched
 * against the open invoices of Kvadrat Gradnja d.o.o., journal entry NK-2026-0912 and the
 * September 2026 payroll for 46 employees. Amounts are whole paras (BigInt) and every total is
 * computed here, as the Core would; the components add nothing. The invoices F-2026-0403 to
 * F-2026-0412 are the dataset's (examples-story-data.ts) with their open amounts; F-2026-0381 to
 * F-2026-0402 are earlier invoices of the same customers, open on 6 October. F-2026-0407 (cancelled,
 * group D2) and F-2026-0408 (a draft) are not open items. Not part of the package. No classes here.
 */
import {
  decimalOf,
  parasOf,
  sumParas,
  type MatchingEntry,
  type MatchRecord,
  type SuggestionRecord,
} from '../../../../packages/ui/src/components/matching-story-data'
import {
  payrollLines,
  payrollTotals,
} from '../../../../packages/ui/src/templates/periodic-run-story-data'
import { INVOICES, isOpen } from './examples-story-data'

export { decimalOf, parasOf, sumParas }

// ── Bank statement 188 ────────────────────────────────────────────────────────────────────────

export const STATEMENT = {
  number: '188',
  date: '2026-10-06',
  bank: 'Banca Intesa',
  account: '160-0000000456789-12',
  /** The balance before the statement, from the bank. */
  opening: 1_284_550_17n,
}

/** A statement line: in (positive) or out (negative), with the payer and the reference. */
export interface StatementLine extends MatchingEntry {
  /** What the bank reports as the payer or payee. */
  party: string
  /** The reference the payer wrote, or "" when none. */
  reference: string
  /** Fees and interest are booked to an account, not matched to invoices. */
  bankItem?: boolean
}

function line(
  index: number,
  party: string,
  reference: string,
  paras: bigint,
  bankItem = false,
): StatementLine {
  return {
    id: `b${String(index)}`,
    label: `Line ${String(index)}, ${party}`,
    title: party,
    subtitle: `Line ${String(index)} · ${reference === '' ? 'No reference' : `Ref. ${reference}`}`,
    party,
    reference,
    paras,
    ...(bankItem ? { bankItem } : {}),
  }
}

/** The 14 lines of statement 188. */
export const STATEMENT_LINES: StatementLine[] = [
  line(1, 'Panonija Agro d.o.o.', '97 F-2026-0412', 135_954_00n),
  line(2, 'Drina Prevoz d.o.o.', 'F-2026-0411', 58_440_00n),
  line(3, 'Medic Lab Niš d.o.o.', 'F-2026-0410', 50_000_00n),
  line(4, 'Zlatibor Turs d.o.o.', '', 33_612_80n),
  line(5, 'Panonija Agro d.o.o.', '97 F-2026-0403', 247_809_12n),
  line(6, 'Vojvođanka Mlin a.d.', 'F-2026-0392, F-2026-0390', 214_260_00n),
  line(7, 'Stanić Elektro STR', 'F-2026-0396', 41_280_00n),
  line(8, 'Rakić Pekara SZR', 'F-2026-0388', 18_960_00n),
  line(9, 'Knjigovodstvo Jelić', 'F-2026-0385', 14_400_00n),
  line(10, 'Bojović i sinovi d.o.o.', 'Plaćanje F-399', 72_150_00n),
  line(11, 'Petar Jovanović', 'Uplata', 12_000_00n),
  line(12, 'Banca Intesa', 'Account fee, September', -1_240_00n, true),
  line(13, 'Drina Prevoz d.o.o.', 'F-2026-0402', 26_880_00n),
  line(14, 'Banca Intesa', 'Interest, September', 312_40n, true),
]

/** An open invoice of the dataset or an earlier one, with what is still to be paid. */
export interface OpenInvoice extends MatchingEntry {
  customer: string
  due: string
}

function invoice(number: string, customer: string, due: string, open: bigint): OpenInvoice {
  return {
    id: number,
    label: `${number}, ${customer}`,
    title: number,
    subtitle: customer,
    customer,
    due,
    paras: open,
  }
}

/** The dataset's invoices still open on 6 October (not paid, not drafts, not cancelled). */
const DATASET_OPEN = INVOICES.filter((each) => each.status !== 'Paid' && isOpen(each)).map((each) =>
  invoice(each.number, each.customer, each.due, parasOf(each.open)),
)

/** Earlier invoices of the same customers, open on 6 October. */
const EARLIER_OPEN: OpenInvoice[] = [
  invoice('F-2026-0402', 'Drina Prevoz d.o.o.', '2026-10-08', 26_880_00n),
  invoice('F-2026-0399', 'Bojović i sinovi d.o.o.', '2026-10-05', 72_150_00n),
  invoice('F-2026-0396', 'Stanić Elektro STR', '2026-10-04', 41_280_00n),
  invoice('F-2026-0394', 'Panonija Agro d.o.o.', '2026-10-12', 54_312_00n),
  invoice('F-2026-0392', 'Vojvođanka Mlin a.d.', '2026-10-01', 128_700_00n),
  invoice('F-2026-0390', 'Vojvođanka Mlin a.d.', '2026-09-29', 85_560_00n),
  invoice('F-2026-0388', 'Rakić Pekara SZR', '2026-09-30', 18_960_00n),
  invoice('F-2026-0385', 'Knjigovodstvo Jelić', '2026-09-27', 14_400_00n),
  invoice('F-2026-0381', 'Medic Lab Niš d.o.o.', '2026-09-25', 19_800_00n),
]

/** The open invoices, newest first. */
export const OPEN_INVOICES: OpenInvoice[] = [...DATASET_OPEN, ...EARLIER_OPEN]

/** Lines 7, 8 and 9 were matched when the statement was imported (exact amount and reference). */
function imported(left: string, right: string, paras: bigint): MatchRecord {
  return {
    id: `import-${left}`,
    left: [{ id: left, paras }],
    right: [{ id: right, paras }],
    how: 'Matched at import: exact amount and reference',
  }
}

export const IMPORT_MATCHES: MatchRecord[] = [
  imported('b7', 'F-2026-0396', 41_280_00n),
  imported('b8', 'F-2026-0388', 18_960_00n),
  imported('b9', 'F-2026-0385', 14_400_00n),
]

/** The Core's suggestions for the rest; line 10's reference is malformed, line 11's payer unknown. */
export const STATEMENT_SUGGESTIONS: SuggestionRecord[] = [
  { id: 's1', left: ['b1'], right: ['F-2026-0412'], confidence: 'Exact: amount and reference' },
  { id: 's2', left: ['b2'], right: ['F-2026-0411'], confidence: 'Exact: amount and reference' },
  {
    id: 's3',
    left: ['b3'],
    right: ['F-2026-0410'],
    confidence: 'Likely: reference, part of the amount',
  },
  { id: 's4', left: ['b4'], right: ['F-2026-0406'], confidence: 'Likely: amount and payer' },
  { id: 's5', left: ['b5'], right: ['F-2026-0403'], confidence: 'Exact: amount and reference' },
  {
    id: 's6',
    left: ['b6'],
    right: ['F-2026-0392', 'F-2026-0390'],
    confidence: 'Exact: sum of two invoices and references',
  },
  { id: 's13', left: ['b13'], right: ['F-2026-0402'], confidence: 'Exact: amount and reference' },
]

/** The statement's totals: money in, money out, and the closing balance. */
export const STATEMENT_TOTALS = (() => {
  const amounts = STATEMENT_LINES.map((each) => each.paras)
  const incoming = sumParas(amounts.filter((paras) => paras > 0n))
  const outgoing = sumParas(amounts.filter((paras) => paras < 0n))
  return {
    lines: STATEMENT_LINES.length,
    incoming: decimalOf(incoming),
    outgoing: decimalOf(-outgoing),
    closing: decimalOf(STATEMENT.opening + incoming + outgoing),
  }
})()

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
