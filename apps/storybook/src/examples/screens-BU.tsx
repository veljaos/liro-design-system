import { type ReactNode } from 'react'
import { Toaster } from '@veljaos/ui'
import { reportsTabs, Shell, type ExampleAccount } from './example-shell'
import { Tenant } from './screens-G'
import { BU_ROUTES, BU_TODAY } from './data-BU'

/*
 * Group BU's example screens (P5.80, scheduled reports): Kvadrat Gradnja d.o.o.'s reports sent by
 * e-mail on a schedule, seen by Milica Petrović on 14 October 2026 at 09:40.
 * - The schedules (ListPage + DataTable): the report, the schedule in the application's words,
 *   who gets it, the format, the next run, the last run's state in words, and a switch that
 *   pauses or resumes it; views All / Active / Paused / Last run failed.
 * - One schedule (DetailPage): the report and its parameters, the schedule with the time zone
 *   and the application's next runs, the recipients, the last runs (sent, failed with the
 *   application's message, skipped because there was nothing to send) with their files, and
 *   the e-mail as the recipient gets it (EmailPreview). Send now (ConfirmDialog, the record as
 *   its subject), Pause or Resume, Edit. The failed budget report says why at the top (Alert,
 *   neutral actions).
 * - A new or edited schedule (RecordFormPage): the report and its parameters (ReportPage's
 *   fields), how often from the application's list (every day / week on a day / month on a day /
 *   quarter), the time from its list and the time zone shown, people of the company and outside
 *   addresses checked by the application, the format, what happens when there is nothing to
 *   send, the subject and message, and the preview.
 * Built from the library only; nothing new was needed. Every date of a next run, every count and
 * every state is the application's (data-BU.ts); the screens compute none of them.
 * Also the analytics module's shell, shared with group BV.
 */

export { BU_ROUTES }

/** The analytics module's screen on 14 October 2026, with its toasts. */
export function AnalyticsShell({
  phone,
  tab,
  crumbs,
  account,
  children,
}: {
  phone: boolean
  tab: string
  crumbs: { label: string; href?: string }[]
  account?: ExampleAccount
  children: ReactNode
}) {
  const tabs = reportsTabs(tab === 'analysis' ? 'costs' : 'overview')
  return (
    <Tenant today={BU_TODAY}>
      <Shell
        phone={phone}
        crumbs={crumbs}
        tabs={tabs}
        {...(account === undefined ? {} : { account })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

// ── The schedules ─────────────────────────────────────────────────────────────────────────────

// ── One schedule ──────────────────────────────────────────────────────────────────────────────

// ── A new or edited schedule ──────────────────────────────────────────────────────────────────

// ── Routes ────────────────────────────────────────────────────────────────────────────────────
