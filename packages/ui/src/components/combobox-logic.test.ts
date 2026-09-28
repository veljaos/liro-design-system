import { afterEach, describe, expect, it, vi } from 'vitest'
import { debounce, filterChoices, moveActive } from './combobox-logic'
import { toggleValue } from './multi-select-field'

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta', disabled: true },
  { value: 'c', label: 'Gamma' },
  { value: 'd', label: 'Delta' },
]

describe('moveActive', () => {
  it('moves down and up, skipping disabled options', () => {
    expect(moveActive('ArrowDown', -1, OPTIONS)).toBe(0)
    expect(moveActive('ArrowDown', 0, OPTIONS)).toBe(2)
    expect(moveActive('ArrowUp', 2, OPTIONS)).toBe(0)
  })

  it('wraps around at both ends', () => {
    expect(moveActive('ArrowDown', 3, OPTIONS)).toBe(0)
    expect(moveActive('ArrowUp', 0, OPTIONS)).toBe(3)
    expect(moveActive('ArrowUp', -1, OPTIONS)).toBe(3)
  })

  it('goes to the first and last usable option with Home and End', () => {
    const lastDisabled = [...OPTIONS, { value: 'e', label: 'Epsilon', disabled: true }]
    expect(moveActive('Home', 3, lastDisabled)).toBe(0)
    expect(moveActive('End', 0, lastDisabled)).toBe(3)
  })

  it('is -1 when nothing can be chosen', () => {
    expect(moveActive('ArrowDown', -1, [])).toBe(-1)
    expect(moveActive('ArrowDown', -1, [{ value: 'x', label: 'X', disabled: true }])).toBe(-1)
  })
})

describe('filterChoices', () => {
  it('keeps every option for an empty or blank query', () => {
    expect(filterChoices(OPTIONS, '  ', 'en')).toHaveLength(4)
  })

  it('matches part of the label, ignoring case and accents', () => {
    const people = [
      { value: '1', label: 'Ana Jovanović' },
      { value: '2', label: 'Đorđe Petrović' },
      { value: '3', label: 'Marko Ilić' },
    ]
    expect(filterChoices(people, 'OVIC', 'sr-Latn').map((p) => p.value)).toEqual(['1', '2'])
    expect(filterChoices(people, 'ilic', 'sr-Latn').map((p) => p.value)).toEqual(['3'])
  })

  it('lowercases in the page locale (Turkish dotted I)', () => {
    const cities = [{ value: 'i', label: 'İstanbul' }]
    expect(filterChoices(cities, 'istanbul', 'tr')).toHaveLength(1)
  })
})

describe('debounce', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs once, with the last arguments, after the pause', () => {
    vi.useFakeTimers()
    const run = vi.fn()
    const search = debounce(run, 300)
    search.call('a')
    vi.advanceTimersByTime(200)
    search.call('ab')
    vi.advanceTimersByTime(299)
    expect(run).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(run).toHaveBeenCalledTimes(1)
    expect(run).toHaveBeenCalledWith('ab')
  })

  it('drops a pending run when cancelled', () => {
    vi.useFakeTimers()
    const run = vi.fn()
    const search = debounce(run, 300)
    search.call('a')
    search.cancel()
    vi.advanceTimersByTime(1000)
    expect(run).not.toHaveBeenCalled()
  })
})

describe('toggleValue', () => {
  it('adds a value at the end, or removes it', () => {
    expect(toggleValue(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleValue(['a', 'b'], 'a')).toEqual(['b'])
  })
})
