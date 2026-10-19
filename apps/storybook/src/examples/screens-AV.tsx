import { useContext, useState, type ReactNode } from 'react'
import {
  Button,
  DataTable,
  DateText,
  DESCRIPTION_MIN_WIDTH,
  DocumentPage,
  DocumentReferences,
  FilterBar,
  KeyValueList,
  ListPage,
  MIN_COLUMN_WIDTH,
  MoneyText,
  notice,
  NumberText,
  SplitAction,
  toneFor,
  type DataTableColumn,
  type DocumentReferenceGroup,
  type KeyFigure,
  type KeyValueItem,
  type LifecycleStep,
  type MenuEntry,
} from '@veljaos/ui'
import { Send } from 'lucide-react'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import { useExampleState } from './example-state'
import { STANOGRADNJA, TRADE_TONES, type ChainDocument } from './data-AU'
import {
  AV_ROUTES,
  DELIVERY,
  QUOTE,
  QUOTE_VIEWS,
  QUOTES,
  SALES_INVOICE,
  SALES_ORDER,
  salesChain,
  type ChainStage,
  type DeliveryLine,
  type QuoteRow,
  type SalesLine,
} from './data-AV'
import {
  counterpartyOf,
  historyPanel,
  moduleTabs,
  relatedPanel,
  TradeShell,
  tradeBadge,
  usePanels,
} from './screens-AU'

/*
 * Group AV's example screens (P5.50, the sales chain): Kvadrat Gradnja d.o.o. sells precast
 * stairs to Stanogradnja Plus d.o.o., seen by Milica Petrović on 14 October 2026.
 * - The quotes (ListPage): number, customer, subject, dates, total and state; views Open,
 *   Ordered, Declined or expired, All; search.
 * - Quote PON-2026-0031 → order NAR-2026-0024 → delivery note OTP-2026-0058 → invoice
 *   F-2026-0430, each a DocumentPage: its lifecycle, "Based on" the document before it
 *   (DocumentReferences), the chain so far in the related documents. The next document is the
 *   main action, in one click (SplitAction: "Create order", with the other documents that can be
 *   made from it in its menu); the application creates it and its page opens — the screens play
 *   the application and keep how far the chain is above the screens.
 */

export { AV_ROUTES }

const SALES = [
  { key: 'invoices', label: 'Invoices', path: '/sales/invoices' },
  { key: 'quotes', label: 'Quotes', path: AV_ROUTES.quotes },
  { key: 'orders', label: 'Orders', path: '/sales/orders' },
  { key: 'customers', label: 'Customers', path: '/sales/customers' },
  { key: 'reports', label: 'Reports', path: '/sales/reports' },
]

const money = (value: string | null) => <MoneyText value={value} currency="RSD" />

/** How far the chain is, kept above the screens: each page starts where its document exists. */
function useStage(least: ChainStage) {
  const [stage, setStage] = useExampleState<ChainStage>('AV.stage', () => least)
  return [Math.max(stage, least) as ChainStage, setStage] as const
}

function statusIn(chain: readonly ChainDocument[], key: string): string {
  return chain.find((each) => each.key === key)?.status ?? ''
}

/** "Based on" the document before this one in the chain. */
function basedOn(chain: readonly ChainDocument[], key: string): ReactNode {
  const index = chain.findIndex((each) => each.key === key)
  const before = index > 0 ? chain[index - 1] : undefined
  if (before === undefined) return undefined
  const groups: DocumentReferenceGroup[] = [
    {
      key: before.key,
      label: before.type,
      items: [
        {
          key: before.key,
          number: before.number,
          href: `#${before.path}`,
          status: { label: before.status, tone: toneFor(before.status, TRADE_TONES) },
        },
      ],
    },
  ]
  return <DocumentReferences groups={groups} />
}

const PRICED_COLUMNS: DataTableColumn<SalesLine>[] = [
  { id: 'item', header: 'Item', minWidth: DESCRIPTION_MIN_WIDTH, cell: (line) => line.text },
  {
    id: 'quantity',
    header: 'Quantity',
    align: 'end',
    numeric: true,
    cell: (line) => <NumberText value={line.quantity} />,
  },
  { id: 'unit', header: 'Unit', minWidth: MIN_COLUMN_WIDTH, cell: (line) => line.unit },
  { id: 'price', header: 'Price', align: 'end', numeric: true, cell: (line) => money(line.price) },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    numeric: true,
    cell: (line) => money(line.amount),
  },
]

