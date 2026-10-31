import { describe, expect, it } from 'vitest'
import {
  allLinesChosen,
  chooseAllLines,
  chosenLineIds,
  exceedsAvailable,
  hasOwnOptions,
  isChosen,
  kindMarker,
  partOverLimit,
  paymentOptions,
  stillToPay,
  toggleLine,
  type PaymentOption,
} from './sale-logic'

const LABELS = { cash: 'Cash', card: 'Card', split: 'Split' }

describe('paymentOptions', () => {
  it('names the built-in methods by the provider and keeps their kinds', () => {
    expect(paymentOptions(['cash', 'card', 'split'], LABELS)).toEqual([
      { id: 'cash', label: 'Cash', kind: 'cash' },
      { id: 'card', label: 'Card', kind: 'card' },
      { id: 'split', label: 'Split', kind: 'plain' },
    ])
  })
  it("keeps the application's own options as given, in order", () => {
    const cheque: PaymentOption = { id: 'cheque', label: 'Cheque', kind: 'plain' }
    expect(paymentOptions(['cash', cheque], LABELS)).toEqual([
      { id: 'cash', label: 'Cash', kind: 'cash' },
      cheque,
    ])
  })
  it('tells own options from the built-in names', () => {
    expect(hasOwnOptions(['cash', 'card'])).toBe(false)
    expect(hasOwnOptions(['cash', { id: 'ips', label: 'Instant', kind: 'qr' }])).toBe(true)
  })
})

const LINES = [
  { id: 'a', available: '3' },
  { id: 'b', available: '1.5' },
  { id: 'c', available: '2', unavailableReason: 'Refunded in full' },
]

describe('lines chosen with quantities', () => {
  it('counts a line as chosen only above zero, exactly', () => {
    expect(isChosen('1')).toBe(true)
    expect(isChosen('0.001')).toBe(true)
    expect(isChosen('0')).toBe(false)
    expect(isChosen('0.000')).toBe(false)
    expect(isChosen(null)).toBe(false)
    expect(isChosen(undefined)).toBe(false)
    expect(isChosen('abc')).toBe(false)
  })
  it("lists the chosen ids in the lines' order", () => {
    expect(chosenLineIds(LINES, { b: '1', a: '2', c: null })).toEqual(['a', 'b'])
  })
  it('ticks a line at its whole quantity and clears it to none', () => {
    expect(toggleLine({ a: '1' }, { id: 'b', available: '1.5' }, true)).toEqual({
      a: '1',
      b: '1.5',
    })
    expect(toggleLine({ a: '1', b: '1.5' }, { id: 'a', available: '3' }, false)).toEqual({
      a: null,
      b: '1.5',
    })
  })
  it('chooses every open line at its whole quantity, or none', () => {
    expect(chooseAllLines(LINES, true)).toEqual({ a: '3', b: '1.5', c: null })
    expect(chooseAllLines(LINES, false)).toEqual({ a: null, b: null, c: null })
  })
  it('knows when every open line is chosen whole (decimal strings compared exactly)', () => {
    expect(allLinesChosen(LINES, { a: '3', b: '1.50' })).toBe(true)
    expect(allLinesChosen(LINES, { a: '2', b: '1.5' })).toBe(false)
    expect(allLinesChosen(LINES, {})).toBe(false)
    expect(allLinesChosen([{ id: 'x', available: '1', unavailableReason: 'No' }], {})).toBe(false)
  })
  it('flags a quantity above what is available', () => {
    expect(exceedsAvailable('4', '3')).toBe(true)
    expect(exceedsAvailable('3.000', '3')).toBe(false)
    expect(exceedsAvailable(null, '3')).toBe(false)
  })
})

describe('kindMarker', () => {
  const types = [
    { id: 'normal', label: 'Normal' },
    { id: 'proforma', label: 'Proforma', marker: 'Not a fiscal receipt' },
  ]
  const transactions = [
    { id: 'sale', label: 'Sale' },
    { id: 'refund', label: 'Refund', marker: 'Refund' },
  ]
  it("takes the type's marker first, then the transaction's", () => {
    expect(kindMarker(types, transactions, 'proforma', 'refund')).toBe('Not a fiscal receipt')
    expect(kindMarker(types, transactions, 'normal', 'refund')).toBe('Refund')
    expect(kindMarker(types, transactions, 'normal', 'sale')).toBeUndefined()
    expect(kindMarker(types, transactions, undefined, undefined)).toBeUndefined()
  })
})

describe('partOverLimit and stillToPay: a part of a payment', () => {
  const card = { kind: 'card' as const }
  const voucher = { kind: 'plain' as const, maxAmount: '2000', maxReason: 'Worth 2.000,00 RSD.' }
  it('lets cash be more than what remains: it gives change', () => {
    expect(partOverLimit({ kind: 'cash' }, '5000', '1011.00')).toBeNull()
  })
  it('keeps every other way within the remaining amount, exactly', () => {
    expect(partOverLimit(card, '1011.00', '1011')).toBeNull()
    expect(partOverLimit(card, '1011.01', '1011.00')).toEqual({
      reason: 'remaining',
      limit: '1011.00',
    })
  })
  it('keeps a way within its own limit when that is lower than what remains', () => {
    expect(partOverLimit(voucher, '2500', '3000')).toEqual({
      reason: 'option',
      limit: '2000',
      words: 'Worth 2.000,00 RSD.',
    })
    expect(partOverLimit(voucher, '2000.00', '3000')).toBeNull()
    // The remaining amount is the lower limit: that one is said.
    expect(partOverLimit(voucher, '1800', '1500')).toEqual({ reason: 'remaining', limit: '1500' })
  })
  it('leaves an unreadable amount to the application', () => {
    expect(partOverLimit(card, 'abc', '100')).toBeNull()
    expect(partOverLimit(card, null, '100')).toBeNull()
    expect(partOverLimit(card, '100', null)).toBeNull()
  })
  it('says whether something is still to pay, exactly', () => {
    expect(stillToPay('0.00')).toBe(false)
    expect(stillToPay('0')).toBe(false)
    expect(stillToPay('0.01')).toBe(true)
    expect(stillToPay(null)).toBe(false)
    expect(stillToPay(undefined)).toBe(false)
  })
})
