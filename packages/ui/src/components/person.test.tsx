import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { initialsOf, PersonAvatar } from './person'

describe('initialsOf (Appendix B.9)', () => {
  it('takes the first letter of the first and the last word', () => {
    expect(initialsOf('Ana Jovanović', 'sr-Latn')).toBe('AJ')
    expect(initialsOf('Ana Marija Jovanović', 'sr-Latn')).toBe('AJ')
    expect(initialsOf('  marko   petrović  ', 'sr-Latn')).toBe('MP')
  })

  it('handles one word, no words, other scripts and letters outside the basic plane', () => {
    expect(initialsOf('Ćirić', 'sr-Latn')).toBe('Ć')
    expect(initialsOf('', 'en')).toBe('')
    expect(initialsOf('Љиљана Ђорђевић', 'sr-Cyrl')).toBe('ЉЂ')
    expect(initialsOf('𝒜da Lovelace', 'en')).toBe('𝒜L')
    expect(initialsOf('istanbul ilkay', 'tr')).toBe('İİ')
  })
})

describe('PersonAvatar', () => {
  const render = (node: React.ReactNode) =>
    renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

  it('is decorative by default and speaks only with alt', () => {
    expect(render(<PersonAvatar name="Ana Jovanović" />)).toContain('aria-hidden="true"')
    const html = render(<PersonAvatar name="Ana Jovanović" alt="Ana Jovanović" />)
    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label="Ana Jovanović"')
  })

  it('draws the light primary style with radius xl', () => {
    const html = render(<PersonAvatar name="Ana Jovanović" />)
    expect(html).toContain('bg-brand-subtle')
    expect(html).toContain('text-brand')
    expect(html).toContain('rounded-xl')
    expect(html).toContain('>AJ<')
  })
})
