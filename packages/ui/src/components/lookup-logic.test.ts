import { describe, expect, it } from 'vitest'
import {
  choosableCount,
  firstChoosable,
  lookupKeyTarget,
  lookupKindLabel,
  lookupRowHeight,
  lookupRows,
  type LookupKind,
  type LookupOption,
  type LookupRow,
  type LookupRowsInput,
} from './lookup-logic'

const KINDS: LookupKind[] = [
  { key: 'item', heading: 'Items', label: 'Item' },
  { key: 'service', heading: 'Services', label: 'Service' },
  { key: 'asset', heading: 'Fixed assets', label: 'Fixed asset' },
]

const RESULTS: LookupOption[] = [
  { value: 's1', label: 'Montaža armature', kind: 'service' },
  { value: 'i1', label: 'Armaturna mreža Q188', kind: 'item', description: 'ART-0112' },
  { value: 'x1', label: 'Armatura, other', kind: 'unknown' },
  { value: 'i2', label: 'Armatura B500B Ø12', kind: 'item', disabled: true },
  { value: 'a1', label: 'Savijačica armature', kind: 'asset', detail: 'OS-0047' },
]

const RECENT: LookupOption[] = [
  { value: 'i9', label: 'Cement CEM II 42,5 R', kind: 'item' },
  { value: 's9', label: 'Prevoz kamionom', kind: 'service' },
]

const input = (extra: Partial<LookupRowsInput> = {}): LookupRowsInput => ({
  query: 'arm',
  results: RESULTS,
  recent: RECENT,
  kinds: KINDS,
  recentHeading: 'Recent',
  create: [{ kind: 'service', noun: 'service' }],
  oneOff: false,
  searchAll: true,
  ...extra,
})

const shape = (rows: readonly LookupRow[]) =>
  rows.map((row) => {
    switch (row.type) {
      case 'heading':
        return `# ${row.text}`
      case 'option':
        return `${row.option.value}@${String(row.position)}`
      case 'create':
        return `create ${row.kind}@${String(row.position)}`
      default:
        return `${row.type}@${String(row.position)}`
    }
  })

describe('lookupRows', () => {
  it('shows the recent records while nothing is typed, then "Search all…"', () => {
    expect(shape(lookupRows(input({ query: '  ' })))).toEqual([
      '# Recent',
      'i9@1',
      's9@2',
      'searchAll@3',
    ])
    expect(shape(lookupRows(input({ query: '', recent: [], searchAll: false })))).toEqual([])
  })

  it('groups the results by kind in the order of the kinds, unknown kinds last', () => {
    expect(shape(lookupRows(input()))).toEqual([
      '# Items',
      'i1@1',
      'i2@2',
      '# Services',
      's1@3',
      '# Fixed assets',
      'a1@4',
      'x1@5',
      'create service@6',
      'searchAll@7',
    ])
  })

  it('offers "+ Create …" and the one-off entry when nothing is found', () => {
    expect(
      shape(
        lookupRows(
          input({
            results: [],
            oneOff: true,
            create: [
              { kind: 'service', noun: 'service' },
              { kind: 'item', noun: 'item' },
            ],
          }),
        ),
      ),
    ).toEqual(['create service@1', 'create item@2', 'oneOff@3', 'searchAll@4'])
  })

  it('names the kind of each record for assistive technology', () => {
    const rows = lookupRows(input())
    const asset = rows.find((row) => row.type === 'option' && row.option.value === 'a1')
    expect(asset?.type === 'option' ? asset.kindLabel : null).toBe('Fixed asset')
    expect(choosableCount(rows)).toBe(7)
  })
})

describe('lookupRowHeight', () => {
  it('gives headings 28px, records 36px or 48px with a second line, actions 36px', () => {
    const rows = lookupRows(input())
    expect(rows.map(lookupRowHeight)).toEqual([28, 48, 36, 28, 36, 28, 36, 36, 36, 36])
  })
})

describe('lookupKeyTarget', () => {
  const rows = lookupRows(input())
  // Choosable: 1 (i1), 4 (s1), 6 (a1), 7 (x1), 8 (create), 9 (search all); 2 (i2) is disabled.
  it('moves by one, skipping headings and disabled records, and wraps around', () => {
    expect(lookupKeyTarget(rows, -1, 'ArrowDown')).toBe(1)
    expect(lookupKeyTarget(rows, 1, 'ArrowDown')).toBe(4)
    expect(lookupKeyTarget(rows, 9, 'ArrowDown')).toBe(1)
    expect(lookupKeyTarget(rows, -1, 'ArrowUp')).toBe(9)
    expect(lookupKeyTarget(rows, 1, 'ArrowUp')).toBe(9)
    expect(lookupKeyTarget(rows, 6, 'ArrowUp')).toBe(4)
  })

  it('pages by ten without wrapping, Home and End to the ends', () => {
    expect(lookupKeyTarget(rows, 1, 'PageDown')).toBe(9)
    expect(lookupKeyTarget(rows, 8, 'PageUp')).toBe(1)
    expect(lookupKeyTarget(rows, 6, 'Home')).toBe(1)
    expect(lookupKeyTarget(rows, 1, 'End')).toBe(9)
  })

  it('leaves other keys alone, and has nothing to move to in an empty list', () => {
    expect(lookupKeyTarget(rows, 1, 'Enter')).toBeUndefined()
    expect(lookupKeyTarget([{ type: 'heading', text: 'Items' }], -1, 'ArrowDown')).toBeUndefined()
  })

  it('starts a new list at its first choosable row', () => {
    expect(firstChoosable(rows)).toBe(1)
    expect(firstChoosable([])).toBe(-1)
  })
})

describe('lookupKindLabel', () => {
  it('names the kind of a chosen record, and a one-off line', () => {
    expect(lookupKindLabel(RESULTS[0], KINDS, 'One-off')).toBe('Service')
    expect(lookupKindLabel({ value: '', label: 'Montaža', oneOff: true }, KINDS, 'One-off')).toBe(
      'One-off',
    )
    expect(lookupKindLabel({ value: 'z', label: 'Z' }, KINDS, 'One-off')).toBeUndefined()
    expect(lookupKindLabel(null, KINDS, 'One-off')).toBeUndefined()
  })
})
