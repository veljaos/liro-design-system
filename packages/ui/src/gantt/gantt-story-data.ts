import { expect, waitFor } from 'storybook/test'
import type { GanttDependency, GanttTask } from './gantt-logic'

/*
 * Gantt's story data (P5.37): a fictitious warehouse extension in phases, tasks and milestones,
 * on 14 October 2026 at 09:40 (the stories' `today` and `now`). Budgets are the application's
 * figures (decimal strings), never computed by the plan. Not part of the package.
 */

export const STORY_TODAY = '2026-10-14'
export const STORY_NOW = '09:40'

export const WAREHOUSE_TASKS: GanttTask[] = [
  {
    id: 'design',
    label: 'Design',
    kind: 'phase',
    start: '2026-07-06',
    end: '2026-08-14',
    progress: '100',
    budget: { planned: '2400000.00', actual: '2310000.00', currency: 'RSD' },
  },
  {
    id: 'survey',
    label: 'Site survey',
    parent: 'design',
    start: '2026-07-06',
    end: '2026-07-17',
    progress: '100',
    assignee: 'Ana Kovač',
  },
  {
    id: 'drawings',
    label: 'Drawings',
    parent: 'design',
    start: '2026-07-20',
    end: '2026-08-12',
    progress: '100',
    assignee: 'Studio Linija',
  },
  {
    id: 'design-approved',
    label: 'Design approved',
    kind: 'milestone',
    parent: 'design',
    start: '2026-08-14',
    end: '2026-08-14',
  },
  {
    id: 'build',
    label: 'Construction',
    kind: 'phase',
    start: '2026-08-31',
    end: '2026-11-27',
    progress: '45',
    budget: {
      planned: '18600000.00',
      actual: '9870000.00',
      currency: 'RSD',
    },
  },
  {
    id: 'foundations',
    label: 'Foundations',
    parent: 'build',
    start: '2026-08-31',
    end: '2026-09-25',
    progress: '100',
    assignee: 'Crew Petrović',
  },
  {
    id: 'frame',
    label: 'Steel frame',
    parent: 'build',
    start: '2026-09-28',
    end: '2026-10-30',
    progress: '40',
    assignee: 'Crew Ilić',
    state: { label: 'At risk', tone: 'warning' },
  },
  {
    id: 'roof',
    label: 'Roof and walls',
    parent: 'build',
    start: '2026-11-02',
    end: '2026-11-27',
    progress: '0',
    assignee: 'Crew Ilić',
  },
  {
    id: 'handover',
    label: 'Handover',
    kind: 'phase',
    start: '2026-11-30',
    end: '2026-12-11',
    progress: '0',
    budget: { planned: '350000.00', actual: null, currency: 'RSD' },
  },
  {
    id: 'inspection',
    label: 'Technical inspection',
    parent: 'handover',
    start: '2026-11-30',
    end: '2026-12-09',
    progress: '0',
    assignee: 'Marko Jelić',
  },
  {
    id: 'opened',
    label: 'Warehouse opened',
    kind: 'milestone',
    parent: 'handover',
    start: '2026-12-11',
    end: '2026-12-11',
  },
]

export const WAREHOUSE_DEPENDENCIES: GanttDependency[] = [
  { id: 'd1', from: 'survey', to: 'drawings' },
  { id: 'd2', from: 'drawings', to: 'design-approved' },
  { id: 'd3', from: 'design-approved', to: 'foundations' },
  { id: 'd4', from: 'foundations', to: 'frame' },
  { id: 'd5', from: 'frame', to: 'roof' },
  { id: 'd6', from: 'roof', to: 'inspection' },
  { id: 'd7', from: 'inspection', to: 'opened' },
]

/** The same plan without budgets (the table has no money columns). */
export const PLAIN_TASKS: GanttTask[] = WAREHOUSE_TASKS.map((task) => {
  const copy = { ...task }
  delete copy.budget
  return copy
})

/** Long names: cut with "…" in the table and on the bars, whole in the list and the names. */
export const LONG_TASKS: GanttTask[] = WAREHOUSE_TASKS.map((task) =>
  task.id === 'frame'
    ? {
        ...task,
        label:
          'Steel frame of the northern hall, with the crane runway and the fire-protection coating of every beam',
        assignee: 'Crew Ilić together with Elektro Sistem d.o.o. for the crane’s power supply',
      }
    : task.id === 'build'
      ? { ...task, label: 'Construction of the extension, from the foundations to the roof' }
      : task,
)

const ARABIC_LABELS: Readonly<Record<string, string>> = {
  design: 'التصميم',
  survey: 'مسح الموقع',
  drawings: 'الرسومات',
  'design-approved': 'اعتماد التصميم',
  build: 'البناء',
  foundations: 'الأساسات',
  frame: 'الهيكل الفولاذي',
  roof: 'السقف والجدران',
  handover: 'التسليم',
  inspection: 'الفحص الفني',
  opened: 'افتتاح المستودع',
}

const JAPANESE_LABELS: Readonly<Record<string, string>> = {
  design: '設計',
  survey: '現地調査',
  drawings: '図面作成',
  'design-approved': '設計承認',
  build: '建設',
  foundations: '基礎工事',
  frame: '鉄骨工事',
  roof: '屋根と外壁',
  handover: '引き渡し',
  inspection: '技術検査',
  opened: '倉庫開設',
}

function relabel(labels: Readonly<Record<string, string>>, people: string): GanttTask[] {
  return PLAIN_TASKS.map((task) => ({
    ...task,
    label: labels[task.id] ?? task.label,
    ...(task.assignee === undefined ? {} : { assignee: people }),
    ...(task.state === undefined
      ? {}
      : { state: { ...task.state, label: people === 'فريق البناء' ? 'معرض للخطر' : '要注意' } }),
  }))
}

export const ARABIC_TASKS: GanttTask[] = relabel(ARABIC_LABELS, 'فريق البناء')
export const JAPANESE_TASKS: GanttTask[] = relabel(JAPANESE_LABELS, '施工チーム')

/** Waits until the plan has drawn its timeline (the "now" marker placed, today in view). */
export async function ganttReady(canvasElement: HTMLElement): Promise<void> {
  await waitFor(async () => {
    await expect(canvasElement.querySelector('[data-slot="gantt"][data-ready]')).not.toBeNull()
  })
}
