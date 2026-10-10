import { BookCheck, Send } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  BalanceBar,
  Button,
  ChangeableValue,
  DataTable,
  DateField,
  DateText,
  DocumentPage,
  EditableGrid,
  KeyFigures,
  MoneyText,
  PeriodicRunPage,
  StatusBadge,
  Toaster,
  UnavailableAction,
  notice,
  useLiro,
  type DataTableColumn,
  type EditableGridColumn,
  type GridMessage,
  type ModuleTab,
  type RunCheck,
} from '@veljaos/ui'
import type { PayrollLine } from '../../../../packages/ui/src/templates/periodic-run-story-data'
import type { ExampleRoute } from './example-app'
import { hrTabs, Shell } from './example-shell'
import {
  ACCOUNTS,
  JOURNAL,
  JOURNAL_LINES,
  JOURNAL_LINES_UNBALANCED,
  journalBalance,
  PAYROLL_LINES,
  PAYROLL_STEPS,
  PAYROLL_TOTALS,
  RERUN_REASONS,
  type JournalLine,
} from './data-F'

/*
 * Group F's example screens (P5.21): journal entry NK-2026-0912 (balanced, and a separate unbalanced stage) and the September 2026
 * payroll run. Every screen plays the application: it keeps the state and computes the figures in
 * whole paras (data-F.ts); the components only show them.
 */

export const F_ROUTES = {
  journal: `/accounting/journal/${JOURNAL.number}`,
  /** The same entry at the stage where the supplier's amount was mistyped. */
  journalUnbalanced: `/accounting/journal/${JOURNAL.number}?stage=unbalanced`,
  payroll: '/hr/payroll/2026-09',
}

const ACCOUNTING_TABS: ModuleTab[] = [
  { key: 'journal', label: 'Journal', href: '#/accounting/journal', current: true },
  { key: 'accounts', label: 'Chart of accounts', href: '#/accounting/accounts' },
  { key: 'periods', label: 'Periods', href: '#/accounting/periods' },
]

const PAYROLL_TABS: ModuleTab[] = hrTabs('payroll')

// ── Journal entry NK-2026-0912 ────────────────────────────────────────────────────────────────

const JOURNAL_COLUMNS: EditableGridColumn<JournalLine>[] = [
  {
    id: 'account',
    header: 'Account',
    type: 'combobox',
    width: 250,
    value: (line) => line.account,
    options: ACCOUNTS,
  },
  { id: 'text', header: 'Description', type: 'text', value: (line) => line.text },
  {
    id: 'debit',
    header: 'Debit',
    type: 'number',
    width: 140,
    decimals: 2,
    value: (line) => line.debit,
  },
  {
    id: 'credit',
    header: 'Credit',
    type: 'number',
    width: 140,
    decimals: 2,
    value: (line) => line.credit,
  },
]

