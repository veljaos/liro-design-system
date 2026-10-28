import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExampleProvider, percentText, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { keysReachMarks, showTable, tableShown } from './chart-story-data'
import { Treemap, type TreemapItem, type TreemapProps } from './treemap'

/** Expenses by account group, January–September 2026, RSD (invented); totals and shares the Core's. */
const EXPENSES: TreemapItem[] = [
  {
    key: '50',
    label: '50 Goods sold',
    value: '182400000.00',
    share: percentText('61.4'),
    children: [
      {
        key: '501',
        label: '501 Goods, wholesale',
        value: '121300000.00',
        share: percentText('40.8'),
      },
      { key: '502', label: '502 Goods, retail', value: '61100000.00', share: percentText('20.6') },
    ],
  },
  {
    key: '52',
    label: '52 Salaries',
    value: '58600000.00',
    share: percentText('19.7'),
    children: [
      { key: '520', label: '520 Gross salaries', value: '48200000.00', share: percentText('16.2') },
      {
        key: '521',
        label: '521 Employer’s contributions',
        value: '7400000.00',
        share: percentText('2.5'),
      },
      {
        key: '529',
        label: '529 Other personnel costs',
        value: '3000000.00',
        share: percentText('1.0'),
      },
    ],
  },
  {
    key: '53',
    label: '53 Services',
    value: '34900000.00',
    share: percentText('11.7'),
    children: [
      { key: '531', label: '531 Transport', value: '12600000.00', share: percentText('4.2') },
      { key: '533', label: '533 Rent', value: '9800000.00', share: percentText('3.3') },
      { key: '532', label: '532 Maintenance', value: '6900000.00', share: percentText('2.3') },
      { key: '539', label: '539 Other services', value: '5600000.00', share: percentText('1.9') },
    ],
  },
  {
    key: '55',
    label: '55 Other costs',
    value: '21200000.00',
    share: percentText('7.2'),
    children: [
      {
        key: '550',
        label: '550 Professional services',
        value: '8100000.00',
        share: percentText('2.7'),
      },
      { key: '553', label: '553 Bank charges', value: '4300000.00', share: percentText('1.4') },
      { key: '555', label: '555 Taxes and fees', value: '5200000.00', share: percentText('1.8') },
      { key: '559', label: '559 Other', value: '3600000.00', share: percentText('1.2') },
    ],
  },
]

const meta = {
  title: 'Charts/Treemap',
  component: Treemap,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** many parts of one whole, in groups — expenses by account group and ' +
          'account, sales by category and product.\n\n' +
          '**How:** `items` (value as a decimal string, the application’s `share`), a group’s ' +
          '`children` one level deep (its total the application’s). Groups take the categorical ' +
          'hues, named in the legend; without groups every block is the main blue. A block names ' +
          'itself where the name fits. Import from `@veljaos/ui/charts`.\n\n' +
          '**When not:** five parts or fewer (PieChart); values to compare precisely ' +
          '(a horizontal BarChart).',
      },
    },
  },
  args: {
    title: 'Expenses by account group',
    description: 'RSD, January–September 2026',
    items: EXPENSES,
    valueLabel: 'Amount',
    shareLabel: 'Share',
    currency: 'RSD',
  },
  render: (args: TreemapProps) => (
    <ExampleProvider>
      <div className="max-w-180">
        <Treemap {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof Treemap>

export default meta

type Story = StoryObj<typeof meta>

/** Four account groups, each a hue; the accounts as blocks. */
export const Default: Story = {}

/** One level: the accounts of the services group, all in the main blue. */
export const OneLevel: Story = {
  name: 'One level',
  args: {
    title: 'Services',
    items: EXPENSES[2]?.children ?? [],
  },
}

/** "Show as table": the groups with their totals, the accounts under them. */
export const AsTable: Story = {
  name: 'Show as table',
  args: { defaultView: 'table' },
  play: tableShown,
}

/** Phone width: only the names that fit; the tooltip and the table say the rest. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Treemap {...args} layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** The keys: the arrows walk the accounts group by group. */
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

/** Empty, loading, and an error with Retry. */
export const States: Story = {
  tags: ['!dev'],
  render: (args) => (
    <ExampleProvider>
      <div className="grid max-w-180 gap-4">
        <Treemap {...args} items={[]} />
        <Treemap {...args} loading />
        <Treemap {...args} error={{ onRetry: () => undefined }} />
      </div>
    </ExampleProvider>
  ),
}

/** Arabic: the blocks laid out from the right. */
export const Arabic: Story = {
  tags: ['!dev'],
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-180">
          <Treemap
            {...args}
            title="المصروفات حسب مجموعة الحسابات"
            description="بالدينار، يناير – سبتمبر 2026"
            valueLabel="المبلغ"
            shareLabel="الحصة"
            items={[
              {
                key: 'goods',
                label: 'البضائع المباعة',
                value: '182400000.00',
                share: percentText('61.4'),
              },
              {
                key: 'salaries',
                label: 'الرواتب',
                value: '58600000.00',
                share: percentText('19.7'),
              },
              {
                key: 'services',
                label: 'الخدمات',
                value: '34900000.00',
                share: percentText('11.7'),
              },
              {
                key: 'other',
                label: 'تكاليف أخرى',
                value: '21200000.00',
                share: percentText('7.2'),
              },
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
          <Treemap
            {...args}
            title="勘定グループ別費用"
            description="ディナール、2026年1月〜9月"
            valueLabel="金額"
            shareLabel="構成比"
            items={[
              {
                key: 'goods',
                label: '売上原価',
                value: '182400000.00',
                share: percentText('61.4'),
              },
              { key: 'salaries', label: '給与', value: '58600000.00', share: percentText('19.7') },
              {
                key: 'services',
                label: 'サービス',
                value: '34900000.00',
                share: percentText('11.7'),
              },
              {
                key: 'other',
                label: 'その他の費用',
                value: '21200000.00',
                share: percentText('7.2'),
              },
            ]}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Long names: a block shows its name only where it fits whole. */
export const LongText: Story = {
  name: 'Long text',
  tags: ['!dev'],
  args: {
    title: 'Expenses of every business unit by account group and account, nine months',
    items: EXPENSES.map((group) => ({
      ...group,
      label: `${group.label} (all business units)`,
    })),
  },
}
