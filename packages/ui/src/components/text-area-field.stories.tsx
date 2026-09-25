import type { Meta, StoryObj } from '@storybook/react-vite'
import { settle } from '../primitives/story-helpers'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { TextAreaField } from './text-field'

const meta = {
  title: 'Components/Fields/TextAreaField',
  component: TextAreaField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** free text over several lines: a note, a comment, an address. The states ' +
          'of TextField; paste is always allowed. `rows` sets the visible lines (default 2).\n\n' +
          '**When not:** a single line (TextField); a conversation (MessageComposer, P5.1).',
      },
    },
  },
  args: { label: 'Note', placeholder: 'Write a note' },
  play: settle,
} satisfies Meta<typeof TextAreaField>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { description: 'Printed at the bottom of the invoice', rows: 3, name: 'note' },
  render: (args) => <TextAreaField {...args} className="max-w-100" />,
}

/** Required with an error, read-only next to disabled. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-100 flex-col gap-6">
      <TextAreaField label="Reason" required error="Say why the document is cancelled" />
      <TextAreaField label="Terms (read-only)" readOnly defaultValue="Payment within 15 days." />
      <TextAreaField
        label="Terms (disabled)"
        disabled
        disabledReason="Terms come from the contract."
        defaultValue="Payment within 15 days."
      />
    </div>
  ),
}

export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <TextAreaField
        label={LONG.label}
        description={LONG.description}
        error={LONG.error}
        defaultValue={LONG.value}
        rows={4}
      />
    </div>
  ),
}

export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <TextAreaField
        label={ARABIC.label}
        description={ARABIC.description}
        defaultValue={ARABIC.value}
      />
      <TextAreaField label={ARABIC.label} readOnly defaultValue={ARABIC.value} />
    </div>
  ),
}

export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex max-w-100 flex-col gap-6">
      <TextAreaField
        label={JAPANESE.label}
        description={JAPANESE.description}
        defaultValue={JAPANESE.value}
      />
      <TextAreaField label={JAPANESE.label} readOnly defaultValue={JAPANESE.value} />
    </div>
  ),
}