/** A value of the entry that the user does not change here, drawn as ChangeableValue's value. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="bidi-content text-xs text-secondary">{label}</span>
      <span className="bidi-content text-sm font-medium text-primary">{children}</span>
    </div>
  )
}

export function JournalEntry({ phone, unbalanced }: { phone: boolean; unbalanced: boolean }) {
  const { format, linkComponent: Link } = useLiro()
  const [lines, setLines] = useState(unbalanced ? JOURNAL_LINES_UNBALANCED : JOURNAL_LINES)
  const [date, setDate] = useState<string | null>(JOURNAL.date)
  const balance = journalBalance(lines)
  // The Core's messages under the lines.
  const messages: Record<string, GridMessage[]> = {}
  for (const id of balance.missing) {
    messages[id] = [
      { tone: 'danger', text: 'Enter a debit or a credit amount.', columns: ['debit', 'credit'] },
    ]
  }
  for (const id of balance.both) {
    messages[id] = [
      {
        tone: 'danger',
        text: 'A line has a debit or a credit, not both.',
        columns: ['debit', 'credit'],
      },
    ]
  }
  const reason =
    balance.state === 'balanced'
      ? undefined
      : balance.state === 'incomplete'
        ? 'Every line needs either a debit or a credit amount.'
        : `Debit and credit must be equal. The difference is ${format.money(balance.absoluteDifference, 'RSD')}.`
  const post =
    reason === undefined ? (
      <Button
        family="primary"
        icon={BookCheck}
        emphasis="primary"
        label="Post"
        onClick={() => {
          notice.success(`${JOURNAL.number} posted.`)
        }}
      />
    ) : (
      <UnavailableAction
        family="primary"
        icon={BookCheck}
        emphasis="primary"
        label="Post"
        reason={reason}
      />
    )
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Journal', href: '#/accounting/journal' }, { label: JOURNAL.number }]}
      tabs={ACCOUNTING_TABS}
      {...(phone ? { bottomBar: post } : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={JOURNAL.number}
        back={{ href: '#/accounting/journal', label: 'Journal' }}
        status={<StatusBadge label="Draft" tone="neutral" />}
        actions={
          <>
            <Button
              intent="save"
              emphasis="secondary"
              label="Save draft"
              onClick={() => {
                notice.success(`${JOURNAL.number} saved.`)
              }}
            />
            {phone ? null : post}
          </>
        }
        details={
          <>
            <ChangeableValue
              label="Date"
              value={<DateText value={date} />}
              field={<DateField label="Date" value={date} onChange={setDate} />}
            />
            <Fact label="Journal">{JOURNAL.journal}</Fact>
            <Fact label="Based on">
              <Link
                href="#/purchasing/approvals"
                className="text-link no-underline hover:underline"
              >
                Supplier invoice <span dir="ltr">{JOURNAL.document}</span>
              </Link>{' '}
              <span className="text-xs font-normal text-secondary">Approved</span>
            </Fact>
          </>
        }
        linesTitle="Lines"
        lines={
          <EditableGrid
            label={`Lines of ${JOURNAL.number}`}
            inCard
            layout={phone ? 'phone' : 'desktop'}
            columns={JOURNAL_COLUMNS}
            rows={lines}
            getRowId={(line) => line.id}
            onCellChange={(rowId, columnId, value) => {
              setLines((current) =>
                current.map((line) =>
                  line.id === rowId ? { ...line, [columnId]: value as never } : line,
                ),
              )
            }}
            onAddRow={(index) => {
              setLines((current) => [
                ...current.slice(0, index),
                {
                  id: `n${String(current.length + 1)}`,
                  account: null,
                  text: '',
                  debit: null,
                  credit: null,
                },
                ...current.slice(index),
              ])
            }}
            onRemoveRow={(rowId) => {
              setLines((current) => current.filter((line) => line.id !== rowId))
            }}
            minRows={2}
            messages={messages}
            footer={
              <BalanceBar
                debit={balance.debit}
                credit={balance.credit}
                difference={balance.difference}
                state={balance.state}
                currency="RSD"
                layout={phone ? 'stacked' : 'row'}
              />
            }
          />
        }
      />
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

// ── Payroll September 2026 ────────────────────────────────────────────────────────────────────

const PAYROLL_COLUMNS: DataTableColumn<PayrollLine>[] = [
  { id: 'name', header: 'Employee', cell: (line) => line.name },
  { id: 'position', header: 'Position', cell: (line) => line.position },
  {
    id: 'gross',
    header: 'Gross',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.gross} currency="RSD" />,
  },
  {
    id: 'contributions',
    header: 'Contributions',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.contributions} currency="RSD" />,
  },
  {
    id: 'tax',
    header: 'Tax',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.tax} currency="RSD" />,
  },
  {
    id: 'net',
    header: 'Net',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.net} currency="RSD" />,
  },
]

export function PayrollRun({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const [rerun, setRerun] = useState<string | null>(null)
  const count = format.number(String(PAYROLL_TOTALS.employees))
  const checks: RunCheck[] = [
    {
      id: 'calculated',
      label: 'Every employee calculated',
      result: 'passed',
      detail: `${count} of ${count} employees`,
    },
    { id: 'accounts', label: 'Bank accounts of all employees', result: 'passed' },
    { id: 'minimum', label: 'Minimum wage respected', result: 'passed' },
    { id: 'contracts', label: 'Contracts valid in September', result: 'passed' },
    {
      id: 'overtime',
      label: 'Overtime within the limit',
      result: 'warning',
      detail: 'Over 8 hours a week: Marko Đorđević (11 h), Snežana Popović (9 h).',
    },
    { id: 'payslips', label: 'Payslips ready to send', result: 'notRun' },
  ]
  const postAction = (
    <Button
      family="primary"
      icon={Send}
      emphasis="primary"
      label="Post payroll"
      onClick={() => {
        notice.success('Payroll September 2026 posted.')
      }}
    />
  )
  const running = rerun !== null
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Payroll', href: '#/hr/payroll' }, { label: 'September 2026' }]}
      tabs={PAYROLL_TABS}
      {...(phone && !running ? { bottomBar: postAction } : {})}
    >
      <PeriodicRunPage
        layout={phone ? 'phone' : 'desktop'}
        title="Payroll September 2026"
        back={{ href: '#/hr/payroll', label: 'Payroll' }}
        status={
          running ? (
            <StatusBadge label="Calculating" tone="info" />
          ) : (
            <StatusBadge label="In review" tone="warning" />
          )
        }
        subtitle={
          <>
            {`${count} employees · paid on `}
            <DateText value="2026-10-15" />
          </>
        }
        steps={PAYROLL_STEPS}
        active={running ? 1 : 2}
        lock={{ state: 'open', detail: 'Opened by Ivana Stojanović on 01.10.2026.' }}
        {...(running
          ? {
              progress: {
                label: 'Calculating payroll',
                value: 0,
                max: PAYROLL_TOTALS.employees,
                current: rerun,
              },
            }
          : {
              checks,
              ...(phone ? {} : { actions: postAction }),
              preview: {
                description: 'Payslips and the journal entry are made from these figures.',
                summary: (
                  <KeyFigures
                    layout={phone ? 'phone' : 'desktop'}
                    items={[
                      {
                        key: 'gross',
                        label: 'Gross',
                        value: <MoneyText value={PAYROLL_TOTALS.gross} currency="RSD" />,
                      },
                      {
                        key: 'contributions',
                        label: 'Contributions (employee)',
                        value: <MoneyText value={PAYROLL_TOTALS.contributions} currency="RSD" />,
                      },
                      {
                        key: 'tax',
                        label: 'Tax',
                        value: <MoneyText value={PAYROLL_TOTALS.tax} currency="RSD" />,
                      },
                      {
                        key: 'net',
                        label: 'Net',
                        value: <MoneyText value={PAYROLL_TOTALS.net} currency="RSD" />,
                      },
                    ]}
                  />
                ),
                table: (
                  <DataTable
                    label="Payroll lines"
                    columns={PAYROLL_COLUMNS}
                    rows={PAYROLL_LINES}
                    getRowId={(line) => line.id}
                    getRowLabel={(line) => line.name}
                    inCard
                    virtualize
                    maxHeight="480px"
                    layout={phone ? 'cards' : 'table'}
                    totalsLabel="Total"
                    totals={{
                      gross: <MoneyText value={PAYROLL_TOTALS.gross} currency="RSD" />,
                      contributions: (
                        <MoneyText value={PAYROLL_TOTALS.contributions} currency="RSD" />
                      ),
                      tax: <MoneyText value={PAYROLL_TOTALS.tax} currency="RSD" />,
                      net: <MoneyText value={PAYROLL_TOTALS.net} currency="RSD" />,
                    }}
                    mobile={{ subtitle: (line) => line.position, details: ['gross', 'net'] }}
                  />
                ),
              },
            })}
        rerun={{
          title: 'Rerun payroll for September 2026?',
          message:
            'The calculated figures of all 46 employees are replaced. Nothing has been posted or sent yet.',
          confirmLabel: 'Rerun',
          reasonLabel: 'Reason for the rerun',
          reasons: RERUN_REASONS,
          onConfirm: (answer) => {
            const reason = RERUN_REASONS.find((each) => each.value === answer.reason)
            setRerun(answer.text === '' ? (reason?.label ?? '') : answer.text)
          },
          ...(running ? { unavailableReason: 'The payroll is being calculated.' } : {}),
        }}
      />
    </Shell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_F_ROUTES: ExampleRoute[] = [
  { path: F_ROUTES.journal, render: (phone) => <JournalEntry phone={phone} unbalanced={false} /> },
  {
    path: F_ROUTES.journalUnbalanced,
    render: (phone) => <JournalEntry phone={phone} unbalanced />,
  },
  { path: F_ROUTES.payroll, render: (phone) => <PayrollRun phone={phone} /> },
]
