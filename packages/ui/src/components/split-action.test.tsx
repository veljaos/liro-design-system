import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { SplitAction } from './split-action'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

describe('SplitAction', () => {
  it('joins the main button and a named menu button of the same family and weight', () => {
    const html = render(<SplitAction intent="save" label="Save" entries={[]} />)
    expect(html).toContain('rounded-e-none')
    expect(html).toContain('rounded-s-none')
    expect(html).toContain('-ms-px')
    expect(html).toContain('aria-label="More options: Save"')
    expect(html).toContain('aria-haspopup="menu"')
    expect(html.match(/data-family="primary"/g)).toHaveLength(2)
    expect(html.match(/data-emphasis="primary"/g)).toHaveLength(2)
  })

  it('disables both halves together', () => {
    const html = render(<SplitAction intent="save" label="Save" disabled entries={[]} />)
    expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(2)
  })
})
