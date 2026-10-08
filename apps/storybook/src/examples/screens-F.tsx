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
  MatchingView,
  MoneyText,
  PageHeader,
  PeriodicRunPage,
  StatusBadge,
  Toaster,
  UnavailableAction,
  notice,
  useLiro,
  type DataTableColumn,
  type EditableGridColumn,
  type GridMessage,
  type MatchingItem,
  type MatchingMatch,
  type MatchSuggestion,
  type ModuleTab,
  type RunCheck,
} from '@veljaos/ui'
import {
  matchOf,
  remainingOf,
  type MatchRecord,
} from '../../../../packages/ui/src/components/matching-story-data'
import type { PayrollLine } from '../../../../packages/ui/src/templates/periodic-run-story-data'
import type { ExampleRoute } from './example-app'
import { HR_TABS, Shell } from './example-shell'
import {
  ACCOUNTS,
  decimalOf,
  IMPORT_MATCHES,
  JOURNAL,
  JOURNAL_LINES,
  JOURNAL_LINES_UNBALANCED,
  journalBalance,
  OPEN_INVOICES,
  PAYROLL_LINES,
  PAYROLL_STEPS,
  PAYROLL_TOTALS,
  RERUN_REASONS,
  STATEMENT,
  STATEMENT_LINES,
  STATEMENT_SUGGESTIONS,
  STATEMENT_TOTALS,
  sumParas,
  type JournalLine,
  type OpenInvoice,
  type StatementLine,
} from './data-F'

/*
 * Group F's example screens (P5.21): bank statement 188 matched against the open invoices,
 * journal entry NK-2026-0912 (balanced, and a separate unbalanced stage) and the September 2026
 * payroll run. Every screen plays the application: it keeps the state and computes the figures in
 * whole paras (data-F.ts); the components only show them.
 */

export const F_ROUTES = {
  statement: `/banking/statements/${STATEMENT.number}`,
  journal: `/accounting/journal/${JOURNAL.number}`,
  /** The same entry at the stage where the supplier's amount was mistyped. */
  journalUnbalanced: `/accounting/journal/${JOURNAL.number}?stage=unbalanced`,
  payroll: '/hr/payroll/2026-09',
}

const BANKING_TABS: ModuleTab[] = [
  { key: 'statements', label: 'Statements', href: '#/banking/statements', current: true },
  { key: 'payments', label: 'Payments', href: '#/banking/payments' },
  { key: 'accounts', label: 'Bank accounts', href: '#/banking/accounts' },
]

const ACCOUNTING_TABS: ModuleTab[] = [
  { key: 'journal', label: 'Journal', href: '#/accounting/journal', current: true },
  { key: 'accounts', label: 'Chart of accounts', href: '#/accounting/accounts' },
  { key: 'periods', label: 'Periods', href: '#/accounting/periods' },
]

const PAYROLL_TABS: ModuleTab[] = [
  ...HR_TABS.map((tab) => ({ ...tab, current: false })),
  { key: 'payroll', label: 'Payroll', href: '#/hr/payroll', current: true },
]

/** The page frame of the screens that are not a template: padding and the content's width. */
function Page({ phone, children }: { phone: boolean; children: ReactNode }) {
  return (
    <div
      className={
        phone
          ? 'mx-auto box-border flex w-full max-w-content flex-col gap-4 p-4'
          : 'mx-auto box-border flex w-full max-w-content flex-col gap-6 p-6'
      }
    >
      {children}
    </div>
  )
}

// ── Bank statement 188 ────────────────────────────────────────────────────────────────────────

/** The lines to match: everything but the bank's own items (fee, interest), booked to accounts. */
const TO_MATCH = STATEMENT_LINES.filter((each) => each.bankItem !== true)
const BANK_ITEMS = STATEMENT_LINES.filter((each) => each.bankItem === true)

function lineById(id: string): StatementLine | undefined {
  return STATEMENT_LINES.find((each) => each.id === id)
}

function invoiceById(id: string): OpenInvoice | undefined {
  return OPEN_INVOICES.find((each) => each.id === id)
}

