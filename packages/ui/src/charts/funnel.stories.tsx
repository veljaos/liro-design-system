import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExampleProvider, percentText, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { keysReachMarks, showTable, tableShown } from './chart-story-data'
import { FunnelChart, type FunnelChartProps, type FunnelStage } from './funnel'

/** The sales pipeline of the third quarter of 2026 (invented); the conversions are the CRM's. */
const PIPELINE: FunnelStage[] = [
  { key: 'leads', label: 'Leads', value: '1240', share: percentText('100') },
  { key: 'qualified', label: 'Qualified', value: '620', share: percentText('50.0') },
  { key: 'offer', label: 'Offer sent', value: '248', share: percentText('20.0') },
  { key: 'negotiation', label: 'Negotiation', value: '112', share: percentText('9.0') },
  { key: 'won', label: 'Won', value: '54', share: percentText('4.4'), tone: 'success' },
]

const meta = {
  title: 'Charts/Funnel',
  component: FunnelChart,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** how many reach each stage of a process — a sales pipeline, an ' +
          'onboarding, a recruitment.\n\n' +
          '**How:** `stages` from the first down (value as a decimal string, the application’s ' +
          '`share` as text), `valueLabel` and `shareLabel` name them in the tooltip and the ' +
          'table; a stage that means a state takes a `tone`. Each stage is named at the start of ' +
          'its row. Import from `@veljaos/ui/charts`.\n\n' +
          '**When not:** stages that do not narrow (a BarChart); parts of one whole (PieChart).',
      },
    },
  },
  args: {
    title: 'Sales pipeline',
    description: 'Deals, July–September 2026',
    stages: PIPELINE,
    valueLabel: 'Deals',
    shareLabel: 'Of leads',
  },
  render: (args: FunnelChartProps) => (
    <ExampleProvider>
      <div className="max-w-140">
        <FunnelChart {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof FunnelChart>

export default meta

type Story = StoryObj<typeof meta>

/** Five stages; the won deals in success, the rest in the main blue. */
export const Default: Story = {}

/** Amounts instead of counts: the pipeline's value in RSD. */
export const Amounts: Story = {
  args: {
    title: 'Pipeline value',
    description: 'RSD, without VAT, July–September 2026',
    valueLabel: 'Value',
    currency: 'RSD',
    stages: [
      { key: 'leads', label: 'Leads', value: '186400000.00', share: percentText('100') },
      { key: 'qualified', label: 'Qualified', value: '112300000.00', share: percentText('60.2') },
      { key: 'offer', label: 'Offer sent', value: '64850000.00', share: percentText('34.8') },
      { key: 'won', label: 'Won', value: '21640000.00', share: percentText('11.6') },
    ],
  },
}

/** "Show as table": the stages with their values and conversions. */
export const AsTable: Story = {
  name: 'Show as table',
  args: { defaultView: 'table' },
  play: tableShown,
}

/** Phone width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <FunnelChart {...args} layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** The keys: ArrowDown reaches the stages one by one. */
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

/** Empty, loading and an error with Retry. */
export const States: Story = {
  tags: ['!dev'],
  render: (args) => (
    <ExampleProvider>
      <div className="grid max-w-140 gap-4">
        <FunnelChart {...args} stages={[]} />
        <FunnelChart {...args} loading />
        <FunnelChart {...args} error={{ onRetry: () => undefined }} />
      </div>
    </ExampleProvider>
  ),
}

/** Arabic names in a right-to-left page. */
export const Arabic: Story = {
  tags: ['!dev'],
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-140">
          <FunnelChart
            {...args}
            title="مسار المبيعات"
            description="الصفقات، يوليو – سبتمبر 2026"
            valueLabel="الصفقات"
            shareLabel="من العملاء المحتملين"
            stages={[
              { key: 'leads', label: 'عملاء محتملون', value: '1240', share: percentText('100') },
              { key: 'qualified', label: 'مؤهلون', value: '620', share: percentText('50.0') },
              { key: 'offer', label: 'عرض مرسل', value: '248', share: percentText('20.0') },
              { key: 'won', label: 'صفقات رابحة', value: '54', share: percentText('4.4') },
            ]}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese names. */
export const Japanese: Story = {
  tags: ['!dev'],
  render: (args) => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <div className="max-w-140">
          <FunnelChart
            {...args}
            title="販売パイプライン"
            description="案件数、2026年7月〜9月"
            valueLabel="案件"
            shareLabel="見込み客比"
            stages={[
              { key: 'leads', label: '見込み客', value: '1240', share: percentText('100') },
              { key: 'qualified', label: '有望', value: '620', share: percentText('50.0') },
              { key: 'offer', label: '見積提出', value: '248', share: percentText('20.0') },
              { key: 'won', label: '受注', value: '54', share: percentText('4.4') },
            ]}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Long stage names wrap in their column at the start, never cut. */
export const LongText: Story = {
  name: 'Long text',
  tags: ['!dev'],
  args: {
    title: 'Sales pipeline of every business unit and every sales channel this quarter',
    stages: [
      { key: 'leads', label: 'Leads from the website and fairs', value: '1240' },
      { key: 'qualified', label: 'Qualified by the sales team', value: '620' },
      { key: 'offer', label: 'Offer sent with a price list', value: '248' },
      { key: 'won', label: 'Won and invoiced', value: '54' },
    ],
  },
}
