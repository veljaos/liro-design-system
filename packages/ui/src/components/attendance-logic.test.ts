import { describe, expect, it } from 'vitest'
import {
  addDays,
  attendanceKeyAction,
  cellRange,
  clearCells,
  codeForKey,
  copyPreviousWeek,
  fillRange,
  inRange,
  markColumn,
  markRow,
  rangeCells,
  rangeSize,
  sameEntry,
  startsHours,
  stepPerson,
  weekStart,
  weekdayOf,
  type AttendanceKeyState,
  type AttendanceValue,
} from './attendance-logic'

const CODES = [
  { code: 'present', key: 'p' },
  { code: 'absent', key: 'A' },
  { code: 'late', key: 'l' },
]

/** A table of 3 people × 4 days, a header row and a totals column. */
const STATE: AttendanceKeyState = {
  at: { row: 1, column: 1 },
  rows: 4,
  columns: 6,
  people: 3,
  days: 4,
  direction: 'ltr',
  mode: 'code',
  codes: CODES,
  editable: true,
  correctable: false,
  advance: 'down',
  ranged: false,
}

const key = (
  name: string,
  extra: Partial<{ shift: boolean; mod: boolean; alt: boolean }> = {},
) => ({
  key: name,
  shift: false,
  mod: false,
  alt: false,
  ...extra,
})

describe('ranges', () => {
  it('spans the cells between the anchor and the focus, in any direction', () => {
    const range = cellRange({ row: 2, column: 3 }, { row: 0, column: 1 })
    expect(range).toEqual({ top: 0, bottom: 2, start: 1, end: 3 })
    expect(rangeSize(range)).toBe(9)
    expect(inRange(range, { row: 1, column: 2 })).toBe(true)
    expect(inRange(range, { row: 1, column: 0 })).toBe(false)
    expect(rangeCells(cellRange({ row: 0, column: 0 }, { row: 1, column: 1 }))).toEqual([
      { row: 0, column: 0 },
      { row: 0, column: 1 },
      { row: 1, column: 0 },
      { row: 1, column: 1 },
    ])
  })
})

describe('entries', () => {
  it('compares code and hours; empty equals empty', () => {
    expect(sameEntry(null, { code: null, hours: null })).toBe(true)
    expect(sameEntry({ code: 'a' }, { code: 'a', hours: null })).toBe(true)
    expect(sameEntry({ code: 'a', hours: '8' }, { code: 'a', hours: '8.0' })).toBe(false)
  })
})

describe('marking', () => {
  const value: AttendanceValue = {
    ana: { d1: { code: 'present' } },
    marko: { d1: { code: 'absent' }, d2: { code: 'regular', hours: '8' } },
  }
  it('marks everyone in a column, leaving cells that already hold the code', () => {
    expect(markColumn(value, ['ana', 'marko', 'iva'], 'd1', 'present')).toEqual([
      { row: 'marko', column: 'd1', entry: { code: 'present' }, previous: { code: 'absent' } },
      { row: 'iva', column: 'd1', entry: { code: 'present' }, previous: null },
    ])
  })
  it('marks a row on normal days only, keeping hours', () => {
    const columns = [
      { id: 'd1' },
      { id: 'd2', kind: 'normal' as const },
      { id: 'd3', kind: 'weekend' as const },
      { id: 'd4', kind: 'holiday' as const },
    ]
    expect(markRow(value, 'marko', columns, 'leave')).toEqual([
      { row: 'marko', column: 'd1', entry: { code: 'leave' }, previous: { code: 'absent' } },
      {
        row: 'marko',
        column: 'd2',
        entry: { code: 'leave', hours: '8' },
        previous: { code: 'regular', hours: '8' },
      },
    ])
  })
  it('clears cells, hours too in the hours mode', () => {
    expect(clearCells(value, [{ row: 'marko', column: 'd2' }], true)).toEqual([
      {
        row: 'marko',
        column: 'd2',
        entry: { code: null, hours: null },
        previous: { code: 'regular', hours: '8' },
      },
    ])
    expect(clearCells(value, [{ row: 'iva', column: 'd2' }], true)).toEqual([])
  })
})

