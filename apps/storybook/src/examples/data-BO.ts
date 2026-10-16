/*
 * Group BO's example data (P5.74, field service and maintenance): Kvadrat Gradnja d.o.o.'s
 * machines on 14 October 2026 at 09:40. The machines are the fixed assets of group AP (the mini
 * excavator OS-0142 and the tower crane OS-0118 on Site Liman 4, the generator OS-0146 on Hall B
 * extension, the mixer, the bender, the total station, the scaffolding); the people are group
 * AJ's (Marko Đorđević, procurement and warehouse manager, runs the machinery pool and dispatches
 * the work orders; Snežana Popović, the Liman 4 site manager, signs the work done on her site;
 * Marko Ilić, foreman, reported the leak). The work is done by the service partners' technicians
 * under their service contracts — Saša Vukadinović of Mehanizacija Bačka d.o.o. (who sold the
 * excavator, group AP) — with spare parts issued from the Central warehouse (group AY).
 * Every figure is the application's: operating hours, what is due and by how much, the checklist's
 * count, the parts taken and the time worked — decimal strings and words, never computed by the
 * screens (D4). Every name, number and reading is invented; the inspection rules are illustrative.
 * Not part of the package. No classes here.
 */
import type { Attachment, Tone } from '@veljaos/ui'
import { AP_ROUTES } from './data-AP'

export const BO_TODAY = '2026-10-14'

/** The technician's work order on his phone. */
export const FEATURED_ORDER = 'SN-2026-0143'
/** The plan's task without a work order that the dispatcher creates one for. */
export const CREATE_TASK = 'pm-gen-500'
/** The number the application gives the next work order. */
export const NEXT_ORDER = 'SN-2026-0146'

const ORDER_PATH = (number: string) => `/maintenance/work-orders/${number}`

export const BO_ROUTES = {
  orders: '/maintenance/work-orders',
  /** The list's "Unassigned" view. */
  unassigned: '/maintenance/work-orders?view=unassigned',
  order: ORDER_PATH,
  featured: ORDER_PATH(FEATURED_ORDER),
  /** The technician without a connection: the work order is kept on the phone. */
  offline: `${ORDER_PATH(FEATURED_ORDER)}?offline`,
  /** Sending the changes failed. */
  notSent: `${ORDER_PATH(FEATURED_ORDER)}?sync=failed`,
  /** The checklist done and the technician signed: the phone is handed to the site manager. */
  handover: `${ORDER_PATH(FEATURED_ORDER)}?stage=sign`,
  /** Both signed: done and sent. */
  done: `${ORDER_PATH(FEATURED_ORDER)}?stage=done`,
  plan: '/maintenance/plan',
  /** The plan with "Create work order" asked for the generator's 500-hour service. */
  planCreate: `/maintenance/plan?create=${CREATE_TASK}`,
} as const

// ── Machines ──────────────────────────────────────────────────────────────────────────────────

export interface Machine {
  /** The fixed asset's number (group AP). */
  number: string
  name: string
  serial?: string
  location: string
  /** Who answers for it on the site, from the asset register. */
  responsible: string
  /** The operating hours last read, with when; null for a machine without a counter. */
  hours: { value: string; at: string } | null
  /** The fixed asset's card. */
  href: string
}

const machine = (fields: Machine): Machine => fields

