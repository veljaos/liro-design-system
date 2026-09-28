import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { LiroProvider } from '../provider/liro-provider'
import {
  DateRangeText,
  DateText,
  daysBetween,
  DueDate,
  dueState,
  MoneyText,
  NumberText,
} from './display-text'

const render = (node: React.ReactNode, locale = 'en', today = '2026-09-28') =>
  renderToStaticMarkup(
    <LiroProvider locale={locale} today={today}>
      {node}
    </LiroProvider>,
  )

describe('daysBetween', () => {
  it('counts whole days across months, years and leap days', () => {
    expect(daysBetween('2026-09-28', '2026-10-03')).toBe(5)
    expect(daysBetween('2026-09-28', '2026-09-20')).toBe(-8)
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1)
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2)
  })
})

describe('dueState, from the provider today', () => {
  const today = '2031-07-15'
  it('is settled, overdue with days, today, soon within the warning days, or later', () => {
    expect(dueState('2031-07-01', today, true, 5).kind).toBe('settled')
    expect(dueState('2031-07-12', today, false, 5)).toEqual({ kind: 'overdue', days: 3 })
    expect(dueState(today, today, false, 5).kind).toBe('today')
    expect(dueState('2031-07-20', today, false, 5)).toEqual({ kind: 'soon', days: 5 })
    expect(dueState('2031-07-21', today, false, 5).kind).toBe('later')
    expect(dueState('2031-07-21', today, false, 10).kind).toBe('soon')
  })
})

describe('DueDate', () => {
  it('shows the days overdue in the badge text itself', () => {
    const html = render(<DueDate value="2026-09-25" />)
    expect(html).toContain('3 days overdue')
    expect(html).toContain('text-status-danger-fg')
  })

  it('says settled, due today and due soon, and gives the plain date later', () => {
    expect(render(<DueDate value="2026-09-01" settled />)).toContain('Settled')
    expect(render(<DueDate value="2026-09-28" />)).toContain('Due today')
    expect(render(<DueDate value="2026-09-29" />)).toContain('Due in 1 day')
    expect(render(<DueDate value="2026-12-01" />)).toContain('12/01/2026')
  })

  it('uses the provider today, not the device date', () => {
    expect(render(<DueDate value="2031-07-10" />, 'en', '2031-07-15')).toContain('5 days overdue')
  })
})

describe('DateText and DateRangeText', () => {
  it('writes the date in the locale form with tabular digits, and — when empty', () => {
    expect(render(<DateText value="2026-03-01" />, 'sr-Latn-RS')).toContain('01.03.2026.')
    expect(render(<DateText value="2026-03-01" />)).toContain('tabular-nums')
    expect(render(<DateText value={null} />)).toContain('>—<')
  })

  it('joins a range with an en dash', () => {
    expect(render(<DateRangeText from="2026-01-01" to="2026-03-31" />)).toMatch(/<\/time> – <time/)
  })

  it('has a long date with the weekday for the tooltip', () => {
    expect(createFormat('en').dateLong('2026-09-28')).toBe('Monday, September 28, 2026')
    expect(createFormat('sr-Latn-RS').dateLong('2026-09-28')).toContain('ponedeljak')
  })
})

describe('NumberText and MoneyText', () => {
  it('format through the provider, isolated, never rounded, — when empty', () => {
    expect(render(<NumberText value="1234.567" decimals={2} />)).toContain('<bdi')
    expect(render(<NumberText value="1234.567" decimals={2} />)).toContain('1,234.567')
    expect(render(<MoneyText value="1234.5" currency="EUR" />, 'sr-Latn-RS')).toContain(
      '1.234,50 EUR',
    )
    expect(render(<MoneyText value={null} currency="EUR" />)).toContain('>—<')
    expect(render(<NumberText value="" />)).toContain('>—<')
  })
})
