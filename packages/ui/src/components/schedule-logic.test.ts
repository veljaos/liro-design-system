import { describe, expect, it } from 'vitest'
import {
  absoluteMinutes,
  addDays,
  addMonths,
  axisMinutes,
  axisMoment,
  byStart,
  calendarKeyTarget,
  cellEvents,
  clockOf,
  currentPeriod,
  dropPlace,
  fitOnAxis,
  groupSlots,
  initialTimetableDay,
  layoutDay,
  localDateTime,
  localOfAbsolute,
  minutesOf,
  monthWeeks,
  onDay,
  periodDays,
  readMoment,
  scheduleKeyTarget,
  shiftPeriod,
  slotKey,
  slotsPerDay,
  spanOf,
  startOfWeek,
  unavailableReason,
  weekDays,
  weekdayOf,
  withinDay,
  type ScheduleAxis,
} from './schedule-logic'

const ZONE = 'Europe/Belgrade'

describe('days', () => {
  it('adds days across months and years', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('knows the weekday', () => {
    expect(weekdayOf('2026-10-12')).toBe(1)
    expect(weekdayOf('2026-10-11')).toBe(0)
  })

  it('starts the week on the provider’s day', () => {
    expect(startOfWeek('2026-10-14', 1)).toBe('2026-10-12')
    expect(startOfWeek('2026-10-14', 0)).toBe('2026-10-11')
    expect(startOfWeek('2026-10-12', 1)).toBe('2026-10-12')
    expect(startOfWeek('2026-10-17', 6)).toBe('2026-10-17')
    expect(weekDays('2026-10-14', 1)).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ])
  })

  it('adds months, keeping the day where the month has it', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15')
  })

  it('covers a month with whole weeks', () => {
    const weeks = monthWeeks('2026-10-20', 1)
    expect(weeks).toHaveLength(5)
    expect(weeks[0]?.[0]).toBe('2026-09-28')
    expect(weeks.at(-1)?.[6]).toBe('2026-11-01')
    // February 2027 starts on a Monday and has exactly four weeks.
    expect(monthWeeks('2027-02-10', 1)).toHaveLength(4)
    // With Sunday first, October 2026 starts on 27 September.
    expect(monthWeeks('2026-10-01', 0)[0]?.[0]).toBe('2026-09-27')
  })

  it('knows the days of each view and moves by its period', () => {
    expect(periodDays('day', '2026-10-14', 1)).toEqual(['2026-10-14'])
    expect(periodDays('week', '2026-10-14', 1)).toHaveLength(7)
    expect(periodDays('agenda', '2026-10-14', 1)[0]).toBe('2026-10-12')
    expect(periodDays('month', '2026-10-14', 1)).toHaveLength(35)
    expect(shiftPeriod('day', '2026-10-14', 1)).toBe('2026-10-15')
    expect(shiftPeriod('week', '2026-10-14', -1)).toBe('2026-10-07')
    expect(shiftPeriod('agenda', '2026-10-14', 1)).toBe('2026-10-21')
    expect(shiftPeriod('month', '2026-10-31', 1)).toBe('2026-11-30')
  })
})