describe('fillRange', () => {
  it("gives every cell of the range the first cell's entry, hours as the same string", () => {
    const value: AttendanceValue = { ana: { d1: { code: 'rw', hours: '7.5' } } }
    const changes = fillRange(
      value,
      ['ana', 'marko'],
      ['d1', 'd2', 'd3'],
      cellRange({ row: 0, column: 0 }, { row: 1, column: 1 }),
      { row: 0, column: 0 },
      true,
    )
    expect(changes.map((each) => `${each.row}/${each.column}`)).toEqual([
      'ana/d2',
      'marko/d1',
      'marko/d2',
    ])
    expect(changes.every((each) => each.entry.hours === '7.5' && each.entry.code === 'rw')).toBe(
      true,
    )
  })
  it('fills from the cell where the selection started, even at the range end', () => {
    const value: AttendanceValue = { ana: { d3: { code: 'x' } } }
    const changes = fillRange(
      value,
      ['ana'],
      ['d1', 'd2', 'd3'],
      cellRange({ row: 0, column: 2 }, { row: 0, column: 0 }),
      { row: 0, column: 2 },
      false,
    )
    expect(changes).toEqual([
      { row: 'ana', column: 'd1', entry: { code: 'x' }, previous: null },
      { row: 'ana', column: 'd2', entry: { code: 'x' }, previous: null },
    ])
  })
})

describe('dates', () => {
  it('adds days across months and years', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-01-03', -7)).toBe('2025-12-27')
  })
  it('knows the weekday and the start of the week', () => {
    expect(weekdayOf('2026-10-01')).toBe(4) // a Thursday
    expect(weekdayOf('2026-10-04')).toBe(0)
    expect(weekStart('2026-10-14', 1)).toBe('2026-10-12') // Monday
    expect(weekStart('2026-10-14', 0)).toBe('2026-10-11') // Sunday
    expect(weekStart('2026-10-12', 1)).toBe('2026-10-12')
  })
})

describe('copyPreviousWeek', () => {
  // October 2026: Mon 5 … Sun 11, Mon 12 … Sun 18; the 13th an (illustrative) holiday.
  const columns = Array.from({ length: 18 }, (_, index) => {
    const day = index + 1
    const date = `2026-10-${String(day).padStart(2, '0')}`
    const weekday = weekdayOf(date)
    return {
      id: `d${String(day)}`,
      date,
      kind:
        day === 13
          ? ('holiday' as const)
          : weekday === 0 || weekday === 6
            ? ('weekend' as const)
            : ('normal' as const),
    }
  })
  const value: AttendanceValue = {
    ana: {
      d5: { code: 'rw', hours: '8' },
      d6: { code: 'rw', hours: '8' },
      d7: { code: 'night', hours: '8' },
      d12: { code: 'rw', hours: '6' },
      d13: { code: 'ph', hours: null },
    },
  }
  it("copies the week before the focused cell's week, day kind by day kind", () => {
    const changes = copyPreviousWeek(value, ['ana'], columns, 'd15', 1, true)
    expect(changes.map((each) => each.column)).toEqual(['d12', 'd14'])
    expect(changes[0]).toEqual({
      row: 'ana',
      column: 'd12',
      entry: { code: 'rw', hours: '8' },
      previous: { code: 'rw', hours: '6' },
    })
    // The 13th is a holiday and the 6th a working day: left as it is.
    expect(changes[1]?.entry).toEqual({ code: 'night', hours: '8' })
  })
  it('copies nothing where the week before is not in the grid', () => {
    expect(copyPreviousWeek(value, ['ana'], columns, 'd2', 1, true)).toEqual([])
    expect(copyPreviousWeek(value, ['ana'], [{ id: 'x' }], 'x', 1, true)).toEqual([])
  })
  it('follows the week start', () => {
    // A week from Sunday: 11–17 takes 4–10; the 11th (Sunday) takes the 4th (Sunday, empty).
    const changes = copyPreviousWeek(value, ['ana'], columns, 'd14', 0, false)
    expect(changes.map((each) => each.column)).toEqual(['d12', 'd14'])
    expect(changes[0]?.entry).toEqual({ code: 'rw' })
  })
})

