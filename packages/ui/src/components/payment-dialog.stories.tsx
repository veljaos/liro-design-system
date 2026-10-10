import type { Meta, StoryObj } from '@storybook/react-vite'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { PaymentDialog } from './payment-dialog'
import { CART_TOTAL, CURRENCY, QUICK_AMOUNTS, SPLIT_PAID } from './pos-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

function Till({ children }: { children: ReactNode }) {
  return (
    <StoryProvider density="touch">
      <ExampleProvider>{children}</ExampleProvider>
    </StoryProvider>
  )
}

const DONE_ACTIONS = (
  <>
    <Button intent="print" emphasis="secondary" label="Print receipt" />
    <Button family="primary" icon={Plus} emphasis="primary" label="New sale" />
  </>
)

const dialog = () => within(document.body).getByRole('dialog', { name: 'Payment' })

const meta = {
  title: 'Components/POS/PaymentDialog',
  component: PaymentDialog,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** taking the money for a sale — cash (exact amount, the application’s ' +
          'banknotes, the keypad), card (the terminal’s state: ready, waiting, declined with its ' +
          'reason, approved) or split (the parts paid and the next one). **It never subtracts:** ' +
          'the change due, the remaining amount and whether it can be completed come from the ' +
          'application as decimal strings and words.\n\n' +
          '**When:** after “Charge” in CartPanel.\n\n' +
          '**When not:** an invoice’s payment in the books (a form); a refund (the application’s ' +
          'own flow with a confirmation).',
      },
    },
  },
  args: {
    defaultOpen: true,
    total: CART_TOTAL,
    currency: CURRENCY,
    quickAmounts: QUICK_AMOUNTS,
    onComplete: () => undefined,
    onCardStart: () => undefined,
    onCardCancel: () => undefined,
    onAddPart: () => undefined,
    trigger: <Button family="primary" icon={Plus} label="Charge" />,
  },
  render: (args) => (
    <Till>
      <PaymentDialog {...args} />
    </Till>
  ),
  play: settle,
} satisfies Meta<typeof PaymentDialog>

export default meta

type Story = StoryObj<typeof meta>

/** Cash: 2.000,00 tendered, the change from the application. */
export const Cash: Story = {
  args: { defaultTendered: '2000', change: '989.00' },
  play: async () => {
    await settle()
    await expect(dialog()).toHaveTextContent('Change due')
    await expect(within(dialog()).getByLabelText(/Amount tendered/)).toHaveValue('2.000')
  },
}

/** Cash short: what remains, and why it cannot be completed yet. */
export const CashShort: Story = {
  name: 'Cash short',
  args: {
    defaultTendered: '1000',
    remaining: '11.00',
    completeDisabledReason: 'The amount tendered is less than the amount due.',
  },
}

/** Card, ready to send to the terminal. */
export const Card: Story = {
  args: { defaultMethod: 'card', completeDisabledReason: 'Waiting for the card payment.' },
}

/** Card: waiting for the terminal; the dialog cannot be dismissed meanwhile. */
export const CardWaiting: Story = {
  name: 'Card waiting',
  args: { defaultMethod: 'card', cardState: 'waiting' },
  play: async () => {
    await settle()
    await expect(within(dialog()).queryByRole('button', { name: 'Close' })).toBeNull()
  },
}

/** Card declined, with the terminal's reason and "Try again". */
export const CardDeclined: Story = {
  name: 'Card declined',
  args: {
    defaultMethod: 'card',
    cardState: 'declined',
    cardMessage: 'Insufficient funds (code 51). Ask for another card or cash.',
    completeDisabledReason: 'Waiting for the card payment.',
  },
}

/** Card approved. */
export const CardApproved: Story = {
  name: 'Card approved',
  args: {
    defaultMethod: 'card',
    cardState: 'approved',
    cardMessage: 'Visa •••• 4821, authorisation 093214',
  },
}

/** Split: 500,00 paid by card, 511,00 remaining on the keypad. */
export const Split: Story = {
  args: {
    defaultMethod: 'split',
    paid: SPLIT_PAID,
    remaining: '511.00',
    defaultTendered: '511',
    completeDisabledReason: 'Pay the remaining amount first.',
  },
}

/** The application is completing it: the button works and the dialog stays. */
export const Completing: Story = {
  args: { defaultTendered: '2000', change: '989.00', completing: true },
}

/** Done: the change large, the receipt and a new sale. */
export const Done: Story = {
  args: {
    done: true,
    change: '989.00',
    doneText: 'Receipt ZK-02-000412',
    doneActions: DONE_ACTIONS,
  },
  play: async () => {
    await settle()
    await expect(dialog()).toHaveTextContent('Payment complete')
  },
}

/** Cash only (the application offers one method): no method switch. */
export const CashOnly: Story = {
  name: 'One method',
  args: { methods: ['cash'], defaultTendered: '1011', change: '0.00' },
}

/** Long texts wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    title: 'Payment for the order of the kindergarten "Radosno detinjstvo", Novi Sad',
    total: '1234567.89',
    defaultMethod: 'card',
    cardState: 'declined',
    cardMessage:
      'The card issuer declined the payment because the daily limit for purchases has been reached; ask the customer to call the bank or to pay another way.',
    completeLabel: 'Complete the payment and print the fiscal receipt',
    completeDisabledReason: 'Waiting for the card payment.',
  },
}

/** On a phone. */
export const Phone: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <StoryProvider density="touch">
        <ExampleProvider>
          <PaymentDialog {...args} defaultTendered="2000" change="989.00" />
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
}

/** Arabic, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" density="touch">
      <PaymentDialog
        defaultOpen
        title="الدفع"
        total="31.50"
        currency="د.إ"
        quickAmounts={['50', '100']}
        defaultTendered="50"
        change="18.50"
        onComplete={() => undefined}
        completeLabel="إتمام الدفع"
      />
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja" density="touch">
      <PaymentDialog
        defaultOpen
        title="お支払い"
        total="820"
        currency="¥"
        quickAmounts={['1000', '5000']}
        defaultMethod="card"
        cardState="waiting"
        cardMessage="お客様にカードをタッチしていただいてください。"
        onCardCancel={() => undefined}
        onComplete={() => undefined}
        completeLabel="支払いを完了"
      />
    </StoryProvider>
  ),
}

/** A banknote sets the amount tendered; the application answers with the change. */
export const QuickAmount: Story = {
  name: 'Quick amount, interaction',
  tags: ['interaction'],
  args: { onTenderedChange: fn() },
  play: async ({ args }) => {
    await settle()
    const body = within(dialog())
    await userEvent.click(body.getByRole('button', { name: /^5\.000,00/ }))
    await expect(args.onTenderedChange).toHaveBeenCalledWith('5000')
    await expect(body.getByLabelText(/Amount tendered/)).toHaveValue('5.000')
    await userEvent.click(body.getByRole('button', { name: 'Exact amount' }))
    await expect(args.onTenderedChange).toHaveBeenLastCalledWith('1011.00')
  },
}
