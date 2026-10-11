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
import { Ban, CalendarClock, CircleCheck, Receipt, Sparkles, UsersRound } from 'lucide-react'
import type {
  CartAmount,
  CartLine,
  FloorArea,
  FloorItem,
  FloorPaletteEntry,
  FloorState,
  PosProduct,
  ProductCategory,
  SeatingConflict,
  SeatingGuest,
  SeatingTable,
} from '@veljaos/ui'
import { decimal, paras, sumUnits } from '../../../../packages/ui/src/components/amounts-story-data'

export const K_ROUTES = {
  /** The service: the floor with nothing chosen. */
  floor: '/restaurant/bistro-dunav/floor',
  /** Table 7 chosen: its party and what can be done. */
  floorTable: '/restaurant/bistro-dunav/floor?table=t7',
  /** Free table 4: "Open table" asked how many. */
  floorOpen: '/restaurant/bistro-dunav/floor?table=t4&open',
  /** Occupied table 5: "Move to table…" open. */
  floorMove: '/restaurant/bistro-dunav/floor?table=t5&move',
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

/** The building: windows to the quay, the wall to the terrace, the doors, the bar counter. */
export const BISTRO_FIXTURES: FloorItem[] = [
  {
    id: 'windows',
    kind: 'window',
    label: 'Windows to the quay',
    x: 40,
    y: 0,
    width: 680,
    height: 14,
  },
  { id: 'wall', kind: 'wall', label: 'Wall', x: 760, y: 0, width: 20, height: 600 },
  { id: 'door', kind: 'door', label: 'Entrance', x: 560, y: 736, width: 120, height: 24 },
  {
    id: 'door-terrace',
    kind: 'door',
    label: 'Door to the terrace',
    x: 760,
    y: 620,
    width: 20,
    height: 100,
  },
  { id: 'counter', kind: 'counter', label: 'Bar counter', x: 820, y: 680, width: 340, height: 50 },
]

/** The palette of the floor plan's edit mode. */
export const BISTRO_PALETTE: FloorPaletteEntry[] = [
  {
    id: 'round',
    kind: 'table',
    shape: 'round',
    label: 'Round table',
    width: 90,
    height: 90,
    capacity: 2,
  },
  {
    id: 'rect',
    kind: 'table',
    shape: 'rect',
    label: 'Table for four',
    width: 150,
    height: 90,
    capacity: 4,
  },
  { id: 'wall', kind: 'wall', label: 'Wall', width: 200, height: 20 },
]

/** "4 guests", the party with its noun. */
export function guestsText(size: number, number: (value: string) => string): string {
  return size === 1 ? '1 guest' : `${number(String(size))} guests`
}

/**
 * The tables as the plan draws them: the state's words come from the map; the detail says since
 * when and how many (occupied) or for when and how many (reserved).
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
        ...(detail === undefined ? {} : { detail }),
        ...(party?.note === undefined ? {} : { note: party.note }),
      }
    }),
  ]
}

/** The tables a party can move to: free, with seats enough. */
export function moveTargets(tables: readonly BistroTable[], from: BistroTable): BistroTable[] {
  const size = from.party?.size ?? 0
  return tables.filter((each) => each.state === 'free' && each.seats >= size && each.id !== from.id)
}

/** A box on the plan. */
export interface Box {
  x: number
  y: number
  width: number
  height: number
}

/**
 * The restaurant's merge: two tables standing side by side become one — the box round both.
 * Null when they do not touch side by side.
 */
export function mergedBox(a: Box, b: Box): Box | null {
  const touch =
    (a.x + a.width === b.x || b.x + b.width === a.x) && a.y < b.y + b.height && b.y < a.y + a.height
  if (!touch) return null
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  }
}

// ── Kafić Kod Mike ─────────────────────────────────────────────────────────────────────────────

export const CAFE = {
  name: 'Kafić Kod Mike',
  register: 'Kasa Terasa',
  waiter: 'Mika Petrović',
  currency: 'RSD',
}

export const CAFE_STATES: FloorState[] = [
  { id: 'free', label: 'Free', tone: 'success', icon: CircleCheck },
  { id: 'open', label: 'Order open', tone: 'neutral', icon: UsersRound },
  { id: 'bill', label: 'Bill asked for', tone: 'warning', icon: Receipt },
  { id: 'closed', label: 'Not in use', tone: 'danger', icon: Ban },
]

export const CAFE_SIZE = { width: 800, height: 520 }

export const CAFE_CATEGORIES: ProductCategory[] = [
  { id: 'coffee', label: 'Kafa' },
  { id: 'soft', label: 'Sokovi' },
  { id: 'cakes', label: 'Kolači' },
]

export const CAFE_PRODUCTS: PosProduct[] = [
  { id: 'espresso', name: 'Espresso', price: '160.00', categoryId: 'coffee' },
  { id: 'macchiato', name: 'Makijato', price: '180.00', categoryId: 'coffee' },
  { id: 'cappuccino', name: 'Kapućino', price: '220.00', categoryId: 'coffee' },
  { id: 'domestic', name: 'Domaća kafa', price: '150.00', categoryId: 'coffee' },
  { id: 'lemonade', name: 'Limunada', price: '250.00', categoryId: 'soft' },
  { id: 'orange', name: 'Ceđena pomorandža', price: '320.00', categoryId: 'soft' },
  { id: 'water', name: 'Kisela voda 0,25', price: '140.00', categoryId: 'soft' },
  { id: 'cola', name: 'Kola 0,25', price: '200.00', categoryId: 'soft' },
  { id: 'baklava', name: 'Baklava', price: '230.00', categoryId: 'cakes' },
  {
    id: 'cheesecake',
    name: 'Čizkejk',
    price: '340.00',
    categoryId: 'cakes',
    unavailableReason: 'Sold out today',
  },
]

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

