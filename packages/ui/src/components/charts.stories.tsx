import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { AreaChart, BarChart, DonutChart, LineChart, type CartesianChartProps } from './charts'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const MONTHS = [
  { key: '04', label: 'Apr' },
  { key: '05', label: 'May' },
  { key: '06', label: 'Jun' },
  { key: '07', label: 'Jul' },
  { key: '08', label: 'Aug' },
  { key: '09', label: 'Sep' },
]

/** Revenue in thousands of RSD, this year and last (illustrative). */
const REVENUE: CartesianChartProps = {
  title: 'Revenue',
  description: 'Thousands of RSD, without VAT',
  categories: MONTHS,
  series: [
    { key: 'y2026', label: '2026', role: 'main' },
    { key: 'y2025', label: '2025', role: 'comparison' },
  ],
  values: {
    y2026: {
      '04': '4812.4',
      '05': '5230.9',
      '06': '4977.1',
      '07': '3906.5',
      '08': '4421.8',
      '09': '5684.2',
    },
    y2025: {
      '04': '4390.2',
      '05': '4718.6',
      '06': '4655.0',
      '07': '3711.3',
      '08': '3958.7',
      '09': '4870.1',
    },
  },
  decimals: 1,
}

const meta = {
  title: 'Components/Charts',
  component: BarChart,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the charts of a dashboard or a report: `BarChart` (magnitudes per ' +
          'category), `LineChart` (change over time), `AreaChart` (a volume over time), ' +
          '`DonutChart` (parts of one whole). Restrained: the main series in the brand blue, ' +
          'the comparison and the rest in greys, status colours only when a series means a ' +
          'state; `palette="categorical"` (five validated hues) only for really distinct ' +
          'categories. Each chart is a card with its title, a legend for two or more series, a ' +
          'tooltip on hover, and "Show as table".\n\n' +
          '**How:** values as decimal strings by series and category; shares of a donut from ' +
          'the application. Nothing is computed.\n\n' +
          '**When not:** one number (StatCard); a precise list of values (DataTable). Never two ' +
          'value axes in one chart.',
      },
    },
  },
  args: REVENUE,
  render: (args) => (
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

/** Bars: this year in blue against last year in grey. */
export const Bar: Story = {}

/** One series: no legend, the title names it. */
export const SingleSeries: Story = {
  name: 'Single series',
  args: { series: [{ key: 'y2026', label: '2026' }] },
}

/** Lines: cash on the accounts at the end of each month. */
export const Line: Story = {
  render: () => (
    <ExampleProvider>
      <div className="max-w-180">
        <LineChart
          title="Cash at month end"
          description="RSD, all accounts"
          categories={MONTHS}
          series={[
            { key: 'cash', label: 'Cash', role: 'main' },
            { key: 'overdraft', label: 'Overdraft limit', role: 'comparison' },
          ]}
          values={{
            cash: {
              '04': '2481300.00',
              '05': '2913840.50',
              '06': '2104270.00',
              '07': '1688410.25',
              '08': '2245900.00',
              '09': '3012775.40',
            },
            overdraft: {
              '04': '1500000.00',
              '05': '1500000.00',
              '06': '1500000.00',
              '07': '1500000.00',
              '08': '1500000.00',
              '09': '1500000.00',
            },
          }}
          currency="RSD"
        />
      </div>
    </ExampleProvider>
  ),
}

/** An area: costs over time. */
export const Area: Story = {
  render: () => (
    <ExampleProvider>
      <div className="max-w-180">
        <AreaChart
          title="Operating costs"
          description="Thousands of RSD"
          categories={MONTHS}
          series={[{ key: 'costs', label: 'Costs' }]}
          values={{
            costs: {
              '04': '3120.5',
              '05': '3304.8',
              '06': '3257.0',
              '07': '2894.2',
              '08': '3011.6',
              '09': '3466.9',
            },
          }}
          decimals={1}
        />
      </div>
    </ExampleProvider>
  ),
}

/** A donut: receivables by age, the overdue part as a state (danger). */
export const Donut: Story = {
  render: () => (
    <ExampleProvider>
      <div className="max-w-120">
        <DonutChart
          title="Receivables by age"
          description="RSD, on 06.10.2026."
          currency="RSD"
          slices={[
            { key: 'current', label: 'Not due', value: '1842300.00', share: '62,4 %' },
            { key: 'late30', label: 'Up to 30 days', value: '688120.50', share: '23,3 %' },
            {
              key: 'late',
              label: 'Over 30 days',
              value: '421740.00',
              share: '14,3 %',
              tone: 'danger',
            },
          ]}
        />
      </div>
    </ExampleProvider>
  ),
}

/** The categorical palette: five distinct categories, legend always shown. */
export const Categorical: Story = {
  args: {
    title: 'Revenue by module',
    description: 'Thousands of RSD',
    palette: 'categorical',
    categories: MONTHS.slice(3),
    series: [
      { key: 'sales', label: 'Sales' },
      { key: 'services', label: 'Services' },
      { key: 'rent', label: 'Rent' },
      { key: 'licences', label: 'Licences' },
      { key: 'other', label: 'Other' },
    ],
    values: {
      sales: { '07': '2410.0', '08': '2733.4', '09': '3480.2' },
      services: { '07': '812.3', '08': '905.1', '09': '1120.6' },
      rent: { '07': '420.0', '08': '420.0', '09': '420.0' },
      licences: { '07': '180.2', '08': '233.5', '09': '401.9' },
      other: { '07': '84.0', '08': '129.8', '09': '261.5' },
    },
  },
}

/** "Show as table": the same values, written through the provider's format. */
export const AsTable: Story = {
  name: 'As table',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Show as table' }))
    const table = canvas.getByRole('table', { name: 'Revenue' })
    await expect(within(table).getByRole('rowheader', { name: 'Sep' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show as chart' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}

/** Long titles wrap; the plot keeps its height. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    title: 'Revenue from sales of goods and services to customers in Serbia and abroad',
    description: 'Thousands of RSD, without VAT, after returns and approved discounts',
  },
}

/** Phone width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <ExampleProvider>
          <BarChart {...args} height={200} />
        </ExampleProvider>
      </div>
    </PhoneFrame>
  ),
}

/** Arabic names; the category axis runs from the right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="max-w-180">
        <BarChart
          {...REVENUE}
          title="الإيرادات"
          description="بآلاف الدنانير"
          series={[
            { key: 'y2026', label: '٢٠٢٦' },
            { key: 'y2025', label: '٢٠٢٥' },
          ]}
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese names. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div className="max-w-180">
        <BarChart {...REVENUE} title="売上高" description="千ディナール" />
      </div>
    </StoryProvider>
  ),
}
