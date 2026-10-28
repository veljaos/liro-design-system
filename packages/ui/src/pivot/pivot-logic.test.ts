import { describe, expect, it } from 'vitest'
import {
  acceptsField,
  areaFieldIds,
  areaOf,
  dropField,
  EMPTY_PIVOT_LAYOUT,
  fieldAreas,
  hasValues,
  moveField,
  pivotGroupKeys,
  pivotHeaderDepth,
  pivotKeyTarget,
  pivotLeaves,
  pivotRowPaths,
  pivotSummaryParts,
  pivotTopGroupKeys,
  pivotViewOf,
  PIVOT_AREAS,
  placeField,
  removeField,
  sameLayout,
  setAggregation,
  setFilterValues,
  unusedFields,
  type PivotColumn,
  type PivotField,
  type PivotLayout,
  type PivotRow,
} from './pivot-logic'

const PARTNER: PivotField = {
  id: 'partner',
  label: 'Partner',
  kind: 'dimension',
  values: [
    { id: 'p1', label: 'Alpha' },
    { id: 'p2', label: 'Beta' },
  ],
}
const MONTH: PivotField = { id: 'month', label: 'Month', kind: 'dimension' }
const SITE: PivotField = { id: 'site', label: 'Site', kind: 'dimension', values: [] }
const AMOUNT: PivotField = {
  id: 'amount',
  label: 'Amount',
  kind: 'measure',
  aggregations: [
    { id: 'sum', label: 'Sum' },
    { id: 'avg', label: 'Average' },
  ],
}
const NO_AGGREGATION: PivotField = { id: 'x', label: 'X', kind: 'measure' }
const FIELDS = [PARTNER, MONTH, SITE, AMOUNT, NO_AGGREGATION]

const LAYOUT: PivotLayout = {
  rows: ['partner', 'site'],
  columns: ['month'],
  values: [{ field: 'amount', aggregation: 'avg' }],
  filters: [],
}

describe('the layout', () => {
  it('offers a dimension rows and columns, and filters only with values; a measure values', () => {
    expect(fieldAreas(PARTNER)).toEqual(['filters', 'columns', 'rows'])
    expect(fieldAreas(MONTH)).toEqual(['columns', 'rows'])
    expect(fieldAreas(SITE)).toEqual(['columns', 'rows'])
    expect(fieldAreas(AMOUNT)).toEqual(['values'])
    expect(fieldAreas(NO_AGGREGATION)).toEqual([])
  })

  it('finds a field and lists an area', () => {
    expect(areaOf(LAYOUT, 'site')).toBe('rows')
    expect(areaOf(LAYOUT, 'amount')).toBe('values')
    expect(areaOf(LAYOUT, 'nothing')).toBeNull()
    expect(areaFieldIds(LAYOUT, 'values')).toEqual(['amount'])
    expect(areaFieldIds(LAYOUT, 'rows')).toEqual(['partner', 'site'])
  })

  it('places a field, taking it from where it stood', () => {
    const moved = placeField(LAYOUT, PARTNER, 'columns', 0)
    expect(moved.rows).toEqual(['site'])
    expect(moved.columns).toEqual(['partner', 'month'])
    // At the end by default; an index past the end is the end.
    expect(placeField(LAYOUT, PARTNER, 'columns').columns).toEqual(['month', 'partner'])
    expect(placeField(LAYOUT, PARTNER, 'columns', 9).columns).toEqual(['month', 'partner'])
  })

  it('adds a measure with its first aggregation and keeps the one chosen when moved', () => {
    const added = placeField(EMPTY_PIVOT_LAYOUT, AMOUNT, 'values')
    expect(added.values).toEqual([{ field: 'amount', aggregation: 'sum' }])
    expect(placeField(LAYOUT, AMOUNT, 'values', 0).values).toEqual([
      { field: 'amount', aggregation: 'avg' },
    ])
  })

  it('starts a filter with every value kept, and keeps its values when moved within filters', () => {
    const filtered = placeField(LAYOUT, PARTNER, 'filters')
    expect(filtered.filters).toEqual([{ field: 'partner', values: [] }])
    expect(filtered.rows).toEqual(['site'])
    const chosen = setFilterValues(filtered, 'partner', ['p2'])
    expect(chosen.filters).toEqual([{ field: 'partner', values: ['p2'] }])
    expect(placeField(chosen, PARTNER, 'filters', 0).filters).toEqual([
      { field: 'partner', values: ['p2'] },
    ])
  })

  it('leaves the layout unchanged for an area the field does not take', () => {
    expect(placeField(LAYOUT, AMOUNT, 'rows')).toBe(LAYOUT)
    expect(placeField(LAYOUT, MONTH, 'filters')).toBe(LAYOUT)
  })

  it('removes a field from any area', () => {
    expect(removeField(LAYOUT, 'amount').values).toEqual([])
    expect(removeField(LAYOUT, 'partner').rows).toEqual(['site'])
    expect(hasValues(removeField(LAYOUT, 'amount'))).toBe(false)
    expect(hasValues(LAYOUT)).toBe(true)
  })

  it('moves a field within its area, and not past the ends', () => {
    expect(moveField(LAYOUT, 'site', -1).rows).toEqual(['site', 'partner'])
    expect(moveField(LAYOUT, 'site', 1).rows).toEqual(['partner', 'site'])
    expect(moveField(LAYOUT, 'partner', -1).rows).toEqual(['partner', 'site'])
    expect(moveField(LAYOUT, 'nothing', 1)).toBe(LAYOUT)
    const two = placeField(placeField(LAYOUT, PARTNER, 'filters'), MONTH, 'rows')
    const withFilters = { ...two, filters: [...two.filters, { field: 'zone', values: [] }] }
    expect(moveField(withFilters, 'zone', -1).filters.map((each) => each.field)).toEqual([
      'zone',
      'partner',
    ])
    const values = { ...LAYOUT, values: [...LAYOUT.values, { field: 'x', aggregation: 'n' }] }
    expect(moveField(values, 'x', -1).values.map((each) => each.field)).toEqual(['x', 'amount'])
  })

  it('changes an aggregation', () => {
    expect(setAggregation(LAYOUT, 'amount', 'sum').values).toEqual([
      { field: 'amount', aggregation: 'sum' },
    ])
  })

  it('lists the fields not used, in the application’s order', () => {
    expect(unusedFields(FIELDS, LAYOUT).map((field) => field.id)).toEqual(['x'])
    expect(unusedFields(FIELDS, EMPTY_PIVOT_LAYOUT)).toHaveLength(5)
  })
})

