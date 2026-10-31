/*
 * The example data (floor plans), fictitious, on the examples' today, Tuesday
 * 6 October 2026: Bistro Dunav on the quay in Novi Sad during the evening service (19:40) — the
 * hall (Sala), the terrace (Terasa) and the bar, tables free, occupied (since when, how many) and
 * reserved (for when, how many, for whom); the takeaway and delivery orders. The states and their
 * tones are the application's map: Bistro Dunav has no "Needs cleaning" state (a
 * cleared table is free at once; an application may turn one on). Amounts are whole paras
 * (BigInt): every line total, total and tax is computed here, as the application would; the
 * components add nothing. The stated figures are checked in dataset-checks.ts. Not part of the
 * package. No classes here.
 */
import { CalendarClock, CircleCheck, UsersRound } from 'lucide-react'
import type { FloorArea, FloorItem, FloorState } from '@veljaos/ui'

export const K_ROUTES = {
  /** The service: the floor with nothing chosen. */
  floor: '/restaurant/bistro-dunav/floor',
  /** Table 7 chosen: its party and what can be done. */
  floorTable: '/restaurant/bistro-dunav/floor?table=t7',
  /** Occupied table 5: "Move to table…" open. */
  floorMove: '/restaurant/bistro-dunav/floor?table=t5&move',
  /** Reserved table 8 (six guests): "Move to table…" open; no free table has six seats. */
  floorMoveNone: '/restaurant/bistro-dunav/floor?table=t8&move',
  /** The takeaway orders (a channel, not an area). */
  floorTakeaway: '/restaurant/bistro-dunav/floor?channel=takeaway',
  /** The floor on one area: the terrace. */
  floorTerrace: '/restaurant/bistro-dunav/floor?area=terasa',
  /** The floor plan's editor, where the "Floor plan" tab leads (not one of the examples). */
  floorEdit: '/restaurant/bistro-dunav/floor/edit',
}

// ── Bistro Dunav ──────────────────────────────────────────────────────────────────────────────

export const BISTRO = {
  companyId: 'bistro-dunav',
  name: 'Bistro Dunav',
  address: 'Kej žrtava racije 2, Novi Sad',
  /** The service's clock, the application's. */
  now: '19:40',
  manager: { name: 'Dragana Ilić', email: 'dragana.ilic@bistrodunav.rs' },
}

/** The restaurant's states: its own map of words, tones and icons. */
export const BISTRO_STATES: FloorState[] = [
  { id: 'free', label: 'Free', tone: 'success', icon: CircleCheck },
  { id: 'occupied', label: 'Occupied', tone: 'neutral', icon: UsersRound },
  { id: 'reserved', label: 'Reserved', tone: 'premium', icon: CalendarClock },
]

/** 1200 × 760 centimetres of floor. */
export const BISTRO_SIZE = { width: 1200, height: 760 }

export const BISTRO_AREAS: FloorArea[] = [
  { id: 'sala', label: 'Sala', x: 0, y: 0, width: 760, height: 760 },
  { id: 'terasa', label: 'Terasa', x: 780, y: 0, width: 420, height: 480 },
  { id: 'bar', label: 'Bar', x: 780, y: 500, width: 420, height: 260 },
]

/** A table's party, as the restaurant's application keeps it. */
export interface Party {
  /** How many guests; unknown for a table opened with one tap. */
  size?: number
  /** Occupied since, or reserved for (HH:mm). */
  time: string
  /** The reservation's name. */
  name?: string
  /** The reservation's phone. */
  phone?: string
  note?: string
}

/** A table of the restaurant: where it stands, and its party. */
export interface BistroTable {
  id: string
  number: number
  shape: 'round' | 'rect'
  x: number
  y: number
  width: number
  height: number
  rotation?: 0 | 90
  seats: number
  areaId: string
  state: 'free' | 'occupied' | 'reserved'
  party?: Party
}

function table(
  number: number,
  shape: 'round' | 'rect',
  box: [number, number, number, number],
  areaId: string,
  seats: number,
  state: BistroTable['state'],
  party?: Party,
): BistroTable {
  const [x, y, width, height] = box
  return {
    id: `t${String(number)}`,
    number,
    shape,
    x,
    y,
    width,
    height,
    seats,
    areaId,
    state,
    ...(party === undefined ? {} : { party }),
  }
}

