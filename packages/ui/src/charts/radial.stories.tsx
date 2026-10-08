import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { showTable } from './chart-story-data'
import { RadialChart, type RadialChartProps, type RadialItem } from './polar'

/** Plan fulfilment by sales representative, percent of their September target. */
const REPS: RadialItem[] = [
  { key: 'jovana', label: 'Jovana Marić', value: '112' },
  { key: 'nikola', label: 'Nikola Petković', value: '94' },
  { key: 'milan', label: 'Milan Đorđević', value: '71' },
]

/** The budget of September by department, RSD (parts of one ring). */
const BUDGET: RadialItem[] = [
  { key: 'sales', label: 'Sales', value: '1240000' },
  { key: 'warehouse', label: 'Warehouse', value: '860500' },
  { key: 'admin', label: 'Administration', value: '412300' },
]

const meta = {
  title: 'Charts/Radial',
  component: RadialChart,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** progress to a goal — the year’s revenue plan, a budget used — or a ' +
          'few percentages as rings. Never for money over time.\n\n' +
          '**How:** `items` (value as a decimal string), `max` (the goal: the full circle), ' +
          '`labels`, `grid`, `centre` (the application’s text), `stacked` (parts of one ring). ' +
          'Import from `@veljaos/ui/charts`.\n\n' +
          '**When not:** comparing amounts (BarChart); parts of a whole (PieChart).',
      },
    },
  },
  args: {
    title: 'September plan, Nikola Petković',
    description: 'Percent of his target',
    items: [{ key: 'nikola', label: 'Nikola Petković', value: '94' }],
    max: '100',
    percent: true,
  },
  render: (args: RadialChartProps) => (
    <ExampleProvider>
      <div className="max-w-140">
        <RadialChart {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof RadialChart>

export default meta

type Story = StoryObj<typeof meta>

/** "Show as table": the same values as a table; in right-to-left the columns follow the page. */
export const AsTable: Story = {
  name: 'Show as table',
  play: showTable,
}

/** One ring: one person's plan; the title names it. */
export const Simple: Story = {}

/**
 * A ring per representative, each named with its value at its start ("Jovana Marić 112%"); the
 * names identify the rings, so all are the brand blue (owner).
 */
export const WithLabels: Story = {
  name: 'With labels',
  args: {
    title: 'September plan by representative',
    description: 'Percent of each target',
    items: REPS,
    max: '120',
    labels: true,
  },
}

/** Circles behind the rings. */
export const WithGrid: Story = {
  name: 'With grid',
  args: {
    title: 'September plan by representative',
    description: 'Percent of each target',
    items: REPS,
    max: '120',
    labels: true,
    grid: true,
  },
}

/** One value in the centre. */
export const ValueInCentre: Story = {
  name: 'Value in the centre',
  args: {
    title: 'Invoices sent to SEF on time',
    description: 'September 2026',
    items: [{ key: 'onTime', label: 'On time', value: '96.4' }],
    max: '100',
    percent: true,
    decimals: 1,
    centre: { value: '96.4', label: 'on time' },
  },
}

/** Parts of one ring: the budget by department, the legend naming them. */
export const Stacked: Story = {
  args: {
    title: 'Budget used, September 2026',
    description: 'RSD, by department',
    items: BUDGET,
    stacked: true,
    currency: 'RSD',
    centre: { value: '2512800', label: 'of 3.000.000,00 RSD' },
    max: '3000000',
  },
}

/** Progress to the year's plan: the goal is the full circle. */
export const Goal: Story = {
  name: 'Progress to a goal',
  args: {
    title: 'Revenue plan 2026',
    description: 'RSD, January–September',
    items: [{ key: 'done', label: 'Achieved', value: '52430000' }],
    max: '68000000',
    palette: 'default',
    currency: 'RSD',
    centre: { value: '52430000', label: 'of 68.000.000,00 RSD' },
  },
}

/** Phone width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <RadialChart
            title="September plan by representative"
            description="Percent of each target"
            items={REPS}
            max="120"
            percent
            labels
            layout="phone"
          />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic names in a right-to-left page: the rings run counter-clockwise. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-140">
          <RadialChart
            title="تحقيق الخطة حسب المندوب"
            description="نسبة مئوية من الهدف"
            max="120"
            percent
            labels
            items={[
              { key: 'a', label: 'يوفانا', value: '112' },
              { key: 'b', label: 'نيكولا', value: '94' },
              { key: 'c', label: 'ميلان', value: '71' },
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
          <RadialChart
            title="2026年の売上計画"
            description="ディナール"
            currency="RSD"
            items={[{ key: 'done', label: '達成', value: '52430000' }]}
            max="68000000"
            centre={{ value: '52430000', label: '目標 68.000.000,00 RSD' }}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Long names wrap in the legend. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    title: 'Plan fulfilment of the sales representatives for wholesale customers, September 2026',
    max: '120',
    labels: true,
    items: [
      { key: 'jovana', label: 'Jovana Marić, wholesale Vojvodina', value: '112' },
      { key: 'nikola', label: 'Nikola Petković, wholesale Beograd and Šumadija', value: '94' },
      { key: 'milan', label: 'Milan Đorđević, wholesale southern Serbia', value: '71' },
    ],
  },
}
