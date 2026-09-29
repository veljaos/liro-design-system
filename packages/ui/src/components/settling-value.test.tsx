import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { SettlingValue } from './settling-value'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

describe('SettlingValue', () => {
  it('shows the confirmed value, tabular and isolated, and announces nothing at first', () => {
    const html = render(<SettlingValue value="1234.5" currency="EUR" />)
    expect(html).toContain('EUR 1,234.50')
    expect(html).toContain('tabular-nums')
    expect(html).toContain('<bdi')
    expect(html).toMatch(/aria-live="polite"[^>]*><\/span>/)
  })

  it('keeps the value and shows no dot at once while pending (only after 300ms)', () => {
    const html = render(<SettlingValue value="1234.5" currency="EUR" pending />)
    expect(html).toContain('EUR 1,234.50')
    expect(html).toContain('data-pending="true"')
    expect(html).not.toContain('settling-dot')
    // The dot's slot is always there, so the number never moves.
    expect(html).toContain('size-1.5 shrink-0 text-tertiary')
  })

  it('reserves width and writes the unavailable text, or "—"', () => {
    expect(render(<SettlingValue value="1" reserveChars={16} />)).toContain('min-inline-size:16ch')
    expect(render(<SettlingValue value={null} unavailableText="Offline" />)).toContain('Offline')
    expect(render(<SettlingValue value={null} />)).toContain('>—<')
  })
})
