import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { settle } from '../primitives/story-helpers'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { RadioGroupField, type RadioOption } from './radio-group-field'

const PERIODS: RadioOption[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly', description: 'For companies under the threshold' },
  { value: 'yearly', label: 'Yearly', disabled: true },
]

const meta = {
  title: 'Components/Fields/RadioGroupField',
  component: RadioGroupField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** one choice from two to five options that should all be visible, each ' +
          'with its label and an optional hint. Arrow keys move between options in the reading ' +
          'direction.\n\n' +
          '**When not:** more options or a list the user searches (SelectField, ComboboxField); ' +
          'a single yes/no (CheckboxField).',
      },
    },
  },
  args: { label: 'VAT period', options: PERIODS },
  play: settle,
} satisfies Meta<typeof RadioGroupField>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { description: 'How often you file the VAT return', name: 'period' },
  render: function Render(args) {
    const [value, setValue] = useState('monthly')
    return <RadioGroupField {...args} value={value} onChange={setValue} />
  },
}

/** Required with an error, read-only next to disabled. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-100 flex-col gap-6">
      <RadioGroupField
        label="VAT period"
        options={PERIODS}
        required
        error="Choose how often you file"
      />
      <RadioGroupField
        label="VAT period (read-only)"
        options={PERIODS}
        readOnly
        defaultValue="quarterly"
      />
      <RadioGroupField
        label="VAT period (disabled)"
        options={PERIODS}
        disabled
        disabledReason="Set by the tax office for this year."
        defaultValue="quarterly"
      />
    </div>
  ),
}

export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <RadioGroupField
        label={LONG.label}
        description={LONG.description}
        options={[
          { value: 'a', label: LONG.value, description: LONG.description },
          { value: 'b', label: 'The registered address' },
        ]}
        defaultValue="a"
      />
    </div>
  ),
}

export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <RadioGroupField
        label={ARABIC.label}
        description={ARABIC.description}
        options={ARABIC.options.map((label) => ({ value: label, label }))}
        defaultValue={ARABIC.options[0] ?? ''}
      />
    </div>
  ),
}

export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex max-w-100 flex-col gap-6">
      <RadioGroupField
        label={JAPANESE.label}
        description={JAPANESE.description}
        options={JAPANESE.options.map((label) => ({ value: label, label }))}
        defaultValue={JAPANESE.options[0] ?? ''}
      />
    </div>
  ),
}
