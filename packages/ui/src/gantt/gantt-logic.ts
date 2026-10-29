import type { Tone } from '../components/status-badge'
import { compareDecimal } from '../components/quantity-logic'
import { addDays, dayNumber } from '../components/schedule-logic'

/*
 * The logic of Gantt (BUILD-PLAN P5.37), apart from the markup so it can be unit-tested (AGENTS.md
 * C7). Dates are YYYY-MM-DD strings read as written; a task's `end` is its last day (included), a
 * milestone's `end` is its `start`. The chart library (SVAR React Gantt) counts in local `Date`
 * objects with an exclusive end; `chartStart` / `chartEnd` / `dayOfChartDate` convert at the edge,
 * so nothing here reads the device's clock or zone. Progress and money are decimal strings; the
 * library compares them exactly (`compareDecimal`) and never adds, rounds or converts them (D4).
 */

/** A row of the plan: a phase (groups tasks, drawn as a summary bar), a task or a milestone. */
export type GanttTaskKind = 'phase' | 'task' | 'milestone'

export const GANTT_TASK_KINDS: readonly GanttTaskKind[] = ['phase', 'task', 'milestone']

/** A state the application gives a row ("At risk", "Late"), shown in words with its tone. */
export interface GanttState {
  label: string
  tone: Tone
}

/** A phase's money: what was planned and what was spent, as the application has them (D4). */
export interface GanttBudget {
  /** Decimal string, or null when not set ("—"). */
  planned: string | null
  /** Decimal string, or null when nothing was booked yet ("—"). */
  actual: string | null
  currency: string
  /** The application's verdict ("Over budget"), in words and a tone; never computed here. */
  state?: GanttState
}

export interface GanttTask {
  id: string
  label: string
  /** Default 'task'. */
  kind?: GanttTaskKind
  /** The phase it belongs to (a row of kind 'phase'). */
  parent?: string
  /** YYYY-MM-DD. */
  start: string
  /** YYYY-MM-DD, its last day (included). A milestone's is its start. */
  end: string
  /** Done, as a percentage in a decimal string ("60"); null or absent when not reported. */
  progress?: string | null
  /** Who does it: a person, a crew or a company, as the application names them. */
  assignee?: string
  state?: GanttState
  /** Planned against spent, beside the timeline (phases, usually). */
  budget?: GanttBudget
}

/** How one row depends on another (the four kinds of a plan). */
export type GanttDependencyType =
  'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish'

export const GANTT_DEPENDENCY_TYPES: readonly GanttDependencyType[] = [
  'finish-to-start',
  'start-to-start',
  'finish-to-finish',
  'start-to-finish',
]

/** `to` depends on `from`: by default it starts when `from` finishes. */
export interface GanttDependency {
  id: string
  from: string
  to: string
  /** Default 'finish-to-start'. */
  type?: GanttDependencyType
}

/**
 * An edit, reported through `onChange`; the plan never changes itself. The application applies it
 * (moving the dependants, recomputing the phases) and passes the new rows back.
 */
export type GanttChange =
  | { type: 'dates'; id: string; start: string; end: string }
  | { type: 'progress'; id: string; progress: string }
  | { type: 'add-dependency'; from: string; to: string; dependencyType: GanttDependencyType }
  | { type: 'remove-dependency'; id: string }

/** How far apart the chart draws time: a column a day, or a column a month. */
export type GanttScale = 'days' | 'months'

export const GANTT_SCALES: readonly GanttScale[] = ['days', 'months']

/** A row as drawn: the task, how deep it stands, and its phase. */
export interface GanttRow {
  task: GanttTask
  /** 0 for a row without a phase, 1 inside one. */
  level: number
  phase?: GanttTask
}

/** The kind of a row; 'task' when absent. */
export function kindOf(task: GanttTask): GanttTaskKind {
  return task.kind ?? 'task'
}

/**
 * The rows in drawing order: each row in the order given, a phase followed at once by its own rows
 * (in their order). A row whose parent is unknown stands at the top level.
 */
export function ganttRows(tasks: readonly GanttTask[]): GanttRow[] {
  const byId = new Map(tasks.map((task) => [task.id, task]))
  const children = new Map<string, GanttTask[]>()
  const top: GanttTask[] = []
  for (const task of tasks) {
    const parent = task.parent === undefined ? undefined : byId.get(task.parent)
    if (parent === undefined || parent.id === task.id) {
      top.push(task)
    } else {
      const list = children.get(parent.id) ?? []
      list.push(task)
      children.set(parent.id, list)
    }
  }
  const rows: GanttRow[] = []
  const seen = new Set<string>()
  const visit = (task: GanttTask, level: number, phase: GanttTask | undefined) => {
    if (seen.has(task.id)) return
    seen.add(task.id)
    rows.push(phase === undefined ? { task, level } : { task, level, phase })
    for (const child of children.get(task.id) ?? []) visit(child, level + 1, task)
  }
  for (const task of top) visit(task, 0, undefined)
  return rows
}

