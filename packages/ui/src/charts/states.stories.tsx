import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ExampleProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { BarChart, LineChart } from './cartesian'
import { CASH, REVENUE } from './chart-story-data'
import { DonutChart } from './pie'

const meta = {
  title: 'Charts/States',
  component: BarChart,
  parameters: {
    docs: {
      description: {
        component:
          'The states every chart has. **Loading:** a chart-shaped skeleton in the plot’s ' +
          'place, never a spinner. **Empty:** "No data for this period". **Error:** the message ' +
          'with Retry. **Partial data:** a missing value is a gap in the line or a missing bar, ' +
          'never 0. The plot keeps its height in every state.',
      },
    },
  },
  args: { ...REVENUE },
  play: settle,
} satisfies Meta<typeof BarChart>

export default meta

type Story = StoryObj<typeof meta>

/** Loading: columns, bars and a ring as skeletons. */
export const Loading: Story = {
  render: () => (
    <ExampleProvider>
      <div className="grid max-w-220 grid-cols-2 gap-4">
        <BarChart {...REVENUE} loading />
        <DonutChart title="Receivables by age" description="RSD" slices={[]} loading />
      </div>
    </ExampleProvider>
  ),
}

/** No values for the chosen period. */
export const Empty: Story = {
  render: () => (
    <ExampleProvider>
      <div className="max-w-180">
        <BarChart {...REVENUE} values={{}} description="Thousands of RSD, October 2026" />
      </div>
    </ExampleProvider>
  ),
}

/** The load failed: the message and Retry. */
export const Failed: Story = {
  name: 'Error',
  render: () => (
    <ExampleProvider>
      <div className="max-w-180">
        <BarChart
          {...REVENUE}
          error={{
            message: 'The revenue could not be loaded. Check the connection.',
            onRetry: () => undefined,
          }}
        />
      </div>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent('could not be loaded')
    await settle()
  },
}

export const FailedInteraction: Story = {
  name: 'Error, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <div className="max-w-180">
        <BarChart
          {...REVENUE}
          error={{
            message: 'The revenue could not be loaded. Check the connection.',
            onRetry: () => undefined,
          }}
        />
      </div>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent('could not be loaded')
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Retry' }))
  },
}

/** July is missing: the line breaks there (not 0), the bar is absent, the table says "—". */
export const PartialData: Story = {
  name: 'Partial data',
  render: () => (
    <ExampleProvider>
      <div className="flex max-w-180 flex-col gap-4">
        <LineChart {...CASH} values={{ cash: { ...CASH.values.cash, '2026-07': null } }} dots />
        <BarChart
          {...REVENUE}
          values={{
            y2026: { ...REVENUE.values.y2026, '2026-07': null },
            y2025: REVENUE.values.y2025 ?? {},
          }}
        />
      </div>
    </ExampleProvider>
  ),
}