export const MACHINES: Record<string, Machine> = {
  'OS-0142': machine({
    number: 'OS-0142',
    name: 'Mini excavator 3.5 t',
    serial: 'MX35-2025-11872',
    location: 'Site Liman 4',
    responsible: 'Snežana Popović, site manager',
    hours: { value: '1262', at: '2026-10-14' },
    href: AP_ROUTES.asset('OS-0142'),
  }),
  'OS-0118': machine({
    number: 'OS-0118',
    name: 'Tower crane Liebherr 81 K',
    serial: '81K-2022-30455',
    location: 'Site Liman 4',
    responsible: 'Snežana Popović, site manager',
    hours: { value: '6418', at: '2026-10-13' },
    href: AP_ROUTES.asset('OS-0118'),
  }),
  'OS-0146': machine({
    number: 'OS-0146',
    name: 'Generator set 60 kVA',
    serial: 'GS60-2025-0219',
    location: 'Site Hall B extension',
    responsible: 'Vuk Radić, site manager',
    hours: { value: '1538', at: '2026-10-13' },
    href: AP_ROUTES.asset('OS-0146'),
  }),
  'OS-0112': machine({
    number: 'OS-0112',
    name: 'Mešalica za beton 350 l',
    location: 'Site Liman 4',
    responsible: 'Marko Ilić, foreman',
    hours: null,
    href: AP_ROUTES.asset('OS-0112'),
  }),
  'OS-0047': machine({
    number: 'OS-0047',
    name: 'Savijačica armature Sima CEL-32',
    serial: 'CEL32-19-0457',
    location: 'Central warehouse, Novi Sad',
    responsible: 'Zoran Bojović, warehouse keeper',
    hours: null,
    href: AP_ROUTES.asset('OS-0047'),
  }),
  'OS-0139': machine({
    number: 'OS-0139',
    name: 'Total station Leica TS07',
    serial: 'TS07-1873301',
    location: 'Site Liman 4',
    responsible: 'Jelena Stojković, planning engineer',
    hours: null,
    href: AP_ROUTES.asset('OS-0139'),
  }),
  'OS-0127': machine({
    number: 'OS-0127',
    name: 'Scaffolding set, 1.200 m²',
    location: 'Site Liman 4',
    responsible: 'Marko Ilić, foreman',
    hours: null,
    href: AP_ROUTES.asset('OS-0127'),
  }),
}

export function machineOf(number: string): Machine {
  const found = MACHINES[number]
  if (found === undefined) throw new Error(`No machine ${number}`)
  return found
}

// ── Technicians ───────────────────────────────────────────────────────────────────────────────

export const TECHNICIANS = [
  {
    value: 'vukadinovic',
    label: 'Saša Vukadinović',
    description: 'Mehanizacija Bačka d.o.o., machines and hydraulics',
  },
  {
    value: 'lazarevic',
    label: 'Petar Lazarević',
    description: 'Kranovi Bačka d.o.o., cranes',
  },
  {
    value: 'mirkovic',
    label: 'Ivan Mirković',
    description: 'Skele Sistem d.o.o., scaffolding',
  },
  {
    value: 'djordjevic',
    label: 'Bojan Đorđević',
    description: 'Electrician, Bulevar Evrope 24',
  },
] as const

export function technicianName(value: string | null): string | null {
  return TECHNICIANS.find((each) => each.value === value)?.label ?? null
}

// ── Work orders ───────────────────────────────────────────────────────────────────────────────

export type OrderState = 'New' | 'Scheduled' | 'In progress' | 'Waiting for parts' | 'Done'

export const ORDER_TONES: Record<OrderState, Tone> = {
  New: 'neutral',
  Scheduled: 'info',
  'In progress': 'info',
  'Waiting for parts': 'warning',
  Done: 'success',
}

export type OrderKind = 'Fault' | 'Preventive' | 'Fault and service'

export type Priority = 'Urgent' | 'High' | 'Normal'

export const PRIORITY_TONES: Record<Priority, Tone> = {
  Urgent: 'danger',
  High: 'warning',
  Normal: 'neutral',
}

export interface WorkOrder {
  number: string
  machine: string
  kind: OrderKind
  /** The fault or the task, in the reporter's or the plan's words. */
  title: string
  priority: Priority
  /** A technician's value from TECHNICIANS, or null while unassigned. */
  technician: string | null
  /** The day it is planned for; null while not planned. */
  planned: string | null
  state: OrderState
  /** Who reported it and when (an instant), for a fault. */
  reported?: { by: string; at: string }
  /** The state's detail in the application's words ("Display module ordered, due 21.10.2026."). */
  note?: string
  /** The plan's task it carries out. */
  task?: string
  /** Done: when, and who signed it. */
  done?: { at: string; signedBy: string }
}

const order = (fields: WorkOrder): WorkOrder => fields

