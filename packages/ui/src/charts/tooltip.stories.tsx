import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ExampleProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { BarChart, type BarChartProps } from './cartesian'
import { COSTS, REVENUE } from './chart-story-data'

/** Costs in RSD, with the month's total from the application. */
const COSTS_RSD: BarChartProps = {
  ...COSTS,
  stack: 'stacked',
  description: 'RSD',
  values: {
    goods: { '2026-09': '3480412.60', '2026-08': '2702904.15' },
    salaries: { '2026-09': '871200.00', '2026-08': '856500.00' },
    transport: { '2026-09': '388610.00', '2026-08': '295040.20' },
  },
  categories: [
    { key: '2026-08', label: 'Aug' },
    { key: '2026-09', label: 'Sep' },
  ],
  currency: 'RSD',
  decimals: 2,
}

const meta = {
  title: 'Charts/Tooltip',
  component: BarChart,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the values of one category on hover or from the keyboard (focus the ' +
          'plot, then the arrow keys; Enter shows or hides it). It adds nothing that "Show as ' +
          'table" does not have.\n\n' +
          '**How:** every chart’s `tooltip` option: `indicator` (`dot`, `line`, `dashed`, ' +
          '`none`), `label` (a function, or `false`), `total` (the application’s total per ' +
          'category), `defaultCategory` (shown from the start). Values are written from their decimal strings, never rounded: with ' +
          '`currency` as amounts.',
      },
    },
  },
  args: { ...REVENUE },
  render: (args: BarChartProps) => (
    <ExampleProvider>
      <div className="max-w-140 pb-24">
        <BarChart {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof BarChart>

export default meta

type Story = StoryObj<typeof meta>

/** The category, then a square swatch, the name and the value per series. */
export const Default: Story = { args: { tooltip: { defaultCategory: '2026-09' } } }

/** A line beside each value. */
export const LineIndicator: Story = {
  name: 'Line indicator',
  args: { tooltip: { indicator: 'line', defaultCategory: '2026-09' } },
}

/** No swatches: names and values only. */
export const NoIndicator: Story = {
  name: 'No indicator',
  args: { tooltip: { indicator: 'none', defaultCategory: '2026-09' } },
}

/** The application's own title for the category. */
export const CustomLabel: Story = {
  name: 'Custom label',
  args: {
    tooltip: {
      label: (category) => `${category.label} 2026 against ${category.label} 2025`,
      defaultCategory: '2026-09',
    },
  },
}

/** Amounts written in full from their strings: 3.480.412,60 RSD, never rounded. */
export const FormattedValues: Story = {
  name: 'Formatted values',
  args: { ...COSTS_RSD, tooltip: { defaultCategory: '2026-09' } },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('.recharts-tooltip-wrapper')).toHaveTextContent(
      '3.480.412,60',
    )
  },
}

/** A total row under the values: the application's total, never added here. */
export const WithTotal: Story = {
  name: 'With a total row',
  args: {
    ...COSTS_RSD,
    tooltip: {
      indicator: 'line',
      total: { label: 'Total', values: { '2026-08': '3854444.35', '2026-09': '4740222.60' } },
      defaultCategory: '2026-09',
    },
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('.recharts-tooltip-wrapper')).toHaveTextContent(
      '4.740.222,60',
    )
  },
}
