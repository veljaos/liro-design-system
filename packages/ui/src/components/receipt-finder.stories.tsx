import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ReceiptFinder } from './receipt-finder'
import { FOUND_RECEIPTS, STORY_CURRENCY } from './sale-story-data'
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

const meta = {
  title: 'Components/POS/ReceiptFinder',
  component: ReceiptFinder,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** finding an issued receipt again — the original of a refund, a receipt to ' +
          'copy or to cancel: scan its code, or type its number, date or total in ONE field ' +
          '(P5.93). The text is reported as typed; the application reads it, searches and ' +
          'answers; the finder shows the receipts found and reports the one chosen. A receipt ' +
          'that cannot be chosen (refunded in full) says why.\n\n' +
          '**When:** the first step of a refund, a copy or a cancellation at the till.\n\n' +
          '**When not:** browsing the day’s receipts (the journal, a DataTable); finding a ' +
          'customer or a product (LookupField).',
      },
    },
  },
  args: {
    currency: STORY_CURRENCY,
    onScan: fn(),
    onSearch: fn(),
    onChoose: fn(),
  },
  render: (args) => (
    <Till>
      <ReceiptFinder {...args} />
    </Till>
  ),
  play: settle,
} satisfies Meta<typeof ReceiptFinder>

export default meta

type Story = StoryObj<typeof meta>

/** Before a search: scan the code, or type its number, date or total in one field. */
export const Default: Story = {}

/** Three receipts of 1.011,00 found; the first chosen, the third refunded in full. */
export const Results: Story = {
  args: {
    defaultSearch: '1.011,00',
    results: FOUND_RECEIPTS,
    chosenId: 'r2318',
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /ZK7Q2M4P-ZK7Q2M4P-2318/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(
      canvas.getByRole('button', { name: /ZK7Q2M4P-ZK7Q2M4P-2240/ }),
    ).toHaveAccessibleDescription('Refunded in full on 03.10.2026.')
  },
}

/** Searching: skeleton rows. */
export const Loading: Story = { args: { defaultSearch: '2318', loading: true } }

/** None found. */
export const NoResults: Story = {
  name: 'No results',
  args: { defaultSearch: '9999', results: [] },
}

/** The application's error. */
export const Failed: Story = {
  name: 'Error',
  args: {
    defaultSearch: '2318',
    results: [],
    error: 'The journal cannot be reached. Try again in a minute.',
  },
}

/** A scan the application could not read. */
export const ScanProblem: Story = {
  name: 'Scan problem',
  args: {
    scanFeedback: { id: 1, tone: 'error', text: 'This code is not a receipt of this shop.' },
  },
}

/** Long words wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    results: [
      {
        id: 'long',
        number: 'ZK7Q2M4P-ZK7Q2M4P-ZK7Q2M4P-ZK7Q2M4P-231800001',
        date: '2026-10-06',
        time: '09:42',
        total: '1234567.89',
        kindLabel: 'Normal sale with a long name chosen by the tenant',
        detail:
          'Two lines refunded already on two different days, by two different cashiers, with two different reasons.',
      },
    ],
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
            <ReceiptFinder {...args} results={FOUND_RECEIPTS} chosenId="r2318" />
          </div>
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
}

/** Arabic, right to left: the number stays left to right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" density="touch">
      <div className="max-w-2xl p-4">
        <ReceiptFinder
          currency="د.إ"
          onSearch={() => undefined}
          results={[
            {
              id: 'a',
              number: 'AE-2026-000412',
              date: '2026-10-06',
              time: '09:42',
              total: '31.50',
              kindLabel: 'بيع عادي',
            },
          ]}
          chosenId="a"
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
        <ReceiptFinder
          currency="¥"
          onSearch={() => undefined}
          results={[
            {
              id: 'j',
              number: 'JP-2026-000412',
              date: '2026-10-06',
              time: '09:42',
              total: '820',
              kindLabel: '通常の販売',
            },
          ]}
        />
      </div>
    </StoryProvider>
  ),
}

/**
 * Type a total in the one field: the text goes to the application as typed (and at once on
 * Enter, never twice); then choose a receipt; a refunded one cannot be chosen.
 */
export const Searching: Story = {
  name: 'Searching, interaction',
  tags: ['interaction', '!dev'],
  args: { results: FOUND_RECEIPTS },
  play: async ({ args, canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: 'Search' })).toBeNull()
    await userEvent.type(
      canvas.getByRole('searchbox', { name: /^Or type its number, date or total/ }),
      '1.011,00{Enter}',
    )
    await expect(args.onSearch).toHaveBeenLastCalledWith('1.011,00')
    await new Promise((resolve) => setTimeout(resolve, 400))
    await expect(args.onSearch).toHaveBeenCalledTimes(1)
    await userEvent.click(canvas.getByRole('button', { name: /ZK7Q2M4P-ZK7Q2M4P-2297/ }))
    await expect(args.onChoose).toHaveBeenCalledWith('r2297')
    await userEvent.click(canvas.getByRole('button', { name: /ZK7Q2M4P-ZK7Q2M4P-2240/ }))
    await expect(args.onChoose).toHaveBeenCalledTimes(1)
  },
}
