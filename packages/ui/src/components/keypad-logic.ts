import type { LiroFormat } from '../provider/format'

/*
 * The logic of NumericKeypad, kept apart from the markup so it can be
 * unit-tested. What is being typed is an *entry*: digits and at most one "." in the
 * canonical form ("12.", "0.5"), so a separator just pressed is kept while the value it reports is
 * already a decimal string ("12"). The entry is shown through the provider's `format`, never a
 * JavaScript number.
 */

export type KeypadDigit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
export type KeypadKey = KeypadDigit | 'decimal' | 'backspace' | 'clear' | 'enter'

export const KEYPAD_DIGITS: readonly KeypadDigit[] = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
]

export interface KeypadOptions {
  /** The most decimals that can be typed; 0 has no separator key. Default: no limit. */
  maxDecimals?: number
  /** The most digits in all. Default 12. */
  maxDigits?: number
}

/** The default limit of digits: a till's display, and far below any rounding. */
export const KEYPAD_MAX_DIGITS = 12

function isDigit(key: KeypadKey): key is KeypadDigit {
  return (KEYPAD_DIGITS as readonly string[]).includes(key)
}

/** The entry after a key: digits, the separator, backspace and clear. Enter changes nothing. */
export function keypadInput(entry: string, key: KeypadKey, options: KeypadOptions = {}): string {
  const maxDigits = options.maxDigits ?? KEYPAD_MAX_DIGITS
  const dot = entry.indexOf('.')
  if (isDigit(key)) {
    if (entry.replace('.', '').length >= maxDigits) return entry
    if (dot !== -1 && options.maxDecimals !== undefined) {
      if (entry.length - dot - 1 >= options.maxDecimals) return entry
    }
    // No leading zeros: "0" then "7" is "7".
    if (entry === '0') return key
    return `${entry}${key}`
  }
  switch (key) {
    case 'decimal':
      if (dot !== -1 || options.maxDecimals === 0) return entry
      return entry === '' ? '0.' : `${entry}.`
    case 'backspace':
      return entry.slice(0, -1)
    case 'clear':
      return ''
    case 'enter':
      return entry
  }
}

/** The decimal string an entry stands for: null when empty; "12." is "12". */
export function keypadValue(entry: string): string | null {
  if (entry === '') return null
  return entry.endsWith('.') ? entry.slice(0, -1) : entry
}

/** The entry that shows a value given from outside (a quick amount): a decimal string or "". */
export function entryFromValue(value: string | null): string {
  if (value === null) return ''
  return /^\d+(\.\d+)?$/.test(value) ? value.replace(/^0+(?=\d)/, '') : ''
}

/** The decimal separator of the provider's format ("," for 1.234,56). */
export function decimalSeparator(format: Pick<LiroFormat, 'number'>): string {
  const sample = format.number('1.5')
  return sample.replace(/\d/g, '') || '.'
}

/**
 * The entry as the screen writes numbers: the whole part grouped by `format.number`, then the
 * separator and the decimals as typed (a trailing separator is shown, so the user sees it).
 */
export function keypadText(entry: string, format: Pick<LiroFormat, 'number'>): string {
  if (entry === '') return ''
  const [whole = '', fraction] = entry.split('.')
  const wholeText = format.number(whole === '' ? '0' : whole)
  return fraction === undefined ? wholeText : `${wholeText}${decimalSeparator(format)}${fraction}`
}

/**
 * The key a hardware keyboard press stands for: digits, "." or "," for the separator, Backspace,
 * Delete for clear, Enter. Escape is left to the dialog the keypad may be in.
 */
export function keypadKeyFor(key: string): KeypadKey | null {
  if (/^[0-9]$/.test(key)) return key as KeypadDigit
  switch (key) {
    case '.':
    case ',':
    case 'Decimal':
      return 'decimal'
    case 'Backspace':
      return 'backspace'
    case 'Delete':
      return 'clear'
    case 'Enter':
      return 'enter'
    default:
      return null
  }
}
