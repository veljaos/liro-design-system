import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { NoticeView, type NoticeKind } from './notice'

const KINDS: NoticeKind[] = ['success', 'info', 'warning', 'error', 'loading']

describe('NoticeView', () => {
  it('gives every toast a close button, also those that close by themselves', () => {
    for (const kind of KINDS) {
      const html = renderToStaticMarkup(
        <LiroProvider locale="en">
          <NoticeView id={kind} kind={kind} message="Done." />
        </LiroProvider>,
      )
      expect(html).toMatch(/<button[^>]*aria-label="Close"/)
      expect(html).not.toMatch(/\stitle="/)
    }
  })

  it('puts the action before the close button', () => {
    const html = renderToStaticMarkup(
      <LiroProvider locale="en">
        <NoticeView
          id="a"
          kind="success"
          message="Approved."
          action={{ label: 'Undo', onClick: () => undefined }}
        />
      </LiroProvider>,
    )
    expect(html.indexOf('Undo')).toBeLessThan(html.indexOf('aria-label="Close"'))
  })
})