export const ORDERS: readonly WorkOrder[] = [
  order({
    number: 'SN-2026-0145',
    machine: 'OS-0047',
    kind: 'Fault',
    title: 'The motor stops under load',
    priority: 'Normal',
    technician: null,
    planned: null,
    state: 'New',
    reported: { by: 'Zoran Bojović, warehouse keeper', at: '2026-10-14T08:20:00+02:00' },
  }),
  order({
    number: 'SN-2026-0144',
    machine: 'OS-0118',
    kind: 'Preventive',
    title: 'Annual inspection by an authorised body',
    priority: 'High',
    technician: 'lazarevic',
    planned: '2026-10-20',
    state: 'Scheduled',
    task: 'pm-crane-year',
  }),
  order({
    number: FEATURED_ORDER,
    machine: 'OS-0142',
    kind: 'Fault and service',
    title: 'Hydraulic oil leaking at the boom; 250-hour service',
    priority: 'High',
    technician: 'vukadinovic',
    planned: '2026-10-14',
    state: 'In progress',
    reported: { by: 'Marko Ilić, foreman, crew Ilić', at: '2026-10-13T16:20:00+02:00' },
    note: 'Started at 08:55.',
    task: 'pm-exc-250',
  }),
  order({
    number: 'SN-2026-0142',
    machine: 'OS-0139',
    kind: 'Fault',
    title: 'The display flickers in the cold',
    priority: 'Normal',
    technician: 'vukadinovic',
    planned: '2026-10-21',
    state: 'Waiting for parts',
    reported: { by: 'Jelena Stojković, planning engineer', at: '2026-10-08T07:45:00+02:00' },
    note: 'Display module ordered from Geo Oprema d.o.o.; expected 21.10.2026.',
  }),
  order({
    number: 'SN-2026-0141',
    machine: 'OS-0112',
    kind: 'Preventive',
    title: 'Yearly service',
    priority: 'Normal',
    technician: 'vukadinovic',
    planned: '2026-10-10',
    state: 'Done',
    task: 'pm-mix-year',
    done: { at: '2026-10-10T13:05:00+02:00', signedBy: 'Marko Ilić' },
  }),
  order({
    number: 'SN-2026-0140',
    machine: 'OS-0127',
    kind: 'Preventive',
    title: 'Half-yearly inspection',
    priority: 'Normal',
    technician: 'mirkovic',
    planned: '2026-10-02',
    state: 'Done',
    task: 'pm-scaf-half',
    done: { at: '2026-10-02T11:40:00+02:00', signedBy: 'Snežana Popović' },
  }),
]

export type OrdersView = 'open' | 'unassigned' | 'done' | 'all'

export const ORDER_VIEWS: { id: OrdersView; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'All' },
]

export function inOrdersView(each: WorkOrder, view: OrdersView): boolean {
  if (view === 'all') return true
  if (view === 'done') return each.state === 'Done'
  if (view === 'unassigned') return each.state !== 'Done' && each.technician === null
  return each.state !== 'Done'
}

// ── The featured work order on the technician's phone ─────────────────────────────────────────

export const FAULT = {
  text: 'Hydraulic oil is leaking at the hose to the boom cylinder; a puddle under the machine in the morning. The machine is stopped.',
  /** The plan's words for the service that is due with it. */
  service: '250-hour service, 12 h overdue (1.262 h on 14.10.2026).',
}

export interface CheckItem {
  id: string
  label: string
  /** A hint from the plan's checklist. */
  hint?: string
  done: boolean
}

export const CHECKLIST: readonly CheckItem[] = [
  { id: 'c1', label: 'Machine stopped, bucket down, key removed', done: true },
  { id: 'c2', label: 'Leaking hose to the boom cylinder replaced', done: true },
  { id: 'c3', label: 'Engine oil and oil filter changed', hint: '15W-40, 8 l', done: true },
  { id: 'c4', label: 'Fuel filter changed', done: true },
  { id: 'c5', label: 'Hydraulic oil topped up to the mark', hint: 'HV 46', done: true },
  { id: 'c6', label: 'Air filter cleaned or replaced', done: false },
  { id: 'c7', label: 'Every greasing point lubricated', hint: '14 points', done: false },
  { id: 'c8', label: 'Track tension checked', done: false },
  {
    id: 'c9',
    label: 'Test run under load: no leaks',
    hint: '15 minutes, every function',
    done: false,
  },
]

export interface PartLine {
  id: string
  code: string
  name: string
  unit: string
  /** Issued to the work order from the Central warehouse. */
  taken: string
  /** Used, as the technician enters it; what is left goes back (the application's). */
  used: string
  /** The step of the stepper ("1" pieces, "0.5" litres). */
  step: string
}

export const PARTS_ISSUE = {
  document: 'IZD-2026-0388',
  warehouse: 'Central warehouse',
  at: '2026-10-14T07:40:00+02:00',
}

