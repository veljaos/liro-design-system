import type { MyShift } from './my-shifts'
import {
  rotationAssignments,
  type RotationPattern,
  type ShiftAssignment,
  type ShiftChange,
  type ShiftConflicts,
} from './shift-logic'
import type { ShiftTemplate } from './shift-parts'
import type {
  ShiftCoverage,
  ShiftGrouping,
  ShiftPlannerRow,
  ShiftPublishCounts,
} from './shift-planner'
import type { SwapColleague } from './shift-swap-dialog'
import type { WorkingTimePlan, WorkingTimeRow } from './working-time-balance'

/*
 * Story data for P5.24 b and d (fictitious): a retail store (Prodavnica 12, Novi Sad, shifts
 * 07–15 and 15–23) and a 24/7 health facility (Dom zdravlja, rotating 06–14, 14–22, 22–06).
 * Every limit and warning here is ILLUSTRATIVE, written as the application would pass it — the
 * Design System encodes none. Not part of the package: nothing in src/index.ts imports this file.
 * No classes here: Storybook compiles classes only from *.stories.tsx files.
 */

/** The week shown: Monday 05.10.2026 to Sunday 11.10.2026 (EXAMPLE_TODAY is Tuesday 06.10.). */
export const WEEK = { start: '2026-10-05', end: '2026-10-11' }

/** The application applies the planner's changes to its assignments (as a story does). */
export function applyShiftChanges(
  assignments: readonly ShiftAssignment[],
  changes: readonly ShiftChange[],
  newId: () => string,
): ShiftAssignment[] {
  let next = [...assignments]
  for (const change of changes) {
    if (change.type === 'add') {
      next.push({
        id: newId(),
        rowId: change.rowId,
        date: change.date,
        templateId: change.templateId,
        changed: true,
      })
    } else if (change.type === 'remove') {
      next = next.filter((each) => each.id !== change.assignmentId)
    } else {
      next = next.map((each) =>
        each.id === change.assignmentId
          ? { ...each, rowId: change.to.rowId, date: change.to.date, changed: true }
          : each,
      )
    }
  }
  return next
}

// ── The retail store ──────────────────────────────────────────────────────────────────────────

export const STORE_TEMPLATES: ShiftTemplate[] = [
  { id: 'early', label: 'Early', short: 'E', start: '07:00', end: '15:00' },
  { id: 'late', label: 'Late', short: 'L', start: '15:00', end: '23:00', tone: 'success' },
  {
    id: 'inventory',
    label: 'Inventory',
    short: 'I',
    start: '21:00',
    end: '05:00',
    key: 'I',
    tone: 'premium',
  },
]

export const STORE_ROWS: ShiftPlannerRow[] = [
  { id: 'jovana', name: 'Jovana Marković', subtitle: 'Store manager', hours: '40' },
  { id: 'stefan', name: 'Stefan Nikolić', subtitle: 'Cashier', hours: '40' },
  { id: 'milica', name: 'Milica Stojanović', subtitle: 'Cashier', hours: '32' },
  { id: 'nemanja', name: 'Nemanja Pavlović', subtitle: 'Cashier, students’ contract', hours: '16' },
  { id: 'teodora', name: 'Teodora Kovačević', subtitle: 'Shelves and stock', hours: '40' },
  { id: 'luka', name: 'Luka Đorđević', subtitle: 'Shelves and stock', hours: '48' },
]

export const STORE_GROUPINGS: ShiftGrouping[] = [
  {
    id: 'team',
    label: 'By team',
    groups: [
      {
        id: 'tills',
        label: 'Tills',
        rows: ['jovana', 'stefan', 'milica', 'nemanja'],
        note: '4 people · 128 h',
      },
      {
        id: 'stock',
        label: 'Shelves and stock',
        rows: ['teodora', 'luka'],
        note: '2 people · 88 h',
      },
    ],
  },
]

