import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  barLabelPlace,
  NOW_TAG_GAP,
  nowTagStart,
  openingScroll,
  applyGanttChange,
  chartDate,
  chartEnd,
  chartRange,
  dayOfChartDate,
  dependencyCandidates,
  dependencyType,
  dependsOn,
  draggedDates,
  dragChange,
  durationDays,
  forbiddenGanttPackages,
  ganttRows,
  isProgress,
  linkType,
  movedDates,
  nextDependencyId,
  nowPosition,
  phaseGroups,
  predecessors,
  progressWidth,
  type GanttDependency,
  type GanttTask,
} from './gantt-logic'

const BUILD: GanttTask = {
  id: 'b',
  label: 'Build',
  kind: 'phase',
  start: '2026-09-01',
  end: '2026-10-30',
}
const FRAME: GanttTask = {
  id: 'b1',
  label: 'Frame',
  parent: 'b',
  start: '2026-09-28',
  end: '2026-10-30',
}
const MILESTONE: GanttTask = {
  id: 'm',
  label: 'Done',
  kind: 'milestone',
  parent: 'b',
  start: '2026-10-30',
  end: '2026-10-30',
}

const TASKS: GanttTask[] = [
  BUILD,
  { id: 'a1', label: 'Survey', parent: 'a', start: '2026-07-06', end: '2026-07-17' },
  { id: 'a', label: 'Design', kind: 'phase', start: '2026-07-06', end: '2026-08-14' },
  FRAME,
  { id: 'loose', label: 'Loose', start: '2026-08-01', end: '2026-08-02' },
  MILESTONE,
  { id: 'orphan', label: 'Orphan', parent: 'nowhere', start: '2026-08-01', end: '2026-08-01' },
]

const DEPENDENCIES: GanttDependency[] = [
  { id: 'd1', from: 'a1', to: 'b1' },
  { id: 'd2', from: 'b1', to: 'm', type: 'finish-to-finish' },
]

describe('ganttRows', () => {
  it('puts each phase before its own rows, in the order given', () => {
    expect(ganttRows(TASKS).map((row) => [row.task.id, row.level, row.phase?.id])).toEqual([
      ['b', 0, undefined],
      ['b1', 1, 'b'],
      ['m', 1, 'b'],
      ['a', 0, undefined],
      ['a1', 1, 'a'],
      ['loose', 0, undefined],
      ['orphan', 0, undefined],
    ])
  })

  it('groups the rows by phase for the list', () => {
    expect(
      phaseGroups(TASKS).map((group) => [group.phase?.id ?? null, group.rows.map((t) => t.id)]),
    ).toEqual([
      ['b', ['b1', 'm']],
      ['a', ['a1']],
      [null, ['loose']],
      [null, ['orphan']],
    ])
  })
})

describe('dates', () => {
  it('converts to and from the chart’s local dates, the end exclusive', () => {
    expect(dayOfChartDate(chartDate('2026-03-29'))).toBe('2026-03-29')
    expect(dayOfChartDate(chartEnd(BUILD))).toBe('2026-10-31')
    // A milestone ends where it starts.
    expect(dayOfChartDate(chartEnd(MILESTONE))).toBe('2026-10-30')
  })

  it('counts a row’s days, both ends included', () => {
    expect(durationDays(FRAME)).toBe(33)
    expect(durationDays(MILESTONE)).toBe(0)
  })

  it('moves a row keeping its length', () => {
    expect(movedDates(FRAME, '2026-10-05')).toEqual({
      start: '2026-10-05',
      end: '2026-11-06',
    })
  })

  it('moves a row or one of its edges by whole days, an edge never past the other', () => {
    const task = FRAME
    expect(draggedDates(task, 'move', 7)).toEqual({ start: '2026-10-05', end: '2026-11-06' })
    expect(draggedDates(task, 'start', -3)).toEqual({ start: '2026-09-25', end: '2026-10-30' })
    expect(draggedDates(task, 'end', 2)).toEqual({ start: '2026-09-28', end: '2026-11-01' })
    expect(draggedDates(task, 'start', 99)).toEqual({ start: '2026-10-30', end: '2026-10-30' })
    expect(draggedDates(task, 'end', -99)).toEqual({ start: '2026-09-28', end: '2026-09-28' })
    // A milestone always moves whole.
    expect(draggedDates(MILESTONE, 'end', 1)).toEqual({
      start: '2026-10-31',
      end: '2026-10-31',
    })
  })

  it('reads a drag from the chart library’s update', () => {
    const task = FRAME
    const some = new Date(2026, 0, 1)
    expect(dragChange(task, { start: some, end: some }, 7)).toEqual({
      type: 'dates',
      id: 'b1',
      start: '2026-10-05',
      end: '2026-11-06',
    })
    expect(dragChange(task, { end: some }, -2)).toEqual({
      type: 'dates',
      id: 'b1',
      start: '2026-09-28',
      end: '2026-10-28',
    })
    expect(dragChange(task, { start: some }, 0)).toBeNull()
    expect(dragChange(task, {}, 3)).toBeNull()
    expect(dragChange(task, { start: some }, undefined)).toBeNull()
  })

  it('shows whole months around the plan, or a few days', () => {
    expect(chartRange(TASKS, 'months', '2026-10-14')).toEqual({
      start: '2026-06-01',
      end: '2026-12-01',
    })
    expect(chartRange(TASKS, 'days', '2026-10-14')).toEqual({
      start: '2026-07-03',
      end: '2026-11-03',
    })
    expect(chartRange([], 'months', '2026-12-14')).toEqual({
      start: '2026-11-01',
      end: '2027-02-01',
    })
    expect(chartRange([], 'months', '2026-01-14')).toEqual({
      start: '2025-12-01',
      end: '2026-03-01',
    })
  })

  it('places "now" inside its day by the minutes passed', () => {
    expect(nowPosition(100, 124, 0)).toBe(100)
    expect(nowPosition(100, 124, 720)).toBe(112)
    expect(nowPosition(100, 124, 2000)).toBe(124)
  })
})

