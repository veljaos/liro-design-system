import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { settle } from '../primitives/story-helpers'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { SelectField, type SelectOption } from './select-field'

const CURRENCIES: SelectOption[] = [
  { value: 'rsd', label: 'Serbian dinar' },
  { value: 'eur', label: 'Euro', group: 'Foreign' },
  { value: 'usd', label: 'US dollar', group: 'Foreign' },
  { value: 'chf', label: 'Swiss franc (no exchange rate today)', group: 'Foreign', disabled: true },
]

const meta = {
  title: 'Components/Fields/SelectField',
  component: SelectField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** one choice from a short list the application already has (up to about ' +
          'twenty options), optionally in groups. Read-only shows the chosen label as text.\n\n' +
          '**When not:** a long list or one searched on the server (ComboboxField); several ' +
          'choices (MultiSelectField); two to five options that should all be visible ' +
          '(RadioGroupField).',
      },
    },
  },
  args: { label: 'Currency', options: CURRENCIES, placeholder: 'Choose a currency' },
  play: settle,
} satisfies Meta<typeof SelectField>

export default meta

type Story = StoryObj<typeof meta>

/** Choosing updates the value; options in a group under a heading, one disabled. */
export const Default: Story = {
  args: { description: 'The currency of the whole document', name: 'currency' },
  render: function Render(args) {
    const [value, setValue] = useState<string | undefined>(undefined)
    return (
      <SelectField
        {...args}
        {...(value === undefined ? {} : { value })}
        onChange={setValue}
        className="max-w-100"
      />
    )
  },
}

/** Empty, required with an error, read-only next to disabled. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-100 flex-col gap-6">
      <SelectField label="Currency" options={CURRENCIES} placeholder="Choose a currency" />
      <SelectField
        label="Currency"
        options={CURRENCIES}
        required
        placeholder="Choose a currency"
        error="Choose the currency of the invoice"
      />
      <SelectField label="Currency (read-only)" options={CURRENCIES} readOnly defaultValue="eur" />
      <SelectField
        label="Currency (disabled)"
        options={CURRENCIES}
        disabled
        disabledReason="The document has lines; remove them to change the currency."
        defaultValue="eur"
      />
    </div>
  ),
}

export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <SelectField
        label={LONG.label}
        description={LONG.description}
        error={LONG.error}
        options={[{ value: 'long', label: LONG.value }]}
        defaultValue="long"
      />
    </div>
  ),
}

export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <SelectField
        label={ARABIC.label}
        description={ARABIC.description}
        options={ARABIC.options.map((label, index) => ({ value: String(index), label }))}
        defaultValue="1"
      />
      <SelectField
        label={ARABIC.label}
        readOnly
        options={ARABIC.options.map((label, index) => ({ value: String(index), label }))}
        defaultValue="2"
      />
    </div>
  ),
}

export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex max-w-100 flex-col gap-6">
      <SelectField
        label={JAPANESE.label}
        description={JAPANESE.description}
        options={JAPANESE.options.map((label, index) => ({ value: String(index), label }))}
        defaultValue="1"
      />
      <SelectField
        label={JAPANESE.label}
        readOnly
        options={JAPANESE.options.map((label, index) => ({ value: String(index), label }))}
        defaultValue="2"
      />
    </div>
  ),
}
