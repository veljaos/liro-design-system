import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import { ipsQrText } from './ips-qr'
import { QrCode } from './qr-code'
import { BAKERY_PAYEE, instantPaymentCode } from './sale-story-data'
import { PhoneFrame, StoryProvider } from './story-frames'

/** Beton Mix's invoice 2026-1187, paid by Kvadrat Gradnja (an IPS QR code of a printed bill). */
const BILL = ipsQrText({
  payeeAccount: '265-0000000654321-33',
  payeeName: 'Beton Mix d.o.o., Novi Sad',
  amount: '294000.00',
  payerName: 'Kvadrat Gradnja d.o.o.',
  paymentCode: '221',
  purpose: 'Plaćanje po računu 2026-1187',
  model: '97',
  reference: '3520261187',
}).text

const meta = {
  title: 'Components/Display/QrCode',
  component: QrCode,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a QR code drawn from a text — the IPS instant-payment code of a bill, ' +
          'an invoice or a till (`ipsQrText`), a link to a record, a pairing code. Encoded in ' +
          'the browser (`qr` 0.7.2, MIT) and drawn as one SVG path: sharp at any size and on ' +
          'paper. Dark on light in both themes (a camera reads it), with its quiet zone, named ' +
          '(`label`). `size` in px, or `fill` for a printout’s slot.\n\n' +
          '**When:** whatever a phone should read from the screen or from paper.\n\n' +
          '**When not:** a picture the application already made (pass it to the slot); a code ' +
          'that only decorates.',
      },
    },
  },
  args: { value: BILL ?? '', label: 'IPS QR code for the payment' },
  play: settle,
} satisfies Meta<typeof QrCode>

export default meta

type Story = StoryObj<typeof meta>

/** A printed bill's IPS QR code (kind PR) with the text it holds beside it. */
export const IpsBill: Story = {
  name: 'IPS QR code of a bill',
  render: (args) => (
    <div className="flex max-w-180 flex-wrap items-start gap-4">
      <QrCode {...args} />
      <code
        dir="ltr"
        className="block max-w-90 min-w-0 rounded-md bg-surface-sunken p-3 font-mono text-xs break-all whitespace-pre-wrap text-primary"
      >
        {args.value}
      </code>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('img', { name: 'IPS QR code for the payment' })).toBeVisible()
    await expect(canvasElement.querySelector('[data-liro-theme="light"]')).not.toBeNull()
  },
}

/** A till's instant payment code (kind PT): shown large to the customer. */
export const InstantPayment: Story = {
  name: 'Instant payment at a till',
  args: {
    value: instantPaymentCode(BAKERY_PAYEE, '1011.00', '20261014000412'),
    label: 'IPS QR code for the payment',
    size: 224,
  },
}

/** Sizes: a link at 96, 160 (default) and 240 px; the quiet zone grows with them. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      {[96, 160, 240].map((size) => (
        <QrCode
          key={size}
          value="https://example.com/receipts/ZK7Q2M4P-2318"
          label={`Receipt link, ${String(size)} px`}
          size={size}
        />
      ))}
    </div>
  ),
}

/** A text longer than any QR code holds: the message in its place, never a broken code. */
export const TooLong: Story = {
  name: 'Too long',
  args: { value: 'x'.repeat(8000), label: 'Export file' },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('img', { name: 'Export file' })).toHaveTextContent(
      'The text is too long for a QR code.',
    )
  },
}

/** On a phone: the code at the width the screen allows. */
export const Phone: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <div className="flex flex-col items-center gap-3 p-4">
        <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
          Scan with your bank’s app to pay 294.000,00 RSD.
        </p>
        <QrCode {...args} size={240} />
      </div>
    </PhoneFrame>
  ),
}

/** Arabic, right to left: the code is never mirrored; its name follows the page. */
export const Arabic: Story = {
  render: (args) => (
    <StoryProvider locale="ar">
      <div className="flex items-center gap-3">
        <QrCode {...args} label="رمز الدفع" />
        <p className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>امسح الرمز للدفع.</p>
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: (args) => (
    <StoryProvider locale="ja">
      <div className="flex items-center gap-3">
        <QrCode {...args} label="支払いコード" />
        <p className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>
          銀行アプリでコードを読み取ってください。
        </p>
      </div>
    </StoryProvider>
  ),
}
