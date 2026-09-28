import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { settle } from '../primitives/story-helpers'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { TextAreaField, TextField } from './text-field'

const meta = {
  title: 'Components/Fields/TextField',
  component: TextField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** one line of free text: a name, an e-mail, a reference. Label, optional ' +
          'description, the error under the field, read-only and disabled with a reason. Paste is ' +
          'always allowed. TextAreaField is the multi-line version.\n\n' +
          '**When not:** numbers, amounts and dates (NumberField, MoneyField, DateField, P2.3); a ' +
          'choice from a list (SelectField, ComboboxField). Read-only is for a value the user may ' +
          'see but not change; disabled is for a field that does not apply now, with the reason.',
      },
    },
  },
  args: { label: 'Customer name', placeholder: 'Search by name' },
  play: settle,
} satisfies Meta<typeof TextField>

export default meta

type Story = StoryObj<typeof meta>

/** A label, a description and a placeholder; typing updates the value. */
export const Default: Story = {
  args: { description: 'As it appears on the invoice', autoComplete: 'organization' },
  render: function Render(args) {
    const [value, setValue] = useState('')
    return <TextField {...args} value={value} onChange={setValue} className="max-w-100" />
  },
}

/** Empty, required, with an error, read-only next to disabled, and the other input types. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-100 flex-col gap-6">
      <TextField label="Reference" placeholder="e.g. PO-2026-114" name="reference" />
      <TextField label="Customer name" required defaultValue="Ana Jovanović" />
      <TextField
        label="E-mail"
        type="email"
        required
        defaultValue="ana.jovanovic@"
        error="Enter the whole address, e.g. ana@example.com"
      />
      <TextField label="Tax number (read-only)" readOnly defaultValue="100200300" />
      <TextField
        label="Tax number (disabled)"
        disabled
        disabledReason="Set by the registry; it cannot be changed here."
        defaultValue="100200300"
      />
      <TextField label="Phone" type="tel" defaultValue="+381 11 123 4567" />
      <TextField label="Website" type="url" defaultValue="https://example.com" />
      <TextField label="Search" type="search" placeholder="Search documents" />
      <TextAreaField
        label="Note"
        description="Printed at the bottom of the invoice"
        rows={3}
        defaultValue="Payment within 15 days."
      />
      <TextAreaField label="Internal note (read-only)" readOnly defaultValue="Checked by Marko." />
    </div>
  ),
}

/** Long label, description, value and error at phone width: everything wraps, nothing clips. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <TextField label={LONG.label} description={LONG.description} defaultValue={LONG.value} />
      <TextField label={LONG.label} error={LONG.error} defaultValue={LONG.value} />
      <TextAreaField label={LONG.label} readOnly defaultValue={LONG.value} rows={3} />
    </div>
  ),
}

/** Arabic sample text, right to left. */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <TextField
        label={ARABIC.label}
        description={ARABIC.description}
        placeholder={ARABIC.placeholder}
      />
      <TextField label={ARABIC.label} required error={ARABIC.error} />
      <TextField label={ARABIC.label} readOnly defaultValue={ARABIC.value} />
      <TextField
        label={ARABIC.label}
        disabled
        disabledReason={ARABIC.reason}
        defaultValue={ARABIC.value}
      />
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex max-w-100 flex-col gap-6">
      <TextField
        label={JAPANESE.label}
        description={JAPANESE.description}
        placeholder={JAPANESE.placeholder}
      />
      <TextField label={JAPANESE.label} required error={JAPANESE.error} />
      <TextField label={JAPANESE.label} readOnly defaultValue={JAPANESE.value} />
      <TextField
        label={JAPANESE.label}
        disabled
        disabledReason={JAPANESE.reason}
        defaultValue={JAPANESE.value}
      />
    </div>
  ),
}