describe('times', () => {
  it('reads and writes clock times', () => {
    expect(minutesOf('09:30')).toBe(570)
    expect(minutesOf('24:00')).toBe(1440)
    expect(minutesOf('24:30')).toBeNull()
    expect(minutesOf('9:30')).toBeNull()
    expect(clockOf(570)).toBe('09:30')
    expect(localDateTime('2026-10-12', 1500)).toBe('2026-10-13T01:00')
  })

  it('reads days, local times and instants in the provider’s zone', () => {
    expect(readMoment('2026-10-12', ZONE)).toEqual({ day: '2026-10-12', minutes: null })
    expect(readMoment('2026-10-12T09:30', 'Asia/Tokyo')).toEqual({
      day: '2026-10-12',
      minutes: 570,
    })
    expect(readMoment('2026-10-12T07:30:00Z', ZONE)).toEqual({ day: '2026-10-12', minutes: 570 })
    expect(readMoment('2026-10-12T07:30:00Z', 'Asia/Tokyo')).toEqual({
      day: '2026-10-12',
      minutes: 990,
    })
    expect(readMoment('soon', ZONE)).toBeNull()
  })

  it('makes spans: all-day events cover their last day, an end before the start is the start', () => {
    const allDay = spanOf({ start: '2026-10-12', end: '2026-10-13' }, ZONE)
    expect(allDay?.allDay).toBe(true)
    expect(allDay !== null && allDay.end - allDay.start).toBe(2 * 1440)
    expect(spanOf({ start: '2026-10-12' }, ZONE)).toMatchObject({ allDay: true })
    const timed = spanOf({ start: '2026-10-12T09:00', end: '2026-10-12T08:00' }, ZONE)
    expect(timed !== null && timed.end === timed.start).toBe(true)
    expect(spanOf({ start: 'x' }, ZONE)).toBeNull()
  })

  it('knows which days a span touches, and its minutes within each', () => {
    const night = spanOf({ start: '2026-10-12T22:00', end: '2026-10-13T02:00' }, ZONE)
    if (night === null) throw new Error('unreadable')
    expect(onDay(night, '2026-10-12')).toBe(true)
    expect(onDay(night, '2026-10-13')).toBe(true)
    expect(onDay(night, '2026-10-14')).toBe(false)
    expect(withinDay(night, '2026-10-12')).toEqual({ start: 1320, end: 1440 })
    expect(withinDay(night, '2026-10-13')).toEqual({ start: 0, end: 120 })
    const moment = spanOf({ start: '2026-10-12T00:00' }, ZONE)
    if (moment === null) throw new Error('unreadable')
    expect(onDay(moment, '2026-10-12')).toBe(true)
    expect(onDay(moment, '2026-10-11')).toBe(false)
  })

  it('orders all-day first, then by start, longer first', () => {
    const items = [
      { id: 'b', span: { allDay: false, start: 600, end: 630 } },
      { id: 'c', span: { allDay: false, start: 600, end: 700 } },
      { id: 'a', span: { allDay: true, start: 0, end: 1440 } },
    ]
    expect(byStart(items).map((item) => item.id)).toEqual(['a', 'c', 'b'])
  })
})

describe('layoutDay', () => {
  it('puts overlapping events side by side and lone events full width', () => {
    const { placed } = layoutDay(
      [
        { id: 'a', start: 540, end: 600 },
        { id: 'b', start: 570, end: 630 },
        { id: 'c', start: 600, end: 660 },
        { id: 'd', start: 720, end: 750 },
      ],
      480,
      1080,
      30,
    )
    const byId = Object.fromEntries(placed.map((each) => [each.id, each]))
    expect(byId.a).toMatchObject({ top: 60, height: 60, column: 0, columns: 2 })
    expect(byId.b).toMatchObject({ column: 1, columns: 2 })
    // c starts when a ends: it reuses a's column, in the same group.
    expect(byId.c).toMatchObject({ column: 0, columns: 2 })
    expect(byId.d).toMatchObject({ column: 0, columns: 1 })
  })

  it('places short events by their drawn length, and clips to the window', () => {
    const { placed, outside } = layoutDay(
      [
        { id: 'short', start: 540, end: 545 },
        { id: 'next', start: 550, end: 600 },
        { id: 'early', start: 420, end: 510 },
        { id: 'night', start: 1200, end: 1260 },
      ],
      480,
      1080,
      30,
    )
    const byId = Object.fromEntries(placed.map((each) => [each.id, each]))
    expect(byId.short).toMatchObject({ height: 30, column: 0, columns: 2 })
    expect(byId.next).toMatchObject({ column: 1 })
    expect(byId.early).toMatchObject({ top: 0, height: 30 })
    expect(outside).toEqual(['night'])
  })
})

describe('cellEvents', () => {
  it('shows all that fit, else max − 1 and "+N more"', () => {
    expect(cellEvents([1, 2, 3], 3)).toEqual({ shown: [1, 2, 3], more: 0 })
    expect(cellEvents([1, 2, 3, 4, 5], 3)).toEqual({ shown: [1, 2], more: 3 })
  })
})

