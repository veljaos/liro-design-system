/*
 * Story data of FloorPlan and SeatingChart (P5.25): fictitious. Restoran Kej in Novi Sad during
 * Saturday's dinner service (a hall, a terrace and a bar), a hotel floor, and the wedding of Ana
 * and Marko at Sala Fruškać. The states, their words, tones and icons are the application's map
 * (free, occupied, reserved, blocked, needs cleaning are only examples). Not part of the package:
 * nothing in src/index.ts imports this file. No classes here: Storybook compiles classes only from
 * *.stories.tsx files.
 */
import {
  Ban,
  BedDouble,
  CalendarClock,
  Circle,
  CircleCheck,
  Sparkles,
  Square,
  UsersRound,
  Wrench,
} from 'lucide-react'
import type { FloorArea, FloorPaletteEntry, FloorState } from './floor-plan'
import type { FloorItem } from './floor-plan-logic'
import type { SeatingConflict, SeatingGuest, SeatingTable } from './seating-logic'

// ── Restoran Kej: the dinner service ─────────────────────────────────────────────────────────

/** The restaurant's states, as its application maps them. */
export const RESTAURANT_STATES: FloorState[] = [
  { id: 'free', label: 'Free', tone: 'success', icon: CircleCheck },
  { id: 'occupied', label: 'Occupied', tone: 'neutral', icon: UsersRound },
  { id: 'reserved', label: 'Reserved', tone: 'premium', icon: CalendarClock },
  { id: 'cleaning', label: 'Needs cleaning', tone: 'warning', icon: Sparkles },
  { id: 'blocked', label: 'Blocked', tone: 'danger', icon: Ban },
]

/** The plan: 1200 × 800 units (centimetres). */
export const RESTAURANT_SIZE = { width: 1200, height: 800 }

export const RESTAURANT_AREAS: FloorArea[] = [
  { id: 'hall', label: 'Hall', x: 0, y: 0, width: 780, height: 800 },
  { id: 'terrace', label: 'Terrace', x: 800, y: 0, width: 400, height: 520 },
  { id: 'bar', label: 'Bar', x: 800, y: 540, width: 400, height: 260 },
]

/** A round table of two or four. */
function round(
  id: string,
  x: number,
  y: number,
  areaId: string,
  capacity: number,
  stateId: string,
  extra: Partial<FloorItem> = {},
): FloorItem {
  const size = capacity <= 2 ? 80 : 100
  return {
    id,
    kind: 'table',
    shape: 'round',
    label: `Table ${id.slice(1)}`,
    shortLabel: id.slice(1),
    x,
    y,
    width: size,
    height: size,
    capacity,
    areaId,
    stateId,
    ...extra,
  }
}

/** A rectangular table. */
function rect(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  areaId: string,
  capacity: number,
  stateId: string,
  extra: Partial<FloorItem> = {},
): FloorItem {
  return {
    id,
    kind: 'table',
    shape: 'rect',
    label: `Table ${id.slice(1)}`,
    shortLabel: id.slice(1),
    x,
    y,
    width,
    height,
    capacity,
    areaId,
    stateId,
    ...extra,
  }
}

/**
 * A party at a table, as the application words it: the list's `detail` ("2 guests · since
 * 18:40") and the plan's short second line ("2 guests"; P5.28 item 24: the time is not on the plan).
 */
function party(guests: number, time: string, reserved = false): Partial<FloorItem> {
  const count = guests === 1 ? '1 guest' : `${String(guests)} guests`
  return {
    detail: reserved ? `${count} · at ${time}` : `${count} · since ${time}`,
    planDetail: count,
  }
}

/** No walls, doors or windows (P5.28 item 23): the areas, the tables and the bar. */
export const RESTAURANT_ITEMS: FloorItem[] = [
  // The hall.
  round('t1', 60, 80, 'hall', 2, 'free'),
  round('t2', 220, 80, 'hall', 2, 'occupied', party(2, '18:40')),
  rect('t3', 380, 80, 160, 90, 'hall', 4, 'reserved', {
    ...party(4, '19:30', true),
    note: 'Window seat asked for',
  }),
  rect('t4', 580, 80, 160, 90, 'hall', 4, 'free'),
  round('t5', 60, 300, 'hall', 4, 'occupied', party(4, '19:05')),
  round('t6', 240, 300, 'hall', 4, 'cleaning'),
  rect('t7', 400, 300, 160, 100, 'hall', 6, 'reserved', party(6, '20:00', true)),
  rect('t8', 600, 300, 140, 100, 'hall', 6, 'blocked', {
    note: 'Broken leg, waiting for the carpenter',
  }),
  rect('t9', 60, 520, 340, 110, 'hall', 10, 'reserved', {
    ...party(10, '20:30', true),
    note: 'Birthday, cake at 22:00',
  }),
  round('t10', 480, 540, 'hall', 4, 'free'),
  // The terrace.
  round('t11', 840, 60, 'terrace', 2, 'occupied', party(2, '18:55')),
  round('t12', 1020, 60, 'terrace', 2, 'free'),
  round('t13', 840, 220, 'terrace', 4, 'free'),
  round('t14', 1020, 220, 'terrace', 4, 'reserved', party(3, '19:45', true)),
  rect('t15', 840, 380, 280, 90, 'terrace', 6, 'free'),
  // The bar.
  {
    id: 'bar',
    kind: 'bar',
    label: 'Bar counter',
    x: 840,
    y: 700,
    width: 320,
    height: 60,
    capacity: 6,
    areaId: 'bar',
    stateId: 'occupied',
    detail: '4 guests',
    planDetail: '4 of 6',
  },
  // The piano: furniture people choose around (a fixture: drawn, chosen only in edit mode).
  {
    id: 'piano',
    kind: 'stage',
    label: 'Piano',
    x: 600,
    y: 680,
    width: 140,
    height: 80,
    areaId: 'hall',
  },
  round('t16', 860, 580, 'bar', 2, 'free'),
  round('t17', 1060, 580, 'bar', 2, 'cleaning'),
]

