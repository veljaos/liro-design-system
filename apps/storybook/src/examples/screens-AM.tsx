import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import {
  Alert,
  Button,
  DataTable,
  DateText,
  DocumentPage,
  KeyFigures,
  KeyValueList,
  MoneyText,
  ReportPage,
  SectionCard,
  SelectField,
  useLiro,
  type DataTableColumn,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { statusBadge } from './example-shell'
import {
  AM_ROUTES,
  CASH_BOOK_DAYS,
  CASH_DESK,
  CASH_NOW,
  CASH_ROWS,
  PAYMENT_SLIP,
  RECEIPT_SLIP,
  type CashRow,
  type CashSlip,
} from './data-AM'
import { DocumentLink, LedgerShell } from './screens-AK'

/*
 * Group AM's example screens (P5.46): the main cash desk of Kvadrat Gradnja d.o.o. — the cash
 * journal of 12–14 October 2026 by day, and a cash receipt and a cash payment slip. Assembled from
 * what exists: ReportPage (cash desk and days as parameters) with KeyFigures, the cash limit as a
 * warning Alert in the application's words and figures, and one DataTable whose rows are grouped
 * by day with DataTable's line types (the day as a heading; opening balance, the day's totals and
 * the closing balance as subtotals); each slip a DocumentPage (who paid in or was paid, the
 * purpose and account as its lines, the amount as its total). Every figure is the Core's
 * (data-AM.ts); nothing is added on the screen.
 */

export { AM_ROUTES }

// ── The cash journal ──────────────────────────────────────────────────────────────────────────

function cashColumns(): DataTableColumn<CashRow>[] {
  return [
    {
      id: 'slip',
      header: 'Slip',
      cell: (row) => (row.slip === undefined ? null : <DocumentLink document={row.slip} />),
    },
    { id: 'description', header: 'Description', minWidth: 240, cell: (row) => row.description },
    { id: 'partner', header: 'Received from / paid to', minWidth: 160, cell: (row) => row.partner },
    {
      id: 'account',
      header: 'Account',
      cell: (row) =>
        row.account === undefined ? null : <span className="bidi-isolate">{row.account}</span>,
    },
    {
      id: 'receipt',
      header: 'Receipt',
      align: 'end',
      numeric: true,
      cell: (row) => <MoneyText value={row.receipt} currency="RSD" />,
    },
    {
      id: 'payment',
      header: 'Payment',
      align: 'end',
      numeric: true,
      cell: (row) => <MoneyText value={row.payment} currency="RSD" />,
    },
    {
      id: 'balance',
      header: 'Cash',
      align: 'end',
      numeric: true,
      minWidth: 140,
      cell: (row) => <MoneyText value={row.balance} currency="RSD" />,
    },
  ]
}

const CASH_COLUMNS = cashColumns()

/** The cash journal of 12–14 October 2026. */
export function CashBook({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const lineText = (row: CashRow) => {
    switch (row.type) {
      case 'day':
        return `${format.date(row.date)} · cash journal no. ${row.journal}`
      case 'opening':
        return 'Opening balance'
      case 'total':
        return 'Receipts and payments of the day'
      case 'closing':
        return `Closing balance ${format.date(row.date)}`
      case 'entry':
        return `${row.slip?.number ?? ''} ${row.description ?? ''}`
    }
  }
  const actions = (
    <>
      <Button family="neutral" icon={ArrowUpFromLine} emphasis="secondary" label="New payment" />
      <Button family="primary" icon={ArrowDownToLine} emphasis="primary" label="New receipt" />
    </>
  )
  const today = CASH_BOOK_DAYS[CASH_BOOK_DAYS.length - 1]
  return (
    <LedgerShell
      phone={phone}
      tab="cash"
      crumbs={[{ label: 'Accounting' }, { label: 'Cash book' }]}
    >
      <ReportPage
        layout={phone ? 'phone' : 'desktop'}
        title="Cash book"
        subtitle={`${CASH_DESK.name}, account ${CASH_DESK.account} · cashier ${CASH_DESK.cashier}`}
        actions={actions}
        parametersOpen={false}
        parameters={
          <>
            <SelectField
              label="Cash desk"
              options={[{ value: 'main', label: `${CASH_DESK.name} (${CASH_DESK.account})` }]}
              defaultValue="main"
              {...(phone ? {} : { className: 'w-64' })}
            />
            <SelectField
              label="Days"
              options={[{ value: 'week', label: '12.–14.10.2026.' }]}
              defaultValue="week"
              {...(phone ? {} : { className: 'w-48' })}
            />
          </>
        }
        summary={[
          { key: 'desk', label: 'Cash desk', value: `${CASH_DESK.name} (${CASH_DESK.account})` },
          { key: 'days', label: 'Days', value: '12.–14.10.2026.' },
        ]}
        onRun={() => undefined}
      >
        {CASH_NOW.excess !== null && CASH_NOW.since !== null && (
          <Alert tone="warning" title="The cash is above the cash desk's limit">
            {`The cash desk holds ${format.money(CASH_NOW.balance, 'RSD')}, above its limit of ${format.money(CASH_DESK.limit, 'RSD')} (illustrative) since the end of ${format.date(CASH_NOW.since)}. Deposit ${format.money(CASH_NOW.excess, 'RSD')} with the bank by the end of the day.`}
          </Alert>
        )}
        <KeyFigures
          layout={phone ? 'phone' : 'desktop'}
          items={[
            {
              key: 'cash',
              label: `Cash on ${today === undefined ? '' : format.date(today.date)}`,
              value: <MoneyText value={CASH_NOW.balance} currency="RSD" />,
              ...(CASH_NOW.excess === null ? {} : { tone: 'warning' as const }),
            },
            {
              key: 'limit',
              label: 'Cash limit',
              value: <MoneyText value={CASH_DESK.limit} currency="RSD" />,
            },
            {
              key: 'receipts',
              label: 'Receipts today',
              value: <MoneyText value={CASH_NOW.receipts} currency="RSD" />,
            },
            {
              key: 'payments',
              label: 'Payments today',
              value: <MoneyText value={CASH_NOW.payments} currency="RSD" />,
            },
          ]}
        />
        <SectionCard flush>
          <DataTable
            inCard
            label="Cash journal, 12.–14.10.2026."
            layout={phone ? 'cards' : 'table'}
            columns={CASH_COLUMNS}
            rows={CASH_ROWS}
            getRowId={(row) => row.id}
            getRowLabel={lineText}
            lineType={(row) =>
              row.type === 'day' ? 'heading' : row.type === 'entry' ? 'line' : 'subtotal'
            }
            lineText={lineText}
            mobile={{
              title: (row) => (row.type === 'entry' ? (row.description ?? '') : lineText(row)),
              subtitle: (row) => (row.type === 'entry' ? row.partner : null),
              details: ['slip', 'receipt', 'payment', 'balance'],
            }}
          />
        </SectionCard>
      </ReportPage>
    </LedgerShell>
  )
}

// ── A cash slip ───────────────────────────────────────────────────────────────────────────────

type SlipLine = CashSlip['lines'][number]

const SLIP_COLUMNS: DataTableColumn<SlipLine>[] = [
  { id: 'purpose', header: 'Purpose', minWidth: 240, cell: (line) => line.purpose },
  {
    id: 'account',
    header: 'Account',
    minWidth: 200,
    cell: (line) => (
      <span className="flex flex-col">
        <span className="bidi-content">{line.account}</span>
        <span className="bidi-content text-xs text-secondary">{line.analytics}</span>
      </span>
    ),
  },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.amount} currency="RSD" />,
  },
]