describe('progress', () => {
  it('accepts a decimal string from 0 to 100 only', () => {
    expect(isProgress('0')).toBe(true)
    expect(isProgress('100')).toBe(true)
    expect(isProgress('45.5')).toBe(true)
    expect(isProgress('100.01')).toBe(false)
    expect(isProgress('-1')).toBe(false)
    expect(isProgress('abc')).toBe(false)
    expect(isProgress(null)).toBe(false)
    expect(isProgress(undefined)).toBe(false)
  })

  it('gives the chart a width, 0 for anything unreadable', () => {
    expect(progressWidth('45.5')).toBe(45.5)
    expect(progressWidth('x')).toBe(0)
  })
})

describe('dependencies', () => {
  it('names the four kinds both ways', () => {
    expect(linkType(undefined)).toBe('e2s')
    expect(linkType('start-to-start')).toBe('s2s')
    expect(linkType('finish-to-finish')).toBe('e2e')
    expect(linkType('start-to-finish')).toBe('s2e')
    expect(dependencyType('s2s')).toBe('start-to-start')
    expect(dependencyType('e2e')).toBe('finish-to-finish')
    expect(dependencyType('s2e')).toBe('start-to-finish')
    expect(dependencyType('e2s')).toBe('finish-to-start')
    expect(dependencyType('?')).toBe('finish-to-start')
  })

  it('finds what a row comes after, directly or through others', () => {
    expect(predecessors(DEPENDENCIES, 'm').map((each) => each.from)).toEqual(['b1'])
    expect(dependsOn(DEPENDENCIES, 'm', 'a1')).toBe(true)
    expect(dependsOn(DEPENDENCIES, 'a1', 'm')).toBe(false)
  })

  it('offers no loop, no own phase, nothing already followed', () => {
    expect(dependencyCandidates(TASKS, DEPENDENCIES, 'a1').map((task) => task.id)).toEqual([
      'b',
      'loose',
      'orphan',
    ])
    expect(dependencyCandidates(TASKS, DEPENDENCIES, 'b1').map((task) => task.id)).toEqual([
      'a',
      'loose',
      'orphan',
    ])
    expect(dependencyCandidates(TASKS, DEPENDENCIES, 'missing')).toEqual([])
  })
})

