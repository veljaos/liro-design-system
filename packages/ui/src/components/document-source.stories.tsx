import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { DocumentSource, type DocumentSourceItem } from './document-source'
import { LONG } from './field-story-data'
import { StatusBadge } from './status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** F-2026-0410 as decrease KO-2026-0009 shows it (the application's values). */
const INVOICE: DocumentSourceItem = {
  key: 'f410',
  kind: 'Invoice',
  number: 'F-2026-0410',
  href: '#sales/invoices/F-2026-0410',
  date: '2026-09-25',
  total: { value: '186420.35', currency: 'RSD' },
  status: <StatusBadge label="Partially paid" tone="warning" />,
}

const meta = {
  title: 'Components/Documents/DocumentSource',
  component: DocumentSource,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the document a correcting or cancelling document refers to — a ' +
          'decrease, an increase, a cancellation document, a credit note, a return (P5.23). It ' +
          'is the most important fact of such a page, so it stands in DocumentPage’s header ' +
          '(`source`), beside the customer and at the same level: the label from the ' +
          'application ("Corrects", "Cancels"), then the source as a link with its kind and ' +
          'number, its state (a StatusBadge), its date and its total (through `format`).\n\n' +
          '**Both ways:** the source lists its correcting documents in its Related documents ' +
          'panel (`RelatedDocuments`), and where the correction changes its total, the totals ' +
          'row names the correction as a link.\n\n' +
          '**When:** every correcting or cancelling document.\n\n' +
          '**When not:** the documents a document is based on — proforma, advances, contract ' +
          '(`DocumentReferences`, the "Based on" line); a side panel list (`RelatedDocuments`).',
      },
    },
  },
  args: { label: 'Corrects', documents: [INVOICE] },
  render: (args) => (
    <ExampleProvider>
      <DocumentSource {...args} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof DocumentSource>

export default meta

type Story = StoryObj<typeof meta>

/** A decrease's source: "Corrects", the invoice's link, state, date and total. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('list', { name: 'Corrects' })).toBeVisible()
    await userEvent.tab()
    await expect(canvas.getByRole('link', { name: 'Invoice F-2026-0410' })).toHaveFocus()
    await expect(canvasElement).toHaveTextContent(/Issued 25\.09\.2026\..*Total 186\.420,35 RSD/)
    await expect(canvas.getByText('Partially paid')).toBeVisible()
  },
}

/** A cancellation document's source: the cancelled invoice. */
export const Cancels: Story = {
  args: {
    label: 'Cancels',
    documents: [
      {
        key: 'f407',
        kind: 'Invoice',
        number: 'F-2026-0407',
        href: '#sales/invoices/F-2026-0407',
        date: '2026-09-18',
        total: { value: '94500.00', currency: 'RSD' },
        status: <StatusBadge label="Cancelled" tone="neutral" />,
      },
    ],
  },
}

/** A rebate for a period corrects several invoices: one under the other. */
export const SeveralDocuments: Story = {
  name: 'Several documents',
  args: {
    label: 'Corrects',
    documents: [
      ['F-2026-0389', '2026-09-02', '101400.00'],
      ['F-2026-0397', '2026-09-12', '147960.00'],
      ['F-2026-0412', '2026-09-28', '185954.00'],
    ].map(([number = '', date = '', total = '']) => ({
      key: number,
      kind: 'Invoice',
      number,
      href: `#sales/invoices/${number}`,
      date,
      total: { value: total, currency: 'RSD' },
    })),
  },
}

/** Only the link: no date, total or state given. */
export const LinkOnly: Story = {
  name: 'Link only',
  args: {
    label: 'Returns',
    documents: [{ key: 'otp', kind: 'Delivery note', number: 'OTP-2026-0347', href: '#otp' }],
  },
}

/** Long text wraps. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    label: LONG.label,
    documents: [{ ...INVOICE, kind: LONG.value }],
  },
}

/** Phone width: the facts wrap under the link. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <ExampleProvider>
          <DocumentSource {...args} />
        </ExampleProvider>
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const block = canvasElement.querySelector('[data-slot="document-source"]')
    await expect(block).not.toBeNull()
    if (block !== null) await expect(block.scrollWidth).toBeLessThanOrEqual(block.clientWidth)
  },
}

/** Arabic label and kind in a right-to-left page; the number stays left to right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <DocumentSource
          label="يصحح"
          documents={[
            {
              ...INVOICE,
              kind: 'فاتورة',
              status: <StatusBadge label="مدفوعة جزئيًا" tone="warning" />,
            },
          ]}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese label and kind. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <DocumentSource
          label="訂正対象"
          documents={[
            {
              ...INVOICE,
              kind: '請求書',
              status: <StatusBadge label="一部入金" tone="warning" />,
            },
          ]}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}
