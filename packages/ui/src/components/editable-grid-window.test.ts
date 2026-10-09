import { describe, expect, it } from 'vitest'
import { ariaRowIndexes, gridWindow } from './editable-grid-window'
import { WINDOW_OVERSCAN } from './virtual-rows'

const rows = (count: number, height = 37) => Array.from({ length: count }, () => height)

describe('gridWindow', () => {
  it('draws the rows in view and the overscan around them, with spacers for the rest', () => {
    // 300 rows of 37px; the view starts 3,700px down (row 100) and is 740px high (20 rows).
    const window = gridWindow(rows(300), 3700, 740, null)
    const overscanRows = Math.floor(WINDOW_OVERSCAN / 37)
    expect(window.first).toBe(100 - overscanRows - 1)
    expect(window.last).toBeGreaterThanOrEqual(120 + overscanRows)
    expect(window.last).toBeLessThanOrEqual(120 + overscanRows + 2)
    expect(window.before).toBe(window.first * 37)
    expect(window.after).toBe((300 - window.last) * 37)
  })

  it('starts at the top while the grid is lower on the screen', () => {
    const window = gridWindow(rows(300), -400, 900, null)
    expect(window.first).toBe(0)
    expect(window.before).toBe(0)
    expect(window.last).toBeLessThan(60)
  })

  it('always draws the focused row, one before it and two after it', () => {
    const window = gridWindow(rows(300), 0, 700, 250)
    expect(window.first).toBe(0)
    expect(window.last).toBe(253)
    const end = gridWindow(rows(300), 0, 700, 299)
    expect(end.last).toBe(300)
    expect(end.after).toBe(0)
  })

  it('uses measured heights, and draws nothing of an empty grid', () => {
    const heights = [...rows(10, 37), 200, ...rows(10, 37)]
    const window = gridWindow(heights, 0, 100, null, 0)
    expect(window.first).toBe(0)
    expect(window.last).toBe(3)
    expect(gridWindow([], 0, 700, null)).toEqual({ first: 0, last: 0, before: 0, after: 0 })
  })
})

describe('ariaRowIndexes', () => {
  it('counts the header, each line and the notes under it, and the totals', () => {
    expect(ariaRowIndexes([false, true, false], 1, 1)).toEqual({ indexes: [2, 3, 5], count: 6 })
    expect(ariaRowIndexes([], 1, 0)).toEqual({ indexes: [], count: 1 })
  })
})
