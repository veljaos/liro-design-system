import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileText, RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { CodeHighlighting } from '../code'
import { settle } from '../primitives/story-helpers'
import { HealthList, type HealthItem } from './health-list'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** The application's words and tones for the states (its status-to-tone map). */
const UP = { kind: 'up', label: 'Up', tone: 'success' } as const
const DEGRADED = { kind: 'degraded', label: 'Degraded', tone: 'warning' } as const
const DOWN = { kind: 'down', label: 'Down', tone: 'danger' } as const
const MAINTENANCE = { kind: 'maintenance', label: 'Maintenance', tone: 'neutral' } as const
const UNKNOWN = { kind: 'unknown', label: 'No report', tone: 'neutral' } as const

/** The bank's raw answer, as the application logged it. */
const BANK_ERROR = `{
  "error": "GATEWAY_TIMEOUT",
  "message": "The statement service did not answer within 120 s.",
  "requestId": "b7c1-44e0-9a2f",
  "retryAfter": 300
}`

const retry = fn()
const openLog = fn()

/** A company's connections on 14 October 2026 (invented). */
const CONNECTIONS: HealthItem[] = [
  {
    id: 'sef',
    name: 'SEF (e-invoicing)',
    detail: 'Sends and receives e-invoices',
    state: DOWN,
    metrics: [
      { key: 'waiting', label: 'Waiting to send', value: '14' },
      { key: 'today', label: 'Sent today', value: '0' },
    ],
    lastSuccess: '2026-10-14T07:55:00+02:00',
    lastError: {
      at: '2026-10-14T09:31:00+02:00',
      message: 'The service did not answer within 30 seconds.',
    },
    actions: [
      { key: 'log', label: 'Open log', icon: FileText, onSelect: openLog },
      { key: 'retry', label: 'Retry', icon: RotateCw, onSelect: retry },
    ],
  },
  {
    id: 'bank',
    name: 'Banca Intesa statements',
    detail: 'Account 160-0000000412-77',
    state: DEGRADED,
    note: 'Statements arrive late; the bank reports a slow service.',
    metrics: [{ key: 'last', label: 'Last statement', value: '188' }],
    lastSuccess: '2026-10-14T06:02:00+02:00',
    lastError: {
      at: '2026-10-14T02:01:00+02:00',
      message: 'Timeout after 120 seconds.',
      // The bank's raw answer, shown on request as a CodeBlock.
      detail: BANK_ERROR,
      detailLanguage: 'json',
    },
    actions: [{ key: 'retry', label: 'Retry', icon: RotateCw, onSelect: retry }],
  },
  {
    id: 'mail',
    name: 'Outgoing e-mail',
    detail: 'smtp.example.com',
    state: UP,
    metrics: [{ key: 'sent', label: 'Sent today', value: '231' }],
    lastSuccess: '2026-10-14T09:38:00+02:00',
  },
  {
    id: 'bridge',
    name: 'Liro Bridge, warehouse scales',
    detail: 'Version 2.4.1 at the yard office',
    state: MAINTENANCE,
    note: 'Updating until 10:00.',
    lastSuccess: '2026-10-14T08:59:00+02:00',
  },
  {
    id: 'payroll',
    name: 'Tax administration (ePorezi)',
    state: UNKNOWN,
    lastSuccess: null,
  },
]

function Page({ children }: { children: ReactNode }) {
  return (
    <ExampleProvider>
      <div className="p-4">{children}</div>
    </ExampleProvider>
  )
}

const meta = {
  title: 'Components/Feedback/HealthList',
  component: HealthList,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** things that are monitored continuously — connections to other systems, ' +
          'services, queues, databases, servers, regions — each with its state (the ' +
          'application’s words and tone, with an icon), its figures, its last success and last ' +
          'error with the message, and what can be done (Retry). Everything shown is the ' +
          'application’s: the list never turns a figure into a state and counts nothing.\n\n' +
          '**When:** an administrator’s integrations, a platform’s services and infrastructure, ' +
          'any page that answers "is it working, and since when?". On phones one card per thing.' +
          '\n\n' +
          '**When not:** one process’s states in order (StatusTimeline); steps to do once ' +
          '(SetupChecklist); one long job’s progress (JobProgress); a dashboard number (StatCard).',
      },
    },
  },
  args: { label: 'Connections', title: 'Connections', items: CONNECTIONS, layout: 'desktop' },
  render: (args) => (
    <Page>
      <HealthList {...args} />
    </Page>
  ),
  play: settle,
} satisfies Meta<typeof HealthList>

export default meta

type Story = StoryObj<typeof meta>

/** Five connections in every state: down, degraded, up, in maintenance, no report. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Connections' })).toBeVisible()
    await expect(canvas.getByRole('list', { name: 'Connections' })).toBeVisible()
    await expect(canvas.getByText('The service did not answer within 30 seconds.')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Retry: SEF (e-invoicing)' })).toBeVisible()
    await expect(canvas.getByText('Never')).toBeVisible()
  },
}

/** With the application's action for the whole list in the title row. */
export const HeaderActions: Story = {
  name: 'Header actions',
  args: {
    headerActions: (
      <span className="bidi-content text-xs text-secondary">
        Checked every minute, last at 09:40
      </span>
    ),
  },
}

export const Loading: Story = { args: { loading: true } }

export const Empty: Story = { args: { items: [], emptyText: 'No connection is set up yet.' } }

/** The application could not load the states. */
export const Failed: Story = {
  name: 'Error',
  args: { error: 'The states cannot be loaded. Try again in a minute.' },
}

