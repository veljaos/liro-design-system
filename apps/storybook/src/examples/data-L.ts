/*
 * Group L's example data (P5.25, a hotel): Hotel Fruška, Sremski Karlovci (fictitious), four
 * floors of ten rooms on Tuesday 6 October 2026 (the examples' today). One dataset: every stay
 * has a room, an arrival and a departure; the room rack's state of each room today, the counts in
 * the key figures and the booking timeline are all worked out from the stays here — the
 * application's work, played here and checked at the end of this file; components only show
 * them. Prices, taxes and policies are illustrative. Not part of the package. No classes here.
 */
import { addDays, type RackFloor, type RackRoom, type ScheduleBooking } from '@veljaos/ui'

export const HOTEL = {
  name: 'Hotel Fruška',
  company: 'Fruška Turist d.o.o.',
  companyId: 'fruska',
  town: 'Sremski Karlovci',
  today: '2026-10-06',
  currency: 'RSD',
} as const

export const L_ROUTES = {
  rack: '/hotel/rack',
  /** The rack with room 204 open in its drawer (the guest departs today). */
  rackRoom: '/hotel/rack?room=204',
  /** The rack with room 104 open: a VIP arriving today, the room ready. */
  rackArrival: '/hotel/rack?room=104',
  timeline: '/hotel/bookings',
  housekeeping: '/hotel/housekeeping/floor-3',
  /** Floor 3's rooms to clean with room 306 open: Mark clean. */
  housekeepingRoom: '/hotel/housekeeping/floor-3?room=306',
} as const

// ── Rooms and stays ───────────────────────────────────────────────────────────────────────────

export type Housekeeping = 'clean' | 'inspected' | 'progress' | 'dirty'

interface RoomSpec {
  number: string
  type: string
  housekeeping: Housekeeping
  /** Out of order until (and including) this day, with the reason. */
  outOfOrder?: { until: string; reason: string }
  notes?: RackRoom['notes']
}

export interface Stay {
  id: string
  room: string
  guest: string
  /** YYYY-MM-DD; the guest leaves on `departure` (no night then). */
  arrival: string
  departure: string
  adults: number
  /** A note on the booking ("VIP", "Extra bed"). */
  note?: string
}

/** Days from today. */
const day = (offset: number) => addDays(HOTEL.today, offset)

const spec = (
  number: string,
  type: string,
  housekeeping: Housekeeping,
  more: Partial<RoomSpec> = {},
): RoomSpec => ({ number, type, housekeeping, ...more })

export const ROOM_SPECS: RoomSpec[] = [
  spec('101', 'DBL', 'clean'),
  spec('102', 'TWN', 'dirty', { notes: [{ label: 'Late check-out 14:00', tone: 'warning' }] }),
  spec('103', 'SGL', 'inspected'),
  spec('104', 'DBL', 'inspected', { notes: [{ label: 'VIP', tone: 'premium' }] }),
  spec('105', 'DBL', 'dirty'),
  spec('106', 'TWN', 'clean'),
  spec('107', 'SGL', 'clean', { notes: [{ label: 'Long stay' }] }),
  spec('108', 'DBL', 'dirty', {
    outOfOrder: { until: day(2), reason: 'Bathroom renovation' },
  }),
  spec('109', 'DBL', 'dirty'),
  spec('110', 'TWN', 'progress'),
  spec('201', 'SUI', 'clean'),
  spec('202', 'DBL', 'inspected'),
  spec('203', 'DBL', 'dirty', { notes: [{ label: 'Allergy: feathers' }] }),
  spec('204', 'TWN', 'dirty'),
  spec('205', 'SGL', 'clean'),
  spec('206', 'DBL', 'progress'),
  spec('207', 'DBL', 'inspected'),
  spec('208', 'TWN', 'dirty', { notes: [{ label: 'Extra bed' }] }),
  spec('209', 'SGL', 'clean'),
  spec('210', 'DBL', 'dirty'),
  spec('301', 'DBL', 'clean'),
  spec('302', 'DBL', 'dirty'),
  spec('303', 'TWN', 'inspected'),
  spec('304', 'SGL', 'progress', { notes: [{ label: 'Arrives after 22:00' }] }),
  spec('305', 'DBL', 'dirty'),
  spec('306', 'DBL', 'dirty'),
  spec('307', 'TWN', 'clean'),
  spec('308', 'SGL', 'clean'),
  spec('309', 'DBL', 'dirty', {
    outOfOrder: { until: day(6), reason: 'Air conditioning repair' },
  }),
  spec('310', 'DBL', 'dirty'),
  spec('401', 'SUI', 'clean', { notes: [{ label: 'VIP', tone: 'premium' }] }),
  spec('402', 'APT', 'inspected'),
  spec('403', 'SUI', 'inspected'),
  spec('404', 'APT', 'clean'),
  spec('405', 'SUI', 'clean'),
  spec('406', 'DBL', 'dirty'),
  spec('407', 'DBL', 'progress'),
  spec('408', 'TWN', 'clean'),
  spec('409', 'SUI', 'inspected'),
  spec('410', 'APT', 'clean'),
]

