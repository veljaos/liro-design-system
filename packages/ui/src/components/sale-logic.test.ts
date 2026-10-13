import { describe, expect, it } from 'vitest'
import {
  allLinesChosen,
  chooseAllLines,
  chosenLineIds,
  exceedsAvailable,
  hasOwnOptions,
  isChosen,
  kindMarker,
  paymentOptions,
  toggleLine,
  type PaymentOption,
} from './sale-logic'

const LABELS = { cash: 'Cash', card: 'Card', split: 'Split' }

describe('paymentOptions (P5.28)', () => {
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

describe('lines chosen with quantities (P5.28)', () => {
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

describe('kindMarker (P5.28)', () => {
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
