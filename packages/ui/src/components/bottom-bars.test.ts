import { describe, expect, it } from 'vitest'
import { bottomBarsHeight } from './bottom-bars'

describe('bottomBarsHeight (toasts stand above every sticky bottom bar, P5.90)', () => {
  it('adds up the bars, in whole pixels', () => {
    expect(bottomBarsHeight([])).toBe(0)
    expect(bottomBarsHeight([57])).toBe(57)
    expect(bottomBarsHeight([57.4, 68.3])).toBe(126)
  })

  it('never counts a bar below zero', () => {
    expect(bottomBarsHeight([-4, 40])).toBe(40)
  })
})
