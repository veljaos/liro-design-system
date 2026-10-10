import type { Weekday } from '../provider/format'
import { addDays } from './period-logic'

/*
 * The logic of ShiftPlanner, MyShifts and ShiftSwapDialog (BUILD-PLAN P5.24 b), kept apart from
 * the markup so it can be unit-tested (AGENTS.md C7): the span of a template (crossing midnight,
 * its length as display only), the days of a period and its navigation, the cells of a selected
 * range, the changes a key or a drop reports, the assignments a rotation pattern generates, the
 * cell under a dragged item, and the shifts of one person grouped by week.
 *
 * Nothing here decides whether a plan is valid: rest between shifts, double booking and weekly
 * limits arrive from the application as conflicts (data); the planner only reports changes.
 * Dates are YYYY-MM-DD, clock times HH:mm; the arithmetic works on whole days and minutes.
 */

/** A place in the planner: a row (a person) and a day. */
export interface ShiftCellRef {
  rowId: string
  /** YYYY-MM-DD. */
  date: string
}

/** One assignment the planner shows: a template on a row's day. */
export interface ShiftAssignment extends ShiftCellRef {
  id: string
  templateId: string
  /** Changed since the schedule was published (from the application): marked "Changed". */
  changed?: boolean
}

/** One change the planner reports; the application applies it (or not). */
export type ShiftChange =
  | ({ type: 'add'; templateId: string } & ShiftCellRef)
  | { type: 'remove'; assignmentId: string; from: ShiftCellRef }
  | { type: 'move'; assignmentId: string; from: ShiftCellRef; to: ShiftCellRef }

/** A rotation pattern: one step per day, a template id or null for a day off. */
export interface RotationPattern {
  id: string
  /** The pattern's name, from the application ("Two early, two late, two night, two off"). */
  label: string
  steps: readonly (string | null)[]
}

/** A cell of the grid by its indices: the row among the rows shown, the day's column. */
export interface GridCell {
  row: number
  column: number
}

/** The minutes after midnight of an "HH:mm" clock time, or null when it cannot be read. */
export function clockMinutes(clock: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(clock.trim())
  if (match === null) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 24 || minutes > 59 || (hours === 24 && minutes > 0)) return null
  return hours * 60 + minutes
}

/**
 * Whether a template crosses midnight: its end is not after its start ("22:00"–"06:00", and a
 * 24-hour "07:00"–"07:00"). False when either time cannot be read.
 */
export function crossesMidnight(start: string, end: string): boolean {
  const from = clockMinutes(start)
  const to = clockMinutes(end)
  return from !== null && to !== null && to <= from
}

/**
 * The span of a template, for display only (never for limits or totals, which are the
 * application's): whether it crosses midnight, and its length in whole minutes. Null when either
 * time cannot be read.
 */
export function shiftSpan(
  start: string,
  end: string,
): { crossesMidnight: boolean; minutes: number } | null {
  const from = clockMinutes(start)
  const to = clockMinutes(end)
  if (from === null || to === null) return null
  const crosses = to <= from
  return { crossesMidnight: crosses, minutes: crosses ? to + 24 * 60 - from : to - from }
}

/** Whole hours and the minutes left of a length in minutes (480 → 8 h 0 min), for its text. */
export function hoursAndMinutes(minutes: number): { hours: number; minutes: number } {
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 }
}

/** The longest period the planner lays out, in days (a guard against a mistaken range). */
export const MAX_PERIOD_DAYS = 62

/** The days from `start` to `end`, both included; empty when the end is before the start. */
export function periodDays(start: string, end: string): string[] {
  const days: string[] = []
  let day = start
  while (day <= end && days.length < MAX_PERIOD_DAYS) {
    days.push(day)
    day = addDays(day, 1)
  }
  return days
}

/** The weekday of a date: 0 = Sunday … 6 = Saturday. */
export function weekdayOf(date: string): Weekday {
  const [year = 2000, month = 1, day = 1] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() as Weekday
}

/** The first day of the week that holds `date`, weeks starting on `weekStartsOn`. */
export function weekStartOf(date: string, weekStartsOn: Weekday): string {
  const back = (weekdayOf(date) - weekStartsOn + 7) % 7
  return addDays(date, -back)
}

