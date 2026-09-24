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

/**
 * Formatting of numbers and money. P0.3 covers what the Storybook toolbar needs;
 * P1.5 adds parsing and dates (BUILD-PLAN section 5).
 */
export interface LiroFormat {
  /** value is a decimal string, e.g. "1234.5". Never a JavaScript number. */
  number(value: string, options?: { decimals?: number }): string
  money(value: string, currency: string, options?: { decimals?: number }): string
  numberScheme: NumberScheme
  /** Default number of decimals for money. */
  moneyDecimals: number
}

const NBSP = '\u00A0'

const SEPARATORS: Record<NumberScheme, { group: string; decimal: string }> = {
  'dot-comma': { group: '.', decimal: ',' },
  'comma-dot': { group: ',', decimal: '.' },
  'space-comma': { group: NBSP, decimal: ',' },
  'space-dot': { group: NBSP, decimal: '.' },
  'apostrophe-dot': { group: '\u2019', decimal: '.' },
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

/** The separator scheme a locale uses, read from Intl. Falls back to 'comma-dot'. */
export function numberSchemeForLocale(locale: string): NumberScheme {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234567.5)
  const group = parts.find((part) => part.type === 'group')?.value
  const decimal = parts.find((part) => part.type === 'decimal')?.value
  if (group === undefined || (decimal !== '.' && decimal !== ',')) {
    return 'comma-dot'
  }
  if (/\s/.test(group)) {
    return decimal === ',' ? 'space-comma' : 'space-dot'
  }
  if (group === '.' && decimal === ',') return 'dot-comma'
  if ((group === '\u2019' || group === "'") && decimal === '.') return 'apostrophe-dot'
  return 'comma-dot'
}

/** Whether the locale writes the currency before the amount. */
function currencyFirst(locale: string, currency: string): boolean {
  try {
    const types = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
    })
      .formatToParts(1)
      .map((part) => part.type)
    return types.indexOf('currency') < types.indexOf('integer')
  } catch {
    // Not a currency code Intl accepts: write it after the amount.
    return false
  }
}

/** The default format for a locale; `overrides` replace any member. */
export function createFormat(locale: string, overrides: Partial<LiroFormat> = {}): LiroFormat {
  const format: LiroFormat = {
    numberScheme: numberSchemeForLocale(locale),
    moneyDecimals: 2,
    number(value, options) {
      return formatDecimal(value, format.numberScheme, options?.decimals)
    },
    money(value, currency, options) {
      const amount = formatDecimal(
        value,
        format.numberScheme,
        options?.decimals ?? format.moneyDecimals,
      )
      // Amount and currency are joined by a non-breaking space, so they never wrap apart.
      return currencyFirst(locale, currency)
        ? `${currency}${NBSP}${amount}`
        : `${amount}${NBSP}${currency}`
    },
    ...overrides,
  }
  return format
}
