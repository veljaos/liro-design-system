import type { Meta, StoryObj } from '@storybook/react-vite'
import { within } from 'storybook/test'
import { Input } from '../primitives/input'
import { settle } from '../primitives/story-helpers'
import { CheckboxField, SwitchField } from './checkbox-field'
import { ComboboxField } from './combobox-field'
import { DateField, DateRangeField } from './date-field'
import { Field } from './field'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { MonthField } from './month-field'
import { MultiSelectField } from './multi-select-field'
import { MoneyField, NumberField } from './number-field'
import { PasswordField } from './password-field'
import { RadioGroupField } from './radio-group-field'
import { SelectField } from './select-field'
import { expectContentDirection, StoryProvider } from './story-frames'
import { TextAreaField, TextField } from './text-field'
import { TimeField } from './time-field'

const meta = {
  title: 'Components/Fields/Field',
  component: Field,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the frame every field shares: label, description, the control, and ' +
          'under it the error (danger colour with an icon, linked to the control). The control ' +
          'receives its id, aria-describedby and states through a render function.\n\n' +
          '**Read only** is the one state of a field that cannot be changed (P5.93): the grey ' +
          'background and drawn border of the old disabled field, the value in the full text ' +
          'colour, focusable and selectable, announced as read-only; no hint, no placeholder, an ' +
          'empty value shows “—”. Fields have no disabled state; an action that cannot be used ' +
          'is unavailable with its reason (ActionGroup).\n\n' +
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

/** Required with an error, and read only (its hint left out). */
export const States: Story = {
  render: (args) => (
    <div className="flex max-w-100 flex-col gap-6">
      <Field {...args} required error="The order number is already used" />
      <Field {...args} readOnly description="Not shown: no hint in read only" />
      <Field {...args} id="field-with-id" description="With an id of its own" />
    </div>
  ),
}

/**
 * Read only, every field (P5.93): one look for a value that cannot be changed — the grey
 * background and drawn border of the old disabled field, the value in the full text colour,
 * focusable and selectable. No hints and no placeholders; an empty value shows "—".
 */
export const ReadOnlyEveryField: Story = {
  name: 'Read only, every field',
  render: () => (
    <div className="grid max-w-180 grid-cols-1 gap-6 sm:grid-cols-2">
      <TextField label="Customer" readOnly defaultValue="Alfa Trade d.o.o." />
      <TextField label="Reference" readOnly placeholder="Not shown" description="Not shown" />
      <NumberField label="Quantity" readOnly defaultValue="12" />
      <MoneyField label="Total" currency="EUR" readOnly defaultValue="1234.5" />
      <DateField label="Due date" readOnly defaultValue="2026-11-15" />
      <DateRangeField
        label="Contract"
        readOnly
        defaultValue={{ start: '2026-01-01', end: '2026-12-31' }}
      />
      <MonthField label="Accounting period" readOnly defaultValue="2026-09" />
      <TimeField label="Opening" readOnly defaultValue="08:30" />
      <SelectField
        label="Currency"
        readOnly
        defaultValue="eur"
        options={[
          { value: 'rsd', label: 'Dinar' },
          { value: 'eur', label: 'Euro' },
        ]}
      />
      <ComboboxField
        label="Sales agent"
        readOnly
        options={[]}
        defaultValue={{ value: 'ana', label: 'Ana Jovanović' }}
      />
      <MultiSelectField
        label="Labels"
        readOnly
        defaultValue={['a', 'b']}
        options={[
          { value: 'a', label: 'Priority' },
          { value: 'b', label: 'Export' },
        ]}
      />
      <PasswordField label="Password" readOnly defaultValue="kvadrat-2026" />
      <TextAreaField label="Note" readOnly defaultValue="Payment within 15 days." rows={2} />
      <RadioGroupField
        label="VAT period"
        readOnly
        defaultValue="m"
        options={[
          { value: 'm', label: 'Monthly' },
          { value: 'q', label: 'Quarterly' },
        ]}
      />
      <div className="flex flex-col gap-3">
        <CheckboxField label="Exported to accounting" readOnly defaultChecked />
        <CheckboxField label="Sent by e-mail" readOnly />
        <SwitchField label="Audit log" readOnly defaultChecked />
        <SwitchField label="Reminders" readOnly />
      </div>
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
  tags: ['!dev'],
  render: (args) => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <Field {...args} label={ARABIC.label} description={ARABIC.description} error={ARABIC.error} />
    </div>
  ),
}

export const Japanese: Story = {
  tags: ['!dev'],
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
 * English in a right-to-left page (P3.6): labels, descriptions and errors take their
 * direction from their own text, so ".Enter a number" never happens; the fields and the order
 * of their parts stay right to left.
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
        <TextField label="Warehouse" readOnly defaultValue="Main" />
        <CheckboxField label="Send a copy by e-mail." description="To the customer's address." />
      </div>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expectContentDirection(
      canvas.getByText('Shown on the delivery note.'),
      canvas.getByText('Enter a number, e.g. 12.'),
    )
    await settle()
  },
}
