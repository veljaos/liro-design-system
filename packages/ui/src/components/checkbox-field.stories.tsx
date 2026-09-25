import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { settle } from '../primitives/story-helpers'
import { CheckboxField } from './checkbox-field'
import { ARABIC, JAPANESE, LONG } from './field-story-data'

const meta = {
  title: 'Components/Fields/CheckboxField',
  component: CheckboxField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a yes/no choice that takes effect when the form is saved, with its ' +
          'label beside the box. Read-only keeps the box in its colours but it cannot change; ' +
          'disabled greys it out and shows the reason.\n\n' +
          '**When not:** a setting that applies at once (SwitchField); one choice of several ' +
          '(RadioGroupField); selecting table rows (DataTable, P3.1).',
      },
    },
  },
  args: { label: 'Send a copy to the customer' },
  play: settle,
} satisfies Meta<typeof CheckboxField>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { description: 'To the e-mail address on the customer card', name: 'copy', value: 'yes' },
  render: function Render(args) {
    const [checked, setChecked] = useState(false)
    return <CheckboxField {...args} checked={checked} onChange={setChecked} />
  },
}

/** Checked, required with an error, read-only next to disabled. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-100 flex-col gap-6">
      <CheckboxField label="Include VAT in prices" defaultChecked />
      <CheckboxField label="I accept the terms" required error="Accept the terms to continue" />
      <CheckboxField label="Exported to accounting (read-only)" readOnly defaultChecked />
      <CheckboxField
        label="Exported to accounting (disabled)"
        disabled
        disabledReason="Only an administrator can change this."
        defaultChecked
      />
    </div>
  ),
}

export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <CheckboxField label={LONG.label} description={LONG.description} error={LONG.error} />
    </div>
  ),
}

export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <CheckboxField label={ARABIC.label} description={ARABIC.description} defaultChecked />
      <CheckboxField label={ARABIC.label} disabled disabledReason={ARABIC.reason} />
    </div>
  ),
}

export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex max-w-100 flex-col gap-6">
      <CheckboxField label={JAPANESE.label} description={JAPANESE.description} defaultChecked />
      <CheckboxField label={JAPANESE.label} disabled disabledReason={JAPANESE.reason} />
    </div>
  ),
}