/** The room types' names (the drawer says them in words). */
export const ROOM_TYPES: Record<string, string> = {
  SGL: 'Single',
  DBL: 'Double',
  TWN: 'Twin',
  SUI: 'Suite',
  APT: 'Apartment',
}

let next = 0
/** A stay in a room: from `from` days after today, for `nights` nights. */
const stay = (
  room: string,
  guest: string,
  from: number,
  nights: number,
  more: Partial<Stay> = {},
): Stay => {
  next += 1
  return {
    id: `S-2026-${String(4100 + next)}`,
    room,
    guest,
    arrival: day(from),
    departure: day(from + nights),
    adults: 2,
    ...more,
  }
}

export const STAYS: Stay[] = [
  stay('101', 'Marko Ilić', -2, 4),
  stay('101', 'Claire Martin', 3, 3),
  stay('102', 'Ana Petrović', -3, 3),
  stay('102', 'Lukas Novak', 1, 5),
  stay('103', 'Dragan Lazić', 4, 2, { adults: 1 }),
  stay('104', 'Jelena Stojanović', 0, 3, { note: 'VIP' }),
  stay('105', 'Thomas Becker', -1, 5),
  stay('106', 'Vesna Ristić', 2, 4),
  stay('107', 'Nikola Marković', -5, 9, { adults: 1 }),
  stay('108', 'Mina Zečević', 5, 3),
  stay('109', 'Sofia Rossi', -4, 4),
  stay('110', 'Hans Müller', 0, 2),
  stay('201', 'Emma Wilson', -1, 6),
  stay('202', 'Milica Jovanović', 0, 1),
  stay('203', 'Đorđe Vasić', -6, 7),
  stay('204', 'Paolo Bianchi', -2, 2),
  stay('204', 'Katarina Bogdanović', 1, 4),
  stay('205', 'Ognjen Tadić', 6, 2, { adults: 1 }),
  stay('206', 'Ivana Kovač', -1, 3),
  stay('207', 'Teodora Ivanović', 3, 5),
  stay('208', 'Stefan Nikolić', 0, 3, { adults: 3, note: 'Extra bed' }),
  stay('209', 'Luka Jovanović', -2, 5, { adults: 1 }),
  stay('210', 'Aleksa Pavlović', 1, 2),
  stay('301', 'Tamara Popović', -3, 5),
  stay('302', 'Lena Fischer', -1, 1),
  stay('303', 'Sara Milić', 2, 3),
  stay('304', 'Petar Đukić', 0, 2, { adults: 1 }),
  stay('305', 'Maja Savić', -4, 6),
  stay('306', 'Filip Kostić', 7, 3),
  stay('307', 'Jovan Mitrović', -1, 4),
  stay('310', 'Marina Horvat', -2, 2),
  stay('310', 'Bojana Lukić', 3, 2),
  stay('401', 'Andrej Kiš', -2, 7, { note: 'VIP' }),
  stay('402', 'Zorana Mišić', 4, 6),
  stay('403', 'Bojan Stanić', 0, 4),
  stay('404', 'Nevena Đorđević', -1, 3),
  stay('405', 'Miloš Radović', 1, 3),
  stay('406', 'Igor Šarić', -3, 8),
  stay('408', 'Olivia Brown', -1, 2),
  stay('409', 'Mia Kovačević', 2, 2),
  stay('410', 'Robert King', -6, 10),
]

