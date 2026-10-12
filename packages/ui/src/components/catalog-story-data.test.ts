import { describe, expect, it } from 'vitest'
import { matchesChoice, sortRows, type SortKey } from './catalog-story-data'

interface Row {
  name: string
  amount: string
}

const ROWS: Row[] = [
  { name: 'Čačak Trade', amount: '10.00' },
  { name: 'Alfa 10', amount: '9.99' },
  { name: 'Alfa 9', amount: '-5.00' },
  { name: 'Cveće', amount: '123456789012345678.01' },
]

const KEYS: Record<string, SortKey<Row>> = {
  name: { kind: 'text', value: (row) => row.name },
  amount: { kind: 'decimal', value: (row) => row.amount },
}

const names = (rows: readonly Row[]) => rows.map((row) => row.name)

describe('sortRows (the application sorting a catalogue, played by the stories)', () => {
  it('keeps the order without a sort or for an unknown column', () => {
    expect(names(sortRows(ROWS, null, KEYS, 'sr-Latn'))).toEqual(names(ROWS))
    expect(names(sortRows(ROWS, { column: 'city', direction: 'asc' }, KEYS, 'sr-Latn'))).toEqual(
      names(ROWS),
    )
  })

  it("sorts text by the language's collation, numbers inside it by value", () => {
    expect(names(sortRows(ROWS, { column: 'name', direction: 'asc' }, KEYS, 'sr-Latn'))).toEqual([
      'Alfa 9',
      'Alfa 10',
      'Cveće',
      'Čačak Trade',
    ])
    expect(names(sortRows(ROWS, { column: 'name', direction: 'desc' }, KEYS, 'sr-Latn'))[0]).toBe(
      'Čačak Trade',
    )
  })

  it('sorts amounts exactly, beyond what a JavaScript number holds', () => {
    expect(names(sortRows(ROWS, { column: 'amount', direction: 'asc' }, KEYS, 'sr-Latn'))).toEqual([
      'Alfa 9',
      'Alfa 10',
      'Čačak Trade',
      'Cveće',
    ])
    const big: Row[] = [
      { name: 'b', amount: '9007199254740993.00' },
      { name: 'a', amount: '9007199254740992.00' },
    ]
    expect(names(sortRows(big, { column: 'amount', direction: 'asc' }, KEYS, 'en'))).toEqual([
      'a',
      'b',
    ])
  })
})

describe('matchesChoice', () => {
  it('reads one value (select) or several (multiSelect); empty matches all', () => {
    expect(matchesChoice('', 'Niš')).toBe(true)
    expect(matchesChoice('Niš', 'Niš')).toBe(true)
    expect(matchesChoice('Kać', 'Niš')).toBe(false)
    expect(matchesChoice([], 'Niš')).toBe(true)
    expect(matchesChoice(['Kać', 'Niš'], 'Niš')).toBe(true)
    expect(matchesChoice(['Kać'], 'Niš')).toBe(false)
    expect(matchesChoice(null, 'Niš')).toBe(true)
  })
})
