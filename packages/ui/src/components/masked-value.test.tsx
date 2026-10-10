import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { MaskedValue, revealReady, revealRequest } from './masked-value'

function render(node: ReactNode) {
  return renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)
}

describe('revealReady', () => {
  it('needs a chosen reason from a list', () => {
    expect(revealReady(undefined, '', true)).toBe(false)
    expect(revealReady('payroll', '', true)).toBe(true)
  })

  it('needs words for "Other" and without a list', () => {
    expect(revealReady('\u0000other', '  ', true)).toBe(false)
    expect(revealReady('\u0000other', 'Bank loan', true)).toBe(true)
    expect(revealReady(undefined, '', false)).toBe(false)
    expect(revealReady(undefined, 'Audit', false)).toBe(true)
  })
})

describe('revealRequest', () => {
  it('reports the chosen reason, or null for "Other" and a written reason, with the text trimmed', () => {
    expect(revealRequest('payroll', '')).toEqual({ reason: 'payroll', text: '' })
    expect(revealRequest('\u0000other', ' Bank loan ')).toEqual({ reason: null, text: 'Bank loan' })
    expect(revealRequest(undefined, 'Audit')).toEqual({ reason: null, text: 'Audit' })
  })
})

describe('MaskedValue', () => {
  it('keeps the value out of the page while masked, and names it for assistive technology', () => {
    const html = render(<MaskedValue label="Salary" onReveal={() => undefined} />)
    expect(html).toContain('Salary: hidden')
    expect(html).toContain('aria-label="Show Salary"')
    expect(html).toContain('data-state="masked"')
  })

  it('shows the value the application passes, with Hide', () => {
    const html = render(<MaskedValue label="Salary" value="184.250,00 RSD" />)
    expect(html).toContain('184.250,00 RSD')
    expect(html).toContain('aria-label="Hide Salary"')
  })

  it('shows the reason when the user may not see it, and no action when read-only', () => {
    const notAllowed = render(<MaskedValue label="Salary" notAllowedReason="payroll staff only." />)
    expect(notAllowed).toContain('aria-disabled="true"')
    expect(notAllowed).toContain('Not allowed: payroll staff only.')
    const readOnly = render(<MaskedValue label="Salary" readOnly />)
    expect(readOnly).not.toContain('<button')
  })

  it('shows a refusal beside the mask, and a loader while the value comes', () => {
    expect(render(<MaskedValue label="Salary" error="Refused." />)).toContain('Refused.')
    expect(render(<MaskedValue label="Salary" loading />)).toContain('Showing Salary…')
  })
})
