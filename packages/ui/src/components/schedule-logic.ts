import { localDateTimeIn, type Weekday } from '../provider/format'

/*
 * The logic of CalendarView, ResourceSchedule, SlotPicker and Timetable (BUILD-PLAN P5.8), kept
 * apart from the markup so it can be unit-tested (AGENTS.md C7). Days are YYYY-MM-DD strings and
 * times local "YYYY-MM-DDTHH:mm" strings, both read as written: the calendar never uses the
 * device's clock or zone. An instant with an offset ("…T07:30:00Z") is converted into the
 * provider's time zone first (`readMoment`). "Today" is the provider's `today`.
 */

/** The views of CalendarView. */
export type CalendarViewName = 'day' | 'week' | 'month' | 'agenda'

export const CALENDAR_VIEWS: readonly CalendarViewName[] = ['day', 'week', 'month', 'agenda']

const MINUTES_PER_DAY = 1440
const DAY_MS = 86_400_000

/** The day number of a YYYY-MM-DD date (days since 1970-01-01). */
export function dayNumber(day: string): number {
  const [year = 1970, month = 1, date = 1] = day.split('-').map(Number)
  return Math.round(Date.UTC(year, month - 1, date) / DAY_MS)
}

/** The YYYY-MM-DD date of a day number. */
export function dayOfNumber(value: number): string {
  return new Date(value * DAY_MS).toISOString().slice(0, 10)
}

/** The date `count` days after (or before) `day`. */
export function addDays(day: string, count: number): string {
  return dayOfNumber(dayNumber(day) + count)
}

/** The weekday of a date: 0 = Sunday … 6 = Saturday. */
export function weekdayOf(day: string): Weekday {
  return new Date(dayNumber(day) * DAY_MS).getUTCDay() as Weekday
}

/** The first day of the week that holds `day`, for a week that starts on `weekStartsOn`. */
export function startOfWeek(day: string, weekStartsOn: Weekday): string {
  return addDays(day, -((weekdayOf(day) - weekStartsOn + 7) % 7))
}

/** The seven days of the week that holds `day`, in order. */
export function weekDays(day: string, weekStartsOn: Weekday): string[] {
  const first = startOfWeek(day, weekStartsOn)
  return Array.from({ length: 7 }, (_, index) => addDays(first, index))
}

/** The date `count` months after `day`; the day of the month is kept where the month has it. */
export function addMonths(day: string, count: number): string {
  const [year = 1970, month = 1, date = 1] = day.split('-').map(Number)
  const index = year * 12 + month - 1 + count
  const targetYear = Math.floor(index / 12)
  const targetMonth = index - targetYear * 12
  const last = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
  const result = new Date(Date.UTC(targetYear, targetMonth, Math.min(date, last)))
  // Years 0–99 would otherwise be read as 1900–1999.
  result.setUTCFullYear(targetYear)
  return result.toISOString().slice(0, 10)
}

/** The whole weeks that cover the month of `day` (four to six rows of seven days). */
export function monthWeeks(day: string, weekStartsOn: Weekday): string[][] {
  const first = `${day.slice(0, 8)}01`
  const last = addDays(addMonths(first, 1), -1)
  const weeks: string[][] = []
  let start = startOfWeek(first, weekStartsOn)
  while (start <= last) {
    weeks.push(weekDays(start, weekStartsOn))
    start = addDays(start, 7)
  }
  return weeks
}

/**
 * The days a view shows for `date`: one day; the week (week and agenda: an agenda lists the week);
 * or the weeks that cover the month.
 */
export function periodDays(view: CalendarViewName, date: string, weekStartsOn: Weekday): string[] {
  if (view === 'day') return [date]
  if (view === 'month') return monthWeeks(date, weekStartsOn).flat()
  return weekDays(date, weekStartsOn)
}

/** The date the previous (−1) or next (+1) period of a view starts from. */
export function shiftPeriod(view: CalendarViewName, date: string, step: 1 | -1): string {
  if (view === 'day') return addDays(date, step)
  if (view === 'month') return addMonths(date, step)
  return addDays(date, 7 * step)
}

/** "HH:mm" as minutes after midnight (24:00 is 1440), or null. */
export function minutesOf(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (match === null) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (minutes > 59 || hours > 24 || (hours === 24 && minutes > 0)) return null
  return hours * 60 + minutes
}

/** Minutes after midnight as "HH:mm". */
export function clockOf(minutes: number): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
}

