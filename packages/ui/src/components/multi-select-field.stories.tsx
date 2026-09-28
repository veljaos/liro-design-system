import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import type { ComboboxOption } from './combobox-field'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { MultiSelectField } from './multi-select-field'

const LABELS: ComboboxOption[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'export', label: 'Export' },
  { value: 'review', label: 'Needs review' },
  { value: 'archived', label: 'Archived (read-only tag)', disabled: true },
  { value: 'vip', label: 'Key customer' },
]

const meta = {
  title: 'Components/Fields/MultiSelectField',
  component: MultiSelectField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** several choices from a known list, found by typing; the chosen ones are ' +
          'pills inside the field, each with a remove button. The list stays open while ' +
          'choosing; Backspace in the empty typing area removes the last pill. Read-only shows ' +
          'the pills without remove buttons.\n\n' +
          '**When not:** one choice (SelectField, ComboboxField); a few options that should all ' +
          'be visible (checkboxes).',
      },
    },
  },
  args: { label: 'Labels', options: LABELS, placeholder: 'Add a label' },
  play: settle,
} satisfies Meta<typeof MultiSelectField>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { description: 'Shown on the document list', name: 'labels' },
  render: function Render(args) {
    const [values, setValues] = useState<string[]>(['urgent'])
    return <MultiSelectField {...args} value={values} onChange={setValues} className="max-w-100" />
  },
}

/** Open after typing "e": chosen options carry a check, the list stays open. */
export const Open: Story = {
  render: (args) => (
    <div className="flex min-h-80 max-w-100 flex-col">
      <MultiSelectField {...args} defaultValue={['export']} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox')
    await userEvent.click(input)
    await userEvent.type(input, 'e', { delay: 0 })
    await userEvent.keyboard('{ArrowDown}')
    await settle()
  },
}

/** Nothing matches. */
export const Empty: Story = {
  render: (args) => (
    <div className="flex min-h-40 max-w-100 flex-col">
      <MultiSelectField {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox')
    await userEvent.click(input)
    await userEvent.type(input, 'zz', { delay: 0 })
    await settle()
  },
}

/** Several chosen, required with an error, read-only next to disabled. */
export const States: Story = {
  render: (args) => (
    <div className="flex max-w-100 flex-col gap-6">
      <MultiSelectField {...args} defaultValue={['urgent', 'export', 'review', 'vip']} />
      <MultiSelectField {...args} required error="Add at least one label" />
      <MultiSelectField
        {...args}
        label="Labels (read-only)"
        readOnly
        defaultValue={['urgent', 'vip']}
      />
      <MultiSelectField
        {...args}
        label="Labels (disabled)"
        disabled
        disabledReason="Labels are set by the workflow."
        defaultValue={['urgent', 'vip']}
      />
    </div>
  ),
}

export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: (args) => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <MultiSelectField
        {...args}
        label={LONG.label}
        description={LONG.description}
        error={LONG.error}
        options={[...LABELS, { value: 'long', label: LONG.value }]}
        defaultValue={['long', 'urgent', 'export']}
      />
    </div>
  ),
}

export const Arabic: Story = {
  render: (args) => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <MultiSelectField
        {...args}
        label={ARABIC.label}
        description={ARABIC.description}
        placeholder={ARABIC.placeholder}
        options={ARABIC.options.map((label) => ({ value: label, label }))}
        defaultValue={ARABIC.options.slice(0, 2)}
      />
    </div>
  ),
}

export const Japanese: Story = {
  render: (args) => (
    <div lang="ja" className="flex max-w-100 flex-col gap-6">
      <MultiSelectField
        {...args}
        label={JAPANESE.label}
        description={JAPANESE.description}
        placeholder={JAPANESE.placeholder}
        options={JAPANESE.options.map((label) => ({ value: label, label }))}
        defaultValue={JAPANESE.options.slice(0, 2)}
      />
    </div>
  ),
}
