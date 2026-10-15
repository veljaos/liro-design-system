import { describe, expect, it } from 'vitest'
import { articlePlaces, bylineText, emailProblem, looksLikeEmail } from './blog-logic'
import { opensOutside } from './share-links'
import { emailPreviewWidth } from './email-preview'

describe('an e-mail address', () => {
  it('has one "@", something before it and a domain with a dot', () => {
    expect(looksLikeEmail('milica.petrovic@example.com')).toBe(true)
    expect(looksLikeEmail('  a@b.rs ')).toBe(true)
    expect(looksLikeEmail('')).toBe(false)
    expect(looksLikeEmail('milica')).toBe(false)
    expect(looksLikeEmail('@example.com')).toBe(false)
    expect(looksLikeEmail('milica@example')).toBe(false)
    expect(looksLikeEmail('milica@example.')).toBe(false)
    expect(looksLikeEmail('milica@.com')).toBe(false)
    expect(looksLikeEmail('a@b@example.com')).toBe(false)
    expect(looksLikeEmail('milica petrovic@example.com')).toBe(false)
  })

  it('is missing, not an address, or fine', () => {
    expect(emailProblem('  ')).toBe('required')
    expect(emailProblem('milica@')).toBe('invalid')
    expect(emailProblem('milica@example.com')).toBeNull()
  })
})

describe('a byline', () => {
  it('joins its parts and leaves the empty ones out', () => {
    expect(bylineText(['Jelena Stanković', '14.10.2026.', '6 min read'])).toBe(
      'Jelena Stanković · 14.10.2026. · 6 min read',
    )
    expect(bylineText([undefined, '14.10.2026.', '', null])).toBe('14.10.2026.')
    expect(bylineText([])).toBe('')
  })
})

describe('a list of articles', () => {
  it('puts the first one across the row when featured', () => {
    expect(articlePlaces(['a', 'b', 'c'], true)).toEqual({ featured: 'a', rest: ['b', 'c'] })
    expect(articlePlaces(['a', 'b'], false)).toEqual({ featured: null, rest: ['a', 'b'] })
    expect(articlePlaces([], true)).toEqual({ featured: null, rest: [] })
  })
})

describe('sharing', () => {
  it('opens web addresses in a new tab unless told otherwise', () => {
    expect(opensOutside({ key: 'in', label: 'LinkedIn', href: 'https://example.com/share' })).toBe(
      true,
    )
    expect(opensOutside({ key: 'mail', label: 'E-mail', href: 'mailto:?subject=Hi' })).toBe(false)
    expect(
      opensOutside({ key: 'x', label: 'Here', href: 'https://example.com', external: false }),
    ).toBe(false)
  })
})

describe('an e-mail preview', () => {
  it('is as wide as a desktop or a phone mail client', () => {
    expect(emailPreviewWidth('desktop')).toBe(600)
    expect(emailPreviewWidth('phone')).toBe(360)
  })
})
