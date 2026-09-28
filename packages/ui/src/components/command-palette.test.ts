import { describe, expect, it } from 'vitest'
import { commandMatches, highlightParts, opensPalette } from './command-logic'

describe('commandMatches', () => {
  const invoices = { label: 'Invoices', description: 'Sales', keywords: ['bill', 'račun'] }

  it('matches every word in the label, description or keywords, ignoring case and accents', () => {
    expect(commandMatches(invoices, 'inv', 'en')).toBe(true)
    expect(commandMatches(invoices, 'sales inv', 'en')).toBe(true)
    expect(commandMatches(invoices, 'BILL', 'en')).toBe(true)
    expect(commandMatches(invoices, 'racun', 'sr-Latn')).toBe(true)
    expect(commandMatches(invoices, 'inv purchases', 'en')).toBe(false)
    expect(commandMatches(invoices, '   ', 'en')).toBe(true)
  })
})

describe('highlightParts', () => {
  it('cuts the label into matching and other pieces', () => {
    expect(highlightParts('New invoice', 'inv', 'en')).toEqual([
      { text: 'New ', match: false },
      { text: 'inv', match: true },
      { text: 'oice', match: false },
    ])
    expect(highlightParts('Invoice in', 'in', 'en').filter((part) => part.match)).toHaveLength(2)
    expect(highlightParts('Plain', '', 'en')).toEqual([{ text: 'Plain', match: false }])
  })
})

describe('opensPalette', () => {
  const key = (
    k: string,
    extra: Partial<Record<'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey', boolean>> = {},
  ) => ({
    key: k,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...extra,
  })

  it('opens with Ctrl or Cmd and K or P, and nothing else', () => {
    expect(opensPalette(key('k', { ctrlKey: true }))).toBe(true)
    expect(opensPalette(key('K', { metaKey: true }))).toBe(true)
    expect(opensPalette(key('p', { ctrlKey: true }))).toBe(true)
    expect(opensPalette(key('k'))).toBe(false)
    expect(opensPalette(key('p', { ctrlKey: true, shiftKey: true }))).toBe(false)
    expect(opensPalette(key('j', { ctrlKey: true }))).toBe(false)
  })
})