function CashSlipScreen({ phone, slip }: { phone: boolean; slip: CashSlip }) {
  const { format } = useLiro()
  const receipt = slip.kind === 'receipt'
  const kind = receipt ? 'Cash receipt' : 'Cash payment'
  const print = <Button intent="print" label="Print slip" />
  return (
    <LedgerShell
      phone={phone}
      tab="cash"
      crumbs={[{ label: 'Cash book', href: `#${AM_ROUTES.book}` }, { label: slip.number }]}
      {...(phone ? { bottomBar: print } : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={slip.number}
        back={{ href: `#${AM_ROUTES.book}`, label: 'Cash book' }}
        status={statusBadge('Posted')}
        actions={
          <>
            <Button intent="duplicate" emphasis="secondary" label="Copy slip" />
            {phone ? null : print}
          </>
        }
        counterparty={{
          label: receipt ? 'Received from' : 'Paid to',
          name: slip.party.name,
          taxId: slip.party.detail,
          ...(slip.party.address === undefined ? {} : { address: slip.party.address }),
        }}
        keyFigures={[
          { label: kind, value: <MoneyText value={slip.total} currency="RSD" /> },
          { label: 'Date', value: <DateText value={slip.date} /> },
          { label: 'Cash journal', value: `No. ${slip.journal}` },
        ]}
        {...(receipt && CASH_BOOK_DAYS.some((day) => day.date === slip.date && day.overLimit)
          ? {
              banner: (
                <Alert tone="warning" title="This receipt took the cash above its limit">
                  {`At the end of ${format.date(slip.date)} the cash desk held more than its limit of ${format.money(CASH_DESK.limit, 'RSD')} (illustrative).`}
                </Alert>
              ),
            }
          : {})}
        linesTitle="Purpose"
        lines={
          <DataTable
            inCard
            label={`Lines of ${slip.number}`}
            layout={phone ? 'cards' : 'table'}
            columns={SLIP_COLUMNS}
            rows={slip.lines}
            getRowId={(line) => line.id}
            getRowLabel={(line) => line.purpose}
            mobile={{ title: (line) => line.purpose, details: ['account', 'amount'] }}
          />
        }
        totals={{
          label: 'Amount',
          rows: [],
          total: { key: 'total', label: `${kind} total`, value: slip.total, currency: 'RSD' },
        }}
        sections={[
          {
            key: 'cash',
            title: receipt ? 'Paid in' : 'Paid out',
            content: (
              <KeyValueList
                items={[
                  {
                    key: 'desk',
                    label: 'Cash desk',
                    value: `${CASH_DESK.name} (${CASH_DESK.account})`,
                  },
                  { key: 'cashier', label: 'Cashier', value: CASH_DESK.cashier },
                  {
                    key: 'person',
                    label: receipt ? 'Paid in by' : 'Received by',
                    value: slip.person,
                  },
                  { key: 'posted', label: 'Posting', value: slip.postedAs },
                ]}
              />
            ),
          },
        ]}
      />
    </LedgerShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AM_ROUTES: ExampleRoute[] = [
  { path: AM_ROUTES.book, render: (phone) => <CashBook phone={phone} /> },
  {
    path: AM_ROUTES.receipt,
    render: (phone) => <CashSlipScreen phone={phone} slip={RECEIPT_SLIP} />,
  },
  {
    path: AM_ROUTES.payment,
    render: (phone) => <CashSlipScreen phone={phone} slip={PAYMENT_SLIP} />,
  },
]
