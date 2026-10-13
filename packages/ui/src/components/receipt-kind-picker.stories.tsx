import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ReceiptKindPicker } from './receipt-kind-picker'
import { RECEIPT_TYPES, TRANSACTIONS } from './sale-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

function Till({ children }: { children: ReactNode }) {
  return (
    <StoryProvider density="touch">
      <ExampleProvider>
        <div className="max-w-xl p-4">{children}</div>
      </ExampleProvider>
    </StoryProvider>
  )
}

const meta = {
  title: 'Components/POS/ReceiptKindPicker',
  component: ReceiptKindPicker,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** choosing the kind of a receipt as two choices the application offers — ' +
          'its type (in Serbia: Normal, Advance, Proforma, Copy, Training) and its transaction ' +
          '(Sale, Refund). A kind that is not a real sale shows the application’s marker ' +
          '(“Proforma — this is not a fiscal receipt”), which the cart and the printed receipt ' +
          'repeat. Every kind, word and rule is the application’s data (illustrative here).\n\n' +
          '**When:** at the till, in a dialog opened from the cart (“Receipt kind”), before ' +
          'charging.\n\n' +
          '**When not:** choosing a document type in the back office (a SelectField); a refund ' +
          'of a known receipt (ReceiptFinder then LineQuantityPicker).',
      },
    },
  },
  args: { types: RECEIPT_TYPES, transactions: TRANSACTIONS, onChange: fn() },
  render: (args) => (
    <Till>
      <ReceiptKindPicker {...args} />
    </Till>
  ),
  play: settle,
} satisfies Meta<typeof ReceiptKindPicker>

export default meta

type Story = StoryObj<typeof meta>

/** Normal sale, the default; Copy cannot be chosen here and says why. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Normal' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getByRole('button', { name: 'Copy' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await expect(canvas.getByRole('button', { name: 'Copy' })).toHaveAccessibleDescription(
      'Copy: open the receipt in the journal to copy it.',
    )
  },
}

/** Proforma: the marker in a warning Alert. */
export const Proforma: Story = {
  args: { defaultType: 'proforma' },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent(
      'Proforma — this is not a fiscal receipt',
    )
  },
}

/** Training. */
export const Training: Story = { args: { defaultType: 'training' } }

/** Refund of a normal sale: the transaction's description. */
export const Refund: Story = {
  args: { defaultTransaction: 'refund' },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('its number and time are carried over')
  },
}

/** Long words wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    typeLabel: 'The type of the receipt as the fiscal processor will record it',
    types: [
      ...RECEIPT_TYPES,
      {
        id: 'long',
        label: 'Normal sale with a long name that a tenant chose for its own reasons',
        description:
          'A description that runs over several lines to show that it wraps at the width of the dialog and never scrolls sideways.',
        marker:
          'This kind is not a fiscal receipt and the customer must be told so before anything is printed for them',
      },
    ],
    defaultType: 'long',
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
            <ReceiptKindPicker {...args} defaultType="proforma" />
          </div>
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
}

/** Arabic, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" density="touch">
      <div className="max-w-xl p-4">
        <ReceiptKindPicker
          typeLabel="نوع الإيصال"
          transactionLabel="المعاملة"
          types={[
            { id: 'n', label: 'عادي' },
            { id: 'p', label: 'فاتورة مبدئية', marker: 'هذا ليس إيصالاً ضريبياً' },
            { id: 't', label: 'تدريب', marker: 'تدريب — هذا ليس إيصالاً ضريبياً' },
          ]}
          transactions={[
            { id: 's', label: 'بيع' },
            { id: 'r', label: 'استرداد' },
          ]}
          defaultType="p"
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja" density="touch">
      <div className="max-w-xl p-4">
        <ReceiptKindPicker
          typeLabel="レシートの種類"
          transactionLabel="取引"
          types={[
            { id: 'n', label: '通常' },
            { id: 'a', label: '前受金' },
            { id: 't', label: '練習', marker: '練習用 — 正式なレシートではありません' },
          ]}
          transactions={[
            { id: 's', label: '販売' },
            { id: 'r', label: '返金' },
          ]}
          defaultType="t"
        />
      </div>
    </StoryProvider>
  ),
}

/** Choosing Proforma, then Refund, reports each pair; a press on Copy does nothing. */
export const Choosing: Story = {
  name: 'Choosing, interaction',
  tags: ['interaction'],
  play: async ({ args, canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Proforma' }))
    await expect(args.onChange).toHaveBeenLastCalledWith('proforma', 'sale')
    await userEvent.click(canvas.getByRole('button', { name: 'Refund' }))
    await expect(args.onChange).toHaveBeenLastCalledWith('proforma', 'refund')
    await userEvent.click(canvas.getByRole('button', { name: 'Copy' }))
    await expect(args.onChange).toHaveBeenCalledTimes(2)
  },
}