describe('attendanceKeyAction', () => {
  it('moves with the arrows over the whole table, forward by the reading direction', () => {
    expect(attendanceKeyAction(key('ArrowRight'), STATE)).toEqual({
      type: 'move',
      to: { row: 1, column: 2 },
    })
    expect(attendanceKeyAction(key('ArrowRight'), { ...STATE, direction: 'rtl' })).toEqual({
      type: 'move',
      to: { row: 1, column: 0 },
    })
    expect(attendanceKeyAction(key('ArrowUp'), STATE)).toEqual({
      type: 'move',
      to: { row: 0, column: 1 },
    })
    expect(attendanceKeyAction(key('End', { mod: true }), STATE)).toEqual({
      type: 'move',
      to: { row: 3, column: 5 },
    })
    expect(attendanceKeyAction(key('Home'), STATE)).toEqual({
      type: 'move',
      to: { row: 1, column: 0 },
    })
  })
  it('extends the selection with Shift, inside the day area', () => {
    expect(attendanceKeyAction(key('ArrowDown', { shift: true }), STATE)).toEqual({
      type: 'extend',
      to: { row: 2, column: 1 },
    })
    // Towards the row headers: stays on the first day.
    expect(attendanceKeyAction(key('ArrowLeft', { shift: true }), STATE)).toBeNull()
    expect(
      attendanceKeyAction(key('ArrowDown', { shift: true }), {
        ...STATE,
        at: { row: 0, column: 1 },
      }),
    ).toBeNull()
  })
  it('marks with a code key and moves on, down or forward', () => {
    expect(attendanceKeyAction(key('a'), STATE)).toEqual({
      type: 'mark',
      code: 'absent',
      to: { row: 2, column: 1 },
    })
    expect(attendanceKeyAction(key('P'), { ...STATE, advance: 'forward' })).toEqual({
      type: 'mark',
      code: 'present',
      to: { row: 1, column: 2 },
    })
    expect(attendanceKeyAction(key('l'), { ...STATE, at: { row: 3, column: 4 } })).toEqual({
      type: 'mark',
      code: 'late',
      to: null,
    })
    // A range is marked as a whole; the focus stays.
    expect(attendanceKeyAction(key('p'), { ...STATE, ranged: true })).toEqual({
      type: 'mark',
      code: 'present',
      to: null,
    })
    expect(attendanceKeyAction(key('z'), STATE)).toBeNull()
  })
  it('clears, fills and moves with Enter in the code mode', () => {
    expect(attendanceKeyAction(key('Delete'), STATE)).toEqual({ type: 'clear' })
    expect(attendanceKeyAction(key('d', { mod: true }), STATE)).toBeNull()
    expect(attendanceKeyAction(key('d', { mod: true }), { ...STATE, ranged: true })).toEqual({
      type: 'fill',
    })
    expect(attendanceKeyAction(key('Enter'), STATE)).toEqual({
      type: 'move',
      to: { row: 2, column: 1 },
    })
    expect(attendanceKeyAction(key('Enter', { shift: true }), STATE)).toBeNull()
  })
  it('edits hours in the hours mode: a digit starts, Enter and F2 open', () => {
    const hours = { ...STATE, mode: 'hours' as const }
    expect(attendanceKeyAction(key('7'), hours)).toEqual({ type: 'edit', text: '7' })
    expect(attendanceKeyAction(key(','), hours)).toEqual({ type: 'edit', text: ',' })
    expect(attendanceKeyAction(key('Enter'), hours)).toEqual({ type: 'edit', text: null })
    expect(attendanceKeyAction(key('F2'), hours)).toEqual({ type: 'edit', text: null })
    expect(attendanceKeyAction(key('a'), hours)).toEqual({
      type: 'mark',
      code: 'absent',
      to: { row: 2, column: 1 },
    })
  })
  it('changes nothing while locked; asks for a correction when offered', () => {
    const locked = { ...STATE, editable: false }
    expect(attendanceKeyAction(key('p'), locked)).toBeNull()
    expect(attendanceKeyAction(key('Delete'), locked)).toBeNull()
    expect(attendanceKeyAction(key('Enter'), locked)).toBeNull()
    expect(attendanceKeyAction(key('ArrowDown'), locked)).toEqual({
      type: 'move',
      to: { row: 2, column: 1 },
    })
    expect(attendanceKeyAction(key('F2'), { ...locked, correctable: true })).toEqual({
      type: 'correct',
    })
  })
  it('leaves headers and totals to their own controls', () => {
    const header = { ...STATE, at: { row: 0, column: 2 } }
    expect(attendanceKeyAction(key('Enter'), header)).toBeNull()
    expect(attendanceKeyAction(key('p'), header)).toBeNull()
    expect(attendanceKeyAction(key('ArrowDown'), header)).toEqual({
      type: 'move',
      to: { row: 1, column: 2 },
    })
  })
})

describe('helpers', () => {
  it('finds a code by its key without letter case', () => {
    expect(codeForKey('A', CODES)).toBe('absent')
    expect(codeForKey('Enter', CODES)).toBeNull()
  })
  it('knows what starts hours', () => {
    expect(['0', '9', '.', ',', '-'].every(startsHours)).toBe(true)
    expect(startsHours('a')).toBe(false)
  })
  it('steps between people inside the list', () => {
    expect(stepPerson(0, -1, 12)).toBe(0)
    expect(stepPerson(2, 1, 12)).toBe(3)
    expect(stepPerson(11, 1, 12)).toBe(11)
  })
})
