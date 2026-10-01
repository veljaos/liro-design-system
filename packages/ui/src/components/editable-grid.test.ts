import { describe, expect, it } from 'vitest'
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
