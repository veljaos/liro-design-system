import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { RichText } from './rich-text'
import { RichTextField } from './rich-text-field'
import type { RichTextNode } from './rich-text-logic'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const LETTER: RichTextNode = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Dear ' },
        { type: 'mergeField', attrs: { key: 'customer.name' } },
        { type: 'text', text: ', ask ' },
        { type: 'mention', attrs: { id: 'u-7', label: 'Milica' } },
        {
          type: 'text',
          text: 'here',
          marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
        },
      ],
    },
  ],
}

const FIELDS = [{ key: 'customer.name', label: 'Customer name' }]

describe('RichText', () => {
  it('draws merge fields as named pills and mentions by name, from the JSON', () => {
    const html = render(<RichText value={LETTER} mergeFields={FIELDS} />)
    expect(html).toContain('<p dir="auto">Dear ')
    expect(html).toContain(
      '<span data-merge-field="customer.name" class="inline-block rounded-sm border',
    )
    expect(html).toContain(
      '<span class="sr-only">Merge field: Customer name</span><span aria-hidden="true">Customer name</span>',
    )
    expect(html).toContain(
      '<span data-mention="u-7" class="font-semibold text-primary">@Milica</span>',
    )
    // The unsafe link is not a link.
    expect(html).not.toContain('<a')
    expect(html).not.toContain('javascript')
  })

  it('reads stored HTML through the sanitizer, never inserting it as it is', () => {
    const html = render(
      <RichText
        html={
          '<p style="color:red" onclick="x()">Hi <img src=x onerror=alert(1)><a href="https://liro.rs">Liro</a></p><script>alert(1)</script>'
        }
      />,
    )
    expect(html).toContain(
      '<p dir="auto">Hi <a href="https://liro.rs" rel="noopener noreferrer">Liro</a></p>',
    )
    expect(html).not.toMatch(/onclick|onerror|script|color:red/u)
  })

  it('shows "—" or the given text when there is nothing to read', () => {
    expect(render(<RichText value={null} />)).toContain('—')
    expect(render(<RichText html="<p> </p>" empty="No note" />)).toContain('No note')
  })
})

describe('RichTextField', () => {
  it('draws the label, the toolbar and the value before the editor exists (a server)', () => {
    const html = render(
      <RichTextField
        id="letter"
        label="Letter"
        defaultValue={LETTER}
        mergeFields={FIELDS}
        maxLength={2000}
      />,
    )
    expect(html).toContain('<span id="letter-label"')
    expect(html).toContain('role="toolbar" aria-label="Formatting" aria-controls="letter"')
    expect(html).toContain('aria-label="Bold" aria-pressed="false"')
    expect(html).toContain('aria-label="Text style: Normal text"')
    expect(html).toContain('aria-label="Insert merge field"')
    expect(html).toContain('Merge field: Customer name')
    // The counter: "Dear " 5, the merge field 1, ", ask " 6, the mention 1, "here" 4.
    expect(html).toContain('id="letter-count"')
    expect(html).toContain('17 / 2,000')
    expect(html).toContain('17 of 2,000 characters')
  })

  it('shows the value as read-only rich text, named by the label', () => {
    const html = render(
      <RichTextField id="note" label="Note" readOnly defaultValue={LETTER} mergeFields={FIELDS} />,
    )
    expect(html).toContain('id="note" role="group" aria-labelledby="note-label"')
    expect(html).not.toContain('role="textbox"')
    expect(html).not.toContain('role="toolbar"')
  })

  it('says how many characters are too many', () => {
    const html = render(
      <RichTextField id="c" label="Comment" defaultValue={LETTER} maxLength={10} />,
    )
    expect(html).toContain('7 characters too many')
    expect(html).toContain('text-status-danger-fg')
  })

  it('shows an empty read-only text as "—", without the hint', () => {
    const html = render(
      <RichTextField id="d" label="Comment" description="Seen by the customer" readOnly />,
    )
    expect(html).toContain('—')
    expect(html).toContain('bg-surface-disabled')
    expect(html).not.toContain('Seen by the customer')
  })
})
