import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { settle } from '../primitives/story-helpers'
import { SwitchField } from './checkbox-field'
import { ARABIC, JAPANESE, LONG } from './field-story-data'

const meta = {
  title: 'Components/Fields/SwitchField',
  component: SwitchField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a setting that is on or off, usually taking effect at once, with its ' +
          'label beside the switch. The thumb starts at the leading edge in both directions.\n\n' +
          '**When not:** an answer the form saves later (CheckboxField); a choice between two ' +
          'named options (RadioGroupField).',
      },
    },
  },
  args: { label: 'E-mail notifications' },
  play: settle,
} satisfies Meta<typeof SwitchField>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { description: 'About documents that wait for you', name: 'notifications' },
  render: function Render(args) {
    const [checked, setChecked] = useState(true)
    return <SwitchField {...args} checked={checked} onChange={setChecked} />
  },
}

/** Off, required with an error, read-only next to disabled. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-100 flex-col gap-6">
      <SwitchField label="Two-step sign-in" />
      <SwitchField label="Share with the accountant" required error="Required by your plan" />
      <SwitchField label="Audit log (read-only)" readOnly defaultChecked />
      <SwitchField
        label="Audit log (disabled)"
        disabled
        disabledReason="Always on for companies in VAT."
        defaultChecked
      />
    </div>
  ),
}

export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <SwitchField label={LONG.label} description={LONG.description} defaultChecked />
    </div>
  ),
}

export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <SwitchField label={ARABIC.label} description={ARABIC.description} defaultChecked />
      <SwitchField label={ARABIC.label} disabled disabledReason={ARABIC.reason} />
    </div>
  ),
}

export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex max-w-100 flex-col gap-6">
      <SwitchField label={JAPANESE.label} description={JAPANESE.description} defaultChecked />
      <SwitchField label={JAPANESE.label} disabled disabledReason={JAPANESE.reason} />
    </div>
  ),
}
