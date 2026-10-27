import { describe, expect, it } from 'vitest'
import { edgeFade, revealDelta, TAB_ROW_FADE, wheelScroll } from './tab-row'

const ROW = { left: 0, right: 390 }

describe('revealDelta (the tab row rule, P5.90)', () => {
  it('leaves a tab that stands clear of the fades where it is', () => {
    expect(revealDelta(ROW, { left: 100, right: 180 }, TAB_ROW_FADE)).toBe(0)
  })

  it('scrolls toward the end until a tab past the end stands clear of its fade', () => {
    expect(revealDelta(ROW, { left: 400, right: 480 }, TAB_ROW_FADE)).toBe(480 - (390 - 32))
  })

  it('scrolls back toward the start for a tab past the start', () => {
    expect(revealDelta(ROW, { left: -120, right: -40 }, TAB_ROW_FADE)).toBe(-120 - 32)
  })

  it('aligns a tab wider than the row by its start edge, in reading order', () => {
    expect(revealDelta(ROW, { left: 500, right: 1000 }, TAB_ROW_FADE)).toBe(500 - 32)
    expect(revealDelta(ROW, { left: -700, right: -100 }, TAB_ROW_FADE, 'rtl')).toBe(
      -100 - (390 - 32),
    )
  })
})

describe('edgeFade', () => {
  it('fades only the edges with more past them, toward reading order', () => {
    expect(edgeFade({ start: false, end: false }, 'ltr')).toBeUndefined()
    expect(edgeFade({ start: true, end: true }, 'rtl')).toBe(
      'linear-gradient(to left, transparent, currentcolor 32px, currentcolor calc(100% - 32px), transparent)',
    )
  })
})

describe('wheelScroll (P5.93 item 9)', () => {
  const row = { scrollLeft: 0, scrollWidth: 500, clientWidth: 390 }

  it('moves a row that scrolls sideways toward its end on a downward turn', () => {
    expect(wheelScroll({ deltaX: 0, deltaY: 40 }, row)).toBe(40)
    expect(wheelScroll({ deltaX: 0, deltaY: 400 }, row)).toBe(110)
  })

  it('moves toward the start on an upward turn, and toward the left end in right-to-left', () => {
    expect(wheelScroll({ deltaX: 0, deltaY: -40 }, { ...row, scrollLeft: 60 })).toBe(-40)
    expect(wheelScroll({ deltaX: 0, deltaY: 40 }, row, 'rtl')).toBe(-40)
    expect(wheelScroll({ deltaX: 0, deltaY: -40 }, { ...row, scrollLeft: -60 }, 'rtl')).toBe(40)
  })

  it('leaves the turn to the page at an end, when the row fits, or when it is sideways', () => {
    expect(wheelScroll({ deltaX: 0, deltaY: -40 }, row)).toBe(0)
    expect(wheelScroll({ deltaX: 0, deltaY: 40 }, { ...row, scrollLeft: 110 })).toBe(0)
    expect(wheelScroll({ deltaX: 0, deltaY: 40 }, { ...row, scrollWidth: 390 })).toBe(0)
    expect(wheelScroll({ deltaX: 30, deltaY: 10 }, row)).toBe(0)
  })
})
