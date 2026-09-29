import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { messagesEn } from '../provider/messages.en'
import {
  addDays,
  describePeriod,
  matchingPreset,
  PERIOD_PRESETS,
  presetRange,
  type PeriodRules,
} from './period-logic'

const january: PeriodRules = {
  today: '2026-09-28',
  yearStartMonth: 1,
  weekStartsOn: 1,
  quarterBasis: 'business',
}
const july: PeriodRules = { ...january, yearStartMonth: 7 }

describe('presets from the provider today', () => {
  it('computes every preset for a business year starting in January', () => {
    const ranges = Object.fromEntries(PERIOD_PRESETS.map((p) => [p, presetRange(p, january)]))
    expect(ranges).toEqual({
      today: { start: '2026-09-28', end: '2026-09-28' },
      thisWeek: { start: '2026-09-28', end: '2026-10-04' },
      thisMonth: { start: '2026-09-01', end: '2026-09-30' },
      lastMonth: { start: '2026-08-01', end: '2026-08-31' },
      thisQuarter: { start: '2026-07-01', end: '2026-09-30' },
      lastQuarter: { start: '2026-04-01', end: '2026-06-30' },
      yearToDate: { start: '2026-01-01', end: '2026-09-28' },
      lastYear: { start: '2025-01-01', end: '2025-12-31' },
    })
  })

  it('follows a business year starting in July: quarters and years from July', () => {
    expect(presetRange('thisQuarter', july)).toEqual({ start: '2026-07-01', end: '2026-09-30' })
    expect(presetRange('yearToDate', july)).toEqual({ start: '2026-07-01', end: '2026-09-28' })
    expect(presetRange('lastYear', july)).toEqual({ start: '2025-07-01', end: '2026-06-30' })
    const spring = { ...july, today: '2026-02-10' }
    expect(presetRange('thisQuarter', spring)).toEqual({ start: '2026-01-01', end: '2026-03-31' })
    expect(presetRange('lastQuarter', spring)).toEqual({ start: '2025-10-01', end: '2025-12-31' })
    expect(presetRange('yearToDate', spring)).toEqual({ start: '2025-07-01', end: '2026-02-10' })
    expect(presetRange('lastYear', spring)).toEqual({ start: '2024-07-01', end: '2025-06-30' })
  })

  it('counts quarters from the business year or from January (quarterBasis)', () => {
    const april = { ...january, yearStartMonth: 4, today: '2026-05-15' }
    expect(presetRange('thisQuarter', april)).toEqual({ start: '2026-04-01', end: '2026-06-30' })
    const february = { ...january, yearStartMonth: 2, today: '2026-02-15' }
    expect(presetRange('thisQuarter', february)).toEqual({
      start: '2026-02-01',
      end: '2026-04-30',
    })
    expect(presetRange('thisQuarter', { ...february, quarterBasis: 'calendar' })).toEqual({
      start: '2026-01-01',
      end: '2026-03-31',
    })
  })

  it('uses the provider today, whatever the device date is', () => {
    const rules = { ...january, today: '2031-03-01' }
    expect(presetRange('lastMonth', rules)).toEqual({ start: '2031-02-01', end: '2031-02-28' })
    expect(presetRange('lastMonth', { ...rules, today: '2032-03-01' })).toEqual({
      start: '2032-02-01',
      end: '2032-02-29',
    })
  })

  it('starts the week on the provider weekStartsOn, across a year end', () => {
    const rules = { ...january, today: '2026-01-01' }
    expect(presetRange('thisWeek', rules)).toEqual({ start: '2025-12-29', end: '2026-01-04' })
    expect(presetRange('thisWeek', { ...rules, weekStartsOn: 0 })).toEqual({
      start: '2025-12-28',
      end: '2026-01-03',
    })
    expect(presetRange('thisWeek', { ...rules, weekStartsOn: 6 })).toEqual({
      start: '2025-12-27',
      end: '2026-01-02',
    })
  })

  it('moves dates by days across leap days and year ends', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2100-02-28', 1)).toBe('2100-03-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })
})

describe('matchingPreset', () => {
  it('finds the preset whose range is exactly the value', () => {
    expect(matchingPreset(presetRange('lastQuarter', july), PERIOD_PRESETS, july)).toBe(
      'lastQuarter',
    )
    expect(
      matchingPreset({ start: '2026-07-01', end: '2026-09-29' }, PERIOD_PRESETS, july),
    ).toBeNull()
    expect(matchingPreset(null, PERIOD_PRESETS, july)).toBeNull()
  })

  it('prefers the first preset in the list when two ranges are equal', () => {
    // With a July business year, on 2026-09-30 "this quarter" is Jul–Sep 2026 and "year to
    // date" is 2026-07-01 … 2026-09-30 — different; on 1 July "today" and "year to date" agree.
    const first = { ...july, today: '2026-07-01' }
    expect(matchingPreset({ start: '2026-07-01', end: '2026-07-01' }, PERIOD_PRESETS, first)).toBe(
      'today',
    )
  })
})

describe('describePeriod', () => {
  const en = createFormat('en')
  const describe_ = (start: string | null, end: string | null, rules: PeriodRules = january) =>
    describePeriod({ start, end }, rules, en, messagesEn)

  it('names a month, a quarter and a year', () => {
    expect(describe_('2026-03-01', '2026-03-31')).toBe('March 2026')
    expect(describe_('2026-07-01', '2026-09-30')).toBe('Q3 2026')
    expect(describe_('2026-01-01', '2026-12-31')).toBe('2026')
  })

  it('names business years "2025/26" and their quarters from the business year', () => {
    expect(describe_('2025-07-01', '2026-06-30', july)).toBe('2025/26')
    expect(describe_('2025-07-01', '2025-09-30', july)).toBe('Q1 2025/26')
    expect(describe_('2026-01-01', '2026-03-31', july)).toBe('Q3 2025/26')
    expect(describe_('2026-01-01', '2026-03-31', { ...july, quarterBasis: 'calendar' })).toBe(
      'Q1 2026',
    )
  })

  it('writes a day, a range, and all periods', () => {
    expect(describe_('2026-03-05', '2026-03-05')).toBe('03/05/2026')
    expect(describe_('2026-03-05', '2026-04-10')).toBe('03/05/2026 – 04/10/2026')
    expect(describePeriod(null, january, en, messagesEn)).toBe('All periods')
  })

  it('takes the business year name from the format and the quarter from the messages', () => {
    const format = { ...en, businessYear: (year: number) => `FY${String(year + 1)}` }
    const messages = {
      ...messagesEn,
      'period.quarter': (q: number, y: string) => `K${String(q)} ${y}`,
    }
    expect(describePeriod({ start: '2025-07-01', end: '2025-09-30' }, july, format, messages)).toBe(
      'K1 FY2026',
    )
  })
})

describe('format.businessYear', () => {
  it('is "2026" for a January start and "2025/26" otherwise', () => {
    const format = createFormat('en')
    expect(format.businessYear(2026, 1)).toBe('2026')
    expect(format.businessYear(2025, 7)).toBe('2025/26')
    expect(format.businessYear(2099, 4)).toBe('2099/00')
  })
})