// ── Today, worked out from the stays ──────────────────────────────────────────────────────────

export type Occupancy = 'vacant' | 'occupied' | 'arriving' | 'departing' | 'out'

/** A room's occupancy today and the stay it is about (the guest in it, or the one arriving). */
export function roomToday(room: RoomSpec): { occupancy: Occupancy; stay?: Stay } {
  if (room.outOfOrder !== undefined && room.outOfOrder.until >= HOTEL.today) {
    return { occupancy: 'out' }
  }
  const stays = STAYS.filter((each) => each.room === room.number)
  const departing = stays.find((each) => each.departure === HOTEL.today)
  if (departing !== undefined) return { occupancy: 'departing', stay: departing }
  const arriving = stays.find((each) => each.arrival === HOTEL.today)
  if (arriving !== undefined) return { occupancy: 'arriving', stay: arriving }
  const inHouse = stays.find((each) => each.arrival < HOTEL.today && each.departure > HOTEL.today)
  if (inHouse !== undefined) return { occupancy: 'occupied', stay: inHouse }
  return { occupancy: 'vacant' }
}

/** A room as the rack shows it today, with the room's housekeeping state given. */
export function rackRoom(room: RoomSpec, housekeeping: Housekeeping = room.housekeeping): RackRoom {
  const today = roomToday(room)
  const notes = [
    ...(room.notes ?? []),
    ...(room.outOfOrder === undefined || today.occupancy !== 'out'
      ? []
      : [{ label: room.outOfOrder.reason }]),
  ]
  return {
    id: room.number,
    number: room.number,
    type: room.type,
    occupancy: today.occupancy,
    housekeeping,
    ...(today.stay === undefined
      ? {}
      : {
          guest: today.stay.guest,
          arrival: today.stay.arrival,
          departure: today.stay.departure,
        }),
    ...(notes.length === 0 ? {} : { notes }),
  }
}

/** The rack's floors, with the housekeeping states the screen keeps (Mark clean changes them). */
export function rackFloors(housekeeping: Readonly<Record<string, Housekeeping>> = {}): RackFloor[] {
  return [1, 2, 3, 4].map((floor) => {
    const rooms = ROOM_SPECS.filter((room) => room.number.startsWith(String(floor)))
    const shown = rooms.map((room) => rackRoom(room, housekeeping[room.number]))
    const toClean = shown.filter((room) => room.housekeeping === 'dirty').length
    return {
      id: `floor-${String(floor)}`,
      label: `Floor ${String(floor)}`,
      description: `${String(rooms.length)} rooms · ${String(toClean)} to clean`,
      rooms: shown,
    }
  })
}

/** Today's figures, counted from the rooms (the application's work). */
export function todayFigures(floors: readonly RackFloor[]) {
  const rooms = floors.flatMap((floor) => floor.rooms)
  const count = (test: (room: RackRoom) => boolean) => rooms.filter(test).length
  return {
    arrivals: count((room) => room.occupancy === 'arriving'),
    departures: count((room) => room.occupancy === 'departing'),
    inHouse: count((room) => room.occupancy === 'occupied' || room.occupancy === 'departing'),
    toClean: count((room) => room.housekeeping === 'dirty'),
    outOfOrder: count((room) => room.occupancy === 'out'),
    rooms: rooms.length,
  }
}

