import type { Meta, StoryObj } from '@storybook/react-vite'
import { DateText, MoneyText } from './display-text'
import { KeyFigures } from './key-figures'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import { settle } from '../primitives/story-helpers'

const meta = {
  title: 'Components/Display/KeyFigures',
  component: KeyFigures,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the two to four values a record is judged by, under its title: the ' +
          'label small above, the value 20px semibold, 32px apart; no frame, no card. Colour ' +
          'only for a state (`tone`: "Overdue 3 days" in the danger colour). Two columns on ' +
          'phones.\n\n' +
          '**When not:** a dashboard’s numbers (StatCard, P4.6); a record’s other fields ' +
          '(KeyValueList).',
      },
    },
  },
  args: {
    items: [
      { label: 'Amount due', value: <MoneyText value="12345.60" currency="RSD" /> },
      { label: 'Due', value: <DateText value="2026-10-03" /> },
      { label: 'Overdue', value: '3 days', tone: 'danger' },
    ],
  },
  render: (args) => (
    <ExampleProvider>
      <KeyFigures {...args} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof KeyFigures>

export default meta

type Story = StoryObj<typeof meta>

/** An invoice's figures, the overdue days in the danger colour. */
export const Default: Story = {}

/** Four figures, each tone that marks a state. */
export const Tones: Story = {
  args: {
    items: [
      { label: 'Blocked', value: '2 lines', tone: 'danger' },
      { label: 'Waiting for approval', value: '5 days', tone: 'warning' },
      { label: 'Paid', value: <MoneyText value="4870.00" currency="RSD" />, tone: 'success' },
      { label: 'Sent to SEF', value: <DateText value="2026-09-28" />, tone: 'info' },
    ],
  },
}

/** Long labels and values wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    items: [
      {
        label: 'Amount due after the partial payment of 26.09.2026.',
        value: <MoneyText value="1234567890.12" currency="RSD" />,
      },
      { label: 'Due', value: <DateText value="2026-10-15" /> },
    ],
  },
}

/** Phone width: two columns. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <ExampleProvider>
          <KeyFigures {...args} layout="phone" />
        </ExampleProvider>
      </div>
    </PhoneFrame>
  ),
}

/** Arabic labels. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <KeyFigures
        items={[
          { label: 'المبلغ المستحق', value: <MoneyText value="12345.60" currency="RSD" /> },
          { label: 'متأخر', value: '٣ أيام', tone: 'danger' },
        ]}
      />
    </StoryProvider>
  ),
}

/** Japanese labels. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <KeyFigures
        items={[
          { label: '請求残高', value: <MoneyText value="12345.60" currency="RSD" /> },
          { label: '支払期日', value: <DateText value="2026-10-15" /> },
        ]}
      />
    </StoryProvider>
  ),
}
