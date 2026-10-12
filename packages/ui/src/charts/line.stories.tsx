import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { SelectField } from '../components/select-field'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { LineChart, type LineChartProps } from './cartesian'
import {
  CASH,
  CASH_FLOW,
  CHANNELS,
  DAILY,
  POLICY_RATE,
  showTable,
  tableShown,
} from './chart-story-data'

const meta = {
  title: 'Charts/Line',
  component: LineChart,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** change over time — cash, a rate, a price. 2px lines; a missing value is ' +
          'a gap, never 0.\n\n' +
          '**How:** `categories` (time, oldest first), `series`, `values` as decimal strings; ' +
          '`curve` (`monotone` by default, `linear`, `step`), `dots`, `labels`; `controls` for an ' +
          'interactive header. Import from `@veljaos/ui/charts`.\n\n' +
          '**When not:** a volume that adds up (AreaChart, stacked); categories that are not time ' +
          '(BarChart).',
      },
    },
  },
  args: CASH,
  render: (args: LineChartProps) => (
    <ExampleProvider>
      <div className="max-w-180">
        <LineChart {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof LineChart>

export default meta

type Story = StoryObj<typeof meta>

/** "Show as table": the same values as a table; in right-to-left the columns follow the page. */
export const AsTable: Story = {
  name: 'Show as table',
  args: { defaultView: 'table' },
  play: tableShown,
}

/** Pressing "Show as table" turns the chart into its table (no picture: the static story above). */
export const AsTableInteraction: Story = {
  name: 'Show as table, interaction',
  tags: ['interaction'],
  play: showTable,
}

/** One series, smooth without passing the values. */
export const Default: Story = {}

/** Straight segments. */
export const Linear: Story = { args: { curve: 'linear' } }

/** Steps: the key policy rate holds until the bank changes it. */
export const Step: Story = { args: { ...POLICY_RATE, curve: 'step' } }

/** Received against paid: blue and grey, with the legend. */
export const Multiple: Story = { args: { ...CASH_FLOW } }

/** A dot on each month. */
export const WithDots: Story = { name: 'With dots', args: { ...CASH_FLOW, dots: true } }

/** Each value above its point. */
export const WithLabels: Story = {
  name: 'With labels',
  args: { ...CASH, dots: true, labels: true, valueAxis: false },
}

/** Three channels: the categorical palette. */
export const Categorical: Story = { args: { ...CHANNELS } }

function Interactive({ phone = false }: { phone?: boolean }) {
  const [days, setDays] = useState('30')
  return (
    <LineChart
      title="Daily sales, Beograd store"
      description="Thousands of RSD"
      layout={phone ? 'phone' : 'desktop'}
      categories={DAILY.categories.slice(-Number(days))}
      series={[{ key: 'beograd', label: 'Beograd store' }]}
      values={DAILY.values}
      decimals={2}
      dots={days === '7'}
      controls={
        <SelectField
          label="Period"
          hideLabel
          value={days}
          onChange={setDays}
          className="w-44"
          options={[
            { value: '90', label: 'Last 3 months' },
            { value: '30', label: 'Last 30 days' },
            { value: '7', label: 'Last 7 days' },
          ]}
        />
      }
    />
  )
}

/** A time-range select in the header. */
export const InteractiveStory: Story = {
  name: 'Interactive',
  render: () => (
    <ExampleProvider>
      <div className="max-w-180">
        <Interactive />
      </div>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const plot = canvasElement.querySelector('.recharts-surface')
    // The plot is reachable by keyboard; the arrows show the tooltip (WCAG 2.1.1).
    await expect(plot).toHaveAttribute('tabindex', '0')
  },
}

export const InteractiveStoryInteraction: Story = {
  name: 'Interactive, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <div className="max-w-180">
        <Interactive />
      </div>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const plot = canvasElement.querySelector('.recharts-surface')
    // The plot is reachable by keyboard; the arrows show the tooltip (WCAG 2.1.1).
    await expect(plot).toHaveAttribute('tabindex', '0')
    within(canvasElement)
      .getByRole('group', { name: 'Daily sales, Beograd store' })
      .querySelector<SVGElement>('.recharts-surface')
      ?.focus()
    await userEvent.keyboard('{ArrowRight}')
    await settle()
    await expect(canvasElement.querySelector('.recharts-tooltip-wrapper')).toBeVisible()
  },
}

/** Phone width: fewer ticks, the select under the title. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Interactive phone />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic names in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-180">
          <LineChart
            {...CASH_FLOW}
            title="المقبوضات والمدفوعات"
            description="آلاف الدينارات"
            series={[
              { key: 'in', label: 'المقبوضات' },
              { key: 'out', label: 'المدفوعات' },
            ]}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese names. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <div className="max-w-180">
          <LineChart {...CASH} title="月末の現金残高" description="千ディナール、全口座" />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** A long title and long series names. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    ...CASH_FLOW,
    title:
      'Money received and paid on all current accounts of Kvadrat Gradnja d.o.o. at banks in Serbia',
    series: [
      { key: 'in', label: 'Received from customers and other inflows' },
      { key: 'out', label: 'Paid to suppliers, employees and the tax administration' },
    ],
  },
}
