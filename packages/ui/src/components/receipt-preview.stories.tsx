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
  RECEIPT_END,
} from './pos-story-data'
import {
  FISCAL_BANNER,
  FISCAL_END,
  ISSUED_FACTS,
  NOT_FISCAL,
  RECEIPT_LINK,
  TAX_RECAP,
} from './sale-story-data'
import { StoryCode } from './story-code'
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
          '(CartPanel).\n\n' +
          '**P5.28:** the printed parts of a fiscal receipt, every word the application’s: a ' +
          'banner and an end line between double rules, the kind between dashed rules, a marker ' +
          'printed boxed at the top and the bottom of a receipt that is not a real sale, the tax ' +
          'per label as a table, the processor’s facts after it and a signature line where the ' +
          'rules ask for one.',
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
    end: RECEIPT_END,
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

/** The fiscal receipt's code (a stand-in drawn from its link). */
const FISCAL_CODE = (
  <span className="flex text-primary">
    <StoryCode text={RECEIPT_LINK.href} label="Fiscal receipt code" size={128} />
  </span>
)

const FISCAL = {
  banner: FISCAL_BANNER,
  end: FISCAL_END,
  kindLine: 'NORMAL SALE',
  recap: TAX_RECAP,
  issuedFacts: ISSUED_FACTS,
  code: FISCAL_CODE,
  totals: [{ id: 'total', label: 'Total', value: '1011.00', strong: true }],
}

/** A fiscal receipt: banner, kind, items, payments, the tax per label, the processor's facts. */
export const Fiscal: Story = {
  name: 'Fiscal receipt',
  args: FISCAL,
  play: async ({ canvasElement }) => {
    await settle()
    const receipt = within(canvasElement).getByRole('article', { name: 'Receipt' })
    await expect(receipt).toHaveTextContent('NORMAL SALE')
    await expect(within(receipt).getByRole('columnheader', { name: 'Rate' })).toBeVisible()
    await expect(receipt).toHaveTextContent('2290/2318ПП')
  },
}

/** A proforma: the marker printed boxed under the facts and again at the bottom. */
export const NotFiscal: Story = {
  name: 'Not a fiscal receipt',
  render: (args) => (
    <Shop>
      <ReceiptPreview
        header={args.header ?? []}
        facts={args.facts ?? []}
        items={args.items}
        totals={FISCAL.totals}
        recap={TAX_RECAP}
        currency={CURRENCY}
        kindLine="PROFORMA SALE"
        marker={NOT_FISCAL}
        footer={['The offer is valid until 13.10.2026.']}
      />
    </Shop>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelectorAll('[data-slot="receipt-marker"]')).toHaveLength(2)
  },
}

/** A refund: the original's number and time carried over, the buyer's signature line. */
export const Refund: Story = {
  args: {
    ...FISCAL,
    kindLine: 'NORMAL REFUND',
    facts: [
      ...RECEIPT_FACTS,
      { id: 'ref', label: 'Original receipt', value: 'ZK7Q2M4P-ZK7Q2M4P-2318' },
      { id: 'reftime', label: 'Original time', value: '06.10.2026. 09:42:17' },
      { id: 'buyer', label: 'Buyer ID', value: '10:100000017' },
    ],
    items: [
      { id: 'r1', name: 'Kifla 60 g (Đ)', quantity: '-2', unitPrice: '25.00', total: '-50.00' },
      {
        id: 'r2',
        name: 'Burek sa mesom 250 g (Đ)',
        quantity: '-1',
        unitPrice: '190.00',
        total: '-190.00',
      },
    ],
    totals: [{ id: 'total', label: 'Refund total', value: '-240.00', strong: true }],
    payments: [{ id: 'cash', label: 'Cash paid out', value: '240.00' }],
    recap: {
      ...TAX_RECAP,
      rows: [{ id: 'd', cells: { label: 'Đ', name: 'VAT', rate: '20,00%', tax: '-40.00' } }],
      totals: [{ id: 'all', label: 'Total tax', value: '-40.00' }],
    },
    signature: 'Buyer’s signature',
  },
}
