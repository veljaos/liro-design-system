/** Separator scheme: 'dot-comma' (1.234,56), 'comma-dot' (1,234.56), 'space-comma', 'space-dot', 'apostrophe-dot'. */
export type NumberScheme =
  'dot-comma' | 'comma-dot' | 'space-comma' | 'space-dot' | 'apostrophe-dot'

export const NUMBER_SCHEMES: readonly NumberScheme[] = [
  'dot-comma',
  'comma-dot',
  'space-comma',
  'space-dot',
  'apostrophe-dot',
]

/** Formatting and parsing of numbers, money and dates (BUILD-PLAN section 5). */
export interface LiroFormat {
  /**
   * value is a decimal string, e.g. "1234.5". Never a JavaScript number. `sign: 'always'` writes
   * "+" before a value above zero (a change on a corrective document, P5.18); default 'auto'.
   */
  number(value: string, options?: { decimals?: number; sign?: 'auto' | 'always' }): string
  money(
    value: string,
    currency: string,
    options?: { decimals?: number; sign?: 'auto' | 'always' },
  ): string
  /**
   * A percentage (P4.7c): `value` is the percentage as a decimal string ("62.4" for 62,4 %), never
   * rounded; the sign, the percent sign and the space between them follow the locale (CLDR):
   * "62,4%" in sr-Latn, "62.4%" in en, "62,4 %" in de. `sign: 'always'` writes "+" for a rise.
   */
  percent(value: string, options?: { decimals?: number; sign?: 'auto' | 'always' }): string
  /** Accepts what people type: "1234.56", "1234,56", "1.234,56", "1,234.56", spaces, apostrophes. Returns a decimal string or null. */
  parseNumber(text: string): string | null
  /** value is YYYY-MM-DD. */
  date(value: string): string
  dateTime(isoInstant: string): string
  /**
   * The clock time of an instant as it is written ("2026-10-06T09:42:00+02:00" → "09:42"): the
   * Core sends instants in the tenant's offset, so the time is the tenant's, beside a day the
   * screen has already named (a notification under "Today"). Unreadable input is returned as is.
   */
  time(isoInstant: string): string
  /** value is YYYY-MM-DD: the weekday and the date in words, e.g. "Monday, 28 September 2026". */
  dateLong(value: string): string
  /** Accepts "010326", "1.3.2026", "01/03/2026" and the locale's own format. Returns YYYY-MM-DD or null. */
  parseDate(text: string): string | null
  /** month is 1 (January) … 12. */
  monthName(month: number, style: 'long' | 'short'): string
  /** weekday is 0 (Sunday) … 6 (Saturday). */
  weekdayName(weekday: number, style: 'long' | 'short' | 'narrow'): string
  /**
   * The name of a business year that starts in `startMonth` (1 … 12) of `startYear`: "2026" when
   * it starts in January, "2025/26" otherwise (owner's decision, 2026-09-28).
   */
  businessYear(startYear: number, startMonth: number): string
  /** Separator scheme: 'dot-comma' (1.234,56), 'comma-dot' (1,234.56), 'space-comma', 'space-dot', 'apostrophe-dot'. */
  numberScheme: NumberScheme
  /** Default number of decimals for money. */
  moneyDecimals: number
}

const NBSP = ' '

const SEPARATORS: Record<NumberScheme, { group: string; decimal: string }> = {
  'dot-comma': { group: '.', decimal: ',' },
  'comma-dot': { group: ',', decimal: '.' },
  'space-comma': { group: NBSP, decimal: ',' },
  'space-dot': { group: NBSP, decimal: '.' },
  'apostrophe-dot': { group: '’', decimal: '.' },
}

const DECIMAL_STRING = /^(-?)(\d+)(?:\.(\d+))?$/

/**
 * Formats a decimal string. Never rounds and never truncates: with more digits than `decimals`
 * all are shown; with fewer, zeros are added. A string that is not a decimal is returned unchanged.
 */