export const PARTS: readonly PartLine[] = [
  {
    id: 'p1',
    code: '4021-118',
    name: 'Hydraulic hose 1/2", 1,2 m',
    unit: 'pc',
    taken: '1',
    used: '1',
    step: '1',
  },
  {
    id: 'p2',
    code: '7104-015',
    name: 'Engine oil 15W-40',
    unit: 'l',
    taken: '10',
    used: '8',
    step: '0.5',
  },
  { id: 'p3', code: '5310-221', name: 'Oil filter', unit: 'pc', taken: '1', used: '1', step: '1' },
  { id: 'p4', code: '5310-238', name: 'Fuel filter', unit: 'pc', taken: '1', used: '1', step: '1' },
  {
    id: 'p5',
    code: '7110-046',
    name: 'Hydraulic oil HV 46',
    unit: 'l',
    taken: '20',
    used: '6',
    step: '0.5',
  },
  { id: 'p6', code: '5320-104', name: 'Air filter', unit: 'pc', taken: '1', used: '0', step: '1' },
]

/** Spare parts in the Central warehouse a technician can add, with what is there. */
export const SPARE_PARTS = [
  {
    value: '5330-012',
    label: 'Grease cartridge EP2, 400 g',
    description: '5330-012 · 36 pc in the Central warehouse',
    unit: 'pc',
  },
  {
    value: '4021-120',
    label: 'Hydraulic hose 1/2", 1,6 m',
    description: '4021-120 · 4 pc in the Central warehouse',
    unit: 'pc',
  },
  {
    value: '6012-007',
    label: 'Track tensioner seal kit',
    description: '6012-007 · 2 pc in the Central warehouse',
    unit: 'pc',
  },
] as const

export const PHOTOS: readonly Attachment[] = [
  { id: 'ph1', name: 'Leak_boom_hose.jpg', sizeText: '2,8 MB', state: 'available' },
  { id: 'ph2', name: 'Old_hose_removed.jpg', sizeText: '3,1 MB', state: 'available' },
  { id: 'ph3', name: 'New_hose_fitted.jpg', sizeText: '2,6 MB', state: 'available' },
]

/** The photo the application files after "Take a photo". */
export const NEW_PHOTO: Attachment = {
  id: 'ph4',
  name: 'Track_tension_check.jpg',
  sizeText: '2,4 MB',
  state: 'available',
}

export interface TimeEntry {
  id: string
  kind: string
  from: string
  /** Null while it runs. */
  to: string | null
  /** The application's words. */
  duration: string
}

export const TIME: readonly TimeEntry[] = [
  {
    id: 't1',
    kind: 'Travel',
    from: '2026-10-14T08:10:00+02:00',
    to: '2026-10-14T08:50:00+02:00',
    duration: '40 min',
  },
  {
    id: 't2',
    kind: 'Work',
    from: '2026-10-14T08:55:00+02:00',
    to: null,
    duration: '45 min so far',
  },
]

/** The running work entry as the application closes it at 09:40. */
export const WORK_STOPPED: TimeEntry = {
  id: 't2',
  kind: 'Work',
  from: '2026-10-14T08:55:00+02:00',
  to: '2026-10-14T09:40:00+02:00',
  duration: '45 min',
}

export const TIME_TOTAL = { running: '1 h 25 min so far', stopped: '1 h 25 min' }

export const WORK_DONE =
  'Replaced the leaking hose to the boom cylinder. 250-hour service: engine oil and filter, fuel filter, hydraulic oil topped up.'

/** The time the work order was last saved on the phone, and sent. */
export const SAVED_AT = '2026-10-14T09:38:00+02:00'
export const SIGNED_AT = '2026-10-14T09:40:00+02:00'

/** What is waiting on the phone while offline, in the application's words. */
export const OFFLINE_WAITING = '4 changes and 1 photo are kept on this phone.'

export const DECLINE_REASONS = [
  { value: 'leak', label: 'The machine still leaks' },
  { value: 'missing', label: 'Work is missing from the order' },
  { value: 'parts', label: 'The parts used are not right' },
]

// ── The preventive maintenance plan ───────────────────────────────────────────────────────────

export type PlanState = 'Overdue' | 'Due soon' | 'Planned'

export const PLAN_TONES: Record<PlanState, Tone> = {
  Overdue: 'danger',
  'Due soon': 'warning',
  Planned: 'neutral',
}

