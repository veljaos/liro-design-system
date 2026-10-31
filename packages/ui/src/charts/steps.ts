import { compareDecimal, isDecimal } from '../components/quantity-logic'

/*
 * Values in steps (RegionChart and Heatmap): the application's
 * `breaks` cut its values into at most five steps, each drawn as one shade of one meaning. The
 * values stay decimal strings, compared exactly; a missing or unreadable value has no step —
 * "No data", hatched, never 0.
 */

/** The most steps a ramp has: five shades of one meaning stay distinguishable. */
export const MAX_STEPS = 5

/** A ramp: the charts' main blue in steps, or neutral grey. */
export type StepRamp = 'main' | 'neutral'

/**
 * The step a value falls in, between the application's `breaks` (ascending decimal strings): 0
 * below the first break, n at or above the nth. Compared exactly as decimal strings, never as
 * JavaScript numbers. Null — "No data", never 0 — when the value is missing or unreadable.
 */
export function valueStep(
  value: string | null | undefined,
  breaks: readonly string[],
): number | null {
  if (value === null || value === undefined || !isDecimal(value.trim())) return null
  const exact = value.trim()
  let step = 0
  for (const each of breaks.slice(0, MAX_STEPS - 1)) {
    if (isDecimal(each) && compareDecimal(exact, each) >= 0) step += 1
  }
  return step
}

/** How many steps the breaks make (one more than the breaks), at most `MAX_STEPS`. */
export function stepCount(breaks: readonly string[]): number {
  return Math.min(breaks.length + 1, MAX_STEPS)
}

/** A step's shade: the ramp's meaning and how strongly it is laid on the card. */
export interface StepShade {
  /** `var(--liro-chart-main)`, or `var(--liro-chart-other)` for a neutral ramp. */
  colour: string
  /** 0.25 for the lowest step up to 1 for the highest. */
  opacity: number
}

/**
 * A step's shade: the ramp's meaning (`--liro-chart-main`, or `--liro-chart-other` for neutral)
 * laid on the card's surface, the lowest step lightest (25%), the highest the meaning itself.
 * Tokens only, so the shades follow the theme (on a dark card the lowest step is the darkest).
 */
export function stepShade(step: number, count: number, ramp: StepRamp): StepShade {
  const colour = ramp === 'main' ? 'var(--liro-chart-main)' : 'var(--liro-chart-other)'
  const last = Math.max(1, count - 1)
  const clamped = Math.min(Math.max(step, 0), last)
  const opacity = count <= 1 ? 1 : Math.round(25 + (75 * clamped) / last) / 100
  return { colour, opacity }
}

/** A step of the legend: its range, `from` inclusive and `to` exclusive; null at an open end. */
export interface StepRange {
  step: number
  from: string | null
  to: string | null
}

/** The ranges of the steps the breaks make, lowest first. */
export function stepRanges(breaks: readonly string[]): StepRange[] {
  const used = breaks.slice(0, MAX_STEPS - 1)
  return Array.from({ length: used.length + 1 }, (_, step) => ({
    step,
    from: step === 0 ? null : (used[step - 1] ?? null),
    to: used[step] ?? null,
  }))
}
