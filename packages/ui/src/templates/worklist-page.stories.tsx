import type { Meta, StoryObj } from '@storybook/react-vite'
import { CheckCheck, CircleCheck, CircleX, Lock } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { BulkActionBar } from '../components/bulk-action-bar'
import { Button } from '../components/button'
import { KeyValueList } from '../components/cards'
import { DateText, DueDate, MoneyText } from '../components/display-text'
import { EmptyState } from '../components/empty-state'
import { InlineUndo } from '../components/inline-undo'
import { StatusBadge, toneFor } from '../components/status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import { AppShell } from './app-shell'
import { APPROVALS, BRAND, COMMANDS, COMPANIES, USER, type ApprovalRow } from './shell-story-data'
import { nextWorklistItem, WorklistPage, WorklistSummary, type WorklistItem } from './worklist-page'

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
        <h2 className={cn('m-0 text-h2 text-primary', TEXT_DIRECTION)}>{row.supplier}</h2>
        <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
          {row.number} · requested by {row.requester}
        </p>
      </div>
      <dl className="m-0 flex flex-wrap gap-x-10 gap-y-3">
        <div className="flex flex-col gap-0.5">
          <dt className={cn('text-xs text-secondary', TEXT_DIRECTION)}>Amount</dt>
          <dd className="m-0 text-xl font-semibold text-primary tabular-nums">
            <MoneyText value={row.total} currency="RSD" />
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className={cn('text-xs text-secondary', TEXT_DIRECTION)}>Due</dt>
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
      notifications={{
        unread: 0,
        panel: <p className={cn('m-0 text-sm', TEXT_DIRECTION)}>No notifications.</p>,
      }}
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
          'last ("Approve", "Confirm"). Below 62em the list, then the item full screen ' +
          'with "Back to list", the position, Previous and Next; the decisions go into AppShell’s ' +
          'bottom bar. After a decision the application opens the next item and offers Undo in ' +
          'place where it can be taken back. A row: title, subtitle, the one ' +
          'deciding figure, the status. Decisions never stand in every row; with ' +
          '`onCheckedChange` rows get checkboxes and `bulkBar` (a BulkActionBar) decides for the ' +
          'checked ones. `summary` shows what the queue belongs to between the title — with ' +
          '`back`, `status`, `subtitle` — and the list: a `WorklistSummary` (a thin strip of the ' +
          'record’s figures, "3 of 10 done" with a bar, the application’s check, and its final ' +
          'action once nothing waits).\n\n' +
          '**Many items:** from 100 items only the rows in view are drawn (in the ' +
          'queue’s own scroll from 62em, against the page’s scroll below); `toolbar` at the top ' +
          'of the queue (a bulk action such as "Accept all exact matches (6)", then its Undo in ' +
          'place), `search` / `onSearchChange` and `filters` (states with their counts, as chips ' +
          'that wrap, one pressed; `filter` / `onFilterChange`; always "All" first, while ' +
          'the queue opens on the state that needs the user) stay above the rows. The queue is ' +
          'one tab stop: ArrowUp / ArrowDown, Home and End move it and, from 62em, choose the ' +
          'item; Enter takes the chosen item’s main decision (`onConfirm`). After a decision the ' +
          'application opens the next item that waits by itself (`nextWorklistItem`) and the ' +
          'focus follows. The application filters, searches and counts.\n\n' +
          '**How:** `items`, `selected` / `onSelect`, `detail` (optional), `detailActions`, ' +
          '`onConfirm`, `onPrevious`, `onNext`, `onBack`; the application decides, stores and ' +
          'chooses the next item.\n\n' +
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
  play: async () => {
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction', '!dev'],
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
    await settle()
  },
}

export const CheckedRowsInteraction: Story = {
  name: 'Checked rows, interaction',
  tags: ['interaction', '!dev'],
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
        summary={
          <p className={cn('m-0 text-sm font-medium text-primary', TEXT_DIRECTION)}>
            2 of 4 lines done
          </p>
        }
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
        detail={
          <p className={cn('m-0 p-6 text-sm text-primary', TEXT_DIRECTION)}>Line 3 in focus.</p>
        }
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
    await settle()
  },
}

