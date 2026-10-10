import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import {
  decimalSeparator,
  entryFromValue,
  keypadInput,
  keypadKeyFor,
  keypadText,
  keypadValue,
  type KeypadKey,
} from './keypad-logic'
import {
  canStep,
  compareDecimal,
  isDecimal,
  quantityRange,
  stepDecimal,
  stepQuantity,
} from './quantity-logic'
import { EMPTY_SCAN_BUFFER, scanDecision, scanKey, type ScanBuffer } from './scan-logic'
import { pickProgress, pickStepState } from './warehouse-logic'

/** The entry after pressing these keys from empty. */
function typed(keys: readonly KeypadKey[], options = {}): string {
  return keys.reduce((entry, key) => keypadInput(entry, key, options), '')
}

describe('keypadInput', () => {
  it('appends digits without leading zeros', () => {
    expect(typed(['0', '0', '7'])).toBe('7')
    expect(typed(['1', '2', '0', '0'])).toBe('1200')
  })

  it('takes one separator, starting "0." when empty', () => {
    expect(typed(['decimal', '5'])).toBe('0.5')
    expect(typed(['1', 'decimal', 'decimal', '2', 'decimal'])).toBe('1.2')
  })

  it('stops more decimals than allowed instead of rounding', () => {
    expect(typed(['1', 'decimal', '2', '3', '4'], { maxDecimals: 2 })).toBe('1.23')
    expect(typed(['1', 'decimal', '5'], { maxDecimals: 0 })).toBe('15')
  })

  it('stops at the most digits', () => {
    expect(typed(['9', '9', '9', '9'], { maxDigits: 3 })).toBe('999')
    expect(typed(['9', 'decimal', '9', '9'], { maxDigits: 2 })).toBe('9.9')
  })

  it('erases the last character, clears, and leaves Enter alone', () => {
    expect(typed(['1', '2', 'decimal', 'backspace'])).toBe('12')
    expect(typed(['1', '2', 'backspace', 'backspace', 'backspace'])).toBe('')
    expect(typed(['4', '5', 'clear'])).toBe('')
    expect(typed(['4', '5', 'enter'])).toBe('45')
  })
})

describe('keypadValue and entryFromValue', () => {
  it('reports a decimal string, or null when empty', () => {
    expect(keypadValue('')).toBeNull()
    expect(keypadValue('12.')).toBe('12')
    expect(keypadValue('0.50')).toBe('0.50')
  })

  it('takes a value from outside as typed text, ignoring what a keypad cannot show', () => {
    expect(entryFromValue('2000')).toBe('2000')
    expect(entryFromValue('0012.5')).toBe('12.5')
    expect(entryFromValue(null)).toBe('')
    expect(entryFromValue('-5')).toBe('')
    expect(entryFromValue('abc')).toBe('')
  })
})

describe('keypadText', () => {
  const serbian = createFormat('sr-Latn-RS')
  const english = createFormat('en')

  it('groups the whole part and keeps the separator and decimals as typed', () => {
    expect(keypadText('1234.5', serbian)).toBe('1.234,5')
    expect(keypadText('1234.', serbian)).toBe('1.234,')
    expect(keypadText('0.05', english)).toBe('0.05')
    expect(keypadText('', english)).toBe('')
  })

  it('finds the separator of the format', () => {
    expect(decimalSeparator(serbian)).toBe(',')
    expect(decimalSeparator(english)).toBe('.')
  })
})

describe('keypadKeyFor', () => {
  it('maps the hardware keys', () => {
    expect(keypadKeyFor('7')).toBe('7')
    expect(keypadKeyFor(',')).toBe('decimal')
    expect(keypadKeyFor('.')).toBe('decimal')
    expect(keypadKeyFor('Backspace')).toBe('backspace')
    expect(keypadKeyFor('Delete')).toBe('clear')
    expect(keypadKeyFor('Enter')).toBe('enter')
  })

  it('leaves Escape and letters to others', () => {
    expect(keypadKeyFor('Escape')).toBeNull()
    expect(keypadKeyFor('a')).toBeNull()
    expect(keypadKeyFor('F5')).toBeNull()
  })
})

describe('compareDecimal', () => {
  it('compares exactly, whatever the decimals', () => {
    expect(compareDecimal('1.50', '1.5')).toBe(0)
    expect(compareDecimal('0.3', '0.29999999999999999')).toBe(1)
    expect(compareDecimal('-2', '1')).toBe(-1)
    expect(compareDecimal('10', '9.999')).toBe(1)
    expect(compareDecimal('12345678901234567890', '12345678901234567891')).toBe(-1)
  })

  it('refuses text that is not a decimal', () => {
    expect(isDecimal('1,5')).toBe(false)
    expect(() => compareDecimal('1,5', '1')).toThrow()
  })
})

