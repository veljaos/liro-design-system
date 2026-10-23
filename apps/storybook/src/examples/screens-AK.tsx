import { type ReactNode } from 'react'
import { Toaster } from '@veljaos/ui'
import { reportsTabs, Shell } from './example-shell'
import { Tenant } from './screens-G'
import { AK_ROUTES, LEDGER_TODAY } from './data-AK'

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

/** Milica Petrović's ledger of Kvadrat Gradnja d.o.o. on 14 October 2026. */
export function LedgerShell({
  phone,
  tab,
  crumbs,
  bottomBar,
  children,
}: {
  phone: boolean
  tab: 'trial'
  crumbs: { label: string; href?: string }[]
  bottomBar?: ReactNode
  children: ReactNode
}) {
  return (
    <Tenant today={LEDGER_TODAY}>
      <Shell
        phone={phone}
        crumbs={crumbs}
        tabs={reportsTabs(tab)}
        {...(bottomBar === undefined ? {} : { bottomBar })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

// ── The chart of accounts ─────────────────────────────────────────────────────────────────────

// ── The account card ──────────────────────────────────────────────────────────────────────────

// ── Routes ────────────────────────────────────────────────────────────────────────────────────