export function formatDecimal(value: string, scheme: NumberScheme, decimals?: number): string {
  const match = DECIMAL_STRING.exec(value)
  if (match === null) {
    return value
  }
  const [, sign = '', integer = '', given = ''] = match
  const fraction =
    decimals !== undefined && given.length < decimals ? given.padEnd(decimals, '0') : given
  const { group, decimal } = SEPARATORS[scheme]
  const grouped = integer.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+$)/g, group)
  return fraction === '' ? `${sign}${grouped}` : `${sign}${grouped}${decimal}${fraction}`
}

/**
 * A "+" before a formatted value above zero when `sign` is 'always' (P5.18: the change column of a
 * corrective document). Zero and negative values, and text that is not a decimal, are unchanged.
 */
export function withSign(value: string, formatted: string, sign?: 'auto' | 'always'): string {
  if (sign !== 'always') return formatted
  const match = DECIMAL_STRING.exec(value)
  if (match === null || match[1] === '-' || !/[1-9]/.test(value)) return formatted
  return `+${formatted}`
}

/** Spaces people group digits with: space, no-break space, thin space, narrow no-break space. */
const SPACES = '    '
/** Apostrophes people group digits with: the straight one and the right single quotation mark. */
const APOSTROPHES = "'’"
const NUMBER_CHARACTERS = new RegExp(`^[\\d.,${SPACES}${APOSTROPHES}]+$`)

/** The kind of a grouping character: every space is one kind, and so is every apostrophe. */
function groupingKind(character: string): string {
  if (SPACES.includes(character)) return 'space'
  if (APOSTROPHES.includes(character)) return 'apostrophe'
  return character
}

/** Groups of three (1,234,567) or Indian 2-2-3 grouping (12,34,567). */
function validGroups(groups: string[]): boolean {
  const [first = '', ...rest] = groups
  const last = rest.at(-1)
  if (last === undefined) return false
  const western = /^\d{1,3}$/.test(first) && rest.every((group) => /^\d{3}$/.test(group))
  const indian =
    /^\d{1,2}$/.test(first) &&
    /^\d{3}$/.test(last) &&
    rest.slice(0, -1).every((group) => /^\d{2}$/.test(group))
  return western || indian
}

/**
 * Reads a number as people type it into a decimal string ("1234.56"), or null when the text is
 * not a number: never 0 for unreadable text (Appendix B.4), and never a JavaScript number.
 *
 * The rule of Appendix B.3: with both '.' and ',' present, the last one is the decimal separator;
 * with one kind present, it is a decimal separator when it appears once and grouping when it
 * repeats. The screen's scheme is consulted only to break a tie the string cannot break itself: a
 * string that is exactly a grouped integer in the scheme's own grouping ("240.000" on a dot-comma
 * screen) is read as grouped. Spaces and apostrophes always group. Groups are of three, or Indian
 * 2-2-3; the decimal part has no grouping.
 */
export function parseDecimal(text: string, scheme: NumberScheme): string | null {
  let rest = text.trim()
  let negative = false
  if (rest.startsWith('-') || rest.startsWith('−')) {
    negative = true
    rest = rest.slice(1)
  } else if (rest.startsWith('+')) {
    rest = rest.slice(1)
  }
  if (!NUMBER_CHARACTERS.test(rest) || !/\d/.test(rest)) {
    return null
  }

  const dots = rest.split('.').length - 1
  const commas = rest.split(',').length - 1
  let decimal: string | null = null
  if (dots > 0 && commas > 0) {
    decimal = rest.lastIndexOf('.') > rest.lastIndexOf(',') ? '.' : ','
  } else if (dots === 1 || commas === 1) {
    const separator = dots === 1 ? '.' : ','
    const groupedInteger = separator === SEPARATORS[scheme].group && /^\d{1,3}[.,]\d{3}$/.test(rest)
    decimal = groupedInteger ? null : separator
  }

  let integer = rest
  let fraction = ''
  if (decimal !== null) {
    const at = rest.lastIndexOf(decimal)
    if (rest.indexOf(decimal) !== at) return null
    integer = rest.slice(0, at)
    fraction = rest.slice(at + 1)
    if (!/^\d*$/.test(fraction)) return null
  }

  // Only separators, spaces and apostrophes remain, all single UTF-16 units: split('') is safe.
  const kinds = new Set(integer.replace(/\d/g, '').split('').map(groupingKind))
  if (kinds.size > 1) return null
  if (kinds.size === 1 && !validGroups(integer.split(/\D/))) return null

  const digits = integer.replace(/\D/g, '').replace(/^0+(?=\d)/, '') || '0'
  const value = fraction === '' ? digits : `${digits}.${fraction}`
  return negative && /[1-9]/.test(value) ? `-${value}` : value
}