/** Long names, details, figures and messages wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    items: [
      {
        id: 'long',
        name: 'Statements of every account at Banca Intesa, Raiffeisen and Erste, fetched at night',
        detail:
          'Accounts 160-0000000412-77, 265-0000000033-12 and 340-0000000101-55 in RSD and EUR',
        state: { kind: 'degraded', label: 'Working with delays at one bank', tone: 'warning' },
        note: 'Erste reports scheduled work on its service until Thursday 16.10.2026. at 06:00.',
        metrics: [
          { key: 'a', label: 'Statements fetched this month', value: '1.284' },
          { key: 'b', label: 'Lines waiting for matching', value: '12.345' },
        ],
        lastSuccess: '2026-10-14T06:02:00+02:00',
        lastError: {
          at: '2026-10-14T02:01:00+02:00',
          message:
            'Erste: the service answered "503 Service Unavailable — scheduled maintenance of the corporate banking interface, please try again later" three times.',
        },
        actions: [{ key: 'retry', label: 'Retry now', icon: RotateCw, onSelect: retry }],
      },
    ],
  },
}

/** Phones: one card per thing, the title above the cards. */
export const Phone: Story = {
  name: 'Phone width',
  args: { layout: 'phone' },
  render: (args) => (
    <PhoneFrame>
      <Page>
        <HealthList {...args} />
      </Page>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const items = canvasElement.querySelectorAll('[data-slot="health-item"]')
    await expect(items).toHaveLength(CONNECTIONS.length)
  },
}

/** Arabic, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="p-4">
        <HealthList
          label="الاتصالات"
          title="الاتصالات"
          layout="desktop"
          items={[
            {
              id: 'a',
              name: 'الفوترة الإلكترونية',
              detail: 'إرسال واستلام الفواتير',
              state: { kind: 'down', label: 'متوقف', tone: 'danger' },
              metrics: [{ key: 'w', label: 'بانتظار الإرسال', value: '14' }],
              lastSuccess: '2026-10-14T07:55:00+04:00',
              lastError: {
                at: '2026-10-14T09:31:00+04:00',
                message: 'لم تستجب الخدمة خلال 30 ثانية.',
              },
              actions: [{ key: 'r', label: 'إعادة المحاولة', icon: RotateCw, onSelect: retry }],
            },
            {
              id: 'b',
              name: 'البريد الصادر',
              state: { kind: 'up', label: 'يعمل', tone: 'success' },
              lastSuccess: '2026-10-14T09:38:00+04:00',
            },
          ]}
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div className="p-4">
        <HealthList
          label="接続"
          title="接続"
          layout="desktop"
          items={[
            {
              id: 'j',
              name: '電子請求書',
              detail: '請求書の送受信',
              state: { kind: 'degraded', label: '遅延あり', tone: 'warning' },
              metrics: [{ key: 'w', label: '送信待ち', value: '14' }],
              lastSuccess: '2026-10-14T07:55:00+09:00',
              lastError: {
                at: '2026-10-14T09:31:00+09:00',
                message: '30秒以内に応答がありません。',
              },
              actions: [{ key: 'r', label: '再試行', icon: RotateCw, onSelect: retry }],
            },
            {
              id: 'k',
              name: '送信メール',
              state: { kind: 'maintenance', label: 'メンテナンス中', tone: 'neutral' },
            },
          ]}
        />
      </div>
    </StoryProvider>
  ),
}

/** Retry runs the application's action; the button is busy until its promise settles. */
export const Retrying: Story = {
  name: 'Retrying, interaction',
  tags: ['interaction', '!dev'],
  render: (args) => {
    const items = CONNECTIONS.map((item) =>
      item.id === 'sef'
        ? {
            ...item,
            actions: [
              { key: 'log', label: 'Open log', icon: FileText, onSelect: openLog },
              {
                key: 'retry',
                label: 'Retry',
                icon: RotateCw,
                onSelect: () =>
                  new Promise<void>((resolve) => {
                    retry()
                    // The application's answer arrives a moment later.
                    setTimeout(resolve, 800)
                  }),
              },
            ],
          }
        : item,
    )
    return (
      <Page>
        <HealthList {...args} items={items} />
      </Page>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Retry: SEF (e-invoicing)' })
    await userEvent.click(button)
    await expect(retry).toHaveBeenCalled()
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await waitFor(
      async () => {
        await expect(button).not.toHaveAttribute('aria-busy')
      },
      { timeout: 3000 },
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Open log: SEF (e-invoicing)' }))
    await expect(openLog).toHaveBeenCalled()
  },
}

/**
 * A last error's raw answer, on request: "Show details" opens it as a small CodeBlock
 * across the row, highlighted where the application gives `CodeHighlighting`.
 */
export const ErrorDetails: Story = {
  name: 'Error details, interaction',
  tags: ['interaction', '!dev'],
  render: (args) => (
    <CodeHighlighting>
      <Page>
        <HealthList {...args} />
      </Page>
    </CodeHighlighting>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const show = canvas.getByRole('button', { name: 'Show details' })
    await expect(show).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(show)
    await expect(canvas.getByRole('button', { name: 'Hide details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    const code = canvas.getByRole('region', { name: 'Last error details: Banca Intesa statements' })
    await expect(code).toHaveTextContent('GATEWAY_TIMEOUT')
    await waitFor(async () => {
      await expect(canvasElement.querySelector('[data-slot="code-block"]')).toHaveAttribute(
        'data-ready',
        'true',
      )
    })
  },
}