const DELIVERY_COLUMNS: DataTableColumn<DeliveryLine>[] = [
  { id: 'item', header: 'Item', minWidth: DESCRIPTION_MIN_WIDTH, cell: (line) => line.text },
  {
    id: 'quantity',
    header: 'Delivered',
    align: 'end',
    numeric: true,
    cell: (line) => <NumberText value={line.quantity} />,
  },
  { id: 'unit', header: 'Unit', minWidth: MIN_COLUMN_WIDTH, cell: (line) => line.unit },
]

function pricedLines(lines: readonly SalesLine[], phone: boolean) {
  return (
    <DataTable
      label="Lines"
      layout={phone ? 'cards' : 'table'}
      inCard
      columns={PRICED_COLUMNS}
      rows={lines}
      getRowId={(line) => line.id}
      getRowLabel={(line) => line.text}
      mobile={{ details: ['quantity', 'unit', 'price', 'amount'] }}
    />
  )
}

function totalsOf(totals: { net: string; vat: string; total: string }, label: string) {
  return {
    label: 'Totals',
    rows: [
      { key: 'net', label: 'Total without VAT', value: totals.net, currency: 'RSD' },
      { key: 'vat', label: 'VAT 20%', value: totals.vat, currency: 'RSD' },
    ],
    total: { key: 'total', label, value: totals.total, currency: 'RSD' },
  }
}

/** The next document in one click: the SplitAction, its menu the other documents. */
function CreateNext({
  label,
  next,
  stage,
  path,
  entries,
  onCreate,
}: {
  label: string
  next: ChainStage
  stage: ChainStage
  path: string
  entries: MenuEntry[]
  onCreate: (stage: ChainStage) => void
}) {
  const navigate = useContext(Navigate)
  if (stage >= next) return null
  return (
    <SplitAction
      intent="create"
      label={label}
      entries={entries}
      onClick={() => {
        onCreate(next)
        navigate(path)
      }}
    />
  )
}

