import { describe, expect, it } from 'vitest'
import {
  cachedDateTimeFormat,
  cachedNumberFormat,
  createFormat,
  formatDecimal,
  NUMBER_SCHEMES,
  numberSchemeForLocale,
} from './format'

const NBSP = '\u00A0'

describe('formatDecimal', () => {
  it.each([
    ['dot-comma', '1.234.567,89'],
    ['comma-dot', '1,234,567.89'],
    ['space-comma', `1${NBSP}234${NBSP}567,89`],
    ['space-dot', `1${NBSP}234${NBSP}567.89`],
    ['apostrophe-dot', '1\u2019234\u2019567.89'],
  ] as const)('writes %s', (scheme, expected) => {
    expect(formatDecimal('1234567.89', scheme)).toBe(expected)
  })

  it('covers every scheme in NUMBER_SCHEMES', () => {
    expect(NUMBER_SCHEMES).toHaveLength(5)
  })

  it('adds zeros up to the requested decimals', () => {
    expect(formatDecimal('1234.5', 'comma-dot', 4)).toBe('1,234.5000')
    expect(formatDecimal('7', 'dot-comma', 2)).toBe('7,00')
  })

  it('never rounds and never truncates', () => {
    expect(formatDecimal('1.005', 'comma-dot', 2)).toBe('1.005')
    expect(formatDecimal('0.123456789', 'comma-dot', 0)).toBe('0.123456789')
  })

  it('shows the value as given when no decimals are requested', () => {
    expect(formatDecimal('1234', 'comma-dot')).toBe('1,234')
    expect(formatDecimal('1234.50', 'comma-dot')).toBe('1,234.50')
  })

  it('keeps the sign and drops leading zeros of the integer part', () => {
    expect(formatDecimal('-1234.5', 'dot-comma', 2)).toBe('-1.234,50')
    expect(formatDecimal('0001234', 'comma-dot')).toBe('1,234')
    expect(formatDecimal('0.5', 'comma-dot')).toBe('0.5')
  })

  it('does not group numbers below a thousand', () => {
    expect(formatDecimal('999', 'dot-comma')).toBe('999')
  })

  it('returns a string that is not a decimal unchanged', () => {
    expect(formatDecimal('', 'comma-dot')).toBe('')
    expect(formatDecimal('12,5', 'comma-dot')).toBe('12,5')
    expect(formatDecimal('1e5', 'comma-dot')).toBe('1e5')
  })
})

describe('numberSchemeForLocale', () => {
  it.each([
    ['en', 'comma-dot'],
    ['ja', 'comma-dot'],
    ['sr-Latn-RS', 'dot-comma'],
    ['fr', 'space-comma'],
    ['de-CH', 'apostrophe-dot'],
  ] as const)('%s uses %s', (locale, scheme) => {
    expect(numberSchemeForLocale(locale)).toBe(scheme)
  })
})

describe('createFormat', () => {
  it('formats money with the default decimals, joined by a non-breaking space', () => {
    expect(createFormat('sr-Latn-RS').money('1234.5', 'EUR')).toBe(`1.234,50${NBSP}EUR`)
    expect(createFormat('en').money('1234.5', 'EUR')).toBe(`EUR${NBSP}1,234.50`)
  })

  it('lets options.decimals override moneyDecimals', () => {
    const format = createFormat('en', { moneyDecimals: 4 })
    expect(format.money('1', 'USD')).toBe(`USD${NBSP}1.0000`)
    expect(format.money('1', 'USD', { decimals: 0 })).toBe(`USD${NBSP}1`)
  })

  it('uses an overriding numberScheme for numbers and money', () => {
    const format = createFormat('en', { numberScheme: 'dot-comma' })
    expect(format.number('1234.5')).toBe('1.234,5')
    expect(format.money('1234.5', 'EUR')).toBe(`EUR${NBSP}1.234,50`)
  })

  it('writes an unknown currency after the amount', () => {
    expect(createFormat('en').money('5', 'not a code')).toBe(`5.00${NBSP}not a code`)
  })
})

