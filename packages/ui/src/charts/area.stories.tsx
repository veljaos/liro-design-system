import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { SelectField } from '../components/select-field'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { useLiro } from '../provider/liro-provider'
import { AreaChart, type AreaChartProps } from './cartesian'
import {
  CASH,
  CHANNELS,
  DAILY,
  dailyTotal,
  PAYMENT_METHODS,
  REVENUE,
  showTable,
} from './chart-story-data'
import { ChartSeriesToggle } from './series-toggle'

const meta = {
  title: 'Charts/Area',
  component: AreaChart,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a volume over time — revenue, sales, stock — and, stacked, how its ' +
          'parts make it up. A flat wash under the line (no gradients); stacked layers 2px ' +
          'apart.\n\n' +
          '**How:** `categories` (time, oldest first), `series`, `values` as decimal strings; ' +
          '`curve` (`monotone` by default, `linear`, `step`); `stack` (`stacked`, `expanded` to ' +
          '100%); `controls` for an interactive header. Import from `@veljaos/ui/charts`.\n\n' +
          '**When not:** a change without volume (LineChart); categories that are not time ' +
          '(BarChart). See "Charts / Choosing a chart".',
      },
    },
  },
  args: CASH,
  render: (args: AreaChartProps) => (
    <ExampleProvider>
      <div className="max-w-180">
        <AreaChart {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof AreaChart>

export default meta

type Story = StoryObj<typeof meta>

/** "Show as table": the same values as a table; in right-to-left the columns follow the page. */
export const AsTable: Story = {
  name: 'Show as table',
  play: showTable,
}

/** One series, a smooth line (monotone: never past the values) and a 10% wash. */
export const Default: Story = {}

/** Straight segments between the values. */
export const Linear: Story = { args: { curve: 'linear' } }

/** Steps: a value that holds until it changes. */
export const Step: Story = { args: { curve: 'step' } }

/** Three channels stacked: their sum is the total revenue (categorical palette, legend). */
export const Stacked: Story = { args: { ...CHANNELS, stack: 'stacked' } }

/** Stacked to 100%: the share of each payment method; the value axis in percent. */
export const StackedExpanded: Story = {
  name: 'Stacked expanded (100%)',
  args: { ...PAYMENT_METHODS, stack: 'expanded' },
}

/** Two series: the legend names them (blue and grey). */
export const WithLegend: Story = { name: 'With legend', args: { ...REVENUE } }

/** Without the value axis: a small trend where the tooltip and table carry the values. */
export const Axes: Story = {
  name: 'Axes',
  args: { ...REVENUE, valueAxis: false, grid: false },
}

function Interactive({ phone = false }: { phone?: boolean }) {
  const { format } = useLiro()
  const [days, setDays] = useState('90')
  const [shown, setShown] = useState(['beograd'])
  const count = Number(days)
  const categories = DAILY.categories.slice(-count)
  const stores = [
    { key: 'beograd', label: 'Beograd store' },
    { key: 'noviSad', label: 'Novi Sad store' },
  ] as const
  return (
    <AreaChart
      title="Daily sales"
      description="Thousands of RSD, both stores"
      layout={phone ? 'phone' : 'desktop'}
      categories={categories}
      series={stores.filter((store) => shown.includes(store.key))}
      values={DAILY.values}
      decimals={2}
      controls={
        <>
          <ChartSeriesToggle
            label="Stores shown"
            multiple
            value={shown}
            onValueChange={setShown}
            items={stores.map((store) => ({
              key: store.key,
              label: store.label,
              total: format.number(dailyTotal(store.key, count), { decimals: 2 }),
            }))}
          />
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
        </>
      }
    />
  )
}

/** A time-range select and a series toggle in the header; the application filters the data. */
export const InteractiveStory: Story = {
  name: 'Interactive',
  render: () => (
    <ExampleProvider>
      <div className="max-w-220">
        <Interactive />
      </div>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /Novi Sad store/ }))
    await expect(canvas.getByRole('button', { name: /Novi Sad store/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await settle()
  },
}

/** Phone width: fewer ticks, the header stacked, the legend under the plot. */
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

/** Arabic names in a right-to-left page: time runs from the right, the value axis at the right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-180">
          <AreaChart
            {...CHANNELS}
            stack="stacked"
            title="الإيرادات حسب القناة"
            description="آلاف الدينارات، بدون ضريبة"
            series={[
              { key: 'retail', label: 'التجزئة' },
              { key: 'wholesale', label: 'الجملة' },
              { key: 'online', label: 'المتجر الإلكتروني' },
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
          <AreaChart
            {...REVENUE}
            title="売上高"
            description="千ディナール、税抜"
            series={[
              { key: 'y2026', label: '2026年' },
              { key: 'y2025', label: '2025年' },
            ]}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** A long title and description wrap; long series names wrap in the legend. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    ...CHANNELS,
    stack: 'stacked',
    title: 'Revenue by sales channel for all stores and the online shop of Kvadrat Gradnja d.o.o.',
    description:
      'Thousands of RSD, without VAT, as booked on the revenue accounts 6040, 6140 and 6150; returns deducted',
    series: [
      { key: 'retail', label: 'Retail in the Beograd and Novi Sad stores' },
      { key: 'wholesale', label: 'Wholesale to construction companies' },
      { key: 'online', label: 'Online shop with delivery' },
    ],
  },
}