/** Two early, two late, two off; Saturday and Sunday by rotation. */
export const STORE_ROTATIONS: RotationPattern[] = [
  {
    id: 'eell',
    label: 'Two early, two late, two off',
    steps: ['early', 'early', 'late', 'late', null, null],
  },
  {
    id: 'early5',
    label: 'Five early, two off',
    steps: ['early', 'early', 'early', 'early', 'early', null, null],
  },
]

let storeCounter = 0
const storeId = () => `s${String((storeCounter += 1))}`

function fromRotation(
  pattern: (string | null)[],
  people: string[],
  offset: number,
  id: () => string,
): ShiftAssignment[] {
  return rotationAssignments({ steps: pattern }, people, WEEK.start, WEEK.end, offset).map(
    (each) => ({ id: id(), ...each }),
  )
}

export const STORE_ASSIGNMENTS: ShiftAssignment[] = [
  ...fromRotation(
    ['early', 'early', 'early', 'early', 'early', null, null],
    ['jovana'],
    0,
    storeId,
  ),
  ...fromRotation(['early', 'early', 'late', 'late', null, null], ['stefan', 'milica'], 2, storeId),
  ...fromRotation([null, null, null, null, 'late', 'late', null], ['nemanja'], 0, storeId),
  ...fromRotation(['late', 'late', 'early', 'early', null, null], ['teodora', 'luka'], 3, storeId),
  { id: storeId(), rowId: 'luka', date: '2026-10-08', templateId: 'inventory', changed: true },
]

export const STORE_CONFLICTS: ShiftConflicts = {
  luka: {
    '2026-10-08': [{ tone: 'danger', text: 'Two shifts at the same time: Late and Inventory' }],
    '2026-10-09': [
      { tone: 'warning', text: 'Less than the illustrative 12 hours of rest after Inventory' },
    ],
  },
  nemanja: {
    '2026-10-10': [
      { tone: 'warning', text: 'Students’ contract: illustrative limit of 16 h a week reached' },
    ],
  },
}

export const STORE_COVERAGE: Record<string, ShiftCoverage> = {
  '2026-10-05': { planned: '5', needed: '4' },
  '2026-10-06': { planned: '4', needed: '4' },
  '2026-10-07': { planned: '4', needed: '4' },
  '2026-10-08': { planned: '5', needed: '4' },
  '2026-10-09': { planned: '3', needed: '4', tone: 'warning', note: 'One short in the late shift' },
  '2026-10-10': { planned: '3', needed: '5', tone: 'danger', note: 'Two short on a Saturday' },
  '2026-10-11': { planned: '2', needed: '2' },
}

export const STORE_PUBLISH: ShiftPublishCounts = { shifts: 27, people: 6, conflicts: 3 }

// ── The health facility ───────────────────────────────────────────────────────────────────────

export const HEALTH_TEMPLATES: ShiftTemplate[] = [
  { id: 'morning', label: 'Morning', short: 'M', start: '06:00', end: '14:00' },
  {
    id: 'afternoon',
    label: 'Afternoon',
    short: 'A',
    start: '14:00',
    end: '22:00',
    tone: 'success',
  },
  { id: 'night', label: 'Night', short: 'N', start: '22:00', end: '06:00', tone: 'premium' },
]

export const HEALTH_ROWS: ShiftPlannerRow[] = [
  { id: 'ana', name: 'Ana Petrović', subtitle: 'Nurse', hours: '40' },
  { id: 'nikola', name: 'Nikola Ilić', subtitle: 'Nurse', hours: '48' },
  { id: 'jelena', name: 'Jelena Popović', subtitle: 'Doctor', hours: '56' },
  { id: 'marko', name: 'Marko Jovanović', subtitle: 'Nurse', hours: '40' },
  { id: 'ivana', name: 'Ivana Lazić', subtitle: 'Nurse', hours: '32' },
  { id: 'dusan', name: 'Dušan Simić', subtitle: 'Doctor', hours: '40' },
  { id: 'katarina', name: 'Katarina Radović', subtitle: 'Nurse, half time', hours: '24' },
  { id: 'milos', name: 'Miloš Todorović', subtitle: 'Nurse', hours: null },
]

