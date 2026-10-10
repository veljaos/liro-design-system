import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { NumericKeypad } from './numeric-keypad'
import { CURRENCY } from './pos-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** The till's provider: touch density, Serbian amounts. */
function Till({ children }: { children: ReactNode }) {
  return (
    <StoryProvider density="touch">
      <ExampleProvider>{children}</ExampleProvider>
    </StoryProvider>
  )
}

const meta = {
  title: 'Components/POS/NumericKeypad',
  component: NumericKeypad,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** an amount or a quantity entered with fingers at a till or on a handheld, ' +
          'or with the keyboard: 0–9, the decimal separator of the provider’s format, backspace, ' +
          'clear and an optional Enter. It reports a decimal string (never a number) and never ' +
          'rounds: `maxDecimals` stops more digits instead. The keys stand left to right in every ' +
          'direction, as on calculators and card terminals; the display opens no on-screen keyboard ' +
          'and is not a live region (each key is not announced).\n\n' +
          '**When:** cash tendered (PaymentDialog), a quantity or a weight at a till, a PIN-less ' +
          'number on a kiosk.\n\n' +
          '**When not:** a form on a desktop — use NumberField or MoneyField; a quantity with − and + ' +
          '(QuantityStepper).',
      },
    },
  },
  args: { label: 'Amount tendered' },
  render: (args) => (
    <Till>
      <NumericKeypad {...args} />
    </Till>
  ),
  play: settle,
} satisfies Meta<typeof NumericKeypad>

export default meta

type Story = StoryObj<typeof meta>

/** An amount in dinars with Enter: "1.234,5" typed so far. */
export const Default: Story = {
  args: { currency: CURRENCY, defaultValue: '1234.5', onEnter: () => undefined },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText(/Amount tendered/)).toHaveValue('1.234,5')
    await expect(canvas.getByRole('button', { name: 'Decimal separator' })).toHaveTextContent(',')
  },
}

/** Empty: zero shown faintly. */
export const Empty: Story = {
  args: { currency: CURRENCY, onEnter: () => undefined, enterLabel: 'Complete payment' },
}

/** Whole quantities: no separator key, no Enter. */
export const Quantity: Story = {
  args: { label: 'Quantity', maxDecimals: 0, defaultValue: '12' },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).queryByRole('button', { name: 'Decimal separator' }),
    ).toBeNull()
  },
}

/** Weights to three decimals, Enter secondary beside another main action. */
export const Weight: Story = {
  args: {
    label: 'Weight',
    maxDecimals: 3,
    defaultValue: '0.75',
    onEnter: () => undefined,
    enterLabel: 'Add',
    enterEmphasis: 'secondary',
  },
}

/** Disabled (the register is locked). */
export const Disabled: Story = {
  args: { currency: CURRENCY, defaultValue: '500', disabled: true, onEnter: () => undefined },
}

/** Label hidden, where a heading beside it names it. */
export const LabelHidden: Story = {
  name: 'Label hidden',
  args: { hideLabel: true, currency: CURRENCY, defaultValue: '2000' },
}

/** Long label and Enter text wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    label: 'Amount the customer handed over in cash, before the change is counted',
    currency: CURRENCY,
    defaultValue: '123456789.25',
    onEnter: () => undefined,
    enterLabel: 'Complete the payment and print the receipt',
  },
}

/** On a phone. */
export const Phone: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <StoryProvider density="touch">
        <ExampleProvider>
          <div className="p-4">
            <NumericKeypad
              {...args}
              currency={CURRENCY}
              defaultValue="850"
              onEnter={() => undefined}
            />
          </div>
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
}

/** Arabic, right to left: the label follows the page, the keys stay left to right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" density="touch">
      <NumericKeypad
        label="المبلغ المدفوع"
        currency="د.إ"
        defaultValue="250.5"
        onEnter={() => undefined}
        enterLabel="تأكيد"
      />
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja" density="touch">
      <NumericKeypad
        label="お預かり金額"
        currency="¥"
        maxDecimals={0}
        defaultValue="5000"
        onEnter={() => undefined}
        enterLabel="確定"
      />
    </StoryProvider>
  ),
}

/** Fingers and the keyboard: keys and typed digits build "1.205,5"; Backspace and Delete. */
export const Typing: Story = {
  name: 'Typing, interaction',
  tags: ['interaction'],
  args: { currency: CURRENCY, onEnter: () => undefined },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const display = canvas.getByLabelText(/Amount tendered/)
    await userEvent.click(canvas.getByRole('button', { name: '1' }))
    await userEvent.click(canvas.getByRole('button', { name: '2' }))
    await userEvent.keyboard('05,5')
    await expect(display).toHaveValue('1.205,5')
    await userEvent.keyboard('{Backspace}')
    await expect(display).toHaveValue('1.205,')
    await userEvent.keyboard('{Delete}')
    await expect(display).toHaveValue('')
  },
}
