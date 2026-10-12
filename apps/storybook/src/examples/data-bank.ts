/*
 * Bank statement 188 of 6 October 2026 (Banca Intesa) of Kvadrat Gradnja d.o.o., worked line by
 * line (P5.23, the owner's review): ten lines — two exact matches (an invoice paid by a customer,
 * a supplier invoice paid by us), a partial payment, a customer paying 0,40 RSD less, the bank's
 * fee, the salary advance batch, the taxes and contributions on it, a transfer to the company's
 * own account at another bank, an advance received, and an unknown payment left for later.
 * Amounts are whole paras (BigInt); every total, allocation and journal line is computed here, as
 * the Core would; the components add nothing (D4). The customer invoices are the dataset's open
 * ones (examples-story-data.ts, `isOpen`: F-2026-0407 is cancelled and F-2026-0408 a draft, so
 * neither is an open item) and earlier ones of the same customers; the supplier invoice
 * UF-2026-1204 is the one journal entry NK-2026-0912 books. Payment codes, models and accounts are
 * illustrative. Not part of the package. No classes here.
 */
import { decimal, paras, sumUnits } from '../../../../packages/ui/src/components/amounts-story-data'
import { viewer } from '../../../../packages/ui/src/components/document-frame-story-data'
import { INVOICES, isOpen } from './examples-story-data'

// ── The statement ─────────────────────────────────────────────────────────────────────────────

export const STATEMENT = {
  number: '188',
  date: '2026-10-06',
  bank: 'Banca Intesa',
  account: '160-0000000456789-12',
  /** The balance before the statement, from the bank. */
  opening: 5_284_550_17n,
  /** The balance after it, as the bank reports it (checked against the lines below). */
  closing: 1_395_654_57n,
  /** The bank's file, opened in the document viewer. */
  file: 'izvod-188.pdf',
  imported: 'Imported from Banca Intesa on 06.10.2026. at 07:35',
}

/** One line of the statement, everything the bank sent. */
export interface BankLine {
  id: string
  /** The line's number on the statement. */
  no: number
  /** The payer or the payee, as the bank names it. */
  party: string
  partyAccount: string
  /** Positive: money in; negative: money out. */
  paras: bigint
  valueDate: string
  /** The payment code and its meaning. */
  code: string
  model: string
  reference: string
  /** The purpose text the payer wrote. */
  purpose: string
}

export const PAYMENT_CODES: Record<string, string> = {
  '221': 'Trade in goods and services',
  '240': 'Salaries',
  '254': 'Taxes and contributions withheld',
  '289': 'Payments by citizens',
  '290': 'Other transactions',
}

function line(no: number, fields: Omit<BankLine, 'id' | 'no' | 'valueDate'>): BankLine {
  return { id: `b${String(no)}`, no, valueDate: STATEMENT.date, ...fields }
}

export const BANK_LINES: BankLine[] = [
  line(1, {
    party: 'Panonija Agro d.o.o.',
    partyAccount: '205-0000000112233-45',
    paras: 135_954_00n,
    code: '221',
    model: '00',
    reference: 'F-2026-0412',
    purpose: 'Plaćanje po fakturi F-2026-0412',
  }),
  line(2, {
    party: 'Banca Intesa a.d. Beograd',
    partyAccount: '160-0000000000001-07',
    paras: -1_240_00n,
    code: '290',
    model: '',
    reference: '',
    purpose: 'Naknada za vođenje računa, septembar 2026',
  }),
  line(3, {
    party: 'Medic Lab Niš d.o.o.',
    partyAccount: '160-0000000345678-90',
    paras: 50_000_00n,
    code: '221',
    model: '00',
    reference: 'F-2026-0410',
    purpose: 'Delimično plaćanje po fakturi F-2026-0410',
  }),
  line(4, {
    party: 'Gradska mehanizacija d.o.o.',
    partyAccount: '170-0000000556677-81',
    paras: -144_720_00n,
    code: '221',
    model: '00',
    reference: 'UF-2026-1204',
    purpose: 'Plaćanje računa UF-2026-1204',
  }),
  line(5, {
    party: 'Zbirni nalog, 46 primalaca',
    partyAccount: '160-0000000456789-12',
    paras: -2_208_000_00n,
    code: '240',
    model: '',
    reference: '',
    purpose: 'Akontacija zarade za septembar 2026',
  }),
  line(6, {
    party: 'Poreska uprava, zbirni račun',
    partyAccount: '840-4848-37',
    paras: -1_326_502_00n,
    code: '254',
    model: '97',
    reference: '50016108452317',
    purpose: 'Porezi i doprinosi na akontaciju zarade za septembar 2026',
  }),
  line(7, {
    party: 'Zlatibor Turs d.o.o.',
    partyAccount: '325-0000000778899-12',
    paras: 33_612_40n,
    code: '221',
    model: '',
    reference: '',
    purpose: 'Uplata po računu 406',
  }),
  line(8, {
    party: 'Kvadrat Gradnja d.o.o.',
    partyAccount: '265-0000001234567-89',
    paras: -500_000_00n,
    code: '290',
    model: '',
    reference: '',
    purpose: 'Prenos na račun kod Raiffeisen banke',
  }),
  line(9, {
    party: 'Vojvođanka Mlin a.d.',
    partyAccount: '355-0000000990011-23',
    paras: 60_000_00n,
    code: '221',
    model: '00',
    reference: 'P-2026-118',
    purpose: 'Avans po ponudi P-2026-118',
  }),
  line(10, {
    party: 'Petar Jovanović',
    partyAccount: '160-0000000654321-55',
    paras: 12_000_00n,
    code: '289',
    model: '',
    reference: '',
    purpose: 'Uplata',
  }),
]

