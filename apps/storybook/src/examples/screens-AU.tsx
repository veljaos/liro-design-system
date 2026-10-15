import { FileSearch, Inbox, MessageSquareText } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  ActionGroup,
  ActivityList,
  Button,
  ChangeText,
  correctionColumns,
  DataTable,
  DateText,
  DESCRIPTION_MIN_WIDTH,
  DetailPage,
  DocumentPage,
  DocumentReferences,
  KeyValueList,
  MIN_COLUMN_WIDTH,
  MoneyText,
  notice,
  NumberText,
  RelatedDocuments,
  StatusBadge,
  Toaster,
  toneFor,
  ValueComparison,
  type ActionItem,
  type ComparisonRow,
  type DataTableColumn,
  type LifecycleStep,
  type ModuleTab,
  type SidePanel,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell, type ExampleAccount } from './example-shell'
import { useExampleState } from './example-state'
import { Tenant } from './screens-G'
import {
  AU_ROUTES,
  AU_TODAY,
  BETON_MIX,
  INVOICE,
  MATCH_ROWS,
  ORDER,
  PUMP_ACCEPTED_NOTE,
  PURCHASE_CHAIN,
  RECEIPT,
  TRADE_TONES,
  type ChainDocument,
  type MatchRow,
  type OrderLine,
  type Party,
  type ReceiptLine,
} from './data-AU'

/*
 * Group AU's example screens (P5.49, the purchasing chain): Kvadrat Gradnja d.o.o.'s purchasing
 * on 14 October 2026 at 09:40, seen by Milica Petrović.
 * - Purchase order NB-2026-0087 to Beton Mix d.o.o. (DocumentPage): where it stands (sent,
 *   confirmed, received, invoice matched, closed), the lines and totals, delivery and terms, the
 *   chain in the related documents; "Match invoice 2026-1187" is the main action.
 * - Goods receipt PRI-2026-0213 at Site Liman 4 (DocumentPage): "Based on" the order; each line
 *   received against ordered in the Original / Change / New pattern (`correctionColumns` with
 *   the headers Ordered / Difference / Received) and the receiver's reason; the received value
 *   and the difference against the order from the application.
 * - The three-way match of Beton Mix's invoice 2026-1187 (DetailPage): the order, the receipt and
 *   the invoice side by side (ValueComparison with three sources), the application's verdict per
 *   row ("Invoiced as received", "More than ordered: needs approval"); the extra pump hour is
 *   accepted, or a credit note asked for; the invoice itself is reviewed and posted in the
 *   document inbox (group U), linked both ways through the chain.
 * Also the shared pieces of groups AV and AW (TradeShell, the related-documents panel).
 */

export { AU_ROUTES }

// ── Shared pieces (groups AU, AV, AW) ─────────────────────────────────────────────────────────

/** A trade document's state as a badge, in the application's tones. */
export function tradeBadge(status: string) {
  return <StatusBadge label={status} tone={toneFor(status, TRADE_TONES)} />
}

/** A party as DocumentPage's counterparty. */
export function counterpartyOf(label: string, party: Party) {
  return { label, name: party.name, taxId: party.taxId, address: party.address }
}

/** The tabs of a module, the current one marked. */
export function moduleTabs(
  tabs: readonly { key: string; label: string; path: string }[],
  current: string,
): ModuleTab[] {
  return tabs.map((tab) => ({
    key: tab.key,
    label: tab.label,
    href: `#${tab.path}`,
    current: tab.key === current,
  }))
}

