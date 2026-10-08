import { useForm } from 'react-hook-form'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FormTextField } from '../form'
import { LiroProvider } from '../provider/liro-provider'
import { messagesEn } from '../provider/messages.en'
import { TextField } from './text-field'
import { FormActions, FormFullWidth, FormSection, FormTabs } from './form-layout'
import { bottomBarShown, firstErrorTab, wizardStepTarget } from './form-logic'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

describe('form logic', () => {
  it('shows the bottom bar while the top actions are out of view, or as forced', () => {
    expect(bottomBarShown('auto', true)).toBe(true)
    expect(bottomBarShown('auto', false)).toBe(false)
    expect(bottomBarShown('always', false)).toBe(true)
    expect(bottomBarShown('never', true)).toBe(false)
  })

  it('finds the first tab with errors that can be selected', () => {
    expect(
      firstErrorTab([
        { value: 'a' },
        { value: 'b', hasErrors: true, disabled: true },
        { value: 'c', hasErrors: true },
      ]),
    ).toBe('c')
    expect(firstErrorTab([{ value: 'a' }])).toBeNull()
  })

  it('lets a wizard go back anywhere, forward one step through its check, never further', () => {
    expect(wizardStepTarget(0, 2)).toBe('back')
    expect(wizardStepTarget(3, 2)).toBe('next')
    expect(wizardStepTarget(4, 2)).toBe('none')
    expect(wizardStepTarget(2, 2)).toBe('none')
  })
})

describe('FormSection', () => {
  it('lays its fields in 2 columns by default, one on phones, with full-width fields', () => {
    const html = render(
      <FormSection title="Customer">
        <TextField label="Name" />
        <FormFullWidth>
          <TextField label="Address" />
        </FormFullWidth>
      </FormSection>,
    )
    expect(html).toContain('grid grid-cols-1 gap-4 @min-[36rem]:grid-cols-2')
    expect(html).toContain('col-span-full')
    expect(html).toContain('<h4')
  })

  it('collapsible: closed by default, a button header with aria-expanded, fields kept', () => {
    const html = render(
      <FormSection title="More details" collapsible columns={3}>
        <TextField label="Reference" />
      </FormSection>,
    )
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('hidden=""')
    expect(html).toContain('>Reference</label>')
    expect(html).toContain('@min-[54rem]:grid-cols-3')
    expect(
      render(
        <FormSection title="More" collapsible defaultOpen>
          <TextField label="Reference" />
        </FormSection>,
      ),
    ).toContain('aria-expanded="true"')
  })
})

describe('FormTabs', () => {
  it('marks a tab with errors with the icon and the name from messages', () => {
    const html = render(
      <FormTabs
        items={[
          { value: 'general', label: 'General', content: 'g' },
          { value: 'address', label: 'Address', content: 'a', hasErrors: true },
        ]}
      />,
    )
    expect(html).toContain(`aria-label="${messagesEn['form.hasErrors']('Address')}"`)
    expect(html).toContain('data-has-errors=""')
    expect(html).toContain('text-status-danger-fg')
    expect(messagesEn['form.hasErrors']('Address')).toBe('Address — has errors')
  })
})

describe('FormActions', () => {
  it('shows the actions at the top, and the bottom bar only when asked or while scrolling', () => {
    const never = render(
      <FormActions actions={<button type="button">Save</button>} stickyActions="never">
        body
      </FormActions>,
    )
    expect(never.match(/>Save</g)).toHaveLength(1)
    const always = render(
      <FormActions actions={<button type="button">Save</button>} stickyActions="always" dirty>
        body
      </FormActions>,
    )
    expect(always.match(/>Save</g)).toHaveLength(2)
    expect(always).toContain('Unsaved changes')
    expect(always).toContain('bg-surface-page')
    expect(always).not.toContain('shadow')
  })
})

describe('@veljaos/ui/form', () => {
  function Bound() {
    const { control } = useForm<{ name: string }>({ defaultValues: { name: 'Alfa' } })
    return <FormTextField control={control} name="name" label="Name" />
  }

  it('shows the form value in the Design System field', () => {
    const html = render(<Bound />)
    expect(html).toContain('value="Alfa"')
    expect(html).toContain('name="name"')
  })
})