/** Money in, money out, and the closing balance they give. */
export const STATEMENT_TOTALS = (() => {
  const amounts = BANK_LINES.map((each) => each.paras)
  const incoming = sumUnits(amounts.filter((value) => value > 0n))
  const outgoing = -sumUnits(amounts.filter((value) => value < 0n))
  const computed = STATEMENT.opening + incoming - outgoing
  return {
    lines: BANK_LINES.length,
    opening: decimal(STATEMENT.opening),
    incoming: decimal(incoming),
    outgoing: decimal(outgoing),
    closing: decimal(STATEMENT.closing),
    /** The Core's check: opening + in − out equals the bank's closing balance. */
    checksOut: computed === STATEMENT.closing,
  }
})()

if (!STATEMENT_TOTALS.checksOut) {
  throw new Error('Example dataset: statement 188 does not add up to its closing balance')
}

/** The statement viewer's document (the bank's PDF, written as the example viewer's pages). */
export const STATEMENT_VIEWER = viewer({
  title: `Izvod br. ${STATEMENT.number}`,
  lang: 'sr-Latn',
  pages: [
    `<h1>Izvod br. ${STATEMENT.number} od 06.10.2026.</h1>
     <p>Banca Intesa a.d. Beograd. Račun ${STATEMENT.account}, Kvadrat Gradnja d.o.o., Novi Sad.</p>
     <p>Prethodno stanje: 5.284.550,17. Ukupno potražuje: 291.566,40. Ukupno duguje: 4.180.462,00. Novo stanje: 1.395.654,57.</p>
     <p>Stavke 1–10 su navedene na sledećoj strani.</p>`,
    `<h2>Stavke</h2>
     <p>${BANK_LINES.map((each) => `${String(each.no)}. ${each.party}: ${each.purpose}`).join('<br>')}</p>`,
  ],
})

// ── Open items ────────────────────────────────────────────────────────────────────────────────

export type OpenItemKind = 'Invoice' | 'Supplier invoice' | 'Credit note'

/** An open item a line may close: what is still owed on it (a credit note negative). */
export interface OpenItem {
  id: string
  kind: OpenItemKind
  /** Customers pay us (money in); we pay suppliers (money out). */
  side: 'customer' | 'supplier'
  partner: string
  due: string
  paras: bigint
}

function customer(id: string, partner: string, due: string, open: bigint): OpenItem {
  return { id, kind: 'Invoice', side: 'customer', partner, due, paras: open }
}

/** The dataset's invoices still open on 6 October (not paid, not drafts, not cancelled). */
const DATASET_OPEN = INVOICES.filter(isOpen).map((each) =>
  customer(each.number, each.customer, each.due, paras(each.open)),
)

