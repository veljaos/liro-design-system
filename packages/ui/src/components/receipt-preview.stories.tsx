import type { Meta, StoryObj } from '@storybook/react-vite'
import { QrCode } from 'lucide-react'
import type { ReactNode } from 'react'
import { expect, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import {
  CURRENCY,
  RECEIPT_FACTS,
  RECEIPT_FOOTER,
  RECEIPT_HEADER,
  RECEIPT_ITEMS,
  RECEIPT_PAYMENTS,
  RECEIPT_TOTALS,
} from './pos-story-data'
import { ReceiptPreview } from './receipt-preview'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

function Shop({ children }: { children: ReactNode }) {
  return (
    <ExampleProvider>
      <div className="flex justify-start">{children}</div>
    </ExampleProvider>
  )
}

/** The fiscal QR code the application draws (an icon stands in for its image here). */
const CODE = (
  <QrCode role="img" aria-label="Fiscal verification code" className="size-24 text-primary" />
)

const meta = {
  title: 'Components/POS/ReceiptPreview',
  component: ReceiptPreview,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a till receipt as the printer gives it, on screen and for print: 58mm or ' +
          '80mm wide, the shop’s lines centred, the receipt’s facts, the items (“2 × 190,00” under ' +
          'the name, the amount at the end), totals, payments, the fiscal footer and code — all ' +
          'from the application; every amount through the provider’s format, never rounded, with ' +
          'tabular digits.\n\n' +
          '**When:** before printing or sending a receipt, a copy of a past sale.\n\n' +
          '**When not:** an A4 document (the print templates of P5.15); a cart being sold ' +
          '(CartPanel).',
      },
    },
  },
  args: {
    header: RECEIPT_HEADER,
    facts: RECEIPT_FACTS,
    items: RECEIPT_ITEMS,
    totals: RECEIPT_TOTALS,
    payments: RECEIPT_PAYMENTS,
    footer: RECEIPT_FOOTER,
    currency: CURRENCY,
    code: CODE,
  },
  render: (args) => (
    <Shop>
      <ReceiptPreview {...args} />
    </Shop>
  ),
  play: settle,
} satisfies Meta<typeof ReceiptPreview>

export default meta

type Story = StoryObj<typeof meta>

/** 80mm paper, the default. */
export const Default: Story = {
  name: '80 mm',
  play: async ({ canvasElement }) => {
    await settle()
    const receipt = within(canvasElement).getByRole('article', { name: 'Receipt' })
    await expect(receipt).toHaveTextContent('2 × 190,00')
    await expect(receipt).toHaveTextContent('1.011,00')
  },
}

/** 58mm paper: smaller text. */
export const Narrow: Story = {
  name: '58 mm',
  args: { paper: '58mm' },
}

/** Only the items and the total: no facts, payments, footer or code. */
export const Minimal: Story = {
  args: { facts: [], payments: [], footer: [] },
  render: (args) => (
    <Shop>
      <ReceiptPreview
        header={args.header ?? []}
        items={args.items}
        totals={args.totals ?? []}
        label="Copy of receipt ZK-02-000412"
      />
    </Shop>
  ),
}

/** Long names and words wrap inside the paper's width. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    header: [
      'Pekara i poslastičarnica Zlatni klas — porodična radnja od 1987.',
      'Bulevar oslobođenja 46, lokal 3, 21000 Novi Sad, Srbija',
    ],
    items: [
      {
        id: 'l1',
        name: 'Integralni hleb sa semenkama suncokreta, lana, susama i bundeve (Đ)',
        quantity: '12.375',
        unit: 'kg',
        unitPrice: '1234.50',
        total: '15276.9375',
        note: 'Price per kilogram, weighed at the counter at 09:41',
      },
      ...RECEIPT_ITEMS.slice(0, 2),
    ],
  },
}

/** On a phone. */
export const Phone: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="box-border flex h-full justify-center overflow-y-auto p-4">
          <ReceiptPreview {...args} />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ReceiptPreview
        header={['مخبز السنبلة الذهبية', 'شارع الحرية 46']}
        facts={[{ id: 'n', label: 'رقم الإيصال', value: '000412' }]}
        items={[
          { id: 'a1', name: 'خبز أبيض', quantity: '2', unitPrice: '6.50', total: '13.00' },
          {
            id: 'a2',
            name: 'كرواسون بالشوكولاتة',
            quantity: '1',
            unitPrice: '18.50',
            total: '18.50',
          },
        ]}
        totals={[{ id: 't', label: 'المجموع', value: '31.50', strong: true }]}
        payments={[{ id: 'c', label: 'نقدًا', value: '50.00' }]}
        footer={['شكرًا لزيارتكم']}
        currency="د.إ"
      />
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ReceiptPreview
        paper="58mm"
        header={['ベーカリー黄金の穂', '東京都新宿区1-2-3']}
        items={[
          { id: 'j1', name: '食パン', quantity: '1', unitPrice: '320', total: '320' },
          { id: 'j2', name: 'メロンパン', quantity: '2', unitPrice: '250', total: '500' },
        ]}
        totals={[{ id: 't', label: '合計', value: '820', strong: true }]}
        footer={['ありがとうございました']}
        currency="¥"
      />
    </StoryProvider>
  ),
}
