import { describe, expect, it } from 'vitest'
import { headShift, startCover } from './sticky-head'

describe('headShift (P5.28 item 4)', () => {
  it('stays in place while the region’s top is below the sticky edge', () => {
    expect(headShift(120, 56, 800)).toBe(0)
    expect(headShift(56, 56, 800)).toBe(0)
  })

  it('moves down by how far the region has gone under the shell', () => {
    expect(headShift(-200, 56, 800)).toBe(256)
  })

  it('never leaves its region: it stops at the last row', () => {
    expect(headShift(-2000, 56, 800)).toBe(800)
    expect(headShift(-2000, 56, 0)).toBe(0)
  })
})

describe('startCover (P5.28 item 4)', () => {
  it('is 0 without a sticky first column', () => {
    expect(startCover(10, [], false)).toBe(0)
  })

  it('runs from the start edge to the farthest marked cell, left to right', () => {
    expect(startCover(10, [{ left: 10, right: 58 }], false)).toBe(48)
    expect(
      startCover(
        10,
        [
          { left: 10, right: 58 },
          { left: 58, right: 250 },
        ],
        false,
      ),
    ).toBe(240)
  })

  it('runs leftwards from the right edge in right to left', () => {
    expect(
      startCover(
        800,
        [
          { left: 752, right: 800 },
          { left: 560, right: 752 },
        ],
        true,
      ),
    ).toBe(240)
  })
})
