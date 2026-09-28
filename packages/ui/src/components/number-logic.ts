import type { LiroFormat } from '../provider/format'

/*
 * The logic of NumberField and MoneyField, kept apart from the markup so it can be unit-tested
 * (AGENTS.md C7). There is no input mask (Appendix B.3): the text is read by `format.parseNumber`
 * when the user leaves the field or presses Enter, and the value is a decimal string, never a
 * JavaScript number (Appendix B.4).
 */

/** The result of reading what the user typed. */
export interface NumberEntry {
  /** The decimal string, or null when the text is empty or cannot be read (never "0"). */
  value: string | null
  /** False when the text is not empty and cannot be read as a number. */
  valid: boolean
}

/** Reads the typed text: empty is a valid null, unreadable is an invalid null. */
export function readNumber(text: string, format: Pick<LiroFormat, 'parseNumber'>): NumberEntry {
  if (text.trim() === '') return { value: null, valid: true }
  const value = format.parseNumber(text)
  return value === null ? { value: null, valid: false } : { value, valid: true }
}

/** The text a field shows for a value: formatted through `format`, never rounded. */
export function showNumber(
  value: string | null,
  format: Pick<LiroFormat, 'number'>,
  decimals: number | undefined,
): string {
  if (value === null) return ''
  return format.number(value, decimals === undefined ? {} : { decimals })
}

/**
 * Whether the currency comes before the amount in this locale: the same rule as a displayed
 * amount (`format.money`), so an amount looks the same in a field and in text (owner's decision,
 * 2026-09-28). Read from `format.money` itself, so an application's own format is followed too.
 */
export function currencyFirst(format: Pick<LiroFormat, 'money'>, currency: string): boolean {
  const sample = format.money('1', currency)
  const at = sample.indexOf(currency)
  return at !== -1 && at < sample.indexOf('1')
}
