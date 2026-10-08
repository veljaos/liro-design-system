import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { editableCellCount, taxCategoryText } from './line-types'
import {
  gridKeyAction,
  orderMessages,
  type GridKey,
  type GridPosition,
} from './editable-grid-logic'

const key = (k: string, extra: Partial<GridKey> = {}): GridKey => ({
  key: k,
  shift: false,
  mod: false,
  alt: false,
  ...extra,
})
const at = (row: number, column: number, extra: Partial<GridPosition> = {}): GridPosition => ({
  row,
  column,
  rowCount: 3,
  columnCount: 4,
  canAdd: true,
  canRemove: true,
  phone: false,
  ...extra,
})

describe('gridKeyAction on desktop (Excel, the old grid)', () => {
  it('Enter goes to the same column in the next row, and adds a row after the last', () => {
    expect(gridKeyAction(key('Enter'), at(0, 2))).toEqual({ type: 'focus', row: 1, column: 2 })
    expect(gridKeyAction(key('Enter'), at(2, 2))).toEqual({ type: 'add', at: 3, column: 2 })
    expect(gridKeyAction(key('Enter'), at(2, 2, { canAdd: false }))).toBeNull()
  })

  it('Shift+Enter goes to the same column in the previous row', () => {
    expect(gridKeyAction(key('Enter', { shift: true }), at(1, 3))).toEqual({
      type: 'focus',
      row: 0,
      column: 3,
    })
    expect(gridKeyAction(key('Enter', { shift: true }), at(0, 3))).toBeNull()
  })

  it('leaves Tab, arrows and Alt+Enter to the browser and the fields', () => {
    for (const k of [key('Tab'), key('ArrowDown'), key('Enter', { alt: true }), key('a')]) {
      expect(gridKeyAction(k, at(1, 1))).toBeNull()
    }
  })
})

describe('gridKeyAction row shortcuts (Ctrl or Cmd)', () => {
  it('Ctrl+Enter inserts a row below, in the same column, within maxRows', () => {
    expect(gridKeyAction(key('Enter', { mod: true }), at(1, 2))).toEqual({
      type: 'add',
      at: 2,
      column: 2,
    })
    expect(gridKeyAction(key('Enter', { mod: true }), at(1, 2, { canAdd: false }))).toBeNull()
  })

  it('Ctrl+Delete (or the Mac delete key) removes the row; the focus goes to the next row', () => {
    expect(gridKeyAction(key('Delete', { mod: true }), at(0, 1))).toEqual({
      type: 'remove',
      row: 0,
      focusRow: 0,
      column: 1,
    })
    expect(gridKeyAction(key('Backspace', { mod: true }), at(2, 1))).toEqual({
      type: 'remove',
      row: 2,
      focusRow: 1,
      column: 1,
    })
    expect(gridKeyAction(key('Delete', { mod: true }), at(0, 1, { canRemove: false }))).toBeNull()
  })

  it('removing the only row leaves no row to focus', () => {
    expect(gridKeyAction(key('Delete', { mod: true }), at(0, 0, { rowCount: 1 }))).toEqual({
      type: 'remove',
      row: 0,
      focusRow: null,
      column: 0,
    })
  })
})

describe('gridKeyAction on phones ("next" on the on-screen keyboard)', () => {
  const phone = { phone: true }
  it('goes through the fields of the row, then the next row, then adds a row', () => {
    expect(gridKeyAction(key('Enter'), at(0, 1, phone))).toEqual({
      type: 'focus',
      row: 0,
      column: 2,
    })
    expect(gridKeyAction(key('Enter'), at(0, 3, phone))).toEqual({
      type: 'focus',
      row: 1,
      column: 0,
    })
    expect(gridKeyAction(key('Enter'), at(2, 3, phone))).toEqual({ type: 'add', at: 3, column: 0 })
  })

  it('goes back with Shift+Enter', () => {
    expect(gridKeyAction(key('Enter', { shift: true }), at(1, 0, phone))).toEqual({
      type: 'focus',
      row: 0,
      column: 3,
    })
  })
})

