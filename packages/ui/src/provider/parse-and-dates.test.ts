import { describe, expect, it } from 'vitest'
import {
  createFormat,
  dateFieldOrder,
  intlLocale,
  NUMBER_SCHEMES,
  weekStartsOnForLocale,
} from './format'

const NBSP = ' '

describe('formatting never loses a digit (P1.5)', () => {
  it.each([
    ['dot-comma', '12.345.678.901.234,567891'],
    ['comma-dot', '12,345,678,901,234.567891'],
    ['space-comma', `12${NBSP}345${NBSP}678${NBSP}901${NBSP}234,567891`],
    ['space-dot', `12${NBSP}345${NBSP}678${NBSP}901${NBSP}234.567891`],
    ['apostrophe-dot', '12’345’678’901’234.567891'],
  ] as const)('"12345678901234.567891" in %s', (scheme, expected) => {
    const format = createFormat('en', { numberScheme: scheme })
    expect(format.number('12345678901234.567891')).toBe(expected)
    expect(format.parseNumber(expected)).toBe('12345678901234.567891')
  })

  it('adds zeros up to decimals: "1.5" with 2 decimals', () => {
    expect(createFormat('sr-Latn-RS').number('1.5', { decimals: 2 })).toBe('1,50')
    expect(createFormat('en').number('1.5', { decimals: 2 })).toBe('1.50')
  })

  it('never rounds: "1.567" with 2 decimals shows all three digits', () => {
    expect(createFormat('sr-Latn-RS').number('1.567', { decimals: 2 })).toBe('1,567')
    expect(createFormat('en').number('1.567', { decimals: 2 })).toBe('1.567')
    expect(createFormat('en').money('1.567', 'EUR')).toBe(`EUR${NBSP}1.567`)
  })
})

describe('parseNumber (Appendix B.3 and B.4)', () => {
  const dotComma = createFormat('sr-Latn-RS')
  const commaDot = createFormat('en')

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
    ['1,23,45,678', '12345678'],
    ['1.234.567', '1234567'],
    ['1,234,567', '1234567'],
    ['1.234.567,891', '1234567.891'],
    ['-1.234,5', '-1234.5'],
    ['−5', '-5'],
    ['+7', '7'],
    ['  42  ', '42'],
    ['0,5', '0.5'],
    [',5', '0.5'],
    ['5.', '5'],
    ['007', '7'],
    ['-0', '0'],
    ['1.50', '1.50'],
  ])('reads %j as %s on any screen', (text, expected) => {
    expect(dotComma.parseNumber(text)).toBe(expected)
    expect(commaDot.parseNumber(text)).toBe(expected)
  })

  it('reads 1234.56 as a decimal on a dot-comma screen (the rejected rule read 123456)', () => {
    expect(dotComma.parseNumber('1234.56')).toBe('1234.56')
  })

  it('consults the scheme only to break a tie: an exactly grouped integer in its own grouping', () => {
    expect(dotComma.parseNumber('240.000')).toBe('240000')
    expect(commaDot.parseNumber('240.000')).toBe('240.000')
    expect(commaDot.parseNumber('240,000')).toBe('240000')
    expect(dotComma.parseNumber('240,000')).toBe('240.000')
    expect(createFormat('fr').parseNumber('240.000')).toBe('240.000')
  })

  it.each([
    'abc',
    '',
    '   ',
    '.',
    '-',
    '1e5',
    '12abc',
    '1,2,3',
    '1.2,3.4',
    '1.234,56,7',
    '12 34',
    '1 234.567,8',
    '--5',
    '5-',
    '1_000',
  ])('returns null, never 0, for %j', (text) => {
    expect(dotComma.parseNumber(text)).toBeNull()
    expect(commaDot.parseNumber(text)).toBeNull()
  })

  /** The value with zeros added up to `decimals`, as format.number prints it. */
  function padded(value: string, decimals: number | undefined): string {
    if (decimals === undefined || decimals === 0) return value
    const [integer = '', fraction = ''] = value.split('.')
    return `${integer}.${fraction.padEnd(decimals, '0')}`
  }

  it('reads back what every scheme prints', () => {
    const values = ['0', '7', '999', '1000', '1234.5', '-1234567.891', '240000', '0.001', '100000']
    for (const scheme of NUMBER_SCHEMES) {
      const format = createFormat('en', { numberScheme: scheme })
      for (const value of values) {
        for (const decimals of [undefined, 0, 2, 4]) {
          const printed = format.number(value, decimals === undefined ? {} : { decimals })
          expect(format.parseNumber(printed), `${scheme}: ${printed}`).toBe(padded(value, decimals))
        }
      }
    }
  })
})