export function roomSpec(number: string): RoomSpec {
  const found = ROOM_SPECS.find((room) => room.number === number)
  if (found === undefined) throw new Error(`No room ${number}`)
  return found
}

/** Nights between arrival and departure (whole days; no amount involved). */
export function nights(stay: Stay): number {
  const [ay = 0, am = 1, ad = 1] = stay.arrival.split('-').map(Number)
  const [dy = 0, dm = 1, dd = 1] = stay.departure.split('-').map(Number)
  return Math.round((Date.UTC(dy, dm - 1, dd) - Date.UTC(ay, am - 1, ad)) / 86_400_000)
}

// ── Folios (the application's figures, decimal strings) ───────────────────────────────────────

export interface FolioLine {
  label: string
  amount: string
}

export interface Folio {
  lines: FolioLine[]
  total: string
  paid: string
  balance: string
}

/** The folios the screens show; every total is the application's, written here. */
export const FOLIOS: Record<string, Folio> = {
  // Paolo Bianchi, room 204, 2 nights at 9.800,00.
  '204': {
    lines: [
      { label: 'Room, 2 nights', amount: '19600.00' },
      { label: 'Minibar', amount: '1250.00' },
      { label: 'City tax, 2 nights', amount: '400.00' },
    ],
    total: '21250.00',
    paid: '0.00',
    balance: '21250.00',
  },
  // Jelena Stojanović, room 104: 3 nights at 11.200,00, prepaid in full.
  '104': {
    lines: [
      { label: 'Room, 3 nights', amount: '33600.00' },
      { label: 'City tax, 3 nights', amount: '600.00' },
    ],
    total: '34200.00',
    paid: '34200.00',
    balance: '0.00',
  },
}

// ── The booking timeline (ResourceSchedule, days) ─────────────────────────────────────────────

/** The two weeks the timeline shows, from today. */
export const FORTNIGHT = Array.from({ length: 14 }, (_, index) => day(index))

/** Stays as bookings over days: the end is the last night, included. */
export function stayBookings(floor: number): ScheduleBooking[] {
  return STAYS.filter((each) => each.room.startsWith(String(floor))).map((each) => ({
    id: each.id,
    resourceId: each.room,
    title: each.guest,
    description:
      each.note === undefined
        ? `${String(each.adults)} ${each.adults === 1 ? 'adult' : 'adults'}`
        : `${String(each.adults)} adults · ${each.note}`,
    start: each.arrival,
    end: addDays(each.departure, -1),
    ...(each.note === 'VIP' ? { tone: 'premium' as const } : {}),
    // A guest in the house has arrived: the stay no longer moves.
    ...(each.arrival <= HOTEL.today ? { locked: true } : {}),
  }))
}

/** Out-of-order rooms over the timeline. */
export const OUT_OF_ORDER = ROOM_SPECS.flatMap((room) =>
  room.outOfOrder === undefined
    ? []
    : [
        {
          resourceId: room.number,
          start: HOTEL.today,
          end: room.outOfOrder.until,
          reason: room.outOfOrder.reason,
        },
      ],
)

// ── Checks (the dataset agrees with itself) ───────────────────────────────────────────────────

const FIGURES = todayFigures(rackFloors())
if (
  FIGURES.rooms !== 40 ||
  FIGURES.arrivals !== 6 ||
  FIGURES.departures !== 5 ||
  FIGURES.outOfOrder !== 2
) {
  throw new Error(`Hotel Fruška's day does not add up: ${JSON.stringify(FIGURES)}`)
}
for (const each of STAYS) {
  if (each.departure <= each.arrival) throw new Error(`${each.id} ends before it starts`)
  const overlapping = STAYS.find(
    (other) =>
      other !== each &&
      other.room === each.room &&
      other.arrival < each.departure &&
      other.departure > each.arrival,
  )
  if (overlapping !== undefined) throw new Error(`${each.id} overlaps ${overlapping.id}`)
}
