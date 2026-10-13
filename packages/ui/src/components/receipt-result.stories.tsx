import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ReceiptResult } from './receipt-result'
import { DELIVERED, DELIVERIES, ISSUED_FACTS, RECEIPT_LINK } from './sale-story-data'
import { StoryCode } from './story-code'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

function Till({ children }: { children: ReactNode }) {
  return (
    <StoryProvider density="touch">
      <ExampleProvider>
        <div className="max-w-2xl p-4">{children}</div>
      </ExampleProvider>
    </StoryProvider>
  )
}

/** The receipt's code (a stand-in drawn from its link; the application draws the real one). */
const CODE = (
  <span className="flex text-primary">
    <StoryCode text={RECEIPT_LINK.href} label="Receipt code" />
  </span>
)

const meta = {
  title: 'Components/POS/ReceiptResult',
  component: ReceiptResult,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** what came back when a receipt was issued — the processor’s number and ' +
          'time, the counter, the receipt’s code and link — and how it reaches the customer: ' +
          'print, e-mail, a link by SMS, each with its state in words (sending, sent, failed). ' +
          'Offline, “waiting to be sent” in a neutral tone. Every fact and word is the ' +
          'application’s.\n\n' +
          '**When:** in the payment dialog’s done view; on an online order’s page (its receipt ' +
          'issued and delivered electronically); a receipt opened from the journal.\n\n' +
          '**When not:** the receipt as printed (ReceiptPreview); a list of receipts (the journal, ' +
          'a DataTable).',
      },
    },
  },
  args: {
    facts: ISSUED_FACTS,
    code: CODE,
    link: RECEIPT_LINK,
    deliveries: DELIVERIES,
    onDeliver: fn(),
  },
  render: (args) => (
    <Till>
      <ReceiptResult {...args} />
    </Till>
  ),
  play: settle,
} satisfies Meta<typeof ReceiptResult>

export default meta

type Story = StoryObj<typeof meta>

/** Issued: the facts, the code, the link and three ways to give it. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Receipt issued' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('2290/2318ПП')
    await expect(canvas.getByRole('img', { name: 'Receipt code' })).toBeVisible()
  },
}

/** After the cashier gave it: printed, e-mailed, the SMS failed with the application's words. */
export const Delivered: Story = {
  args: { deliveries: DELIVERED },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Sent to ana@example.com')
    await expect(canvasElement).toHaveTextContent('The SMS service did not answer')
  },
}

/** Sending: a spinner with the words. */
export const Sending: Story = {
  args: {
    deliveries: [
      {
        id: 'email',
        label: 'Send by e-mail',
        address: { label: 'Customer’s e-mail', type: 'email', defaultValue: 'ana@example.com' },
        state: 'sending',
      },
    ],
  },
}

/** Offline: kept on the till, waiting to be sent; no processor number yet. */
export const Waiting: Story = {
  render: () => (
    <Till>
      <ReceiptResult
        tone="waiting"
        text="The receipt is signed on this till and sent when the connection is back."
        facts={[
          { id: 'local', label: 'Local number', value: 'ZK-01-L-000031' },
          { id: 'time', label: 'Issued', value: '06.10.2026. 09:42:17' },
        ]}
        deliveries={[{ id: 'print', label: 'Print' }]}
        onDeliver={() => undefined}
      />
    </Till>
  ),
}

/** Long words wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    title: 'The receipt was issued and recorded by the processor of fiscal receipts',
    text: 'The customer asked for the receipt by e-mail and by SMS; the printed one stays in the shop’s copy book as the rules of the tenant ask.',
    facts: [
      ...ISSUED_FACTS,
      {
        id: 'long',
        label: 'A fact with a long label the application chose for its own reasons',
        value: 'ZK7Q2M4P-ZK7Q2M4P-ZK7Q2M4P-ZK7Q2M4P-2318',
      },
    ],
  },
}

/** On a phone: the code under the facts. */
export const Phone: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <StoryProvider density="touch">
        <ExampleProvider>
          <div className="p-4">
            <ReceiptResult {...args} />
          </div>
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
}

/** Arabic, right to left: numbers and the link stay left to right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" density="touch">
      <div className="max-w-2xl p-4">
        <ReceiptResult
          title="تم إصدار الإيصال"
          facts={[
            { id: 'n', label: 'رقم الإيصال', value: 'AE-2026-000412' },
            { id: 't', label: 'الوقت', value: '06.10.2026. 09:42' },
          ]}
          deliveries={[
            { id: 'p', label: 'طباعة', state: 'sent', stateText: 'تمت الطباعة' },
            {
              id: 'e',
              label: 'إرسال بالبريد',
              address: { label: 'البريد الإلكتروني', type: 'email' },
            },
          ]}
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja" density="touch">
      <div className="max-w-2xl p-4">
        <ReceiptResult
          title="レシートを発行しました"
          facts={[
            { id: 'n', label: 'レシート番号', value: 'JP-2026-000412' },
            { id: 't', label: '時刻', value: '2026/10/06 09:42' },
          ]}
          deliveries={[
            { id: 'p', label: '印刷' },
            {
              id: 's',
              label: 'SMSで送信',
              address: { label: '携帯電話番号', type: 'tel' },
              state: 'failed',
              stateText: '送信できませんでした',
            },
          ]}
        />
      </div>
    </StoryProvider>
  ),
}

/** Typing an e-mail and sending reports the way with the address; Print without one. */
export const Delivering: Story = {
  name: 'Delivering, interaction',
  tags: ['interaction'],
  play: async ({ args, canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Customer’s e-mail' }),
      'ana@example.com',
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Send by e-mail' }))
    await expect(args.onDeliver).toHaveBeenCalledWith('email', 'ana@example.com')
    await userEvent.click(canvas.getByRole('button', { name: 'Print' }))
    await expect(args.onDeliver).toHaveBeenLastCalledWith('print', null)
  },
}
