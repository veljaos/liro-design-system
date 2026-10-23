import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SaveStatus } from './save-status'

describe('SaveStatus (P5.90)', () => {
  it('keeps an empty live region while idle', () => {
    const html = renderToStaticMarkup(<SaveStatus state="idle" />)
    expect(html).toContain('role="status"')
    expect(html).not.toContain('Saved')
  })

  it('says "Saving…" and then "Saved" from the messages', () => {
    expect(renderToStaticMarkup(<SaveStatus state="saving" />)).toContain('Saving…')
    const saved = renderToStaticMarkup(<SaveStatus state="saved" />)
    expect(saved).toContain('Saved')
    expect(saved).toContain('text-status-success-fg')
  })

  it("shows a failed save in the application's words as an alert", () => {
    const html = renderToStaticMarkup(<SaveStatus state="error" error="The connection was lost." />)
    expect(html).toContain('role="alert"')
    expect(html).toContain('The connection was lost.')
  })

  it("takes the application's words for saved", () => {
    expect(renderToStaticMarkup(<SaveStatus state="saved" savedText="Draft kept" />)).toContain(
      'Draft kept',
    )
  })
})
