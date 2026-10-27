import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { keysReachMarks, showTable, tableShown } from './chart-story-data'
import { ScatterChart, type ScatterChartProps, type ScatterSeries } from './scatter'

/** Price against margin of the best-selling products, and units sold in September (invented). */
const PRODUCTS: ScatterSeries[] = [
  {
    key: 'tiles',
    label: 'Tiles',
    points: [
      { key: 't1', label: 'Floor tile 60×60 grey', x: '1890.00', y: '24.5', size: '1840' },
      { key: 't2', label: 'Wall tile 30×60 white', x: '1240.00', y: '31.2', size: '2620' },
      { key: 't3', label: 'Porcelain 120×60', x: '4680.00', y: '18.4', size: '410' },
      { key: 't4', label: 'Mosaic 30×30', x: '3150.00', y: '38.6', size: '260' },
      { key: 't5', label: 'Outdoor tile 40×40', x: '1560.00', y: '21.0', size: '980' },
      { key: 't6', label: 'Skirting 8×60', x: '420.00', y: '42.3', size: '3100' },
    ],
  },
  {
    key: 'adhesives',
    label: 'Adhesives and grout',
    points: [
      { key: 'a1', label: 'Tile adhesive C1 25 kg', x: '890.00', y: '16.8', size: '2240' },
      { key: 'a2', label: 'Flexible adhesive C2 25 kg', x: '1650.00', y: '22.1', size: '1310' },
      { key: 'a3', label: 'Grout 5 kg', x: '980.00', y: '35.4', size: '1720' },
      { key: 'a4', label: 'Epoxy grout 2 kg', x: '3420.00', y: '28.9', size: '190' },
      { key: 'a5', label: 'Primer 5 l', x: '1180.00', y: '26.7', size: '640' },
    ],
  },
]

const meta = {
  title: 'Charts/Scatter',
  component: ScatterChart,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** items placed by two values — price against margin, days overdue ' +
          'against amount — to see a relationship and the outliers; `size` makes bubbles of a ' +
          'third value.\n\n' +
          '**How:** `series` of `points` (`x`, `y`, `size` as decimal strings), each axis named ' +
          'and written as an amount, a percentage or a number (`x`, `y`, `size`). One group in ' +
          'the main blue, a second grey, more with `palette="categorical"`. The arrows walk the ' +
          'points by their x. Import from `@veljaos/ui/charts`.\n\n' +
          '**When not:** values over time (LineChart); one value per category (BarChart).',
      },
    },
  },
  args: {
    title: 'Price and margin',
    description: 'Best-selling products, September 2026',
    series: PRODUCTS,
    x: { label: 'Price', currency: 'RSD' },
    y: { label: 'Margin', percent: true },
  },
  render: (args: ScatterChartProps) => (
    <ExampleProvider>
      <div className="max-w-180">
        <ScatterChart {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof ScatterChart>

export default meta

type Story = StoryObj<typeof meta>

/** Two groups: tiles in the main blue, adhesives in grey. */
export const Default: Story = {}

/** Bubbles: each point's area follows the units sold. */
export const Bubbles: Story = {
  args: { size: { label: 'Units sold' } },
}

/** "Show as table": every product with its price, margin and units. */
export const AsTable: Story = {
  name: 'Show as table',
  args: { defaultView: 'table', size: { label: 'Units sold' } },
  play: tableShown,
}

/** Phone width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <ScatterChart {...args} layout="phone" size={{ label: 'Units sold' }} />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** The keys: the arrows walk the points from the lowest price. */
export const Keyboard: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction', '!dev'],
  play: keysReachMarks,
}

/** Pressing "Show as table". */
export const AsTableInteraction: Story = {
  name: 'Show as table, interaction',
  tags: ['interaction', '!dev'],
  play: showTable,
}

/** Three groups need the categorical palette; empty, loading and an error. */
export const States: Story = {
  tags: ['!dev'],
  render: (args) => (
    <ExampleProvider>
      <div className="grid max-w-180 gap-4">
        <ScatterChart
          {...args}
          palette="categorical"
          series={[
            ...PRODUCTS,
            {
              key: 'tools',
              label: 'Tools',
              points: [
                { key: 'o1', label: 'Tile cutter 60 cm', x: '6480.00', y: '19.5' },
                { key: 'o2', label: 'Notched trowel', x: '640.00', y: '44.0' },
              ],
            },
          ]}
        />
        <ScatterChart {...args} series={[]} />
        <ScatterChart {...args} loading />
        <ScatterChart {...args} error={{ onRetry: () => undefined }} />
      </div>
    </ExampleProvider>
  ),
}

/** Arabic: the price axis runs from the right, the margin axis at the right. */
export const Arabic: Story = {
  tags: ['!dev'],
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-180">
          <ScatterChart
            {...args}
            title="السعر والهامش"
            description="المنتجات الأكثر مبيعًا، سبتمبر 2026"
            x={{ label: 'السعر', currency: 'RSD' }}
            y={{ label: 'الهامش', percent: true }}
            series={[
              { key: 'tiles', label: 'البلاط', points: PRODUCTS[0]?.points ?? [] },
              { key: 'adhesives', label: 'المواد اللاصقة', points: PRODUCTS[1]?.points ?? [] },
            ]}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  tags: ['!dev'],
  render: (args) => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <div className="max-w-180">
          <ScatterChart
            {...args}
            title="価格と利益率"
            description="売れ筋商品、2026年9月"
            x={{ label: '価格', currency: 'RSD' }}
            y={{ label: '利益率', percent: true }}
            series={[
              { key: 'tiles', label: 'タイル', points: PRODUCTS[0]?.points ?? [] },
              { key: 'adhesives', label: '接着剤', points: PRODUCTS[1]?.points ?? [] },
            ]}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Long axis and group names wrap. */
export const LongText: Story = {
  name: 'Long text',
  tags: ['!dev'],
  args: {
    title: 'Retail price and gross margin of every product sold in all the company’s stores',
    x: { label: 'Retail price per unit with VAT, in dinars', currency: 'RSD' },
    y: { label: 'Gross margin after the supplier’s rebates', percent: true },
  },
}
