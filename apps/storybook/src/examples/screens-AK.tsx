import { BookOpen } from 'lucide-react'
import { useContext, useMemo, useState, type ReactNode } from 'react'
import {
  Button,
  DataTable,
  DateText,
  Drawer,
  FilterBar,
  KeyValueList,
  ListPage,
  MoneyText,
  ReportPage,
  SectionCard,
  SelectField,
  Toaster,
  TreeTable,
  useLiro,
  type DataTableColumn,
  type ModuleTab,
  type TreeNode,
  type TreeTableColumn,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell } from './example-shell'
import { Tenant } from './screens-G'
import {
  accountByCode,
  accountCard,
  accountPath,
  ACCOUNTS,
  AK_ROUTES,
  balanceSide,
  balanceToday,
  CARD_PERIODS,
  CHART,
  DOCUMENT_ROUTES,
  isAccount,
  LEDGER_TODAY,
  type CardPeriod,
  type CardRow,
  type ChartLevel,
  type LedgerAccount,
  type PostingDocument,
} from './data-AK'
import { AL_ROUTES } from './data-AL'
import { AM_ROUTES } from './data-AM'
import { AN_ROUTES } from './data-AN'
import { AO_ROUTES } from './data-AO'

/*
 * Group AK's example screens (P5.44): Kvadrat Gradnja d.o.o.'s chart of accounts and the account
 * card, on 14 October 2026. Assembled from what exists: ListPage + FilterBar + TreeTable (the
 * chart, its search revealing the matches), Drawer + KeyValueList (an account's details),
 * ReportPage + DataTable (the card: its summary rows as DataTable's `subtotal` line type, the
 * entries with their running balance, the period's totals in the totals row, every document a
 * link to its screen where one exists). The screens play the application: they filter the chart
 * and pick the card's rows (data-AK.ts works out the figures); the components only show them.
 *
 * The ledger's shell is shared by groups AK, AL, AM, AN and AO: one module "Accounting" with the
 * ledger's tabs.
 */

export { AK_ROUTES }

// ── The ledger's shell (groups AK–AO) ─────────────────────────────────────────────────────────

export type LedgerTab =
  'accounts' | 'card' | 'trial' | 'statements' | 'cash' | 'interest' | 'currencies'

const LEDGER_TABS: { key: LedgerTab; label: string; path: string }[] = [
  { key: 'accounts', label: 'Chart of accounts', path: AK_ROUTES.chart },
  { key: 'card', label: 'Account card', path: AK_ROUTES.card('2040') },
  { key: 'trial', label: 'Trial balance', path: AL_ROUTES.trial },
  { key: 'statements', label: 'Financial statements', path: AL_ROUTES.balanceSheet },
  { key: 'cash', label: 'Cash book', path: AM_ROUTES.book },
  { key: 'interest', label: 'Late-payment interest', path: AO_ROUTES.calculation },
  { key: 'currencies', label: 'Foreign currency', path: AN_ROUTES.rates },
]

export function ledgerTabs(current: LedgerTab): ModuleTab[] {
  return LEDGER_TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    href: `#${tab.path}`,
    current: tab.key === current,
  }))
}

