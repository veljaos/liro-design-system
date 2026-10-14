import { describe, expect, it } from 'vitest'
import { rowFocusTarget } from './data-table-logic'

describe('rowFocusTarget', () => {
  it('moves down and up one row', () => {
    expect(rowFocusTarget('ArrowDown', 0, 5)).toBe(1)
    expect(rowFocusTarget('ArrowUp', 3, 5)).toBe(2)
  })
  it('stops at the ends', () => {
    expect(rowFocusTarget('ArrowDown', 4, 5)).toBeNull()
    expect(rowFocusTarget('ArrowUp', 0, 5)).toBeNull()
  })
  it('goes to the first and last with Home and End', () => {
    expect(rowFocusTarget('Home', 3, 5)).toBe(0)
    expect(rowFocusTarget('End', 1, 5)).toBe(4)
    expect(rowFocusTarget('Home', 0, 5)).toBeNull()
  })
  it('ignores other keys and rows outside the list', () => {
    expect(rowFocusTarget('ArrowRight', 1, 5)).toBeNull()
    expect(rowFocusTarget('Enter', 1, 5)).toBeNull()
    expect(rowFocusTarget('ArrowDown', -1, 5)).toBeNull()
    expect(rowFocusTarget('ArrowDown', 0, 0)).toBeNull()
  })
})
