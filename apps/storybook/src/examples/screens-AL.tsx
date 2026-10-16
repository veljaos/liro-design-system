import { useContext, useState } from 'react'
import {
  Button,
  Drawer,
  KeyValueList,
  MoneyText,
  StatutoryFormPage,
  useLiro,
  type SourceDocument,
  type StatutoryCell,
  type StatutoryColumn,
  type StatutoryItem,
  type StatutoryRow,
  type StatutorySection,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import {
  accountPath,
  AK_ROUTES,
  CHART,
  LEDGER_TODAY,
  TRIAL_ACCOUNTS,
  TRIAL_TOTALS,
  TRIAL_TOTALS_PREVIOUS,
  trialTotals,
  type AccountFigures,
  type TrialAccount,
  type TrialTotals,
} from './data-AK'
import {
  AL_ROUTES,
  BALANCE_SHEET,
  INCOME_STATEMENT,
  noteByNumber,
  type StatementLine,
  type StatementNote,
  type StatementPart,
} from './data-AL'
import { LedgerShell } from './screens-AK'

/*
 * Group AL's example screens (P5.45): Kvadrat Gradnja d.o.o.'s trial balance on 14.10.2026 and
 * its financial statements of 30.09.2026, all on StatutoryFormPage's grid. The trial balance:
 * one part per class, the synthetic accounts as numbered groups, the accounts as rows; groups
 * Opening / Turnover / Closing over Debit / Credit (two header rows); every figure a source cell
 * whose drawer links to the account's card (the drill-down: trial balance → account card → the
 * document); "Compare with 14.10.2025." puts last year's figure under each value; the three
 * checks of the books ("Debit equals credit") are the Core's. The balance sheet and the income
 * statement: positions with their codes, a "Note" column whose cell opens the note (StatutoryCell
 * `content`, the one new prop of this group), this year and the year before beside it as the
 * statement's own columns. The screens lay out the Core's figures; data-AK.ts and data-AL.ts work
 * them out.
 */

export { AL_ROUTES }

// ── The trial balance ─────────────────────────────────────────────────────────────────────────

const TRIAL_COLUMNS: StatutoryColumn[] = [
  { id: 'openingDebit', label: 'Debit', group: 'Opening 01.01.2026.' },
  { id: 'openingCredit', label: 'Credit', group: 'Opening 01.01.2026.' },
  { id: 'turnoverDebit', label: 'Debit', group: 'Turnover 01.01.–14.10.2026.' },
  { id: 'turnoverCredit', label: 'Credit', group: 'Turnover 01.01.–14.10.2026.' },
  { id: 'closingDebit', label: 'Debit', group: 'Closing 14.10.2026.' },
  { id: 'closingCredit', label: 'Credit', group: 'Closing 14.10.2026.' },
]

type TrialColumn = keyof TrialTotals

function pick(figures: AccountFigures, column: TrialColumn): string | null {
  switch (column) {
    case 'openingDebit':
      return figures.opening.debit
    case 'openingCredit':
      return figures.opening.credit
    case 'turnoverDebit':
      return figures.turnover.debit
    case 'turnoverCredit':
      return figures.turnover.credit
    case 'closingDebit':
      return figures.closing.debit
    case 'closingCredit':
      return figures.closing.credit
  }
}

const COLUMN_IDS = TRIAL_COLUMNS.map((column) => column.id as TrialColumn)

/** An account's row: each figure opens the account's card (its "source document"). */
function accountRow(entry: TrialAccount): StatutoryRow {
  const { account } = entry
  const cells: Partial<Record<string, StatutoryCell>> = {}
  for (const column of COLUMN_IDS) {
    const value = pick(entry.current, column)
    const previous = pick(entry.previous, column)
    if (value === null && previous === null) continue
    const card: SourceDocument = {
      key: 'card',
      type: 'Account card',
      number: account.code,
      href: `#${AK_ROUTES.card(account.code)}`,
      amount: value ?? '0.00',
    }
    cells[column] = {
      kind: value === null ? 'computed' : 'source',
      value,
      previous,
      ...(value === null ? {} : { sources: [card], sourceName: 'Postings in the general ledger' }),
    }
  }
  return { id: account.code, number: account.code, label: account.name, cells }
}

/** A sum row (a class, or every class): computed by the Core. */
function totalRow(
  id: string,
  label: string,
  current: TrialTotals,
  previous: TrialTotals,
): StatutoryRow {
  const cells: Partial<Record<string, StatutoryCell>> = {}
  for (const column of COLUMN_IDS) {
    cells[column] = { kind: 'computed', value: current[column], previous: previous[column] }
  }
  return { id, number: '', label, cells, total: true }
}

/** One part per class: its synthetic accounts as groups, its accounts as rows, its total. */
const TRIAL_SECTIONS: StatutorySection[] = [
  ...CHART.flatMap((classLevel) => {
    const accounts = TRIAL_ACCOUNTS.filter((each) => each.account.code.startsWith(classLevel.code))
    if (accounts.length === 0) return []
    const items: StatutoryItem[] = []
    for (const entry of accounts) {
      const synthetic = accountPath(entry.account.code)[2]
      if (synthetic === undefined) continue
      const last = items[items.length - 1]
      if (last !== undefined && 'items' in last && last.key === synthetic.code) {
        ;(last.items as StatutoryItem[]).push(accountRow(entry))
      } else {
        items.push({
          key: synthetic.code,
          number: synthetic.code,
          title: synthetic.name,
          items: [accountRow(entry)],
        })
      }
    }
    items.push(
      totalRow(
        `class-${classLevel.code}`,
        `Total of class ${classLevel.code}`,
        trialTotals(accounts, 'current'),
        trialTotals(accounts, 'previous'),
      ),
    )
    return [
      {
        key: `class-${classLevel.code}`,
        title: `Class ${classLevel.code} — ${classLevel.name}`,
        columns: TRIAL_COLUMNS,
        items,
      },
    ]
  }),
  {
    key: 'total',
    title: 'Total of all classes',
    columns: TRIAL_COLUMNS,
    items: [totalRow('total', 'Total', TRIAL_TOTALS, TRIAL_TOTALS_PREVIOUS)],
  },
]

/** Every class but class 2 (receivables and cash) starts closed. */
const COLLAPSED_CLASSES = TRIAL_SECTIONS.filter(
  (section) => section.key !== 'class-2' && section.key !== 'total',
).map((section) => section.key)

export function TrialBalance({ phone, compare = false }: { phone: boolean; compare?: boolean }) {
  const { format } = useLiro()
  const money = (value: string) => format.money(value, 'RSD')
  return (
    <LedgerShell
      phone={phone}
      tab="trial"
      crumbs={[{ label: 'Accounting' }, { label: 'Trial balance' }]}
    >
      <StatutoryFormPage
        layout={phone ? 'phone' : 'desktop'}
        title="Trial balance, 01.01.–14.10.2026."
        subtitle="Kvadrat Gradnja d.o.o. · every posting to 14.10.2026. 09:40 · illustrative chart of accounts"
        actions={
          <>
            <Button intent="print" emphasis="secondary" label="Print" />
            <Button intent="export" label="Export" />
          </>
        }
        currency="RSD"
        currentLabel={format.date(LEDGER_TODAY)}
        previousLabel="14.10.2025."
        defaultCompare={compare}
        // The class of receivables and cash starts open, the others closed: a press opens them.
        defaultCollapsed={COLLAPSED_CLASSES}
        readOnly
        rules={[
          {
            id: 'opening',
            text: 'Opening: debit equals credit',
            fields: ['total/openingDebit', 'total/openingCredit'],
            result: 'passed',
            detail: money(TRIAL_TOTALS.openingDebit),
          },
          {
            id: 'turnover',
            text: 'Turnover: debit equals credit',
            fields: ['total/turnoverDebit', 'total/turnoverCredit'],
            result: 'passed',
            detail: money(TRIAL_TOTALS.turnoverDebit),
          },
          {
            id: 'closing',
            text: 'Closing: debit equals credit',
            fields: ['total/closingDebit', 'total/closingCredit'],
            result: 'passed',
            detail: money(TRIAL_TOTALS.closingDebit),
          },
        ]}
        sections={TRIAL_SECTIONS}
      />
    </LedgerShell>
  )
}

// ── The financial statements ──────────────────────────────────────────────────────────────────

/** The note's number as a button that opens it beside the statement. */
function NoteButton({ note, onOpen }: { note: StatementNote; onOpen: () => void }) {
  return (
    <button
      type="button"
      aria-label={`Note ${note.number}: ${note.title}`}
      onClick={onOpen}
      className="m-0 box-border inline-flex min-h-6 min-w-6 cursor-pointer appearance-none items-center justify-center rounded-sm border-0 bg-transparent p-0 font-sans text-sm text-link underline decoration-dotted underline-offset-2 outline-none hover:decoration-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <span dir="ltr">{note.number}</span>
    </button>
  )
}

function statementRow(line: StatementLine, openNote: (number: string) => void): StatutoryRow {
  const note = line.note === undefined ? undefined : noteByNumber(line.note)
  return {
    id: line.code,
    number: line.code,
    label: line.label,
    ...(line.total === true ? { total: true } : {}),
    cells: {
      ...(note === undefined
        ? {}
        : {
            note: {
              kind: 'computed' as const,
              value: null,
              content: (
                <NoteButton
                  note={note}
                  onOpen={() => {
                    openNote(note.number)
                  }}
                />
              ),
            },
          }),
      current: { kind: 'computed', value: line.current },
      previous: { kind: 'computed', value: line.previous },
    },
  }
}

function statementSections(
  parts: readonly StatementPart[],
  columns: StatutoryColumn[],
  openNote: (number: string) => void,
): StatutorySection[] {
  return parts.map((part) => ({
    key: part.key,
    title: part.title,
    columns,
    items: [
      ...part.groups.map((group) => ({
        key: `${part.key}-${group.key}`,
        number: group.number,
        title: group.title,
        items: group.lines.map((each) => statementRow(each, openNote)),
      })),
      statementRow(part.total, openNote),
    ],
  }))
}

/** A note beside the statement: its words and its figures, this year and the year before. */
function NoteDrawer({
  note,
  currentLabel,
  previousLabel,
  onClose,
}: {
  note: StatementNote | undefined
  currentLabel: string
  previousLabel: string
  onClose: () => void
}) {
  return (
    <Drawer
      open={note !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      side="end"
      title={note === undefined ? 'Note' : `Note ${note.number}`}
      subject={note?.title}
      actions={<Button intent="cancel" label="Close" onClick={onClose} />}
    >
      {note !== undefined && (
        <div className="flex flex-col gap-4">
          <p className="bidi-content m-0 text-sm text-primary">{note.text}</p>
          {note.figures !== undefined && (
            <KeyValueList
              columns={1}
              groups={[
                {
                  key: 'current',
                  title: currentLabel,
                  items: note.figures.map((figure) => ({
                    key: figure.key,
                    label: figure.label,
                    value: <MoneyText value={figure.current} currency="RSD" />,
                    numeric: true,
                  })),
                },
                {
                  key: 'previous',
                  title: previousLabel,
                  items: note.figures.map((figure) => ({
                    key: figure.key,
                    label: figure.label,
                    value: <MoneyText value={figure.previous} currency="RSD" />,
                    numeric: true,
                  })),
                },
              ]}
            />
          )}
        </div>
      )}
    </Drawer>
  )
}

function Statement({
  phone,
  kind,
  note: initialNote,
}: {
  phone: boolean
  kind: 'balance' | 'income'
  note?: string
}) {
  const navigate = useContext(Navigate)
  const [note, setNote] = useState<string | undefined>(initialNote)
  const balance = kind === 'balance'
  const currentLabel = balance ? '30.09.2026.' : '01.01.–30.09.2026.'
  const previousLabel = balance ? '31.12.2025.' : '01.01.–30.09.2025.'
  const columns: StatutoryColumn[] = [
    { id: 'note', label: 'Note' },
    { id: 'current', label: currentLabel },
    { id: 'previous', label: previousLabel },
  ]
  const sections = statementSections(balance ? BALANCE_SHEET : INCOME_STATEMENT, columns, setNote)
  const other = balance
    ? { path: AL_ROUTES.incomeStatement, label: 'Income statement' }
    : { path: AL_ROUTES.balanceSheet, label: 'Balance sheet' }
  return (
    <LedgerShell
      phone={phone}
      tab="statements"
      crumbs={[
        { label: 'Financial statements', href: `#${AL_ROUTES.balanceSheet}` },
        { label: balance ? 'Balance sheet' : 'Income statement' },
      ]}
    >
      <StatutoryFormPage
        layout={phone ? 'phone' : 'desktop'}
        title={balance ? 'Balance sheet at 30.09.2026.' : 'Income statement, 01.01.–30.09.2026.'}
        subtitle="Kvadrat Gradnja d.o.o. · illustrative positions and codes, not the official form · the notes open from the Note column"
        actions={
          <>
            <Button
              intent="view"
              emphasis="secondary"
              label={other.label}
              onClick={() => {
                navigate(other.path)
              }}
            />
            <Button intent="print" emphasis="secondary" label="Print" />
            <Button intent="export" label="Export" />
          </>
        }
        currency="RSD"
        currentLabel={currentLabel}
        readOnly
        sections={sections}
      />
      <NoteDrawer
        note={note === undefined ? undefined : noteByNumber(note)}
        currentLabel={currentLabel}
        previousLabel={previousLabel}
        onClose={() => {
          setNote(undefined)
        }}
      />
    </LedgerShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AL_ROUTES: ExampleRoute[] = [
  { path: AL_ROUTES.trial, render: (phone) => <TrialBalance phone={phone} /> },
  { path: AL_ROUTES.trialCompare, render: (phone) => <TrialBalance phone={phone} compare /> },
  { path: AL_ROUTES.balanceSheet, render: (phone) => <Statement phone={phone} kind="balance" /> },
  {
    path: AL_ROUTES.balanceSheetNote,
    render: (phone) => <Statement phone={phone} kind="balance" note="8" />,
  },
  { path: AL_ROUTES.incomeStatement, render: (phone) => <Statement phone={phone} kind="income" /> },
]