export const PhoneDetailInteraction: Story = {
  name: 'Phone width, detail, interaction',
  tags: ['interaction', '!dev'],
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
  tags: ['!dev'],
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
  tags: ['!dev'],
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

// ── A long queue ───────────────────────────────────────────────────────────────

type CardState = 'needs' | 'matched' | 'done'

interface CardPayment {
  id: string
  no: number
  merchant: string
  amount: string
  state: CardState
}

const MERCHANTS = [
  'Maxi Novi Sad',
  'NIS Petrol, Temerinski put',
  'Lilly drogerija',
  'Tehnomanija',
  'Gigatron',
  'Aerodrom Nikola Tesla, parking',
  'Hotel Zlatibor',
  'Rent a car Beograd',
]

/** 1,200 card payments of one month (fictitious): every seventh has no receipt matched. */
const CARD_PAYMENTS: CardPayment[] = Array.from({ length: 1200 }, (_, index) => ({
  id: `t${String(index + 1)}`,
  no: index + 1,
  merchant: MERCHANTS[index % MERCHANTS.length] ?? '',
  amount: `${String(1000 + ((index * 7919) % 48_000))}.${String((index * 37) % 100).padStart(2, '0')}`,
  state: index % 7 === 3 ? 'needs' : 'matched',
}))

const CARD_STATES: { value: CardState; label: string; tone: 'warning' | 'neutral' | 'success' }[] =
  [
    { value: 'needs', label: 'Needs you', tone: 'warning' },
    { value: 'matched', label: 'Receipt matched', tone: 'neutral' },
    { value: 'done', label: 'Done', tone: 'success' },
  ]

/** The card payments of October to explain: 1,200 items, the queue's tools and a summary. */
function LongQueue({ stacked = false }: { stacked?: boolean }) {
  const [payments, setPayments] = useState(CARD_PAYMENTS)
  // "All" is always the first chip; Needs you is the one the queue opens on.
  const [filter, setFilter] = useState<CardState | 'all'>('needs')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | undefined>(stacked ? undefined : 't4')
  const [accepted, setAccepted] = useState<string[] | null>(null)
  const shown = payments.filter(
    (each) =>
      (filter === 'all' || each.state === filter || each.id === selected) &&
      `${each.merchant} ${each.amount}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const chosen = payments.find((each) => each.id === selected)
  const count = (state: CardState) => payments.filter((each) => each.state === state).length
  const matched = payments.filter((each) => each.state === 'matched')
  const confirm = (id: string) => {
    const after = payments.map((each) =>
      each.id === id ? { ...each, state: 'done' as const } : each,
    )
    setPayments(after)
    setSelected(
      nextWorklistItem(after, id, (each) =>
        filter === 'all' ? each.state !== 'done' : each.state === filter,
      )?.id,
    )
  }
  const items: WorklistItem[] = shown.map((each) => {
    const state = CARD_STATES.find((candidate) => candidate.value === each.state)
    return {
      id: each.id,
      label: `Payment ${String(each.no)}, ${each.merchant}`,
      title: each.merchant,
      subtitle: `Payment ${String(each.no)}`,
      figure: <MoneyText value={each.amount} currency="RSD" />,
      ...(state === undefined
        ? {}
        : { status: <StatusBadge label={state.label} tone={state.tone} /> }),
    }
  })
  const confirmButton =
    chosen === undefined || chosen.state === 'done' ? undefined : (
      <Button
        family="primary"
        icon={CircleCheck}
        emphasis="primary"
        label="Confirm"
        onClick={() => {
          confirm(chosen.id)
        }}
      />
    )
  return (
    <AppShell
      layout={stacked ? 'phone' : 'desktop'}
      brand={BRAND}
      breadcrumbs={[{ label: 'Expenses', href: '#e' }, { label: 'Card payments' }]}
      commands={{ items: COMMANDS }}
      notifications={{
        unread: 0,
        panel: <p className={cn('m-0 text-sm', TEXT_DIRECTION)}>No notifications.</p>,
      }}
      companies={{ items: COMPANIES, current: 'kvadrat', onSelect: () => undefined }}
      user={USER}
      {...(stacked && confirmButton !== undefined
        ? { bottomBar: <div className="flex [&>*]:flex-1">{confirmButton}</div> }
        : {})}
    >
      <WorklistPage
        layout={stacked ? 'stacked' : 'split'}
        title="Card payments, October 2026"
        label="Card payments"
        summary={
          <WorklistSummary
            layout={stacked ? 'phone' : 'desktop'}
            facts={[
              { key: 'card', label: 'Card', value: <span dir="ltr">•••• 4821</span> },
              { key: 'payments', label: 'Payments', value: '1.200' },
            ]}
            done={count('done')}
            total={payments.length}
            {...(count('done') === payments.length
              ? {
                  action: (
                    <Button family="primary" icon={Lock} emphasis="primary" label="Close month" />
                  ),
                }
              : {})}
          />
        }
        toolbar={
          matched.length > 0 ? (
            <div className="flex [&>*]:flex-1">
              <Button
                family="primary"
                icon={CheckCheck}
                label={`Accept all matched (${String(matched.length)})`}
                onClick={() => {
                  const ids = matched.map((each) => each.id)
                  setPayments(
                    payments.map((each) =>
                      ids.includes(each.id) ? { ...each, state: 'done' as const } : each,
                    ),
                  )
                  setAccepted(ids)
                }}
              />
            </div>
          ) : accepted === null ? undefined : (
            <InlineUndo
              message={`${String(accepted.length)} payments accepted.`}
              onUndo={() => {
                setPayments(
                  payments.map((each) =>
                    accepted.includes(each.id) ? { ...each, state: 'matched' as const } : each,
                  ),
                )
                setAccepted(null)
              }}
            />
          )
        }
        search={query}
        onSearchChange={setQuery}
        searchLabel="Merchant or amount"
        filters={[
          { value: 'all', label: 'All', count: payments.length },
          ...CARD_STATES.map((state) => ({
            value: state.value,
            label: state.label,
            count: count(state.value),
          })),
        ]}
        filter={filter}
        onFilterChange={(value) => {
          const state =
            value === 'all'
              ? 'all'
              : (CARD_STATES.find((each) => each.value === value)?.value ?? 'needs')
          setFilter(state)
          setSelected(
            stacked
              ? undefined
              : payments.find((each) => state === 'all' || each.state === state)?.id,
          )
        }}
        items={items}
        {...(selected === undefined ? {} : { selected })}
        onSelect={setSelected}
        onConfirm={confirm}
        onBack={() => {
          setSelected(undefined)
        }}
        empty={<EmptyState compact title="Nothing here" description="No payment in this state." />}
        {...(chosen === undefined
          ? {}
          : {
              detail: (
                <div className={stacked ? 'flex flex-col gap-3' : 'flex flex-col gap-3 p-6'}>
                  <h2 className={cn('m-0 text-h2 text-primary', TEXT_DIRECTION)}>
                    {chosen.merchant}
                  </h2>
                  <p className="m-0 text-h3 font-semibold text-primary tabular-nums">
                    <MoneyText value={chosen.amount} currency="RSD" />
                  </p>
                </div>
              ),
            })}
        {...(confirmButton === undefined || stacked ? {} : { detailActions: confirmButton })}
      />
    </AppShell>
  )
}

/**
 * 1,200 items: the summary strip, the queue's tools — "Accept all matched", the
 * search, the states with their counts — and only the rows in view drawn.
 */
export const LongQueueStory: Story = {
  name: 'Long queue, 1,200 items',
  render: () => (
    <ExampleProvider>
      <LongQueue />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('0 of 1.200 done')).toBeVisible()
    await expect(canvas.getByRole('button', { name: /^Needs you/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getByRole('button', { name: /^Accept all matched/ })).toBeVisible()
    await settle()
  },
}

/**
 * The keyboard over a long queue: the chosen row is the one tab stop; ArrowDown, End and Home
 * choose (the detail follows); Enter confirms and the next item that waits opens, the focus
 * with it; the rows drawn stay few.
 */
export const LongQueueKeyboard: Story = {
  name: 'Long queue, keyboard, interaction',
  tags: ['interaction', '!dev'],
  render: () => (
    <ExampleProvider>
      <LongQueue />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /^Receipt matched/ }))
    const list = canvas.getByRole('list', { name: 'Card payments' })
    const drawn = () => list.querySelectorAll('li[data-worklist-row]')
    const chosen = () => list.querySelector('li[aria-current="true"]')
    await expect(drawn().length).toBeLessThan(60)
    await expect(drawn()[0]).toHaveAttribute('aria-setsize', '1029')
    list.querySelector<HTMLElement>('li[aria-current="true"] [data-worklist-target]')?.focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(chosen()).toHaveAttribute('aria-posinset', '2')
    await userEvent.keyboard('{End}')
    await waitFor(async () => {
      await expect(chosen()).toHaveAttribute('aria-posinset', '1029')
    })
    await expect(drawn().length).toBeLessThan(60)
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByText('1 of 1.200 done')).toBeVisible()
    await expect(document.activeElement?.closest('li')).toHaveAttribute('aria-current', 'true')
    await userEvent.keyboard('{Home}')
    await waitFor(async () => {
      await expect(chosen()).toHaveAttribute('aria-posinset', '1')
    })
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent(MERCHANTS[0] ?? '')
  },
}

/** Below 62em: the summary, the tools and the queue flowing with the page, drawn in view only. */
export const LongQueuePhone: Story = {
  name: 'Long queue, phone width',
  tags: ['!dev'],
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <LongQueue stacked />
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const list = within(canvasElement).getByRole('list', { name: 'Card payments' })
    await expect(list.querySelectorAll('li[data-worklist-row]').length).toBeLessThan(60)
    await settle()
  },
}
