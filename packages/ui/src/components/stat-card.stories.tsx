import type { Meta, StoryObj } from '@storybook/react-vite'
import { settle } from '../primitives/story-helpers'
import { MoneyText } from './display-text'
import { StatCard } from './stat-card'
import { ExampleProvider, percentText, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Display/StatCard',
  component: StatCard,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** one number on a dashboard: the label, the value (24px), its change with ' +
          'an arrow — green or red only when the application says the change is good or bad — ' +
          'what it compares with, and an optional grey sparkline. No decorative icon.\n\n' +
          '**When not:** the figures of one record (KeyFigures); a series to compare (a chart).',
      },
    },
  },
  args: {
    label: 'Revenue, September',
    value: <MoneyText value="5684200" currency="RSD" decimals={0} />,
    change: { text: percentText('16.7', 'always'), direction: 'up', sentiment: 'good' },
    comparison: 'vs September 2025',
    trend: ['4812.4', '5230.9', '4977.1', '3906.5', '4421.8', '5684.2'],
  },
  render: (args) => (
    <ExampleProvider>
      <div className="max-w-80">
        <StatCard {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof StatCard>

export default meta

type Story = StoryObj<typeof meta>

/** A good change in green, with the trend. */
export const Default: Story = {}

/** A bad change in red (overdue receivables went up). */
export const BadChange: Story = {
  name: 'Bad change',
  args: {
    label: 'Overdue receivables',
    value: <MoneyText value="421740" currency="RSD" decimals={0} />,
    change: { text: percentText('8.2', 'always'), direction: 'up', sentiment: 'bad' },
    comparison: 'vs last week',
  },
}

/** A neutral change: the application does not judge it. */
export const NeutralChange: Story = {
  name: 'Neutral change',
  args: {
    label: 'Invoices issued',
    value: '214',
    change: { text: percentText('-3'), direction: 'down' },
    comparison: 'vs September 2025',
    trend: [],
  },
}

/** Loading: a skeleton 104px high. */
export const Loading: Story = { args: { loading: true } }

/** Long label and value. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    label: 'Revenue from sales to customers abroad, third quarter',
    value: <MoneyText value="1234567890.12" currency="RSD" />,
  },
}

/** Phone width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <ExampleProvider>
          <StatCard {...args} />
        </ExampleProvider>
      </div>
    </PhoneFrame>
  ),
}

/** Arabic label. */
export const Arabic: Story = {
  render: (args) => (
    <StoryProvider locale="ar">
      <div className="max-w-80">
        <StatCard {...args} label="الإيرادات، سبتمبر" comparison="مقارنة بسبتمبر ٢٠٢٥" />
      </div>
    </StoryProvider>
  ),
}

/** Japanese label. */
export const Japanese: Story = {
  render: (args) => (
    <StoryProvider locale="ja">
      <div className="max-w-80">
        <StatCard {...args} label="売上高（9月）" comparison="前年同月比" />
      </div>
    </StoryProvider>
  ),
}