/** A signed-in screen of the trade examples on 14 October 2026, with its toasts. */
export function TradeShell({
  phone,
  tabs,
  crumbs,
  bottomBar,
  account,
  company,
  children,
}: {
  phone: boolean
  tabs: ModuleTab[]
  crumbs: { label: string; href?: string }[]
  bottomBar?: ReactNode
  account?: ExampleAccount
  company?: string
  children: ReactNode
}) {
  return (
    <Tenant today={AU_TODAY}>
      <Shell
        phone={phone}
        crumbs={crumbs}
        tabs={tabs}
        {...(bottomBar === undefined ? {} : { bottomBar })}
        {...(account === undefined ? {} : { account })}
        {...(company === undefined ? {} : { company })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

/** The side panels' open state, as the application keeps it. */
export function usePanels(initial: string[]) {
  const [open, setOpen] = useState<string[]>(initial)
  const [hidden, setHidden] = useState(false)
  return {
    panelsOpen: open,
    onPanelsOpenChange: setOpen,
    panelsHidden: hidden,
    onPanelsHiddenChange: setHidden,
  }
}

/** The chain's other documents, in the chain's order, as a side panel. */
export function relatedPanel(chain: readonly ChainDocument[], current: string): SidePanel {
  const others = chain.filter((each) => each.key !== current)
  return {
    key: 'related',
    title: 'Related documents',
    count: others.length,
    content: (
      <RelatedDocuments
        label="Related documents"
        items={others.map((each) => ({
          key: each.key,
          type: each.type,
          number: each.number,
          href: `#${each.path}`,
          status: tradeBadge(each.status),
        }))}
      />
    ),
  }
}

/** A document's history, newest first, as a side panel. */
export function historyPanel(
  entries: readonly { key: string; author: string; time: string; text: string }[],
): SidePanel {
  return {
    key: 'history',
    title: 'History',
    content: (
      <ActivityList
        label="History"
        items={entries.map((entry) => ({
          ...entry,
          time: <span dir="ltr">{entry.time}</span>,
        }))}
      />
    ),
  }
}

/** A quantity with its unit, the number through the provider's format. */
export function Quantity({ value, unit }: { value: string | null; unit?: string }) {
  if (value === null) return <NumberText value={null} />
  return (
    <span className="bidi-isolate whitespace-nowrap">
      <NumberText value={value} />
      {unit === undefined ? null : ` ${unit}`}
    </span>
  )
}

// ── The purchasing module ─────────────────────────────────────────────────────────────────────

const PURCHASING_TABS = [
  { key: 'orders', label: 'Purchase orders', path: '/purchasing/orders' },
  { key: 'receipts', label: 'Goods receipts', path: '/purchasing/receipts' },
  { key: 'approvals', label: 'Approvals', path: '/purchasing/approvals' },
]

/** Whether the extra pump hour was accepted: kept above the screens, as the Core keeps it. */
function useAccepted(initial: boolean) {
  return useExampleState<boolean>('AU.accepted', () => initial)
}

/** The chain as it stands: after the acceptance the order and the invoice are matched. */
function chainNow(accepted: boolean): ChainDocument[] {
  return PURCHASE_CHAIN.map((each) =>
    accepted && each.key !== 'receipt' ? { ...each, status: 'Matched' } : each,
  )
}

function statusOf(chain: readonly ChainDocument[], key: string): string {
  return chain.find((each) => each.key === key)?.status ?? ''
}

const ORDER_STEPS: LifecycleStep[] = [
  { key: 'sent', label: 'Sent' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'received', label: 'Received' },
  { key: 'matched', label: 'Invoice matched' },
  { key: 'closed', label: 'Closed' },
]

const money = (value: string | null) => <MoneyText value={value} currency="RSD" />

const ORDER_COLUMNS: DataTableColumn<OrderLine>[] = [
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

/** "Match invoice 2026-1187": the order's and the receipt's main action. */
function MatchButton() {
  const navigate = useContext(Navigate)
  return (
    <Button
      family="primary"
      emphasis="primary"
      icon={FileSearch}
      label={`Match invoice ${INVOICE.number}`}
      onClick={() => {
        navigate(AU_ROUTES.match)
      }}
    />
  )
}

// ── Purchase order NB-2026-0087 ──────────────────────────────────────────────────────────────

export function PurchaseOrderScreen({ phone }: { phone: boolean }) {
  const [accepted] = useAccepted(false)
  const chain = chainNow(accepted)
  const panels = usePanels(['related'])
  return (
    <TradeShell
      phone={phone}
      tabs={moduleTabs(PURCHASING_TABS, 'orders')}
      crumbs={[{ label: 'Purchase orders', href: '#/purchasing/orders' }, { label: ORDER.number }]}
      {...(phone && !accepted ? { bottomBar: <MatchButton /> } : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={ORDER.number}
        back={{ href: '#/purchasing/orders', label: 'Purchase orders' }}
        status={tradeBadge(statusOf(chain, 'order'))}
        lifecycle={{ steps: ORDER_STEPS, current: accepted ? 3 : 2, label: 'Order status' }}
        counterparty={counterpartyOf('Supplier', BETON_MIX)}
        keyFigures={[
          { label: 'Order total', value: money(ORDER.totals.total) },
          { label: 'Delivery', value: <DateText value={ORDER.deliveryDate} /> },
          { label: 'Received', value: '3 of 3 lines' },
        ]}
        actions={
          <>
            <Button intent="pdf" label="PDF" emphasis="secondary" />
            {phone || accepted ? null : <MatchButton />}
          </>
        }
        lines={
          <DataTable
            label="Ordered lines"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={ORDER_COLUMNS}
            rows={ORDER.lines}
            getRowId={(line) => line.id}
            getRowLabel={(line) => line.text}
            mobile={{ details: ['quantity', 'unit', 'price', 'amount'] }}
          />
        }
        totals={{
          label: 'Totals',
          rows: [
            { key: 'net', label: 'Total without VAT', value: ORDER.totals.net, currency: 'RSD' },
            { key: 'vat', label: 'VAT 20%', value: ORDER.totals.vat, currency: 'RSD' },
          ],
          total: { key: 'total', label: 'Order total', value: ORDER.totals.total, currency: 'RSD' },
        }}
        sections={[
          {
            key: 'delivery',
            title: 'Delivery and terms',
            content: (
              <KeyValueList
                columns={phone ? 1 : 2}
                items={[
                  { label: 'Deliver to', value: ORDER.deliverTo },
                  {
                    label: 'Delivery date',
                    value: <DateText value={ORDER.deliveryDate} />,
                    numeric: true,
                  },
                  { label: 'Project', value: ORDER.project },
                  { label: 'Ordered by', value: ORDER.buyer },
                  { label: 'Payment', value: ORDER.terms },
                  {
                    label: 'Confirmed by the supplier',
                    value: <DateText value={ORDER.supplierConfirmed} />,
                    numeric: true,
                  },
                ]}
              />
            ),
          },
        ]}
        panels={[
          relatedPanel(chain, 'order'),
          historyPanel([
            {
              key: 'h3',
              author: 'Snežana Popović',
              time: '12.10.2026. 16:20',
              text: `Received with ${RECEIPT.number}: two differences.`,
            },
            {
              key: 'h2',
              author: 'Beton Mix d.o.o.',
              time: '06.10.2026. 08:05',
              text: 'Confirmed through Liro Bridge.',
            },
            {
              key: 'h1',
              author: 'Ivan Lukić',
              time: '05.10.2026. 11:40',
              text: 'Sent to racuni@betonmix.example.com.',
            },
          ]),
        ]}
        {...panels}
      />
    </TradeShell>
  )
}

// ── Goods receipt PRI-2026-0213 ──────────────────────────────────────────────────────────────

const RECEIPT_COLUMNS: DataTableColumn<ReceiptLine>[] = [
  { id: 'item', header: 'Item', minWidth: DESCRIPTION_MIN_WIDTH, cell: (line) => line.text },
  { id: 'unit', header: 'Unit', minWidth: MIN_COLUMN_WIDTH, cell: (line) => line.unit },
  ...correctionColumns<ReceiptLine>({
    id: 'quantity',
    original: (line) => line.ordered,
    change: (line) => line.difference,
    next: (line) => line.received,
    headers: { original: 'Ordered', change: 'Difference', next: 'Received' },
  }),
  {
    id: 'note',
    header: 'Reason',
    minWidth: DESCRIPTION_MIN_WIDTH,
    cell: (line) =>
      line.note === null ? null : <span className="bidi-content text-secondary">{line.note}</span>,
  },
]

export function GoodsReceiptScreen({ phone }: { phone: boolean }) {
  const [accepted] = useAccepted(false)
  const chain = chainNow(accepted)
  const panels = usePanels(['related'])
  return (
    <TradeShell
      phone={phone}
      tabs={moduleTabs(PURCHASING_TABS, 'receipts')}
      crumbs={[
        { label: 'Goods receipts', href: '#/purchasing/receipts' },
        { label: RECEIPT.number },
      ]}
      {...(phone && !accepted ? { bottomBar: <MatchButton /> } : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={RECEIPT.number}
        back={{ href: '#/purchasing/receipts', label: 'Goods receipts' }}
        status={tradeBadge('Posted')}
        counterparty={counterpartyOf('Supplier', BETON_MIX)}
        references={
          <DocumentReferences
            groups={[
              {
                key: 'order',
                label: 'Purchase order',
                items: [
                  {
                    key: 'order',
                    number: ORDER.number,
                    href: `#${AU_ROUTES.order}`,
                    status: {
                      label: statusOf(chain, 'order'),
                      tone: toneFor(statusOf(chain, 'order'), TRADE_TONES),
                    },
                  },
                ],
              },
            ]}
          />
        }
        keyFigures={[
          { label: 'Received, without VAT', value: money(RECEIPT.receivedValue) },
          {
            label: 'Against the order',
            value: <ChangeText value={RECEIPT.valueDifference} currency="RSD" />,
          },
          { label: 'Lines with a difference', value: <NumberText value="2" /> },
        ]}
        actions={
          <>
            <Button intent="print" label="Print" emphasis="secondary" />
            {phone || accepted ? null : <MatchButton />}
          </>
        }
        lines={
          <DataTable
            label="Received lines"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={RECEIPT_COLUMNS}
            rows={RECEIPT.lines}
            getRowId={(line) => line.id}
            getRowLabel={(line) => line.text}
            mobile={{
              details: ['quantity.original', 'quantity.change', 'quantity.new', 'unit', 'note'],
            }}
          />
        }
        totals={{
          label: 'Value at the order’s prices',
          rows: [
            {
              key: 'ordered',
              label: 'Ordered, without VAT',
              value: RECEIPT.orderedValue,
              currency: 'RSD',
            },
            {
              key: 'difference',
              label: 'Difference',
              value: RECEIPT.valueDifference,
              currency: 'RSD',
            },
          ],
          total: {
            key: 'received',
            label: 'Received, without VAT',
            value: RECEIPT.receivedValue,
            currency: 'RSD',
          },
        }}
        sections={[
          {
            key: 'receipt',
            title: 'Receipt',
            content: (
              <KeyValueList
                columns={phone ? 1 : 2}
                items={[
                  { label: 'Warehouse', value: RECEIPT.warehouse },
                  {
                    label: 'Received on',
                    value: <DateText value={RECEIPT.date} />,
                    numeric: true,
                  },
                  { label: 'Received by', value: RECEIPT.receivedBy },
                  { label: 'Supplier’s document', value: RECEIPT.supplierNote },
                ]}
              />
            ),
          },
        ]}
        panels={[
          relatedPanel(chain, 'receipt'),
          historyPanel([
            {
              key: 'h1',
              author: 'Snežana Popović',
              time: '12.10.2026. 16:20',
              text: 'Posted at Site Liman 4 with two differences.',
            },
          ]),
        ]}
        {...panels}
      />
    </TradeShell>
  )
}

// ── The three-way match of 2026-1187 ─────────────────────────────────────────────────────────

function matchValue(row: MatchRow, value: string | null): ReactNode {
  if (value === null) return null
  if (row.kind === 'money') return money(value)
  if (row.kind === 'date') return <DateText value={value} />
  if (row.kind === 'quantity')
    return <Quantity value={value} {...(row.unit === undefined ? {} : { unit: row.unit })} />
  return value
}

/** The match rows as ValueComparison takes them; the accepted row is no longer a difference. */
function comparisonRows(accepted: boolean): ComparisonRow[] {
  return MATCH_ROWS.map((row) => {
    const done = accepted && row.differs === true
    return {
      id: row.id,
      label: row.label,
      values: [
        matchValue(row, row.order),
        matchValue(row, row.receipt),
        matchValue(row, row.invoice),
      ],
      numeric: true,
      ...(row.differs === true && !done ? { differs: true } : {}),
      ...(done ? { note: PUMP_ACCEPTED_NOTE } : row.note === undefined ? {} : { note: row.note }),
    }
  })
}

export function ThreeWayMatchScreen({
  phone,
  start,
}: {
  phone: boolean
  start: { accepted: boolean }
}) {
  const navigate = useContext(Navigate)
  const [accepted, setAccepted] = useAccepted(start.accepted)
  const chain = chainNow(accepted)
  const actions: ActionItem[] = accepted
    ? [
        {
          key: 'inbox',
          intent: 'next',
          label: 'Post in the document inbox',
          onClick: () => {
            navigate(AU_ROUTES.invoice)
          },
        },
      ]
    : [
        {
          key: 'inbox',
          family: 'neutral',
          icon: Inbox,
          label: 'Open in the document inbox',
          onClick: () => {
            navigate(AU_ROUTES.invoice)
          },
        },
        {
          key: 'credit',
          family: 'neutral',
          icon: MessageSquareText,
          label: 'Ask for a credit note',
          onClick: () => {
            notice.success('Beton Mix d.o.o. is asked for a credit note for 1 h of pumping.')
          },
        },
        {
          key: 'accept',
          intent: 'confirm',
          label: 'Accept the difference',
          onClick: () => {
            setAccepted(true)
            notice.success(`Invoice ${INVOICE.number} matches. It can be posted.`)
          },
        },
      ]
  return (
    <TradeShell
      phone={phone}
      tabs={moduleTabs(PURCHASING_TABS, 'approvals')}
      crumbs={[
        { label: 'Approvals', href: '#/purchasing/approvals' },
        { label: `Match ${INVOICE.number}` },
      ]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={`Match ${INVOICE.number}`}
        back={{ href: '#/purchasing/approvals', label: 'Approvals' }}
        status={tradeBadge(accepted ? 'Matched' : '1 difference')}
        subtitle={`Supplier invoice ${INVOICE.number} · ${BETON_MIX.name}`}
        keyFigures={[
          { label: 'Invoice total', value: money(INVOICE.total) },
          { label: 'Order total', value: money(ORDER.totals.total) },
          { label: 'Due', value: <DateText value={INVOICE.due} /> },
        ]}
        actions={<ActionGroup actions={actions} />}
        sections={[
          {
            id: 'match',
            label: 'Order, receipt and invoice',
            description:
              'The quantities and prices of the three documents; the differences as the application found them.',
            content: (
              <ValueComparison
                label={`Order ${ORDER.number}, receipt ${RECEIPT.number}, invoice ${INVOICE.number}`}
                columns={[
                  `Order ${ORDER.number}`,
                  `Receipt ${RECEIPT.number}`,
                  `Invoice ${INVOICE.number}`,
                ]}
                rowHeader="Line"
                rows={comparisonRows(accepted)}
                layout={phone ? 'phone' : 'desktop'}
              />
            ),
          },
          {
            id: 'documents',
            label: 'Documents',
            content: (
              <RelatedDocuments
                label="Documents"
                items={chain.map((each) => ({
                  key: each.key,
                  type: each.type,
                  number: each.number,
                  href: `#${each.path}`,
                  status: tradeBadge(each.status),
                }))}
              />
            ),
          },
        ]}
      />
    </TradeShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AU_ROUTES: ExampleRoute[] = [
  { path: AU_ROUTES.order, render: (phone) => <PurchaseOrderScreen phone={phone} /> },
  { path: AU_ROUTES.receipt, render: (phone) => <GoodsReceiptScreen phone={phone} /> },
  {
    path: AU_ROUTES.match,
    render: (phone) => <ThreeWayMatchScreen phone={phone} start={{ accepted: false }} />,
  },
  {
    path: AU_ROUTES.matchAccepted,
    render: (phone) => <ThreeWayMatchScreen phone={phone} start={{ accepted: true }} />,
  },
]
