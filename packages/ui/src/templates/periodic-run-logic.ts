/*
 * The logic of PeriodicRunPage (BUILD-PLAN P5.21), tested on its own: counting the checks by
 * result. The results themselves are the application's.
 */

/** The result of one check, from the application. */
export type RunCheckResult = 'passed' | 'warning' | 'failed' | 'notRun'

/** The order results are summed up in: what needs attention first. */
export const RUN_RESULT_ORDER: readonly RunCheckResult[] = ['failed', 'warning', 'passed', 'notRun']

/** How many checks have each result; results that no check has are left out, in RUN_RESULT_ORDER. */
export function countChecks(
  checks: readonly { result: RunCheckResult }[],
): { result: RunCheckResult; count: number }[] {
  return RUN_RESULT_ORDER.map((result) => ({
    result,
    count: checks.filter((check) => check.result === result).length,
  })).filter((entry) => entry.count > 0)
}