/** A document of the chain: the shell and the page's frame shared by the four. */
function ChainPage({
  phone,
  tab,
  list,
  number,
  status,
  steps,
  current,
  chain,
  docKey,
  keyFigures,
  next,
  lines,
  totals,
  details,
  history,
}: {
  phone: boolean
  tab: string
  list: { label: string; path: string }
  number: string
  status: string
  steps: LifecycleStep[]
  current: number
  chain: ChainDocument[]
  docKey: string
  keyFigures: KeyFigure[]
  next: ReactNode
  lines: ReactNode
  totals?: ReturnType<typeof totalsOf>
  details: KeyValueItem[]
  history: { key: string; author: string; time: string; text: string }[]
}) {
  const panels = usePanels(['related'])
  const references = basedOn(chain, docKey)
  const related = chain.filter((each) => each.key !== docKey)
  return (
    <TradeShell
      phone={phone}
      tabs={moduleTabs(SALES, tab)}
      crumbs={[{ label: list.label, href: `#${list.path}` }, { label: number }]}
      {...(phone && next !== null ? { bottomBar: next } : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={number}
        back={{ href: `#${list.path}`, label: list.label }}
        status={tradeBadge(status)}
        lifecycle={{ steps, current, label: 'Status' }}
        counterparty={counterpartyOf('Customer', STANOGRADNJA)}
        {...(references === undefined ? {} : { references })}
        keyFigures={keyFigures}
        actions={
          <>
            <Button intent="pdf" label="PDF" emphasis="secondary" />
            {phone ? null : next}
          </>
        }
        lines={lines}
        {...(totals === undefined ? {} : { totals })}
        sections={[
          {
            key: 'details',
            title: 'Details',
            content: <KeyValueList columns={phone ? 1 : 2} items={details} />,
          },
        ]}
        panels={[
          ...(related.length > 0 ? [relatedPanel(chain, docKey)] : []),
          historyPanel(history),
        ]}
        {...panels}
      />
    </TradeShell>
  )
}

const date = (value: string) => ({ value: <DateText value={value} />, numeric: true })

/** A menu entry the application would answer with another document; here its notice. */
function also(label: string, made: string): MenuEntry {
  return {
    label,
    onSelect: () => {
      notice.success(made)
    },
  }
}

// ── Quote PON-2026-0031 ──────────────────────────────────────────────────────────────────────

export function QuoteScreen({ phone, least }: { phone: boolean; least: ChainStage }) {
  const [stage, setStage] = useStage(least)
  const chain = salesChain(stage)
  return (
    <ChainPage
      phone={phone}
      tab="quotes"
      list={{ label: 'Quotes', path: AV_ROUTES.quotes }}
      number={QUOTE.number}
      status={statusIn(chain, 'quote')}
      steps={[
        { key: 'draft', label: 'Draft' },
        { key: 'sent', label: 'Sent' },
        { key: 'accepted', label: 'Accepted' },
        { key: 'ordered', label: 'Ordered' },
      ]}
      current={stage > 1 ? 3 : 2}
      chain={chain}
      docKey="quote"
      keyFigures={[
        { label: 'Quote total', value: money(QUOTE.totals.total) },
        { label: 'Valid until', value: <DateText value={QUOTE.validUntil} /> },
        { label: 'Accepted', value: <DateText value={QUOTE.accepted} /> },
      ]}
      next={
        <CreateNext
          label="Create order"
          next={2}
          stage={stage}
          path={AV_ROUTES.order}
          onCreate={setStage}
          entries={[
            also('Create proforma invoice', 'Proforma invoice PR-2026-036 is created.'),
            also('Create advance invoice', 'Advance invoice A-2026-051 is created.'),
          ]}
        />
      }
      lines={pricedLines(QUOTE.lines, phone)}
      totals={totalsOf(QUOTE.totals, 'Quote total')}
      details={[
        { label: 'Subject', value: QUOTE.subject },
        { label: 'Issued', ...date(QUOTE.date) },
        { label: 'Prepared by', value: QUOTE.preparedBy },
        { label: 'Payment', value: '30 days from the invoice' },
      ]}
      history={[
        {
          key: 'h2',
          author: 'Stanogradnja Plus d.o.o.',
          time: '01.10.2026. 13:15',
          text: 'Accepted in the customer portal.',
        },
        {
          key: 'h1',
          author: 'Milena Jović',
          time: '28.09.2026. 10:02',
          text: 'Sent to nabavka@example.com.',
        },
      ]}
    />
  )
}

// ── Order NAR-2026-0024 ──────────────────────────────────────────────────────────────────────

export function SalesOrderScreen({ phone }: { phone: boolean }) {
  const [stage, setStage] = useStage(2)
  const chain = salesChain(stage)
  return (
    <ChainPage
      phone={phone}
      tab="orders"
      list={{ label: 'Orders', path: '/sales/orders' }}
      number={SALES_ORDER.number}
      status={statusIn(chain, 'order')}
      steps={[
        { key: 'confirmed', label: 'Confirmed' },
        { key: 'delivered', label: 'Delivered' },
        { key: 'invoiced', label: 'Invoiced' },
      ]}
      current={stage > 3 ? 2 : stage > 2 ? 1 : 0}
      chain={chain}
      docKey="order"
      keyFigures={[
        { label: 'Order total', value: money(SALES_ORDER.totals.total) },
        { label: 'Delivery', value: <DateText value={SALES_ORDER.deliveryDate} /> },
      ]}
      next={
        <CreateNext
          label="Create delivery note"
          next={3}
          stage={stage}
          path={AV_ROUTES.delivery}
          onCreate={setStage}
          entries={[also('Create advance invoice', 'Advance invoice A-2026-051 is created.')]}
        />
      }
      lines={pricedLines(SALES_ORDER.lines, phone)}
      totals={totalsOf(SALES_ORDER.totals, 'Order total')}
      details={[
        { label: 'Customer’s order', value: SALES_ORDER.customerReference },
        { label: 'Ordered', ...date(SALES_ORDER.date) },
        { label: 'Deliver to', value: SALES_ORDER.deliverTo },
        { label: 'Delivery date', ...date(SALES_ORDER.deliveryDate) },
      ]}
      history={[
        {
          key: 'h1',
          author: 'Milena Jović',
          time: '02.10.2026. 09:30',
          text: `Created from ${QUOTE.number}.`,
        },
      ]}
    />
  )
}

// ── Delivery note OTP-2026-0058 ──────────────────────────────────────────────────────────────

export function DeliveryNoteScreen({ phone }: { phone: boolean }) {
  const [stage, setStage] = useStage(3)
  const chain = salesChain(stage)
  return (
    <ChainPage
      phone={phone}
      tab="orders"
      list={{ label: 'Orders', path: '/sales/orders' }}
      number={DELIVERY.number}
      status={statusIn(chain, 'delivery')}
      steps={[
        { key: 'issued', label: 'Issued' },
        { key: 'delivered', label: 'Delivered' },
        { key: 'invoiced', label: 'Invoiced' },
      ]}
      current={stage > 3 ? 2 : 1}
      chain={chain}
      docKey="delivery"
      keyFigures={[
        { label: 'Delivered', value: <DateText value={DELIVERY.date} /> },
        { label: 'Lines', value: '3 of 3 delivered' },
      ]}
      next={
        <CreateNext
          label="Create invoice"
          next={4}
          stage={stage}
          path={AV_ROUTES.invoice}
          onCreate={setStage}
          entries={[
            also(
              'Create one invoice for several delivery notes…',
              'Choose the delivery notes in the list of orders.',
            ),
          ]}
        />
      }
      lines={
        <DataTable
          label="Delivered lines"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={DELIVERY_COLUMNS}
          rows={DELIVERY.lines}
          getRowId={(line) => line.id}
          getRowLabel={(line) => line.text}
          mobile={{ details: ['quantity', 'unit'] }}
        />
      }
      details={[
        { label: 'From', value: DELIVERY.warehouse },
        { label: 'Delivered on', ...date(DELIVERY.date) },
        { label: 'Vehicles', value: DELIVERY.vehicle },
        { label: 'Received by', value: DELIVERY.receivedBy },
      ]}
      history={[
        {
          key: 'h1',
          author: 'Zoran Bojović',
          time: '12.10.2026. 07:10',
          text: `Issued from the Central warehouse for ${SALES_ORDER.number}.`,
        },
      ]}
    />
  )
}

// ── Invoice F-2026-0430 ──────────────────────────────────────────────────────────────────────

export function SalesInvoiceScreen({ phone }: { phone: boolean }) {
  const [stage] = useStage(4)
  const chain = salesChain(stage)
  const [sent, setSent] = useState(false)
  const send = sent ? null : (
    <Button
      family="primary"
      emphasis="primary"
      icon={Send}
      label="Send to SEF"
      onClick={() => {
        setSent(true)
        notice.success(`${SALES_INVOICE.number} is sent to SEF.`)
      }}
    />
  )
  return (
    <ChainPage
      phone={phone}
      tab="invoices"
      list={{ label: 'Invoices', path: '/sales/invoices' }}
      number={SALES_INVOICE.number}
      status={sent ? 'Sent' : statusIn(chain, 'invoice')}
      steps={[
        { key: 'issued', label: 'Issued' },
        { key: 'sef', label: 'Sent to SEF' },
        { key: 'paid', label: 'Paid' },
      ]}
      current={sent ? 1 : 0}
      chain={chain}
      docKey="invoice"
      keyFigures={[
        { label: 'Invoice total', value: money(SALES_INVOICE.totals.total) },
        { label: 'Due', value: <DateText value={SALES_INVOICE.due} /> },
      ]}
      next={send}
      lines={pricedLines(SALES_INVOICE.lines, phone)}
      totals={totalsOf(SALES_INVOICE.totals, 'Invoice total')}
      details={[
        { label: 'Issued', ...date(SALES_INVOICE.date) },
        { label: 'Due', ...date(SALES_INVOICE.due) },
        { label: 'Payment reference', value: <bdi dir="ltr">{SALES_INVOICE.reference}</bdi> },
        { label: 'Delivery', value: `${DELIVERY.number}, ${DELIVERY.warehouse}` },
      ]}
      history={[
        {
          key: 'h1',
          author: 'Milica Petrović',
          time: '14.10.2026. 09:40',
          text: `Created from ${DELIVERY.number}.`,
        },
      ]}
    />
  )
}

// ── The quotes ────────────────────────────────────────────────────────────────────────────────

const QUOTE_COLUMNS: DataTableColumn<QuoteRow>[] = [
  {
    id: 'number',
    header: 'Quote',
    cell: (row) => (
      <span dir="ltr" className="font-medium tabular-nums">
        {row.number}
      </span>
    ),
  },
  { id: 'customer', header: 'Customer', cell: (row) => row.customer },
  {
    id: 'subject',
    header: 'Subject',
    minWidth: DESCRIPTION_MIN_WIDTH,
    cell: (row) => <span className="bidi-content">{row.subject}</span>,
  },
  { id: 'date', header: 'Issued', numeric: true, cell: (row) => <DateText value={row.date} /> },
  {
    id: 'valid',
    header: 'Valid until',
    numeric: true,
    cell: (row) => <DateText value={row.validUntil} />,
  },
  { id: 'total', header: 'Total', align: 'end', numeric: true, cell: (row) => money(row.total) },
  { id: 'state', header: 'State', cell: (row) => tradeBadge(row.state) },
]

export function QuotesScreen({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [stage] = useExampleState<ChainStage>('AV.stage', () => 1)
  const [view, setView] = useState('open')
  const [search, setSearch] = useState('')
  // The featured quote is "Ordered" once its order exists.
  const quotes = QUOTES.map((row) =>
    row.number === QUOTE.number && stage > 1 ? { ...row, state: 'Ordered' as const } : row,
  )
  const inView = (row: QuoteRow, id: string) =>
    QUOTE_VIEWS.find((each) => each.id === id)?.states.includes(row.state) === true
  const needle = search.trim().toLowerCase()
  const rows = quotes.filter(
    (row) =>
      inView(row, view) &&
      (needle === '' ||
        `${row.number} ${row.customer} ${row.subject}`.toLowerCase().includes(needle)),
  )
  return (
    <TradeShell
      phone={phone}
      tabs={moduleTabs(SALES, 'quotes')}
      crumbs={[{ label: 'Sales' }, { label: 'Quotes' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Quotes"
        actions={<Button intent="create" label="New quote" />}
        views={QUOTE_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: quotes.filter((row) => inView(row, each.id)).length,
        }))}
        view={view}
        onViewChange={setView}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={[]}
            values={{}}
            onValuesChange={() => undefined}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Quote, customer or subject"
          />
        }
      >
        <DataTable
          label="Quotes"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={QUOTE_COLUMNS}
          rows={rows}
          getRowId={(row) => row.number}
          getRowLabel={(row) => `${row.number}, ${row.customer}`}
          filters={{ search }}
          onFiltersChange={() => {
            setSearch('')
          }}
          count={rows.length}
          onRowClick={(row) => {
            if (row.number === QUOTE.number) navigate(AV_ROUTES.quote)
            else notice.info(`${row.number} is not part of the examples.`)
          }}
          mobile={{
            title: (row) => row.customer,
            subtitle: (row) => <span dir="ltr">{row.number}</span>,
            badge: (row) => tradeBadge(row.state),
            details: ['subject', 'valid', 'total'],
          }}
        />
      </ListPage>
    </TradeShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AV_ROUTES: ExampleRoute[] = [
  { path: AV_ROUTES.quotes, render: (phone) => <QuotesScreen phone={phone} /> },
  { path: AV_ROUTES.quote, render: (phone) => <QuoteScreen phone={phone} least={1} /> },
  { path: AV_ROUTES.quoteDone, render: (phone) => <QuoteScreen phone={phone} least={4} /> },
  { path: AV_ROUTES.order, render: (phone) => <SalesOrderScreen phone={phone} /> },
  { path: AV_ROUTES.delivery, render: (phone) => <DeliveryNoteScreen phone={phone} /> },
  { path: AV_ROUTES.invoice, render: (phone) => <SalesInvoiceScreen phone={phone} /> },
]