/** The phases with their own rows, in order: the phone's list. Rows outside a phase come alone. */
export function phaseGroups(
  tasks: readonly GanttTask[],
): { phase: GanttTask | null; rows: GanttTask[] }[] {
  const groups: { phase: GanttTask | null; rows: GanttTask[] }[] = []
  for (const row of ganttRows(tasks)) {
    if (row.level === 0) {
      groups.push(
        kindOf(row.task) === 'phase'
          ? { phase: row.task, rows: [] }
          : { phase: null, rows: [row.task] },
      )
    } else {
      groups.at(-1)?.rows.push(row.task)
    }
  }
  return groups
}

// ── Dates ─────────────────────────────────────────────────────────────────────────────────────

/** The local midnight of a YYYY-MM-DD date, as the chart library counts. */
export function chartDate(day: string): Date {
  const [year = 1970, month = 1, date = 1] = day.split('-').map(Number)
  return new Date(year, month - 1, date)
}

/** The YYYY-MM-DD date of a chart library's local date. */
export function dayOfChartDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** The chart's end of a row: the midnight after its last day (a milestone: its day). */
export function chartEnd(task: GanttTask): Date {
  return chartDate(kindOf(task) === 'milestone' ? task.start : addDays(task.end, 1))
}

/** How many days a row lasts, its first and last day included (a milestone: 0). */
export function durationDays(task: GanttTask): number {
  return kindOf(task) === 'milestone' ? 0 : dayNumber(task.end) - dayNumber(task.start) + 1
}

/** The dates of a row moved to start on `start`: it keeps its length. */
export function movedDates(task: GanttTask, start: string): { start: string; end: string } {
  const length = dayNumber(task.end) - dayNumber(task.start)
  return { start, end: addDays(start, Math.max(0, length)) }
}

/** Which edge a drag took: the whole bar, its start or its end. */
export type GanttDragEdge = 'move' | 'start' | 'end'

/**
 * The dates after a drag by `days` whole days: the whole row, or one edge. An edge never passes
 * the other (a row keeps at least its one day); a milestone always moves whole.
 */
export function draggedDates(
  task: GanttTask,
  edge: GanttDragEdge,
  days: number,
): { start: string; end: string } {
  if (edge === 'move' || kindOf(task) === 'milestone') {
    return { start: addDays(task.start, days), end: addDays(task.end, days) }
  }
  if (edge === 'start') {
    const start = addDays(task.start, days)
    return { start: dayNumber(start) > dayNumber(task.end) ? task.end : start, end: task.end }
  }
  const end = addDays(task.end, days)
  return { start: task.start, end: dayNumber(end) < dayNumber(task.start) ? task.start : end }
}

/**
 * Reads the chart library's update after a drag: `diff` whole days, and which dates it carried
 * (both when the whole bar moved, one when an edge did). Null when it changed no date.
 */
export function dragChange(
  task: GanttTask,
  update: { start?: unknown; end?: unknown },
  diff: number | undefined,
): Extract<GanttChange, { type: 'dates' }> | null {
  if (diff === undefined || diff === 0 || !Number.isFinite(diff)) return null
  const hasStart = update.start !== undefined
  const hasEnd = update.end !== undefined
  if (!hasStart && !hasEnd) return null
  const edge: GanttDragEdge = hasStart && hasEnd ? 'move' : hasStart ? 'start' : 'end'
  const dates = draggedDates(task, edge, diff)
  if (dates.start === task.start && dates.end === task.end) return null
  return { type: 'dates', id: task.id, ...dates }
}

/** The days the chart shows: from the first row's start to the last row's end, with room around. */
export function chartRange(
  tasks: readonly GanttTask[],
  scale: GanttScale,
  today: string,
): { start: string; end: string } {
  const days = tasks.flatMap((task) => [task.start, task.end])
  if (days.length === 0) days.push(today)
  const first = days.reduce((a, b) => (dayNumber(b) < dayNumber(a) ? b : a))
  const last = days.reduce((a, b) => (dayNumber(b) > dayNumber(a) ? b : a))
  if (scale === 'days') return { start: addDays(first, -3), end: addDays(last, 4) }
  // Whole months, one before and one after.
  const [fy = 1970, fm = 1] = first.split('-').map(Number)
  const [ly = 1970, lm = 1] = last.split('-').map(Number)
  const before = fm === 1 ? { y: fy - 1, m: 12 } : { y: fy, m: fm - 1 }
  const after = lm >= 11 ? { y: ly + 1, m: lm - 10 } : { y: ly, m: lm + 2 }
  const pad = (value: number) => String(value).padStart(2, '0')
  return {
    start: `${String(before.y)}-${pad(before.m)}-01`,
    end: `${String(after.y)}-${pad(after.m)}-01`,
  }
}

