import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BrandLockup, lockupName } from './brand-lockup'

const BRAND = { brandName: 'Liro', productName: 'Business Apps' }

describe('lockupName', () => {
  it('joins the brand and the product name', () => {
    expect(lockupName('Liro', 'Business Apps')).toBe('Liro Business Apps')
  })
  it('is the brand alone without a product name', () => {
    expect(lockupName('Liro')).toBe('Liro')
    expect(lockupName('Liro', '  ')).toBe('Liro')
  })
})

describe('BrandLockup', () => {
  it('is one link home named by the full product name, text only', () => {
    const html = renderToStaticMarkup(<BrandLockup {...BRAND} href="/" />)
    expect(html).toContain('<a href="/" aria-label="Liro Business Apps"')
    expect(html).not.toContain('<img')
    expect(html).toContain('<span class="font-bold">Liro</span>')
    expect(html).toMatch(
      /class="font-regular[^"]*"> <!-- -->Business Apps<\/span>|> Business Apps</,
    )
  })
  it('writes the brand in the brand face and colour, 20px in the header, 24px large', () => {
    expect(renderToStaticMarkup(<BrandLockup {...BRAND} />)).toMatch(
      /font-brand[^"]*text-brand[^"]*text-xl/,
    )
    expect(renderToStaticMarkup(<BrandLockup {...BRAND} size="lg" />)).toContain('text-h1')
  })
  it('hides the product name below 48em by default, and always when compact', () => {
    expect(renderToStaticMarkup(<BrandLockup {...BRAND} />)).toContain('max-sm:hidden')
    const compact = renderToStaticMarkup(<BrandLockup {...BRAND} compact />)
    expect(compact).not.toContain('Business Apps<')
    expect(compact).toContain('aria-label="Liro Business Apps"')
    expect(renderToStaticMarkup(<BrandLockup {...BRAND} compact={false} />)).not.toContain(
      'max-sm:hidden',
    )
  })
})
