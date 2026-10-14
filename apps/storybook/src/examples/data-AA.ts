/*
 * Group AA's example data (P5.37): Kvadrat Gradnja d.o.o.'s project "Residential building Liman 4"
 * in Novi Sad on 14.10.2026 at 09:40 — nine phases from design to handover, their tasks and
 * milestones, the dependencies, and each phase's budget against what was spent (RSD). The fourth
 * floor's slab is poured at night on 15.10. (Nikola Marković's changed shift, group Y). Fictitious:
 * every name, date and amount is invented and illustrative. The scheduling — a phase spans its
 * tasks — and every total are the application's work (`applyPlanChange`); the plan only shows
 * them and reports changes. Not part of the package.
 */
import type { GanttChange, GanttDependency, GanttTask } from '../../../../packages/ui/src/gantt'
import { applyGanttChange } from '../../../../packages/ui/src/gantt'

export const AA_TODAY = '2026-10-14'
export const AA_NOW = '09:40'

export const AA_ROUTES = {
  timeline: '/projects/liman-4/timeline',
  /** The same with Move… open on Floors 3–4, as the application restores it. */
  move: '/projects/liman-4/timeline?move=floors-3-4',
  /** A column a day. */
  days: '/projects/liman-4/timeline?scale=days',
} as const

export const PROJECT = {
  name: 'Residential building Liman 4',
  place: 'Bulevar cara Lazara 4, Novi Sad (illustrative)',
  manager: 'Snežana Popović',
  handover: '2027-05-28',
  /** The application's totals of the phases below. */
  planned: '249000000.00',
  spent: '112295000.00',
  /** Done, weighted by budget: the application's figure. */
  done: '46',
}

const RSD = 'RSD'

const phase = (
  id: string,
  label: string,
  start: string,
  end: string,
  progress: string,
  planned: string,
  actual: string | null,
  extra: Partial<GanttTask> = {},
): GanttTask => ({
  id,
  label,
  kind: 'phase',
  start,
  end,
  progress,
  budget: { planned, actual, currency: RSD },
  ...extra,
})

const task = (
  id: string,
  parent: string,
  label: string,
  start: string,
  end: string,
  progress: string,
  assignee: string,
  extra: Partial<GanttTask> = {},
): GanttTask => ({ id, parent, label, start, end, progress, assignee, ...extra })

const milestone = (id: string, parent: string, label: string, day: string): GanttTask => ({
  id,
  parent,
  label,
  kind: 'milestone',
  start: day,
  end: day,
})

