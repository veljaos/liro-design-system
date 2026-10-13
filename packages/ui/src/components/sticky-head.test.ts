import { describe, expect, it } from 'vitest'
import { headShift } from './sticky-head'

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