/** A period moved by its own length, `steps` times (−1 the previous week, 1 the next). */
export function shiftPeriod(
  start: string,
  end: string,
  steps: number,
): { start: string; end: string } {
  const length = Math.max(1, periodDays(start, end).length)
  return { start: addDays(start, steps * length), end: addDays(end, steps * length) }
}

/**
 * The period of the same length that holds `today` ("Today"): it starts on the first day of
 * today's week, so a week stays a week and a fortnight starts on a week's first day.
 */
export function todayPeriod(
  start: string,
  end: string,
  today: string,
  weekStartsOn: Weekday,
): { start: string; end: string } {
  const length = Math.max(1, periodDays(start, end).length)
  const first = weekStartOf(today, weekStartsOn)
  return { start: first, end: addDays(first, length - 1) }
}

/** Whether a cell lies in the rectangle between two corners (a selected range). */
export function inRange(cell: GridCell, anchor: GridCell, focus: GridCell): boolean {
  return (
    cell.row >= Math.min(anchor.row, focus.row) &&
    cell.row <= Math.max(anchor.row, focus.row) &&
    cell.column >= Math.min(anchor.column, focus.column) &&
    cell.column <= Math.max(anchor.column, focus.column)
  )
}

/** The cells of the rectangle between two corners, row by row from the top, then by day. */
export function rangeCells(anchor: GridCell, focus: GridCell): GridCell[] {
  const cells: GridCell[] = []
  for (let row = Math.min(anchor.row, focus.row); row <= Math.max(anchor.row, focus.row); row++) {
    for (
      let column = Math.min(anchor.column, focus.column);
      column <= Math.max(anchor.column, focus.column);
      column++
    ) {
      cells.push({ row, column })
    }
  }
  return cells
}

/**
 * The key that assigns a template: its own `key`, else its position in the list (1 … 9) for the
 * first nine; null for the others. Keys are compared without case.
 */
export function templateKey(template: { key?: string }, index: number): string | null {
  if (template.key !== undefined && template.key !== '') return template.key
  return index < 9 ? String(index + 1) : null
}

/** The template a pressed key assigns, or null (keys compared without case). */
export function templateForKey<Template extends { id: string; key?: string }>(
  templates: readonly Template[],
  key: string,
): Template | null {
  if (key.length !== 1) return null
  const pressed = key.toLocaleLowerCase()
  return (
    templates.find(
      (template, index) => templateKey(template, index)?.toLocaleLowerCase() === pressed,
    ) ?? null
  )
}

/**
 * The changes that assign a template to cells: one 'add' per cell that does not already hold
 * that template (pressing the same key twice adds nothing). Whether the result is valid is the
 * application's to say.
 */
export function assignChanges(
  cells: readonly ShiftCellRef[],
  templateId: string,
  assignments: readonly ShiftAssignment[],
): ShiftChange[] {
  return cells
    .filter(
      (cell) =>
        !assignments.some(
          (each) =>
            each.rowId === cell.rowId && each.date === cell.date && each.templateId === templateId,
        ),
    )
    .map((cell) => ({ type: 'add', rowId: cell.rowId, date: cell.date, templateId }))
}

/** The changes that empty cells: one 'remove' per assignment in them. */
export function removeChanges(
  cells: readonly ShiftCellRef[],
  assignments: readonly ShiftAssignment[],
): ShiftChange[] {
  return assignments
    .filter((each) => cells.some((cell) => cell.rowId === each.rowId && cell.date === each.date))
    .map((each) => ({
      type: 'remove',
      assignmentId: each.id,
      from: { rowId: each.rowId, date: each.date },
    }))
}

/** The change that moves an assignment to a cell, or null when it is already there. */
export function moveChange(assignment: ShiftAssignment, to: ShiftCellRef): ShiftChange | null {
  if (assignment.rowId === to.rowId && assignment.date === to.date) return null
  return {
    type: 'move',
    assignmentId: assignment.id,
    from: { rowId: assignment.rowId, date: assignment.date },
    to: { rowId: to.rowId, date: to.date },
  }
}

/**
 * The assignments a rotation pattern generates (P5.24 b, "Apply rotation…"): for each person,
 * each day from `start` to `end` takes the pattern's step for that day — the first day is step 0
 * for the first person, and each further person starts `offsetPerPerson` steps later, so a team
 * covers the pattern's shifts between them. A null step is a day off (no assignment). The
 * application decides what happens to the cells' earlier assignments.
 */
