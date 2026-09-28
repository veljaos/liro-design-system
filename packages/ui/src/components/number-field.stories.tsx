import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { MoneyField, NumberField } from './number-field'

const meta = {
  title: 'Components/Fields/NumberField',
  component: NumberField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a number typed freely, without a mask: quantities, rates, counts. ' +
          'Whatever people type or paste ("1234.56", "1.234,56", "1 234,56", "1\'234.56") is read ' +
          'on leaving the field or on Enter by the provider\'s `format.parseNumber`, and the value ' +
          'is a **decimal string**, never a JavaScript number. `decimals` adds zeros; it never ' +
          'rounds. Text that cannot be read stays in the field, the value is null (never 0), the ' +
          'field shows its own message and calls `onValidityChange(false)`; the application\'s ' +
          '`error` replaces the message. Start-aligned, tabular digits. MoneyField adds the ' +
          'currency, on the side the locale writes it.\n\n' +
          '**When not:** an identifier made of digits (a tax number, a phone number: TextField); ' +
          'an amount of money (MoneyField); a date (DateField).',
      },
    },
  },
  args: { label: 'Quantity' },
  play: settle,
} satisfies Meta<typeof NumberField>

export default meta

type Story = StoryObj<typeof meta>

/** Type any form of a number and leave the field: it is read and shown in the screen's scheme. */
export const Default: Story = {
  args: { description: 'Units on the delivery note', decimals: 2, placeholder: '0' },
  render: function Render(args) {
    const [value, setValue] = useState<string | null>('1234.5')
    const [valid, setValid] = useState(true)
    return (
      <div className="flex max-w-100 flex-col gap-3">
        <NumberField {...args} value={value} onChange={setValue} onValidityChange={setValid} />
        <p className="m-0 text-sm text-secondary">
          Value: <code>{value === null ? 'null' : `"${value}"`}</code>, valid:{' '}
          <code>{String(valid)}</code>
        </p>
      </div>
    )
  },
}

/** Unreadable text stays for correction; the field shows its own message; the value is null. */
export const Unreadable: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>('12')
    const [valid, setValid] = useState(true)
    return (
      <div className="flex max-w-100 flex-col gap-3">
        <NumberField
          label="Quantity"
          value={value}
          onChange={setValue}
          onValidityChange={setValid}
        />
        <p className="m-0 text-sm text-secondary">
          Value: <code>{value === null ? 'null' : `"${value}"`}</code>, valid:{' '}
          <code>{String(valid)}</code>
        </p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Quantity' })
    await userEvent.clear(input)
    await userEvent.type(input, '12abc', { delay: 0 })
    await userEvent.tab()
    await expect(input).toHaveValue('12abc')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(canvas.getByText('Enter a number')).toBeVisible()
    await expect(canvas.getByText('null')).toBeVisible()
    await settle()
  },
}

/** A pasted number in another scheme is read on Enter; the value is the decimal string. */
export const ReadOnEnter: Story = {
  name: 'Read on Enter',
  render: function Render() {
    const [value, setValue] = useState<string | null>(null)
    return (
      <div className="flex max-w-100 flex-col gap-3">
        <MoneyField label="Amount" currency="EUR" value={value} onChange={setValue} />
        <p className="m-0 text-sm text-secondary">
          Value: <code>{value === null ? 'null' : `"${value}"`}</code>
        </p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: /Amount/ })
    await userEvent.click(input)
    await userEvent.paste('1.234,5')
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByText('"1234.5"')).toBeVisible()
    await settle()
  },
}

/** Empty, required, the application's error, read-only next to disabled, and decimals. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-100 flex-col gap-6">
      <NumberField label="Quantity" placeholder="0" name="quantity" />
      <NumberField label="Quantity" required defaultValue="12" />
      <NumberField label="Discount %" defaultValue="120" error="A discount cannot exceed 100%." />
      <NumberField label="Rate (read-only)" readOnly defaultValue="0.0725" decimals={2} />
      <NumberField
        label="Rate (disabled)"
        disabled
        disabledReason="The period is closed."
        defaultValue="0.0725"
      />
      <NumberField label="Exchange rate, 6 decimals" defaultValue="117.2" decimals={6} />
      <NumberField label="More digits than decimals: all shown" defaultValue="1.23456" decimals={2} />
      <NumberField label="Negative" defaultValue="-42" decimals={2} />
    </div>
  ),
}

/** Long label, description, value and error at phone width: everything wraps, nothing clips. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <NumberField
        label={LONG.label}
        description={LONG.description}
        defaultValue="12345678901234.567891"
      />
      <MoneyField
        label={LONG.label}
        currency="EUR"
        error={LONG.error}
        defaultValue="98765432109876.54"
      />
    </div>
  ),
}

/** Arabic sample text, right to left: the number itself stays left to right. */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <NumberField label={ARABIC.label} description={ARABIC.description} defaultValue="-42" decimals={2} />
      <NumberField label={ARABIC.label} required error={ARABIC.error} />
      <NumberField label={ARABIC.label} readOnly defaultValue="1234.5" />
      <NumberField label={ARABIC.label} disabled disabledReason={ARABIC.reason} defaultValue="7" />
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex max-w-100 flex-col gap-6">
      <NumberField label={JAPANESE.label} description={JAPANESE.description} defaultValue="1234.5" />
      <NumberField label={JAPANESE.label} required error={JAPANESE.error} />
      <NumberField label={JAPANESE.label} readOnly defaultValue="1234.5" />
      <NumberField label={JAPANESE.label} disabled disabledReason={JAPANESE.reason} defaultValue="7" />
    </div>
  ),
}
