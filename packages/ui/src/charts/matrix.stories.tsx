import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { keysReachMarks, showTable, tableShown } from './chart-story-data'
import { MatrixChart, type MatrixChartProps, type MatrixItem, type MatrixLevel } from './matrix'
import type { ChartCategory } from './shared'

const LIKELIHOOD: ChartCategory[] = [
  { key: '5', label: 'Almost certain' },
  { key: '4', label: 'Likely' },
  { key: '3', label: 'Possible' },
  { key: '2', label: 'Unlikely' },
  { key: '1', label: 'Rare' },
]

const IMPACT: ChartCategory[] = [
  { key: '1', label: 'Insignificant' },
  { key: '2', label: 'Minor' },
  { key: '3', label: 'Moderate' },
  { key: '4', label: 'Major' },
  { key: '5', label: 'Severe' },
]

const LEVELS: MatrixLevel[] = [
  { key: 'low', label: 'Low', tone: 'success' },
  { key: 'medium', label: 'Medium', tone: 'neutral' },
  { key: 'high', label: 'High', tone: 'warning' },
  { key: 'critical', label: 'Critical', tone: 'danger' },
]

/** The company's scoring (the application's): likelihood × impact. */
function levelsByScore(): Record<string, Record<string, string>> {
  return Object.fromEntries(
    LIKELIHOOD.map((row) => [
      row.key,
      Object.fromEntries(
        IMPACT.map((column) => {
          const score = Number(row.key) * Number(column.key)
          const level =
            score <= 4 ? 'low' : score <= 9 ? 'medium' : score <= 16 ? 'high' : 'critical'
          return [column.key, level]
        }),
      ),
    ]),
  )
}

/** The risk register of Kvadrat Gradnja, October 2026 (invented). */
const RISKS: MatrixItem[] = [
  { key: 'r1', label: 'Late deliveries from the tile factory', row: '4', column: '3' },
  { key: 'r2', label: 'Customer insolvency (top 5)', row: '3', column: '4' },
  { key: 'r3', label: 'Euro exchange rate rise', row: '4', column: '2' },
  { key: 'r4', label: 'Warehouse fire', row: '1', column: '5' },
  { key: 'r5', label: 'Key accountant leaves', row: '2', column: '3' },
  { key: 'r6', label: 'Server outage', row: '3', column: '3' },
  { key: 'r7', label: 'Price war with a new competitor', row: '4', column: '4' },
  { key: 'r8', label: 'Fiscal device failure', row: '2', column: '2' },
  { key: 'r9', label: 'Truck accident', row: '2', column: '4' },
  { key: 'r10', label: 'Theft from the yard', row: '3', column: '2' },
  { key: 'r11', label: 'Tax audit finding', row: '2', column: '3' },
]

