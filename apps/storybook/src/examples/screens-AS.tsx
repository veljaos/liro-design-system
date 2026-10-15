import { useContext, useState, type ReactNode } from 'react'
import {
  Alert,
  Button,
  DataTable,
  DateText,
  DetailPage,
  KeyValueList,
  ListPage,
  MoneyText,
  StatusBadge,
  toneFor,
  Toaster,
  notice,
  useLiro,
  type DataTableColumn,
} from '@veljaos/ui'
import { AreaChart } from '../../../../packages/ui/src/charts'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell } from './example-shell'
import { Tenant } from './screens-G'
import { AP_ROUTES } from './data-AP'
import {
  AS_ROUTES,
  AS_TODAY,
  CONTRACT_TONES,
  CONTRACTS,
  contractByNumber,
  INSTALMENT_TONES,
  inLoanView,
  LOAN_VIEWS,
  SCHEDULE_TOTALS,
  SCHEDULES,
  type ContractState,
  type Instalment,
  type InstalmentState,
  type LoanContract,
  type LoanView,
} from './data-AS'

/*
 * Group AS's example screens (P5.60, loans and leasing): Kvadrat Gradnja d.o.o. on 14 October 2026.
 * - The loans and leases (ListPage): lender, kind, principal, rate, term, what is outstanding, the
 *   next instalment and the state in words (Active, Overdue, Repaid); views Active, Repaid, All.
 * - One loan or lease (DetailPage): the key figures (principal, rate, term, outstanding); the
 *   contract — lender, dates, the instalment, what it financed (a link to the asset card, group
 *   AP), collateral, what was paid so far; the outstanding principal as an area chart, instalment
 *   by instalment; the repayment schedule (no., due date, instalment, principal, interest, balance
 *   after, Paid / Due / Overdue / Upcoming in words) with the totals. An overdue lease says so above
 *   its contract.
 * Every figure is the application's (data-AS.ts); the screens show and link.
 */

export { AS_ROUTES }

function LoansShell({
  phone,
  crumbs,
  children,
}: {
  phone: boolean
  crumbs: { label: string; href?: string }[]
  children: ReactNode
}) {
  return (
    <Tenant today={AS_TODAY}>
      <Shell phone={phone} crumbs={crumbs}>
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

function money(value: string | null) {
  return <MoneyText value={value} currency="RSD" />
}

function contractBadge(state: ContractState) {
  return <StatusBadge label={state} tone={toneFor(state, CONTRACT_TONES)} />
}

function instalmentBadge(state: InstalmentState) {
  return <StatusBadge label={state} tone={toneFor(state, INSTALMENT_TONES)} />
}

/** "36 months" through the provider's digits. */
function useMonths() {
  const { format } = useLiro()
  return (count: string) => `${format.number(count)} months`
}

function RateText({ contract }: { contract: LoanContract }) {
  const { format } = useLiro()
  return <bdi>{`${format.percent(contract.rate, { decimals: 2 })}, ${contract.rateText}`}</bdi>
}

function Months({ count }: { count: string }) {
  const months = useMonths()
  return <bdi>{months(count)}</bdi>
}

// ── The list ──────────────────────────────────────────────────────────────────────────────────

const LIST_COLUMNS: DataTableColumn<LoanContract>[] = [
  {
    id: 'contract',
    header: 'Contract',
    minWidth: 220,
    cell: (contract) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content font-medium">{contract.lender}</span>
        <span className="bidi-content text-xs text-secondary">
          {`${contract.kind} · ${contract.number}`}
        </span>
      </span>
    ),
  },
  { id: 'principal', header: 'Principal', numeric: true, cell: (c) => money(c.principal) },
  {
    id: 'rate',
    header: 'Rate',
    numeric: true,
    cell: (contract) => <PercentText value={contract.rate} />,
  },
  { id: 'term', header: 'Term', numeric: true, cell: (c) => <Months count={c.term} /> },
  { id: 'outstanding', header: 'Outstanding', numeric: true, cell: (c) => money(c.outstanding) },
  {
    id: 'next',
    header: 'Next instalment',
    numeric: true,
    cell: (contract) =>
      contract.next === null ? (
        '—'
      ) : (
        <span className="flex flex-col items-end gap-0.5">
          {money(contract.next.amount)}
          <span className="text-xs text-secondary">
            <DateText value={contract.next.date} />
          </span>
        </span>
      ),
  },
  { id: 'state', header: 'State', cell: (contract) => contractBadge(contract.state) },
]

function PercentText({ value }: { value: string }) {
  const { format } = useLiro()
  return <bdi className="tabular-nums">{format.percent(value, { decimals: 2 })}</bdi>
}

export function LoanList({ phone, view: startView }: { phone: boolean; view?: LoanView }) {
  const navigate = useContext(Navigate)
  const [view, setView] = useState<LoanView>(startView ?? 'active')
  const rows = CONTRACTS.filter((contract) => inLoanView(contract, view))
  return (
    <LoansShell phone={phone} crumbs={[{ label: 'Accounting' }, { label: 'Loans and leases' }]}>
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Loans and leases"
        titleHidden={false}
        views={LOAN_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: CONTRACTS.filter((contract) => inLoanView(contract, each.id)).length,
        }))}
        view={view}
        onViewChange={(id) => {
          setView(id as LoanView)
        }}
      >
        <DataTable
          label="Loans and leases"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={LIST_COLUMNS}
          rows={rows}
          getRowId={(contract) => contract.number}
          getRowLabel={(contract) => `${contract.number} ${contract.lender}`}
          count={rows.length}
          onRowClick={(contract) => {
            navigate(AS_ROUTES.contract(contract.number))
          }}
          mobile={{
            title: (contract) => contract.lender,
            subtitle: (contract) => (
              <span className="bidi-content">{`${contract.kind} · ${contract.number}`}</span>
            ),
            badge: (contract) => contractBadge(contract.state),
            details: ['outstanding', 'next'],
          }}
        />
      </ListPage>
    </LoansShell>
  )
}

