import { describe, expect, it } from 'vitest'
import { isTimeValue, parseTimeText } from './time-logic'

describe('parseTimeText: quick entry of a time of day', () => {
  it.each([
    ['630', '06:30'],
    ['0630', '06:30'],
    ['6:30', '06:30'],
    ['06:30', '06:30'],
    ['6.30', '06:30'],
    ['6,30', '06:30'],
    ['6 30', '06:30'],
    ['06h30', '06:30'],
    ['1430', '14:30'],
    ['14:30', '14:30'],
    ['7', '07:00'],
    ['23', '23:00'],
    ['0', '00:00'],
    ['0000', '00:00'],
    [' 2359 ', '23:59'],
    ['6:30:00', '06:30'],
    ['6:30 pm', '18:30'],
    ['6:30PM', '18:30'],
    ['12 am', '00:00'],
    ['12:15 p.m.', '12:15'],
    ['630a', '06:30'],
    ['٦:٣٠', '06:30'],
    ['۱۴۳۰', '14:30'],
  ])('reads %j as %s', (text, expected) => {
    expect(parseTimeText(text)).toBe(expected)
  })

  it.each([
    ['630', '06:30:00'],
    ['6:30', '06:30:00'],
    ['1430', '14:30:00'],
    ['63015', '06:30:15'],
    ['143015', '14:30:15'],
    ['6:30:15', '06:30:15'],
    ['7', '07:00:00'],
  ])('with seconds reads %j as %s', (text, expected) => {
    expect(parseTimeText(text, { seconds: true })).toBe(expected)
  })

  it.each(['', '  ', '2400', '24:00', '7:60', '760', '7:3', 'seven', '1234567', '13 pm', '0 am'])(
    'gives null for %j, never midnight',
    (text) => {
      expect(parseTimeText(text)).toBeNull()
    },
  )

  it('does not drop seconds silently in a field without them', () => {
    expect(parseTimeText('6:30:15')).toBeNull()
    expect(parseTimeText('63015')).toBeNull()
    expect(parseTimeText('6:30:60', { seconds: true })).toBeNull()
  })

  it('reads back every value it gives', () => {
    for (const value of ['00:00', '06:30', '14:30', '23:59']) {
      expect(parseTimeText(value)).toBe(value)
      expect(isTimeValue(value)).toBe(true)
    }
    expect(parseTimeText('06:30:15', { seconds: true })).toBe('06:30:15')
    expect(isTimeValue('06:30:15', { seconds: true })).toBe(true)
    expect(isTimeValue('6:30')).toBe(false)
    expect(isTimeValue('06:30', { seconds: true })).toBe(false)
  })
})
