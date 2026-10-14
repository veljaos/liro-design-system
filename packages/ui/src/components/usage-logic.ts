import type { LiroFormat } from '../provider/format'
import type { LiroMessages } from '../provider/messages'

/*
 * The logic of UsageMeter (BUILD-PLAN P5.36), kept apart from the markup so it can be
 * unit-tested (AGENTS.md C7): the amounts in words and how far the bar is drawn. The amounts
 * are decimal strings (D4); the words write them through `format.number`, exactly as given. The
 * bar is a picture: only its length is a JavaScript number, as the charts draw their values
 * (`plotValue`), and nothing — no state, no tone — is ever read from that number (D30): whether
 * an amount is near or over its limit is the application's `state`.
 */

const DECIMAL = /^-?\d+(\.\d+)?$/

/**
 * How much of the bar is filled, from 0 to 1: `used` over `limit`, at most a full bar (an
 * amount over its limit fills it; the application's state says so in words). Null when there is
 * nothing to draw: no limit, a limit of zero or below, or an amount that is not a decimal string.
 */
export function meterShare(used: string, limit: string | null | undefined): number | null {
  if (limit === null || limit === undefined) return null
  if (!DECIMAL.test(used) || !DECIMAL.test(limit)) return null
  const top = Number(limit)
  if (!(top > 0)) return null
  return Math.min(Math.max(Number(used) / top, 0), 1)
}

/** An amount with its unit, the number through `format.number` ("4,2 GB"); bare without a unit. */
export function usageAmount(
  format: LiroFormat,
  messages: LiroMessages,
  value: string,
  unit?: string,
): string {
  const number = DECIMAL.test(value) ? format.number(value) : value
  return unit === undefined || unit === '' ? number : messages['usage.amount'](number, unit)
}

/**
 * The amounts in words: "24 of 30", "4,2 GB of 10 GB", or "412 used, no limit" when there is no
 * limit.
 */
export function usageWords(
  format: LiroFormat,
  messages: LiroMessages,
  used: string,
  limit: string | null | undefined,
  unit?: string,
): string {
  const usedText = usageAmount(format, messages, used, unit)
  if (limit === null || limit === undefined) return messages['usage.noLimit'](usedText)
  return messages['usage.ofLimit'](usedText, usageAmount(format, messages, limit, unit))
}
