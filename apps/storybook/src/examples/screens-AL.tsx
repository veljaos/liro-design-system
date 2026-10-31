import { type ReactNode } from 'react'
import {
  Button,
  StatutoryFormPage,
  Toaster,
  useLiro,
  type SourceDocument,
  type StatutoryCell,
  type StatutoryColumn,
  type StatutoryItem,
  type StatutoryRow,
  type StatutorySection,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
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
import { AL_ROUTES } from './data-AL'
import { reportsTabs, Shell } from './example-shell'
import { Tenant } from './screens-G'

/*
 * The example screen: Kvadrat Gradnja d.o.o.'s trial balance on 14.10.2026, on
 * StatutoryFormPage's grid: one part per class, the synthetic accounts as numbered groups, the
 * accounts as rows; groups Opening / Turnover / Closing over Debit / Credit (two header rows);
 * every figure a source cell whose drawer links to the account's card; "Compare with 14.10.2025."
 * puts last year's figure under each value; the three checks of the books ("Debit equals credit")
 * are the Core's. The screen lays out the Core's figures; data-AK.ts works them out.
 */

export { AL_ROUTES }

/** Milica Petrović's ledger of Kvadrat Gradnja d.o.o. on 14 October 2026, with its toasts. */
function LedgerShell({
  phone,
  crumbs,
  children,
}: {
  phone: boolean
  crumbs: { label: string; href?: string }[]
  children: ReactNode
}) {
  return (
    <Tenant today={LEDGER_TODAY}>
      <Shell phone={phone} crumbs={crumbs} tabs={reportsTabs('trial')}>
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

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
    <LedgerShell phone={phone} crumbs={[{ label: 'Accounting' }, { label: 'Trial balance' }]}>
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

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AL_ROUTES: ExampleRoute[] = [
  { path: AL_ROUTES.trial, render: (phone) => <TrialBalance phone={phone} /> },
  { path: AL_ROUTES.trialCompare, render: (phone) => <TrialBalance phone={phone} compare /> },
]