export const OPEN_ITEMS: OpenItem[] = [
  ...DATASET_OPEN,
  customer('F-2026-0402', 'Drina Prevoz d.o.o.', '2026-10-08', 26_880_00n),
  customer('F-2026-0399', 'Bojović i sinovi d.o.o.', '2026-10-05', 72_150_00n),
  customer('F-2026-0396', 'Stanić Elektro STR', '2026-10-04', 41_280_00n),
  customer('F-2026-0394', 'Panonija Agro d.o.o.', '2026-10-12', 54_312_00n),
  customer('F-2026-0392', 'Vojvođanka Mlin a.d.', '2026-10-01', 128_700_00n),
  customer('F-2026-0390', 'Vojvođanka Mlin a.d.', '2026-09-29', 85_560_00n),
  customer('F-2026-0381', 'Medic Lab Niš d.o.o.', '2026-09-25', 19_800_00n),
  {
    id: 'UF-2026-1204',
    kind: 'Supplier invoice',
    side: 'supplier',
    partner: 'Gradska mehanizacija d.o.o.',
    due: '2026-10-21',
    paras: 144_720_00n,
  },
  {
    id: 'UF-2026-1150',
    kind: 'Supplier invoice',
    side: 'supplier',
    partner: 'Gradska mehanizacija d.o.o.',
    due: '2026-10-14',
    paras: 38_400_00n,
  },
  {
    id: 'KO-UF-2026-0031',
    kind: 'Credit note',
    side: 'supplier',
    partner: 'Gradska mehanizacija d.o.o.',
    due: '2026-10-14',
    paras: -6_000_00n,
  },
]

export function openItem(id: string): OpenItem | undefined {
  return OPEN_ITEMS.find((each) => each.id === id)
}

// ── Accounts ──────────────────────────────────────────────────────────────────────────────────

export const BANK_ACCOUNT = { value: '2410', label: '2410 Current account, Banca Intesa' }

export const ACCOUNTS = [
  { value: '1500', label: '1500 Advances paid to suppliers' },
  { value: '2040', label: '2040 Customers in the country' },
  { value: '2420', label: '2420 Current account, Raiffeisen banka' },
  { value: '4140', label: '4140 Long-term bank loans' },
  { value: '4300', label: '4300 Advances received from customers' },
  { value: '4350', label: '4350 Suppliers in the country' },
  { value: '4500', label: '4500 Net salaries payable' },
  { value: '4510', label: '4510 Salary tax payable' },
  { value: '4520', label: '4520 Contributions payable, employees' },
  { value: '4530', label: '4530 Contributions payable, employer' },
  { value: '5530', label: '5530 Bank charges' },
  { value: '5790', label: '5790 Other expenses, written-off differences' },
  { value: '6790', label: '6790 Other income, written-off differences' },
]

export function accountOf(value: string) {
  return value === BANK_ACCOUNT.value
    ? BANK_ACCOUNT
    : (ACCOUNTS.find((each) => each.value === value) ?? null)
}

export const COST_CENTRES = [
  { value: 'temerinski', label: 'Temerinski put site' },
  { value: 'office', label: 'Head office' },
  { value: 'machines', label: 'Machinery' },
]

/** The quick types: a common payment with its account filled in (the Core's settings). */
export type QuickType =
  'fee' | 'salaries' | 'tax' | 'transfer' | 'loan' | 'advanceReceived' | 'advancePaid' | 'other'

export const QUICK_TYPES: { value: QuickType; label: string; account: string | null }[] = [
  { value: 'fee', label: 'Bank fee', account: '5530' },
  { value: 'salaries', label: 'Salaries', account: '4500' },
  { value: 'tax', label: 'Tax or contribution payment', account: '4510' },
  { value: 'transfer', label: 'Transfer between own accounts', account: '2420' },
  { value: 'loan', label: 'Loan repayment', account: '4140' },
  { value: 'advanceReceived', label: 'Advance received', account: '4300' },
  { value: 'advancePaid', label: 'Advance paid', account: '1500' },
  { value: 'other', label: 'Other', account: null },
]

/** The quick types that fit a line's direction (an advance is received or paid). */
export function quickTypesFor(paras: bigint) {
  return QUICK_TYPES.filter((each) =>
    paras > 0n
      ? each.value !== 'advancePaid' && each.value !== 'fee' && each.value !== 'loan'
      : each.value !== 'advanceReceived',
  )
}

// ── What a line is: the decision ───────────────────────────────────────────────────────────────

export type DifferenceChoice = 'open' | 'writeOff' | 'advance'

export interface SplitPart {
  id: string
  account: { value: string; label: string } | null
  text: string
  costCentre: string
  /** A decimal string, or null while empty. */
  amount: string | null
}

export type Decision =
  | { kind: 'close'; items: string[]; difference: DifferenceChoice }
  | {
      kind: 'account'
      type: QuickType
      account: string | null
      text: string
      costCentre: string
    }
  | { kind: 'split'; parts: SplitPart[] }

/** A candidate's reason, written by the screen (an amount through `format`). */
export type CandidateReason =
  | { text: string }
  /** "Same customer, amount differs by 0,40 RSD". */
  | { differsBy: bigint; partner: 'customer' | 'supplier' }

export interface LineSuggestion {
  /** The Core's best guess, preselected. */
  decision: Decision
  reason: string
}

