import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { RadarChart, RadialChart, type RadarChartProps } from './polar'

/** Two suppliers scored by the purchasing team, 1–5. */
const SCORES: RadarChartProps = {
  title: 'Supplier scores',
  description: 'Purchasing team, 1 to 5, January–September 2026',
  categories: [
    { key: 'quality', label: 'Quality' },
    { key: 'onTime', label: 'On time' },
    { key: 'price', label: 'Price' },
    { key: 'terms', label: 'Payment terms' },
    { key: 'support', label: 'Support' },
  ],
  series: [
    { key: 'lafarge', label: 'Beočinska fabrika cementa' },
    { key: 'zelezara', label: 'HBIS Smederevo' },
  ],
  values: {
    lafarge: { quality: '4.6', onTime: '4.2', price: '3.4', terms: '3.9', support: '4.4' },
    zelezara: { quality: '4.1', onTime: '3.5', price: '4.3', terms: '3.2', support: '3.6' },
  },
  decimals: 1,
}

const ONE_SUPPLIER: RadarChartProps = {
  ...SCORES,
  series: [{ key: 'lafarge', label: 'Beočinska fabrika cementa' }],
  title: 'Scores of Beočinska fabrika cementa',
}

const meta = {
  title: 'Charts/Radar',
  component: RadarChart,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a few scores of one or two things around a circle — supplier ' +
          'ratings, a quality audit. Never for money over time.\n\n' +
          '**How:** `categories` (the spokes), `series`, `values`; `dots`, `fill` (false: lines ' +
          'only), `grid` (`polygon`, `circle`, `none`). Import from `@veljaos/ui/charts`.\n\n' +
          '**When not:** amounts (BarChart); time (LineChart); more than two series.',
      },
    },
  },
  args: ONE_SUPPLIER,
  render: (args: RadarChartProps) => (
    <ExampleProvider>
      <div className="max-w-140">
        <RadarChart {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof RadarChart>

export default meta

type Story = StoryObj<typeof meta>

/** One supplier: a blue shape with a flat wash. */
export const Default: Story = {}

/** A dot on each score. */
export const WithDots: Story = { name: 'With dots', args: { dots: true } }

/** Two suppliers: blue and grey, named in the legend. */
export const Multiple: Story = { args: { ...SCORES } }

/** Lines only, no wash. */
export const LinesOnly: Story = { name: 'Lines only', args: { ...SCORES, fill: false } }

/** Circles instead of polygons. */
export const CircularGrid: Story = { name: 'Circular grid', args: { grid: 'circle' } }

/** Without a grid. */
export const NoGrid: Story = { name: 'No grid', args: { grid: 'none', dots: true } }

/** The legend for one series as well. */
export const WithLegend: Story = { name: 'With legend', args: { legend: true } }

/** Phone width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="flex flex-col gap-4 p-4">
          <RadarChart {...SCORES} layout="phone" />
          <RadialChart
            title="Plan for 2026"
            description="Revenue, RSD"
            layout="phone"
            currency="RSD"
            decimals={0}
            items={[{ key: 'done', label: 'Achieved', value: '52430000' }]}
            max="68000000"
            centre={{ value: '52430000', label: 'of 68.000.000 RSD' }}
          />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic names in a right-to-left page: the spokes run counter-clockwise. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-140">
          <RadarChart
            {...SCORES}
            title="تقييم الموردين"
            description="من 1 إلى 5"
            categories={[
              { key: 'quality', label: 'الجودة' },
              { key: 'onTime', label: 'الالتزام بالمواعيد' },
              { key: 'price', label: 'السعر' },
              { key: 'terms', label: 'شروط الدفع' },
              { key: 'support', label: 'الدعم' },
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
        <div className="max-w-140">
          <RadarChart
            {...ONE_SUPPLIER}
            title="仕入先の評価"
            description="1〜5"
            categories={[
              { key: 'quality', label: '品質' },
              { key: 'onTime', label: '納期' },
              { key: 'price', label: '価格' },
              { key: 'terms', label: '支払条件' },
              { key: 'support', label: 'サポート' },
            ]}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Long spoke names stay inside the card. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    ...SCORES,
    title: 'Scores of the two main suppliers of construction materials, purchasing team',
    categories: [
      { key: 'quality', label: 'Quality of delivered goods' },
      { key: 'onTime', label: 'Deliveries on the agreed day' },
      { key: 'price', label: 'Price against the market' },
      { key: 'terms', label: 'Payment terms' },
      { key: 'support', label: 'Complaints handled' },
    ],
  },
}