/**
 * Where "now" stands on the chart, px: between where today starts (`todayX`) and where tomorrow
 * starts (`tomorrowX`), by the part of the day that has passed (`minutes` since midnight).
 */
export function nowPosition(todayX: number, tomorrowX: number, minutes: number): number {
  const part = Math.min(Math.max(minutes, 0), 1440) / 1440
  return todayX + (tomorrowX - todayX) * part
}

/**
 * Where the chart opens (P5.93 item 34), as its scroll from the start, px: at the plan's start
 * when today is in view there; otherwise at the start of the column before today's, so "now" and
 * what comes next are in view and no column is cut at the edge. `todayX` null (no `now`, or out
 * of the plan): the plan's start.
 */
export function openingScroll(todayX: number | null, column: number, visible: number): number {
  if (todayX === null || column <= 0) return 0
  // Today and the column after it fit beside the plan's start: open at the start.
  if (todayX + column <= visible) return 0
  return Math.max(0, (Math.floor(todayX / column) - 1) * column)
}

/** The room between the "now" tag and a scale label it steps aside from, px. */
export const NOW_TAG_GAP = 6

/** A label's text along the time axis, px from the scale's start. */
export interface ScaleLabelExtent {
  start: number
  end: number
}

/**
 * Where the date of "now" starts on the scale's upper row (P5.94 item 6), px from the scale's
 * start: centred on the line, unless that would cover a label of the row (the year, the month
 * and year); then the nearest place beside that label that covers none, kept inside the scale
 * (`room`, its width). The tag covers no text: the months' names under it stay readable.
 */
export function nowTagStart(
  line: number,
  width: number,
  labels: readonly ScaleLabelExtent[],
  room: number,
): number {
  const keep = (at: number) => Math.min(Math.max(at, 0), Math.max(room - width, 0))
  const centred = keep(line - width / 2)
  const free = (at: number) => labels.every((label) => at + width <= label.start || at >= label.end)
  const candidates = [
    centred,
    ...labels.flatMap((label) => [
      keep(label.end + NOW_TAG_GAP),
      keep(label.start - NOW_TAG_GAP - width),
    ]),
  ].filter(free)
  let best = candidates[0] ?? centred
  for (const at of candidates) {
    if (Math.abs(at - centred) < Math.abs(best - centred)) best = at
  }
  return best
}

/** Where a bar's name stands: inside the bar, after it, or before it. */
export type BarLabelPlace = 'inside' | 'after' | 'before'

/** The room a name takes beside a bar besides its text, px: the gap and the tag's padding. */
export const BAR_LABEL_ROOM = 14
/** The padding of a name inside a bar, px. */
export const BAR_LABEL_PADDING = 16

/**
 * Where a bar's name stands (P5.93 item 34): never cut. Inside the bar when it fits (a milestone
 * never holds it); otherwise after the bar when the chart has room there, else before the bar
 * (a bar at the chart's end); after it when neither side has the room.
 */
export function barLabelPlace(
  bar: { x: number; width: number },
  text: number,
  chart: number,
  canHold = true,
): BarLabelPlace {
  if (canHold && text + BAR_LABEL_PADDING <= bar.width) return 'inside'
  if (bar.x + bar.width + text + BAR_LABEL_ROOM <= chart) return 'after'
  if (bar.x - text - BAR_LABEL_ROOM >= 0) return 'before'
  return 'after'
}

// ── Progress ──────────────────────────────────────────────────────────────────────────────────

const DECIMAL = /^-?\d+(\.\d+)?$/

/** Whether a progress is one the plan can show: a decimal string from 0 to 100. */
export function isProgress(value: string | null | undefined): value is string {
  if (value === null || value === undefined || !DECIMAL.test(value)) return false
  return compareDecimal(value, '0') >= 0 && compareDecimal(value, '100') <= 0
}

/** The progress as a width for the chart only (D4: never added, never shown from this number). */
export function progressWidth(value: string | null | undefined): number {
  return isProgress(value) ? Number(value) : 0
}