describe('dates', () => {
  it.each([
    ['en', '03/01/2026'],
    ['sr-Latn-RS', '01.03.2026.'],
    ['ja', '2026/03/01'],
    ['ar', '01‏/03‏/2026'],
  ])('%s writes 2026-03-01 as %j and reads it back', (locale, expected) => {
    const format = createFormat(locale)
    expect(format.date('2026-03-01')).toBe(expected)
    expect(format.parseDate(expected)).toBe('2026-03-01')
  })

  it('returns a value that is not a date unchanged', () => {
    const format = createFormat('en')
    expect(format.date('2026-02-30')).toBe('2026-02-30')
    expect(format.date('soon')).toBe('soon')
    expect(format.dateTime('not an instant')).toBe('not an instant')
  })

  it('writes an instant in the time zone of the device', () => {
    const expected = new Intl.DateTimeFormat('sr-Latn-RS', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(Date.parse('2026-03-01T14:05:00Z'))
    expect(createFormat('sr-Latn-RS').dateTime('2026-03-01T14:05:00Z')).toBe(expected)
  })

  it.each([
    ['sr-Latn-RS', '010326', '2026-03-01'],
    ['sr-Latn-RS', '01032026', '2026-03-01'],
    ['sr-Latn-RS', '1.3.2026', '2026-03-01'],
    ['sr-Latn-RS', '1.3.2026.', '2026-03-01'],
    ['sr-Latn-RS', '01/03/2026', '2026-03-01'],
    ['sr-Latn-RS', '1-3-26', '2026-03-01'],
    ['sr-Latn-RS', '2026-03-01', '2026-03-01'],
    ['en', '03/01/2026', '2026-03-01'],
    ['en', '030126', '2026-03-01'],
    ['en', '3/1/26', '2026-03-01'],
    ['ja', '2026/3/1', '2026-03-01'],
    ['ja', '20260301', '2026-03-01'],
  ])('%s reads %j as %s', (locale, text, expected) => {
    expect(createFormat(locale).parseDate(text)).toBe(expected)
  })

  it.each([
    '31.02.2026',
    '32.1.2026',
    '1.13.2026',
    'abc',
    '',
    '1.3',
    '1.3.2026.5',
    '0103',
    '1.3.202',
  ])('returns null for %j', (text) => {
    expect(createFormat('sr-Latn-RS').parseDate(text)).toBeNull()
  })

  it('names months and weekdays through Intl', () => {
    const en = createFormat('en')
    expect(en.monthName(3, 'long')).toBe('March')
    expect(en.monthName(12, 'short')).toBe('Dec')
    expect(en.weekdayName(0, 'long')).toBe('Sunday')
    expect(en.weekdayName(6, 'short')).toBe('Sat')
    expect(createFormat('sr-Latn-RS').monthName(3, 'long')).toBe('mart')
    expect(createFormat('sr-Cyrl-RS').monthName(3, 'long')).toBe('март')
    expect(createFormat('ja').weekdayName(1, 'narrow')).toBe('月')
    expect(() => en.monthName(0, 'long')).toThrow(RangeError)
    expect(() => en.weekdayName(7, 'long')).toThrow(RangeError)
  })

  it('reads Serbian without a script as Latin (Appendix B.1)', () => {
    expect(intlLocale('sr')).toBe('sr-Latn')
    expect(intlLocale('sr-RS')).toBe('sr-Latn-RS')
    expect(intlLocale('sr-Cyrl-RS')).toBe('sr-Cyrl-RS')
    expect(createFormat('sr-RS').monthName(3, 'long')).toBe('mart')
    expect(createFormat('sr').date('2026-03-01')).toBe('01.03.2026.')
  })

  it('orders day, month and year as the locale does', () => {
    expect(dateFieldOrder('en')).toEqual(['month', 'day', 'year'])
    expect(dateFieldOrder('sr-Latn-RS')).toEqual(['day', 'month', 'year'])
    expect(dateFieldOrder('ja')).toEqual(['year', 'month', 'day'])
  })
})

describe('weekStartsOnForLocale', () => {
  it.each([
    ['en', 0],
    ['ja', 0],
    ['sr-Latn-RS', 1],
    ['de', 1],
    ['ar', 6],
  ] as const)('%s starts the week on %i', (locale, weekday) => {
    expect(weekStartsOnForLocale(locale)).toBe(weekday)
  })
})