export function BankStatement({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const [matches, setMatches] = useState<MatchRecord[]>(IMPORT_MATCHES)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [lines, setLines] = useState<string[]>([])
  const [invoices, setInvoices] = useState<string[]>([])
  const [lineSearch, setLineSearch] = useState('')
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const money = (paras: bigint) => format.money(decimalOf(paras), 'RSD')

  const lineItem = (entry: StatementLine, paras?: bigint): MatchingItem => {
    const rest = remainingOf(entry, matches, 'left')
    return {
      id: entry.id,
      label: entry.label,
      title: entry.title,
      subtitle: entry.subtitle,
      amount: <MoneyText value={decimalOf(paras ?? entry.paras)} currency="RSD" />,
      ...(paras === undefined && rest !== entry.paras ? { remaining: `${money(rest)} left` } : {}),
    }
  }
  const invoiceItem = (entry: OpenInvoice, paras?: bigint): MatchingItem => {
    const rest = remainingOf(entry, matches, 'right')
    return {
      id: entry.id,
      label: entry.label,
      title: entry.title,
      subtitle: (
        <>
          {entry.customer} · due <DateText value={entry.due} />
        </>
      ),
      amount: <MoneyText value={decimalOf(paras ?? entry.paras)} currency="RSD" />,
      ...(paras === undefined && rest !== entry.paras ? { remaining: `${money(rest)} left` } : {}),
    }
  }
  const searched = (text: string, query: string) =>
    text.toLowerCase().includes(query.trim().toLowerCase())
  const openLines = TO_MATCH.filter((each) => remainingOf(each, matches, 'left') > 0n)
  const openInvoices = OPEN_INVOICES.filter((each) => remainingOf(each, matches, 'right') > 0n)

  const record = (leftIds: readonly string[], rightIds: readonly string[], how: string) => {
    const left = leftIds.flatMap((id) => STATEMENT_LINES.filter((each) => each.id === id))
    const right = rightIds.flatMap((id) => OPEN_INVOICES.filter((each) => each.id === id))
    setMatches((current) => [
      ...current,
      matchOf(`m-${leftIds.join('-')}-${String(current.length)}`, left, right, current, how),
    ])
    setLines([])
    setInvoices([])
  }

  const suggestions: MatchSuggestion[] = STATEMENT_SUGGESTIONS.filter(
    (suggestion) =>
      !dismissed.includes(suggestion.id) &&
      suggestion.left.every((id) => {
        const entry = lineById(id)
        return entry !== undefined && remainingOf(entry, matches, 'left') > 0n
      }) &&
      suggestion.right.every((id) => {
        const entry = invoiceById(id)
        return entry !== undefined && remainingOf(entry, matches, 'right') > 0n
      }),
  ).map((suggestion) => {
    const left = suggestion.left.flatMap((id) => STATEMENT_LINES.filter((each) => each.id === id))
    const right = suggestion.right.flatMap((id) => OPEN_INVOICES.filter((each) => each.id === id))
    const leftTotal = sumParas(left.map((each) => remainingOf(each, matches, 'left')))
    const rightTotal = sumParas(right.map((each) => remainingOf(each, matches, 'right')))
    const last = right.at(-1)
    return {
      id: suggestion.id,
      left: left.map((each) => lineItem(each)),
      right: right.map((each) => invoiceItem(each)),
      label: `${left.map((each) => each.label).join(', ')} with ${right.map((each) => each.title).join(', ')}`,
      confidence: suggestion.confidence,
      ...(leftTotal < rightTotal && last !== undefined
        ? { note: `Leaves ${money(rightTotal - leftTotal)} open on ${last.title}` }
        : {}),
    }
  })

  const shownMatches: MatchingMatch[] = matches.map((match) => {
    const left = match.left.flatMap((each) => {
      const entry = lineById(each.id)
      return entry === undefined ? [] : [lineItem(entry, each.paras)]
    })
    const right = match.right.flatMap((each) => {
      const entry = invoiceById(each.id)
      return entry === undefined ? [] : [invoiceItem(entry, each.paras)]
    })
    return {
      id: match.id,
      left,
      right,
      label: `${left.map((each) => each.label).join(', ')} with ${right.map((each) => each.label).join(', ')}`,
      note: match.how,
    }
  })

  const matched = sumParas(matches.flatMap((match) => match.left.map((each) => each.paras)))
  const left = sumParas(openLines.map((each) => remainingOf(each, matches, 'left')))
  const linesLeft = openLines.length
  const postReason =
    linesLeft === 0
      ? undefined
      : `${format.number(String(linesLeft))} ${linesLeft === 1 ? 'line is' : 'lines are'} not matched yet.`
  const post =
    postReason === undefined ? (
      <Button
        family="primary"
        icon={BookCheck}
        emphasis="primary"
        label="Post statement"
        onClick={() => {
          notice.success('Statement 188 posted.')
        }}
      />
    ) : (
      <UnavailableAction
        family="primary"
        icon={BookCheck}
        emphasis="primary"
        label="Post statement"
        reason={postReason}
      />
    )

  return (
    <Shell
      phone={phone}
      crumbs={[
        { label: 'Statements', href: '#/banking/statements' },
        { label: `Statement ${STATEMENT.number}` },
      ]}
      tabs={BANKING_TABS}
      {...(phone ? { bottomBar: post } : {})}
    >
      <Page phone={phone}>
        <PageHeader
          title={`Statement ${STATEMENT.number}`}
          back={{ href: '#/banking/statements', label: 'Statements' }}
          status={<StatusBadge label="Matching" tone="warning" />}
          subtitle={
            <>
              {STATEMENT.bank} · {STATEMENT.account} · <DateText value={STATEMENT.date} />
            </>
          }
          {...(phone ? {} : { actions: post })}
        />
        <KeyFigures
          layout={phone ? 'phone' : 'desktop'}
          items={[
            {
              key: 'opening',
              label: 'Opening balance',
              value: <MoneyText value={decimalOf(STATEMENT.opening)} currency="RSD" />,
            },
            {
              key: 'in',
              label: 'Money in',
              value: <MoneyText value={STATEMENT_TOTALS.incoming} currency="RSD" />,
            },
            {
              key: 'out',
              label: 'Money out',
              value: <MoneyText value={STATEMENT_TOTALS.outgoing} currency="RSD" />,
            },
            {
              key: 'closing',
              label: 'Closing balance',
              value: <MoneyText value={STATEMENT_TOTALS.closing} currency="RSD" />,
            },
          ]}
        />
        <MatchingView
          label={`Matching statement ${STATEMENT.number}`}
          layout={phone ? 'single' : 'split'}
          left={{
            title: 'Statement lines',
            description: `${format.number(String(TO_MATCH.length))} lines to match; the fee and the interest (${format.number(String(BANK_ITEMS.length))} bank items) are booked to accounts`,
            items: openLines
              .filter((each) => searched(`${each.title} ${each.subtitle}`, lineSearch))
              .map((each) => lineItem(each)),
            selected: lines,
            onSelectedChange: setLines,
            search: lineSearch,
            onSearchChange: setLineSearch,
          }}
          right={{
            title: 'Open invoices',
            description: `${format.number(String(openInvoices.length))} invoices`,
            items: openInvoices
              .filter((each) => searched(`${each.title} ${each.customer}`, invoiceSearch))
              .map((each) => invoiceItem(each)),
            selected: invoices,
            onSelectedChange: setInvoices,
            search: invoiceSearch,
            onSearchChange: setInvoiceSearch,
          }}
          onMatch={(leftIds, rightIds) => {
            record(leftIds, rightIds, 'Matched by Milica Petrović')
          }}
          suggestions={suggestions}
          onAcceptSuggestion={(id) => {
            const suggestion = STATEMENT_SUGGESTIONS.find((each) => each.id === id)
            if (suggestion !== undefined) {
              record(suggestion.left, suggestion.right, 'Suggestion accepted by Milica Petrović')
            }
          }}
          onDismissSuggestion={(id) => {
            setDismissed((current) => [...current, id])
          }}
          matches={shownMatches}
          onUnmatch={(id) => {
            setMatches((current) => current.filter((match) => match.id !== id))
          }}
          summary={
            <KeyFigures
              layout={phone ? 'phone' : 'desktop'}
              items={[
                {
                  key: 'matched',
                  label: 'Matched',
                  value: <MoneyText value={decimalOf(matched)} currency="RSD" />,
                },
                {
                  key: 'left',
                  label: 'Left to match',
                  value: <MoneyText value={decimalOf(left)} currency="RSD" />,
                },
                { key: 'lines', label: 'Lines left', value: format.number(String(linesLeft)) },
              ]}
            />
          }
        />
      </Page>
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

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
                text: `${format.number('0')} of ${count} employees · ${rerun}`,
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
  { path: F_ROUTES.statement, render: (phone) => <BankStatement phone={phone} /> },
  { path: F_ROUTES.journal, render: (phone) => <JournalEntry phone={phone} unbalanced={false} /> },
  {
    path: F_ROUTES.journalUnbalanced,
    render: (phone) => <JournalEntry phone={phone} unbalanced />,
  },
  { path: F_ROUTES.payroll, render: (phone) => <PayrollRun phone={phone} /> },
]