/** The palette of the restaurant's edit mode. */
export const RESTAURANT_PALETTE: FloorPaletteEntry[] = [
  {
    id: 'round-2',
    kind: 'table',
    shape: 'round',
    label: 'Round table',
    width: 80,
    height: 80,
    capacity: 2,
    icon: Circle,
  },
  {
    id: 'rect-4',
    kind: 'table',
    shape: 'rect',
    label: 'Table for four',
    width: 160,
    height: 90,
    capacity: 4,
    icon: Square,
  },
  {
    id: 'counter',
    kind: 'counter',
    label: 'Service counter',
    width: 200,
    height: 50,
    icon: Wrench,
  },
]

/** Table 10 pushed onto table 7 while the plan is edited: the application's warning. */
export const OVERLAP_ITEMS: FloorItem[] = RESTAURANT_ITEMS.map((item) =>
  item.id === 't10' ? { ...item, x: 500, y: 360 } : item,
)

export const OVERLAP_WARNINGS = [
  { itemId: 't10', text: 'Overlaps Table 7' },
  { itemId: 't7', text: 'Overlaps Table 10' },
]

// ── A hotel floor ────────────────────────────────────────────────────────────────────────────

export const HOTEL_STATES: FloorState[] = [
  { id: 'vacant-clean', label: 'Vacant, clean', tone: 'success', icon: CircleCheck },
  { id: 'occupied', label: 'Occupied', tone: 'neutral', icon: BedDouble },
  { id: 'dirty', label: 'Needs cleaning', tone: 'warning', icon: Sparkles },
  { id: 'out-of-order', label: 'Out of order', tone: 'danger', icon: Wrench },
]

export const HOTEL_SIZE = { width: 1000, height: 460 }

/** Floor 2: rooms 201–210 on both sides of the corridor. */
export const HOTEL_ITEMS: FloorItem[] = [
  { id: 'lift', kind: 'counter', label: 'Lift', x: 900, y: 40, width: 100, height: 160 },
  ...[201, 202, 203, 204, 205].map((number, index) => ({
    id: `r${String(number)}`,
    kind: 'room' as const,
    label: `Room ${String(number)}`,
    shortLabel: String(number),
    x: index * 175,
    y: 40,
    width: 165,
    height: 160,
    capacity: index === 0 ? 3 : 2,
    areaId: 'floor-2',
    stateId: ['occupied', 'dirty', 'vacant-clean', 'occupied', 'out-of-order'][index] ?? 'occupied',
    ...(index === 4 ? { note: 'Shower leaking, plumber on Monday' } : {}),
  })),
  ...[206, 207, 208, 209, 210].map((number, index) => ({
    id: `r${String(number)}`,
    kind: 'room' as const,
    label: `Room ${String(number)}`,
    shortLabel: String(number),
    x: index * 200,
    y: 300,
    width: 190,
    height: 160,
    capacity: 2,
    areaId: 'floor-2',
    stateId: ['vacant-clean', 'occupied', 'occupied', 'dirty', 'vacant-clean'][index] ?? 'occupied',
  })),
]

export const HOTEL_AREAS: FloorArea[] = [
  { id: 'floor-2', label: 'Floor 2', x: 0, y: 0, width: 1000, height: 460 },
  { id: 'corridor', label: 'Corridor', x: 0, y: 210, width: 1000, height: 80 },
]

// ── The wedding of Ana and Marko: seating ────────────────────────────────────────────────────

/** Sala Fruškać: 1000 × 700 units, a head table, eight round tables of eight, a dance floor. */
export const WEDDING_SIZE = { width: 1000, height: 700 }

export const WEDDING_TABLES: SeatingTable[] = [
  {
    id: 'head',
    label: 'Head table',
    shortLabel: 'Head',
    shape: 'rect',
    x: 380,
    y: 40,
    width: 240,
    height: 60,
    seats: 6,
  },
  ...[0, 1, 2, 3].map((index) => ({
    id: `w${String(index + 1)}`,
    label: `Table ${String(index + 1)}`,
    shortLabel: String(index + 1),
    shape: 'round' as const,
    x: 80 + index * 230,
    y: 230,
    width: 90,
    height: 90,
    seats: 8,
  })),
  ...[0, 1, 2, 3].map((index) => ({
    id: `w${String(index + 5)}`,
    label: `Table ${String(index + 5)}`,
    shortLabel: String(index + 5),
    shape: 'round' as const,
    x: 80 + index * 230,
    y: 480,
    width: 90,
    height: 90,
    seats: 8,
  })),
]

