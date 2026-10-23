/*
 * Group BU's dataset (P5.80, scheduled reports): Kvadrat Gradnja d.o.o.'s reports sent by e-mail
 * on a schedule, seen by Milica Petrović on 14 October 2026 at 09:40 (Europe/Belgrade). Every
 * schedule's words ("Every Monday at 07:00"), next runs, run states, sizes and messages are the
 * application's: nothing here or in the screens computes a date or a count of a schedule. The
 * figures in the e-mails are the ones the other groups already show (receivables of group X, the
 * budget of group AR, the trial balance of group AL). Invented data; addresses at example.com.
 */

export const BU_TODAY = '2026-10-14'
export const BU_ROUTES = {
  list: '/analytics/scheduled',
  schedule: (id: string) => `/analytics/scheduled/${id}`,
  /** The weekly receivables overview to the director. */
  receivables: '/analytics/scheduled/rs-01',
  /** The same, "Send now" asked, as the application restores it. */
  sendNow: '/analytics/scheduled/rs-01?send=1',
  /** The budget report whose last run failed. */
  failed: '/analytics/scheduled/rs-04',
  /** The site report the director paused. */
  paused: '/analytics/scheduled/rs-05',
  edit: '/analytics/scheduled/rs-01/edit',
  create: '/analytics/scheduled/new',
  /** The new schedule after "Save" with an outside address that is not one, and no subject. */
  createChecked: '/analytics/scheduled/new?checked=1',
} as const

// ── The application's lists ──────────────────────────────────────────────────────────────────

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly'

export type ReportFormat = 'pdf' | 'xlsx' | 'csv'

export type WhenEmpty = 'send' | 'skip'

// ── The schedules ─────────────────────────────────────────────────────────────────────────────

export type RunState = 'Sent' | 'Failed' | 'Skipped'

/** One run of a schedule, from the application's log. */
export interface ReportRun {
  id: string
  /** When it ran (an instant). */
  at: string
  state: RunState
  /** "1 of 1" — the application's count of who got it. */
  delivered: string
  /** The file sent, with its size in the application's words; null when nothing was sent. */
  file: { name: string; size: string } | null
  /** Why it failed or was skipped, in the application's words. */
  note?: string
}

export interface Schedule {
  id: string
  name: string
  report: string
  /** The chosen value of each of the report's parameters. */
  parameters: Record<string, string>
  frequency: Frequency
  /** The weekday (1–7) for a weekly schedule, the day ("1"…"28", "last") for the others. */
  day: string
  time: string
  /** The schedule in the application's words. */
  when: string
  people: readonly string[]
  outside: readonly string[]
  format: ReportFormat
  whenEmpty: WhenEmpty
  subject: string
  message: string
  active: boolean
  /** Who paused it, when and why, in the application's words. */
  pausedNote?: string
  /** The next runs, from the application (instants); empty while paused. */
  next: readonly string[]
  runs: readonly ReportRun[]
  createdBy: string
}

export function inView(schedule: Schedule, view: string): boolean {
  if (view === 'active') return schedule.active
  if (view === 'paused') return !schedule.active
  if (view === 'failed') return schedule.runs[0]?.state === 'Failed'
  return true
}
