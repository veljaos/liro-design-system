import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { directionForLocale, LiroProvider, useLiro } from './liro-provider'

function Probe() {
  const { locale, direction, colorScheme, format } = useLiro()
  return (
    <output>
      {[locale, direction, colorScheme, format.numberScheme, format.money('1', 'EUR')].join('|')}
    </output>
  )
}

describe('directionForLocale', () => {
  it.each([
    ['en', 'ltr'],
    ['sr-Latn-RS', 'ltr'],
    ['sr-Cyrl-RS', 'ltr'],
    ['ja', 'ltr'],
    ['ar', 'rtl'],
    ['he', 'rtl'],
    ['fa', 'rtl'],
  ] as const)('%s is %s', (locale, direction) => {
    expect(directionForLocale(locale)).toBe(direction)
  })
})

describe('LiroProvider', () => {
  it('sets dir, lang and the theme on its wrapper, derived from the locale', () => {
    const html = renderToStaticMarkup(
      <LiroProvider locale="ar" colorScheme="dark">
        <span />
      </LiroProvider>,
    )
    expect(html).toContain('dir="rtl"')
    expect(html).toContain('lang="ar"')
    expect(html).toContain('data-liro-theme="dark"')
  })

  it('lets direction override the locale', () => {
    const html = renderToStaticMarkup(
      <LiroProvider locale="ar" direction="ltr">
        <Probe />
      </LiroProvider>,
    )
    expect(html).toContain('dir="ltr"')
    expect(html).toContain('ar|ltr|')
  })

  it('resolves colorScheme "system" to light when the preference is unknown', () => {
    const html = renderToStaticMarkup(
      <LiroProvider locale="en">
        <Probe />
      </LiroProvider>,
    )
    expect(html).toContain('data-liro-theme="light"')
  })

  it('passes format overrides to the components', () => {
    const html = renderToStaticMarkup(
      <LiroProvider locale="en" format={{ numberScheme: 'space-comma', moneyDecimals: 0 }}>
        <Probe />
      </LiroProvider>,
    )
    expect(html).toContain('en|ltr|light|space-comma|EUR\u00A01</output>')
  })

  it('gives English defaults outside a provider', () => {
    expect(renderToStaticMarkup(<Probe />)).toBe(
      '<output>en|ltr|light|comma-dot|EUR\u00A01.00</output>',
    )
  })
})
