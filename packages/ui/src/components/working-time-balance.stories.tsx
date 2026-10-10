import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { BALANCE_PLAN, BALANCE_ROWS } from './shift-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import { WorkingTimeBalance } from './working-time-balance'

const meta = {
  title: 'Components/Working time/WorkingTimeBalance',
  component: WorkingTimeBalance,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** working-time redistribution — a plan that spreads a period’s hours ' +
          'unevenly over its weeks (the header: the period, the reference average with the ' +
          'application’s label, each week’s planned hours), and per person the balance: ' +
          'planned, worked, the difference (signed), the running average per week, and the ' +
          'application’s warnings with an icon and words (“Average above the illustrative limit ' +
          'of 48 h”). Everything is computed by the application; a missing value is “—”, never ' +
          '0. No legal limit is encoded: the stories’ limits are illustrative.\n\n' +
          '**Phones:** DataTable’s cards.\n\n' +
          '**When:** a period whose hours are planned unevenly and balanced over time.\n\n' +
          '**When not:** the daily hours themselves (the timesheet); planning shifts ' +
          '(ShiftPlanner).',
      },
    },
  },
  args: { label: 'Balance, Prodavnica 12', plan: BALANCE_PLAN, rows: BALANCE_ROWS },
  render: (args) => (
    <ExampleProvider>
      <WorkingTimeBalance {...args} title="Redistribution, 07.09.–04.10.2026." />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof WorkingTimeBalance>

export default meta

type Story = StoryObj<typeof meta>

/** Four weeks of 48, 44, 36 and 32 h; warnings from the application; a row not yet worked. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('+36 h')).toBeVisible()
    await expect(canvas.getByText('Average above the illustrative limit of 48 h')).toBeVisible()
    await expect(canvas.getByText('Reference average per week (illustrative)')).toBeVisible()
  },
}

/** On a phone: the weeks wrap, the people are DataTable's cards. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <WorkingTimeBalance {...args} layout="cards" headingLevel={3} title="Redistribution" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Without a title or a reference average; the table forced (even on a phone). */
export const Plain: Story = {
  render: (args) => (
    <ExampleProvider>
      <WorkingTimeBalance
        {...args}
        plan={{ ...BALANCE_PLAN, reference: { label: 'Reference average', hours: null } }}
        layout="table"
      />
    </ExampleProvider>
  ),
}

/** Loading: the header is known, the rows load. */
export const Loading: Story = {
  render: (args) => (
    <ExampleProvider>
      <WorkingTimeBalance {...args} rows={[]} loading />
    </ExampleProvider>
  ),
}

/** No people in the plan yet. */
export const Empty: Story = {
  render: (args) => (
    <ExampleProvider>
      <WorkingTimeBalance {...args} rows={[]} />
    </ExampleProvider>
  ),
}

/** Long names and warnings wrap. */
export const LongText: Story = {
  name: 'Long text',
  render: (args) => (
    <ExampleProvider>
      <WorkingTimeBalance
        {...args}
        plan={{
          ...BALANCE_PLAN,
          reference: {
            label:
              'Reference average per week agreed in the collective agreement for retail (illustrative)',
            hours: '40',
          },
        }}
        rows={[
          {
            id: 'long',
            name: 'Aleksandra Milovanović-Stanojević',
            subtitle:
              'Shelves and stock, responsible for the deliveries from the central warehouse',
            planned: '160',
            worked: '201.25',
            difference: '41.25',
            average: '50.3125',
            warnings: [
              {
                tone: 'danger',
                text: 'Average above the illustrative limit of 48 h over the period; reduce the hours planned for the last two weeks or extend the period',
              },
            ],
          },
        ]}
      />
    </ExampleProvider>
  ),
}

/** Arabic, right to left. */
export const Arabic: Story = {
  render: (args) => (
    <StoryProvider locale="ar">
      <WorkingTimeBalance
        {...args}
        label="رصيد ساعات العمل"
        title="إعادة توزيع ساعات العمل"
        plan={{ ...BALANCE_PLAN, reference: { label: 'المتوسط المرجعي (توضيحي)', hours: '40' } }}
        rows={[
          {
            id: 'a',
            name: 'سارة أحمد',
            subtitle: 'أمينة صندوق',
            planned: '160',
            worked: '172',
            difference: '12',
            average: '43',
            warnings: [{ tone: 'warning', text: 'المتوسط أعلى من المرجع' }],
          },
        ]}
      />
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: (args) => (
    <StoryProvider locale="ja">
      <WorkingTimeBalance
        {...args}
        label="労働時間の残高"
        title="変形労働時間制"
        plan={{ ...BALANCE_PLAN, reference: { label: '基準平均（例示）', hours: '40' } }}
        rows={[
          {
            id: 'j',
            name: '佐藤 花子',
            subtitle: 'レジ',
            planned: '160',
            worked: '150',
            difference: '-10',
            average: '37.5',
          },
        ]}
      />
    </StoryProvider>
  ),
}