export const BISTRO_TABLES: BistroTable[] = [
  table(1, 'round', [60, 80, 90, 90], 'sala', 2, 'occupied', { size: 2, time: '19:05' }),
  table(2, 'round', [220, 80, 90, 90], 'sala', 2, 'free'),
  table(3, 'rect', [380, 80, 150, 90], 'sala', 4, 'reserved', {
    size: 4,
    time: '20:00',
    name: 'Jovanović',
    phone: '064 123 4567',
  }),
  table(4, 'rect', [570, 80, 150, 90], 'sala', 4, 'free'),
  table(5, 'round', [60, 290, 100, 100], 'sala', 4, 'occupied', {
    size: 3,
    time: '19:20',
    note: 'Asked for a quieter table',
  }),
  table(6, 'round', [230, 290, 100, 100], 'sala', 4, 'free'),
  table(7, 'rect', [400, 290, 150, 100], 'sala', 6, 'occupied', { size: 5, time: '18:50' }),
  table(8, 'rect', [590, 290, 130, 100], 'sala', 6, 'reserved', {
    size: 6,
    time: '20:30',
    name: 'Kovačević',
    phone: '063 777 0201',
    note: 'Birthday, cake at 22:00',
  }),
  table(9, 'rect', [60, 520, 320, 110], 'sala', 10, 'reserved', {
    size: 9,
    time: '21:00',
    name: 'Vojvođanka Mlin a.d.',
    phone: '021 456 7890',
  }),
  table(10, 'round', [460, 530, 100, 100], 'sala', 4, 'free'),
  // The terrace: 11 and 12 stand side by side and can be put together.
  table(11, 'rect', [820, 60, 120, 90], 'terasa', 4, 'free'),
  table(12, 'rect', [940, 60, 120, 90], 'terasa', 4, 'free'),
  table(13, 'round', [830, 220, 90, 90], 'terasa', 2, 'occupied', { size: 2, time: '19:30' }),
  table(14, 'round', [990, 220, 90, 90], 'terasa', 2, 'reserved', {
    size: 2,
    time: '19:45',
    name: 'Marić',
    phone: '065 300 1122',
  }),
  table(15, 'round', [830, 360, 90, 90], 'terasa', 2, 'free'),
  table(16, 'round', [990, 360, 90, 90], 'terasa', 2, 'occupied', { size: 2, time: '19:10' }),
  // The bar.
  table(17, 'round', [830, 560, 80, 80], 'bar', 2, 'free'),
  table(18, 'round', [1000, 560, 80, 80], 'bar', 2, 'occupied', { size: 1, time: '19:35' }),
]

/**
 * What else stands on the floor: the bar counter (no walls, doors or windows; the
 * areas are the hall, the terrace and the bar).
 */
export const BISTRO_FIXTURES: FloorItem[] = [
  {
    id: 'counter',
    kind: 'counter',
    label: 'Bar counter',
    x: 820,
    y: 680,
    width: 340,
    height: 60,
    areaId: 'bar',
  },
]

/** "4 guests", the party with its noun; empty while the number is not known. */
export function guestsText(size: number | undefined, number: (value: string) => string): string {
  if (size === undefined) return ''
  return size === 1 ? '1 guest' : `${number(String(size))} guests`
}

/** "4 guests · 19:20", or only the time while the number is not known. */
function partyText(first: string, second: string): string {
  return [first, second].filter((part) => part !== '').join(' · ')
}

/**
 * The tables as the plan draws them: the state's words come from the map; the detail (the list and
 * the name) says since when and how many (occupied) or for when and how many (reserved); the plan
 * writes only the guests under the number (the time is in the list and the panel).
 */
export function bistroItems(
  tables: readonly BistroTable[],
  number: (value: string) => string,
): FloorItem[] {
  return [
    ...BISTRO_FIXTURES,
    ...tables.map((each) => {
      const party = each.party
      const detail =
        party === undefined
          ? undefined
          : each.state === 'reserved'
            ? partyText(party.time, guestsText(party.size, number))
            : partyText(guestsText(party.size, number), party.time)
      return {
        id: each.id,
        kind: 'table' as const,
        shape: each.shape,
        label: `Table ${String(each.number)}`,
        shortLabel: String(each.number),
        x: each.x,
        y: each.y,
        width: each.width,
        height: each.height,
        ...(each.rotation === undefined ? {} : { rotation: each.rotation }),
        capacity: each.seats,
        areaId: each.areaId,
        stateId: each.state,
        ...(detail === undefined || party === undefined
          ? {}
          : {
              detail,
              planDetail: party.size === undefined ? party.time : guestsText(party.size, number),
            }),
        ...(party?.note === undefined ? {} : { note: party.note }),
      }
    }),
  ]
}

/**
 * The tables a party can move to, best first (the restaurant's rule): free, with seats enough; in
 * the party's area first, then the fewest seats left over, then by number.
 */
export function moveTargets(tables: readonly BistroTable[], from: BistroTable): BistroTable[] {
  const size = from.party?.size ?? 0
  return tables
    .filter((each) => each.state === 'free' && each.seats >= size && each.id !== from.id)
    .sort(
      (a, b) =>
        Number(b.areaId === from.areaId) - Number(a.areaId === from.areaId) ||
        a.seats - b.seats ||
        a.number - b.number,
    )
}

/**
 * Orders that are not at a table: takeaway and delivery are the till's order
 * channels beside dine-in, never areas of the floor plan.
 */
export interface ChannelOrder {
  id: string
  channel: 'takeaway' | 'delivery'
  number: string
  name: string
  /** Pick-up or delivery time (HH:mm). */
  time: string
  state: 'preparing' | 'ready' | 'out' | 'done'
  /** The order's total, computed by the till. */
  total: string
  address?: string
  phone?: string
}

export const BISTRO_ORDERS: ChannelOrder[] = [
  {
    id: 'o41',
    channel: 'takeaway',
    number: 'T-041',
    name: 'Marko Pavlović',
    time: '19:55',
    state: 'preparing',
    total: '1540.00',
    phone: '064 222 3344',
  },
  {
    id: 'o42',
    channel: 'takeaway',
    number: 'T-042',
    name: 'Ivana Simić',
    time: '20:10',
    state: 'ready',
    total: '890.00',
  },
  {
    id: 'o17',
    channel: 'delivery',
    number: 'D-017',
    name: 'Stefan Ilić',
    time: '20:15',
    state: 'preparing',
    total: '2380.00',
    address: 'Bulevar oslobođenja 46, Novi Sad',
    phone: '063 441 9087',
  },
]
