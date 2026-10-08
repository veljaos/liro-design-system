/*
 * The logic of JobProgress (P5.4): how far a job has come and how its report reads. Counts of
 * items are whole numbers the application sends (not money, AGENTS.md D4); they are shown through
 * the provider's `format.number`.
 */

/** The states of a long job. */
export type JobState = 'running' | 'finished' | 'cancelled'

/**
 * The done count kept inside 0 … total, for the bar: a server that reports one more than the
 * total (a retried item counted twice) never draws past the end. `null` while the total is not
 * known — the bar is then indeterminate.
 */
export function clampedDone(done: number, total: number | undefined): number | null {
  if (total === undefined || total <= 0) return null
  return Math.min(Math.max(done, 0), total)
}

/** How the report of a job reads: its icon and tone follow the state and the failures. */
export type JobOutcome = 'running' | 'success' | 'partial' | 'cancelled'

/**
 * The outcome shown by the report: a finished job without failures is a success, with failures
 * a partial success (warning: some items need the user), a cancelled one is neutral whatever it
 * had done. The words come from the application's outcome lines; this only chooses the icon.
 */
export function jobOutcome(state: JobState, failureCount: number): JobOutcome {
  if (state === 'running') return 'running'
  if (state === 'cancelled') return 'cancelled'
  return failureCount > 0 ? 'partial' : 'success'
}