/**
 * The locale Intl should use. Serbian without a script is read as Latin (Appendix B.1): Intl
 * reads bare 'sr' and 'sr-RS' as Cyrillic.
 */
export function intlLocale(locale: string): string {
  const parsed = new Intl.Locale(locale)
  if (parsed.language === 'sr' && parsed.script === undefined) {
    return new Intl.Locale('sr', {
      script: 'Latn',
      ...(parsed.region === undefined ? {} : { region: parsed.region }),
    }).toString()
  }
  return locale
}

/*
 * Intl formatters are slow to build and quick to use (P5.20: a list of 5,000 entries asked for
 * the currency's side once per amount). Each is built once per locale and options and kept; what
 * they produce is the same, so the cache changes only the time. Only patterns (separators, the
 * currency's side, the percent sign, dates) come from Intl; amounts stay decimal strings (D4).
 */
const numberFormats = new Map<string, Intl.NumberFormat>()
const dateTimeFormats = new Map<string, Intl.DateTimeFormat>()

/** An Intl.NumberFormat for a locale (already Intl's) and options, built once. */
export function cachedNumberFormat(
  locale: string,
  options: Intl.NumberFormatOptions = {},
): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`
  let formatter = numberFormats.get(key)
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(locale, options)
    numberFormats.set(key, formatter)
  }
  return formatter
}

/** An Intl.DateTimeFormat for a locale (already Intl's) and options, built once. */
export function cachedDateTimeFormat(
  locale: string,
  options: Intl.DateTimeFormatOptions = {},
): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`
  let formatter = dateTimeFormats.get(key)
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat(locale, options)
    dateTimeFormats.set(key, formatter)
  }
  return formatter
}

/** The separator scheme a locale uses, read from Intl. Falls back to 'comma-dot'. */
export function numberSchemeForLocale(locale: string): NumberScheme {
  const parts = cachedNumberFormat(intlLocale(locale)).formatToParts(1234567.5)
  const group = parts.find((part) => part.type === 'group')?.value
  const decimal = parts.find((part) => part.type === 'decimal')?.value
  if (group === undefined || (decimal !== '.' && decimal !== ',')) {
    return 'comma-dot'
  }
  if (/\s/.test(group)) {
    return decimal === ',' ? 'space-comma' : 'space-dot'
  }
  if (group === '.' && decimal === ',') return 'dot-comma'
  if ((group === '’' || group === "'") && decimal === '.') return 'apostrophe-dot'
  return 'comma-dot'
}

const currencySides = new Map<string, boolean>()

/** Whether the locale writes the currency before the amount (asked of Intl once per pair). */
function currencyFirst(locale: string, currency: string): boolean {
  const key = `${locale}|${currency}`
  const known = currencySides.get(key)
  if (known !== undefined) return known
  let first: boolean
  try {
    const types = cachedNumberFormat(intlLocale(locale), {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
    })
      .formatToParts(1)
      .map((part) => part.type)
    first = types.indexOf('currency') < types.indexOf('integer')
  } catch {
    // Not a currency code Intl accepts: write it after the amount.
    first = false
  }
  currencySides.set(key, first)
  return first
}

/**
 * The locale's percent pattern around the number (CLDR, through Intl): what stands before it
 * (the sign, a direction mark) and after it (a space, the percent sign). Only the pattern is taken
 * from Intl; the number itself is formatted from its decimal string.
 */
function percentPattern(locale: string): {
  before: readonly Intl.NumberFormatPart[]
  after: readonly Intl.NumberFormatPart[]
} {
  const parts = cachedNumberFormat(intlLocale(locale), {
    style: 'percent',
    minimumFractionDigits: 1,
  }).formatToParts(-0.015)
  const numeric = new Set(['integer', 'group', 'decimal', 'fraction'])
  const first = parts.findIndex((part) => numeric.has(part.type))
  let last = first
  parts.forEach((part, index) => {
    if (numeric.has(part.type)) last = index
  })
  return { before: parts.slice(0, first), after: parts.slice(last + 1) }
}