/** A local "YYYY-MM-DDTHH:mm" of a day and minutes after its midnight (past midnight rolls over). */
export function localDateTime(day: string, minutes: number): string {
  const extra = Math.floor(minutes / MINUTES_PER_DAY)
  return `${addDays(day, extra)}T${clockOf(minutes - extra * MINUTES_PER_DAY)}`
}

/** A point in time as the calendar reads it: a day, and minutes after its midnight (null: all day). */
export interface Moment {
  day: string
  minutes: number | null
}

/**
 * Reads a start or end: "YYYY-MM-DD" is a whole day; "YYYY-MM-DDTHH:mm" a local time, as written;
 * an instant with an offset or "Z" is converted into `timeZone` (the provider's). null when
 * unreadable.
 */
export function readMoment(value: string, timeZone: string): Moment | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { day: value, minutes: null }
  const local = localDateTimeIn(value, timeZone)
  if (local === null) return null
  return { day: local.slice(0, 10), minutes: minutesOf(local.slice(11, 16)) ?? 0 }
}

/** What the calendar needs of an event or a booking: when it starts and ends. */
export interface Timed {
  start: string
  /** Default: the same day (all-day), or the start itself (a moment). */
  end?: string
}

/**
 * An event on one absolute time line, in minutes since 1970-01-01 00:00 local: `end` is
 * exclusive. An all-day event covers its days from midnight to midnight, its `end` day included.
 */
export interface Span {
  allDay: boolean
  start: number
  end: number
}

/** The span of an event, or null when its start cannot be read. An end before the start is the start. */
export function spanOf(event: Timed, timeZone: string): Span | null {
  const start = readMoment(event.start, timeZone)
  if (start === null) return null
  const end = event.end === undefined ? null : readMoment(event.end, timeZone)
  if (start.minutes === null) {
    const last = end === null ? start.day : end.day
    const from = dayNumber(start.day)
    const to = Math.max(from, dayNumber(last))
    return { allDay: true, start: from * MINUTES_PER_DAY, end: (to + 1) * MINUTES_PER_DAY }
  }
  const from = dayNumber(start.day) * MINUTES_PER_DAY + start.minutes
  const to = end === null ? from : dayNumber(end.day) * MINUTES_PER_DAY + (end.minutes ?? 0)
  return { allDay: false, start: from, end: Math.max(from, to) }
}

/** Whether a span touches a day (a moment counts on the day it stands on). */
export function onDay(span: Span, day: string): boolean {
  const from = dayNumber(day) * MINUTES_PER_DAY
  const to = from + MINUTES_PER_DAY
  if (span.start === span.end) return span.start >= from && span.start < to
  return span.start < to && span.end > from
}

/** The minutes of a span within a day: start and end after that day's midnight, clipped to it. */
export function withinDay(span: Span, day: string): { start: number; end: number } {
  const from = dayNumber(day) * MINUTES_PER_DAY
  return {
    start: Math.max(0, span.start - from),
    end: Math.min(MINUTES_PER_DAY, span.end - from),
  }
}

/** Items in the order a day or a list shows them: all-day first, then by start, longer first. */
export function byStart<T extends { span: Span }>(items: readonly T[]): T[] {
  return [...items].sort(
    (a, b) =>
      Number(b.span.allDay) - Number(a.span.allDay) ||
      a.span.start - b.span.start ||
      b.span.end - a.span.end,
  )
}

/** A timed event placed in a day column: its rows and its place among overlapping events. */
export interface Placement {
  id: string
  /** Minutes after the window's start, and the minutes it covers (at least `minimum`). */
  top: number
  height: number
  /** Its column among the events it overlaps, and how many columns they need. */
  column: number
  columns: number
}

/**
 * Places the timed events of one day in a window of the day (`from`–`to`, minutes after midnight):
 * overlapping events stand side by side (the first free column), each group of events that
 * overlap one another shares one number of columns. An event shorter than `minimum` is drawn
 * `minimum` long, and is placed by that length, so short events never cover each other. Events
 * wholly outside the window are returned in `outside`.
 */
