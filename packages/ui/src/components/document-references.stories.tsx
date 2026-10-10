import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { DocumentReferences } from './document-blocks'
import { REFERENCES } from './document-story-data'
import { ExampleProvider, expectContentDirection, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Documents/DocumentReferences',
  component: DocumentReferences,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the documents a document is based on, in one line of links between ' +
          'its header and its lines (P5.18): "Based on: Proforma PR-2026-031 · Advances ' +
          'A-2026-038, A-2026-044 · Contract 12/2026". Each kind and its numbers come from the ' +
          'application; every number is a link through the provider’s `linkComponent`.\n\n' +
          '**A reference shows its kind, number and state** (P4.9 rule 7): the state stands ' +
          'after the number as small text in its tone’s colour — the words carry it — and the ' +
          'link’s accessible name says all three ("Advance invoice A-2026-038, Paid"). The ' +
          'line wraps on narrow screens; a kind without numbers is left out.\n\n' +
          '**When:** a final invoice (proforma, advances, contract, order, delivery notes).\n\n' +
          '**When not:** the source of a correcting or cancelling document — it stands in the ' +
          'header beside the customer (`DocumentSource`, DocumentPage `source`; P5.23), never ' +
          'in this line; a side panel list of related documents with their badges ' +
          '(`RelatedDocuments`); a single link inside a sentence.',
      },
    },
  },
  args: { groups: REFERENCES },
  render: (args) => (
    <ExampleProvider>
      <DocumentReferences {...args} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof DocumentReferences>

export default meta

type Story = StoryObj<typeof meta>

/** A final invoice's references: proforma, two advances, contract. Tab reaches each link. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Based on:')).toBeVisible()
    await userEvent.tab()
    await expect(canvas.getByRole('link', { name: 'Proforma PR-2026-031, Accepted' })).toHaveFocus()
    await userEvent.tab()
    await expect(
      canvas.getByRole('link', { name: 'Advance invoice A-2026-038, Paid' }),
    ).toHaveFocus()
    await expect(canvas.getByRole('link', { name: /A-2026-044/ })).toHaveAttribute(
      'href',
      '#sales/invoices/A-2026-044',
    )
  },
}

/** Without states: numbers only. */
export const WithoutStates: Story = {
  name: 'Without states',
  args: {
    groups: REFERENCES.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ key: item.key, number: item.number, href: item.href })),
    })),
  },
}

/** Many references: delivery notes and orders wrap onto the next line. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    groups: [
      ...REFERENCES,
      {
        key: 'orders',
        label: 'Purchase orders of the customer',
        kind: 'Purchase order',
        items: ['NAR-2026-1187', 'NAR-2026-1203', 'NAR-2026-1249'].map((number) => ({
          key: number,
          number,
          href: `#purchasing/orders/${number}`,
        })),
      },
      {
        key: 'notes',
        label: 'Delivery notes',
        kind: 'Delivery note',
        items: Array.from({ length: 6 }, (_, index) => {
          const number = `OTP-2026-${String(388 + index * 3).padStart(4, '0')}`
          return {
            key: number,
            number,
            href: `#sales/deliveries/${number}`,
            status: { label: 'Delivered', tone: 'success' as const },
          }
        }),
      },
    ],
  },
}

/** Phone width: the line wraps, every link stays a 24px-high target in the text. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <ExampleProvider>
          <DocumentReferences {...args} />
        </ExampleProvider>
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const frame = canvasElement.querySelector('[data-slot="document-references"]')
    await expect(frame).not.toBeNull()
    if (frame !== null) await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth)
  },
}

/** Arabic kinds and states in a right-to-left page; the numbers stay left to right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <DocumentReferences
          label="بناءً على"
          groups={[
            {
              key: 'p',
              label: 'فاتورة مبدئية',
              items: [{ key: 'p', number: 'PR-2026-031', href: '#p' }],
            },
            {
              key: 'a',
              label: 'دفعات مقدمة',
              items: [
                {
                  key: 'a',
                  number: 'A-2026-038',
                  href: '#a',
                  status: { label: 'مدفوعة', tone: 'success' },
                },
              ],
            },
          ]}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese kinds. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <DocumentReferences
          label="参照"
          groups={[
            {
              key: 'p',
              label: '見積書',
              items: [{ key: 'p', number: 'PR-2026-031', href: '#p' }],
            },
            {
              key: 'c',
              label: '契約',
              items: [{ key: 'c', number: '12/2026', href: '#c', status: { label: '有効' } }],
            },
          ]}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** English in a right-to-left page: the lead and the kinds keep their reading order. */
export const EnglishInRtl: Story = {
  name: 'English in RTL',
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <DocumentReferences {...args} />
      </ExampleProvider>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expectContentDirection(canvas.getByText('Based on:'), canvas.getByText('Advances'))
  },
}