export const HEALTH_GROUPINGS: ShiftGrouping[] = [
  {
    id: 'team',
    label: 'By team',
    groups: [
      { id: 'emergency', label: 'Emergency', rows: ['ana', 'nikola', 'jelena', 'marko'] },
      { id: 'ward', label: 'General practice', rows: ['ivana', 'dusan', 'katarina', 'milos'] },
    ],
  },
  {
    id: 'site',
    label: 'By site',
    groups: [
      {
        id: 'main',
        label: 'Dom zdravlja, main building',
        rows: ['ana', 'nikola', 'jelena', 'marko', 'dusan'],
      },
      { id: 'klisa', label: 'Klisa clinic', rows: ['ivana', 'katarina', 'milos', 'jelena'] },
    ],
  },
]

/** The facility's rotation: two mornings, two afternoons, two nights, two days off. */
export const HEALTH_ROTATIONS: RotationPattern[] = [
  {
    id: 'maann',
    label: 'Rotating 8 days: 2 morning, 2 afternoon, 2 night, 2 off',
    steps: ['morning', 'morning', 'afternoon', 'afternoon', 'night', 'night', null, null],
  },
  {
    id: 'mornings',
    label: 'Mornings, weekdays',
    steps: ['morning', 'morning', 'morning', 'morning', 'morning', null, null],
  },
]

let healthCounter = 0
const healthId = () => `h${String((healthCounter += 1))}`

export const HEALTH_ASSIGNMENTS: ShiftAssignment[] = [
  ...fromRotation(
    ['morning', 'morning', 'afternoon', 'afternoon', 'night', 'night', null, null],
    ['ana', 'nikola', 'jelena', 'marko'],
    2,
    healthId,
  ),
  ...fromRotation(
    ['morning', 'morning', 'morning', 'morning', 'morning', null, null],
    ['ivana', 'dusan'],
    0,
    healthId,
  ),
  ...fromRotation(
    ['afternoon', null, 'afternoon', null, 'afternoon', null, null],
    ['katarina'],
    0,
    healthId,
  ),
  { id: healthId(), rowId: 'jelena', date: '2026-10-09', templateId: 'morning', changed: true },
]

export const HEALTH_CONFLICTS: ShiftConflicts = {
  nikola: {
    '2026-10-07': [
      {
        tone: 'warning',
        text: 'Less than the illustrative 11 hours of rest after the night shift',
      },
    ],
  },
  jelena: {
    '2026-10-09': [
      { tone: 'danger', text: 'Double booking: Morning at Emergency and at Klisa clinic' },
      { tone: 'warning', text: 'Weekly hours above the illustrative limit of 48 h' },
    ],
  },
}

export const HEALTH_COVERAGE: Record<string, ShiftCoverage> = {
  '2026-10-05': { planned: '7', needed: '7' },
  '2026-10-06': { planned: '6', needed: '7', tone: 'warning', note: 'One short at night' },
  '2026-10-07': { planned: '7', needed: '7' },
  '2026-10-08': { planned: '6', needed: '7', tone: 'warning', note: 'One short in the afternoon' },
  '2026-10-09': { planned: '8', needed: '7' },
  '2026-10-10': { planned: '3', needed: '3' },
  '2026-10-11': { planned: '2', needed: '3', tone: 'danger', note: 'No doctor at night' },
}

export const HEALTH_PUBLISH: ShiftPublishCounts = { shifts: 38, people: 8, conflicts: 3 }

// ── My shifts (Ana Petrović, Dom zdravlja) ────────────────────────────────────────────────────

