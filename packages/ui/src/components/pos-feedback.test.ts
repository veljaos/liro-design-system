import { describe, expect, it } from 'vitest'
import { grownLines, quantitiesOf, TAP_VIBRATION, tapFeedback } from './pos-feedback'

/* Every tap of a till answers at once. */

describe('grownLines', () => {
  const lines = [
    { id: 'a', quantity: '1' },
    { id: 'b', quantity: '2.5' },
  ]

  it('flashes nothing on the first render', () => {
    expect(grownLines(null, lines)).toEqual([])
  })

  it('finds a new line and a line whose quantity went up', () => {
    const before = quantitiesOf(lines)
    expect(
      grownLines(before, [
        { id: 'a', quantity: '2' },
        { id: 'b', quantity: '2.5' },
        { id: 'c', quantity: '1' },
      ]),
    ).toEqual(['a', 'c'])
  })

  it('does not flash a line that went down, stayed or is being typed', () => {
    const before = quantitiesOf(lines)
    expect(
      grownLines(before, [
        { id: 'a', quantity: '1' },
        { id: 'b', quantity: '2' },
      ]),
    ).toEqual([])
    expect(grownLines(before, [{ id: 'a', quantity: '1,' }])).toEqual([])
  })

  it('compares decimal strings exactly, never as numbers', () => {
    const before = quantitiesOf([{ id: 'a', quantity: '0.1' }])
    expect(grownLines(before, [{ id: 'a', quantity: '0.10' }])).toEqual([])
    expect(grownLines(before, [{ id: 'a', quantity: '0.100000000000000001' }])).toEqual(['a'])
  })
})

describe('tapFeedback', () => {
  it('vibrates briefly where the device can', () => {
    const calls: number[] = []
    const device = {
      vibrate: (pattern: number) => {
        calls.push(pattern)
        return true
      },
    }
    expect(tapFeedback(device)).toBe(true)
    expect(calls).toEqual([TAP_VIBRATION])
  })

  it('does nothing without a vibration, or when the browser refuses', () => {
    expect(tapFeedback({})).toBe(false)
    expect(tapFeedback(undefined)).toBe(false)
    expect(
      tapFeedback({
        vibrate: () => {
          throw new Error('not allowed')
        },
      }),
    ).toBe(false)
  })
})