export function layoutDay(
  items: readonly { id: string; start: number; end: number }[],
  from: number,
  to: number,
  minimum: number,
): { placed: Placement[]; outside: string[] } {
  const outside: string[] = []
  const visible = items
    .filter((item) => {
      const inside = item.end > from && item.start < to
      const moment = item.start === item.end && item.start >= from && item.start < to
      if (!inside && !moment) outside.push(item.id)
      return inside || moment
    })
    .map((item) => {
      const top = Math.max(item.start, from) - from
      const end = Math.min(item.end, to) - from
      const height = Math.max(end - top, minimum)
      return { id: item.id, top, bottom: top + height, length: item.end - item.start }
    })
    .sort((a, b) => a.top - b.top || b.length - a.length)

  const placed: Placement[] = []
  let group: Placement[] = []
  let columnEnds: number[] = []
  let groupEnd = -Infinity
  const close = () => {
    for (const each of group) each.columns = columnEnds.length
    group = []
    columnEnds = []
  }
  for (const item of visible) {
    if (item.top >= groupEnd) {
      close()
      groupEnd = -Infinity
    }
    let column = columnEnds.findIndex((end) => end <= item.top)
    if (column === -1) {
      column = columnEnds.length
      columnEnds.push(item.bottom)
    } else {
      columnEnds[column] = item.bottom
    }
    groupEnd = Math.max(groupEnd, item.bottom)
    const placement = {
      id: item.id,
      top: item.top,
      height: item.bottom - item.top,
      column,
      columns: 1,
    }
    group.push(placement)
    placed.push(placement)
  }
  close()
  return { placed, outside }
}

/**
 * The events a month cell shows and how many go under "+N more": all when they fit in `max`
 * lines, otherwise `max − 1` and the "+N more" line.
 */
export function cellEvents<T>(items: readonly T[], max: number): { shown: T[]; more: number } {
  if (items.length <= max) return { shown: [...items], more: 0 }
  const shown = items.slice(0, Math.max(0, max - 1))
  return { shown, more: items.length - shown.length }
}

/** The cell that has the keyboard focus in a calendar grid: a day, and a time slot in day and week views. */
export interface GridCell {
  day: string
  slot: number
}

/**
 * The cell an arrow key (or Home, End, Page Up, Page Down) moves to in a calendar grid, or null.
 * Left and right move between days measured from the leading edge (Appendix B.7): in
 * right-to-left ArrowLeft goes forward. Month: up and down by a week, Home and End to the week's
 * ends, Page Up and Page Down by a month. Week: up and down by a slot, Home and End to the week's
 * ends, Page Up and Page Down by a week. Day: up and down by a slot, Home and End to the first and
 * last slot, Page Up and Page Down by a day. Leaving the period is allowed: the calendar follows.
 */
export function calendarKeyTarget(
  key: string,
  cell: GridCell,
  options: {
    view: 'day' | 'week' | 'month'
    direction: 'ltr' | 'rtl'
    weekStartsOn: Weekday
    /** Slots in a day column (day and week views). */
    slots: number
  },
): GridCell | null {
  const forward = options.direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
  const backward = options.direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
  const { day, slot } = cell
  if (key === forward) return { day: addDays(day, 1), slot }
  if (key === backward) return { day: addDays(day, -1), slot }
  if (options.view === 'month') {
    if (key === 'ArrowUp') return { day: addDays(day, -7), slot }
    if (key === 'ArrowDown') return { day: addDays(day, 7), slot }
    if (key === 'Home') return { day: startOfWeek(day, options.weekStartsOn), slot }
    if (key === 'End') return { day: addDays(startOfWeek(day, options.weekStartsOn), 6), slot }
    if (key === 'PageUp') return { day: addMonths(day, -1), slot }
    if (key === 'PageDown') return { day: addMonths(day, 1), slot }
    return null
  }
  const last = Math.max(0, options.slots - 1)
  if (key === 'ArrowUp') return { day, slot: Math.max(0, slot - 1) }
  if (key === 'ArrowDown') return { day, slot: Math.min(last, slot + 1) }
  if (options.view === 'week') {
    if (key === 'Home') return { day: startOfWeek(day, options.weekStartsOn), slot }
    if (key === 'End') return { day: addDays(startOfWeek(day, options.weekStartsOn), 6), slot }
    if (key === 'PageUp') return { day: addDays(day, -7), slot }
    if (key === 'PageDown') return { day: addDays(day, 7), slot }
    return null
  }
  if (key === 'Home') return { day, slot: 0 }
  if (key === 'End') return { day, slot: last }
  if (key === 'PageUp') return { day: addDays(day, -1), slot }
  if (key === 'PageDown') return { day: addDays(day, 1), slot }
  return null
}

/*
 * ResourceSchedule: the time axis is the chosen days one after another, each from `dayStart` to
 * `dayEnd`. A place on it is counted in axis minutes: the day's index times the day's length,
 * plus the minutes after `dayStart`.
 */