export const MY_SHIFTS: MyShift[] = [
  {
    id: 'm1',
    date: '2026-10-06',
    label: 'Morning',
    start: '06:00',
    end: '14:00',
    place: 'Dom zdravlja, main building',
    team: 'Emergency',
  },
  {
    id: 'm2',
    date: '2026-10-07',
    label: 'Afternoon',
    start: '14:00',
    end: '22:00',
    place: 'Dom zdravlja, main building',
    team: 'Emergency',
  },
  {
    id: 'm3',
    date: '2026-10-08',
    label: 'Night',
    start: '22:00',
    end: '06:00',
    place: 'Dom zdravlja, main building',
    team: 'Emergency',
    changed: 'Was Afternoon, 14:00–22:00',
  },
  {
    id: 'm4',
    date: '2026-10-09',
    label: 'Night',
    start: '22:00',
    end: '06:00',
    place: 'Dom zdravlja, main building',
    team: 'Emergency',
    swapState: 'Swap requested with Marko Jovanović · waiting for approval',
  },
  {
    id: 'm5',
    date: '2026-10-12',
    label: 'Morning',
    start: '06:00',
    end: '14:00',
    place: 'Klisa clinic',
    team: 'General practice',
  },
  {
    id: 'm6',
    date: '2026-10-13',
    label: 'Morning',
    start: '06:00',
    end: '14:00',
    place: 'Klisa clinic',
    team: 'General practice',
  },
  {
    id: 'm7',
    date: '2026-10-21',
    label: 'Afternoon',
    start: '14:00',
    end: '22:00',
    place: 'Dom zdravlja, main building',
    team: 'Emergency',
  },
]

export const SWAP_COLLEAGUES: SwapColleague[] = [
  {
    id: 'marko',
    name: 'Marko Jovanović',
    note: 'Emergency',
    shifts: [
      {
        id: 't1',
        date: '2026-10-10',
        label: 'Morning',
        start: '06:00',
        end: '14:00',
        place: 'Dom zdravlja, main building',
      },
      {
        id: 't2',
        date: '2026-10-14',
        label: 'Night',
        start: '22:00',
        end: '06:00',
        place: 'Dom zdravlja, main building',
      },
    ],
  },
  { id: 'ivana', name: 'Ivana Lazić', note: 'General practice' },
  { id: 'katarina', name: 'Katarina Radović', note: 'General practice, half time' },
]

// ── Working-time redistribution (Prodavnica 12, the autumn quarter) ──────────────────────────

export const BALANCE_PLAN: WorkingTimePlan = {
  start: '2026-09-07',
  end: '2026-10-04',
  weeks: [
    { start: '2026-09-07', end: '2026-09-13', hours: '48' },
    { start: '2026-09-14', end: '2026-09-20', hours: '44' },
    { start: '2026-09-21', end: '2026-09-27', hours: '36' },
    { start: '2026-09-28', end: '2026-10-04', hours: '32' },
  ],
  reference: { label: 'Reference average per week (illustrative)', hours: '40' },
}

export const BALANCE_ROWS: WorkingTimeRow[] = [
  {
    id: 'jovana',
    name: 'Jovana Marković',
    subtitle: 'Store manager',
    planned: '160',
    worked: '158',
    difference: '-2',
    average: '39.5',
  },
  {
    id: 'stefan',
    name: 'Stefan Nikolić',
    subtitle: 'Cashier',
    planned: '160',
    worked: '164',
    difference: '4',
    average: '41',
  },
  {
    id: 'luka',
    name: 'Luka Đorđević',
    subtitle: 'Shelves and stock',
    planned: '160',
    worked: '196',
    difference: '36',
    average: '49',
    warnings: [
      { tone: 'danger', text: 'Average above the illustrative limit of 48 h' },
      { tone: 'warning', text: 'Week 1: 56 h, above the illustrative weekly limit of 52 h' },
    ],
  },
  {
    id: 'milica',
    name: 'Milica Stojanović',
    subtitle: 'Cashier',
    planned: '128',
    worked: '137.5',
    difference: '9.5',
    average: '34.375',
    warnings: [{ tone: 'warning', text: 'Worked 9,5 h more than planned' }],
  },
  {
    id: 'teodora',
    name: 'Teodora Kovačević',
    subtitle: 'Shelves and stock',
    planned: '160',
    worked: null,
    difference: null,
    average: null,
  },
]
