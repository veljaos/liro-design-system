import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createFormat, NUMBER_SCHEMES } from '../provider/format'
import { LiroProvider } from '../provider/liro-provider'
import { MoneyField, NumberField } from './number-field'
import { currencyFirst, readNumber, showNumber } from './number-logic'

const NBSP = ' '

/** The value with zeros added up to `decimals`, as a field shows it (never rounded). */
function padded(value: string, decimals: number | undefined): string {
  const [integer = '', fraction = ''] = value.split('.')
  if (decimals === undefined || fraction.length >= decimals) return value
  return `${integer}.${fraction.padEnd(decimals, '0')}`
}

describe('readNumber: what a number field reads on blur (Appendix B.3 and B.4)', () => {
  const screens = [createFormat('sr-Latn-RS'), createFormat('en')]

  it.each([
    ['1234.56', '1234.56'],
    ['1234,56', '1234.56'],
    ['1.234,56', '1234.56'],
    ['1,234.56', '1234.56'],
    ['1 234,56', '1234.56'],
    [`1${NBSP}234,56`, '1234.56'],
    ['1 234,56', '1234.56'],
    ['1 234,56', '1234.56'],
    ["1'234.56", '1234.56'],
    ['1’234.56', '1234.56'],
    ['12,34,567.89', '1234567.89'],
    ['1.234.567', '1234567'],
    ['1,234,567', '1234567'],
    ['-1.234,5', '-1234.5'],
    ['1.50', '1.50'],
  ])('reads %j as the decimal string %s on every screen', (text, expected) => {
    for (const format of screens) {
      expect(readNumber(text, format)).toEqual({ value: expected, valid: true })
    }
  })

  it('reads 1234.56 as a decimal on a dot-comma screen (a mask once made it 123456)', () => {
    expect(readNumber('1234.56', createFormat('sr-Latn-RS')).value).toBe('1234.56')
  })

  it.each(['abc', '12abc', '1,2,3', '--5', '1e5'])(
    'keeps %j as unreadable: null and invalid, never 0',
    (text) => {
      for (const format of screens) {
        expect(readNumber(text, format)).toEqual({ value: null, valid: false })
      }
    },
  )

  it('reads empty text as an empty, valid value', () => {
    expect(readNumber('   ', createFormat('en'))).toEqual({ value: null, valid: true })
  })

  it('reads back every text it shows, in every scheme, with and without decimals', () => {
    for (const numberScheme of NUMBER_SCHEMES) {
      const format = createFormat('en', { numberScheme })
      for (const value of ['0', '-1234.5', '12345678901234.567891', '1000000']) {
        for (const decimals of [undefined, 0, 2, 4]) {
          const shown = showNumber(value, format, decimals)
          expect(readNumber(shown, format).value, `${numberScheme} ${shown}`).toBe(
            padded(value, decimals),
          )
        }
      }
    }
  })
})

describe('showNumber', () => {
  const format = createFormat('sr-Latn-RS')
  it('adds zeros up to decimals and never rounds', () => {
    expect(showNumber('1.5', format, 2)).toBe('1,50')
    expect(showNumber('1.567', format, 2)).toBe('1,567')
    expect(showNumber('1234567.891', format, undefined)).toBe('1.234.567,891')
  })
  it('shows null as an empty field', () => {
    expect(showNumber(null, format, 2)).toBe('')
  })
})

describe('currencyFirst: the side of the currency follows format.money', () => {
  it('puts EUR after the amount in Serbian and before it in English', () => {
    expect(currencyFirst(createFormat('sr-Latn-RS'), 'EUR')).toBe(false)
    expect(currencyFirst(createFormat('en'), 'EUR')).toBe(true)
  })
  it("follows an application's own money format", () => {
    const format = createFormat('en', { money: (value, currency) => `${value} ${currency}` })
    expect(currencyFirst(format, 'USD')).toBe(false)
  })
})

const render = (node: React.ReactNode, locale = 'en') =>
  renderToStaticMarkup(<LiroProvider locale={locale}>{node}</LiroProvider>)

describe('NumberField and MoneyField markup', () => {
  it('shows the value through format.number, left to right, with tabular digits', () => {
    const html = render(<NumberField id="q" label="Quantity" value="1234.5" decimals={2} />, 'sr-Latn-RS')
    expect(html).toContain('value="1.234,50"')
    expect(html).toMatch(/<input[^>]*dir="ltr"/)
    expect(html).toMatch(/<input[^>]*inputMode="decimal"/)
    expect(html).toContain('tabular-nums')
  })

  it('submits the decimal string, not the text shown', () => {
    const html = render(<NumberField label="Quantity" name="qty" value="1234.5" />, 'sr-Latn-RS')
    expect(html).toContain('<input type="hidden" name="qty" value="1234.5"/>')
  })

  it('never blocks paste', () => {
    expect(render(<NumberField label="A" />) + render(<MoneyField label="B" currency="EUR" />)).not.toContain('onpaste')
  })

  it('puts the currency after the amount in Serbian and before it in English, as a label', () => {
    const sr = render(<MoneyField id="m" label="Amount" currency="EUR" value="10" />, 'sr-Latn-RS')
    const en = render(<MoneyField id="m" label="Amount" currency="EUR" value="10" />, 'en')
    expect(sr.indexOf('>EUR</label>')).toBeGreaterThan(sr.indexOf('<input id="m"'))
    expect(en.indexOf('>EUR</label>')).toBeLessThan(en.indexOf('<input id="m"'))
    expect(sr).toContain('value="10,00"')
    expect(en).toContain('value="10.00"')
    expect(sr).toMatch(/<label for="m"[^>]*>EUR<\/label>/)
  })

  it('uses the decimals prop over the provider default for money', () => {
    expect(render(<MoneyField label="A" currency="EUR" value="1" decimals={4} />)).toContain('value="1.0000"')
  })

  it("shows the application's error and marks the field invalid", () => {
    const html = render(<NumberField id="n" label="N" error="Too large" />)
    expect(html).toContain('Too large')
    expect(html).toContain('aria-invalid="true"')
    expect(html).not.toContain('Enter a number')
  })

  it('draws read-only as text and disabled with its reason', () => {
    const readOnly = render(<MoneyField label="A" currency="EUR" value="5" readOnly />)
    expect(readOnly).toMatch(/<input[^>]*readOnly=""/)
    expect(readOnly).toContain('border-transparent bg-transparent')
    const disabled = render(<NumberField id="d" label="A" disabled disabledReason="Closed period" />)
    expect(disabled).toContain('Closed period')
    expect(disabled).toMatch(/<input[^>]*disabled=""/)
  })
})
