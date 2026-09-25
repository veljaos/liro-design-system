import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { CheckboxField, SwitchField } from './checkbox-field'
import { Field } from './field'
import { RadioGroupField } from './radio-group-field'
import { groupOptions, SelectField } from './select-field'
import { TextAreaField, TextField } from './text-field'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

describe('Field', () => {
  it('links the label, description and error to the control', () => {
    const html = render(
      <TextField id="name" label="Name" description="As on the invoice" error="Too long" />,
    )
    expect(html).toContain('<label id="name-label" for="name"')
    expect(html).toContain('aria-describedby="name-description name-error"')
    expect(html).toContain('aria-invalid="true"')
    expect(html).toContain('id="name-error"')
    expect(html).toContain('text-status-danger-fg')
  })

  it('marks a required field with " *" named by messages, and the control as required', () => {
    const html = render(<TextField id="name" label="Name" required />)
    expect(html).toContain('title="Required"')
    expect(html).toContain('> *</span>'.replace(' ', ' '))
    expect(html).toMatch(/<input[^>]*required=""/)
  })

  it('shows the reason of a disabled field as text and links it', () => {
    const html = render(
      <TextField id="tax" label="Tax number" disabled disabledReason="Set by the registry" />,
    )
    expect(html).toContain('Set by the registry')
    expect(html).toContain('aria-describedby="tax-reason"')
    expect(html).toMatch(/<input[^>]*disabled=""/)
  })

  it('shows the error rather than the reason when both are given', () => {
    const html = render(
      <TextField id="a" label="A" disabled disabledReason="Closed" error="Wrong" />,
    )
    expect(html).not.toContain('Closed')
    expect(html).toContain('aria-describedby="a-error"')
  })

  it('draws read-only as plain text: readonly, no border or background, named by messages', () => {
    const html = render(<TextField id="a" label="A" readOnly defaultValue="100200300" />)
    expect(html).toMatch(/<input[^>]*readOnly=""/)
    expect(html).not.toMatch(/<input[^>]*\sdisabled=""/)
    expect(html).toContain('title="Read-only"')
    expect(html).toContain('border-transparent bg-transparent')
    expect(html).toContain('h-control')
  })

  it('never blocks paste', () => {
    const html = render(<TextField label="A" />) + render(<TextAreaField label="B" />)
    expect(html).not.toContain('onpaste')
  })

  it('names a group with its label element instead of a <label for>', () => {
    const html = render(
      <Field id="g" label="Period" group>
        {(control) => <div role="radiogroup" aria-labelledby={control.labelId} />}
      </Field>,
    )
    expect(html).toContain('<span id="g-label"')
    expect(html).not.toContain('for="g"')
    expect(html).toContain('aria-labelledby="g-label"')
  })
})

describe('SelectField', () => {
  it('groups options in order of first use, ungrouped first', () => {
    const { ungrouped, groups } = groupOptions([
      { value: 'a', label: 'A', group: 'Second' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C', group: 'Third' },
      { value: 'd', label: 'D', group: 'Second' },
    ])
    expect(ungrouped.map((option) => option.value)).toEqual(['b'])
    expect(groups.map(([heading, options]) => [heading, options.map((o) => o.value)])).toEqual([
      ['Second', ['a', 'd']],
      ['Third', ['c']],
    ])
  })

  it('shows the chosen label as read-only text', () => {
    const html = render(
      <SelectField
        label="Currency"
        readOnly
        defaultValue="eur"
        options={[
          { value: 'rsd', label: 'Dinar' },
          { value: 'eur', label: 'Euro' },
        ]}
      />,
    )
    expect(html).toMatch(
      /<input[^>]*readOnly=""[^>]*value="Euro"|<input[^>]*value="Euro"[^>]*readOnly=""/,
    )
  })
})

describe('CheckboxField and SwitchField', () => {
  it('keeps a read-only box in its state and marks it aria-readonly', () => {
    const html = render(<CheckboxField id="c" label="Exported" readOnly defaultChecked />)
    expect(html).toContain('aria-readonly="true"')
    expect(html).toContain('aria-checked="true"')
    expect(html).not.toMatch(/<button[^>]*\sdisabled=""/)
  })

  it('puts the label beside the switch and links the error', () => {
    const html = render(<SwitchField id="s" label="Audit log" error="Required" />)
    expect(html).toContain('role="switch"')
    expect(html).toContain('<label id="s-label" for="s"')
    expect(html).toContain('aria-describedby="s-error"')
  })
})

describe('RadioGroupField', () => {
  it('labels the group and each option', () => {
    const html = render(
      <RadioGroupField
        id="p"
        label="Period"
        required
        defaultValue="m"
        options={[
          { value: 'm', label: 'Monthly' },
          { value: 'y', label: 'Yearly', disabled: true },
        ]}
      />,
    )
    expect(html).toContain('role="radiogroup"')
    expect(html).toContain('aria-labelledby="p-label"')
    expect(html).toContain('aria-required="true"')
    expect(html).toContain('for="p-0"')
    expect(html).toContain('for="p-1"')
  })
})
