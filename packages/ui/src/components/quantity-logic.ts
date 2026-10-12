/*
 * The logic of QuantityStepper (BUILD-PLAN P5.11), kept apart from the markup so it can be
 * unit-tested (AGENTS.md C7). A quantity is a decimal string, never a JavaScript number: 0.1 + 0.2
 * is 0.30000000000000004 as a number. Comparing and stepping work on whole integers (`bigint`)
 * scaled by the decimals of both strings, so they are exact. Money is never stepped (D4): this is
 * for counts and quantities only.
 */

const DECIMAL = /^(-?)(\d+)(?:\.(\d+))?$/

/** Whether the text is a decimal string ("12", "-0.5", "1.250"). */
export function isDecimal(value: string): boolean {
  return DECIMAL.test(value)
}

interface Parts {
  negative: boolean
  integer: string
  fraction: string
}

function parts(value: string): Parts {
  const match = DECIMAL.exec(value)
  if (match === null) throw new Error(`Not a decimal string: "${value}"`)
  const [, sign = '', integer = '0', fraction = ''] = match
  return { negative: sign === '-', integer, fraction }
}

/** The value as a whole number of 10^-scale units. */
function scaled(value: Parts, scale: number): bigint {
  const digits = BigInt(`${value.integer}${value.fraction.padEnd(scale, '0')}`)
  return value.negative ? -digits : digits
}

/** A whole number of 10^-scale units written back as a decimal string. */
function unscaled(units: bigint, scale: number): string {
  const negative = units < 0n
  const digits = (negative ? -units : units).toString().padStart(scale + 1, '0')
  const integer = digits.slice(0, digits.length - scale)
  const fraction = digits.slice(digits.length - scale)
  const text = scale === 0 ? integer : `${integer}.${fraction}`
  return negative ? `-${text}` : text
}

/**
 * Compares two decimal strings exactly: -1 when `a` is less, 0 when equal ("1.50" and "1.5"), 1
 * when greater. Throws on a string that is not a decimal.
 */
export function compareDecimal(a: string, b: string): -1 | 0 | 1 {
  const left = parts(a)
  const right = parts(b)
  const scale = Math.max(left.fraction.length, right.fraction.length)
  const difference = scaled(left, scale) - scaled(right, scale)
  return difference < 0n ? -1 : difference > 0n ? 1 : 0
}

/**
 * `value` moved by one `step` up (1) or down (-1), exactly, keeping the larger number of
 * decimals of the two ("1.50" + "1" is "2.50").
 */
export function stepDecimal(value: string, step: string, direction: 1 | -1): string {
  const base = parts(value)
  const by = parts(step)
  const scale = Math.max(base.fraction.length, by.fraction.length)
  const next = scaled(base, scale) + BigInt(direction) * scaled(by, scale)
  return unscaled(next, scale)
}

/** Where a value stands against its limits: under `min`, over `max`, or within (null). */
export function quantityRange(
  value: string | null,
  min: string | undefined,
  max: string | undefined,
): 'below' | 'above' | null {
  if (value === null || !isDecimal(value)) return null
  if (min !== undefined && compareDecimal(value, min) < 0) return 'below'
  if (max !== undefined && compareDecimal(value, max) > 0) return 'above'
  return null
}

export interface StepOptions {
  /** Default "1". */
  step?: string
  min?: string
  max?: string
}

/**
 * The value after a press of − (-1) or + (1): one step, kept within `min` and `max`. An empty
 * value starts from `min` (or from "0" stepped once when there is none); a value outside the
 * limits is brought to the nearer limit.
 */
export function stepQuantity(
  value: string | null,
  direction: 1 | -1,
  options: StepOptions = {},
): string {
  const step = options.step ?? '1'
  const { min, max } = options
  let next: string
  if (value === null || !isDecimal(value)) {
    next = min ?? stepDecimal('0', step, direction)
  } else {
    next = stepDecimal(value, step, direction)
  }
  if (min !== undefined && compareDecimal(next, min) < 0) next = min
  if (max !== undefined && compareDecimal(next, max) > 0) next = max
  return next
}

/** Whether − (-1) or + (1) can still change the value: false at its limit. */
export function canStep(
  value: string | null,
  direction: 1 | -1,
  options: StepOptions = {},
): boolean {
  if (value === null || !isDecimal(value)) return true
  const limit = direction === 1 ? options.max : options.min
  if (limit === undefined) return true
  return direction === 1 ? compareDecimal(value, limit) < 0 : compareDecimal(value, limit) > 0
}