// ── Dependencies ──────────────────────────────────────────────────────────────────────────────

const LINK_TYPES: Readonly<Record<GanttDependencyType, 'e2s' | 's2s' | 'e2e' | 's2e'>> = {
  'finish-to-start': 'e2s',
  'start-to-start': 's2s',
  'finish-to-finish': 'e2e',
  'start-to-finish': 's2e',
}

/** The chart library's name of a dependency's type. */
export function linkType(type: GanttDependencyType | undefined): 'e2s' | 's2s' | 'e2e' | 's2e' {
  return LINK_TYPES[type ?? 'finish-to-start']
}

/** A dependency's type from the chart library's name; finish-to-start for anything unknown. */
export function dependencyType(link: string | undefined): GanttDependencyType {
  const found = GANTT_DEPENDENCY_TYPES.find((type) => LINK_TYPES[type] === link)
  return found ?? 'finish-to-start'
}

/** The rows a row follows (its dependencies where it is `to`), in the order given. */
export function predecessors(
  dependencies: readonly GanttDependency[],
  id: string,
): GanttDependency[] {
  return dependencies.filter((dependency) => dependency.to === id)
}

/** Whether `to` already depends on `from`, directly or through others. */
export function dependsOn(
  dependencies: readonly GanttDependency[],
  to: string,
  from: string,
): boolean {
  const seen = new Set<string>()
  const queue = [to]
  while (queue.length > 0) {
    const current = queue.shift()
    if (current === undefined || seen.has(current)) continue
    seen.add(current)
    for (const dependency of dependencies) {
      if (dependency.to !== current) continue
      if (dependency.from === from) return true
      queue.push(dependency.from)
    }
  }
  return false
}

/**
 * The rows `id` may follow: not itself, not its own phase or a row of its own phase when it is a
 * phase, not one it already follows, and not one that already follows it (no loop).
 */
export function dependencyCandidates(
  tasks: readonly GanttTask[],
  dependencies: readonly GanttDependency[],
  id: string,
): GanttTask[] {
  const task = tasks.find((each) => each.id === id)
  if (task === undefined) return []
  return tasks.filter((candidate) => {
    if (candidate.id === id) return false
    if (task.parent === candidate.id || candidate.parent === id) return false
    if (dependencies.some((each) => each.from === candidate.id && each.to === id)) return false
    return !dependsOn(dependencies, candidate.id, id)
  })
}

// ── Applying a change (what an application does) ─────────────────────────────────────────────

export interface GanttModel {
  tasks: readonly GanttTask[]
  dependencies: readonly GanttDependency[]
}

/** The first free id "dependency-N". */
export function nextDependencyId(dependencies: readonly GanttDependency[]): string {
  const taken = new Set(dependencies.map((each) => each.id))
  let number = dependencies.length + 1
  while (taken.has(`dependency-${String(number)}`)) number += 1
  return `dependency-${String(number)}`
}

/**
 * The plan with one change applied, as an application might before saving: a row's dates or
 * progress, a dependency added or removed. Phases are not recomputed and dependants are not moved;
 * that scheduling is the application's.
 */
export function applyGanttChange(model: GanttModel, change: GanttChange): GanttModel {
  switch (change.type) {
    case 'dates':
      return {
        ...model,
        tasks: model.tasks.map((task) =>
          task.id === change.id ? { ...task, start: change.start, end: change.end } : task,
        ),
      }
    case 'progress':
      return {
        ...model,
        tasks: model.tasks.map((task) =>
          task.id === change.id ? { ...task, progress: change.progress } : task,
        ),
      }
    case 'add-dependency':
      return {
        ...model,
        dependencies: [
          ...model.dependencies,
          {
            id: nextDependencyId(model.dependencies),
            from: change.from,
            to: change.to,
            type: change.dependencyType,
          },
        ],
      }
    case 'remove-dependency':
      return {
        ...model,
        dependencies: model.dependencies.filter((each) => each.id !== change.id),
      }
  }
}

// ── The lockfile guard (P5.37) ────────────────────────────────────────────────────────────────

/**
 * The packages a lockfile must never hold: SVAR's trial builds (`@svar-ui/trial-*`, a paid licence)
 * and the old GPLv3 `wx-react-gantt`. Returns each forbidden name found, once.
 */
export function forbiddenGanttPackages(lockfile: string): string[] {
  const found = new Set<string>()
  for (const match of lockfile.matchAll(/@svar-ui\/trial-[a-z0-9-]+|(?<![\w/-])wx-react-gantt/g)) {
    found.add(match[0])
  }
  return [...found]
}