export const WEDDING_FIXTURES: FloorItem[] = [
  { id: 'dance', kind: 'stage', label: 'Dance floor', x: 360, y: 380, width: 280, height: 60 },
]

const FIRST = [
  'Ana',
  'Marko',
  'Jelena',
  'Nikola',
  'Milica',
  'Stefan',
  'Ivana',
  'Luka',
  'Sara',
  'Petar',
  'Tamara',
  'Vuk',
  'Teodora',
  'Filip',
  'Katarina',
  'Đorđe',
]
const LAST = [
  'Petrović',
  'Jovanović',
  'Ilić',
  'Kovačević',
  'Nikolić',
  'Marković',
  'Stojanović',
  'Popović',
  'Đorđević',
  'Lukić',
]
const GROUPS = ['Family of the bride', 'Family of the groom', 'Friends from school', 'Colleagues']
const NOTES = [
  ['Vegetarian'],
  [],
  [],
  ['Gluten-free'],
  [],
  [],
  ['Child, high chair'],
  [],
  ['Vegan'],
  [],
]

/**
 * 60 guests: the couple and the best man and maid of honour at the head table, then the round
 * tables filled seat by seat (six of eight on each) — 52 seated, 8 not yet.
 */
export const WEDDING_GUESTS: SeatingGuest[] = Array.from({ length: 60 }, (_, index) => {
  const first = FIRST[index % FIRST.length] ?? ''
  const last = LAST[(index * 3) % LAST.length] ?? ''
  const notes = NOTES[index % NOTES.length] ?? []
  let seat: SeatingGuest['seat'] = null
  if (index < 4) seat = { tableId: 'head', seat: [2, 3, 1, 5][index] ?? 1 }
  else if (index < 52) {
    const at = index - 4
    seat = { tableId: `w${String(Math.floor(at / 6) + 1)}`, seat: (at % 6) + 1 }
  }
  return {
    id: `g${String(index + 1)}`,
    name: index === 0 ? 'Ana Petrović' : index === 1 ? 'Marko Ilić' : `${first} ${last}`,
    group: index < 2 ? 'The couple' : (GROUPS[index % GROUPS.length] ?? ''),
    ...(notes.length > 0 ? { notes } : {}),
    seat,
  }
})

/** A guest's name by id. */
function nameOf(id: string): string {
  return WEDDING_GUESTS.find((guest) => guest.id === id)?.name ?? id
}

/** The application's conflicts: two guests to keep apart, a table asked for one more than it has. */
export const WEDDING_CONFLICTS: SeatingConflict[] = [
  {
    id: 'apart',
    tone: 'danger',
    text: `Keep apart: ${nameOf('g6')} and ${nameOf('g9')} asked not to share a table.`,
    tableId: 'w1',
    guestIds: ['g6', 'g9'],
  },
  {
    id: 'full',
    tone: 'warning',
    text: 'Table 8 asked for 9 places; it has 8 seats.',
    tableId: 'w8',
  },
]

// ── Many areas (P5.28 item 26): a garden restaurant on two floors ───────────────────────────

/** Seven areas: the switcher is a select (more than four). */
const MANY: { id: string; label: string; x: number; y: number; width: number; height: number }[] = [
  { id: 'hall', label: 'Hall', x: 0, y: 0, width: 600, height: 400 },
  { id: 'terrace', label: 'Terrace', x: 600, y: 0, width: 400, height: 400 },
  { id: 'garden', label: 'Garden', x: 1000, y: 0, width: 600, height: 400 },
  { id: 'downstairs', label: 'Downstairs', x: 0, y: 400, width: 500, height: 400 },
  { id: 'wine', label: 'Wine cellar', x: 500, y: 400, width: 300, height: 400 },
  { id: 'floor-2', label: 'Floor 2', x: 800, y: 400, width: 500, height: 400 },
  { id: 'winter', label: 'Winter garden', x: 1300, y: 400, width: 300, height: 400 },
]

export const MANY_AREAS: FloorArea[] = MANY

export const MANY_AREAS_SIZE = { width: 1600, height: 800 }

/** Two or three tables in every area, each table's state in turn. */
export const MANY_AREAS_ITEMS: FloorItem[] = MANY.flatMap((area, index) =>
  [0, 1, 2].slice(0, area.width >= 500 ? 3 : 2).map((column) => {
    const id = `t${String(index * 3 + column + 1)}`
    const state = ['free', 'occupied', 'reserved'][(index + column) % 3] ?? 'free'
    const guests =
      state === 'occupied' ? party(3, '19:20') : state === 'reserved' ? party(4, '20:00', true) : {}
    return round(id, area.x + 40 + column * 150, area.y + 140, area.id, 4, state, guests)
  }),
)
