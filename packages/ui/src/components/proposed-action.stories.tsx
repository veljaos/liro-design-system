import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ProposedAction } from './proposed-action'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const noop: () => void = () => undefined

const DETAILS = [
  { label: 'Supplier', value: 'Beton Mix d.o.o.' },
  { label: 'Invoice', value: '2026-1187 of 12.10.2026.', numeric: true },
  { label: 'Total', value: '294.000,00 RSD', numeric: true },
  { label: 'Account', value: '5120 Material for construction' },
]

const meta = {
  title: 'Components/Assistant/ProposedAction',
  component: ProposedAction,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** an action an assistant proposes — post a document, send a reminder — ' +
          'as a card that always waits for the user: what would be done (the application’s ' +
          'title, line and facts), "Nothing is done until you confirm.", Dismiss, then Confirm. ' +
          'Only Confirm runs it, through the application’s `onConfirm` (a promise shows ' +
          '"Working…"); then the outcome in the application’s words, or "Dismissed. Nothing ' +
          'was done.". An action the user may not run says why and keeps Confirm disabled.\n\n' +
          '**When to use:** under an AssistantAnswer that proposes something. **When not:** ' +
          'the user’s own action on a page (Button, ActionGroup); a confirmation of something ' +
          'the user started (ConfirmDialog).',
      },
    },
  },
  args: {
    title: 'Post invoice 2026-1187 from Beton Mix d.o.o.',
    description: 'The invoice goes to the purchase ledger and waits for payment on 11.11.2026.',
    details: DETAILS,
    onConfirm: noop,
    onDismiss: noop,
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-[408px]">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof ProposedAction>

export default meta

type Story = StoryObj<typeof meta>

/** Proposed: the facts, the note that it waits, Dismiss then Confirm. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvasElement).toHaveTextContent('Nothing is done until you confirm.')
    await expect(canvas.getByRole('button', { name: 'Confirm' })).toBeEnabled()
  },
}

/** Running: both buttons wait, "Working…". */
export const Running: Story = {
  args: { state: 'running' },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('button', { name: 'Confirm' })).toBeDisabled()
  },
}

/** Done: the application's outcome with a link to the result. */
export const Done: Story = {
  args: {
    state: 'done',
    result: (
      <>
        Posted as{' '}
        <a href="#/accounting/entries/2026-0884" className="text-link">
          entry 2026-0884
        </a>
        .
      </>
    ),
  },
}

/** Dismissed: nothing was done. */
export const Dismissed: Story = {
  args: { state: 'dismissed' },
}

/** Failed: the application's words; Confirm can be pressed again. */
export const Failed: Story = {
  name: 'Error',
  args: {
    state: 'failed',
    error: 'The invoice could not be posted: September 2026 is closed for posting.',
  },
}

/** The user may not run it: the reason in words, Confirm disabled. */
export const Unavailable: Story = {
  name: 'Disabled with reason',
  args: {
    unavailableReason: 'Only the accountant can post supplier invoices. Ask Snežana Jelić.',
  },
}

/** Long words wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    title:
      'Send a payment reminder for invoices F-2026-0371 and F-2026-0390 to Stanogradnja Plus d.o.o., Bulevar oslobođenja 112, Novi Sad, with the statement of open items attached',
    confirmLabel: 'Send the reminder',
    dismissLabel: 'Not now',
  },
}

/** Phone width. */
export const Phone: Story = {
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="p-4">
            <Story />
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic. */
export const Arabic: Story = {
  args: {
    title: 'ترحيل الفاتورة 2026-1187 من Beton Mix d.o.o.',
    description: 'تُسجّل الفاتورة في دفتر المشتريات.',
    details: [
      { label: 'المورد', value: 'Beton Mix d.o.o.' },
      { label: 'المجموع', value: '294.000,00 RSD', numeric: true },
    ],
    confirmLabel: 'تأكيد',
    dismissLabel: 'تجاهل',
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <div className="max-w-[408px]">
            <Story />
          </div>
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Japanese. */
export const Japanese: Story = {
  args: {
    title: 'Beton Mix d.o.o. の請求書 2026-1187 を計上する',
    description: '請求書は仕入帳に記録されます。',
    details: [
      { label: '仕入先', value: 'Beton Mix d.o.o.' },
      { label: '合計', value: '294.000,00 RSD', numeric: true },
    ],
    confirmLabel: '確認',
    dismissLabel: '却下',
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <div className="max-w-[408px]">
            <Story />
          </div>
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Confirm runs the application's promise: "Working…", then the outcome. */
export const ConfirmInteraction: Story = {
  name: 'Confirm, interaction',
  tags: ['interaction'],
  args: {
    onConfirm: () => Promise.resolve(),
    result: 'Posted as entry 2026-0884.',
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }))
    await expect(await canvas.findByRole('status')).toHaveTextContent('Posted as entry 2026-0884.')
    await expect(canvas.queryByRole('button', { name: 'Confirm' })).toBeNull()
  },
}

/** Dismiss: nothing was done. */
export const DismissInteraction: Story = {
  name: 'Dismiss, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Dismissed. Nothing was done.')
  },
}
