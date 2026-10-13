import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { AdvanceList } from './advance-list'
import { ADVANCES, STORY_CURRENCY } from './sale-story-data'
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
  title: 'Components/POS/AdvanceList',
  component: AdvanceList,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a buyer’s open advance payments, to close on the final sale (ticked: ' +
          'deducted, the rest to pay) or to refund. What was paid, what is open and the figure ' +
          'deducted are the application’s; the list adds nothing.\n\n' +
          '**When:** in the cart’s details once the buyer is known; on the buyer’s page at the ' +
          'till.\n\n' +
          '**When not:** a customer’s open invoices in the books (CandidateList on a statement); ' +
          'taking a new advance (a sale of the Advance kind, ReceiptKindPicker).',
      },
    },
  },
  args: {
    advances: ADVANCES,
    currency: STORY_CURRENCY,
    onSelectionChange: fn(),
    onRefund: fn(),
  },
  render: (args) => (
    <Till>
      <AdvanceList {...args} />
    </Till>
  ),
  play: settle,
} satisfies Meta<typeof AdvanceList>

export default meta

type Story = StoryObj<typeof meta>

/** Both advances deducted: 6.200,00 (the application's sum). */
export const Default: Story = {
  args: { defaultSelected: ['a2201', 'a2265'], chosenTotal: '6200.00' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('checkbox', { name: 'Deduct advance ZK7Q2M4P-ZK7Q2M4P-2201' }),
    ).toBeChecked()
    await expect(
      canvas.getByRole('button', { name: 'Refund advance ZK7Q2M4P-ZK7Q2M4P-2265' }),
    ).toBeVisible()
  },
}

/** A list to look at: no choice, refund only. */
export const ListOnly: Story = {
  name: 'List only',
  render: (args) => (
    <Till>
      <AdvanceList advances={args.advances} currency={args.currency} onRefund={() => undefined} />
    </Till>
  ),
}

/** One advance cannot be used on this sale, with the reason. */
export const Unavailable: Story = {
  args: {
    advances: [
      ...ADVANCES,
      {
        id: 'a2270',
        number: 'ZK7Q2M4P-ZK7Q2M4P-2270',
        date: '2026-10-04',
        paid: '2000.00',
        open: '2000.00',
        unavailableReason: 'Taken for another order; it closes on that sale.',
      },
    ],
    defaultSelected: ['a2201'],
    chosenTotal: '5000.00',
  },
}

export const Loading: Story = { args: { loading: true } }

export const Empty: Story = { args: { advances: [] } }

/** The application's error. */
export const Failed: Story = {
  name: 'Error',
  args: { error: 'The advances cannot be loaded. Try again in a minute.' },
}

/** Long words wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    title: 'Advances this buyer paid for orders not delivered yet',
    advances: [
      {
        id: 'l',
        number: 'ZK7Q2M4P-ZK7Q2M4P-ZK7Q2M4P-2201',
        date: '2026-09-28',
        paid: '1234567.89',
        open: '1234567.89',
        state: { label: 'Open, waiting for the final sale', tone: 'neutral' },
        note: 'Wedding cake of five tiers with sugar flowers, 120 slices, to be delivered to the hall on Saturday morning.',
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
            <AdvanceList {...args} defaultSelected={['a2201']} chosenTotal="5000.00" />
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
        <AdvanceList
          title="الدفعات المقدمة"
          currency="د.إ"
          advances={[
            {
              id: 'a',
              number: 'AE-2026-000201',
              date: '2026-09-28',
              paid: '500.00',
              open: '500.00',
              note: 'كعكة الزفاف',
            },
          ]}
          defaultSelected={['a']}
          onSelectionChange={() => undefined}
          chosenTotal="500.00"
          chosenTotalLabel="المخصوم"
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
        <AdvanceList
          title="前受金"
          currency="¥"
          advances={[
            {
              id: 'j',
              number: 'JP-2026-000201',
              date: '2026-09-28',
              paid: '5000',
              open: '3000',
              note: 'ウェディングケーキ',
            },
          ]}
          onRefund={() => undefined}
        />
      </div>
    </StoryProvider>
  ),
}

/** Ticking an advance reports the chosen ids; its refund button reports the id. */
export const Choosing: Story = {
  name: 'Choosing, interaction',
  tags: ['interaction'],
  play: async ({ args, canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('checkbox', { name: 'Deduct advance ZK7Q2M4P-ZK7Q2M4P-2265' }),
    )
    await expect(args.onSelectionChange).toHaveBeenLastCalledWith(['a2265'])
    await userEvent.click(
      canvas.getByRole('button', { name: 'Refund advance ZK7Q2M4P-ZK7Q2M4P-2201' }),
    )
    await expect(args.onRefund).toHaveBeenCalledWith('a2201')
  },
}
