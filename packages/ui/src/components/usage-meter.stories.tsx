import type { Meta, StoryObj } from '@storybook/react-vite'
import { UserPlus } from 'lucide-react'
import { expect, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import { UsageMeter } from './usage-meter'

const meta = {
  title: 'Components/Administration/UsageMeter',
  component: UsageMeter,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** how much of an allowance is used — the users of a licence, storage, ' +
          'documents sent this month, connections — in words (“24 of 30”, “38,4 GB of 100 GB”) ' +
          'and as a bar named by what is counted. The amounts are decimal strings written ' +
          'through `format`; the bar is only a picture of them. Whether an amount is near or ' +
          'over its limit is the application’s `state`, in words and tone: the meter never turns ' +
          'a figure into a state (D30). A note and the application’s action may follow.\n\n' +
          '**When to use:** an allowance with a limit (or none) that the user manages: seats, ' +
          'storage, quotas. **When not:** the progress of a job or an upload (ProgressBar, ' +
          'JobProgress); a dashboard number without a limit (StatCard); a monitored thing’s ' +
          'health (HealthList).',
      },
    },
  },
  args: { label: 'Users', used: '24', limit: '30' },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-sm">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof UsageMeter>

export default meta

type Story = StoryObj<typeof meta>

/** "24 of 30" over a bar named "Users". */
export const Default: Story = {
  args: { note: 'Included in your plan: 30 users.' },
  play: async ({ canvasElement }) => {
    await settle()
    const bar = within(canvasElement).getByRole('progressbar', { name: 'Users' })
    await expect(bar).toHaveAttribute('aria-valuetext', '24 of 30')
  },
}

/** An amount with its unit, decimals written as the tenant writes them. */
export const WithUnit: Story = {
  name: 'With unit',
  args: {
    label: 'Storage',
    used: '38.4',
    limit: '100',
    unit: 'GB',
    note: 'Files and attachments.',
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('38,4 GB of 100 GB')
  },
}

/** The application says it is near the limit, with its action. */
export const NearTheLimit: Story = {
  name: 'Near the limit',
  args: {
    label: 'Users',
    used: '28',
    limit: '30',
    state: { label: 'Near the limit', tone: 'warning' },
    note: '2 users left on your plan.',
    action: <Button family="neutral" icon={UserPlus} label="Add users" emphasis="secondary" />,
  },
}

/** Over the limit: a full bar; the words and the application's danger state say so. */
export const OverTheLimit: Story = {
  name: 'Over the limit',
  args: {
    label: 'E-invoices sent this month',
    used: '1080',
    limit: '1000',
    state: { label: 'Over the limit', tone: 'danger' },
    note: 'Each one over the limit costs 12,00 RSD.',
  },
  play: async ({ canvasElement }) => {
    await settle()
    const bar = within(canvasElement).getByRole('progressbar', {
      name: 'E-invoices sent this month',
    })
    await expect(bar).toHaveAttribute('aria-valuetext', '1.080 of 1.000')
  },
}

/** Without a limit: the amount in words, no bar. */
export const NoLimit: Story = {
  name: 'No limit',
  args: { label: 'Bank connections', used: '4', limit: null },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('4 used, no limit')
    await expect(within(canvasElement).queryByRole('progressbar')).toBeNull()
  },
}

/** The application's own words for the amounts. */
export const OwnWords: Story = {
  name: 'Own words',
  args: { label: 'Users', used: '24', limit: '30', valueText: '24 users, 6 seats free' },
}

/** While the amounts load: skeletons. */
export const Loading: Story = {
  args: { loading: true },
}

/** Several allowances in a grid, as an overview shows them. */
export const Several: Story = {
  render: () => (
    <div className="grid gap-6">
      <UsageMeter label="Users" used="24" limit="30" />
      <UsageMeter label="Storage" used="38.4" limit="100" unit="GB" />
      <UsageMeter
        label="E-invoices sent this month"
        used="412"
        limit="1000"
        note="Resets on 01.11.2026."
      />
      <UsageMeter label="Bank connections" used="2" limit={null} />
    </div>
  ),
}

/** Long names and notes wrap; the amounts stay together. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    label: 'Documents received through the electronic exchange and recognised automatically',
    used: '12480',
    limit: '15000',
    state: { label: 'Near the limit of this billing period', tone: 'warning' },
    note: 'The allowance resets on the first day of every month; documents over it are still received and are charged separately on the next invoice.',
  },
}

/** Phone width. */
export const Phone: Story = {
  args: { state: { label: 'Near the limit', tone: 'warning' }, used: '28' },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="p-4">
            <Story />
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic: the bar fills from the right. */
export const Arabic: Story = {
  args: { label: 'المستخدمون', used: '24', limit: '30', note: 'مشمول في خطتك: 30 مستخدمًا.' },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <div className="max-w-sm">
            <Story />
          </div>
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Japanese. */
export const Japanese: Story = {
  args: {
    label: 'ストレージ',
    used: '38.4',
    limit: '100',
    unit: 'GB',
    note: 'ファイルと添付資料。',
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <div className="max-w-sm">
            <Story />
          </div>
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}