/** The time axis of a ResourceSchedule. */
export interface ScheduleAxis {
  days: readonly string[]
  /** Minutes after midnight. */
  dayStart: number
  dayEnd: number
  /** The step of the keyboard and of a dropped booking, and one column of the grid. */
  slotMinutes: number
}

/** The length of one day on the axis, in minutes. */
export function dayLength(axis: ScheduleAxis): number {
  return Math.max(axis.slotMinutes, axis.dayEnd - axis.dayStart)
}

/** Slots in one day of the axis. */
export function slotsPerDay(axis: ScheduleAxis): number {
  return Math.ceil(dayLength(axis) / axis.slotMinutes)
}

/**
 * The axis minutes of a local day and time, or null when the day is not on the axis or the time
 * is at or after its day's end. A time before the day's start gives a place before the day's
 * segment (the caller clips what it draws).
 */
export function axisMinutes(axis: ScheduleAxis, day: string, minutes: number): number | null {
  const index = axis.days.indexOf(day)
  if (index === -1 || minutes >= axis.dayStart + dayLength(axis)) return null
  return index * dayLength(axis) + (minutes - axis.dayStart)
}

/** The local day and minutes of a place on the axis. */
export function axisMoment(axis: ScheduleAxis, value: number): { day: string; minutes: number } {
  const length = dayLength(axis)
  const index = Math.min(axis.days.length - 1, Math.max(0, Math.floor(value / length)))
  return { day: axis.days[index] ?? '', minutes: axis.dayStart + (value - index * length) }
}

/**
 * Where a booking of `duration` minutes lands when it is moved to axis minute `value`: inside one
 * day of the axis. When it would run past its day's end it goes to the next day's start (moving
 * forward, if there is one) or ends at the day's end; it never starts before the axis.
 */
export function fitOnAxis(
  axis: ScheduleAxis,
  value: number,
  duration: number,
  forward: boolean,
): number {
  const length = dayLength(axis)
  const total = length * axis.days.length
  const start = Math.min(Math.max(0, value), total - 1)
  const index = Math.floor(start / length)
  const dayFrom = index * length
  const dayTo = dayFrom + length
  if (start + duration <= dayTo) return start
  if (forward && index + 1 < axis.days.length && start > dayFrom) return dayTo
  return Math.max(dayFrom, dayTo - duration)
}

/** A booking's place while it is moved: its row, and its start on the axis. */
export interface SchedulePlace {
  resource: number
  start: number
}

/**
 * Where an arrow key moves a picked-up booking, or null. The time arrows move it by one slot (from
 * the leading edge: in right-to-left ArrowLeft is later), the others by one row. Horizontal (the
 * desktop grid): time runs left and right, rows up and down. Vertical (phones, one row at a
 * time): time runs up and down, the rows left and right.
 */
export function scheduleKeyTarget(
  key: string,
  place: SchedulePlace,
  duration: number,
  options: {
    axis: ScheduleAxis
    resources: number
    direction: 'ltr' | 'rtl'
    orientation: 'horizontal' | 'vertical'
  },
): SchedulePlace | null {
  const forward = options.direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
  const backward = options.direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
  const horizontal = options.orientation === 'horizontal'
  const later = horizontal ? forward : 'ArrowDown'
  const earlier = horizontal ? backward : 'ArrowUp'
  const nextRow = horizontal ? 'ArrowDown' : forward
  const previousRow = horizontal ? 'ArrowUp' : backward
  const step = options.axis.slotMinutes
  if (key === later || key === earlier) {
    const isLater = key === later
    const start = fitOnAxis(options.axis, place.start + (isLater ? step : -step), duration, isLater)
    return start === place.start ? null : { ...place, start }
  }
  if (key === nextRow || key === previousRow) {
    const resource = place.resource + (key === nextRow ? 1 : -1)
    if (resource < 0 || resource >= options.resources) return null
    return { ...place, resource }
  }
  return null
}

/**
 * Where a dragged booking lands: `slots` whole slots later (negative: earlier) and on row
 * `resource`, fitted on the axis.
 */
export function dropPlace(
  from: SchedulePlace,
  slots: number,
  resource: number,
  duration: number,
  options: { axis: ScheduleAxis; resources: number },
): SchedulePlace {
  const start = fitOnAxis(
    options.axis,
    from.start + slots * options.axis.slotMinutes,
    duration,
    slots >= 0,
  )
  return { resource: Math.min(options.resources - 1, Math.max(0, resource)), start }
}

