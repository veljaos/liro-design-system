import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { QrCode } from '../components/qr-code'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { PaymentOrderForm, type PaymentOrderFormProps } from './payment-order'
import {
  EMPTY_PAYMENT,
  orderFormProps,
  orderQrText,
  PAYMENT,
  TRANSFER,
  WITHDRAWAL,
  type OrderData,
} from './payment-order-story-data'
import { PrintPage } from './print-page'

const MARGINS = { top: '10mm', bottom: '10mm', start: '10mm', end: '10mm' }

/** An order's form with its IPS QR code (forms 1 and 3). */
function formOf(order: OrderData): PaymentOrderFormProps {
  const text = orderQrText(order)
  return orderFormProps(
    order,
    text === null ? undefined : (
      <QrCode value={text} label="IPS QR code for the payment" size="fill" />
    ),
  )
}

/** The slip at the top of an A4 sheet, as it is printed. */
function Sheet({ forms, title }: { forms: PaymentOrderFormProps[]; title: string }) {
  return (
    <PrintPage title={title} margins={MARGINS} pageNumbers={false} fit="width">
      <div className="flex flex-col gap-[8mm]">
        {forms.map((form, index) => (
          <PaymentOrderForm key={index} {...form} />
        ))}
      </div>
    </PrintPage>
  )
}

const meta = {
  title: 'Templates/PaymentOrderForm',
  component: PaymentOrderForm,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**What for:** a bank’s paper payment order as its real form — in Serbia the payment ' +
          'order (nalog za uplatu, form 1), the withdrawal order (nalog za isplatu, form 2) and ' +
          'the transfer order (nalog za prenos, form 3): to print, hand over or attach. The ' +
          'parties at the start (payer, purpose, payee) with the lines to sign; at the end the ' +
          'title, the payment code, currency and amount, then each account with its model and ' +
          'reference number; "Urgent" on a transfer. An official form is its real grid (D28): ' +
          'boxes and rules, black on white in both themes.\n\n' +
          '**Every word is the application’s** (the official forms are in Serbian, `lang`); the ' +
          'amount is a decimal string written through `format`. **The IPS QR code** (`qrCode`: ' +
          'QrCode with `ipsQrText`) on forms 1 and 3 — a payment into an account; a withdrawal ' +
          'pays out cash and has none. Inside PrintPage it prints as it shows; on a phone the ' +
          'sheet is scaled to the width.\n\n' +
          '**When not:** an invoice’s payment details (PrintDocument’s payment block and QR ' +
          'slot); a transfer the application sends itself (a form of fields).',
      },
    },
  },
  args: formOf(TRANSFER),
  render: () => (
    <ExampleProvider>
      <Sheet title="Nalog za prenos" forms={[formOf(TRANSFER)]} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof PaymentOrderForm>

export default meta

type Story = StoryObj<typeof meta>

/** Form 3: Kvadrat Gradnja pays Beton Mix's invoice 2026-1187, with the IPS QR code. */
export const Transfer: Story = {
  name: 'Transfer order (form 3)',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const form = canvas.getByRole('region', { name: 'NALOG ZA PRENOS' })
    await expect(form).toHaveAttribute('lang', 'sr-Latn')
    await expect(within(form).getByText('294.000,00')).toBeVisible()
    await expect(within(form).getByText('265-0000000654321-33')).toBeVisible()
    await expect(within(form).getByRole('checkbox', { name: 'hitno' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    await expect(
      within(form).getByRole('img', { name: 'IPS QR code for the payment' }),
    ).toBeVisible()
  },
}

/** Form 1: a customer pays Kvadrat Gradnja's invoice F-2026-0412, with the IPS QR code. */
export const Payment: Story = {
  name: 'Payment order (form 1)',
  render: () => (
    <ExampleProvider>
      <Sheet title="Nalog za uplatu" forms={[formOf(PAYMENT)]} />
    </ExampleProvider>
  ),
}

/** Form 2: cash withdrawn for the site's petty cash; a withdrawal has no QR code. */
export const Withdrawal: Story = {
  name: 'Withdrawal order (form 2)',
  render: () => (
    <ExampleProvider>
      <Sheet title="Nalog za isplatu" forms={[formOf(WITHDRAWAL)]} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('[data-slot="payment-order-code"]')).toBeNull()
  },
}

/** Three orders on one A4 sheet, as they are printed and cut. */
export const ThreeOnASheet: Story = {
  name: 'Three on one sheet',
  render: () => (
    <ExampleProvider>
      <Sheet
        title="Nalozi"
        forms={[
          formOf(PAYMENT),
          formOf(WITHDRAWAL),
          { ...formOf(TRANSFER), urgent: { label: 'hitno', checked: true } },
        ]}
      />
    </ExampleProvider>
  ),
}

/** An empty form 1, to be filled in by hand: the boxes keep their height. */
export const Empty: Story = {
  name: 'Empty, to fill in by hand',
  render: () => (
    <ExampleProvider>
      <Sheet title="Nalog za uplatu" forms={[orderFormProps(EMPTY_PAYMENT)]} />
    </ExampleProvider>
  ),
}

/** Long names: three lines in a party's box, the purpose on two. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <Sheet
        title="Nalog za prenos"
        forms={[
          formOf({
            ...TRANSFER,
            payer:
              'Kvadrat Gradnja d.o.o. za građevinarstvo i inženjering\nBulevar oslobođenja 12\n21000 Novi Sad',
            purpose: 'Plaćanje po računu 2026-1187 i 2026-1188',
          }),
        ]}
      />
    </ExampleProvider>
  ),
}

/** On a phone the A4 sheet is scaled to the width; the page never scrolls sideways. */
export const Phone: Story = {
  name: 'Phone',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Sheet title="Nalog za prenos" forms={[formOf(TRANSFER)]} />
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="print-page"]')
    if (page === null) throw new Error('no page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  },
}

/** Arabic labels, right to left: the halves mirror; accounts and amounts stay left to right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <Sheet
        title="أمر تحويل"
        forms={[
          {
            ...formOf(TRANSFER),
            title: 'أمر تحويل',
            lang: 'ar',
            parties: [
              { label: 'المدين', value: 'شركة كفادرات للبناء\nنوفي ساد' },
              { label: 'الغرض من الدفع', value: 'دفع الفاتورة 2026-1187', lines: 2 },
              { label: 'الدائن', value: 'شركة بيتون ميكس\nنوفي ساد' },
            ],
            signatures: ['الختم والتوقيع', 'مكان وتاريخ الاستلام', 'تاريخ التنفيذ'],
          },
        ]}
      />
    </StoryProvider>
  ),
}

/** Japanese labels. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <Sheet
        title="振込依頼書"
        forms={[
          {
            ...formOf(TRANSFER),
            title: '振込依頼書',
            lang: 'ja',
            parties: [
              { label: '依頼人', value: 'クヴァドラト建設株式会社\nノヴィ・サド' },
              { label: '支払目的', value: '請求書 2026-1187 の支払い', lines: 2 },
              { label: '受取人', value: 'ベトン・ミックス株式会社\nノヴィ・サド' },
            ],
            signatures: ['印鑑と署名', '受付場所と日付', '実行日'],
          },
        ]}
      />
    </StoryProvider>
  ),
}