const COLUMNS: PivotColumn[] = [
  {
    key: 'jul',
    label: 'Jul',
    kind: 'money',
    currency: 'RSD',
    children: [
      { key: 'jul:amount', label: 'Amount' },
      { key: 'jul:docs', label: 'Documents', kind: 'number', decimals: 0 },
    ],
  },
  { key: 'total', label: 'Total', total: true, kind: 'money', currency: 'EUR' },
]

const ROWS: PivotRow[] = [
  {
    key: 'a',
    label: 'Alpha',
    cells: {},
    children: [
      { key: 'a1', label: 'Site 1', cells: {} },
      {
        key: 'a2',
        label: 'Site 2',
        cells: {},
        children: [{ key: 'a2x', label: 'X', cells: {} }],
      },
    ],
  },
  { key: 'b', label: 'Beta', cells: {} },
]

describe('the result', () => {
  it('lists the leaves with their path and inherited format', () => {
    const leaves = pivotLeaves(COLUMNS)
    expect(leaves.map((leaf) => leaf.column.key)).toEqual(['jul:amount', 'jul:docs', 'total'])
    expect(leaves[0]).toMatchObject({ path: ['Jul', 'Amount'], kind: 'money', currency: 'RSD' })
    expect(leaves[1]).toMatchObject({ kind: 'number', currency: 'RSD', decimals: 0, total: false })
    expect(leaves[2]).toMatchObject({ path: ['Total'], currency: 'EUR', total: true })
    expect(pivotLeaves([{ key: 'n', label: 'N' }])[0]?.kind).toBe('number')
  })

  it('counts the header rows by the deepest leaf', () => {
    expect(pivotHeaderDepth(COLUMNS)).toBe(2)
    expect(pivotHeaderDepth([{ key: 'a', label: 'A' }])).toBe(1)
    expect(pivotHeaderDepth([])).toBe(0)
  })

  it('gives each row its path, and lists the groups', () => {
    const paths = pivotRowPaths(ROWS)
    expect(paths.get('a2x')).toEqual(['Alpha', 'Site 2', 'X'])
    expect(paths.get('b')).toEqual(['Beta'])
    expect(pivotGroupKeys(ROWS)).toEqual(['a', 'a2'])
    expect(pivotTopGroupKeys(ROWS)).toEqual(['a'])
  })
})