/** An unavailable time from the application: all rows, or one, with its reason. */
export interface UnavailableTime {
  /** The row it belongs to; none: every row. */
  resourceId?: string
  start: string
  end: string
  /** Why, in words; shown and announced. */
  reason: string
}

/**
 * The reason of the first unavailable time that overlaps `start`–`end` (absolute minutes, as
 * `spanOf`) on a row, or null. The schedule only says so; the application decides about a move.
 */
export function unavailableReason(
  unavailable: readonly UnavailableTime[],
  resourceId: string,
  start: number,
  end: number,
  timeZone: string,
): string | null {
  for (const each of unavailable) {
    if (each.resourceId !== undefined && each.resourceId !== resourceId) continue
    const span = spanOf(each, timeZone)
    if (span === null) continue
    const overlaps =
      start === end ? start >= span.start && start < span.end : start < span.end && end > span.start
    if (overlaps) return each.reason
  }
  return null
}

/** Absolute minutes (as `spanOf`) of a day and minutes after its midnight. */
export function absoluteMinutes(day: string, minutes: number): number {
  return dayNumber(day) * MINUTES_PER_DAY + minutes
}

/** The local "YYYY-MM-DDTHH:mm" of absolute minutes. */
export function localOfAbsolute(value: number): string {
  const day = Math.floor(value / MINUTES_PER_DAY)
  return localDateTime(dayOfNumber(day), value - day * MINUTES_PER_DAY)
}

/*
 * SlotPicker.
 */

/** A free slot the application offers. */
export interface FreeSlot {
  /** Default: the resource and the start. */
  id?: string
  /** Local "YYYY-MM-DDTHH:mm" (or an instant, shown in the provider's zone). */
  start: string
  end?: string
  /** The row it belongs to (a doctor, a room), when the picker groups by resource. */
  resourceId?: string
}

/** The value a slot is chosen by: its id, else its resource and start. */
export function slotKey(slot: FreeSlot): string {
  return slot.id ?? `${slot.resourceId ?? ''}@${slot.start}`
}

/** Slots of one day, in groups by resource (one group with `resourceId` null when not grouped). */
export interface SlotDay<T extends FreeSlot> {
  day: string
  groups: { resourceId: string | null; slots: T[] }[]
}

/**
 * The slots grouped by day (in order), and within a day by resource in the order of `resources`
 * (when `byResource`), each group by start. Unreadable slots are left out.
 */
export function groupSlots<T extends FreeSlot>(
  slots: readonly T[],
  timeZone: string,
  byResource: boolean,
  resources: readonly string[] = [],
): SlotDay<T>[] {
  const read = slots
    .map((slot) => ({ slot, span: spanOf(slot, timeZone) }))
    .filter((each): each is { slot: T; span: Span } => each.span !== null)
    .sort((a, b) => a.span.start - b.span.start)
  const days: SlotDay<T>[] = []
  for (const { slot, span } of read) {
    const day = dayOfNumber(Math.floor(span.start / MINUTES_PER_DAY))
    let entry = days.find((each) => each.day === day)
    if (entry === undefined) {
      entry = { day, groups: [] }
      days.push(entry)
    }
    const resourceId = byResource ? (slot.resourceId ?? null) : null
    let group = entry.groups.find((each) => each.resourceId === resourceId)
    if (group === undefined) {
      group = { resourceId, slots: [] }
      entry.groups.push(group)
    }
    group.slots.push(slot)
  }
  const rank = (id: string | null) => {
    const index = id === null ? -1 : resources.indexOf(id)
    return index === -1 ? resources.length : index
  }
  for (const entry of days) entry.groups.sort((a, b) => rank(a.resourceId) - rank(b.resourceId))
  return days.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0))
}

/*
 * Timetable.
 */

/** The period running at `now` ("HH:mm"): start ≤ now < end; null between periods. */
export function currentPeriod(
  periods: readonly { id: string; start: string; end: string }[],
  now: string,
): string | null {
  const at = minutesOf(now)
  if (at === null) return null
  for (const period of periods) {
    const start = minutesOf(period.start)
    const end = minutesOf(period.end)
    if (start !== null && end !== null && start <= at && at < end) return period.id
  }
  return null
}

/**
 * The day a phone shows first: the chosen one, else today when it is a school day, else the first
 * day of the week.
 */
export function initialTimetableDay(
  days: readonly Weekday[],
  today: string,
  chosen: Weekday | undefined,
): Weekday {
  if (chosen !== undefined && days.includes(chosen)) return chosen
  const weekday = weekdayOf(today)
  if (days.includes(weekday)) return weekday
  return days[0] ?? 1
}
