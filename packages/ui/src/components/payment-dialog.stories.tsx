import type { Meta, StoryObj } from '@storybook/react-vite'
import { Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { PaymentDialog, type CardState, type PaymentPart } from './payment-dialog'
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

/** Everything fits at once — the dialog never scrolls (the tests run at 1280 × 720). */
async function expectNoScroll() {
  const content = document.querySelector<HTMLElement>('[data-slot="payment-dialog"]')
  await expect(content).not.toBeNull()
  if (content === null) return
  await expect(content.scrollHeight).toBeLessThanOrEqual(content.clientHeight + 1)
}

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
          '**It never scrolls:** at a tablet and on a phone the amount due, the ' +
          'ways to pay, the quick amounts, the amount tendered, the keypad and the main action ' +
          'fit at once (two columns on a wide screen, 48px keys on a phone). Cash and Card are ' +
          'the two big choices; every other way stands behind one “Other…”. Done: the change due ' +
          'exactly as given and the focus on the main action (“New sale”).\n\n' +
          '**When:** after “Charge” in CartPanel.\n\n' +
          '**When not:** an invoice’s payment in the books (a form); a refund (the application’s ' +
          'own flow with a confirmation).\n\n' +
          '**The application’s own ways to pay:** `methods` may hold `PaymentOption`s — ' +
          'cash, card, cheque, wire transfer or deferred payment, voucher, instant payment (a code ' +
          'the customer scans), other cashless; more than four wrap as a grid of pressed buttons. ' +
          'With `onAddPart` several ways pay one sale: the parts paid and the remaining amount ' +
          'stand on top. A way that needs something first (the buyer) shows the reason and the ' +
          'application’s `extra` field.\n\n' +
          '**A sale paid in parts, any ways in any order.** The parts paid are a list — ' +
          'the way, the amount, its state (“Paid”, “Approved”) — and the remaining amount always ' +
          'stands beside the amount due. A card takes one part at a time: the amount, “Pay … by ' +
          'card”, the terminal, then approved (the application adds the part) or declined (the ' +
          'amount stays; try again or choose another way). Only cash gives change; any other part ' +
          'is at most the remaining amount and the way’s own limit (a voucher’s value, ' +
          '`maxAmount`). “Complete payment” waits while something is still to pay. Cancelling ' +
          'after an approved part says first that it will be reversed. A way’s label never breaks ' +
          'inside a word: the ways wrap as whole buttons, a label too long ends in “…”.',
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
    await expect(within(dialog()).getByRole('button', { name: 'Cash' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expectNoScroll()
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
  play: async () => {
    await settle()
    await expectNoScroll()
  },
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

/**
 * Split: 500,00 approved by card, 511,00 remaining; the next card part is the keypad's
 * amount and "Pay 511,00 RSD by card". "Complete payment" waits: still to pay.
 */
export const Split: Story = {
  args: {
    defaultMethod: 'card',
    onAddPart: () => undefined,
    paid: SPLIT_PAID,
    remaining: '511.00',
    defaultTendered: '511',
  },
  play: async () => {
    await settle()
    const body = within(dialog())
    await expect(body.getByRole('list', { name: 'Paid so far' })).toHaveTextContent('Approved')
    await expect(body.getByRole('button', { name: /^Pay 511,00\sRSD by card$/ })).toBeVisible()
    await expect(
      body.getByRole('button', { name: 'Complete payment' }),
    ).toHaveAccessibleDescription(/^Still to pay: 511,00\sRSD\.$/)
    // An approval is not removed here: cancelling the payment reverses it.
    await expect(body.queryByRole('button', { name: 'Remove Card' })).toBeNull()
    await expectNoScroll()
  },
}

/** Split: the card part is on the terminal; Cancel there cancels the terminal's request. */
export const SplitCardWaiting: Story = {
  name: 'Split, card part waiting',
  args: {
    methods: PAYMENT_OPTIONS,
    defaultMethod: 'card',
    onAddPart: () => undefined,
    paid: [{ id: 'v1', label: 'Voucher', value: '500.00', detail: 'VC-2026-7741' }],
    remaining: '511.00',
    defaultTendered: '511',
    cardState: 'waiting',
  },
  play: async () => {
    await settle()
    await expect(
      within(dialog()).getByRole('button', { name: 'Cancel card payment' }),
    ).toBeVisible()
    await expectNoScroll()
  },
}

/** Split: the card part was declined; its amount stays for "Try again" or another way. */
export const SplitCardDeclined: Story = {
  name: 'Split, card part declined',
  args: {
    methods: PAYMENT_OPTIONS,
    defaultMethod: 'card',
    onAddPart: () => undefined,
    paid: [{ id: 'v1', label: 'Voucher', value: '500.00', detail: 'VC-2026-7741' }],
    remaining: '511.00',
    defaultTendered: '511',
    cardState: 'declined',
    cardMessage: 'Insufficient funds (code 51).',
  },
  play: async () => {
    await settle()
    const body = within(dialog())
    await expect(dialog()).toHaveTextContent('Try again, or choose another way to pay.')
    await expect(body.getByLabelText(/Amount of this payment/)).toHaveValue('511')
    await expectNoScroll()
  },
}

/** A voucher part over the voucher's value: the reason from the application, nothing added. */
export const VoucherOverValue: Story = {
  name: 'Voucher over its value',
  args: {
    methods: PAYMENT_OPTIONS,
    defaultMethod: 'voucher',
    defaultTendered: '2500',
    defaultReference: 'VC-2026-7741',
    remaining: '3011.00',
    total: '3011.00',
    onAddPart: fn(),
  },
  play: async () => {
    await settle()
    const add = within(dialog()).getByRole('button', { name: 'Add this payment' })
    await expect(add).toHaveAttribute('aria-disabled', 'true')
    await expect(add).toHaveAccessibleDescription('This voucher is worth 2.000,00 RSD.')
  },
}

/** A press on the unavailable "Add this payment" adds nothing. */
export const VoucherOverValueInteraction: Story = {
  ...VoucherOverValue,
  name: 'Voucher over its value, interaction',
  tags: ['interaction', '!dev'],
  play: async ({ args }) => {
    await settle()
    await userEvent.click(within(dialog()).getByRole('button', { name: 'Add this payment' }))
    await expect(args.onAddPart).not.toHaveBeenCalled()
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
    await expect(dialog()).toHaveTextContent('989,00')
    // The done view's main action takes the focus: the next sale is one press away.
    await expect(within(dialog()).getByRole('button', { name: 'New sale' })).toHaveFocus()
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

/** On a phone (390 × 844): one column, 48px keys, nothing scrolls. */
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
  play: async () => {
    await settle()
    await expectNoScroll()
  },
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
  tags: ['interaction', '!dev'],
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

/**
 * The seven ways to pay of the application, cash chosen: Cash and Card are the two big choices,
 * the other five stand behind "Other…".
 */
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
    await expect(within(methods).getAllByRole('button')).toHaveLength(3)
    await expect(within(methods).getByRole('button', { name: 'Cash' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(within(methods).getByRole('button', { name: 'Other…' })).toHaveAttribute(
      'aria-haspopup',
      'menu',
    )
    await expectNoScroll()
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
    await expectNoScroll()
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
    await expect(
      within(dialog()).getByRole('img', { name: 'IPS QR code for the payment' }),
    ).toBeVisible()
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
    await expectNoScroll()
  },
}

/**
 * Done on a phone: the change due and "New sale" (focused) in view at once; the issued receipt
 * opens under "Receipt".
 */
export const DoneWithReceiptPhone: Story = {
  name: 'Done, receipt issued, phone width',
  tags: ['!dev'],
  render: (args) => (
    <PhoneFrame>
      <StoryProvider density="touch">
        <ExampleProvider>
          <PaymentDialog
            {...args}
            done
            change="989.00"
            doneActions={DONE_ACTIONS}
            doneContent={
              <ReceiptResult
                facts={ISSUED_FACTS}
                code={RECEIPT_CODE}
                link={RECEIPT_LINK}
                deliveries={DELIVERIES}
                onDeliver={() => undefined}
              />
            }
          />
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
  play: async () => {
    await settle()
    await expect(within(dialog()).getByRole('button', { name: 'New sale' })).toHaveFocus()
    await expect(within(dialog()).getByRole('button', { name: 'Receipt' })).toBeVisible()
    await expectNoScroll()
  },
}

/** On a phone: several ways on one sale — the parts as chips, nothing scrolls. */
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
            onRemovePart={() => undefined}
          />
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
  play: async () => {
    await settle()
    await expectNoScroll()
  },
}

/** "Other…" opens the other ways; choosing one reports its id; a cheque part is added. */
export const AddingParts: Story = {
  name: 'Adding parts, interaction',
  tags: ['interaction', '!dev'],
  args: {
    methods: PAYMENT_OPTIONS,
    remaining: '1011.00',
    onMethodChange: fn(),
    onAddPart: fn(),
  },
  play: async ({ args }) => {
    await settle()
    const body = within(dialog())
    await userEvent.click(body.getByRole('button', { name: 'Other…' }))
    await userEvent.click(
      await within(document.body).findByRole('menuitemradio', { name: 'Cheque' }),
    )
    await expect(args.onMethodChange).toHaveBeenCalledWith('cheque')
    await expect(body.getByRole('button', { name: 'Cheque' })).toBeVisible()
    await userEvent.click(body.getByRole('button', { name: '5' }))
    await userEvent.click(body.getByRole('button', { name: '0' }))
    await userEvent.click(body.getByRole('button', { name: '0' }))
    await userEvent.click(body.getByRole('button', { name: 'Add this payment' }))
    await expect(args.onAddPart).toHaveBeenCalledWith('cheque', '500')
  },
}

/** The story's till: it adds the approved parts and works out what remains (the application). */
function SplitTill({ onCancel }: { onCancel?: () => void }) {
  const total = 101100n
  const [paid, setPaid] = useState<readonly PaymentPart[]>([])
  const [method, setMethod] = useState('card')
  const [tendered, setTendered] = useState<string | null>(null)
  const [cardState, setCardState] = useState<CardState>('idle')
  const [done, setDone] = useState(false)
  const cents = (value: string) => {
    const [whole = '0', part = ''] = value.split('.')
    return BigInt(whole) * 100n + BigInt((part + '00').slice(0, 2))
  }
  const text = (value: bigint) =>
    `${(value / 100n).toString()}.${(value % 100n).toString().padStart(2, '0')}`
  const left = total - paid.reduce((sum, part) => sum + cents(part.value), 0n)
  const add = (label: string, amount: string, state: 'paid' | 'approved') => {
    setPaid((current) => [
      ...current,
      { id: `p${String(current.length + 1)}`, label, value: text(cents(amount)), state },
    ])
    setTendered(null)
  }
  return (
    <PaymentDialog
      defaultOpen
      total={text(total)}
      currency={CURRENCY}
      quickAmounts={QUICK_AMOUNTS}
      method={method}
      onMethodChange={(next) => {
        setMethod(next)
        setCardState('idle')
      }}
      tendered={tendered}
      onTenderedChange={setTendered}
      paid={paid}
      remaining={text(left)}
      onAddPart={(id, amount) => {
        add(id === 'cash' ? 'Cash' : 'Card', amount, 'paid')
      }}
      cardState={cardState}
      onCardStart={(amount) => {
        if (amount === null) return
        setCardState('waiting')
        // The story's terminal approves at once.
        window.setTimeout(() => {
          add('Card', amount, 'approved')
          setCardState('approved')
        }, 50)
      }}
      onCardCancel={() => {
        setCardState('idle')
      }}
      onComplete={() => {
        setDone(true)
      }}
      done={done}
      doneActions={DONE_ACTIONS}
      {...(onCancel === undefined ? {} : { onCancel })}
    />
  )
}

/**
 * A sale paid in parts: 500,00 by card — the amount, "Pay 500,00 RSD by card", approved —
 * then the rest in cash; "Complete payment" works once nothing remains.
 */
export const SplitAnyWays: Story = {
  name: 'Split, card then cash, interaction',
  tags: ['interaction', '!dev'],
  render: () => (
    <Till>
      <SplitTill />
    </Till>
  ),
  play: async () => {
    await settle()
    const body = within(dialog())
    for (const key of ['5', '0', '0'])
      await userEvent.click(body.getByRole('button', { name: key }))
    await userEvent.click(body.getByRole('button', { name: /^Pay 500,00\sRSD by card$/ }))
    await waitFor(() =>
      expect(body.getByRole('list', { name: 'Paid so far' })).toHaveTextContent('Approved'),
    )
    await expect(dialog()).toHaveTextContent(/511,00\sRSD/)
    await expect(body.getByRole('button', { name: 'Complete payment' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await userEvent.click(body.getByRole('button', { name: 'Cash' }))
    await userEvent.click(body.getByRole('button', { name: 'Exact amount' }))
    await userEvent.click(body.getByRole('button', { name: 'Add this payment' }))
    await expect(body.getByRole('list', { name: 'Paid so far' })).toHaveTextContent('Cash')
    await expect(body.getByRole('button', { name: 'Complete payment' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    )
  },
}

/** Cancelling after an approved card part: the dialog says first that it will be reversed. */
export const CancelAfterApproval: Story = {
  name: 'Cancel after an approved part, interaction',
  tags: ['interaction', '!dev'],
  args: { onCancel: fn() },
  render: (args) => (
    <Till>
      <SplitTill {...(args.onCancel === undefined ? {} : { onCancel: args.onCancel })} />
    </Till>
  ),
  play: async ({ args }) => {
    await settle()
    const body = within(dialog())
    await userEvent.click(body.getByRole('button', { name: /^Pay 1\.011,00\sRSD by card$/ }))
    await waitFor(() =>
      expect(body.getByRole('list', { name: 'Paid so far' })).toHaveTextContent('Approved'),
    )
    await userEvent.click(body.getByRole('button', { name: 'Cancel' }))
    await expect(dialog()).toHaveTextContent(
      /Cancelling reverses the approved payments: Card 1\.011,00\sRSD\./,
    )
    const keep = body.getByRole('button', { name: 'Keep paying' })
    await expect(keep).toHaveFocus()
    await userEvent.click(keep)
    await expect(args.onCancel).not.toHaveBeenCalled()
    await userEvent.click(body.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(body.getByRole('button', { name: 'Cancel payment' }))
    await expect(args.onCancel).toHaveBeenCalledOnce()
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull())
  },
}

/** A way chosen under "Other…" on a phone: its whole name, never broken inside a word. */
export const VoucherPhone: Story = {
  name: 'Voucher, phone width',
  render: (args) => (
    <PhoneFrame>
      <StoryProvider density="touch">
        <ExampleProvider>
          <PaymentDialog
            {...args}
            methods={PAYMENT_OPTIONS}
            defaultMethod="voucher"
            defaultTendered="500"
            defaultReference="VC-2026-7741"
            remaining="1011.00"
            onAddPart={() => undefined}
          />
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
  play: async () => {
    await settle()
    await expect(
      within(dialog()).getByRole('button', { name: /^Voucher/, expanded: false }),
    ).toBeVisible()
    await expectNoScroll()
  },
}
