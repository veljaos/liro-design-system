import type { LiroFormat, Weekday } from '../provider/format'
import type { LiroMessages } from '../provider/messages'
import type { DateRange } from './date-field'

/*
 * The logic of PeriodField, kept apart from the markup so it can be unit-tested (AGENTS.md C7).
 * Every preset is computed from the provider's `today` (the tenant's date, never the device's),
 * the business year's first month (`yearStartMonth`) and the provider's `weekStartsOn`. Dates are
 * YYYY-MM-DD; the arithmetic works on whole months and days, never on a clock.
 *
 * Owner's decisions (2026-09-28, docs/decisions.md "Numbers, money and dates"):
 * - Quarters follow `quarterBasis`: 'business' counts Q1 from the business year's first month
 *   (a July start: Q1 = Jul–Sep … Q4 = Apr–Jun); 'calendar' always starts Q1 in January, for
 *   periods such as quarterly VAT.
 * - A business year is named by `format.businessYear`: "2026", or "2025/26" when it does not
 *   start in January.
 */

/** The presets of a period field. */
export type PeriodPreset =
  | 'today'
  | 'thisWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'yearToDate'
  | 'lastYear'

/** The presets shown by default, in this order (the previous Design System's PeriodPicker). */
export const PERIOD_PRESETS: readonly PeriodPreset[] = [
  'today',
  'thisWeek',
  'thisMonth',
  'lastMonth',
  'thisQuarter',
  'lastQuarter',
  'yearToDate',
  'lastYear',
]

/** Which quarters: counted from the business year's first month, or from January. */
export type QuarterBasis = 'business' | 'calendar'

export interface PeriodRules {
  /** YYYY-MM-DD, from the provider. */
  today: string
  /** The business year's first month, 1 (January) … 12. */
  yearStartMonth: number
  weekStartsOn: Weekday
  quarterBasis: QuarterBasis
}

/** A remainder that is never negative. */
function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0')
}

/** Months counted from year 0: year * 12 + (month - 1). */
function monthIndex(iso: string): number {
  return Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1
}

/** The first day of a month index. */
function firstDay(index: number): string {
  return `${pad(Math.floor(index / 12), 4)}-${pad(mod(index, 12) + 1, 2)}-01`
}

/**
 * A UTC date in a year with the same leap years as `year`: the Gregorian calendar repeats every
 * 400 years, so any year can be computed as one between 2000 and 2399 and shifted back.
 */
function cycleYear(year: number): number {
  return 2000 + mod(year, 400)
}

/** The last day of a month index. */
function lastDay(index: number): string {
  const year = Math.floor(index / 12)
  const month = mod(index, 12) + 1
  const days = new Date(Date.UTC(cycleYear(year), month, 0)).getUTCDate()
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(days, 2)}`
}

/** Whole months from `start` for `count` months. */
function months(start: number, count: number): DateRange {
  return { start: firstDay(start), end: lastDay(start + count - 1) }
}

/** A date moved by whole days. */
export function addDays(iso: string, days: number): string {
  const [year = 0, month = 1, day = 1] = iso.split('-').map(Number)
  const base = cycleYear(year)
  const date = new Date(Date.UTC(base, month - 1, day + days))
  const shifted = date.getUTCFullYear() - base + year
  return `${pad(shifted, 4)}-${pad(date.getUTCMonth() + 1, 2)}-${pad(date.getUTCDate(), 2)}`
}

/** The first month of the quarter (or of the year, with `length` 12) that holds `index`. */
function periodStart(index: number, anchorMonth: number, length: 3 | 12): number {
  return index - mod(index - (anchorMonth - 1), length)
}

/** The first month of quarters under a basis. */
function quarterAnchor(rules: Pick<PeriodRules, 'yearStartMonth' | 'quarterBasis'>): number {
  return rules.quarterBasis === 'calendar' ? 1 : rules.yearStartMonth
}

/** The range of a preset. */
export function presetRange(preset: PeriodPreset, rules: PeriodRules): DateRange {
  const today = rules.today
  const month = monthIndex(today)
  const quarter = periodStart(month, quarterAnchor(rules), 3)
  const year = periodStart(month, rules.yearStartMonth, 12)
  switch (preset) {
    case 'today':
      return { start: today, end: today }
    case 'thisWeek': {
      const [y = 0, m = 1, d = 1] = today.split('-').map(Number)
      const weekday = new Date(Date.UTC(cycleYear(y), m - 1, d)).getUTCDay()
      const start = addDays(today, -mod(weekday - rules.weekStartsOn, 7))
      return { start, end: addDays(start, 6) }
    }
    case 'thisMonth':
      return months(month, 1)
    case 'lastMonth':
      return months(month - 1, 1)
    case 'thisQuarter':
      return months(quarter, 3)
    case 'lastQuarter':
      return months(quarter - 3, 3)
    case 'yearToDate':
      return { start: firstDay(year), end: today }
    case 'lastYear':
      return months(year - 12, 12)
  }
}

/** The first preset whose range is exactly `range`, or null. */
export function matchingPreset(
  range: DateRange | null,
  presets: readonly PeriodPreset[],
  rules: PeriodRules,
): PeriodPreset | null {
  if (range === null) return null
  return (
    presets.find((preset) => {
      const candidate = presetRange(preset, rules)
      return candidate.start === range.start && candidate.end === range.end
    }) ?? null
  )
}

/**
 * The words for a period: all periods, a day, a month ("March 2026"), a quarter ("Q1 2025/26"),
 * a business or calendar year ("2025/26", "2026"), or "start – end".
 */
export function describePeriod(
  range: DateRange | null,
  rules: Pick<PeriodRules, 'yearStartMonth' | 'quarterBasis'>,
  format: Pick<LiroFormat, 'date' | 'monthName' | 'businessYear'>,
  messages: Pick<LiroMessages, 'period.all' | 'period.quarter'>,
): string {
  if (range === null || (range.start === null && range.end === null)) return messages['period.all']
  const { start, end } = range
  if (start === null || end === null) {
    return `${start === null ? '' : format.date(start)} – ${end === null ? '' : format.date(end)}`
  }
  if (start === end) return format.date(start)
  const first = monthIndex(start)
  const last = monthIndex(end)
  if (start === firstDay(first) && end === lastDay(last)) {
    const count = last - first + 1
    const yearName = (anchor: number) => {
      const yearStart = periodStart(first, anchor, 12)
      return format.businessYear(Math.floor(yearStart / 12), mod(yearStart, 12) + 1)
    }
    if (count === 1) {
      return `${format.monthName(mod(first, 12) + 1, 'long')} ${String(Math.floor(first / 12))}`
    }
    const anchor = quarterAnchor(rules)
    if (count === 3 && periodStart(first, anchor, 3) === first) {
      const quarter = Math.floor(mod(first - (anchor - 1), 12) / 3) + 1
      return messages['period.quarter'](quarter, yearName(anchor))
    }
    if (count === 12 && periodStart(first, rules.yearStartMonth, 12) === first) {
      return yearName(rules.yearStartMonth)
    }
    if (count === 12 && periodStart(first, 1, 12) === first) return yearName(1)
  }
  return `${format.date(start)} – ${format.date(end)}`
}
