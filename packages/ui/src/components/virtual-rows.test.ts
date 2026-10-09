import { describe, expect, it } from 'vitest'
import {
  keepFocusedRow,
  overscanRows,
  spacersBetween,
  WINDOW_OVERSCAN,
  withFocusedRow,
} from './virtual-rows'

describe('the window rules for TanStack Virtual', () => {
  it('turns the 600px overscan into rows', () => {
    expect(WINDOW_OVERSCAN).toBe(600)
    expect(overscanRows(44)).toBe(14)
    expect(overscanRows(104)).toBe(6)
    expect(overscanRows(0)).toBe(600)
    expect(overscanRows(1000)).toBe(1)
  })
  it('keeps the focused row, one before and two after it, drawn', () => {
    expect(withFocusedRow([10, 11, 12], null, 100)).toEqual([10, 11, 12])
    expect(withFocusedRow([10, 11, 12], 50, 100)).toEqual([10, 11, 12, 49, 50, 51, 52])
    expect(withFocusedRow([10, 11, 12], 12, 100)).toEqual([10, 11, 12, 13, 14])
    expect(withFocusedRow([50, 51], 0, 52)).toEqual([0, 1, 2, 50, 51])
    expect(withFocusedRow([0, 1], 51, 52)).toEqual([0, 1, 50, 51])
    expect(withFocusedRow([0, 1], 52, 52)).toEqual([0, 1])
  })
  it('extends TanStack Virtual’s range with the focused row', () => {
    const range = { startIndex: 10, endIndex: 12, overscan: 2, count: 100 }
    expect(keepFocusedRow(range, null)).toEqual([8, 9, 10, 11, 12, 13, 14])
    expect(keepFocusedRow(range, 50)).toEqual([8, 9, 10, 11, 12, 13, 14, 49, 50, 51, 52])
    expect(keepFocusedRow({ ...range, startIndex: 0, endIndex: 1 }, 99)).toEqual([
      0, 1, 2, 3, 98, 99,
    ])
  })
  it('puts spacers before, between and after drawn rows', () => {
    expect(
      spacersBetween(
        [
          { start: 0, end: 44 },
          { start: 44, end: 88 },
        ],
        440,
      ),
    ).toEqual({ before: [0, 0], after: 352 })
    expect(
      spacersBetween(
        [
          { start: 88, end: 132 },
          { start: 440, end: 484 },
        ],
        880,
      ),
    ).toEqual({ before: [88, 308], after: 396 })
    expect(spacersBetween([], 100)).toEqual({ before: [], after: 100 })
  })
})