describe('calendarKeyTarget', () => {
  const month = { view: 'month', direction: 'ltr', weekStartsOn: 1, slots: 0 } as const
  it('moves between days from the leading edge', () => {
    const cell = { day: '2026-10-14', slot: 0 }
    expect(calendarKeyTarget('ArrowRight', cell, month)?.day).toBe('2026-10-15')
    expect(calendarKeyTarget('ArrowRight', cell, { ...month, direction: 'rtl' })?.day).toBe(
      '2026-10-13',
    )
    expect(calendarKeyTarget('ArrowLeft', cell, { ...month, direction: 'rtl' })?.day).toBe(
      '2026-10-15',
    )
    expect(calendarKeyTarget('ArrowDown', cell, month)?.day).toBe('2026-10-21')
    expect(calendarKeyTarget('Home', cell, month)?.day).toBe('2026-10-12')
    expect(calendarKeyTarget('End', cell, month)?.day).toBe('2026-10-18')
    expect(calendarKeyTarget('PageDown', cell, month)?.day).toBe('2026-11-14')
    expect(calendarKeyTarget('a', cell, month)).toBeNull()
  })

  it('moves between slots in the day and week views, within the column', () => {
    const week = { view: 'week', direction: 'ltr', weekStartsOn: 1, slots: 26 } as const
    expect(calendarKeyTarget('ArrowDown', { day: '2026-10-14', slot: 3 }, week)).toEqual({
      day: '2026-10-14',
      slot: 4,
    })
    expect(calendarKeyTarget('ArrowUp', { day: '2026-10-14', slot: 0 }, week)?.slot).toBe(0)
    expect(calendarKeyTarget('ArrowDown', { day: '2026-10-14', slot: 25 }, week)?.slot).toBe(25)
    expect(calendarKeyTarget('End', { day: '2026-10-14', slot: 2 }, week)?.day).toBe('2026-10-18')
    const day = { ...week, view: 'day' } as const
    expect(calendarKeyTarget('End', { day: '2026-10-14', slot: 2 }, day)).toEqual({
      day: '2026-10-14',
      slot: 25,
    })
    expect(calendarKeyTarget('PageUp', { day: '2026-10-14', slot: 2 }, day)?.day).toBe('2026-10-13')
  })
})

describe('ResourceSchedule axis', () => {
  const axis: ScheduleAxis = {
    days: ['2026-10-12', '2026-10-13'],
    dayStart: 480,
    dayEnd: 960,
    slotMinutes: 30,
  }
  const options = { axis, resources: 3, direction: 'ltr', orientation: 'horizontal' } as const

  it('counts axis minutes over several days', () => {
    expect(slotsPerDay(axis)).toBe(16)
    expect(axisMinutes(axis, '2026-10-13', 540)).toBe(540)
    expect(axisMinutes(axis, '2026-10-14', 540)).toBeNull()
    // At or after the day's end it is not on the axis (not the next day's morning).
    expect(axisMinutes(axis, '2026-10-12', 960)).toBeNull()
    expect(axisMinutes(axis, '2026-10-13', 450)).toBe(450)
    expect(axisMoment(axis, 540)).toEqual({ day: '2026-10-13', minutes: 540 })
  })

  it('fits a booking into one day', () => {
    // 15:30 + 60 minutes runs past 16:00: forward goes to the next morning, else it ends at 16:00.
    expect(fitOnAxis(axis, 450, 60, true)).toBe(480)
    expect(fitOnAxis(axis, 450, 60, false)).toBe(420)
    expect(fitOnAxis(axis, -30, 30, false)).toBe(0)
    expect(fitOnAxis(axis, 950, 30, true)).toBe(930)
  })

  it('moves a picked-up booking by slot and by row, from the leading edge', () => {
    const place = { resource: 1, start: 60 }
    expect(scheduleKeyTarget('ArrowRight', place, 30, options)).toEqual({ resource: 1, start: 90 })
    expect(scheduleKeyTarget('ArrowLeft', place, 30, { ...options, direction: 'rtl' })).toEqual({
      resource: 1,
      start: 90,
    })
    expect(scheduleKeyTarget('ArrowDown', place, 30, options)).toEqual({ resource: 2, start: 60 })
    expect(scheduleKeyTarget('ArrowUp', { resource: 0, start: 60 }, 30, options)).toBeNull()
    expect(scheduleKeyTarget('ArrowLeft', { resource: 0, start: 0 }, 30, options)).toBeNull()
    // Vertical (phones): time up and down, rows across.
    const vertical = { ...options, orientation: 'vertical' } as const
    expect(scheduleKeyTarget('ArrowDown', place, 30, vertical)).toEqual({ resource: 1, start: 90 })
    expect(scheduleKeyTarget('ArrowRight', place, 30, vertical)).toEqual({ resource: 2, start: 60 })
    expect(scheduleKeyTarget('ArrowRight', place, 30, { ...vertical, direction: 'rtl' })).toEqual({
      resource: 0,
      start: 60,
    })
  })

  it('drops a dragged booking whole slots away, on a row that exists', () => {
    expect(dropPlace({ resource: 0, start: 60 }, 2, 5, 30, { axis, resources: 3 })).toEqual({
      resource: 2,
      start: 120,
    })
    expect(dropPlace({ resource: 1, start: 60 }, -10, -1, 30, { axis, resources: 3 })).toEqual({
      resource: 0,
      start: 0,
    })
  })

  it('names the unavailable time a place overlaps; the schedule only says so', () => {
    const unavailable = [
      { start: '2026-10-12T12:00', end: '2026-10-12T12:30', reason: 'Lunch break' },
      { resourceId: 'r2', start: '2026-10-12T08:00', end: '2026-10-12T10:00', reason: 'Surgery' },
    ]
    const at = (time: number) => absoluteMinutes('2026-10-12', time)
    expect(unavailableReason(unavailable, 'r1', at(720), at(750), ZONE)).toBe('Lunch break')
    expect(unavailableReason(unavailable, 'r1', at(540), at(570), ZONE)).toBeNull()
    expect(unavailableReason(unavailable, 'r2', at(540), at(570), ZONE)).toBe('Surgery')
    expect(unavailableReason(unavailable, 'r2', at(600), at(630), ZONE)).toBeNull()
    expect(localOfAbsolute(at(570))).toBe('2026-10-12T09:30')
  })
})