/** The order's lines and totals, as the till's application computes them. */
export function computeOrder(order: readonly OrderLine[]): {
  lines: { productId: string; name: string; quantity: number; price: bigint; total: bigint }[]
  total: bigint
  vat: bigint
} {
  const lines = order.flatMap((line) => {
    const product = CAFE_PRODUCTS.find((each) => each.id === line.productId)
    if (product === undefined) return []
    const price = paras(product.price)
    return [
      {
        productId: line.productId,
        name: product.name,
        quantity: line.quantity,
        price,
        total: price * BigInt(line.quantity),
      },
    ]
  })
  const total = sumUnits(lines.map((line) => line.total))
  // VAT 20% included: total × 20 / 120, half up to whole paras.
  const vat = (total * 20n * 2n + 120n) / (120n * 2n)
  return { lines, total, vat }
}

/** The order as the cart shows it. */
export function cafeCartLines(order: readonly OrderLine[]): CartLine[] {
  return computeOrder(order).lines.map((line) => ({
    id: line.productId,
    name: line.name,
    quantity: String(line.quantity),
    unitPrice: decimal(line.price),
    total: decimal(line.total),
  }))
}

export function cafeCartTotals(order: readonly OrderLine[]): CartAmount[] {
  return [{ id: 'vat', label: 'VAT 20% included', value: decimal(computeOrder(order).vat) }]
}

/** Table 3's order as the till states it: 2 × 220 + 250 + 2 × 140 + 230 = 1.200,00 RSD. */
export const TABLE_3_FIGURES = { total: '1200.00', vat: '200.00' }

// ── Konferencija Liro 2026, the gala dinner ───────────────────────────────────────────────────

export const GALA = {
  title: 'Konferencija Liro 2026, gala večera',
  hall: 'Kongresni centar Master, Novosadski sajam',
  date: '2026-10-22',
  organiser: { name: 'Teodora Jovanović', email: 'teodora.jovanovic@liro.rs' },
}

/** The hall: 1200 × 940 units; seats 36 units, 6 from their table. */
export const GALA_SIZE = { width: 1200, height: 940 }
export const GALA_SEAT = { size: 36, gap: 6 }

/** Fourteen round tables of ten: five, five and four, the speakers' table first. */
export const GALA_TABLES: SeatingTable[] = Array.from({ length: 14 }, (_, index) => {
  const row = index < 5 ? 0 : index < 10 ? 1 : 2
  const column = row === 2 ? index - 10 : index - row * 5
  const offset = row === 2 ? 120 : 0
  return {
    id: `t${String(index + 1)}`,
    label: index === 0 ? 'Table 1, speakers' : `Table ${String(index + 1)}`,
    shortLabel: String(index + 1),
    shape: 'round' as const,
    x: 75 + offset + column * 230,
    y: 220 + row * 240,
    width: 110,
    height: 110,
    seats: 10,
  }
})

export const GALA_FIXTURES: FloorItem[] = [
  { id: 'stage', kind: 'stage', label: 'Stage', x: 350, y: 20, width: 500, height: 90 },
  { id: 'entrance', kind: 'door', label: 'Entrance', x: 540, y: 916, width: 120, height: 24 },
  { id: 'service', kind: 'door', label: 'Service door', x: 0, y: 40, width: 24, height: 120 },
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
  'Mina',
  'Aleksa',
  'Dunja',
  'Uroš',
]
const LAST = ['Petrović', 'Jovanović', 'Ilić', 'Kovačević', 'Nikolić', 'Marković', 'Stojanović']
const COMPANIES = [
  'Kvadrat Gradnja',
  'Vojvođanka Mlin',
  'Medic Lab Niš',
  'Panonija Agro',
  'Drina Prevoz',
  'Bojović i sinovi',
  'Liro team',
]
const DIETS: readonly (readonly string[])[] = [
  [],
  [],
  ['Vegetarian'],
  [],
  [],
  ['Gluten-free'],
  [],
  [],
  [],
  ['Vegan'],
  [],
  [],
  ['Lactose-free'],
]

/**
 * 140 guests, each a name of its own (20 first names × 7 surnames), their company and diet; the
 * first 112 seated eight to a table, seats 1–8, the last 28 not yet.
 */
export const GALA_GUESTS: SeatingGuest[] = Array.from({ length: 140 }, (_, index) => {
  const notes = DIETS[index % DIETS.length] ?? []
  return {
    id: `g${String(index + 1)}`,
    name: `${FIRST[index % FIRST.length] ?? ''} ${LAST[Math.floor(index / FIRST.length) % LAST.length] ?? ''}`,
    group: COMPANIES[index % COMPANIES.length] ?? '',
    ...(notes.length > 0 ? { notes } : {}),
    seat:
      index < 112
        ? { tableId: `t${String(Math.floor(index / 8) + 1)}`, seat: (index % 8) + 1 }
        : null,
  }
})

/** The name of a guest by id. */
export function galaGuest(id: string): string {
  return GALA_GUESTS.find((guest) => guest.id === id)?.name ?? id
}

/** The organiser's conflicts: two competitors at one table, a company asking for more seats. */
export const GALA_CONFLICTS: SeatingConflict[] = [
  {
    id: 'apart',
    tone: 'danger',
    text: `Keep apart: ${galaGuest('g41')} and ${galaGuest('g45')} asked for different tables.`,
    tableId: 't6',
    guestIds: ['g41', 'g45'],
  },
  {
    id: 'panonija',
    tone: 'warning',
    text: 'Panonija Agro asked for 12 places together; a table has 10.',
    tableId: 't12',
  },
]

/** The seating's count as the page states it: 112 of 140. */
export const GALA_SEATED = { seated: 112, total: 140 }
