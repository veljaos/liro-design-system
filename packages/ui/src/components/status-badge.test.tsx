import { CircleCheck } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { StatusBadge, TONE_NAMES, toneFor, type Tone } from './status-badge'

const MAP: Record<string, Tone> = { paid: 'success', overdue: 'danger', draft: 'neutral' }

describe('toneFor', () => {
  it('reads the tone from the map the application gives', () => {
    expect(toneFor('paid', MAP)).toBe('success')
    expect(toneFor('overdue', MAP)).toBe('danger')
  })

  it('falls back to neutral, or to the given fallback, for an unknown status', () => {
    expect(toneFor('archived', MAP)).toBe('neutral')
    expect(toneFor('archived', MAP, 'info')).toBe('info')
    expect(toneFor('toString', MAP)).toBe('neutral')
  })
})

describe('StatusBadge', () => {
  it("shows the label in the tone's fg on its bg, without a border by default", () => {
    const html = renderToStaticMarkup(<StatusBadge label="Paid" tone="success" />)
    expect(html).toContain('bg-status-success-bg text-status-success-fg')
    expect(html).toContain('data-tone="success"')
    expect(html).toContain('<span>Paid</span>')
    expect(html).not.toContain('border')
    expect(html).toContain('whitespace-nowrap')
  })

  it("adds a 1px border in the tone's border colour with withBorder", () => {
    const html = renderToStaticMarkup(<StatusBadge label="Overdue" tone="danger" withBorder />)
    expect(html).toContain('border border-solid border-status-danger-border')
  })

  it('draws an optional icon before the label, hidden from screen readers', () => {
    const html = renderToStaticMarkup(
      <StatusBadge label="Paid" tone="success" icon={CircleCheck} />,
    )
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"[^>]*>.*<\/svg><span>Paid<\/span>/)
  })

  it('knows the six tones', () => {
    expect(TONE_NAMES).toEqual(['success', 'warning', 'danger', 'info', 'neutral', 'premium'])
  })
})