describe('applyGanttChange', () => {
  const model = { tasks: TASKS, dependencies: DEPENDENCIES }

  it('applies dates and progress to their row only', () => {
    const moved = applyGanttChange(model, {
      type: 'dates',
      id: 'b1',
      start: '2026-10-05',
      end: '2026-11-06',
    })
    expect(moved.tasks.find((task) => task.id === 'b1')?.start).toBe('2026-10-05')
    expect(moved.tasks.find((task) => task.id === 'b')?.start).toBe('2026-09-01')
    const done = applyGanttChange(model, { type: 'progress', id: 'b1', progress: '60' })
    expect(done.tasks.find((task) => task.id === 'b1')?.progress).toBe('60')
  })

  it('adds a dependency with a free id and removes one', () => {
    expect(nextDependencyId(DEPENDENCIES)).toBe('dependency-3')
    expect(nextDependencyId([{ id: 'dependency-2', from: 'x', to: 'y' }])).toBe('dependency-3')
    const added = applyGanttChange(model, {
      type: 'add-dependency',
      from: 'loose',
      to: 'b1',
      dependencyType: 'start-to-start',
    })
    expect(added.dependencies.at(-1)).toEqual({
      id: 'dependency-3',
      from: 'loose',
      to: 'b1',
      type: 'start-to-start',
    })
    const removed = applyGanttChange(model, { type: 'remove-dependency', id: 'd1' })
    expect(removed.dependencies.map((each) => each.id)).toEqual(['d2'])
  })
})

describe('the lockfile (P5.37)', () => {
  it('finds SVAR’s trial builds and the GPLv3 wx-react-gantt', () => {
    expect(
      forbiddenGanttPackages(
        [
          "  '@svar-ui/react-gantt@2.7.3':",
          "  '@svar-ui/trial-react-gantt@2.8.0':",
          '  wx-react-gantt@1.3.1:',
          "  '@svar-ui/trial-gantt-store@2.8.0':",
          "  '@svar-ui/trial-react-gantt@2.8.0':",
        ].join('\n'),
      ),
    ).toEqual(['@svar-ui/trial-react-gantt', 'wx-react-gantt', '@svar-ui/trial-gantt-store'])
    expect(forbiddenGanttPackages("  '@svar-ui/react-gantt@2.7.3':\n")).toEqual([])
  })

  it('holds neither: only the MIT edition of SVAR React Gantt is installed', () => {
    const lockfile = readFileSync(new URL('../../../../pnpm-lock.yaml', import.meta.url), 'utf8')
    expect(lockfile).toContain("'@svar-ui/react-gantt@2.7.3'")
    expect(forbiddenGanttPackages(lockfile)).toEqual([])
  })
})

describe('where the date of "now" stands on the scale (P5.94 item 6)', () => {
  it('is centred on the line when it covers no label', () => {
    expect(nowTagStart(400, 70, [{ start: 12, end: 40 }], 1200)).toBe(365)
    expect(nowTagStart(400, 70, [], 1200)).toBe(365)
  })
  it('steps aside from a label it would cover, to the nearest side, by the gap', () => {
    // The year's label from 380 to 410: after it (416) is nearer than before it (304).
    expect(nowTagStart(400, 70, [{ start: 380, end: 410 }], 1200)).toBe(410 + NOW_TAG_GAP)
    // A label after the line: the tag goes before it.
    expect(nowTagStart(400, 70, [{ start: 420, end: 450 }], 1200)).toBe(420 - NOW_TAG_GAP - 70)
  })
  it('stays inside the scale', () => {
    expect(nowTagStart(10, 70, [], 1200)).toBe(0)
    expect(nowTagStart(1195, 70, [], 1200)).toBe(1130)
    // Squeezed at the start by a label: after the label.
    expect(nowTagStart(10, 70, [{ start: 0, end: 30 }], 1200)).toBe(30 + NOW_TAG_GAP)
  })
})

describe('where the chart opens (P5.93 item 34)', () => {
  it("opens at the plan's start when today is in view there", () => {
    expect(openingScroll(300, 64, 800)).toBe(0)
    expect(openingScroll(null, 64, 800)).toBe(0)
  })
  it("opens at the column before today's when today is further on, on a column edge", () => {
    // Today at 700px in columns of 64px: its column starts at 640, the one before at 576.
    expect(openingScroll(700, 64, 400)).toBe(576)
    expect(openingScroll(70, 64, 40)).toBe(0)
  })
})

describe("where a bar's name stands (P5.93 item 34)", () => {
  it('inside when it fits, after the bar when it does not', () => {
    expect(barLabelPlace({ x: 100, width: 120 }, 80, 1000)).toBe('inside')
    expect(barLabelPlace({ x: 100, width: 60 }, 80, 1000)).toBe('after')
  })
  it("before a bar at the chart's end", () => {
    expect(barLabelPlace({ x: 900, width: 60 }, 80, 1000)).toBe('before')
  })
  it('never inside a milestone; after it when neither side has room', () => {
    expect(barLabelPlace({ x: 100, width: 200 }, 20, 1000, false)).toBe('after')
    expect(barLabelPlace({ x: 10, width: 20 }, 300, 320)).toBe('after')
  })
})