/** What the Core proposes for each line; a line without one is to do. */
export const SUGGESTIONS: Record<string, LineSuggestion> = {
  b1: {
    decision: { kind: 'close', items: ['F-2026-0412'], difference: 'open' },
    reason: 'Exact: amount and reference',
  },
  b2: {
    decision: {
      kind: 'account',
      type: 'fee',
      account: '5530',
      text: 'Account fee, September 2026',
      costCentre: '',
    },
    reason: 'Recognised: a fee charged by Banca Intesa',
  },
  b3: {
    decision: { kind: 'close', items: ['F-2026-0410'], difference: 'open' },
    reason: 'Same customer and reference; pays part of the open amount',
  },
  b4: {
    decision: { kind: 'close', items: ['UF-2026-1204'], difference: 'open' },
    reason: 'Exact: amount and reference',
  },
  b5: {
    decision: {
      kind: 'account',
      type: 'salaries',
      account: '4500',
      text: 'Advance on September 2026 salaries',
      costCentre: '',
    },
    reason: 'Recognised: payment code 240 and the salary batch sent on 06.10.2026.',
  },
  b6: {
    decision: {
      kind: 'split',
      parts: [
        part('t1', '4510', 'Salary tax, September 2026 advance', '239110.00'),
        part('t2', '4520', 'Employee contributions, September 2026 advance', '652784.00'),
        part('t3', '4530', 'Employer contributions, September 2026 advance', '434608.00'),
      ],
    },
    reason: 'From the salary advance: tax and contributions as calculated',
  },
  b7: {
    decision: { kind: 'close', items: ['F-2026-0406'], difference: 'writeOff' },
    reason: 'Same customer, invoice 406 in the purpose; the amount differs a little',
  },
  b8: {
    decision: {
      kind: 'account',
      type: 'transfer',
      account: '2420',
      text: 'Transfer to Raiffeisen banka',
      costCentre: '',
    },
    reason: 'Recognised: the company’s own account at Raiffeisen banka',
  },
}

function part(id: string, account: string, text: string, amount: string): SplitPart {
  return { id, account: accountOf(account), text, costCentre: '', amount }
}

/** The open items the Core ranks for each line, best first, with the reason for each. */
export const CANDIDATES: Record<string, { id: string; reason: CandidateReason }[]> = {
  b1: [
    { id: 'F-2026-0412', reason: { text: 'Exact: amount and reference' } },
    { id: 'F-2026-0394', reason: { text: 'Same customer' } },
    { id: 'F-2026-0403', reason: { text: 'Same customer' } },
  ],
  b3: [
    { id: 'F-2026-0410', reason: { text: 'Same customer and reference; pays part of it' } },
    { id: 'F-2026-0381', reason: { text: 'Same customer' } },
  ],
  b4: [
    { id: 'UF-2026-1204', reason: { text: 'Exact: amount and reference' } },
    { id: 'UF-2026-1150', reason: { text: 'Same supplier' } },
    { id: 'KO-UF-2026-0031', reason: { text: 'Same supplier' } },
  ],
  b7: [{ id: 'F-2026-0406', reason: { differsBy: 40n, partner: 'customer' } }],
  b9: [
    { id: 'F-2026-0392', reason: { text: 'Same customer; the amount differs' } },
    { id: 'F-2026-0390', reason: { text: 'Same customer; the amount differs' } },
  ],
}

/** A difference up to this may be written off (the Core's setting): 100,00 RSD. */
export const WRITE_OFF_LIMIT = 100_00n

// ── The arithmetic of closing open items ───────────────────────────────────────────────────────

export interface CloseOutcome {
  /** What the payment pays on each chosen item, in the chosen order. */
  paid: { id: string; paras: bigint; open: bigint }[]
  /** The payment less what the items owe: below zero the items keep the rest open. */
  rest: bigint
}

/**
 * What a payment does to the chosen items: credit notes count in full, the others are paid in
 * order, each up to what it owes; the rest is what the payment has over (above zero) or what
 * stays owed (below zero). Amounts are the line's size, the sign of the direction dropped.
 */
export function closeOutcome(amount: bigint, itemIds: readonly string[]): CloseOutcome {
  const items = itemIds.flatMap((id) => OPEN_ITEMS.filter((each) => each.id === id))
  const credits = sumUnits(items.filter((each) => each.paras < 0n).map((each) => each.paras))
  let money = (amount < 0n ? -amount : amount) - credits
  const paid = items.map((each) => {
    if (each.paras < 0n) return { id: each.id, paras: each.paras, open: each.paras }
    const take = money < each.paras ? (money > 0n ? money : 0n) : each.paras
    money -= take
    return { id: each.id, paras: take, open: each.paras }
  })
  const owed = sumUnits(items.map((each) => each.paras))
  return { paid, rest: (amount < 0n ? -amount : amount) - owed }
}