export interface PlanTask {
  id: string
  machine: string
  task: string
  /** The interval in the application's words. */
  interval: string
  /** When it was last done, in the application's words. */
  last: string
  /** When it is due next: a date, or a reading in words. */
  next: { date: string } | { text: string }
  state: PlanState
  /** How much is left or over, in the application's words. */
  words: string
  /** The open work order that carries it out. */
  order?: string
}

const task = (fields: PlanTask): PlanTask => fields

export const PLAN: readonly PlanTask[] = [
  task({
    id: 'pm-exc-250',
    machine: 'OS-0142',
    task: '250-hour service',
    interval: 'Every 250 operating hours',
    last: '08.04.2026. at 1.000 h',
    next: { text: 'At 1.250 h' },
    state: 'Overdue',
    words: '12 h overdue (1.262 h on 14.10.2026.)',
    order: FEATURED_ORDER,
  }),
  task({
    id: 'pm-gen-500',
    machine: 'OS-0146',
    task: '500-hour service',
    interval: 'Every 500 operating hours',
    last: '12.05.2026. at 1.000 h',
    next: { text: 'At 1.500 h' },
    state: 'Overdue',
    words: '38 h overdue (1.538 h on 13.10.2026.)',
  }),
  task({
    id: 'pm-bend-half',
    machine: 'OS-0047',
    task: 'Half-yearly service',
    interval: 'Every 6 months',
    last: '15.04.2026.',
    next: { date: '2026-10-15' },
    state: 'Due soon',
    words: 'Due tomorrow',
  }),
  task({
    id: 'pm-crane-month',
    machine: 'OS-0118',
    task: 'Rope and brake check',
    interval: 'Every month',
    last: '15.09.2026.',
    next: { date: '2026-10-15' },
    state: 'Due soon',
    words: 'Due tomorrow',
  }),
  task({
    id: 'pm-crane-year',
    machine: 'OS-0118',
    task: 'Annual inspection by an authorised body (illustrative rule)',
    interval: 'Every 12 months',
    last: '21.10.2025.',
    next: { date: '2026-10-21' },
    state: 'Due soon',
    words: 'Due in 7 days',
    order: 'SN-2026-0144',
  }),
  task({
    id: 'pm-ts-cal',
    machine: 'OS-0139',
    task: 'Yearly calibration',
    interval: 'Every 12 months',
    last: '05.11.2025.',
    next: { date: '2026-11-05' },
    state: 'Planned',
    words: 'Due in 22 days',
  }),
  task({
    id: 'pm-exc-year',
    machine: 'OS-0142',
    task: 'Annual safety inspection (illustrative rule)',
    interval: 'Every 12 months',
    last: '16.03.2026.',
    next: { date: '2027-03-16' },
    state: 'Planned',
    words: 'Due in 5 months',
  }),
  task({
    id: 'pm-scaf-half',
    machine: 'OS-0127',
    task: 'Half-yearly inspection',
    interval: 'Every 6 months',
    last: '02.10.2026.',
    next: { date: '2027-04-02' },
    state: 'Planned',
    words: 'Due in 6 months',
  }),
  task({
    id: 'pm-mix-year',
    machine: 'OS-0112',
    task: 'Yearly service',
    interval: 'Every 12 months',
    last: '10.10.2026.',
    next: { date: '2027-10-10' },
    state: 'Planned',
    words: 'Due in 12 months',
  }),
]

export type PlanView = 'due' | 'all'

export const PLAN_VIEWS: { id: PlanView; label: string }[] = [
  { id: 'due', label: 'Overdue and due soon' },
  { id: 'all', label: 'All tasks' },
]

export function inPlanView(each: PlanTask, view: PlanView): boolean {
  return view === 'all' || each.state !== 'Planned'
}

/** The work order the application makes from a plan's task (the generator's, numbered next). */
export function orderFromTask(planned: PlanTask, technician: string, day: string): WorkOrder {
  return {
    number: NEXT_ORDER,
    machine: planned.machine,
    kind: 'Preventive',
    title: planned.task,
    priority: planned.state === 'Overdue' ? 'High' : 'Normal',
    technician,
    planned: day,
    state: 'Scheduled',
    task: planned.id,
  }
}

/** The defaults the application proposes for the generator's work order. */
export const CREATE_DEFAULTS = { technician: 'djordjevic', planned: '2026-10-15' }
