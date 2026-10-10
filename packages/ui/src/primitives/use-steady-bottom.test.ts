import { describe, expect, it } from 'vitest'
import { steadySpacer } from './use-steady-bottom'

describe('steadySpacer', () => {
  it('is 0 while the content reaches the bottom of the view', () => {
    expect(steadySpacer(0, 500, 0, 800)).toBe(0)
    expect(steadySpacer(300, 500, 0, 800)).toBe(0)
  })
  it('holds the space a shrinking content gave up at the end of the view', () => {
    // Scrolled to the end of 800px; a 23px line goes: the view would move down by 23px.
    expect(steadySpacer(300, 500, 0, 777)).toBe(23)
  })
  it('counts the content from its own top in the area', () => {
    expect(steadySpacer(300, 500, 24, 753)).toBe(23)
  })
  it('gives the space back as the view moves up', () => {
    expect(steadySpacer(290, 500, 0, 777)).toBe(13)
    expect(steadySpacer(277, 500, 0, 777)).toBe(0)
  })
  it('rounds up, so a fraction of a pixel never moves the view', () => {
    expect(steadySpacer(300.5, 500, 0, 800)).toBe(1)
  })
})