export const LIMAN_TASKS: GanttTask[] = [
  phase('design', 'Design', '2026-01-12', '2026-03-27', '100', '18000000.00', '17640000.00'),
  task(
    'concept',
    'design',
    'Concept design',
    '2026-01-12',
    '2026-02-06',
    '100',
    'Studio Linija d.o.o.',
  ),
  task(
    'main-design',
    'design',
    'Main design',
    '2026-02-09',
    '2026-03-20',
    '100',
    'Studio Linija d.o.o.',
  ),
  milestone('design-approved', 'design', 'Design approved', '2026-03-27'),
  phase('permits', 'Permits', '2026-03-30', '2026-05-29', '100', '2400000.00', '2515000.00', {
    budget: {
      planned: '2400000.00',
      actual: '2515000.00',
      currency: RSD,
      state: { label: 'Over budget', tone: 'warning' },
    },
  }),
  task(
    'application',
    'permits',
    'Building permit application',
    '2026-03-30',
    '2026-04-03',
    '100',
    'Marija Đurić',
  ),
  task(
    'permit',
    'permits',
    'Building permit',
    '2026-04-06',
    '2026-05-22',
    '100',
    'City of Novi Sad',
  ),
  milestone('permit-issued', 'permits', 'Building permit issued', '2026-05-29'),
  phase('excavation', 'Excavation', '2026-06-01', '2026-06-26', '100', '9800000.00', '9720000.00'),
  task(
    'preparation',
    'excavation',
    'Site preparation',
    '2026-06-01',
    '2026-06-05',
    '100',
    'Crew Petrović',
  ),
  task(
    'digging',
    'excavation',
    'Excavation and shoring',
    '2026-06-08',
    '2026-06-26',
    '100',
    'Crew Petrović',
  ),
  phase(
    'foundations',
    'Foundations',
    '2026-06-29',
    '2026-08-07',
    '100',
    '24600000.00',
    '24120000.00',
  ),
  task(
    'slab',
    'foundations',
    'Foundation slab',
    '2026-06-29',
    '2026-07-24',
    '100',
    'Crew Petrović',
  ),
  task(
    'waterproofing',
    'foundations',
    'Waterproofing',
    '2026-07-27',
    '2026-08-07',
    '100',
    'Crew Petrović',
  ),
  phase('structure', 'Structure', '2026-08-10', '2026-11-27', '58', '96500000.00', '58300000.00'),
  task('ground-floor', 'structure', 'Ground floor', '2026-08-10', '2026-09-04', '100', 'Crew Ilić'),
  task('floors-1-2', 'structure', 'Floors 1–2', '2026-09-07', '2026-10-02', '100', 'Crew Ilić'),
  task('floors-3-4', 'structure', 'Floors 3–4', '2026-10-05', '2026-10-30', '40', 'Crew Ilić', {
    state: { label: 'At risk', tone: 'warning' },
  }),
  task(
    'floor-5',
    'structure',
    'Floor 5 and roof slab',
    '2026-11-02',
    '2026-11-20',
    '0',
    'Crew Ilić',
  ),
  milestone('structure-complete', 'structure', 'Structure complete', '2026-11-27'),
  phase('roof', 'Roof', '2026-11-30', '2026-12-23', '0', '14200000.00', null),
  task(
    'roof-structure',
    'roof',
    'Roof structure',
    '2026-11-30',
    '2026-12-11',
    '0',
    'Crew Jovanović',
  ),
  task('roofing', 'roof', 'Roofing and gutters', '2026-12-14', '2026-12-23', '0', 'Crew Jovanović'),
  phase('installations', 'Installations', '2026-12-07', '2027-03-12', '0', '38900000.00', null),
  task(
    'electrical',
    'installations',
    'Electrical',
    '2026-12-07',
    '2027-02-26',
    '0',
    'Elektro Sistem d.o.o.',
  ),
  task(
    'plumbing',
    'installations',
    'Plumbing and heating',
    '2026-12-14',
    '2027-03-12',
    '0',
    'Crew Lazić',
  ),
  phase('finishes', 'Finishes', '2027-02-01', '2027-04-30', '0', '42700000.00', null),
  task('facade', 'finishes', 'Facade', '2027-02-01', '2027-03-26', '0', 'Crew Jovanović'),
  task('interior', 'finishes', 'Interior finishes', '2027-03-01', '2027-04-30', '0', 'Crew Ilić'),
  phase('handover', 'Handover', '2027-05-03', '2027-05-28', '0', '1900000.00', null),
  task(
    'inspection',
    'handover',
    'Technical inspection',
    '2027-05-03',
    '2027-05-14',
    '0',
    'City of Novi Sad',
  ),
  milestone('handed-over', 'handover', 'Handover to buyers', '2027-05-28'),
]

const chain = (pairs: readonly [string, string][]): GanttDependency[] =>
  pairs.map(([from, to], index) => ({ id: `l${String(index + 1)}`, from, to }))

export const LIMAN_DEPENDENCIES: GanttDependency[] = chain([
  ['concept', 'main-design'],
  ['main-design', 'design-approved'],
  ['design-approved', 'application'],
  ['application', 'permit'],
  ['permit', 'permit-issued'],
  ['permit-issued', 'preparation'],
  ['preparation', 'digging'],
  ['digging', 'slab'],
  ['slab', 'waterproofing'],
  ['waterproofing', 'ground-floor'],
  ['ground-floor', 'floors-1-2'],
  ['floors-1-2', 'floors-3-4'],
  ['floors-3-4', 'floor-5'],
  ['floor-5', 'structure-complete'],
  ['structure-complete', 'roof-structure'],
  ['roof-structure', 'roofing'],
  ['structure-complete', 'electrical'],
  ['structure-complete', 'plumbing'],
  ['roofing', 'facade'],
  ['electrical', 'interior'],
  ['facade', 'inspection'],
  ['interior', 'inspection'],
  ['inspection', 'handed-over'],
])

/**
 * What the application does with a reported change: applies it, then lets each phase span its
 * tasks again (the earliest start, the latest end). Dependants are not moved: the site manager
 * decides, and the plan shows what is late through `state`.
 */
export function applyPlanChange(
  model: { tasks: readonly GanttTask[]; dependencies: readonly GanttDependency[] },
  change: GanttChange,
): { tasks: GanttTask[]; dependencies: GanttDependency[] } {
  const next = applyGanttChange(model, change)
  const tasks = next.tasks.map((each) => {
    if (each.kind !== 'phase') return each
    const own = next.tasks.filter((child) => child.parent === each.id)
    if (own.length === 0) return each
    const start = own.map((child) => child.start).reduce((a, b) => (b < a ? b : a))
    const end = own.map((child) => child.end).reduce((a, b) => (b > a ? b : a))
    return { ...each, start, end }
  })
  return { tasks, dependencies: [...next.dependencies] }
}
