import { describe, expect, it } from 'vitest'
import {
  assignChanges,
  cellAtPoint,
  cellConflictTone,
  clockMinutes,
  conflictList,
  crossesMidnight,
  hoursAndMinutes,
  inRange,
  MAX_PERIOD_DAYS,
  moveChange,
  periodDays,
  rangeCells,
  removeChanges,
  rotationAssignments,
  shiftPeriod,
  shiftSpan,
  shiftsByWeek,
  templateForKey,
  templateKey,
  todayPeriod,
  weekStartOf,
  weekdayOf,
  type ShiftAssignment,
} from './shift-logic'

describe('clock times and spans', () => {
  it('reads HH:mm and refuses anything else', () => {
    expect(clockMinutes('07:00')).toBe(420)
    expect(clockMinutes('7:30')).toBe(450)
    expect(clockMinutes('00:00')).toBe(0)
    expect(clockMinutes('24:00')).toBe(1440)
    expect(clockMinutes('24:30')).toBeNull()
    expect(clockMinutes('12:60')).toBeNull()
    expect(clockMinutes('noon')).toBeNull()
    expect(clockMinutes('')).toBeNull()
  })

  it('tells a template that crosses midnight: its end is not after its start', () => {
    expect(crossesMidnight('22:00', '06:00')).toBe(true)
    expect(crossesMidnight('07:00', '07:00')).toBe(true)
    expect(crossesMidnight('07:00', '15:00')).toBe(false)
    expect(crossesMidnight('xx', '06:00')).toBe(false)
  })

  it('measures a span in minutes, across midnight too', () => {
    expect(shiftSpan('07:00', '15:00')).toEqual({ crossesMidnight: false, minutes: 480 })
    expect(shiftSpan('22:00', '06:00')).toEqual({ crossesMidnight: true, minutes: 480 })
    expect(shiftSpan('19:00', '07:00')).toEqual({ crossesMidnight: true, minutes: 720 })
    expect(shiftSpan('07:00', '07:00')).toEqual({ crossesMidnight: true, minutes: 1440 })
    expect(shiftSpan('06:00', '14:20')).toEqual({ crossesMidnight: false, minutes: 500 })
    expect(shiftSpan('06:00', 'later')).toBeNull()
  })

  it('splits minutes into whole hours and the minutes left, never rounding', () => {
    expect(hoursAndMinutes(480)).toEqual({ hours: 8, minutes: 0 })
    expect(hoursAndMinutes(500)).toEqual({ hours: 8, minutes: 20 })
    expect(hoursAndMinutes(59)).toEqual({ hours: 0, minutes: 59 })
  })
})

describe('periods', () => {
  it('lists the days of a period, both ends included', () => {
    expect(periodDays('2026-10-05', '2026-10-11')).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
    ])
    expect(periodDays('2026-02-27', '2026-03-02')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ])
    expect(periodDays('2026-10-11', '2026-10-05')).toEqual([])
    expect(periodDays('2026-01-01', '2026-12-31')).toHaveLength(MAX_PERIOD_DAYS)
  })

  it('finds weekdays and the first day of a week', () => {
    expect(weekdayOf('2026-10-05')).toBe(1)
    expect(weekdayOf('2026-10-11')).toBe(0)
    expect(weekStartOf('2026-10-08', 1)).toBe('2026-10-05')
    expect(weekStartOf('2026-10-05', 1)).toBe('2026-10-05')
    expect(weekStartOf('2026-10-11', 1)).toBe('2026-10-05')
    expect(weekStartOf('2026-10-08', 0)).toBe('2026-10-04')
    expect(weekStartOf('2026-10-08', 6)).toBe('2026-10-03')
  })

  it('moves a period by its own length', () => {
    expect(shiftPeriod('2026-10-05', '2026-10-11', 1)).toEqual({
      start: '2026-10-12',
      end: '2026-10-18',
    })
    expect(shiftPeriod('2026-10-05', '2026-10-11', -1)).toEqual({
      start: '2026-09-28',
      end: '2026-10-04',
    })
    expect(shiftPeriod('2026-10-05', '2026-10-18', 1)).toEqual({
      start: '2026-10-19',
      end: '2026-11-01',
    })
  })

  it('"Today" takes the period of the same length from the first day of today’s week', () => {
    expect(todayPeriod('2026-09-07', '2026-09-13', '2026-10-08', 1)).toEqual({
      start: '2026-10-05',
      end: '2026-10-11',
    })
    expect(todayPeriod('2026-09-07', '2026-09-20', '2026-10-08', 1)).toEqual({
      start: '2026-10-05',
      end: '2026-10-18',
    })
    expect(todayPeriod('2026-09-06', '2026-09-12', '2026-10-08', 0)).toEqual({
      start: '2026-10-04',
      end: '2026-10-10',
    })
  })
})

