/*
 * Group K's example data (P5.25, floor plans and seating), fictitious, on the examples' today,
 * Tuesday 6 October 2026:
 * - Bistro Dunav on the quay in Novi Sad during the evening service (19:40): the hall (Sala), the
 *   terrace (Terasa) and the bar, tables free, occupied (since when, how many) and reserved (for
 *   when, how many, for whom), one waiting to be cleaned.
 * - Kafić Kod Mike: its terrace of eight tables, each open table with its order on the till.
 * - Konferencija Liro 2026, the gala dinner in the Master congress hall of the Novi Sad Fair:
 *   14 round tables of 10, 140 guests, 112 seated.
 * The states and their tones are the application's map. Amounts are whole paras (BigInt): every
 * line total, total and tax is computed here, as the application would; the components add
 * nothing (D4). The stated figures are checked in dataset-checks.ts. Not part of the package.
 * No classes here.
 */
import { CalendarClock, CircleCheck, Sparkles, UsersRound } from 'lucide-react'
import type { FloorArea, FloorItem, FloorState } from '@veljaos/ui'

export const K_ROUTES = {
  /** The service: the floor with nothing chosen. */
  floor: '/restaurant/bistro-dunav/floor',
  /** Table 7 chosen: its party and what can be done. */
  floorTable: '/restaurant/bistro-dunav/floor?table=t7',
  /** Free table 4: "Open table" asked how many. */
  floorOpen: '/restaurant/bistro-dunav/floor?table=t4&open',
  /** Occupied table 5: "Move to table…" open. */
  floorMove: '/restaurant/bistro-dunav/floor?table=t5&move',
  /** Reserved table 8 (six guests): "Move to table…" open; no free table has six seats. */
  floorMoveNone: '/restaurant/bistro-dunav/floor?table=t8&move',
  /** The takeaway orders (P5.28 item 26: a channel, not an area). */
  floorTakeaway: '/restaurant/bistro-dunav/floor?channel=takeaway',
  /** The floor on one area: the terrace (P5.28 item 26). */
  floorTerrace: '/restaurant/bistro-dunav/floor?area=terasa',
  /** The floor plan in edit mode, terrace tables 11 and 12 chosen to merge. */
  floorEdit: '/restaurant/bistro-dunav/floor/edit',
  /** Tables 11 and 12 merged into one. */
  floorMerged: '/restaurant/bistro-dunav/floor/edit?merged',
  /** Kafić Kod Mike: the terrace on the bar's tablet. */
  terrace: '/cafe/kod-mike/terrace',
  /** Table 3's order on the till. */
  terraceTable: '/cafe/kod-mike/terrace/t3',
  /** The gala dinner's seating. */
  seating: '/events/liro-2026/seating',
  /** A free seat chosen: table 4, seat 9. */
  seatingSeat: '/events/liro-2026/seating?seat=t4-9',
  /** "Seat at…" for a guest not seated yet. */
  seatingSeatAt: '/events/liro-2026/seating?seat-at=g113',
  /** Table 6's guests in seat order. */
  seatingTable: '/events/liro-2026/seating?table=t6',
  /** Three seating changes pending, "Save seating…" asked (P5.28 item 9). */
  seatingPending: '/events/liro-2026/seating?pending',
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
  { id: 'cleaning', label: 'Needs cleaning', tone: 'warning', icon: Sparkles },
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
  /** How many guests. */
  size: number
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
  state: 'free' | 'occupied' | 'reserved' | 'cleaning'
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
  table(6, 'round', [230, 290, 100, 100], 'sala', 4, 'cleaning'),
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
 * What else stands on the floor: the bar counter (P5.28 item 23: no walls, doors or windows; the
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

/** "4 guests", the party with its noun. */
export function guestsText(size: number, number: (value: string) => string): string {
  return size === 1 ? '1 guest' : `${number(String(size))} guests`
}

/**
 * The tables as the plan draws them: the state's words come from the map; the detail (the list and
 * the name) says since when and how many (occupied) or for when and how many (reserved); the plan
 * writes only the guests under the number (P5.28 item 24: the time is in the list and the panel).
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
            ? `${party.time} · ${guestsText(party.size, number)}`
            : `${guestsText(party.size, number)} · ${party.time}`
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
          : { detail, planDetail: guestsText(party.size, number) }),
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
 * Orders that are not at a table (P5.28 item 26): takeaway and delivery are the till's order
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

// ── Kafić Kod Mike ─────────────────────────────────────────────────────────────────────────────

/** A line of an order: a product and how many. */
export interface OrderLine {
  productId: string
  quantity: number
}

/** A terrace table and its open order. */
export interface CafeTable {
  id: string
  number: number
  x: number
  y: number
  state: 'free' | 'open' | 'bill' | 'closed'
  /** When the order was opened (HH:mm). */
  since?: string
  order: OrderLine[]
  note?: string
}

export const CAFE_TABLES: CafeTable[] = [
  {
    id: 't1',
    number: 1,
    x: 60,
    y: 60,
    state: 'open',
    since: '17:50',
    order: [{ productId: 'espresso', quantity: 2 }],
  },
  { id: 't2', number: 2, x: 240, y: 60, state: 'free', order: [] },
  {
    id: 't3',
    number: 3,
    x: 420,
    y: 60,
    state: 'open',
    since: '18:15',
    order: [
      { productId: 'cappuccino', quantity: 2 },
      { productId: 'lemonade', quantity: 1 },
      { productId: 'water', quantity: 2 },
      { productId: 'baklava', quantity: 1 },
    ],
  },
  {
    id: 't4',
    number: 4,
    x: 600,
    y: 60,
    state: 'bill',
    since: '17:20',
    order: [
      { productId: 'domestic', quantity: 2 },
      { productId: 'cola', quantity: 1 },
    ],
  },
  { id: 't5', number: 5, x: 60, y: 300, state: 'free', order: [] },
  {
    id: 't6',
    number: 6,
    x: 240,
    y: 300,
    state: 'open',
    since: '18:30',
    order: [{ productId: 'orange', quantity: 1 }],
  },
  { id: 't7', number: 7, x: 420, y: 300, state: 'closed', order: [], note: 'Umbrella broken' },
  { id: 't8', number: 8, x: 600, y: 300, state: 'free', order: [] },
]

// ── Konferencija Liro 2026, the gala dinner ───────────────────────────────────────────────────
