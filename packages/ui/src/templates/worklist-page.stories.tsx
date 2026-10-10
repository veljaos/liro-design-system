import type { Meta, StoryObj } from '@storybook/react-vite'
import { CheckCheck, CircleX } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { BulkActionBar } from '../components/bulk-action-bar'
import { Button } from '../components/button'
import { KeyValueList } from '../components/cards'
import { DateText, DueDate, MoneyText } from '../components/display-text'
import { EmptyState } from '../components/empty-state'
import { StatusBadge, toneFor } from '../components/status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { AppShell } from './app-shell'
import { APPROVALS, BRAND, COMMANDS, COMPANIES, USER, type ApprovalRow } from './shell-story-data'
import { WorklistPage, type WorklistItem } from './worklist-page'

const TONES = { 'To approve': 'warning', 'Query sent': 'info', Overdue: 'danger' } as const

function item(row: ApprovalRow): WorklistItem {
  return {
    id: row.id,
    label: row.number,
    title: row.supplier,
    subtitle: `${row.number} · ${row.costCenter}`,
    figure: <MoneyText value={row.total} currency="RSD" />,
    status: <StatusBadge label={row.status} tone={toneFor(row.status, TONES)} />,
  }
}

/** The two decisions, Reject then Approve (the main one last). */
function Decisions() {
  return (
    <>
      <Button family="destructive" icon={CircleX} label="Reject" />
      <Button family="positive" icon={CheckCheck} label="Approve" emphasis="primary" />
    </>
  )
}

/** The chosen invoice: its facts (the decisions stand in the bar under it). */
function Detail({ row }: { row: ApprovalRow }) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="m-0 text-h2 text-primary">{row.supplier}</h2>
        <p className="m-0 text-sm text-secondary">
          {row.number} · requested by {row.requester}
        </p>
      </div>
      <dl className="m-0 flex flex-wrap gap-x-10 gap-y-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-secondary">Amount</dt>
          <dd className="m-0 text-xl font-semibold text-primary tabular-nums">
            <MoneyText value={row.total} currency="RSD" />
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-secondary">Due</dt>
          <dd className="m-0 text-xl font-semibold text-primary tabular-nums">
            <DateText value={row.due} />
          </dd>
        </div>
      </dl>
      <KeyValueList
        columns={2}
        items={[
          { label: 'Received', value: <DateText value={row.received} />, numeric: true },
          { label: 'Payment', value: <DueDate value={row.due} />, numeric: true },
          { label: 'Cost center', value: row.costCenter },
          { label: 'Requested by', value: row.requester },
          { label: 'Purchase order', value: 'N-2026-0157', numeric: true },
          { label: 'Goods received', value: 'Complete' },
          { label: 'Delivery date', value: <DateText value="2026-09-30" />, numeric: true },
        ]}
      />
    </div>
  )
}

function Approvals({
  stacked = false,
  checkable = false,
  startChecked = [],
  startSelected = 'u1',
}: {
  stacked?: boolean
  checkable?: boolean
  startChecked?: string[]
  startSelected?: string
}) {
  const [selected, setSelected] = useState<string | undefined>(startSelected || undefined)
  const [checked, setChecked] = useState<string[]>(startChecked)
  const row = APPROVALS.find((each) => each.id === selected)
  const index = APPROVALS.findIndex((each) => each.id === selected)
  return (
    <AppShell
      layout={stacked ? 'phone' : 'desktop'}
      brand={BRAND}
      breadcrumbs={[{ label: 'Purchasing', href: '#p' }, { label: 'To approve' }]}
      commands={{ items: COMMANDS }}
      notifications={{ unread: 0, panel: <p className="m-0 text-sm">No notifications.</p> }}
      companies={{ items: COMPANIES, current: 'kvadrat', onSelect: () => undefined }}
      user={USER}
    >
      <WorklistPage
        layout={stacked ? 'stacked' : 'split'}
        title="Supplier invoices to approve"
        label="Supplier invoices to approve"
        items={APPROVALS.map(item)}
        {...(checkable
          ? {
              checked,
              onCheckedChange: setChecked,
              bulkBar: (
                <BulkActionBar
                  count={checked.length}
                  onClear={() => {
                    setChecked([])
                  }}
                  actions={[
                    { key: 'reject', family: 'destructive', icon: CircleX, label: 'Reject' },
                    {
                      key: 'approve',
                      family: 'positive',
                      icon: CheckCheck,
                      label: 'Approve',
                      confirm: true,
                    },
                  ]}
                />
              ),
            }
          : {})}
        {...(selected === undefined ? {} : { selected })}
        onSelect={setSelected}
        {...(row === undefined ? {} : { detail: <Detail row={row} /> })}
        {...(stacked ? {} : { detailActions: <Decisions /> })}
        onBack={() => {
          setSelected(undefined)
        }}
        onPrevious={() => {
          setSelected(APPROVALS[(index - 1 + APPROVALS.length) % APPROVALS.length]?.id)
        }}
        onNext={() => {
          setSelected(APPROVALS[(index + 1) % APPROVALS.length]?.id)
        }}
      />
    </AppShell>
  )
}

