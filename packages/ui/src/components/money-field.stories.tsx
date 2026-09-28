import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { settle } from '../primitives/story-helpers'
import { LiroProvider, useLiro } from '../provider/liro-provider'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { MoneyField } from './number-field'

const meta = {
  title: 'Components/Fields/MoneyField',
  component: MoneyField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** an amount of money. Typed and read as NumberField (no mask, decimal ' +
          'string, never rounded, unreadable text kept with the field\'s own message), shown with ' +
          'the provider\'s money decimals unless `decimals` is given, and the currency beside it ' +
          'on the side where the locale writes it — the same rule as `format.money`, so an amount ' +
          'looks the same in a field and in text (Serbian 1.234,56 EUR, English EUR 1,234.56). The ' +
          'currency is the application\'s; the field never converts or totals.\n\n' +
          '**When not:** a quantity or a rate (NumberField); a total computed by the server ' +
          '(MoneyText, P2.8, read-only display).',
      },
    },
  },
  args: { label: 'Amount', currency: 'EUR' },
  play: settle,
} satisfies Meta<typeof MoneyField>

export default meta

type Story = StoryObj<typeof meta>

/** An amount with its currency; the toolbar's locale and money decimals change how it looks. */
export const Default: Story = {
  args: { description: 'Without VAT' },
  render: function Render(args) {
    const [value, setValue] = useState<string | null>('1234.5')
    return (
      <div className="flex max-w-100 flex-col gap-3">
        <MoneyField {...args} value={value} onChange={setValue} />
        <p className="m-0 text-sm text-secondary">
          Value: <code>{value === null ? 'null' : `"${value}"`}</code>
        </p>
      </div>
    )
  },
}

/** A nested provider with its own locale, in the story's theme. */
function Locale({ locale, children }: { locale: string; children: ReactNode }) {
  const { colorScheme } = useLiro()
  return (
    <LiroProvider locale={locale} colorScheme={colorScheme}>
      {children}
    </LiroProvider>
  )
}

/** The currency's side follows the locale: after the amount in Serbian, before it in English. */
export const CurrencyPosition: Story = {
  name: 'Currency position by locale',
  render: () => (
    <div className="flex max-w-100 flex-col gap-6">
      <Locale locale="sr-Latn-RS">
        <MoneyField label="Iznos (sr-Latn-RS)" currency="EUR" defaultValue="1234.56" />
      </Locale>
      <Locale locale="en">
        <MoneyField label="Amount (en)" currency="EUR" defaultValue="1234.56" />
      </Locale>
      <Locale locale="en">
        <MoneyField label="Amount (en), 4 decimals" currency="USD" defaultValue="0.5" decimals={4} />
      </Locale>
    </div>
  ),
}

/** Empty, required, error, read-only next to disabled, negative. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-100 flex-col gap-6">
      <MoneyField label="Amount" currency="EUR" placeholder="0.00" name="amount" />
      <MoneyField label="Amount" currency="EUR" required defaultValue="100" />
      <MoneyField
        label="Advance"
        currency="EUR"
        defaultValue="5000"
        error="The advance cannot exceed the invoice total."
      />
      <MoneyField label="Total (read-only)" currency="EUR" readOnly defaultValue="12345.6" />
      <MoneyField
        label="Total (disabled)"
        currency="EUR"
        disabled
        disabledReason="Totals are computed by the server."
        defaultValue="12345.6"
      />
      <MoneyField label="Credit" currency="RSD" defaultValue="-42" />
    </div>
  ),
}

/** Long label and error at phone width, with a long amount. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <MoneyField
        label={LONG.label}
        description={LONG.description}
        currency="EUR"
        defaultValue="12345678901234.567891"
      />
      <MoneyField label={LONG.label} currency="RSD" error={LONG.error} defaultValue="1" />
    </div>
  ),
}

/** Arabic sample text, right to left: the currency moves with the direction. */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <MoneyField label={ARABIC.label} description={ARABIC.description} currency="EUR" defaultValue="-42" />
      <MoneyField label={ARABIC.label} currency="EUR" required error={ARABIC.error} />
      <MoneyField label={ARABIC.label} currency="EUR" readOnly defaultValue="1234.5" />
      <MoneyField
        label={ARABIC.label}
        currency="EUR"
        disabled
        disabledReason={ARABIC.reason}
        defaultValue="7"
      />
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex max-w-100 flex-col gap-6">
      <MoneyField label={JAPANESE.label} description={JAPANESE.description} currency="JPY" defaultValue="1234" decimals={0} />
      <MoneyField label={JAPANESE.label} currency="JPY" required error={JAPANESE.error} />
      <MoneyField label={JAPANESE.label} currency="JPY" readOnly defaultValue="1234" decimals={0} />
      <MoneyField
        label={JAPANESE.label}
        currency="JPY"
        disabled
        disabledReason={JAPANESE.reason}
        defaultValue="7"
        decimals={0}
      />
    </div>
  ),
}