// ── One loan or lease ─────────────────────────────────────────────────────────────────────────

const SCHEDULE_COLUMNS: DataTableColumn<Instalment>[] = [
  {
    id: 'number',
    header: 'No.',
    numeric: true,
    cell: (row) => <NumberCell value={String(row.number)} />,
  },
  { id: 'due', header: 'Due date', numeric: true, cell: (row) => <DateText value={row.due} /> },
  { id: 'amount', header: 'Instalment', numeric: true, cell: (row) => money(row.amount) },
  { id: 'principal', header: 'Principal', numeric: true, cell: (row) => money(row.principal) },
  { id: 'interest', header: 'Interest', numeric: true, cell: (row) => money(row.interest) },
  { id: 'balance', header: 'Balance after', numeric: true, cell: (row) => money(row.balance) },
  { id: 'state', header: 'State', cell: (row) => instalmentBadge(row.state) },
]

function NumberCell({ value }: { value: string }) {
  const { format } = useLiro()
  return <bdi className="tabular-nums">{format.number(value)}</bdi>
}

/** "Oct 2026" for a due date, through the provider's month names: the chart's categories. */
function useMonthLabel() {
  const { format } = useLiro()
  return (date: string) => {
    const [year = '', month = '1'] = date.split('-')
    return `${format.monthName(Number(month), 'short')} ${year}`
  }
}