describe('gridKeyAction across line types (P5.18)', () => {
  // A heading (1 cell), two lines (4 cells), a subtotal (0), a text line (1), a line (4).
  const rowCells = [1, 4, 4, 0, 1, 4]
  const typed = (row: number, column: number, extra: Partial<GridPosition> = {}) =>
    at(row, column, { rowCount: 6, rowCells, ...extra })

  it('Enter skips the subtotal and keeps the column through a one-cell row', () => {
    // From the second line's third cell, down past the subtotal into the text line's one cell.
    expect(gridKeyAction(key('Enter'), typed(2, 2))).toEqual({ type: 'focus', row: 4, column: 0 })
    // From the text line, the preferred column comes back in the next full line.
    expect(gridKeyAction(key('Enter'), typed(4, 0, { preferredColumn: 2 }))).toEqual({
      type: 'focus',
      row: 5,
      column: 2,
    })
    // Up from the last line skips nothing it can stop at: the text line.
    expect(gridKeyAction(key('Enter', { shift: true }), typed(5, 3))).toEqual({
      type: 'focus',
      row: 4,
      column: 0,
    })
    // Up from the text line skips the subtotal into the line above it, in the preferred column.
    expect(
      gridKeyAction(key('Enter', { shift: true }), typed(4, 0, { preferredColumn: 3 })),
    ).toEqual({ type: 'focus', row: 2, column: 3 })
  })

  it('Enter on the last row adds a line in the preferred column', () => {
    expect(gridKeyAction(key('Enter'), typed(5, 1))).toEqual({ type: 'add', at: 6, column: 1 })
  })

  it('Ctrl+Enter inserts below a heading in the preferred column', () => {
    expect(gridKeyAction(key('Enter', { mod: true }), typed(0, 0, { preferredColumn: 2 }))).toEqual(
      { type: 'add', at: 1, column: 2 },
    )
  })

  it('Ctrl+Delete moves the focus past a subtotal to the next row with cells', () => {
    // Removing row 2: the subtotal (3) is skipped, the text line (4) becomes row 3.
    expect(gridKeyAction(key('Delete', { mod: true }), typed(2, 3))).toEqual({
      type: 'remove',
      row: 2,
      focusRow: 3,
      column: 0,
    })
    // Removing the last row: back to the text line, row 4.
    expect(gridKeyAction(key('Delete', { mod: true }), typed(5, 2))).toEqual({
      type: 'remove',
      row: 5,
      focusRow: 4,
      column: 0,
    })
  })

  it('on phones "next" goes through a heading’s one cell and skips the subtotal', () => {
    const phone = { phone: true }
    expect(gridKeyAction(key('Enter'), typed(0, 0, phone))).toEqual({
      type: 'focus',
      row: 1,
      column: 0,
    })
    expect(gridKeyAction(key('Enter'), typed(2, 3, phone))).toEqual({
      type: 'focus',
      row: 4,
      column: 0,
    })
    expect(gridKeyAction(key('Enter', { shift: true }), typed(4, 0, phone))).toEqual({
      type: 'focus',
      row: 2,
      column: 3,
    })
  })

  it('a grid of subtotals only has nowhere to go', () => {
    expect(
      gridKeyAction(key('Enter', { shift: true }), at(1, 0, { rowCount: 2, rowCells: [0, 4] })),
    ).toBeNull()
  })
})

describe('line types (P5.18)', () => {
  it('counts the editable cells of each type', () => {
    expect(editableCellCount('line', 5, true)).toBe(5)
    expect(editableCellCount('discount', 5, true)).toBe(5)
    expect(editableCellCount('deduction', 5, false)).toBe(5)
    expect(editableCellCount('text', 5, true)).toBe(1)
    expect(editableCellCount('heading', 5, true)).toBe(1)
    expect(editableCellCount('heading', 5, false)).toBe(0)
    expect(editableCellCount('subtotal', 5, true)).toBe(0)
  })

  it('writes a tax category as its code with the rate through format.percent', () => {
    const percent = (value: string) => `${value}%`
    expect(taxCategoryText({ value: 'S20', code: 'S', rate: '20' }, percent)).toBe('S 20%')
    expect(taxCategoryText({ value: 'AE', code: 'AE' }, percent)).toBe('AE')
    const serbian = createFormat('sr-Latn-RS')
    expect(
      taxCategoryText({ value: 'S10', code: 'S', rate: '10' }, (value) => serbian.percent(value)),
    ).toBe('S 10%')
  })
})

describe('orderMessages', () => {
  it('puts errors before warnings, each in its given order', () => {
    const ordered = orderMessages([
      { tone: 'warning', text: 'w1' },
      { tone: 'danger', text: 'e1' },
      { tone: 'warning', text: 'w2' },
      { tone: 'danger', text: 'e2' },
    ])
    expect(ordered.map((message) => message.text)).toEqual(['e1', 'e2', 'w1', 'w2'])
  })
})
