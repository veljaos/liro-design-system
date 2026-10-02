import type { Meta, StoryObj } from '@storybook/react-vite'
import { within } from 'storybook/test'
import { Input } from '../primitives/input'
import { settle } from '../primitives/story-helpers'
import { CheckboxField } from './checkbox-field'
import { Field } from './field'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { expectContentDirection, StoryProvider } from './story-frames'
import { TextField } from './text-field'

const meta = {
  title: 'Components/Fields/Field',
  component: Field,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the frame every field shares: label, description, the control, and ' +
          'under it the error (danger colour with an icon, linked to the control) or the reason ' +
          'it is disabled. The control receives its id, aria-describedby and states through a ' +
          'render function.\n\n' +
          '**When not:** in product code, use the ready fields (TextField, SelectField, …); use ' +
          'Field directly only for a control the Design System does not have yet, and ask for it.',
      },
    },
  },
  args: {
    label: 'Order number',
    children: (control) => (
      <Input
        id={control.id}
        aria-describedby={control.describedBy}
        aria-invalid={control.invalid || undefined}
        required={control.required}
        disabled={control.disabled}
        readOnly={control.readOnly}
        defaultValue="PO-2026-114"
      />
    ),
  },
  play: settle,
} satisfies Meta<typeof Field>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { description: 'From the customer’s purchase order', className: 'max-w-100' },
}

/** Required with an error, and disabled with a reason. */
export const States: Story = {
  render: (args) => (
    <div className="flex max-w-100 flex-col gap-6">
      <Field {...args} required error="The order number is already used" />
      <Field {...args} disabled disabledReason="The order is closed." />
      <Field {...args} id="field-with-id" description="With an id of its own" />
    </div>
  ),
}

export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: (args) => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <Field {...args} label={LONG.label} description={LONG.description} error={LONG.error} />
    </div>
  ),
}

export const Arabic: Story = {
  render: (args) => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <Field {...args} label={ARABIC.label} description={ARABIC.description} error={ARABIC.error} />
    </div>
  ),
}

export const Japanese: Story = {
  render: (args) => (
    <div lang="ja" className="flex max-w-100 flex-col gap-6">
      <Field
        {...args}
        label={JAPANESE.label}
        description={JAPANESE.description}
        error={JAPANESE.error}
      />
    </div>
  ),
}

/**
 * English in a right-to-left page (P3.6): labels, descriptions, errors and reasons take their
 * direction from their own text, so ".Enter a number" never happens; the layout stays right to
 * left (the label at the right edge).
 */
export const EnglishInRtl: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="flex max-w-100 flex-col gap-6">
        <TextField
          label="Quantity (pcs.)"
          description="Shown on the delivery note."
          error="Enter a number, e.g. 12."
          defaultValue="12x"
        />
        <TextField
          label="Warehouse"
          disabled
          disabledReason="The period August 2026 is closed."
          defaultValue="Main"
        />
        <CheckboxField label="Send a copy by e-mail." description="To the customer's address." />
      </div>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expectContentDirection(
      canvas.getByText('Shown on the delivery note.'),
      canvas.getByText('Enter a number, e.g. 12.'),
      canvas.getByText('The period August 2026 is closed.'),
    )
    await settle()
  },
}
