import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { BrandLockup, lockupName } from './brand-lockup'

const BRAND = {
  brandName: 'Liro',
  productName: 'Business Apps',
  icon: 'icon.svg',
  wordmark: 'wordmark-light.svg',
  wordmarkOnDark: 'wordmark-mono-white.svg',
}

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
  it('is one link home named by the full product name, its images decorative', () => {
    const html = renderToStaticMarkup(<BrandLockup {...BRAND} href="/" />)
    expect(html).toContain('<a href="/" aria-label="Liro Business Apps"')
    expect(html.match(/<a /g)).toHaveLength(1)
    expect(html.match(/alt=""/g)).toHaveLength(2)
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
  it('takes the dark files in the dark theme', () => {
    const light = renderToStaticMarkup(
      <LiroProvider locale="en" colorScheme="light">
        <BrandLockup {...BRAND} />
      </LiroProvider>,
    )
    const dark = renderToStaticMarkup(
      <LiroProvider locale="en" colorScheme="dark">
        <BrandLockup {...BRAND} iconOnDark="icon-dark.svg" />
      </LiroProvider>,
    )
    expect(light).toContain('src="wordmark-light.svg"')
    expect(light).toContain('src="icon.svg"')
    expect(dark).toContain('src="wordmark-mono-white.svg"')
    expect(dark).toContain('src="icon-dark.svg"')
  })
  it('keeps the icon file as it is: no rounding', () => {
    const html = renderToStaticMarkup(<BrandLockup {...BRAND} size="lg" />)
    expect(html).toContain('<img src="icon.svg" alt="" class="block shrink-0 size-10"/>')
  })
})
