import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { keysReachMarks, showTable, tableShown } from './chart-story-data'
import { SankeyChart, type SankeyChartProps, type SankeyFlow, type SankeyNode } from './sankey'

/** Kvadrat Gradnja's cash flow in September 2026, RSD (invented); the totals are the Core's. */
const NODES: SankeyNode[] = [
  { key: 'sales', label: 'Customer payments', value: '41250000.00' },
  { key: 'advances', label: 'Advances received', value: '6800000.00' },
  { key: 'loan', label: 'Bank loan', value: '10000000.00' },
  { key: 'bank', label: 'Business account', value: '58050000.00' },
  { key: 'suppliers', label: 'Suppliers', value: '31480000.00' },
  { key: 'salaries', label: 'Salaries', value: '9120000.00' },
  { key: 'taxes', label: 'Taxes and contributions', value: '7860000.00' },
  { key: 'repayment', label: 'Loan repayment', value: '2400000.00' },
  { key: 'balance', label: 'Kept on the account', value: '7190000.00' },
]

const FLOWS: SankeyFlow[] = [
  { source: 'sales', target: 'bank', value: '41250000.00' },
  { source: 'advances', target: 'bank', value: '6800000.00' },
  { source: 'loan', target: 'bank', value: '10000000.00' },
  { source: 'bank', target: 'suppliers', value: '31480000.00' },
  { source: 'bank', target: 'salaries', value: '9120000.00' },
  { source: 'bank', target: 'taxes', value: '7860000.00' },
  { source: 'bank', target: 'repayment', value: '2400000.00' },
  { source: 'bank', target: 'balance', value: '7190000.00' },
]

const meta = {
  title: 'Charts/Sankey',
  component: SankeyChart,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** how amounts flow from sources through accounts to their uses — a cash ' +
          'flow, a budget’s allocation, an energy balance.\n\n' +
          '**How:** `nodes` (each with the application’s total as `value`) and `flows` ' +
          '(`source`, `target`, `value` as a decimal string); the flows must not loop back. ' +
          'Names stand beside their nodes; the flow runs from the page’s start. The arrows walk ' +
          'the nodes, then the flows. Import from `@veljaos/ui/charts`.\n\n' +
          '**When not:** parts of one whole (PieChart, Treemap); a change over time (LineChart).',
      },
    },
  },
  args: {
    title: 'Cash flow',
    description: 'RSD, September 2026',
    nodes: NODES,
    flows: FLOWS,
    valueLabel: 'Amount',
    currency: 'RSD',
  },
  render: (args: SankeyChartProps) => (
    <ExampleProvider>
      <div className="max-w-180">
        <SankeyChart {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof SankeyChart>

export default meta

type Story = StoryObj<typeof meta>

/** Receipts into the business account, and where they went. */
export const Default: Story = {}

/** Three columns: revenue by unit, then where it went; the profit in success. */
export const ThreeColumns: Story = {
  name: 'Three columns',
  args: {
    title: 'Revenue and its use',
    nodes: [
      { key: 'retail', label: 'Retail', value: '18400000.00' },
      { key: 'wholesale', label: 'Wholesale', value: '24600000.00' },
      { key: 'revenue', label: 'Revenue', value: '43000000.00' },
      { key: 'goods', label: 'Cost of goods', value: '31200000.00' },
      { key: 'costs', label: 'Operating costs', value: '9600000.00' },
      { key: 'profit', label: 'Profit', value: '2200000.00', tone: 'success' },
    ],
    flows: [
      { source: 'retail', target: 'revenue', value: '18400000.00' },
      { source: 'wholesale', target: 'revenue', value: '24600000.00' },
      { source: 'revenue', target: 'goods', value: '31200000.00' },
      { source: 'revenue', target: 'costs', value: '9600000.00' },
      { source: 'revenue', target: 'profit', value: '2200000.00' },
    ],
  },
}

/** "Show as table": every flow with its source, target and amount. */
export const AsTable: Story = {
  name: 'Show as table',
  args: { defaultView: 'table' },
  play: tableShown,
}

/** Phone width: the names stay beside their nodes. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <SankeyChart {...args} layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** The keys: the arrows walk the nodes, then the flows. */
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

/** No flows, loading, and an error with Retry. */
export const States: Story = {
  tags: ['!dev'],
  render: (args) => (
    <ExampleProvider>
      <div className="grid max-w-180 gap-4">
        <SankeyChart {...args} flows={[]} />
        <SankeyChart {...args} loading />
        <SankeyChart {...args} error={{ onRetry: () => undefined }} />
      </div>
    </ExampleProvider>
  ),
}

const ARABIC: Record<string, string> = {
  sales: 'مدفوعات العملاء',
  advances: 'دفعات مقدمة',
  loan: 'قرض بنكي',
  bank: 'الحساب التجاري',
  suppliers: 'الموردون',
  salaries: 'الرواتب',
  taxes: 'الضرائب والاشتراكات',
  repayment: 'سداد القرض',
  balance: 'المتبقي في الحساب',
}

/** Arabic: the flow runs from the right. */
export const Arabic: Story = {
  tags: ['!dev'],
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-180">
          <SankeyChart
            {...args}
            title="التدفق النقدي"
            description="بالدينار، سبتمبر 2026"
            valueLabel="المبلغ"
            nodes={NODES.map((node) => ({ ...node, label: ARABIC[node.key] ?? node.label }))}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

const JAPANESE: Record<string, string> = {
  sales: '顧客からの入金',
  advances: '前受金',
  loan: '銀行借入',
  bank: '事業用口座',
  suppliers: '仕入先',
  salaries: '給与',
  taxes: '税金と社会保険',
  repayment: '借入返済',
  balance: '口座残高',
}

/** Japanese. */
export const Japanese: Story = {
  tags: ['!dev'],
  render: (args) => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <div className="max-w-180">
          <SankeyChart
            {...args}
            title="キャッシュフロー"
            description="ディナール、2026年9月"
            valueLabel="金額"
            nodes={NODES.map((node) => ({ ...node, label: JAPANESE[node.key] ?? node.label }))}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Long names stand over the flows on a halo of the card. */
export const LongText: Story = {
  name: 'Long text',
  tags: ['!dev'],
  args: {
    nodes: NODES.map((node) =>
      node.key === 'bank'
        ? { ...node, label: 'Business account at the main bank, dinars' }
        : node.key === 'taxes'
          ? { ...node, label: 'Taxes, contributions and other public charges' }
          : node,
    ),
  },
}
