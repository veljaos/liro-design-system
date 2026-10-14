import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { messagesEn } from '../provider/messages.en'
import {
  durationParts,
  millisecondsBetween,
  slaReading,
  slaUrgency,
  type SlaReading,
} from './sla-logic'
import { durationText, slaText } from './sla-timer'

const NOW = '2026-10-14T09:40:00+02:00'

describe('millisecondsBetween', () => {
  it('counts across offsets', () => {
    expect(millisecondsBetween('2026-10-14T09:40:00+02:00', '2026-10-14T07:50:00Z')).toBe(
      10 * 60_000,
    )
  })
  it('is null for unreadable instants', () => {
    expect(millisecondsBetween('yesterday', NOW)).toBeNull()
    expect(millisecondsBetween(NOW, '2026-10-14')).toBeNull()
    expect(millisecondsBetween(NOW, '2026-13-45T99:00')).toBeNull()
  })
})

describe('slaReading', () => {
  it('counts the minutes left, rounded up', () => {
    expect(slaReading('2026-10-14T11:55:00+02:00', NOW)).toEqual({
      state: 'running',
      minutes: 135,
    })
    expect(slaReading('2026-10-14T09:40:30+02:00', NOW)).toEqual({ state: 'running', minutes: 1 })
  })
  it('is soon within warnWithin', () => {
    expect(slaReading('2026-10-14T10:05:00+02:00', NOW, { warnWithin: 30 })).toEqual({
      state: 'soon',
      minutes: 25,
    })
    expect(slaReading('2026-10-14T10:15:00+02:00', NOW, { warnWithin: 30 })?.state).toBe('running')
  })
  it('counts the minutes late, rounded down', () => {
    expect(slaReading('2026-10-14T09:00:00+02:00', NOW)).toEqual({ state: 'overdue', minutes: 40 })
    expect(slaReading(NOW, NOW)).toEqual({ state: 'overdue', minutes: 0 })
    expect(slaReading('2026-10-14T09:39:30+02:00', NOW)).toEqual({ state: 'overdue', minutes: 0 })
  })
  it('pauses, whatever the time', () => {
    expect(slaReading('2026-10-14T09:00:00+02:00', NOW, { paused: true })).toEqual({
      state: 'paused',
      minutes: 0,
    })
  })
  it('reads a done deadline as met or missed, before paused', () => {
    expect(
      slaReading('2026-10-14T09:00:00+02:00', NOW, {
        completedAt: '2026-10-14T08:59:00+02:00',
        paused: true,
      }),
    ).toEqual({ state: 'met', minutes: 0 })
    expect(
      slaReading('2026-10-14T09:00:00+02:00', NOW, { completedAt: '2026-10-14T09:25:40+02:00' }),
    ).toEqual({ state: 'missed', minutes: 25 })
  })
  it('is null when an instant cannot be read', () => {
    expect(slaReading('', NOW)).toBeNull()
    expect(slaReading(NOW, 'now')).toBeNull()
    expect(slaReading(NOW, NOW, { completedAt: 'later' })).toBeNull()
  })
})

describe('durationParts', () => {
  it('keeps minutes under an hour, hours and minutes under a day, days and hours after', () => {
    expect(durationParts(40)).toEqual({ days: 0, hours: 0, minutes: 40 })
    expect(durationParts(135)).toEqual({ days: 0, hours: 2, minutes: 15 })
    expect(durationParts(120)).toEqual({ days: 0, hours: 2, minutes: 0 })
    expect(durationParts(1440 + 180 + 59)).toEqual({ days: 1, hours: 3, minutes: 0 })
    expect(durationParts(-5)).toEqual({ days: 0, hours: 0, minutes: 0 })
  })
})

describe('the words', () => {
  const format = createFormat('sr-Latn-RS')
  const words = (reading: SlaReading) => slaText(reading, messagesEn, format)
  it('writes durations', () => {
    expect(durationText(40, messagesEn, format)).toBe('40 min')
    expect(durationText(135, messagesEn, format)).toBe('2 h 15 min')
    expect(durationText(120, messagesEn, format)).toBe('2 h')
    expect(durationText(1440 * 2 + 60, messagesEn, format)).toBe('2 d 1 h')
    expect(durationText(1440, messagesEn, format)).toBe('1 d')
    expect(durationText(0, messagesEn, format)).toBe('0 min')
  })
  it('writes every state', () => {
    expect(words({ state: 'running', minutes: 135 })).toBe('Due in 2 h 15 min')
    expect(words({ state: 'soon', minutes: 25 })).toBe('Due in 25 min')
    expect(words({ state: 'overdue', minutes: 40 })).toBe('Overdue by 40 min')
    expect(words({ state: 'overdue', minutes: 0 })).toBe('Overdue')
    expect(words({ state: 'paused', minutes: 0 })).toBe('Paused')
    expect(words({ state: 'met', minutes: 0 })).toBe('Met')
    expect(words({ state: 'missed', minutes: 25 })).toBe('Missed by 25 min')
  })
  it('writes the numbers through the format', () => {
    expect(durationText(1440 * 1200, messagesEn, format)).toBe('1.200 d')
  })
})

describe('slaUrgency', () => {
  it('orders overdue first (longest first), then the soonest, then paused and done', () => {
    const readings: (SlaReading | null)[] = [
      { state: 'running', minutes: 300 },
      null,
      { state: 'met', minutes: 0 },
      { state: 'overdue', minutes: 5 },
      { state: 'paused', minutes: 0 },
      { state: 'soon', minutes: 20 },
      { state: 'overdue', minutes: 90 },
    ]
    const ordered = [...readings].sort((a, b) => slaUrgency(a) - slaUrgency(b))
    expect(ordered.map((reading) => reading?.state ?? null)).toEqual([
      'overdue',
      'overdue',
      'soon',
      'running',
      'paused',
      'met',
      null,
    ])
    expect(ordered[0]?.minutes).toBe(90)
  })
})
