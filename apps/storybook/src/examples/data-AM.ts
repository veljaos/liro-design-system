/*
 * Group AM's example data (P5.46): the main cash desk of Kvadrat Gradnja d.o.o. from 12 to 14
 * October 2026 — the cash journal by day (opening balance, receipts, payments, closing balance),
 * the slips behind it (the ledger's postings on account 2430, data-AK.ts) and the cash limit
 * (illustrative). The days, balances and the limit's excess are worked out here as the Core
 * would; the screens only show them (D4). Not part of the package. No classes here.
 */
import { decimal, paras } from '../../../../packages/ui/src/components/amounts-story-data'
import { balanceOn, POSTINGS, type PostingDocument } from './data-AK'

export const AM_ROUTES = {
  book: '/accounting/cash-book',
  receipt: '/accounting/cash-book/CR-2026-0143',
  payment: '/accounting/cash-book/CP-2026-0212',
}

export const CASH_ACCOUNT = '2430'

export const CASH_DESK = {
  name: 'Main cash desk',
  account: '2430',
  cashier: 'Ivana Stojanović',
  /** The cash the desk may hold at the end of a day (illustrative). */
  limit: '150000.00',
}

/** The days of the journal, each with its number in the cash journal. */
export const CASH_DAYS = [
  { date: '2026-10-12', journal: '197' },
  { date: '2026-10-13', journal: '198' },
  { date: '2026-10-14', journal: '199' },
] as const

/** One row of the cash journal. */
export interface CashRow {
  id: string
  type: 'day' | 'opening' | 'entry' | 'total' | 'closing'
  date: string
  /** The day's number in the cash journal ("198"). */
  journal: string
  slip?: PostingDocument
  description?: string
  /** Who paid in or was paid. */
  partner?: string
  /** The other account of the posting ("4300"). */
  account?: string
  receipt: string | null
  payment: string | null
  /** The cash after the row. */
  balance: string | null
}

export interface CashDay {
  date: string
  journal: string
  opening: string
  receipts: string
  payments: string
  closing: string
  /** The closing balance is above the limit. */
  overLimit: boolean
}

function dayBefore(date: string): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10)
}

const LIMIT = paras(CASH_DESK.limit)

function journal(): { rows: CashRow[]; days: CashDay[] } {
  const rows: CashRow[] = []
  const days: CashDay[] = []
  for (const { date, journal: number } of CASH_DAYS) {
    let balance = paras(balanceOn(CASH_ACCOUNT, dayBefore(date)))
    const opening = balance
    let receipts = 0n
    let payments = 0n
    rows.push({
      id: `${date}-day`,
      type: 'day',
      date,
      journal: number,
      receipt: null,
      payment: null,
      balance: null,
    })
    rows.push({
      id: `${date}-opening`,
      type: 'opening',
      date,
      journal: number,
      receipt: null,
      payment: null,
      balance: decimal(balance),
    })
    for (const posting of POSTINGS) {
      if (posting.date !== date) continue
      const line = posting.lines.find((each) => each.account === CASH_ACCOUNT)
      if (line === undefined) continue
      const other = posting.lines.find((each) => each.account !== CASH_ACCOUNT)
      const receipt = line.debit === null ? 0n : paras(line.debit)
      const payment = line.credit === null ? 0n : paras(line.credit)
      receipts += receipt
      payments += payment
      balance += receipt - payment
      rows.push({
        id: posting.id,
        type: 'entry',
        date,
        journal: number,
        slip: posting.document,
        description: posting.description,
        ...(posting.partner === undefined ? {} : { partner: posting.partner }),
        ...(other === undefined ? {} : { account: other.account }),
        receipt: line.debit,
        payment: line.credit,
        balance: decimal(balance),
      })
    }
    rows.push({
      id: `${date}-total`,
      type: 'total',
      date,
      journal: number,
      receipt: decimal(receipts),
      payment: decimal(payments),
      balance: null,
    })
    rows.push({
      id: `${date}-closing`,
      type: 'closing',
      date,
      journal: number,
      receipt: null,
      payment: null,
      balance: decimal(balance),
    })
    days.push({
      date,
      journal: number,
      opening: decimal(opening),
      receipts: decimal(receipts),
      payments: decimal(payments),
      closing: decimal(balance),
      overLimit: balance > LIMIT,
    })
  }
  return { rows, days }
}

const BOOK = journal()

export const CASH_ROWS: readonly CashRow[] = BOOK.rows
export const CASH_BOOK_DAYS: readonly CashDay[] = BOOK.days

/** The cash now, and what is above the limit (null when it is not). */
export const CASH_NOW = (() => {
  const today = BOOK.days[BOOK.days.length - 1]
  if (today === undefined) throw new Error('Example cash book: no days')
  const excess = paras(today.closing) - LIMIT
  return {
    balance: today.closing,
    receipts: today.receipts,
    payments: today.payments,
    excess: excess > 0n ? decimal(excess) : null,
    /** The first day that closed above the limit. */
    since: BOOK.days.find((each) => each.overLimit)?.date ?? null,
  }
})()

// ── The two slips shown in full ───────────────────────────────────────────────────────────────

export interface CashSlip {
  number: string
  kind: 'receipt' | 'payment'
  date: string
  journal: string
  /** "Received from" or "Paid to". */
  party: { name: string; detail: string; address?: string }
  lines: readonly {
    id: string
    purpose: string
    account: string
    analytics: string
    amount: string
  }[]
  total: string
  /** The person who paid in or received the cash, as the slip records them. */
  person: string
  postedAs: string
}

export const RECEIPT_SLIP: CashSlip = {
  number: 'CR-2026-0143',
  kind: 'receipt',
  date: '2026-10-13',
  journal: '198',
  party: {
    name: 'Jovan Petković',
    detail: 'Private buyer',
    address: 'Jevrejska 12, 21000 Novi Sad',
  },
  lines: [
    {
      id: '1',
      purpose: 'Reservation deposit, apartment 3.2, Residential building Liman 4',
      account: '4300 Advances received',
      analytics: 'Partner: Jovan Petković · Project: Residential building Liman 4',
      amount: '150000.00',
    },
  ],
  total: '150000.00',
  person: 'Jovan Petković',
  postedAs: 'Posted on 13.10.2026. at 11:52 by Ivana Stojanović',
}

export const PAYMENT_SLIP: CashSlip = {
  number: 'CP-2026-0212',
  kind: 'payment',
  date: '2026-10-12',
  journal: '197',
  party: { name: 'Nikola Marković', detail: 'Site worker, Site Liman 4' },
  lines: [
    {
      id: '1',
      purpose: 'Travel advance, Subotica 15.–16.10.2026., travel order PN-2026-044',
      account: '2210 Travel advances to employees',
      analytics: 'Employee: Nikola Marković',
      amount: '15000.00',
    },
  ],
  total: '15000.00',
  person: 'Nikola Marković',
  postedAs: 'Posted on 12.10.2026. at 08:15 by Ivana Stojanović',
}
