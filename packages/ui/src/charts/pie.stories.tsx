import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SelectField } from '../components/select-field'
import { ExampleProvider, percentText, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { PieChart, type PieChartProps, type PieSlice } from './pie'

/** Receivables by age on 06.10.2026., RSD; the shares are the application's. */
const RECEIVABLES: PieSlice[] = [
  { key: 'current', label: 'Not due', value: '1842300.00', share: percentText('62.4') },
  { key: 'late30', label: 'Up to 30 days', value: '688120.50', share: percentText('23.3') },
  {
    key: 'late',
    label: 'Over 30 days',
    value: '421740.00',
    share: percentText('14.3'),
    tone: 'danger',
  },
]

/** Costs by group, September 2026, RSD (four parts: the categorical palette). */
const COST_GROUPS: PieSlice[] = [
  { key: 'goods', label: 'Goods', value: '3480412.60', share: percentText('73.6') },
  { key: 'salaries', label: 'Salaries', value: '871200.00', share: percentText('18.4') },
  { key: 'transport', label: 'Transport', value: '248610.00', share: percentText('5.3') },
  { key: 'other', label: 'Other', value: '128954.80', share: percentText('2.7') },
]

/** The same groups in August, for the second ring. */
const COST_GROUPS_AUGUST: PieSlice[] = [
  { key: 'goods', label: 'Goods', value: '2702904.15', share: percentText('70.1') },
  { key: 'salaries', label: 'Salaries', value: '856500.00', share: percentText('22.2') },
  { key: 'transport', label: 'Transport', value: '195040.20', share: percentText('5.1') },
  { key: 'other', label: 'Other', value: '100000.00', share: percentText('2.6') },
]

const meta = {
  title: 'Charts/Pie',
  component: PieChart,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** parts of one whole, five or fewer — receivables by age, costs by group. ' +
          'Slices 2px apart; the shares come from the application.\n\n' +
          '**How:** `slices` (value as a decimal string, `share` as text, `tone` for a state); ' +
          '`donut`, `labels` (`outside`, `inside`, `none` with the legend), `labelText`, ' +
          '`activeKey`, `centre` (the application’s total), `outerRing`. Import from ' +
          '`@veljaos/ui/charts`.\n\n' +
          '**When not:** more than five parts, or parts to compare precisely (BarChart); change ' +
          'over time (LineChart).',
      },
    },
  },
  args: {
    title: 'Receivables by age',
    description: 'RSD, on 06.10.2026.',
    currency: 'RSD',
    slices: RECEIVABLES,
  },
  render: (args: PieChartProps) => (
    <ExampleProvider>
      <div className="max-w-140">
        <PieChart {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof PieChart>

export default meta

type Story = StoryObj<typeof meta>

/** A full disc, each slice named with its share outside (never colour alone). */
export const Simple: Story = {}

/** The amounts outside instead of the shares. */
export const WithLabels: Story = { name: 'With labels', args: { labelText: 'value' } }

/** The shares inside the slices, each on a small raised tag; the legend names the colours. */
export const LabelList: Story = { name: 'Label list', args: { labels: 'inside', legend: true } }

/** No labels: the legend names each slice with its share. */
export const WithLegend: Story = { name: 'With legend', args: { labels: 'none' } }

/** A ring. */
export const Donut: Story = { args: { donut: true } }

/** One slice drawn larger: the overdue part. */
export const DonutActive: Story = { name: 'Donut active', args: { donut: true, activeKey: 'late' } }

/** The total in the centre, as the application sends it. */
export const DonutWithTotal: Story = {
  name: 'Donut with total',
  args: { labels: 'none', centre: { value: '2952160.50', label: 'Total receivables' } },
}

/** Two rings: September inside, August outside; each group keeps its colour in both. */
export const Stacked: Story = {
  name: 'Stacked (two rings)',
  args: {
    title: 'Costs by group',
    description: 'RSD; September inside, August outside',
    slices: COST_GROUPS,
    palette: 'categorical',
    donut: true,
    ringLabel: 'September 2026',
    outerRing: { label: 'August 2026', slices: COST_GROUPS_AUGUST },
  },
}

function Interactive({ phone = false }: { phone?: boolean }) {
  const [active, setActive] = useState('late')
  return (
    <PieChart
      title="Receivables by age"
      description="RSD, on 06.10.2026."
      currency="RSD"
      donut
      labels="none"
      layout={phone ? 'phone' : 'desktop'}
      slices={RECEIVABLES}
      activeKey={active}
      centre={{
        value: RECEIVABLES.find((slice) => slice.key === active)?.value ?? '0',
        label: RECEIVABLES.find((slice) => slice.key === active)?.label ?? '',
      }}
      controls={
        <SelectField
          label="Age shown"
          hideLabel
          value={active}
          onChange={setActive}
          className="w-44"
          options={RECEIVABLES.map((slice) => ({ value: slice.key, label: slice.label }))}
        />
      }
    />
  )
}

/** A select in the header picks the slice: it stands out and its amount is in the centre. */
export const InteractiveStory: Story = {
  name: 'Interactive',
  render: () => (
    <ExampleProvider>
      <div className="max-w-140">
        <Interactive />
      </div>
    </ExampleProvider>
  ),
}

/** Phone width: the legend under the ring, the select under the title. */
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

/** Arabic names in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-140">
          <PieChart
            title="الذمم المدينة حسب العمر"
            description="بالدينار"
            currency="RSD"
            donut
            slices={[
              {
                key: 'current',
                label: 'غير مستحقة',
                value: '1842300.00',
                share: percentText('62.4'),
              },
              {
                key: 'late30',
                label: 'حتى 30 يومًا',
                value: '688120.50',
                share: percentText('23.3'),
              },
              {
                key: 'late',
                label: 'أكثر من 30 يومًا',
                value: '421740.00',
                share: percentText('14.3'),
                tone: 'danger',
              },
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
          <PieChart
            title="費用の内訳"
            description="ディナール、2026年9月"
            currency="RSD"
            palette="categorical"
            labels="none"
            slices={[
              { key: 'goods', label: '商品', value: '3480412.60', share: percentText('73.6') },
              { key: 'salaries', label: '給与', value: '871200.00', share: percentText('18.4') },
              { key: 'transport', label: '運送', value: '248610.00', share: percentText('5.3') },
              { key: 'other', label: 'その他', value: '128954.80', share: percentText('2.7') },
            ]}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Long names: outside labels stay in the plot; the legend wraps. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    title: 'Receivables from customers in the country by age, all business units',
    labels: 'none',
    slices: [
      {
        key: 'current',
        label: 'Not yet due under the agreed terms',
        value: '1842300.00',
        share: percentText('62.4'),
      },
      {
        key: 'late30',
        label: 'Overdue up to 30 days',
        value: '688120.50',
        share: percentText('23.3'),
      },
      {
        key: 'late',
        label: 'Overdue more than 30 days, reminders sent',
        value: '421740.00',
        share: percentText('14.3'),
        tone: 'danger',
      },
    ],
  },
}
