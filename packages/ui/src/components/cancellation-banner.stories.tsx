import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { CancellationBanner } from './document-blocks'
import { LONG } from './field-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Documents/CancellationBanner',
  component: CancellationBanner,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the marker of a cancelled document (P5.18), at the top of its page ' +
          '(DocumentPage `banner`): the title "Cancelled", then "by Milica Petrović on ' +
          '06.10.2026. at 11:20. Reason: …", then the link "Cancellation document ' +
          'ST-2026-0004" — the word said once (P5.23). Who and the reason are the ' +
          'application’s; the date and time are written by the provider’s `format` in the ' +
          'tenant’s time; the cancellation document is a link (the cancellation document links ' +
          'back with `DocumentReferences` "Cancels"). Danger by default — the tone of the ' +
          '"Cancelled" badge in the application’s status map (P5.23, owner) — with the Ban ' +
          'icon, announced politely (`role="status"`: a state, not an interruption); ' +
          '`tone="neutral"` only where the application’s map says so. The marker on the PDF is ' +
          'the Core’s.\n\n' +
          '**When:** after the cancellation (an `IrreversibleConfirmDialog` with `reason`).\n\n' +
          '**When not:** a draft that was discarded (it is deleted, not cancelled); a document ' +
          'corrected by a decrease or increase (DocumentReferences "Corrected by").',
      },
    },
  },
  args: {
    by: 'Milica Petrović',
    at: '2026-10-06T11:20:00+02:00',
    reason: 'The September price list was not applied; the goods will be invoiced again.',
    document: {
      kind: 'Cancellation document',
      number: 'ST-2026-0004',
      href: '#sales/invoices/ST-2026-0004',
    },
  },
  render: (args) => (
    <ExampleProvider>
      <CancellationBanner {...args} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof CancellationBanner>

export default meta

type Story = StoryObj<typeof meta>

/** Who, when, why, and the link to the cancellation document. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const banner = canvas.getByRole('status')
    await expect(banner).toHaveTextContent('Cancelled by Milica Petrović on 06.10.2026. at 11:20.')
    await expect(banner).not.toHaveTextContent('Cancelled Cancelled')
    await expect(banner).toHaveAttribute('data-tone', 'danger')
    await expect(
      canvas.getByRole('link', { name: 'Cancellation document ST-2026-0004' }),
    ).toHaveAttribute('href', '#sales/invoices/ST-2026-0004')
  },
}

/** The neutral tone, where the application's status map makes Cancelled neutral, and an own title. */
export const Neutral: Story = {
  args: { tone: 'neutral', title: 'This invoice is cancelled' },
}

/** Without a cancellation document (the Core has not issued it yet). */
export const WithoutDocument: Story = {
  name: 'Without a document',
  render: (args) => (
    <ExampleProvider>
      <CancellationBanner by={args.by} at={args.at} reason={args.reason} />
    </ExampleProvider>
  ),
}

/** A long reason wraps. */
export const LongText: Story = {
  name: 'Long text',
  args: { reason: `${LONG.error} ${LONG.description}` },
}

/** Phone width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <ExampleProvider>
          <CancellationBanner {...args} />
        </ExampleProvider>
      </div>
    </PhoneFrame>
  ),
}

/** Arabic name and reason in a right-to-left page. */
export const Arabic: Story = {
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <CancellationBanner {...args} by="سارة أحمد" reason="أسعار خاطئة." />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese name and reason. */
export const Japanese: Story = {
  render: (args) => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <CancellationBanner {...args} by="佐藤 花子" reason="価格の誤り。" />
      </ExampleProvider>
    </StoryProvider>
  ),
}
