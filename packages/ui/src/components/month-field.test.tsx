import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { MonthField, monthIndexOf, monthOf, moveMonth } from './month-field'

describe('month indexes', () => {
  it('converts YYYY-MM and YYYY-MM-DD to months and back', () => {
    for (const value of ['2026-01', '2026-12', '0999-07']) {
      expect(monthOf(monthIndexOf(value))).toBe(value)
    }
    expect(monthOf(monthIndexOf('2026-03-17'))).toBe('2026-03')
  })
})

describe('moveMonth: arrow keys in the month grid', () => {
  const march = monthIndexOf('2026-03')
  it('moves by one along the row from the leading edge, and by a row of three up and down', () => {
    expect(monthOf(moveMonth(march, 'ArrowRight', 'ltr') ?? 0)).toBe('2026-04')
    expect(monthOf(moveMonth(march, 'ArrowLeft', 'ltr') ?? 0)).toBe('2026-02')
    expect(monthOf(moveMonth(march, 'ArrowDown', 'ltr') ?? 0)).toBe('2026-06')
    expect(monthOf(moveMonth(march, 'ArrowUp', 'ltr') ?? 0)).toBe('2025-12')
  })

  it('swaps left and right in right-to-left (Appendix B.7)', () => {
    expect(monthOf(moveMonth(march, 'ArrowLeft', 'rtl') ?? 0)).toBe('2026-04')
    expect(monthOf(moveMonth(march, 'ArrowRight', 'rtl') ?? 0)).toBe('2026-02')
  })

  it('crosses into the next and previous year', () => {
    expect(monthOf(moveMonth(monthIndexOf('2026-12'), 'ArrowRight', 'ltr') ?? 0)).toBe('2027-01')
    expect(monthOf(moveMonth(monthIndexOf('2026-01'), 'ArrowLeft', 'ltr') ?? 0)).toBe('2025-12')
  })

  it('ignores other keys', () => {
    expect(moveMonth(march, 'Enter', 'ltr')).toBeNull()
  })
})

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <LiroProvider locale="en" today="2026-09-28">
      {node}
    </LiroProvider>,
  )

describe('MonthField markup', () => {
  it('shows the month and year on a button named by the label, and submits YYYY-MM', () => {
    const html = render(<MonthField id="m" label="Period" name="period" value="2026-03" />)
    expect(html).toMatch(/<button[^>]*id="m"[^>]*>March 2026<\/button>/)
    expect(html).toContain('aria-labelledby="m-label m"')
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toContain('<input type="hidden" name="period" value="2026-03"/>')
  })

  it('shows the placeholder in the tertiary colour without a value', () => {
    const html = render(<MonthField label="Period" placeholder="Choose" />)
    expect(html).toContain('text-tertiary')
    expect(html).toContain('>Choose</button>')
  })

  it('marks an error with the border and links it, without aria-invalid on the button', () => {
    const html = render(<MonthField id="m" label="Period" error="Closed" />)
    expect(html).toContain('border-status-danger-fg')
    expect(html).toContain('aria-describedby="m-error"')
    expect(html).not.toMatch(/<button[^>]*\saria-invalid=/)
  })

  it('draws read-only as text and disabled with its reason', () => {
    const readOnly = render(<MonthField label="P" readOnly value="2026-03" />)
    expect(readOnly).toMatch(/<input[^>]*readOnly=""[^>]*value="March 2026"/)
    const disabled = render(<MonthField label="P" disabled disabledReason="Locked" />)
    expect(disabled).toContain('Locked')
    expect(disabled).toMatch(/<button[^>]*disabled=""/)
  })
})