export function rotationAssignments(
  pattern: Pick<RotationPattern, 'steps'>,
  peopleIds: readonly string[],
  start: string,
  end: string,
  offsetPerPerson = 0,
): ({ templateId: string } & ShiftCellRef)[] {
  const length = pattern.steps.length
  if (length === 0) return []
  const days = periodDays(start, end)
  return peopleIds.flatMap((rowId, person) =>
    days.flatMap((date, day) => {
      const step = (((day + person * offsetPerPerson) % length) + length) % length
      const templateId = pattern.steps[step] ?? null
      return templateId === null ? [] : [{ rowId, date, templateId }]
    }),
  )
}

/** A laid-out cell, measured when a drag starts: its place and its box. */
export interface CellBox extends ShiftCellRef {
  x: number
  y: number
  width: number
  height: number
}

/**
 * The cell under a point (the pointer of a drag), measured on the laid-out grid, so a
 * right-to-left grid needs no mirroring (B.7); null when the point is over no cell.
 */
export function cellAtPoint(
  boxes: readonly CellBox[],
  point: { x: number; y: number },
): ShiftCellRef | null {
  const box = boxes.find(
    (each) =>
      point.x >= each.x &&
      point.x < each.x + each.width &&
      point.y >= each.y &&
      point.y < each.y + each.height,
  )
  return box === undefined ? null : { rowId: box.rowId, date: box.date }
}

/** One conflict from the application, in a cell. */
export interface ShiftConflict {
  tone: 'warning' | 'danger'
  /** What is wrong, in words, from the application ("Less than 11 hours of rest"). */
  text: string
}

/** The application's conflicts: row id → date → the cell's conflicts. */
export type ShiftConflicts = Readonly<
  Record<string, Readonly<Record<string, readonly ShiftConflict[]>>>
>

/**
 * The conflicts of the cells shown, as one list for the "Conflicts" summary: in the order of the
 * rows shown, then by day; danger before warning within a cell.
 */
export function conflictList(
  conflicts: ShiftConflicts,
  rowIds: readonly string[],
  days: readonly string[],
): ({ conflict: ShiftConflict } & ShiftCellRef)[] {
  return rowIds.flatMap((rowId) =>
    days.flatMap((date) =>
      [...(conflicts[rowId]?.[date] ?? [])]
        .sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'danger' ? -1 : 1))
        .map((conflict) => ({ rowId, date, conflict })),
    ),
  )
}

/** The tone of a cell's conflicts: danger if any is, else warning; null without conflicts. */
export function cellConflictTone(
  conflicts: readonly ShiftConflict[] | undefined,
): 'warning' | 'danger' | null {
  if (conflicts === undefined || conflicts.length === 0) return null
  return conflicts.some((each) => each.tone === 'danger') ? 'danger' : 'warning'
}

/** A week of one person's shifts (MyShifts). */
export interface ShiftWeek<Shift> {
  /** The week's first and last day. */
  start: string
  end: string
  /** 'this' and 'next' are named in words; other weeks by their dates. */
  kind: 'this' | 'next' | 'date'
  shifts: Shift[]
}

/**
 * One person's shifts grouped by week (MyShifts), weeks and shifts in time order (by date, then
 * by start time). The week holding `today` is 'this', the one after it 'next'.
 */
export function shiftsByWeek<Shift extends { date: string; start: string }>(
  shifts: readonly Shift[],
  weekStartsOn: Weekday,
  today: string,
): ShiftWeek<Shift>[] {
  const thisWeek = weekStartOf(today, weekStartsOn)
  const nextWeek = addDays(thisWeek, 7)
  const ordered = [...shifts].sort((a, b) =>
    a.date === b.date
      ? (clockMinutes(a.start) ?? 0) - (clockMinutes(b.start) ?? 0)
      : a.date < b.date
        ? -1
        : 1,
  )
  const weeks: ShiftWeek<Shift>[] = []
  for (const shift of ordered) {
    const start = weekStartOf(shift.date, weekStartsOn)
    let week = weeks.find((each) => each.start === start)
    if (week === undefined) {
      week = {
        start,
        end: addDays(start, 6),
        kind: start === thisWeek ? 'this' : start === nextWeek ? 'next' : 'date',
        shifts: [],
      }
      weeks.push(week)
    }
    week.shifts.push(shift)
  }
  return weeks
}
