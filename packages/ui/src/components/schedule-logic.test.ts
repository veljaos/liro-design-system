import { describe, expect, it } from 'vitest'
import {
  absoluteMinutes,
  addDays,
  dayListSide,
  addMonths,
  axisMinutes,
  axisMoment,
  byStart,
  calendarKeyTarget,
  cellEvents,
  clockOf,
  currentPeriod,
  dropPlace,
  fitOnDays,
  fitOnAxis,
  groupSlots,
  initialTimetableDay,
  layoutDay,
  localDateTime,
  localOfAbsolute,
  minutesOf,
  monthWeeks,
  nowMoment,
  nowOnAxis,
  nowWithin,
  onDay,
  periodDays,
  readMoment,
  scheduleKeyTarget,
  scheduleSearchMatches,
  foldSearchText,
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

describe('ResourceSchedule days axis (P5.25)', () => {
  // Fourteen days as one segment from the first day's midnight, a slot a day.
  const axis = { days: ['2026-10-06'], dayStart: 0, dayEnd: 14 * 1440, slotMinutes: 1440 }
  const days = { axis, resources: 3, scale: 'days' as const }

  it('starts a stay on one of the days shown, whatever its length', () => {
    expect(fitOnDays(axis, 2 * 1440)).toBe(2 * 1440)
    expect(fitOnDays(axis, -1440)).toBe(0)
    expect(fitOnDays(axis, 14 * 1440)).toBe(13 * 1440)
  })

  it('moves a stay by a day, from the leading edge, and never pushes it back to fit', () => {
    const options = { ...days, direction: 'ltr' as const, orientation: 'horizontal' as const }
    const place = { resource: 1, start: 11 * 1440 }
    // Four nights from the twelfth day run past the last day shown: it still moves on.
    expect(scheduleKeyTarget('ArrowRight', place, 4 * 1440, options)).toEqual({
      resource: 1,
      start: 12 * 1440,
    })
    expect(scheduleKeyTarget('ArrowLeft', place, 4 * 1440, options)).toEqual({
      resource: 1,
      start: 10 * 1440,
    })
    expect(
      scheduleKeyTarget('ArrowLeft', place, 4 * 1440, { ...options, direction: 'rtl' }),
    ).toEqual({ resource: 1, start: 12 * 1440 })
    expect(scheduleKeyTarget('ArrowRight', { resource: 1, start: 13 * 1440 }, 1440, options)).toBe(
      null,
    )
    expect(scheduleKeyTarget('ArrowLeft', { resource: 1, start: 0 }, 1440, options)).toBeNull()
    expect(scheduleKeyTarget('ArrowDown', place, 1440, options)).toEqual({
      resource: 2,
      start: 11 * 1440,
    })
  })

  it('drops a dragged stay on whole days, inside the days shown', () => {
    expect(dropPlace({ resource: 0, start: 1440 }, 3, 1, 2 * 1440, days)).toEqual({
      resource: 1,
      start: 4 * 1440,
    })
    expect(dropPlace({ resource: 0, start: 1440 }, -5, 0, 2 * 1440, days)).toEqual({
      resource: 0,
      start: 0,
    })
    expect(dropPlace({ resource: 0, start: 12 * 1440 }, 4, 0, 3 * 1440, days)).toEqual({
      resource: 0,
      start: 13 * 1440,
    })
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

describe('dayListSide', () => {
  it('opens below with room for a useful part of the list or as much room as above, else above', () => {
    expect(dayListSide(320, 430, 720)).toBe('bottom')
    expect(dayListSide(360, 360, 720)).toBe('bottom')
    expect(dayListSide(60, 100, 180)).toBe('bottom')
    expect(dayListSide(500, 580, 720)).toBe('top')
  })
})

describe('now (P5.28 item 10)', () => {
  it('reads the application’s clock: a time of today, a local value or an instant', () => {
    expect(nowMoment('10:05', '2026-10-06', ZONE)).toEqual({ day: '2026-10-06', minutes: 605 })
    expect(nowMoment('2026-10-14T09:40', '2026-10-06', ZONE)).toEqual({
      day: '2026-10-14',
      minutes: 580,
    })
    // 07:40 UTC is 09:40 in Belgrade (summer time).
    expect(nowMoment('2026-10-14T07:40:00Z', '2026-10-06', ZONE)).toEqual({
      day: '2026-10-14',
      minutes: 580,
    })
    expect(nowMoment('later', '2026-10-06', ZONE)).toBeNull()
    expect(nowMoment('25:00', '2026-10-06', ZONE)).toBeNull()
  })

  it('places now inside a span of the day, or nowhere', () => {
    expect(nowWithin(605, '09:55', '10:40')).toBeCloseTo(10 / 45)
    expect(nowWithin(595, '09:55', '10:40')).toBe(0)
    expect(nowWithin(640, '09:55', '10:40')).toBeNull()
    expect(nowWithin(590, '09:55', '10:40')).toBeNull()
    expect(nowWithin(600, '10:40', '09:55')).toBeNull()
  })

  it('places now on a schedule’s axis, or nowhere', () => {
    const hours: ScheduleAxis = {
      days: ['2026-10-14', '2026-10-15'],
      dayStart: 420,
      dayEnd: 780,
      slotMinutes: 30,
    }
    expect(nowOnAxis(hours, { day: '2026-10-14', minutes: 580 })).toBe(160)
    expect(nowOnAxis(hours, { day: '2026-10-15', minutes: 420 })).toBe(360)
    expect(nowOnAxis(hours, { day: '2026-10-14', minutes: 400 })).toBeNull()
    expect(nowOnAxis(hours, { day: '2026-10-14', minutes: 780 })).toBeNull()
    expect(nowOnAxis(hours, { day: '2026-10-16', minutes: 500 })).toBeNull()
    const days: ScheduleAxis = {
      days: ['2026-10-12'],
      dayStart: 0,
      dayEnd: 14 * 1440,
      slotMinutes: 1440,
    }
    expect(nowOnAxis(days, { day: '2026-10-14', minutes: 720 })).toBe(2 * 1440 + 720)
    expect(nowOnAxis(days, { day: '2026-10-11', minutes: 720 })).toBeNull()
    expect(nowOnAxis(days, { day: '2026-10-26', minutes: 0 })).toBeNull()
  })
})

describe('scheduleSearchMatches: the phone lists search (P5.90 item 19)', () => {
  it('matches every word anywhere in the texts, without case or accents', () => {
    const texts = ['Đorđević Marija', '2 adults · Booking.com', 'Room 412']
    expect(scheduleSearchMatches('', texts, 'sr-Latn-RS')).toBe(true)
    expect(scheduleSearchMatches('  ', texts, 'sr-Latn-RS')).toBe(true)
    expect(scheduleSearchMatches('dordevic', texts, 'sr-Latn-RS')).toBe(true)
    expect(scheduleSearchMatches('ĐORĐEVIĆ', texts, 'sr-Latn-RS')).toBe(true)
    expect(scheduleSearchMatches('412 marija', texts, 'sr-Latn-RS')).toBe(true)
    expect(scheduleSearchMatches('booking', texts, 'sr-Latn-RS')).toBe(true)
    expect(scheduleSearchMatches('413', texts, 'sr-Latn-RS')).toBe(false)
    expect(scheduleSearchMatches('marija 413', texts, 'sr-Latn-RS')).toBe(false)
  })
  it('skips missing texts', () => {
    expect(scheduleSearchMatches('suljic', ['Šuljić', undefined], 'en')).toBe(true)
    expect(foldSearchText(' Šuljić ', 'en')).toBe('suljic')
  })
})