describe('ranges and keys', () => {
  it('takes the rectangle between two corners in either order', () => {
    expect(rangeCells({ row: 0, column: 1 }, { row: 1, column: 2 })).toEqual([
      { row: 0, column: 1 },
      { row: 0, column: 2 },
      { row: 1, column: 1 },
      { row: 1, column: 2 },
    ])
    expect(rangeCells({ row: 1, column: 2 }, { row: 0, column: 1 })).toHaveLength(4)
    expect(rangeCells({ row: 3, column: 3 }, { row: 3, column: 3 })).toEqual([
      { row: 3, column: 3 },
    ])
    expect(inRange({ row: 1, column: 1 }, { row: 2, column: 0 }, { row: 0, column: 2 })).toBe(true)
    expect(inRange({ row: 3, column: 1 }, { row: 2, column: 0 }, { row: 0, column: 2 })).toBe(false)
  })

  it('gives each template its own key or its position, and finds it without case', () => {
    const templates = [{ id: 'early', key: 'E' }, { id: 'late' }, { id: 'night', key: 'n' }]
    expect(templateKey(templates[0] ?? {}, 0)).toBe('E')
    expect(templateKey(templates[1] ?? {}, 1)).toBe('2')
    expect(templateKey({}, 9)).toBeNull()
    expect(templateForKey(templates, 'e')?.id).toBe('early')
    expect(templateForKey(templates, '2')?.id).toBe('late')
    expect(templateForKey(templates, 'N')?.id).toBe('night')
    expect(templateForKey(templates, '1')).toBeNull()
    expect(templateForKey(templates, 'Enter')).toBeNull()
  })
})

describe('changes', () => {
  const assignments: ShiftAssignment[] = [
    { id: 'a1', rowId: 'ana', date: '2026-10-05', templateId: 'early' },
    { id: 'a2', rowId: 'ana', date: '2026-10-06', templateId: 'late' },
    { id: 'a3', rowId: 'ana', date: '2026-10-06', templateId: 'night' },
  ]

  it('adds a template only where the cell does not already hold it', () => {
    expect(
      assignChanges(
        [
          { rowId: 'ana', date: '2026-10-05' },
          { rowId: 'ana', date: '2026-10-06' },
        ],
        'early',
        assignments,
      ),
    ).toEqual([{ type: 'add', rowId: 'ana', date: '2026-10-06', templateId: 'early' }])
  })

  it('removes every assignment of the cells', () => {
    expect(removeChanges([{ rowId: 'ana', date: '2026-10-06' }], assignments)).toEqual([
      { type: 'remove', assignmentId: 'a2', from: { rowId: 'ana', date: '2026-10-06' } },
      { type: 'remove', assignmentId: 'a3', from: { rowId: 'ana', date: '2026-10-06' } },
    ])
    expect(removeChanges([{ rowId: 'ivan', date: '2026-10-06' }], assignments)).toEqual([])
  })

  it('moves an assignment, and reports nothing for a drop on its own cell', () => {
    const first = assignments[0]
    if (first === undefined) throw new Error('missing assignment')
    expect(moveChange(first, { rowId: 'ivan', date: '2026-10-07' })).toEqual({
      type: 'move',
      assignmentId: 'a1',
      from: { rowId: 'ana', date: '2026-10-05' },
      to: { rowId: 'ivan', date: '2026-10-07' },
    })
    expect(moveChange(first, { rowId: 'ana', date: '2026-10-05' })).toBeNull()
  })
})