/** Days in a month of the Gregorian calendar; month is 1 … 12. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** YYYY-MM-DD for a real date, otherwise null. */
function isoDate(year: number, month: number, day: number): string | null {
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null
  }
  const pad = (value: number, width: number) => String(value).padStart(width, '0')
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`
}

/** A YYYY-MM-DD string as a UTC timestamp, or null when it is not a real date. */
function utcTimestamp(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (match === null) return null
  const [year, month, day] = match.slice(1).map(Number) as [number, number, number]
  return isoDate(year, month, day) === null ? null : Date.UTC(year, month - 1, day)
}

/**
 * Dates are Gregorian and written with Latin digits, like every number: the value is an ISO
 * date, and parseDate must read back what date writes.
 */
const DATE_BASE: Intl.DateTimeFormatOptions = { calendar: 'gregory', numberingSystem: 'latn' }
const NUMERIC_DATE: Intl.DateTimeFormatOptions = {
  ...DATE_BASE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}

/** Bidirectional marks Intl puts into the dates of right-to-left locales. */
const BIDI_MARKS = /[‎‏؜]/g

export type DatePart = 'day' | 'month' | 'year'

/** The order of day, month and year in the locale's numeric dates. */
export function dateFieldOrder(locale: string): DatePart[] {
  return cachedDateTimeFormat(intlLocale(locale), { ...NUMERIC_DATE, timeZone: 'UTC' })
    .formatToParts(Date.UTC(2026, 2, 1))
    .map((part) => part.type)
    .filter((type): type is DatePart => type === 'day' || type === 'month' || type === 'year')
}

/**
 * Reads a date as people type it into YYYY-MM-DD, or null. Accepts ISO dates; digits only
 * ("010326", "01032026"); and three numbers separated by '.', '/', '-' or spaces ("1.3.2026",
 * "01/03/2026", "2026/03/01"), in the locale's order of day, month and year. A two-digit year is
 * in the 2000s.
 */
export function parseDateText(text: string, order: readonly DatePart[]): string | null {
  const cleaned = text.replace(BIDI_MARKS, '').trim().replace(/\.$/, '')
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(cleaned)
  if (iso !== null) {
    const [year, month, day] = iso.slice(1).map(Number) as [number, number, number]
    return isoDate(year, month, day)
  }

  let parts: string[]
  if (/^(?:\d{6}|\d{8})$/.test(cleaned)) {
    const yearLength = cleaned.length === 6 ? 2 : 4
    let at = 0
    parts = order.map((field) => {
      const length = field === 'year' ? yearLength : 2
      const part = cleaned.slice(at, at + length)
      at += length
      return part
    })
  } else {
    parts = cleaned.split(/[./\-\s]+/)
  }
  if (parts.length !== 3 || order.length !== 3) return null

  const fields: Partial<Record<DatePart, string>> = {}
  order.forEach((field, index) => {
    const part = parts[index]
    if (part !== undefined) fields[field] = part
  })
  const { day = '', month = '', year = '' } = fields
  if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^(?:\d{2}|\d{4})$/.test(year)) {
    return null
  }
  const fullYear = year.length === 2 ? 2000 + Number(year) : Number(year)
  return isoDate(fullYear, Number(month), Number(day))
}

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** The first day of the week in a locale: 0 = Sunday … 6 = Saturday; Monday when Intl cannot tell. */
export function weekStartsOnForLocale(locale: string): Weekday {
  // Week information: getWeekInfo() in current engines, the weekInfo getter in older ones.
  const parsed = new Intl.Locale(intlLocale(locale)) as Intl.Locale & {
    getWeekInfo?: () => { firstDay: number }
    weekInfo?: { firstDay: number }
  }
  const firstDay = parsed.getWeekInfo?.().firstDay ?? parsed.weekInfo?.firstDay
  if (firstDay === undefined || !Number.isInteger(firstDay) || firstDay < 1 || firstDay > 7) {
    return 1
  }
  return (firstDay % 7) as Weekday
}

/** The default format for a locale; `overrides` replace any member. */
export function createFormat(locale: string, overrides: Partial<LiroFormat> = {}): LiroFormat {
  const intl = intlLocale(locale)
  const dateFormat = cachedDateTimeFormat(intl, { ...NUMERIC_DATE, timeZone: 'UTC' })
  // An instant is shown in the time zone of the device.
  const dateTimeFormat = cachedDateTimeFormat(intl, {
    ...NUMERIC_DATE,
    hour: '2-digit',
    minute: '2-digit',
  })
  // A clock time as written in an instant (`time`): read in UTC, so it is never shifted.
  const timeFormat = cachedDateTimeFormat(intl, {
    ...DATE_BASE,
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
  // The weekday and the date in words, as DateText's tooltip shows it.
  const longDateFormat = cachedDateTimeFormat(intl, {
    ...DATE_BASE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const order = dateFieldOrder(locale)
  const percentParts = percentPattern(locale)

  const format: LiroFormat = {
    numberScheme: numberSchemeForLocale(locale),
    moneyDecimals: 2,
    number(value, options) {
      return withSign(
        value,
        formatDecimal(value, format.numberScheme, options?.decimals),
        options?.sign,
      )
    },
    money(value, currency, options) {
      const amount = withSign(
        value,
        formatDecimal(value, format.numberScheme, options?.decimals ?? format.moneyDecimals),
        options?.sign,
      )
      // Amount and currency are joined by a non-breaking space, so they never wrap apart.
      return currencyFirst(locale, currency)
        ? `${currency}${NBSP}${amount}`
        : `${amount}${NBSP}${currency}`
    },
    percent(value, options) {
      const unsigned = value.replace(/^[-+]/, '')
      if (!DECIMAL_STRING.test(unsigned)) return value
      const negative = value.startsWith('-') && /[1-9]/.test(unsigned)
      const sign = negative ? '-' : options?.sign === 'always' && /[1-9]/.test(unsigned) ? '+' : ''
      const number = formatDecimal(unsigned, format.numberScheme, options?.decimals)
      const before = percentParts.before
        .map((part) => (part.type === 'minusSign' || part.type === 'plusSign' ? sign : part.value))
        .join('')
      const signed = percentParts.before.some((part) => part.type === 'minusSign')
        ? before
        : `${sign}${before}`
      return `${signed}${number}${percentParts.after.map((part) => part.value).join('')}`
    },
    parseNumber(text) {
      return parseDecimal(text, format.numberScheme)
    },
    date(value) {
      const timestamp = utcTimestamp(value)
      return timestamp === null ? value : dateFormat.format(timestamp)
    },
    dateTime(isoInstant) {
      const timestamp = Date.parse(isoInstant)
      return Number.isNaN(timestamp) ? isoInstant : dateTimeFormat.format(timestamp)
    },
    time(isoInstant) {
      const clock = /T(\d{2}):(\d{2})/.exec(isoInstant)
      if (clock === null) return isoInstant
      return timeFormat.format(Date.UTC(2000, 0, 1, Number(clock[1]), Number(clock[2])))
    },
    dateLong(value) {
      const timestamp = utcTimestamp(value)
      return timestamp === null ? value : longDateFormat.format(timestamp)
    },
    parseDate(text) {
      return parseDateText(text, order)
    },
    businessYear(startYear, startMonth) {
      if (startMonth === 1) return String(startYear)
      return `${String(startYear)}/${String((startYear + 1) % 100).padStart(2, '0')}`
    },
    monthName(month, style) {
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new RangeError(`month must be 1 … 12, got ${String(month)}`)
      }
      return cachedDateTimeFormat(intl, { ...DATE_BASE, month: style, timeZone: 'UTC' }).format(
        Date.UTC(2026, month - 1, 1),
      )
    },
    weekdayName(weekday, style) {
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
        throw new RangeError(`weekday must be 0 … 6, got ${String(weekday)}`)
      }
      // 1 January 2023 was a Sunday.
      return cachedDateTimeFormat(intl, {
        ...DATE_BASE,
        weekday: style,
        timeZone: 'UTC',
      }).format(Date.UTC(2023, 0, 1 + weekday))
    },
    ...overrides,
  }
  return format
}