describe('the grid’s keys', () => {
  const size = { rows: 30, columns: 5 }
  const ltr = { rtl: false, ctrl: false }
  it('moves by one cell, the horizontal arrows mirrored in right to left', () => {
    expect(pivotKeyTarget('ArrowDown', { row: 0, column: 0 }, size, ltr)).toEqual({
      row: 1,
      column: 0,
    })
    expect(pivotKeyTarget('ArrowUp', { row: 0, column: 0 }, size, ltr)).toEqual({
      row: 0,
      column: 0,
    })
    expect(pivotKeyTarget('ArrowRight', { row: 2, column: 1 }, size, ltr)).toEqual({
      row: 2,
      column: 2,
    })
    expect(
      pivotKeyTarget('ArrowRight', { row: 2, column: 1 }, size, { ...ltr, rtl: true }),
    ).toEqual({ row: 2, column: 0 })
    expect(pivotKeyTarget('ArrowLeft', { row: 2, column: 1 }, size, { ...ltr, rtl: true })).toEqual(
      {
        row: 2,
        column: 2,
      },
    )
    expect(pivotKeyTarget('ArrowRight', { row: 2, column: 4 }, size, ltr)).toEqual({
      row: 2,
      column: 4,
    })
  })

  it('goes to the row’s ends with Home and End, the grid’s with Ctrl', () => {
    expect(pivotKeyTarget('Home', { row: 3, column: 3 }, size, ltr)).toEqual({ row: 3, column: 0 })
    expect(pivotKeyTarget('End', { row: 3, column: 0 }, size, ltr)).toEqual({ row: 3, column: 4 })
    expect(pivotKeyTarget('Home', { row: 3, column: 3 }, size, { ...ltr, ctrl: true })).toEqual({
      row: 0,
      column: 0,
    })
    expect(pivotKeyTarget('End', { row: 3, column: 0 }, size, { ...ltr, ctrl: true })).toEqual({
      row: 29,
      column: 4,
    })
  })

  it('pages by ten rows, inside the grid, and ignores other keys', () => {
    expect(pivotKeyTarget('PageDown', { row: 25, column: 1 }, size, ltr)).toEqual({
      row: 29,
      column: 1,
    })
    expect(pivotKeyTarget('PageUp', { row: 12, column: 1 }, size, ltr)).toEqual({
      row: 2,
      column: 1,
    })
    expect(pivotKeyTarget('Enter', { row: 1, column: 1 }, size, ltr)).toBeNull()
    expect(pivotKeyTarget('a', { row: 1, column: 1 }, size, ltr)).toBeNull()
  })
})

describe('suggested views, the summary and dropping a chip (P5.93 item 45)', () => {
  it('orders the zones Rows, Columns, Values, Filters', () => {
    expect(PIVOT_AREAS).toEqual(['rows', 'columns', 'values', 'filters'])
  })

  it('knows a layout as a view only when every field, place, aggregation and filter matches', () => {
    const views = [
      { id: 'a', label: 'A', layout: LAYOUT },
      { id: 'b', label: 'B', layout: { ...LAYOUT, columns: [] } },
    ]
    expect(pivotViewOf(views, { ...LAYOUT })).toBe('a')
    expect(pivotViewOf(views, { ...LAYOUT, columns: [] })).toBe('b')
    expect(pivotViewOf(views, { ...LAYOUT, rows: ['site', 'partner'] })).toBeUndefined()
    expect(pivotViewOf(views, setAggregation(LAYOUT, 'amount', 'sum'))).toBeUndefined()
    const filtered = { ...LAYOUT, filters: [{ field: 'partner', values: ['p1', 'p2'] }] }
    expect(
      sameLayout(filtered, { ...LAYOUT, filters: [{ field: 'partner', values: ['p2', 'p1'] }] }),
    ).toBe(true)
    expect(sameLayout(filtered, LAYOUT)).toBe(false)
  })

  it('names what the layout shows, in the fields’ words, filters only when they keep some values', () => {
    const parts = pivotSummaryParts(FIELDS, {
      ...LAYOUT,
      filters: [
        { field: 'partner', values: ['p2'] },
        { field: 'site', values: [] },
      ],
    })
    expect(parts).toEqual({
      values: [{ field: 'Amount', aggregation: 'Average' }],
      rows: ['Partner', 'Site'],
      columns: ['Month'],
      filters: [{ field: 'Partner', values: ['Beta'] }],
    })
  })

  it('drops a chip into a zone that takes it, or out of the layout', () => {
    expect(acceptsField(AMOUNT, 'rows')).toBe(false)
    expect(acceptsField(AMOUNT, 'values')).toBe(true)
    expect(acceptsField(MONTH, 'filters')).toBe(false)
    expect(acceptsField(MONTH, 'available')).toBe(true)
    expect(dropField(LAYOUT, PARTNER, 'columns', 1).columns).toEqual(['month', 'partner'])
    expect(dropField(LAYOUT, SITE, 'rows', 0).rows).toEqual(['site', 'partner'])
    expect(dropField(LAYOUT, PARTNER, 'available', 0).rows).toEqual(['site'])
  })
})
