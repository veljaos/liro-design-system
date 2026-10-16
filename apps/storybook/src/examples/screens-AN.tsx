import { ArrowLeftRight, BookCheck, Landmark } from 'lucide-react'
import { useContext, useState } from 'react'
import {
  Alert,
  Button,
  ConfirmDialog,
  DataTable,
  DateField,
  EmptyState,
  KeyFigures,
  ListPage,
  MoneyText,
  notice,
  NumberText,
  ReportPage,
  SectionCard,
  SelectField,
  UnavailableAction,
  useLiro,
  type DataTableColumn,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import {
  AN_ROUTES,
  FX_ACCOUNTS,
  FX_TOTALS,
  RATE_LIST,
  RATES,
  REVALUATION,
  type ExchangeRate,
  type FxAccount,
  type RevaluedItem,
} from './data-AN'
import { DocumentLink, LedgerShell } from './screens-AK'

/*
 * Group AN's example screens (P5.59): foreign currency at Kvadrat Gradnja d.o.o. on 14.10.2026 —
 * the day's exchange rates ("Illustrative NBS middle rates": invented values), the
 * foreign-currency accounts with their value in dinars, and the exchange-rate differences of the
 * open items, posted after a confirmation that shows the journal entry. The invoice in euros is
 * group D2's F-2026-0415 (DocumentPage with DocumentCurrency, amounts in EUR and RSD), reached
 * from the differences; it is not drawn again here. Assembled from ReportPage, ListPage,
 * DataTable, KeyFigures, ConfirmDialog (`preview`) and Alert; every rate and amount is the
 * Core's (data-AN.ts).
 */

export { AN_ROUTES }

/** The three foreign-currency pages lead to each other from their headers. */
function SiblingLinks({ current }: { current: 'rates' | 'accounts' | 'revaluation' }) {
  const navigate = useContext(Navigate)
  const links = [
    { key: 'rates', label: 'Exchange rates', path: AN_ROUTES.rates },
    { key: 'accounts', label: 'Foreign-currency accounts', path: AN_ROUTES.accounts },
    { key: 'revaluation', label: 'Exchange-rate differences', path: AN_ROUTES.revaluation },
  ].filter((link) => link.key !== current)
  return (
    <>
      {links.map((link) => (
        <Button
          key={link.key}
          family="neutral"
          icon={link.key === 'rates' ? ArrowLeftRight : Landmark}
          emphasis="secondary"
          label={link.label}
          onClick={() => {
            navigate(link.path)
          }}
        />
      ))}
    </>
  )
}

// ── Exchange rates ────────────────────────────────────────────────────────────────────────────

const RATE_COLUMNS: DataTableColumn<ExchangeRate>[] = [
  {
    id: 'currency',
    header: 'Currency',
    cell: (rate) => (
      <span className="flex flex-col">
        <span dir="ltr" className="bidi-isolate font-semibold">
          {rate.code}
        </span>
        <span dir="ltr" className="bidi-isolate text-xs text-secondary">
          {rate.number}
        </span>
      </span>
    ),
  },
  { id: 'country', header: 'Country', minWidth: 180, cell: (rate) => rate.country },
  {
    id: 'unit',
    header: 'Unit',
    align: 'end',
    numeric: true,
    cell: (rate) => <NumberText value={String(rate.unit)} />,
  },
  {
    id: 'buying',
    header: 'Buying',
    align: 'end',
    numeric: true,
    cell: (rate) => <NumberText value={rate.buying} decimals={4} />,
  },
  {
    id: 'middle',
    header: 'Middle',
    align: 'end',
    numeric: true,
    cell: (rate) => <NumberText value={rate.middle} decimals={4} />,
  },
  {
    id: 'selling',
    header: 'Selling',
    align: 'end',
    numeric: true,
    cell: (rate) => <NumberText value={rate.selling} decimals={4} />,
  },
]

export function ExchangeRates({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const [date, setDate] = useState<string | null>(RATE_LIST.date)
  const [shown, setShown] = useState<string | null>(RATE_LIST.date)
  return (
    <LedgerShell
      phone={phone}
      tab="currencies"
      crumbs={[{ label: 'Foreign currency' }, { label: 'Exchange rates' }]}
    >
      <ReportPage
        layout={phone ? 'phone' : 'desktop'}
        title="Exchange rates"
        subtitle="Illustrative NBS middle rates: invented values, not the National Bank of Serbia's list"
        actions={<SiblingLinks current="rates" />}
        parametersOpen={false}
        parameters={<DateField label="Date" value={date} onChange={setDate} />}
        summary={[
          { key: 'date', label: 'Date', value: shown === null ? '—' : format.date(shown) },
          { key: 'list', label: 'List', value: `No. ${RATE_LIST.number}` },
        ]}
        onRun={() => {
          setShown(date)
        }}
      >
        {shown === RATE_LIST.date ? (
          <SectionCard
            flush
            title={`Illustrative NBS middle rates, list no. ${RATE_LIST.number}`}
            description={RATE_LIST.applies}
            headingLevel={2}
          >
            <DataTable
              inCard
              label={`Illustrative NBS middle rates on ${format.date(RATE_LIST.date)}`}
              layout={phone ? 'cards' : 'table'}
              columns={RATE_COLUMNS}
              rows={RATES}
              getRowId={(rate) => rate.code}
              getRowLabel={(rate) => `${rate.code} ${rate.country}`}
              mobile={{
                title: (rate) => `${rate.code} · ${rate.country}`,
                details: ['unit', 'buying', 'middle', 'selling'],
              }}
            />
          </SectionCard>
        ) : (
          <SectionCard>
            <EmptyState
              variant="no-results"
              title="No list for this date"
              description="The illustrative list exists for 14.10.2026. only."
            />
          </SectionCard>
        )}
      </ReportPage>
    </LedgerShell>
  )
}

// ── Foreign-currency accounts ─────────────────────────────────────────────────────────────────

const ACCOUNT_COLUMNS: DataTableColumn<FxAccount>[] = [
  {
    id: 'account',
    header: 'Account',
    minWidth: 200,
    cell: (row) => (
      <span className="flex flex-col">
        <span className="bidi-content">{`${row.account} ${row.name}, ${row.bank}`}</span>
        <span dir="ltr" className="bidi-isolate text-xs text-secondary">
          {row.iban}
        </span>
      </span>
    ),
  },
  {
    id: 'balance',
    header: 'Balance',
    align: 'end',
    numeric: true,
    cell: (row) => <MoneyText value={row.balance} currency={row.currency} />,
  },
  {
    id: 'rate',
    header: 'Middle rate',
    align: 'end',
    numeric: true,
    cell: (row) => <NumberText value={row.rate} decimals={4} />,
  },
  {
    id: 'value',
    header: 'Value in RSD',
    align: 'end',
    numeric: true,
    cell: (row) => <MoneyText value={row.value} currency="RSD" />,
  },
  {
    id: 'booked',
    header: 'In the ledger',
    align: 'end',
    numeric: true,
    cell: (row) => <MoneyText value={row.booked} currency="RSD" />,
  },
  {
    id: 'difference',
    header: 'Difference',
    align: 'end',
    numeric: true,
    cell: (row) => <MoneyText value={row.difference} currency="RSD" />,
  },
]

export function FxAccounts({ phone }: { phone: boolean }) {
  return (
    <LedgerShell
      phone={phone}
      tab="currencies"
      crumbs={[{ label: 'Foreign currency' }, { label: 'Foreign-currency accounts' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Foreign-currency accounts on 14.10.2026."
        titleHidden={false}
        actions={<SiblingLinks current="accounts" />}
      >
        <DataTable
          inCard
          label="Foreign-currency accounts"
          layout={phone ? 'cards' : 'table'}
          columns={ACCOUNT_COLUMNS}
          rows={FX_ACCOUNTS}
          getRowId={(row) => row.account}
          getRowLabel={(row) => `${row.account} ${row.name}, ${row.bank}`}
          totalsLabel="Total in RSD"
          totals={{
            value: <MoneyText value={FX_TOTALS.value} currency="RSD" />,
            booked: <MoneyText value={FX_TOTALS.booked} currency="RSD" />,
            difference: <MoneyText value={FX_TOTALS.difference} currency="RSD" />,
          }}
          mobile={{
            title: (row) => `${row.name}, ${row.bank}`,
            subtitle: (row) => (
              <span dir="ltr" className="bidi-isolate">
                {row.iban}
              </span>
            ),
            details: ['balance', 'rate', 'value', 'difference'],
          }}
        />
      </ListPage>
    </LedgerShell>
  )
}

// ── Exchange-rate differences ─────────────────────────────────────────────────────────────────

const REVALUATION_COLUMNS: DataTableColumn<RevaluedItem>[] = [
  {
    id: 'document',
    header: 'Item',
    minWidth: 170,
    cell: (item) => (
      <span className="flex flex-col">
        {item.kind === 'Invoice' || item.kind === 'Supplier invoice' ? (
          <DocumentLink document={{ kind: item.kind, number: item.document }} />
        ) : (
          <span className="bidi-content">{item.document}</span>
        )}
        <span className="bidi-content text-xs text-secondary">{`${item.account} · ${item.partner}`}</span>
      </span>
    ),
  },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    numeric: true,
    cell: (item) => <MoneyText value={item.amount} currency={item.currency} />,
  },
  {
    id: 'booked',
    header: 'Booked',
    align: 'end',
    numeric: true,
    cell: (item) => (
      <span className="flex flex-col items-end">
        <MoneyText value={item.booked} currency="RSD" />
        {item.bookedRate !== null && (
          <span className="text-xs text-secondary">
            <NumberText value={item.bookedRate} decimals={4} />
          </span>
        )}
      </span>
    ),
  },
  {
    id: 'revalued',
    header: 'At 14.10.2026.',
    align: 'end',
    numeric: true,
    cell: (item) => (
      <span className="flex flex-col items-end">
        <MoneyText value={item.revalued} currency="RSD" />
        <span className="text-xs text-secondary">
          <NumberText value={item.rate} decimals={4} />
        </span>
      </span>
    ),
  },
  {
    id: 'positive',
    header: 'Positive difference',
    align: 'end',
    numeric: true,
    cell: (item) => <MoneyText value={item.positive} currency="RSD" />,
  },
  {
    id: 'negative',
    header: 'Negative difference',
    align: 'end',
    numeric: true,
    cell: (item) => <MoneyText value={item.negative} currency="RSD" />,
  },
]

type JournalLine = (typeof REVALUATION.journal)[number]

const JOURNAL_COLUMNS: DataTableColumn<JournalLine>[] = [
  { id: 'account', header: 'Account', minWidth: 220, cell: (line) => line.account },
  {
    id: 'debit',
    header: 'Debit',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.debit} currency="RSD" />,
  },
  {
    id: 'credit',
    header: 'Credit',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.credit} currency="RSD" />,
  },
]

export function ExchangeDifferences({
  phone,
  asking = false,
}: {
  phone: boolean
  asking?: boolean
}) {
  const { format } = useLiro()
  const [date, setDate] = useState<string | null>(REVALUATION.date)
  const [confirming, setConfirming] = useState(asking)
  const [posted, setPosted] = useState(false)
  const post = posted ? (
    <UnavailableAction
      family="primary"
      icon={BookCheck}
      emphasis="primary"
      label="Post differences"
      reason={`Posted as ${REVALUATION.number}.`}
    />
  ) : (
    <Button
      family="primary"
      icon={BookCheck}
      emphasis="primary"
      label="Post differences"
      onClick={() => {
        setConfirming(true)
      }}
    />
  )
  return (
    <LedgerShell
      phone={phone}
      tab="currencies"
      crumbs={[{ label: 'Foreign currency' }, { label: 'Exchange-rate differences' }]}
      {...(phone ? { bottomBar: post } : {})}
    >
      <ReportPage
        layout={phone ? 'phone' : 'desktop'}
        title="Exchange-rate differences"
        subtitle="Open items and accounts in foreign currency at the illustrative NBS middle rate"
        actions={
          <>
            <SiblingLinks current="revaluation" />
            {phone ? null : post}
          </>
        }
        parametersOpen={false}
        parameters={
          <>
            <DateField label="Revalue on" value={date} onChange={setDate} />
            <SelectField
              label="Items"
              options={[{ value: 'all', label: 'Open items and foreign-currency accounts' }]}
              defaultValue="all"
              {...(phone ? {} : { className: 'w-80' })}
            />
          </>
        }
        summary={[
          { key: 'date', label: 'Revalue on', value: format.date(REVALUATION.date) },
          { key: 'items', label: 'Items', value: 'Open items and foreign-currency accounts' },
        ]}
        onRun={() => undefined}
      >
        {posted && (
          <Alert tone="success" title={`Posted as ${REVALUATION.number}`}>
            {`The differences of ${format.date(REVALUATION.date)} are in the general ledger.`}
          </Alert>
        )}
        <KeyFigures
          layout={phone ? 'phone' : 'desktop'}
          items={[
            {
              key: 'positive',
              label: 'Positive differences',
              value: <MoneyText value={REVALUATION.positive} currency="RSD" />,
            },
            {
              key: 'negative',
              label: 'Negative differences',
              value: <MoneyText value={REVALUATION.negative} currency="RSD" />,
            },
            {
              key: 'net',
              label: 'Net effect',
              value: <MoneyText value={REVALUATION.net} currency="RSD" />,
            },
          ]}
        />
        <SectionCard flush>
          <DataTable
            inCard
            label={`Exchange-rate differences on ${format.date(REVALUATION.date)}`}
            layout={phone ? 'cards' : 'table'}
            columns={REVALUATION_COLUMNS}
            rows={REVALUATION.items}
            getRowId={(item) => item.id}
            getRowLabel={(item) => `${item.document}, ${item.partner}`}
            totalsLabel="Total"
            totals={{
              positive: <MoneyText value={REVALUATION.positive} currency="RSD" />,
              negative: <MoneyText value={REVALUATION.negative} currency="RSD" />,
            }}
            mobile={{
              title: (item) => item.partner,
              details: ['document', 'amount', 'booked', 'revalued', 'positive', 'negative'],
            }}
          />
        </SectionCard>
      </ReportPage>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        family="primary"
        actionIcon={BookCheck}
        title="Post exchange-rate differences?"
        message={`Journal entry ${REVALUATION.number} of ${format.date(REVALUATION.date)} posts ${format.money(REVALUATION.positive, 'RSD')} of positive and ${format.money(REVALUATION.negative, 'RSD')} of negative differences.`}
        size="wide"
        preview={
          <DataTable
            label={`Journal entry ${REVALUATION.number}`}
            layout={phone ? 'cards' : 'table'}
            columns={JOURNAL_COLUMNS}
            rows={REVALUATION.journal}
            getRowId={(line) => line.id}
            getRowLabel={(line) => line.account}
            stickyHeader={false}
            totalsLabel="Total"
            totals={{
              debit: <MoneyText value={REVALUATION.journalTotal} currency="RSD" />,
              credit: <MoneyText value={REVALUATION.journalTotal} currency="RSD" />,
            }}
            mobile={{ title: (line) => line.account, details: ['debit', 'credit'] }}
          />
        }
        confirmLabel="Post"
        onConfirm={() => {
          setPosted(true)
          notice.success(`${REVALUATION.number} posted.`)
        }}
      />
    </LedgerShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AN_ROUTES: ExampleRoute[] = [
  { path: AN_ROUTES.rates, render: (phone) => <ExchangeRates phone={phone} /> },
  { path: AN_ROUTES.accounts, render: (phone) => <FxAccounts phone={phone} /> },
  { path: AN_ROUTES.revaluation, render: (phone) => <ExchangeDifferences phone={phone} /> },
  {
    path: AN_ROUTES.revaluationPost,
    render: (phone) => <ExchangeDifferences phone={phone} asking />,
  },
]
