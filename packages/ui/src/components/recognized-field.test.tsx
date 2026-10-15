import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { RecognizedField } from './recognized-field'
import { TextField } from './text-field'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const field = (describedBy: string) => (
  <TextField label="Number" defaultValue="1001" describedBy={describedBy} />
)

describe('RecognizedField', () => {
  it('links the confidence to the field', () => {
    const html = render(<RecognizedField confidence="98%">{field}</RecognizedField>)
    expect(html).toContain('Confidence: 98%')
    const id = /<p id="([^"]+)"/.exec(html)?.[1]
    expect(id).toBeDefined()
    expect(html).toMatch(new RegExp(`aria-describedby="[^"]*${String(id)}`))
    expect(html).not.toContain('Low confidence')
    expect(html).not.toContain('Show where it was read')
  })

  it('marks a reading the application calls uncertain with an icon and words', () => {
    const html = render(
      <RecognizedField confidence="61%" low>
        {field}
      </RecognizedField>,
    )
    expect(html).toContain('data-low="true"')
    expect(html).toContain('Low confidence')
    expect(html).toContain('text-status-warning-fg')
    expect(html).toContain('lucide-triangle-alert')
    expect(html).toContain('Confidence: 61%')
  })

  it('takes the application’s words for an uncertain reading', () => {
    const html = render(
      <RecognizedField low lowLabel="Not found on the page">
        {field}
      </RecognizedField>,
    )
    expect(html).toContain('Not found on the page')
    expect(html).not.toContain('Confidence:')
  })

  it('says the user changed the value, in place of the confidence', () => {
    const html = render(
      <RecognizedField confidence="61%" low changed>
        {field}
      </RecognizedField>,
    )
    expect(html).toContain('Changed by you')
    expect(html).not.toContain('Low confidence')
    expect(html).not.toContain('Confidence: 61%')
  })

  it('offers where it was read, pressed while shown', () => {
    const off = render(
      <RecognizedField confidence="98%" onShowSource={() => undefined}>
        {field}
      </RecognizedField>,
    )
    expect(off).toContain('Show where it was read')
    expect(off).toContain('aria-pressed="false"')
    const on = render(
      <RecognizedField confidence="98%" onShowSource={() => undefined} sourceShown>
        {field}
      </RecognizedField>,
    )
    expect(on).toContain('aria-pressed="true"')
    expect(on).toContain('bg-surface-selected')
  })
})
