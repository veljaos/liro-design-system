import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { LineQuantityPicker } from './line-quantity-picker'
import { REFUND_CHOSEN, REFUND_CHOSEN_TOTAL, REFUND_LINES, STORY_CURRENCY } from './sale-story-data'
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
  title: 'Components/POS/LineQuantityPicker',
  component: LineQuantityPicker,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** choosing some of a sale’s lines and how much of each — the lines of a ' +
          'partial refund, the items paid now when a bill is split or paid in part, the items ' +
          'moved to another table. A tick takes the whole quantity available, the stepper less; ' +
          'the figure for what is chosen is the application’s (the picker adds nothing).\n\n' +
          '**When:** a refund after the original is found (ReceiptFinder), “Split bill”, “Pay ' +
          'part”, “Move items”.\n\n' +
          '**When not:** editing the sale itself (CartPanel); choosing records (CandidateList).',
      },
    },
  },
  args: {
    label: 'Lines to refund',
    lines: REFUND_LINES,
    currency: STORY_CURRENCY,
    onChange: fn(),
  },
  render: (args) => (
    <Till>
      <LineQuantityPicker {...args} />
    </Till>
  ),
  play: settle,
} satisfies Meta<typeof LineQuantityPicker>

export default meta

type Story = StoryObj<typeof meta>

/** Nothing chosen yet: the figure "—". */
export const Default: Story = { args: { chosenTotal: null, chosenTotalLabel: 'To refund' } }

/** Two kifle and one burek: 240,00 to refund (the application's sum). */
export const Partial: Story = {
  args: {
    defaultValue: REFUND_CHOSEN,
    chosenTotal: REFUND_CHOSEN_TOTAL,
    chosenTotalLabel: 'To refund',
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Quantity, Kifla' })).toHaveValue('2')
    await expect(canvas.getByRole('checkbox', { name: 'All lines' })).toHaveAttribute(
      'data-state',
      'indeterminate',
    )
  },
}

/** Every line chosen whole. */
export const All: Story = {
  args: {
    defaultValue: { c1: '3', c2: '2', c3: '1', c4: '2' },
    chosenTotal: '986.00',
    chosenTotalLabel: 'To refund',
  },
}

/** A line refunded in full cannot be chosen; the figure settles while the application computes. */
export const Unavailable: Story = {
  name: 'Unavailable line, pending',
  args: {
    lines: [
      ...REFUND_LINES.slice(1),
      {
        id: 'c0',
        name: 'Integralni hleb',
        detail: '400 g',
        available: '0',
        unit: 'pc',
        unavailableReason: 'Refunded in full on 06.10.2026.',
      },
    ],
    defaultValue: { c2: '2' },
    chosenTotal: '380.00',
    pending: true,
  },
}

/** Long words wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    label: 'Items to pay now',
    lines: [
      {
        id: 'l',
        name: 'Torta sa šumskim voćem i belom čokoladom po receptu naše bake, parče',
        detail: 'Without sugar, with an extra spoon of whipped cream on the side',
        available: '12',
        unit: 'pc',
        unitPrice: '1234.50',
        note: 'Four of them were paid separately by the guest at the window seat earlier this evening.',
      },
    ],
    defaultValue: { l: '5' },
    chosenTotal: '6172.50',
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
            <LineQuantityPicker
              {...args}
              defaultValue={REFUND_CHOSEN}
              chosenTotal={REFUND_CHOSEN_TOTAL}
            />
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
        <LineQuantityPicker
          label="البنود المستردة"
          currency="د.إ"
          lines={[
            { id: 'a', name: 'قهوة عربية', available: '3', unitPrice: '12.00' },
            { id: 'b', name: 'كعكة التمر', available: '2', unitPrice: '7.50' },
          ]}
          defaultValue={{ a: '1' }}
          chosenTotal="12.00"
          chosenTotalLabel="المبلغ المسترد"
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
        <LineQuantityPicker
          label="今払う品目"
          currency="¥"
          lines={[
            { id: 'a', name: 'カプチーノ', available: '3', unitPrice: '480' },
            { id: 'b', name: 'チーズケーキ', available: '1', unitPrice: '520' },
          ]}
          defaultValue={{ b: '1' }}
          chosenTotal="520"
          chosenTotalLabel="今回の支払い"
        />
      </div>
    </StoryProvider>
  ),
}

/** A tick takes the whole line; "All lines" takes every open line, then none. */
export const Choosing: Story = {
  name: 'Choosing, interaction',
  tags: ['interaction'],
  play: async ({ args, canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('checkbox', { name: /^Burek sa mesom/ }))
    await expect(args.onChange).toHaveBeenLastCalledWith({ c2: '2' })
    await expect(canvas.getByRole('textbox', { name: 'Quantity, Burek sa mesom' })).toHaveValue('2')
    await userEvent.click(canvas.getByRole('checkbox', { name: 'All lines' }))
    await expect(args.onChange).toHaveBeenLastCalledWith({ c1: '3', c2: '2', c3: '1', c4: '2' })
    await userEvent.click(canvas.getByRole('checkbox', { name: 'All lines' }))
    await expect(args.onChange).toHaveBeenLastCalledWith({ c1: null, c2: null, c3: null, c4: null })
  },
}