const meta = {
  title: 'Templates/WorklistPage',
  component: WorklistPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** the one way to decide items one by one — supplier invoices to ' +
          'approve, the lines of a bank statement. From 62em the list (380px) and the chosen ' +
          'item’s detail side by side, each scrolling on its own, and under the detail one bar: ' +
          'the position ("3 of 11"), Previous, Next, then the item’s decisions with the main one ' +
          'last ("Approve", "Confirm and next"). Below 62em the list, then the item full screen ' +
          'with "Back to list", the position, Previous and Next; the decisions go into AppShell’s ' +
          'bottom bar. After a decision the application opens the next item and confirms with a ' +
          'toast (Undo where the Core can take it back). A row: title, subtitle, the one ' +
          'deciding figure, the status. Decisions never stand in every row; with ' +
          '`onCheckedChange` rows get checkboxes and `bulkBar` (a BulkActionBar) decides for the ' +
          'checked ones. `summary` shows what the queue belongs to (a statement’s balances and ' +
          'progress) between the title — with `back`, `status`, `subtitle` — and the list.\n\n' +
          '**How:** `items`, `selected` / `onSelect`, `detail` (optional), `detailActions`, ' +
          '`onPrevious`, `onNext`, `onBack`; the application decides, stores and chooses the ' +
          'next item.\n\n' +
          '**When not:** a list to search and filter (ListPage); a single record (DetailPage).',
      },
    },
  },
  args: { title: 'Supplier invoices to approve', label: 'Supplier invoices', items: [] },
  render: () => (
    <ExampleProvider>
      <Approvals />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof WorklistPage>

export default meta

type Story = StoryObj<typeof meta>

/** List and detail side by side; choosing another row changes the detail. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /Telekom Srbija/ }))
    await expect(canvas.getByRole('heading', { name: 'Telekom Srbija a.d.' })).toBeVisible()
  },
}

/** Checked rows: the bulk bar above the list decides for all of them at once. */
export const CheckedRows: Story = {
  name: 'Checked rows',
  render: () => (
    <ExampleProvider>
      <Approvals checkable startChecked={['u2', 'u5']} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('2 selected')).toBeVisible()
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select UF-2026-1187' }))
    await expect(canvas.getByText('3 selected')).toBeVisible()
  },
}

/**
 * The queue of a record (a bank statement's lines): back, status and subtitle in the title row,
 * the record's summary above the list, and the position with Previous and Next under the detail.
 */
export const WithSummary: Story = {
  name: 'Record summary and position',
  render: () => (
    <ExampleProvider>
      <WorklistPage
        layout="split"
        title="Statement 188"
        back={{ href: '#statements', label: 'Statements' }}
        status={<StatusBadge label="In progress" tone="info" />}
        subtitle="Banca Intesa · Statement date 06.10.2026."
        summary={<p className="m-0 text-sm font-medium text-primary">2 of 4 lines done</p>}
        label="Lines of statement 188"
        items={[
          {
            id: 'b1',
            title: 'Panonija Agro d.o.o.',
            subtitle: '1 · F-2026-0412',
            figure: <MoneyText value="135954.00" currency="RSD" />,
            status: <StatusBadge label="Done" tone="success" />,
          },
          {
            id: 'b2',
            title: 'Banca Intesa a.d. Beograd',
            subtitle: '2 · Account fee, September 2026',
            figure: <MoneyText value="-1240.00" currency="RSD" />,
            status: <StatusBadge label="Done" tone="success" />,
          },
          {
            id: 'b3',
            title: 'Medic Lab Niš d.o.o. — a long payer name that wraps onto a second line',
            subtitle: '3 · F-2026-0410',
            figure: <MoneyText value="50000.00" currency="RSD" />,
            status: <StatusBadge label="Suggestion ready" tone="info" />,
          },
          {
            id: 'b4',
            title: 'Petar Jovanović',
            subtitle: '4 · Uplata',
            figure: <MoneyText value="12000.00" currency="RSD" />,
            status: <StatusBadge label="Left for later" tone="neutral" />,
          },
        ]}
        selected="b3"
        detail={<p className="m-0 p-6 text-sm text-primary">Line 3 in focus.</p>}
        detailActions={
          <Button family="positive" icon={CheckCheck} label="Confirm and next" emphasis="primary" />
        }
        onPrevious={() => undefined}
        onNext={() => undefined}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('3 of 4')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Previous item' })).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Back to Statements' })).toBeVisible()
  },
}

/** Nothing waits: the empty state. */
export const Empty: Story = {
  render: () => (
    <ExampleProvider>
      <WorklistPage
        layout="split"
        title="Supplier invoices to approve"
        label="Supplier invoices to approve"
        items={[]}
        empty={
          <EmptyState
            title="Nothing to approve"
            description="New supplier invoices appear here when they arrive from SEF."
          />
        }
      />
    </ExampleProvider>
  ),
}

/** Below 62em: the list alone. */
export const PhoneList: Story = {
  name: 'Phone width, list',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Approvals stacked startSelected="" />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Below 62em: the chosen item full width, with Back and Next item. */
export const PhoneDetail: Story = {
  name: 'Phone width, detail',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Approvals stacked />
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('1 of 5')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Next item' }))
    await expect(canvas.getByRole('heading', { name: 'Telekom Srbija a.d.' })).toBeVisible()
    await expect(canvas.getByText('2 of 5')).toBeVisible()
  },
}

/** Arabic rows. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <WorklistPage
          layout="split"
          title="فواتير الموردين"
          label="فواتير الموردين"
          items={[
            { id: 'a', title: 'شركة النور للتجارة', subtitle: 'UF-2026-1187', figure: '48.216,90' },
            { id: 'b', title: 'مؤسسة الفجر', subtitle: 'UF-2026-1186', figure: '12.873,40' },
          ]}
          selected="a"
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese rows. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <WorklistPage
          layout="split"
          title="仕入先請求書"
          label="仕入先請求書"
          items={[
            { id: 'a', title: '株式会社さくら商事', subtitle: 'UF-2026-1187', figure: '48.216,90' },
            { id: 'b', title: '東京物産株式会社', subtitle: 'UF-2026-1186', figure: '12.873,40' },
          ]}
          selected="a"
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}