describe('format.percent (P4.7c)', () => {
  it('follows the locale: no space in sr-Latn and en, a space in de', () => {
    expect(createFormat('sr-Latn-RS').percent('62.4')).toBe('62,4%')
    expect(createFormat('en').percent('62.4')).toBe('62.4%')
    expect(createFormat('de').percent('62.4')).toMatch(/^62,4\s%$/)
  })
  it('writes the sign: "-" always, "+" for a rise when asked, none for zero', () => {
    expect(createFormat('sr-Latn-RS').percent('16.7', { sign: 'always' })).toBe('+16,7%')
    expect(createFormat('en').percent('-8.2', { sign: 'always' })).toBe('-8.2%')
    expect(createFormat('en').percent('0', { sign: 'always' })).toBe('0%')
  })
  it('never rounds, pads with decimals, and leaves unreadable text as it is', () => {
    expect(createFormat('en').percent('12.345')).toBe('12.345%')
    expect(createFormat('en').percent('5', { decimals: 1 })).toBe('5.0%')
    expect(createFormat('en').percent('abc')).toBe('abc')
  })
})

describe('sign (P5.18)', () => {
  const sr = createFormat('sr-Latn-RS')

  it('writes "+" before a change above zero only when asked', () => {
    expect(sr.number('12.5', { sign: 'always' })).toBe('+12,5')
    expect(sr.number('12.5')).toBe('12,5')
    expect(sr.money('13780', 'RSD', { sign: 'always' })).toBe(`+13.780,00${NBSP}RSD`)
  })

  it('leaves zero, negative values and text alone', () => {
    expect(sr.number('0.00', { sign: 'always' })).toBe('0,00')
    expect(sr.money('-13780.00', 'RSD', { sign: 'always' })).toBe(`-13.780,00${NBSP}RSD`)
    expect(sr.number('n/a', { sign: 'always' })).toBe('n/a')
  })

  it('never rounds a signed value', () => {
    expect(sr.money('0.005', 'EUR', { sign: 'always' })).toBe(`+0,005${NBSP}EUR`)
  })
})

describe('the formatter cache (P5.20)', () => {
  it('builds one Intl formatter per locale and options', () => {
    const options = { style: 'currency', currency: 'EUR', currencyDisplay: 'code' } as const
    expect(cachedNumberFormat('de-DE', options)).toBe(cachedNumberFormat('de-DE', { ...options }))
    expect(cachedNumberFormat('de-DE', options)).not.toBe(cachedNumberFormat('en-US', options))
    const date = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' } as const
    expect(cachedDateTimeFormat('en-GB', date)).toBe(cachedDateTimeFormat('en-GB', { ...date }))
    expect(cachedDateTimeFormat('en-GB', date).format(Date.UTC(2026, 9, 9))).toBe('09/10/2026')
  })

  it('gives the same text on every call, and the same as a fresh format', () => {
    const values = ['1234567.891', '-0.5', '0', '98765432109876543210.123456789']
    for (const locale of ['sr-Latn-RS', 'en', 'de-CH', 'ar-EG', 'ja']) {
      const first = createFormat(locale)
      const second = createFormat(locale)
      for (const value of values) {
        for (const currency of ['RSD', 'EUR', 'USD', 'XYZ']) {
          const once = first.money(value, currency)
          expect(first.money(value, currency)).toBe(once)
          expect(second.money(value, currency)).toBe(once)
        }
        expect(second.number(value)).toBe(first.number(value))
        expect(second.percent(value)).toBe(first.percent(value))
      }
      expect(second.date('2026-10-09')).toBe(first.date('2026-10-09'))
      expect(second.dateLong('2026-10-09')).toBe(first.dateLong('2026-10-09'))
      expect(second.monthName(10, 'long')).toBe(first.monthName(10, 'long'))
      expect(second.weekdayName(5, 'short')).toBe(first.weekdayName(5, 'short'))
    }
  })

  it('keeps every digit of a long amount (D4)', () => {
    const sr = createFormat('sr-Latn-RS')
    expect(sr.money('98765432109876543210.123456789', 'RSD', { decimals: 9 })).toBe(
      '98.765.432.109.876.543.210,123456789 RSD',
    )
    expect(sr.money('98765432109876543210.123456789', 'RSD', { decimals: 9 })).toBe(
      '98.765.432.109.876.543.210,123456789 RSD',
    )
  })
})
