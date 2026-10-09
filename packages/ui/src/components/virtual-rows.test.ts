import { describe, expect, it } from 'vitest'
import { rowOffsets, scrollToShow, visibleRows } from './virtual-rows'

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