describe('SlotPicker', () => {
  it('keys a slot by its id, else its resource and start', () => {
    expect(slotKey({ id: 'x', start: '2026-10-12T09:00' })).toBe('x')
    expect(slotKey({ start: '2026-10-12T09:00', resourceId: 'r1' })).toBe('r1@2026-10-12T09:00')
  })

  it('groups slots by day and by resource, in order', () => {
    const days = groupSlots(
      [
        { start: '2026-10-13T09:00', resourceId: 'b' },
        { start: '2026-10-12T10:00', resourceId: 'a' },
        { start: '2026-10-12T09:00', resourceId: 'b' },
        { start: '2026-10-12T09:30', resourceId: 'a' },
        { start: 'unreadable' },
      ],
      ZONE,
      true,
      ['a', 'b'],
    )
    expect(days.map((day) => day.day)).toEqual(['2026-10-12', '2026-10-13'])
    expect(days[0]?.groups.map((group) => group.resourceId)).toEqual(['a', 'b'])
    expect(days[0]?.groups[0]?.slots.map((slot) => slot.start)).toEqual([
      '2026-10-12T09:30',
      '2026-10-12T10:00',
    ])
    const flat = groupSlots([{ start: '2026-10-12T09:00', resourceId: 'b' }], ZONE, false)
    expect(flat[0]?.groups[0]?.resourceId).toBeNull()
  })
})

describe('Timetable', () => {
  const periods = [
    { id: '1', start: '08:00', end: '08:45' },
    { id: '2', start: '08:50', end: '09:35' },
  ]
  it('finds the period running now; none between periods', () => {
    expect(currentPeriod(periods, '08:10')).toBe('1')
    expect(currentPeriod(periods, '08:45')).toBeNull()
    expect(currentPeriod(periods, '09:00')).toBe('2')
    expect(currentPeriod(periods, 'later')).toBeNull()
  })

  it('shows today on a phone when it is a school day', () => {
    const days = [1, 2, 3, 4, 5] as const
    expect(initialTimetableDay(days, '2026-10-14', undefined)).toBe(3)
    expect(initialTimetableDay(days, '2026-10-11', undefined)).toBe(1)
    expect(initialTimetableDay(days, '2026-10-14', 5)).toBe(5)
  })
})
