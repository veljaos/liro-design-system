/*
 * Decimal strings as whole units for the stories and the example screens: the application's
 * arithmetic, played by the story data (components never add, D4). One module for every story,
 * so the examples' figures are computed one way. Not part of the package; no classes here.
 */

/** A decimal string with up to `places` decimals as whole units of 10^-places (paras for 2). */
export function toUnits(value: string, places = 2): bigint {
  const negative = value.startsWith('-')
  const [whole = '0', fraction = ''] = value.replace(/^-/, '').split('.')
  const digits = BigInt(`${whole}${fraction.padEnd(places, '0').slice(0, places)}`)
  return negative ? -digits : digits
}

/** Whole units of 10^-places as a decimal string with `places` decimals. */
export function fromUnits(value: bigint, places = 2): string {
  const negative = value < 0n
  const digits = (negative ? -value : value).toString().padStart(places + 1, '0')
  const text = places === 0 ? digits : `${digits.slice(0, -places)}.${digits.slice(-places)}`
  return negative ? `-${text}` : text
}

/** A money amount as whole paras. */
export function paras(value: string): bigint {
  return toUnits(value, 2)
}

/** Whole paras as a decimal string with two decimals. */
export function decimal(value: bigint): string {
  return fromUnits(value, 2)
}

/** The sum of whole units. */
export function sumUnits(values: readonly bigint[]): bigint {
  return values.reduce((total, value) => total + value, 0n)
}