export function LoanContractPage({ phone, number }: { phone: boolean; number: string }) {
  const { format, linkComponent: Link } = useLiro()
  const monthLabel = useMonthLabel()
  const months = useMonths()
  const contract = contractByNumber(number)
  if (contract === undefined) return null
  const schedule = SCHEDULES[contract.number] ?? []
  const totals = SCHEDULE_TOTALS[contract.number]
  const lease = contract.kind === 'Finance lease'
  const categories = schedule.map((row) => ({
    key: String(row.number),
    label: monthLabel(row.due),
  }))
  const values = {
    outstanding: Object.fromEntries(schedule.map((row) => [String(row.number), row.balance])),
  }
  return (
    <LoansShell
      phone={phone}
      crumbs={[
        { label: 'Loans and leases', href: `#${AS_ROUTES.list}` },
        { label: contract.number },
      ]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={`${contract.kind} ${contract.number}`}
        back={{ href: `#${AS_ROUTES.list}`, label: 'Loans and leases' }}
        status={contractBadge(contract.state)}
        subtitle={
          <span className="bidi-content">{`${contract.lender} · ${contract.purpose}`}</span>
        }
        actions={
          <Button
            intent="export"
            label="Export schedule"
            onClick={() => {
              notice.success(`The schedule of ${contract.number} is being exported.`)
            }}
          />
        }
        keyFigures={[
          { key: 'principal', label: 'Principal', value: money(contract.principal) },
          {
            key: 'rate',
            label: 'Interest rate',
            value: format.percent(contract.rate, { decimals: 2 }),
          },
          { key: 'term', label: 'Term', value: months(contract.term) },
          {
            key: 'outstanding',
            label: 'Outstanding',
            value: money(contract.outstanding),
            ...(contract.state === 'Overdue' ? { tone: 'danger' as const } : {}),
          },
        ]}
        sections={[
          {
            id: 'contract',
            label: lease ? 'Lease' : 'Loan',
            content: (
              <div className="flex flex-col gap-4">
                {contract.overdueText !== undefined && (
                  <Alert tone="danger" title={contract.overdueText}>
                    {`No payment to ${contract.lender} on the bank statements since 10.10.2026. The lessor charges default interest from the eighth day (illustrative).`}
                  </Alert>
                )}
                <KeyValueList
                  columns={phone ? 1 : 2}
                  items={[
                    { key: 'lender', label: lease ? 'Lessor' : 'Lender', value: contract.lender },
                    { key: 'kind', label: 'Kind', value: contract.kind },
                    {
                      key: 'rate',
                      label: 'Interest rate',
                      value: <RateText contract={contract} />,
                    },
                    {
                      key: 'drawn',
                      label: lease ? 'Delivered' : 'Drawn',
                      value: <DateText value={contract.drawn} />,
                      numeric: true,
                    },
                    {
                      key: 'instalment',
                      label: 'Monthly instalment',
                      value: money(contract.instalment),
                      numeric: true,
                    },
                    {
                      key: 'period',
                      label: 'Instalments',
                      value: (
                        <bdi>{`${format.date(contract.first)} – ${format.date(contract.last)}`}</bdi>
                      ),
                      numeric: true,
                    },
                    {
                      key: 'purpose',
                      label: lease ? 'Leased' : 'Purpose',
                      value:
                        contract.asset === undefined ? (
                          contract.purpose
                        ) : (
                          <Link
                            href={`#${AP_ROUTES.asset(contract.asset)}`}
                            className="bidi-isolate text-link no-underline hover:underline"
                          >
                            {`${contract.purpose} (${contract.asset})`}
                          </Link>
                        ),
                    },
                    { key: 'collateral', label: 'Collateral', value: contract.collateral },
                    {
                      key: 'account',
                      label: 'Paid from',
                      value: <bdi dir="ltr">{contract.account}</bdi>,
                    },
                    {
                      key: 'paid-principal',
                      label: 'Principal paid',
                      value: money(contract.paidPrincipal),
                      numeric: true,
                    },
                    {
                      key: 'paid-interest',
                      label: 'Interest paid',
                      value: money(contract.paidInterest),
                      numeric: true,
                    },
                    {
                      key: 'next',
                      label: 'Next instalment',
                      value:
                        contract.next === null ? (
                          '—'
                        ) : (
                          <bdi>{`${format.money(contract.next.amount, 'RSD')}, ${format.date(contract.next.date)}`}</bdi>
                        ),
                      numeric: true,
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            id: 'balance',
            label: 'Outstanding principal',
            content: (
              <AreaChart
                title="Outstanding principal after each instalment"
                description="RSD, from the repayment schedule"
                categories={categories}
                series={[{ key: 'outstanding', label: 'Outstanding principal' }]}
                values={values}
                currency="RSD"
                layout={phone ? 'phone' : 'desktop'}
              />
            ),
          },
          {
            id: 'schedule',
            label: 'Repayment schedule',
            flush: true,
            content: (
              <DataTable
                label={`Repayment schedule of ${contract.number}`}
                layout={phone ? 'cards' : 'table'}
                inCard
                columns={SCHEDULE_COLUMNS}
                rows={schedule}
                getRowId={(row) => String(row.number)}
                getRowLabel={(row) => `Instalment ${String(row.number)}`}
                {...(totals === undefined
                  ? {}
                  : {
                      totalsLabel: 'Total',
                      totals: {
                        amount: money(totals.instalment),
                        principal: money(totals.principal),
                        interest: money(totals.interest),
                      },
                    })}
                mobile={{
                  title: (row) => <DateText value={row.due} />,
                  subtitle: (row) => <NumberLabel number={row.number} />,
                  badge: (row) => instalmentBadge(row.state),
                  details: ['amount', 'principal', 'interest', 'balance'],
                }}
              />
            ),
          },
        ]}
      />
    </LoansShell>
  )
}

function NumberLabel({ number }: { number: number }) {
  const { format } = useLiro()
  return <bdi>{`Instalment ${format.number(String(number))}`}</bdi>
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AS_ROUTES: ExampleRoute[] = [
  { path: AS_ROUTES.list, render: (phone) => <LoanList phone={phone} /> },
  { path: AS_ROUTES.repaid, render: (phone) => <LoanList phone={phone} view="repaid" /> },
  ...CONTRACTS.map((contract) => ({
    path: AS_ROUTES.contract(contract.number),
    render: (phone: boolean) => <LoanContractPage phone={phone} number={contract.number} />,
  })),
]
