/*
 * The logic of PickList and StockCount (BUILD-PLAN P5.11), kept apart from the markup so it can
 * be unit-tested (AGENTS.md C7). Counting lines is not computing amounts: the quantities stay the
 * application's decimal strings.
 */

/** A pick line's state, from the application. */
export type PickLineState = 'open' | 'picked' | 'short' | 'skipped'

/** The step of the current line: scan its location, scan its item, confirm the quantity. */
export type PickStep = 'location' | 'item' | 'quantity'

export const PICK_STEPS: readonly PickStep[] = ['location', 'item', 'quantity']

/** How many lines are done (picked, short or skipped) of all: "4 of 12". */
export function pickProgress(lines: readonly { state: PickLineState }[]): {
  done: number
  total: number
} {
  return {
    done: lines.filter((line) => line.state !== 'open').length,
    total: lines.length,
  }
}

/** Where a step stands against the current one: done before it, current, or still to come. */
export function pickStepState(step: PickStep, current: PickStep): 'done' | 'current' | 'todo' {
  const at = PICK_STEPS.indexOf(step)
  const now = PICK_STEPS.indexOf(current)
  return at < now ? 'done' : at === now ? 'current' : 'todo'
}