describe('rotationAssignments', () => {
  const pattern = { steps: ['early', 'early', 'late', null] }

  it('repeats the pattern day by day and leaves days off empty', () => {
    expect(rotationAssignments(pattern, ['ana'], '2026-10-05', '2026-10-10')).toEqual([
      { rowId: 'ana', date: '2026-10-05', templateId: 'early' },
      { rowId: 'ana', date: '2026-10-06', templateId: 'early' },
      { rowId: 'ana', date: '2026-10-07', templateId: 'late' },
      { rowId: 'ana', date: '2026-10-09', templateId: 'early' },
      { rowId: 'ana', date: '2026-10-10', templateId: 'early' },
    ])
  })

  it('starts each further person the offset later in the pattern', () => {
    const result = rotationAssignments(pattern, ['ana', 'ivan'], '2026-10-05', '2026-10-06', 2)
    expect(result).toEqual([
      { rowId: 'ana', date: '2026-10-05', templateId: 'early' },
      { rowId: 'ana', date: '2026-10-06', templateId: 'early' },
      { rowId: 'ivan', date: '2026-10-05', templateId: 'late' },
    ])
  })

  it('takes a negative offset and generates nothing for an empty pattern or period', () => {
    expect(rotationAssignments(pattern, ['a', 'b'], '2026-10-05', '2026-10-05', -1)).toEqual([
      { rowId: 'a', date: '2026-10-05', templateId: 'early' },
    ])
    expect(rotationAssignments({ steps: [] }, ['a'], '2026-10-05', '2026-10-11')).toEqual([])
    expect(rotationAssignments(pattern, ['a'], '2026-10-11', '2026-10-05')).toEqual([])
  })
})

describe('cellAtPoint', () => {
  const boxes = [
    { rowId: 'ana', date: '2026-10-05', x: 200, y: 40, width: 100, height: 56 },
    { rowId: 'ana', date: '2026-10-06', x: 300, y: 40, width: 100, height: 56 },
  ]
  it('finds the measured cell under the point (no mirroring in right to left)', () => {
    expect(cellAtPoint(boxes, { x: 250, y: 60 })).toEqual({ rowId: 'ana', date: '2026-10-05' })
    expect(cellAtPoint(boxes, { x: 300, y: 95 })).toEqual({ rowId: 'ana', date: '2026-10-06' })
    expect(cellAtPoint(boxes, { x: 150, y: 60 })).toBeNull()
    expect(cellAtPoint(boxes, { x: 250, y: 96 })).toBeNull()
  })
})

describe('conflicts', () => {
  const conflicts = {
    ivan: { '2026-10-06': [{ tone: 'warning' as const, text: 'Weekly hours' }] },
    ana: {
      '2026-10-07': [
        { tone: 'warning' as const, text: 'Rest' },
        { tone: 'danger' as const, text: 'Double booking' },
      ],
      '2026-10-20': [{ tone: 'danger' as const, text: 'Outside the period' }],
    },
  }

  it('lists the shown cells’ conflicts by row order, then day, danger first', () => {
    expect(
      conflictList(conflicts, ['ana', 'ivan'], ['2026-10-05', '2026-10-06', '2026-10-07']),
    ).toEqual([
      { rowId: 'ana', date: '2026-10-07', conflict: { tone: 'danger', text: 'Double booking' } },
      { rowId: 'ana', date: '2026-10-07', conflict: { tone: 'warning', text: 'Rest' } },
      { rowId: 'ivan', date: '2026-10-06', conflict: { tone: 'warning', text: 'Weekly hours' } },
    ])
  })

  it('gives a cell the tone of its worst conflict', () => {
    expect(cellConflictTone(conflicts.ana['2026-10-07'])).toBe('danger')
    expect(cellConflictTone(conflicts.ivan['2026-10-06'])).toBe('warning')
    expect(cellConflictTone([])).toBeNull()
    expect(cellConflictTone(undefined)).toBeNull()
  })
})

describe('shiftsByWeek', () => {
  it('groups shifts by week in time order and names this and next week', () => {
    const shifts = [
      { id: 'c', date: '2026-10-13', start: '14:00' },
      { id: 'b', date: '2026-10-08', start: '22:00' },
      { id: 'a', date: '2026-10-08', start: '06:00' },
      { id: 'd', date: '2026-10-26', start: '06:00' },
    ]
    const weeks = shiftsByWeek(shifts, 1, '2026-10-07')
    expect(weeks.map((week) => [week.start, week.end, week.kind])).toEqual([
      ['2026-10-05', '2026-10-11', 'this'],
      ['2026-10-12', '2026-10-18', 'next'],
      ['2026-10-26', '2026-11-01', 'date'],
    ])
    expect(weeks[0]?.shifts.map((shift) => shift.id)).toEqual(['a', 'b'])
  })
})
