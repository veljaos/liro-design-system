import { describe, expect, it } from 'vitest'
import type { StatutoryRule } from './register-logic'
import {
  statutoryRows,
  statutoryColumnLabel,
  findStatutoryPlace,
  statutoryGridLines,
  statutoryHeaderRows,
  isStatutoryGroup,
  statutoryRowRules,
  statutoryCellId,
  statutoryCellLabel,
  type StatutoryColumn,
  type StatutorySection,
} from './statutory-logic'

const BASE20: StatutoryColumn = { id: 'b20', label: 'Base', group: 'General 20%' }
const VAT20: StatutoryColumn = { id: 'v20', label: 'VAT', group: 'General 20%' }
const RATES: StatutoryColumn[] = [
  BASE20,
  VAT20,
  { id: 'b10', label: 'Base', group: 'Special 10%' },
  { id: 'v10', label: 'VAT', group: 'Special 10%' },
]

const SECTIONS: StatutorySection[] = [
  {
    key: 'part1',
    title: 'Part 1',
    columns: RATES,
    items: [
      {
        key: '1.1',
        number: '1.1',
        title: 'In the Republic',
        items: [
          {
            id: '1.1.1',
            number: '1.1.1',
            label: 'Invoiced',
            cells: {
              b20: { kind: 'source', value: '10.00' },
              v20: { kind: 'computed', value: '2.00' },
            },
          },
          {
            key: '1.1.9',
            number: '1.1.9',
            title: 'Deeper',
            items: [{ id: '1.1.9.1', number: '1.1.9.1', label: 'Deep', cells: {} }],
          },
          {
            id: '1.1.5',
            number: '1.1.5',
            label: 'VAT only',
            cells: { v20: { kind: 'entered', value: null } },
          },
        ],
      },
      {
        id: '1.3',
        number: '1.3',
        label: 'Base only',
        cells: { b20: { kind: 'entered', value: null } },
      },
    ],
  },
  {
    key: 'part2',
    title: 'Part 2',
    columns: [{ id: 'amount', label: 'Amount' }],
    items: [
      {
        id: '2.1',
        number: '2.1',
        label: 'Exempt',
        cells: { amount: { kind: 'computed', value: '0.00' } },
      },
    ],
  },
]

describe('statutory form grid', () => {
  it('names cells and columns with their group', () => {
    expect(statutoryCellId('1.1.2', 'b20')).toBe('1.1.2/b20')
    expect(statutoryColumnLabel(BASE20)).toBe('General 20% · Base')
    expect(statutoryColumnLabel({ id: 'a', label: 'Amount' })).toBe('Amount')
    expect(statutoryCellLabel({ id: '1.1.2', number: '1.1.2', label: 'x', cells: {} }, VAT20)).toBe(
      '1.1.2 · General 20% · VAT',
    )
  })

  it('lays out two header rows: groups spanning their columns, ungrouped columns alone', () => {
    const { first, second } = statutoryHeaderRows([
      { id: 'code', label: 'Code' },
      ...RATES,
      { id: 'note', label: 'Note' },
    ])
    expect(first).toEqual([
      { kind: 'column', column: { id: 'code', label: 'Code' } },
      { kind: 'group', key: 'b20', label: 'General 20%', span: 2 },
      { kind: 'group', key: 'b10', label: 'Special 10%', span: 2 },
      { kind: 'column', column: { id: 'note', label: 'Note' } },
    ])
    expect(second.map((column) => column.id)).toEqual(['b20', 'v20', 'b10', 'v10'])
    // One column: one header row.
    expect(statutoryHeaderRows([{ id: 'amount', label: 'Amount' }]).second).toEqual([])
  })

  it('draws the open groups only, with depths', () => {
    const items = SECTIONS[0]?.items ?? []
    const open = statutoryGridLines(items, new Set())
    expect(
      open.map((line) =>
        line.kind === 'group'
          ? `g${line.group.key}@${String(line.depth)}`
          : `${line.row.id}@${String(line.depth)}`,
      ),
    ).toEqual(['g1.1@0', '1.1.1@1', 'g1.1.9@1', '1.1.9.1@2', '1.1.5@1', '1.3@0'])
    const closed = statutoryGridLines(items, new Set(['1.1.9']))
    expect(closed.map((line) => (line.kind === 'group' ? line.open : line.row.id))).toEqual([
      true,
      '1.1.1',
      false,
      '1.1.5',
      '1.3',
    ])
    expect(statutoryGridLines(items, new Set(['1.1'])).length).toBe(2)
  })

  it('lists every row and tells groups from rows', () => {
    expect(statutoryRows(SECTIONS[0]?.items ?? []).map((row) => row.id)).toEqual([
      '1.1.1',
      '1.1.9.1',
      '1.1.5',
      '1.3',
    ])
    expect(isStatutoryGroup({ key: 'g', title: 'G', items: [] })).toBe(true)
    expect(isStatutoryGroup({ id: 'r', number: 'r', label: 'R', cells: {} })).toBe(false)
  })

  it('finds a row or a cell with the part and groups around it', () => {
    const deep = findStatutoryPlace(SECTIONS, '1.1.9.1')
    expect(deep?.path).toEqual(['part1', '1.1', '1.1.9'])
    expect(deep?.column).toBeUndefined()
    const cell = findStatutoryPlace(SECTIONS, '1.1.5/v20')
    expect(cell?.row.id).toBe('1.1.5')
    expect(cell?.column?.id).toBe('v20')
    expect(cell?.path).toEqual(['part1', '1.1'])
    expect(findStatutoryPlace(SECTIONS, '2.1/amount')?.section.key).toBe('part2')
    // A cell that does not apply is not a place.
    expect(findStatutoryPlace(SECTIONS, '1.1.5/b20')).toBeUndefined()
    expect(findStatutoryPlace(SECTIONS, '9.9')).toBeUndefined()
  })

  it('shows a row the open rules about it or its cells, failures first', () => {
    const rules: StatutoryRule[] = [
      { id: 'w', text: 'w', fields: ['1.1.1'], result: 'warning' },
      { id: 'p', text: 'p', fields: ['1.1.1/b20'], result: 'passed' },
      { id: 'f', text: 'f', fields: ['3.1', '1.1.1/v20'], result: 'failed' },
      { id: 'x', text: 'x', fields: ['1.1.5/v20'], result: 'failed' },
    ]
    const row = statutoryRows(SECTIONS[0]?.items ?? [])[0]
    if (row === undefined) throw new Error('no row')
    expect(statutoryRowRules(rules, row, RATES).map((rule) => rule.id)).toEqual(['f', 'w'])
  })
})
