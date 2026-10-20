import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { DefinedForm } from './defined-form'
import type { DefinedSection } from './defined-form-logic'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const SECTIONS: DefinedSection[] = [
  {
    id: 'letter',
    title: 'Letter',
    description: 'Who it goes to.',
    fields: [
      { id: 'to', type: 'text', label: 'Recipient', required: true },
      {
        id: 'channel',
        type: 'select',
        label: 'Sent by',
        required: true,
        options: [
          { value: 'post', label: 'Post' },
          { value: 'mail', label: 'E-mail' },
        ],
      },
      {
        id: 'email',
        type: 'email',
        label: 'E-mail address',
        visibleWhen: { field: 'channel', equals: 'mail' },
        required: true,
      },
      { id: 'copy', type: 'checkbox', label: 'Keep a copy', required: true },
      { id: 'lines', type: 'custom', label: 'Lines' },
    ],
  },
  {
    id: 'hidden',
    title: 'Never shown',
    visibleWhen: { field: 'channel', equals: 'fax' },
    fields: [{ id: 'fax', type: 'text', label: 'Fax' }],
  },
]

describe('DefinedForm', () => {
  it('draws the sections and fields shown, with the required marks', () => {
    const html = render(<DefinedForm sections={SECTIONS} />)
    expect(html).toContain('Letter')
    expect(html).toContain('Who it goes to.')
    expect(html).toContain('Recipient')
    expect(html).not.toContain('E-mail address')
    expect(html).not.toContain('Never shown')
    // Required: the mark and the attribute, but no message until it is asked for.
    expect(html).toContain('aria-required="true"')
    expect(html).not.toContain('Fill in this field.')
    // A custom field without renderCustom is left out.
    expect(html).not.toContain('Lines')
  })

  it('shows a field when its condition holds', () => {
    const html = render(<DefinedForm sections={SECTIONS} defaultValues={{ channel: 'mail' }} />)
    expect(html).toContain('E-mail address')
  })

  it('says what is missing in words when asked, the application’s own error first', () => {
    const html = render(
      <DefinedForm
        sections={SECTIONS}
        showMissing
        errors={{ to: 'No such partner in the address book.' }}
      />,
    )
    expect(html).toContain('No such partner in the address book.')
    expect(html).toContain('Choose an option.')
    expect(html).toContain('Tick this to go on.')
    expect(html).not.toContain('Fill in this field.')
    expect(html).toContain('aria-invalid="true"')
  })

  it('shows the whole form as text when read-only, without required marks', () => {
    const html = render(
      <DefinedForm
        sections={SECTIONS}
        readOnly
        showMissing
        values={{ to: 'Beton Mix d.o.o.', channel: 'post' }}
      />,
    )
    expect(html).toContain('Beton Mix d.o.o.')
    expect(html).not.toContain('aria-required="true"')
    expect(html).not.toContain('Fill in this field.')
  })

  it('lets the application draw a custom field with its value and error', () => {
    const html = render(
      <DefinedForm
        sections={SECTIONS}
        values={{ lines: ['a', 'b'] }}
        renderCustom={(field, control) => (
          <p data-custom={field.id}>
            {field.label}: {Array.isArray(control.value) ? control.value.length : 0}
          </p>
        )}
      />,
    )
    expect(html).toContain('data-custom="lines"')
    expect(html).toContain('Lines: 2')
  })

  it('marks the definitions’ texts with their language when it is not the page’s', () => {
    const html = render(<DefinedForm sections={SECTIONS} lang="sr-Latn" />)
    expect(html).toContain('<span lang="sr-Latn"')
    expect(render(<DefinedForm sections={SECTIONS} lang="en" />)).not.toContain('<span lang=')
  })
})