/** Milica Petrović's ledger of Kvadrat Gradnja d.o.o. on 14 October 2026. */
export function LedgerShell({
  phone,
  tab,
  crumbs,
  bottomBar,
  children,
}: {
  phone: boolean
  tab: LedgerTab
  crumbs: { label: string; href?: string }[]
  bottomBar?: ReactNode
  children: ReactNode
}) {
  return (
    <Tenant today={LEDGER_TODAY}>
      <Shell
        phone={phone}
        crumbs={crumbs}
        tabs={ledgerTabs(tab)}
        {...(bottomBar === undefined ? {} : { bottomBar })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

/** A document's number as a link to its screen where one exists, else as text. */
export function DocumentLink({ document }: { document: PostingDocument }) {
  const { linkComponent: Link } = useLiro()
  const href = DOCUMENT_ROUTES[document.number]
  const text = <span dir="ltr">{document.number}</span>
  if (href === undefined) return <span className="bidi-isolate">{text}</span>
  return (
    <Link href={href} className="bidi-isolate text-link no-underline hover:underline">
      {text}
    </Link>
  )
}

/** A signed balance as an amount and its side in words ("6.384.910,25 debit"). */
function BalanceWords({ balance }: { balance: string }) {
  const { amount, side } = balanceSide(balance)
  return (
    <span className="bidi-isolate whitespace-nowrap">
      <MoneyText value={amount} currency="RSD" />
      {side !== null && (
        <span className="ms-1 text-xs text-secondary">{side === 'Debit' ? 'debit' : 'credit'}</span>
      )}
    </span>
  )
}

// ── The chart of accounts ─────────────────────────────────────────────────────────────────────

/** What a row of the chart shows: an account's facts, or nothing for a class or group. */
interface ChartRow {
  account?: LedgerAccount
}

function nodeOf(item: ChartLevel | LedgerAccount): TreeNode<ChartRow> {
  if (isAccount(item)) {
    return {
      id: item.code,
      code: item.code,
      label: item.name,
      children: [],
      ...(item.inactive === undefined ? {} : { disabledReason: item.inactive }),
      data: { account: item },
    }
  }
  return {
    id: item.code,
    code: item.code,
    label: item.name,
    children: item.children.map(nodeOf),
    ...(item.notKept === undefined ? {} : { disabledReason: item.notKept }),
    data: {},
  }
}

const CHART_NODES: readonly TreeNode<ChartRow>[] = CHART.map(nodeOf)

/** The application's search: a code that starts with the text, or a name that holds it. */
function matches(node: TreeNode<ChartRow>, text: string): boolean {
  const query = text.trim().toLocaleLowerCase('en')
  if (query === '') return true
  return (node.code ?? '').startsWith(query) || node.label.toLocaleLowerCase('en').includes(query)
}

/**
 * The chart narrowed to the matches — every level above them, and every account under a level
 * whose code or name matches — and the levels to open so that every match shows.
 */
function searchChart(
  nodes: readonly TreeNode<ChartRow>[],
  text: string,
  kind: string | null,
): { nodes: TreeNode<ChartRow>[]; open: string[]; found: number } {
  const open: string[] = []
  const typed = text.trim() !== ''
  let found = 0
  const keep = (node: TreeNode<ChartRow>, levelMatched: boolean): TreeNode<ChartRow> | null => {
    const account = node.data?.account
    if (account !== undefined) {
      const shown =
        (levelMatched || matches(node, text)) && (kind === null || account.kind === kind)
      if (shown) found += 1
      return shown ? node : null
    }
    const inside = levelMatched || (typed && matches(node, text))
    const children = (node.children ?? []).flatMap((child) => {
      const kept = keep(child, inside)
      return kept === null ? [] : [kept]
    })
    if (children.length === 0) return null
    open.push(node.id)
    return { ...node, children }
  }
  const narrowed = nodes.flatMap((node) => {
    const kept = keep(node, false)
    return kept === null ? [] : [kept]
  })
  return { nodes: narrowed, open, found }
}

const KINDS = [...new Set(ACCOUNTS.map((each) => each.kind))].map((kind) => ({
  value: kind,
  label: kind,
}))

const CHART_COLUMNS: TreeTableColumn<ChartRow>[] = [
  { id: 'kind', header: 'Kind', cell: (node) => node.data?.account?.kind },
  {
    id: 'side',
    header: 'Normal side',
    cell: (node) => node.data?.account?.side,
  },
  {
    id: 'analytics',
    header: 'Required analytics',
    cell: (node) => {
      const analytics = node.data?.account?.analytics ?? []
      return analytics.length === 0 ? null : analytics.join(', ')
    },
  },
  {
    id: 'balance',
    header: 'Balance on 14.10.2026.',
    numeric: true,
    minWidth: 180,
    cell: (node) =>
      node.data?.account === undefined ? null : (
        <BalanceWords balance={balanceToday(node.data.account.code)} />
      ),
  },
]

/** The levels above an account, as the Core names them ("Class 2 · Group 20 · 204 Customers …"). */
function placeText(code: string): string {
  const [classLevel, group, synthetic] = accountPath(code)
  return [
    classLevel === undefined ? null : `Class ${classLevel.code} ${classLevel.name}`,
    group === undefined ? null : `Group ${group.code} ${group.name}`,
    synthetic === undefined ? null : `Synthetic account ${synthetic.code} ${synthetic.name}`,
  ]
    .filter((each) => each !== null)
    .join(' › ')
}

function AccountDetails({
  account,
  onClose,
}: {
  account: LedgerAccount | undefined
  onClose: () => void
}) {
  const navigate = useContext(Navigate)
  return (
    <Drawer
      open={account !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      side="end"
      title="Account details"
      subject={account === undefined ? undefined : `${account.code} ${account.name}`}
      actions={
        account === undefined ? undefined : (
          <>
            <Button intent="cancel" label="Close" onClick={onClose} />
            <Button
              family="primary"
              icon={BookOpen}
              emphasis="primary"
              label="Open account card"
              onClick={() => {
                navigate(AK_ROUTES.card(account.code))
              }}
            />
          </>
        )
      }
    >
      {account !== undefined && (
        <KeyValueList
          layout="stacked"
          items={[
            {
              key: 'place',
              label: 'Place in the chart',
              value: placeText(account.code),
              fullWidth: true,
            },
            { key: 'kind', label: 'Kind', value: account.kind },
            { key: 'side', label: 'Normal side', value: account.side },
            {
              key: 'analytics',
              label: 'Required analytics',
              value: account.analytics.length === 0 ? 'None' : account.analytics.join(', '),
            },
            { key: 'tax', label: 'Tax category', value: account.taxCategory ?? 'None' },
            { key: 'currency', label: 'Currency', value: account.currency ?? 'RSD' },
            {
              key: 'balance',
              label: `Balance on 14.10.2026.`,
              value: <BalanceWords balance={balanceToday(account.code)} />,
              numeric: true,
            },
          ]}
        />
      )}
    </Drawer>
  )
}

export function ChartOfAccounts({
  phone,
  search: initialSearch = '',
  details,
}: {
  phone: boolean
  search?: string
  details?: string
}) {
  const [search, setSearch] = useState(initialSearch)
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const kind = typeof filters.kind === 'string' ? filters.kind : null
  const result = useMemo(() => searchChart(CHART_NODES, search, kind), [search, kind])
  const searching = search.trim() !== '' || kind !== null
  const [expanded, setExpanded] = useState<readonly string[]>(
    details === undefined
      ? ['2', '20', '204', '24', '241', '243']
      : accountPath(details).map((each) => each.code),
  )
  const [open, setOpen] = useState<string | undefined>(details)
  const account = open === undefined ? undefined : accountByCode(open)
  const newAccount = <Button intent="create" label="New account" />
  return (
    <LedgerShell
      phone={phone}
      tab="accounts"
      crumbs={[{ label: 'Accounting' }, { label: 'Chart of accounts' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Chart of accounts"
        actions={newAccount}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={[{ id: 'kind', label: 'Kind', type: 'select', options: KINDS }]}
            inline={1}
            values={filters}
            onValuesChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Account number or name"
          />
        }
      >
        <TreeTable
          label={
            searching
              ? `Chart of accounts, ${String(result.found)} ${result.found === 1 ? 'account' : 'accounts'} found`
              : 'Chart of accounts'
          }
          layout={phone ? 'phone' : 'desktop'}
          treeHeader="Account"
          columns={CHART_COLUMNS}
          mainColumn="balance"
          nodes={searching ? result.nodes : CHART_NODES}
          expanded={searching ? result.open : expanded}
          onExpandedChange={(next) => {
            if (!searching) setExpanded(next)
          }}
          selectionMode="single"
          selected={open === undefined ? [] : [open]}
          onSelectedChange={(ids) => {
            const id = ids[0]
            if (id === undefined) return
            if (ACCOUNTS.some((each) => each.code === id)) {
              setOpen(id)
              return
            }
            setExpanded((current) =>
              current.includes(id) ? current.filter((each) => each !== id) : [...current, id],
            )
          }}
        />
      </ListPage>
      <AccountDetails
        account={account}
        onClose={() => {
          setOpen(undefined)
        }}
      />
    </LedgerShell>
  )
}

// ── The account card ──────────────────────────────────────────────────────────────────────────

function cardColumns(): DataTableColumn<CardRow>[] {
  return [
    {
      id: 'date',
      header: 'Date',
      numeric: true,
      cell: (row) => <DateText value={row.date} />,
    },
    {
      id: 'document',
      header: 'Document',
      cell: (row) =>
        row.document === undefined ? null : (
          <span className="flex flex-col">
            <DocumentLink document={row.document} />
            <span className="bidi-content text-xs text-secondary">{row.document.kind}</span>
          </span>
        ),
    },
    {
      id: 'description',
      header: 'Description',
      minWidth: 220,
      cell: (row) => row.description,
    },
    { id: 'partner', header: 'Partner', minWidth: 160, cell: (row) => row.partner },
    {
      id: 'debit',
      header: 'Debit',
      align: 'end',
      numeric: true,
      cell: (row) => <MoneyText value={row.debit} currency="RSD" />,
    },
    {
      id: 'credit',
      header: 'Credit',
      align: 'end',
      numeric: true,
      cell: (row) => <MoneyText value={row.credit} currency="RSD" />,
    },
    {
      id: 'balance',
      header: 'Balance',
      align: 'end',
      numeric: true,
      minWidth: 150,
      cell: (row) => <MoneyText value={row.balance} currency="RSD" />,
    },
  ]
}

const CARD_COLUMNS = cardColumns()

const ACCOUNT_OPTIONS = ACCOUNTS.filter((each) => each.inactive === undefined).map((each) => ({
  value: each.code,
  label: `${each.code} ${each.name}`,
}))

export function AccountCardScreen({ phone, code }: { phone: boolean; code: string }) {
  const { format } = useLiro()
  // The parameters as typed, and the card as last run.
  const [draft, setDraft] = useState({ code, period: 'sep-oct' as CardPeriod })
  const [ran, setRan] = useState(draft)
  const [parametersOpen, setParametersOpen] = useState(false)
  const card = accountCard(ran.code, ran.period)
  const label = (row: CardRow) =>
    row.type === 'opening'
      ? `Opening balance on ${format.date(row.date ?? '2026-01-01')}`
      : row.type === 'before'
        ? `Turnover 01.01.–${format.date(row.date ?? card.period.from)}`
        : `${row.document?.number ?? ''} ${row.description ?? ''}`
  return (
    <LedgerShell
      phone={phone}
      tab="card"
      crumbs={[
        { label: 'Chart of accounts', href: `#${AK_ROUTES.chart}` },
        { label: `Account card ${card.account.code}` },
      ]}
    >
      <ReportPage
        layout={phone ? 'phone' : 'desktop'}
        title={`Account card ${card.account.code}`}
        subtitle={`${card.account.name} · ${String(card.entries)} entries · balance on ${format.date(card.period.to)}: ${format.money(card.closing, 'RSD')}`}
        actions={
          <>
            <Button intent="print" emphasis="secondary" label="Print" />
            <Button intent="export" label="Export" />
          </>
        }
        parametersOpen={parametersOpen}
        onParametersOpenChange={setParametersOpen}
        parameters={
          <>
            <SelectField
              label="Account"
              options={ACCOUNT_OPTIONS}
              value={draft.code}
              onChange={(value) => {
                setDraft((current) => ({ ...current, code: value }))
              }}
              {...(phone ? {} : { className: 'w-80' })}
            />
            <SelectField
              label="Period"
              options={CARD_PERIODS.map((each) => ({ value: each.value, label: each.label }))}
              value={draft.period}
              onChange={(value) => {
                setDraft((current) => ({ ...current, period: value as CardPeriod }))
              }}
              {...(phone ? {} : { className: 'w-60' })}
            />
          </>
        }
        summary={[
          { key: 'account', label: 'Account', value: `${card.account.code} ${card.account.name}` },
          { key: 'period', label: 'Period', value: card.period.label },
        ]}
        onRun={() => {
          setRan(draft)
        }}
      >
        <SectionCard flush>
          <DataTable
            inCard
            label={`Account card ${card.account.code}`}
            layout={phone ? 'cards' : 'table'}
            columns={CARD_COLUMNS}
            rows={card.rows}
            getRowId={(row) => row.id}
            getRowLabel={label}
            lineType={(row) => (row.type === 'entry' ? 'line' : 'subtotal')}
            lineText={(row) => label(row)}
            totalsLabel={<span className="bidi-content">{`Turnover ${card.period.label}`}</span>}
            totals={{
              debit: <MoneyText value={card.totals.debit} currency="RSD" />,
              credit: <MoneyText value={card.totals.credit} currency="RSD" />,
              balance: <MoneyText value={card.closing} currency="RSD" />,
            }}
            mobile={{
              title: (row) => (row.type === 'entry' ? (row.description ?? '') : label(row)),
              subtitle: (row) =>
                row.type === 'entry' ? (
                  <span className="bidi-content">
                    <DateText value={row.date} />
                    {row.partner === undefined ? null : ` · ${row.partner}`}
                  </span>
                ) : null,
              details: ['document', 'debit', 'credit', 'balance'],
            }}
          />
        </SectionCard>
      </ReportPage>
    </LedgerShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AK_ROUTES: ExampleRoute[] = [
  { path: AK_ROUTES.chart, render: (phone) => <ChartOfAccounts phone={phone} /> },
  {
    path: AK_ROUTES.chartSearch,
    render: (phone) => <ChartOfAccounts phone={phone} search="customers" />,
  },
  {
    path: AK_ROUTES.chartDetails('2040'),
    render: (phone) => <ChartOfAccounts phone={phone} details="2040" />,
  },
  ...ACCOUNTS.filter((each) => each.inactive === undefined).map((each) => ({
    path: AK_ROUTES.card(each.code),
    render: (phone: boolean) => <AccountCardScreen phone={phone} code={each.code} />,
  })),
]
