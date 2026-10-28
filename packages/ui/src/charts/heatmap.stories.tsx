import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { keysReachMarks, showTable, tableShown } from './chart-story-data'
import { Heatmap, type HeatmapProps } from './heatmap'
import type { ChartCategory, ChartValues } from './shared'

const WEEKDAYS: ChartCategory[] = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
]

const HOURS: ChartCategory[] = Array.from({ length: 13 }, (_, index) => {
  const hour = String(index + 8).padStart(2, '0')
  return { key: hour, label: `${hour}:00` }
})

/**
 * The Beograd store's average sales per hour in September 2026, thousands of RSD (invented): a
 * morning peak of builders, the afternoon of households, Saturday the busiest, Sunday open until
 * 14:00 (the rest "No data").
 */
function hourlySales(): ChartValues {
  const day: Record<string, number> = { mon: 1, tue: 0.94, wed: 0.97, thu: 1.02, fri: 1.12 }
  day.sat = 1.3
  day.sun = 0.62
  const hour = [0.9, 1.25, 1.1, 0.95, 0.8, 0.75, 0.85, 1.0, 1.15, 1.05, 0.8, 0.55, 0.35]
  return Object.fromEntries(
    WEEKDAYS.map((weekday) => [
      weekday.key,
      Object.fromEntries(
        HOURS.map((each, index) => {
          if (weekday.key === 'sun' && index > 5) return [each.key, null]
          const value = 182 * (day[weekday.key] ?? 1) * (hour[index] ?? 1) + ((index * 7) % 11)
          return [each.key, value.toFixed(1)]
        }),
      ),
    ]),
  )
}

const SALES = hourlySales()

const meta = {
  title: 'Charts/Heatmap',
  component: Heatmap,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a value over two dimensions — sales by weekday and hour, absences by ' +
          'team and month — to see when, or where, the most happens.\n\n' +
          '**How:** `rows` (top to bottom), `columns` (from the start), `values` by row and ' +
          'column as decimal strings, and the application’s `breaks` (at most four: five ' +
          'steps), named by the legend through `format` or `stepLabels`. One meaning in shades ' +
          '(`ramp` main or neutral); a missing value is hatched "No data", never 0. The arrows ' +
          'move between the cells. Import from `@veljaos/ui/charts`.\n\n' +
          '**When not:** exact values to compare (a table or a BarChart); one dimension ' +
          '(BarChart or LineChart).',
      },
    },
  },
  args: {
    title: 'Sales by hour',
    description: 'Beograd store, average per hour, thousands of RSD, September 2026',
    rows: WEEKDAYS,
    columns: HOURS,
    values: SALES,
    valueLabel: 'Sales',
    breaks: ['100', '150', '200', '250'],
    decimals: 1,
  },
  render: (args: HeatmapProps) => (
    <ExampleProvider>
      <div className="max-w-180">
        <Heatmap {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof Heatmap>

export default meta

type Story = StoryObj<typeof meta>

/** Weekday × hour in five steps of blue; Sunday afternoon hatched "No data". */
export const Default: Story = {}

/** The application's words for the steps, in neutral grey. */
export const NeutralWithWords: Story = {
  name: 'Neutral, with words',
  args: {
    ramp: 'neutral',
    breaks: ['150', '250'],
    stepLabels: ['Quiet', 'Normal', 'Busy'],
  },
}

/** "Show as table": the weekdays as rows, the hours as columns. */
export const AsTable: Story = {
  name: 'Show as table',
  args: { defaultView: 'table' },
  play: tableShown,
}

/** Phone width: four hour labels, rows 24px high. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Heatmap {...args} layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** The keys: the arrows move between the cells, each announced. */
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

/** No value at all, loading, and an error with Retry. */
export const States: Story = {
  tags: ['!dev'],
  render: (args) => (
    <ExampleProvider>
      <div className="grid max-w-180 gap-4">
        <Heatmap {...args} values={{}} />
        <Heatmap {...args} loading />
        <Heatmap {...args} error={{ onRetry: () => undefined }} />
      </div>
    </ExampleProvider>
  ),
}

/** Arabic: the hours run from the right, the days stand at the right. */
export const Arabic: Story = {
  tags: ['!dev'],
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-180">
          <Heatmap
            {...args}
            title="المبيعات حسب الساعة"
            description="متجر بلغراد، آلاف الدينارات"
            valueLabel="المبيعات"
            rows={WEEKDAYS.map((weekday, index) => ({
              key: weekday.key,
              label:
                ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'][index] ??
                '',
            }))}
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
          <Heatmap
            {...args}
            title="時間帯別売上"
            description="ベオグラード店、千ディナール"
            valueLabel="売上"
            rows={WEEKDAYS.map((weekday, index) => ({
              key: weekday.key,
              label: ['月', '火', '水', '木', '金', '土', '日'][index] ?? '',
            }))}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Long row names: their column grows, the cells share the rest. */
export const LongText: Story = {
  name: 'Long text',
  tags: ['!dev'],
  args: {
    title: 'Average sales per hour of the day in every store of the company, September 2026',
    rows: WEEKDAYS.map((weekday) => ({ ...weekday, label: `${weekday.label}, all stores` })),
  },
}