/** The split's parts against the line: the bank side and the parts' sum, as an entry's sides. */
export function splitBalance(amount: bigint, parts: readonly SplitPart[]) {
  const size = amount < 0n ? -amount : amount
  const missing = parts.some((each) => each.amount === null || each.account === null)
  const sum = sumUnits(parts.map((each) => (each.amount === null ? 0n : paras(each.amount))))
  // Money out: the parts are debits, the bank the credit; money in the other way round.
  const bank = decimal(size)
  const partsText = decimal(sum)
  return {
    debit: amount < 0n ? partsText : bank,
    credit: amount < 0n ? bank : partsText,
    difference: decimal(amount < 0n ? sum - size : size - sum),
    absoluteDifference: decimal(sum > size ? sum - size : size - sum),
    state: missing
      ? ('incomplete' as const)
      : sum === size
        ? ('balanced' as const)
        : ('unbalanced' as const),
  }
}

// ── The journal entry the statement posts ──────────────────────────────────────────────────────

export interface EntryLine {
  id: string
  account: string
  text: string
  debit: string | null
  credit: string | null
}

/**
 * The entry lines of one decided statement line: the bank account against the items, the
 * accounts or the parts; a written-off difference or an advance on its own line.
 */
export function entryLines(bankLine: BankLine, decision: Decision): EntryLine[] {
  const incoming = bankLine.paras > 0n
  const size = incoming ? bankLine.paras : -bankLine.paras
  const prefix = `${STATEMENT.number}/${String(bankLine.no)}`
  const lines: EntryLine[] = []
  const add = (account: string, text: string, value: bigint, debit: boolean) => {
    if (value === 0n) return
    // A negative amount (a credit note) stands on the other side.
    const side = value < 0n ? !debit : debit
    const amount = decimal(value < 0n ? -value : value)
    lines.push({
      id: `${bankLine.id}-${String(lines.length)}`,
      account,
      text: `${prefix} ${text}`,
      debit: side ? amount : null,
      credit: side ? null : amount,
    })
  }
  add(BANK_ACCOUNT.value, bankLine.party, size, incoming)
  if (decision.kind === 'close') {
    const outcome = closeOutcome(bankLine.paras, decision.items)
    for (const each of outcome.paid) {
      const item = openItem(each.id)
      if (item === undefined) continue
      const account = item.side === 'customer' ? '2040' : '4350'
      add(account, `${item.partner}, ${item.id}`, each.paras, !incoming)
    }
    if (outcome.rest < 0n && decision.difference === 'writeOff') {
      // The rest owed is written off: an expense for money in, an income for money out.
      add(incoming ? '5790' : '6790', 'Written-off difference', -outcome.rest, incoming)
      const last = outcome.paid.at(-1)
      const item = last === undefined ? undefined : openItem(last.id)
      if (item !== undefined) {
        add(incoming ? '2040' : '4350', `${item.partner}, ${item.id}`, -outcome.rest, !incoming)
      }
    }
    if (outcome.rest > 0n) {
      // What the payment has over: written off (an income for money in, an expense for money
      // out) or kept as an advance.
      const writeOff = decision.difference === 'writeOff'
      add(
        writeOff ? (incoming ? '6790' : '5790') : incoming ? '4300' : '1500',
        writeOff ? 'Written-off difference' : `Advance, ${bankLine.party}`,
        outcome.rest,
        !incoming,
      )
    }
  } else if (decision.kind === 'account') {
    if (decision.account !== null) add(decision.account, decision.text, size, !incoming)
  } else {
    for (const each of decision.parts) {
      if (each.account === null || each.amount === null) continue
      add(each.account.value, each.text, paras(each.amount), !incoming)
    }
  }
  return lines
}

/** Debit and credit of the whole entry, and whether it balances. */
export function entryBalance(lines: readonly EntryLine[]) {
  const debit = sumUnits(lines.map((each) => (each.debit === null ? 0n : paras(each.debit))))
  const credit = sumUnits(lines.map((each) => (each.credit === null ? 0n : paras(each.credit))))
  return {
    debit: decimal(debit),
    credit: decimal(credit),
    difference: decimal(debit - credit),
    state: debit === credit ? ('balanced' as const) : ('unbalanced' as const),
  }
}

export { decimal, paras, sumUnits }