describe('stepDecimal', () => {
  it('adds and subtracts exactly, keeping the decimals', () => {
    expect(stepDecimal('0.1', '0.2', 1)).toBe('0.3')
    expect(stepDecimal('1.50', '1', 1)).toBe('2.50')
    expect(stepDecimal('0', '0.25', -1)).toBe('-0.25')
    expect(stepDecimal('1', '1', -1)).toBe('0')
    expect(stepDecimal('0.001', '0.001', -1)).toBe('0.000')
  })
})

describe('stepQuantity', () => {
  it('steps within the limits', () => {
    expect(stepQuantity('3', 1, { max: '4' })).toBe('4')
    expect(stepQuantity('4', 1, { max: '4' })).toBe('4')
    expect(stepQuantity('1', -1, { min: '1' })).toBe('1')
    expect(stepQuantity('2.5', 1, { step: '0.5' })).toBe('3.0')
  })

  it('starts an empty value from the least, else one step from zero', () => {
    expect(stepQuantity(null, 1, { min: '1' })).toBe('1')
    expect(stepQuantity(null, 1)).toBe('1')
    expect(stepQuantity(null, -1, { min: '0' })).toBe('0')
  })

  it('brings a value outside the limits to the nearer limit', () => {
    expect(stepQuantity('20', -1, { max: '12' })).toBe('12')
    expect(stepQuantity('-3', 1, { min: '0' })).toBe('0')
  })

  it('knows when a step can still change the value', () => {
    expect(canStep('4', 1, { max: '4' })).toBe(false)
    expect(canStep('4', -1, { max: '4' })).toBe(true)
    expect(canStep('0', -1, { min: '0' })).toBe(false)
    expect(canStep(null, -1, { min: '0' })).toBe(true)
  })

  it('places a value against its limits', () => {
    expect(quantityRange('0', '1', '10')).toBe('below')
    expect(quantityRange('10.5', '1', '10')).toBe('above')
    expect(quantityRange('10.0', '1', '10')).toBeNull()
    expect(quantityRange(null, '1', '10')).toBeNull()
  })
})

/** The buffer and codes after these keys at these times. */
function keys(events: readonly (readonly [string, number])[]): {
  buffer: ScanBuffer
  codes: string[]
} {
  let buffer = EMPTY_SCAN_BUFFER
  const codes: string[] = []
  for (const [key, time] of events) {
    const result = scanKey(buffer, key, time)
    buffer = result.buffer
    if (result.code !== null) codes.push(result.code)
  }
  return { buffer, codes }
}

describe('scanDecision', () => {
  it('reads a fast burst of enough characters as a scan', () => {
    expect(scanDecision([0, 8, 16, 25, 33, 41, 50, 58])).toBe('scan')
  })

  it('reads slow, short or uneven input as typing', () => {
    expect(scanDecision([0, 120, 260, 390, 510])).toBe('typing')
    expect(scanDecision([0, 8, 16])).toBe('typing')
    expect(scanDecision([0, 8, 16, 200, 208])).toBe('typing')
  })

  it('takes other limits', () => {
    expect(scanDecision([0, 80, 160, 240], { maxInterval: 100 })).toBe('scan')
    expect(scanDecision([0, 8], { minLength: 2 })).toBe('scan')
  })
})

describe('scanKey', () => {
  it('gives the code of a burst ended by Enter', () => {
    const burst = Array.from('8600123456789', (key) => key).map(
      (key, index) => [key, 1000 + index * 10] as const,
    )
    expect(keys([...burst, ['Enter', 1140]]).codes).toEqual(['8600123456789'])
  })

  it('ignores Shift between capitals, and starts again after a pause', () => {
    const result = keys([
      ['x', 0],
      ['Shift', 400],
      ['A', 410],
      ['Shift', 412],
      ['B', 420],
      ['1', 430],
      ['2', 440],
      ['Enter', 450],
    ])
    expect(result.codes).toEqual(['AB12'])
  })

  it('gives nothing for typing ended by Enter, and empties the buffer', () => {
    const result = keys([
      ['1', 0],
      ['2', 150],
      ['3', 300],
      ['4', 450],
      ['Enter', 600],
    ])
    expect(result.codes).toEqual([])
    expect(result.buffer).toEqual(EMPTY_SCAN_BUFFER)
  })
})

describe('pickProgress and pickStepState', () => {
  it('counts the lines done of all', () => {
    expect(
      pickProgress([
        { state: 'picked' },
        { state: 'open' },
        { state: 'short' },
        { state: 'skipped' },
      ]),
    ).toEqual({ done: 3, total: 4 })
    expect(pickProgress([])).toEqual({ done: 0, total: 0 })
  })

  it('places each step against the current one', () => {
    expect(pickStepState('location', 'item')).toBe('done')
    expect(pickStepState('item', 'item')).toBe('current')
    expect(pickStepState('quantity', 'item')).toBe('todo')
  })
})
