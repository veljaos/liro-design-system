import type { Meta, StoryObj } from '@storybook/react-vite'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { PaymentDialog } from './payment-dialog'
import { BuyerField } from './buyer-field'
import { CART_TOTAL, CURRENCY, QUICK_AMOUNTS, SPLIT_PAID } from './pos-story-data'
import { ReceiptResult } from './receipt-result'
import {
  BAKERY_PAYEE,
  BUYER_ID_TYPES,
  DELIVERIES,
  instantPaymentCode,
  ISSUED_FACTS,
  MIXED_PAID,
  PAYMENT_OPTIONS,
  RECEIPT_LINK,
  WIRE_WITHOUT_BUYER,
} from './sale-story-data'
import { QrCode } from './qr-code'
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
          'own flow with a confirmation).\n\n' +
          '**The application’s own ways to pay (P5.28):** `methods` may hold `PaymentOption`s — ' +
          'cash, card, cheque, wire transfer or deferred payment, voucher, instant payment (a code ' +
          'the customer scans), other cashless; more than four wrap as a grid of pressed buttons. ' +
          'With `onAddPart` several ways pay one sale: the parts paid and the remaining amount ' +
          'stand on top. A way that needs something first (the buyer) shows the reason and the ' +
          'application’s `extra` field.',
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
    onAddPart: () => undefined,
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

/** The receipt's code as the application draws it (a stand-in here). */
const RECEIPT_CODE = (
  <span className="flex text-primary">
    <QrCode value={RECEIPT_LINK.href} label="Receipt code" />
  </span>
)

/** An instant payment's code shown to the customer (a stand-in here). */
const PAYMENT_CODE = (
  <span className="flex text-primary">
    <QrCode
      value={instantPaymentCode(BAKERY_PAYEE, '1011.00', '1011')}
      label="IPS QR code for the payment"
      size={176}
    />
  </span>
)

/** The seven ways to pay of the application, cash chosen: a wrapping grid of pressed buttons. */
export const OwnMethods: Story = {
  name: 'Own ways to pay',
  args: {
    methods: PAYMENT_OPTIONS,
    defaultTendered: '2000',
    change: '989.00',
  },
  play: async () => {
    await settle()
    const methods = within(dialog()).getByRole('group', { name: 'Payment method' })
    await expect(within(methods).getAllByRole('button')).toHaveLength(7)
    await expect(within(methods).getByRole('button', { name: 'Cash' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}

/** Several ways on one sale: a voucher and a card paid, 111,00 remaining, cash for the rest. */
export const Mixed: Story = {
  name: 'Several ways on one sale',
  args: {
    methods: PAYMENT_OPTIONS,
    paid: MIXED_PAID,
    remaining: '111.00',
    defaultTendered: '200',
    change: '89.00',
    onRemovePart: () => undefined,
    onAddPart: () => undefined,
  },
  play: async () => {
    await settle()
    const body = within(dialog())
    await expect(dialog()).toHaveTextContent('Paid so far')
    await expect(body.getByRole('button', { name: 'Remove Voucher' })).toBeVisible()
    await expect(body.getByRole('button', { name: 'Add this payment' })).toBeVisible()
  },
}

/** A voucher: the amount of this payment and its code, the application's rule under it. */
export const Voucher: Story = {
  args: {
    methods: PAYMENT_OPTIONS,
    defaultMethod: 'voucher',
    defaultTendered: '500',
    defaultReference: 'VC-2026-7741',
    remaining: '1011.00',
    onAddPart: () => undefined,
  },
  play: async () => {
    await settle()
    await expect(within(dialog()).getByRole('textbox', { name: 'Voucher code' })).toHaveValue(
      'VC-2026-7741',
    )
  },
}

/** An instant payment: the code large for the customer, waiting; not dismissible meanwhile. */
export const InstantWaiting: Story = {
  name: 'Instant payment waiting',
  args: {
    methods: PAYMENT_OPTIONS,
    defaultMethod: 'instant',
    cardState: 'waiting',
    qrCode: PAYMENT_CODE,
  },
  play: async () => {
    await settle()
    await expect(within(dialog()).getByRole('img', { name: 'Instant payment code' })).toBeVisible()
    await expect(dialog()).toHaveTextContent('Waiting for the payment…')
  },
}

/** An instant payment received. */
export const InstantApproved: Story = {
  name: 'Instant payment received',
  args: {
    methods: PAYMENT_OPTIONS,
    defaultMethod: 'instant',
    cardState: 'approved',
    cardMessage: 'Paid from the account of Ana Petrović, reference 97 1234-5678',
  },
}

/** A wire transfer without the buyer: the reason, and the buyer's field (the application's). */
export const DeferredNeedsBuyer: Story = {
  name: 'Deferred payment needs the buyer',
  args: {
    methods: [...PAYMENT_OPTIONS.filter((each) => each.id !== 'wire'), WIRE_WITHOUT_BUYER],
    defaultMethod: 'wire',
    completeDisabledReason: 'Enter the buyer first.',
    extra: <BuyerField types={BUYER_ID_TYPES} required defaultValue={{ typeId: '10', id: '' }} />,
  },
  play: async () => {
    await settle()
    await expect(dialog()).toHaveTextContent('A wire transfer needs the buyer’s tax number.')
    await expect(within(dialog()).getByRole('textbox', { name: /Buyer ID/ })).toBeVisible()
  },
}

/** Done: the issued receipt with its code and the ways to give it. */
export const DoneWithReceipt: Story = {
  name: 'Done, receipt issued',
  args: {
    done: true,
    change: '989.00',
    doneActions: DONE_ACTIONS,
    doneContent: (
      <ReceiptResult
        facts={ISSUED_FACTS}
        code={RECEIPT_CODE}
        link={RECEIPT_LINK}
        deliveries={DELIVERIES}
        onDeliver={() => undefined}
      />
    ),
  },
  play: async () => {
    await settle()
    await expect(dialog()).toHaveTextContent('2290/2318ПП')
  },
}

/** On a phone: the seven ways wrap. */
export const OwnMethodsPhone: Story = {
  name: 'Own ways to pay, phone width',
  render: (args) => (
    <PhoneFrame>
      <StoryProvider density="touch">
        <ExampleProvider>
          <PaymentDialog
            {...args}
            methods={PAYMENT_OPTIONS}
            paid={MIXED_PAID}
            remaining="111.00"
            defaultTendered="200"
            change="89.00"
            onAddPart={() => undefined}
          />
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
}

/** Choosing a way reports its id; a cheque part is added with the keypad's amount. */
export const AddingParts: Story = {
  name: 'Adding parts, interaction',
  tags: ['interaction'],
  args: {
    methods: PAYMENT_OPTIONS,
    remaining: '1011.00',
    onMethodChange: fn(),
    onAddPart: fn(),
  },
  play: async ({ args }) => {
    await settle()
    const body = within(dialog())
    await userEvent.click(body.getByRole('button', { name: 'Cheque' }))
    await expect(args.onMethodChange).toHaveBeenCalledWith('cheque')
    await userEvent.click(body.getByRole('button', { name: '5' }))
    await userEvent.click(body.getByRole('button', { name: '0' }))
    await userEvent.click(body.getByRole('button', { name: '0' }))
    await userEvent.click(body.getByRole('button', { name: 'Add this payment' }))
    await expect(args.onAddPart).toHaveBeenCalledWith('cheque', '500')
  },
}
