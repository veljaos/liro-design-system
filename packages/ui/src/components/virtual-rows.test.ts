import { describe, expect, it } from 'vitest'
import {
  overscanRows,
  rowOffsets,
  scrollToShow,
  spacersBetween,
  visibleRows,
  WINDOW_OVERSCAN,
  withFocusedRow,
} from './virtual-rows'

describe('the shared row window', () => {
  it('adds up the tops of rows of known heights', () => {
    expect(rowOffsets([10, 20, 30])).toEqual({ tops: [0, 10, 30], total: 60 })
    expect(rowOffsets([])).toEqual({ tops: [], total: 0 })
  })
  it('draws only the rows in view and around them', () => {
    const { tops, total } = rowOffsets(Array.from({ length: 5000 }, () => 48))
    expect(total).toBe(240000)
    expect(visibleRows(tops, total, 0, 400)).toEqual({ first: 0, last: 14 })
    const middle = visibleRows(tops, total, 48000, 400)
    expect(middle.first).toBe(995)
    expect(middle.last - middle.first).toBeLessThan(20)
    expect(visibleRows([], 0, 0, 400)).toEqual({ first: 0, last: 0 })
  })
  it('takes the overscan in pixels', () => {
    const { tops, total } = rowOffsets(Array.from({ length: 1000 }, () => 40))
    // 600px above and below a 400px view at 20,000px: rows 485 up to 525.
    expect(visibleRows(tops, total, 20000, 400, 600)).toEqual({ first: 485, last: 525 })
    expect(visibleRows(tops, total, 39800, 400, 600)).toEqual({ first: 980, last: 1000 })
  })
  it('scrolls a row fully into view, or not at all', () => {
    expect(scrollToShow(480, 48, 0, 400)).toBe(128)
    expect(scrollToShow(48, 48, 100, 400)).toBe(48)
    expect(scrollToShow(200, 48, 100, 400)).toBeUndefined()
  })
})

describe('the window rules for TanStack Virtual (DataTable)', () => {
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
