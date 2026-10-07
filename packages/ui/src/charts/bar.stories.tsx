import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { useLiro } from '../provider/liro-provider'
import { BarChart, type BarChartProps } from './cartesian'
import {
  COSTS,
  DAILY,
  REGIONS,
  RESULT,
  REVENUE,
  TOP_CUSTOMERS,
  dailyTotal,
} from './chart-story-data'
import { ChartSeriesToggle } from './series-toggle'

const meta = {
  title: 'Charts/Bar',
  component: BarChart,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** comparing categories — months, customers, regions; horizontal when the ' +
          'labels are long or there are more than 7 items. Bars at most 24px with rounded ends at ' +
          'the data.\n\n' +
          '**How:** `categories`, `series`, `values` as decimal strings; `orientation`, `stack`, ' +
          '`labels` (`end`, `inside`), `activeCategory`, `signTones` for profit and loss, ' +
          '`colorBy="category"` with the categorical palette. Import from `@veljaos/ui/charts`.\n\n' +
          '**When not:** a trend over many points in time (LineChart, AreaChart); parts of a whole ' +
          '(PieChart, five parts or fewer).',
      },
    },
  },
  args: { ...REVENUE, series: [{ key: 'y2026', label: '2026' }] },
  render: (args: BarChartProps) => (
    <ExampleProvider>
      <div className="max-w-180">
        <BarChart {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof BarChart>

export default meta

type Story = StoryObj<typeof meta>

/** One series in the brand blue. */
export const Default: Story = {}

/** Horizontal: long names down the start side. */
export const Horizontal: Story = { args: { ...TOP_CUSTOMERS, orientation: 'horizontal' } }

/** Two series: 2026 in blue against 2025 in grey, 2px apart. */
export const Multiple: Story = { args: { ...REVENUE } }

/** Three kinds of cost stacked, 2px apart, with the legend (categorical palette). */
export const StackedWithLegend: Story = {
  name: 'Stacked with legend',
  args: { ...COSTS, stack: 'stacked' },
}

/** Each value at the bar's end. */
export const WithLabels: Story = {
  name: 'With labels',
  args: { ...TOP_CUSTOMERS, orientation: 'horizontal', labels: 'end', valueAxis: false },
}

/** The value inside the bar's start, on a small raised tag, so the text never stands on the data colour. */
export const CustomLabel: Story = {
  name: 'Custom label inside',
  args: { ...TOP_CUSTOMERS, orientation: 'horizontal', labels: 'inside', valueAxis: false },
}

/** One month highlighted (the current one); the others grey. */
export const Active: Story = {
  args: {
    ...REVENUE,
    series: [{ key: 'y2026', label: '2026' }],
    activeCategory: '2026-09',
    description: 'Thousands of RSD, without VAT; September is the current month',
  },
}

/** Profit and loss: green above zero, red below, both named in the legend. */
export const Negative: Story = {
  args: { ...RESULT, signTones: { positive: 'Profit', negative: 'Loss' } },
}

/** A hue per region (categorical palette, named in the legend). */
export const Mixed: Story = { args: { ...REGIONS, colorBy: 'category', palette: 'categorical' } }

function Interactive({ phone = false }: { phone?: boolean }) {
  const { format } = useLiro()
  const [store, setStore] = useState<'beograd' | 'noviSad'>('beograd')
  const stores = [
    { key: 'beograd', label: 'Beograd store' },
    { key: 'noviSad', label: 'Novi Sad store' },
  ] as const
  const chosen = stores.find((each) => each.key === store) ?? stores[0]
  return (
    <BarChart
      title="Daily sales, last 30 days"
      description="Thousands of RSD"
      layout={phone ? 'phone' : 'desktop'}
      categories={DAILY.categories.slice(-30)}
      series={[chosen]}
      values={DAILY.values}
      decimals={2}
      controls={
        <ChartSeriesToggle
          label="Store shown"
          value={[store]}
          onValueChange={(value) => {
            const next = value[0]
            if (next === 'beograd' || next === 'noviSad') setStore(next)
          }}
          items={stores.map((each) => ({
            key: each.key,
            label: each.label,
            total: format.number(dailyTotal(each.key, 30), { decimals: 2 }),
          }))}
        />
      }
    />
  )
}

/** The series chosen in the header, with each one's total for the period. */
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
    await expect(canvas.getByRole('button', { name: /Beograd store/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await settle()
  },
}

/** Phone width: fewer ticks, the header stacked; long names as horizontal bars. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="flex flex-col gap-4 p-4">
          <Interactive phone />
          <BarChart {...TOP_CUSTOMERS} orientation="horizontal" layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic names in a right-to-left page: bars from the right, names at the right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="flex max-w-180 flex-col gap-4">
          <BarChart
            {...TOP_CUSTOMERS}
            orientation="horizontal"
            labels="end"
            title="أكبر خمسة عملاء"
            description="آلاف الدينارات"
            categories={[
              { key: 'panonija', label: 'شركة بانونيا' },
              { key: 'bojovic', label: 'بويوفيتش وأبناؤه' },
              { key: 'vojvodjanka', label: 'مطحنة فويفودينا' },
              { key: 'medic', label: 'مختبر ميديك' },
              { key: 'stanic', label: 'ستانيتش إلكترو' },
            ]}
          />
          <BarChart {...REVENUE} title="الإيرادات" />
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
          <BarChart
            {...REGIONS}
            colorBy="category"
            palette="categorical"
            title="地域別売上高"
            description="千ディナール、2026年9月"
            categories={[
              { key: 'bg', label: 'ベオグラード' },
              { key: 'ns', label: 'ノヴィ・サド' },
              { key: 'ni', label: 'ニシュ' },
              { key: 'kg', label: 'クラグイェヴァツ' },
              { key: 'su', label: 'スボティツァ' },
            ]}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Long names wrap in the legend; the title wraps. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    ...COSTS,
    stack: 'stacked',
    title: 'Costs by kind for all cost centres of Kvadrat Gradnja d.o.o., April to September 2026',
    series: [
      { key: 'goods', label: 'Cost of goods sold from the central warehouse' },
      { key: 'salaries', label: 'Gross salaries with contributions' },
      { key: 'transport', label: 'Transport by own vehicles and carriers' },
    ],
  },
}
