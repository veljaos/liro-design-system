import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { LiroProvider, localToday } from '../provider/liro-provider'
import { DateField, DateRangeField } from './date-field'
import {
  fromLocalDate,
  openingMonth,
  rangeInOrder,
  readDate,
  showDate,
  toLocalDate,
} from './date-logic'

describe('readDate: what a date field reads on blur', () => {
  const sr = createFormat('sr-Latn-RS')
  const en = createFormat('en')

  it.each([
    ['010326', '2026-03-01'],
    ['01032026', '2026-03-01'],
    ['1.3.2026', '2026-03-01'],
    ['01/03/2026', '2026-03-01'],
    ['2026-03-01', '2026-03-01'],
  ])('reads %j as %s on a Serbian screen (day first)', (text, expected) => {
    expect(readDate(text, sr)).toEqual({ value: expected, valid: true })
  })

  it("reads 01/03/2026 in the locale's order: 3 January in English", () => {
    expect(readDate('01/03/2026', en)).toEqual({ value: '2026-01-03', valid: true })
  })

  it.each(['abc', '32.1.2026', '29.2.2026', '1.13.2026'])(
    'keeps %j as unreadable: null and invalid',
    (text) => {
      expect(readDate(text, sr)).toEqual({ value: null, valid: false })
    },
  )

  it('reads empty text as an empty, valid value', () => {
    expect(readDate(' ', sr)).toEqual({ value: null, valid: true })
  })

  it('reads back every date it shows, in every locale of the toolbar', () => {
    for (const locale of ['en', 'sr-Latn-RS', 'ar', 'ja']) {
      const format = createFormat(locale)
      for (const value of ['2026-03-01', '2026-12-31', '2024-02-29', '1999-07-04']) {
        expect(readDate(showDate(value, format), format).value, `${locale} ${value}`).toBe(value)
      }
    }
  })
})

describe('calendar dates', () => {
  it('converts between YYYY-MM-DD and local dates without a time zone shift', () => {
    for (const value of ['2026-03-01', '2026-03-29', '2026-10-25', '0099-01-01']) {
      expect(fromLocalDate(toLocalDate(value))).toBe(value)
    }
  })

  it("opens on the chosen date's month", () => {
    expect(fromLocalDate(openingMonth('2026-03-17', '2031-07-15'))).toBe('2026-03-01')
  })

  it("opens on the provider's today, not the device's date, when nothing is chosen", () => {
    const deviceToday = localToday()
    const tenantToday = deviceToday.startsWith('2031') ? '2042-01-20' : '2031-07-15'
    const month = fromLocalDate(openingMonth(null, tenantToday))
    expect(month).toBe(`${tenantToday.slice(0, 7)}-01`)
    expect(month.slice(0, 7)).not.toBe(deviceToday.slice(0, 7))
  })
})

describe('rangeInOrder', () => {
  it('accepts an end on or after the start, and open ends', () => {
    expect(rangeInOrder('2026-03-01', '2026-03-01')).toBe(true)
    expect(rangeInOrder('2026-03-01', '2026-12-31')).toBe(true)
    expect(rangeInOrder(null, '2026-01-01')).toBe(true)
    expect(rangeInOrder('2026-01-01', null)).toBe(true)
  })
  it('rejects an end before the start (never swapped silently)', () => {
    expect(rangeInOrder('2026-03-02', '2026-03-01')).toBe(false)
  })
})

const render = (node: React.ReactNode, locale = 'en') =>
  renderToStaticMarkup(<LiroProvider locale={locale}>{node}</LiroProvider>)

describe('DateField and DateRangeField markup', () => {
  it('shows the value through format.date and submits YYYY-MM-DD', () => {
    const html = render(
      <DateField id="d" label="Due" name="due" value="2026-03-01" />,
      'sr-Latn-RS',
    )
    expect(html).toContain('value="01.03.2026."')
    expect(html).toContain('<input type="hidden" name="due" value="2026-03-01"/>')
  })

  it('has a calendar button named by messages, at the end of the field', () => {
    const html = render(<DateField id="d" label="Due" />)
    expect(html).toContain('aria-label="Choose a date"')
    expect(html.indexOf('aria-label="Choose a date"')).toBeGreaterThan(
      html.indexOf('<input id="d"'),
    )
    expect(html).toContain('aria-haspopup="dialog"')
  })

  it('draws read-only as text without the calendar button, and disabled with its reason', () => {
    const readOnly = render(<DateField label="Due" readOnly value="2026-03-01" />)
    expect(readOnly).toMatch(/<input[^>]*readOnly=""/)
    expect(readOnly).not.toContain('Choose a date')
    const disabled = render(<DateField label="Due" disabled disabledReason="Closed period" />)
    expect(disabled).toContain('Closed period')
    expect(disabled).toMatch(/<button[^>]*disabled=""/)
  })

  it('names both ends of a range and shows "start – end"', () => {
    const html = render(
      <DateRangeField
        id="r"
        label="Period"
        value={{ start: '2026-01-01', end: '2026-03-31' }}
        startName="from"
        endName="to"
      />,
    )
    expect(html).toContain('aria-labelledby="r-label')
    expect(html).toContain('>Start</span>')
    expect(html).toContain('>End</span>')
    expect(html).toContain('>–</span>')
    expect(html).toContain('name="from" value="2026-01-01"')
    expect(html).toContain('name="to" value="2026-03-31"')
  })

  it('shows its own error for an end before the start; the application error wins', () => {
    const range = { start: '2026-03-02', end: '2026-03-01' }
    const own = render(<DateRangeField label="Period" value={range} />)
    expect(own).toContain('The end is before the start')
    expect(own).toContain('aria-invalid="true"')
    const app = render(
      <DateRangeField label="Period" value={range} error="Choose a closed period" />,
    )
    expect(app).toContain('Choose a closed period')
    expect(app).not.toContain('The end is before the start')
  })
})