const meta = {
  title: 'Charts/Matrix',
  component: MatrixChart,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** items placed by two scales, each cell coloured by its level — a risk ' +
          'matrix of likelihood × impact, a priority matrix.\n\n' +
          '**How:** `rows` (top to bottom), `columns` (from the start), each scale named ' +
          '(`rowLabel`, `columnLabel`); the application’s `levels` with their tones and ' +
          '`cellLevels` (the level of each cell); `items` placed by row and column. Each cell ' +
          'writes how many items it holds; the tooltip and the table name them. Import from ' +
          '`@veljaos/ui/charts`.\n\n' +
          '**When not:** values to compare (Heatmap, BarChart); a long list of items to work ' +
          'through (DataTable).',
      },
    },
  },
  args: {
    title: 'Risk matrix',
    description: 'Open risks, October 2026',
    rows: LIKELIHOOD,
    columns: IMPACT,
    rowLabel: 'Likelihood',
    columnLabel: 'Impact',
    levels: LEVELS,
    cellLevels: levelsByScore(),
    items: RISKS,
  },
  render: (args: MatrixChartProps) => (
    <ExampleProvider>
      <div className="max-w-180">
        <MatrixChart {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof MatrixChart>

export default meta

type Story = StoryObj<typeof meta>

/** Five by five, four levels; each cell's count of risks. */
export const Default: Story = {}

/** Three by three, the application's own levels. */
export const ThreeByThree: Story = {
  name: 'Three by three',
  args: {
    rows: [
      { key: 'h', label: 'High' },
      { key: 'm', label: 'Medium' },
      { key: 'l', label: 'Low' },
    ],
    columns: [
      { key: 'l', label: 'Low' },
      { key: 'm', label: 'Medium' },
      { key: 'h', label: 'High' },
    ],
    levels: [
      { key: 'watch', label: 'Watch', tone: 'neutral' },
      { key: 'plan', label: 'Plan a response', tone: 'warning' },
      { key: 'act', label: 'Act now', tone: 'danger' },
    ],
    cellLevels: {
      h: { l: 'plan', m: 'act', h: 'act' },
      m: { l: 'watch', m: 'plan', h: 'act' },
      l: { l: 'watch', m: 'watch', h: 'plan' },
    },
    items: [
      { key: 'a', label: 'Supplier delay', row: 'h', column: 'm' },
      { key: 'b', label: 'Data loss', row: 'l', column: 'h' },
      { key: 'c', label: 'Staff turnover', row: 'm', column: 'm' },
      { key: 'd', label: 'Price change', row: 'h', column: 'l' },
    ],
  },
}

/** "Show as table": the matrix with each cell's level and its risks. */
export const AsTable: Story = {
  name: 'Show as table',
  args: { defaultView: 'table' },
  play: tableShown,
}

/** Phone width: rows 48px high, the legend under the matrix. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <MatrixChart {...args} layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** The keys: the arrows move between the cells, each announced with its risks. */
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

/** No risks yet, loading, and an error with Retry. */
export const States: Story = {
  tags: ['!dev'],
  render: (args) => (
    <ExampleProvider>
      <div className="grid max-w-180 gap-4">
        <MatrixChart {...args} items={[]} />
        <MatrixChart {...args} loading />
        <MatrixChart {...args} error={{ onRetry: () => undefined }} />
      </div>
    </ExampleProvider>
  ),
}

/** Arabic: the impact runs from the right. */
export const Arabic: Story = {
  tags: ['!dev'],
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-180">
          <MatrixChart
            {...args}
            title="مصفوفة المخاطر"
            description="المخاطر المفتوحة، أكتوبر 2026"
            rowLabel="الاحتمالية"
            columnLabel="الأثر"
            rows={LIKELIHOOD.map((row, index) => ({
              key: row.key,
              label: ['شبه مؤكد', 'محتمل', 'ممكن', 'غير محتمل', 'نادر'][index] ?? '',
            }))}
            columns={IMPACT.map((column, index) => ({
              key: column.key,
              label: ['ضئيل', 'طفيف', 'متوسط', 'كبير', 'جسيم'][index] ?? '',
            }))}
            levels={LEVELS.map((level, index) => ({
              ...level,
              label: ['منخفض', 'متوسط', 'مرتفع', 'حرج'][index] ?? '',
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
          <MatrixChart
            {...args}
            title="リスクマトリクス"
            description="未対応のリスク、2026年10月"
            rowLabel="発生可能性"
            columnLabel="影響度"
            rows={LIKELIHOOD.map((row, index) => ({
              key: row.key,
              label: ['ほぼ確実', '高い', '中程度', '低い', 'まれ'][index] ?? '',
            }))}
            columns={IMPACT.map((column, index) => ({
              key: column.key,
              label: ['軽微', '小', '中', '大', '重大'][index] ?? '',
            }))}
            levels={LEVELS.map((level, index) => ({
              ...level,
              label: ['低', '中', '高', '重大'][index] ?? '',
            }))}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Long scale names wrap in their column, never cut. */
export const LongText: Story = {
  name: 'Long text',
  tags: ['!dev'],
  args: {
    title: 'Risk matrix of every open risk in the company’s register, all business units',
    rows: LIKELIHOOD.map((row) => ({ ...row, label: `${row.label} within a year` })),
  },
}
