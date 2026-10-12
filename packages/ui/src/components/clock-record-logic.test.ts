import { describe, expect, it } from 'vitest'
import { clockTimeOf, onLaterDay, parseClockTime } from './clock-record-logic'

describe('parseClockTime', () => {
  it('reads the ways a time is typed', () => {
    expect(parseClockTime('7:30')).toBe('07:30')
    expect(parseClockTime('07.30')).toBe('07:30')
    expect(parseClockTime(' 0730 ')).toBe('07:30')
    expect(parseClockTime('730')).toBe('07:30')
    expect(parseClockTime('7')).toBe('07:00')
    expect(parseClockTime('22h05')).toBe('22:05')
    expect(parseClockTime('00:00')).toBe('00:00')
  })
  it('returns null for what is not a time of day, never midnight', () => {
    expect(parseClockTime('')).toBeNull()
    expect(parseClockTime('24:00')).toBeNull()
    expect(parseClockTime('7:60')).toBeNull()
    expect(parseClockTime('seven')).toBeNull()
    expect(parseClockTime('7:3')).toBeNull()
  })
})

describe('clock times of instants', () => {
  it('takes the clock time as written', () => {
    expect(clockTimeOf('2026-10-06T06:58:00+02:00')).toBe('06:58')
    expect(clockTimeOf(null)).toBeNull()
    expect(clockTimeOf('nonsense')).toBeNull()
  })
  it('tells a clock-out after midnight', () => {
    expect(onLaterDay('2026-10-06', '2026-10-07T06:02:00+02:00')).toBe(true)
    expect(onLaterDay('2026-10-06', '2026-10-06T14:02:00+02:00')).toBe(false)
    expect(onLaterDay('2026-10-06', null)).toBe(false)
  })
})
