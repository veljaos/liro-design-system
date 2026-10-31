/*
 * The logic of SeatingChart, apart from the markup so it can be unit-tested:
 * where the seats of a table stand, a seat's id, who sits where, the counts, the groups of
 * the guest list and the search. The chart computes no seating of its own: the application says
 * who sits where and decides every change it is told about.
 */
import { footprint, type FloorRotation } from './floor-plan-logic'

/** A seat: the table's id and the seat's number, 1 to the table's `seats`. */
export interface SeatRef {
  tableId: string
  seat: number
}

/** A table of the event, from the application, in plan units. */
export interface SeatingTable {
  id: string
  /** "Table 3", "Head table". */
  label: string
  /** What is written on the plan ("3"). Default: `label`. */
  shortLabel?: string
  shape: 'round' | 'rect'
  x: number
  y: number
  width: number
  height: number
  rotation?: FloorRotation
  /** How many seats are drawn round it. */
  seats: number
  areaId?: string
  note?: string
}

/** A guest, from the application. */
export interface SeatingGuest {
  id: string
  name: string
  /** The party or group they belong to ("Family Petrović", "Liro team"). */
  group?: string
  /** Notes as data ("Vegetarian", "Wheelchair"). */
  notes?: readonly string[]
  /** Where they sit; null or absent: not seated. */
  seat?: SeatRef | null
}

/** A conflict from the application: a full table, guests to keep apart. */
export interface SeatingConflict {
  id: string
  /** 'danger' for a problem, 'warning' for something to look at. */
  tone: 'warning' | 'danger'
  text: string
  /** The table it is about: an icon on the table, the words in its name. */
  tableId?: string
  /** The guests it is about: an icon and the words in their rows. */
  guestIds?: readonly string[]
}

/** A seat's id on the plan: "t3#4". */
export function seatId(ref: SeatRef): string {
  return `${ref.tableId}#${String(ref.seat)}`
}

/** The seat an id names, or null for any other item. */
export function parseSeatId(id: string): SeatRef | null {
  const at = id.lastIndexOf('#')
  if (at <= 0) return null
  const seat = Number(id.slice(at + 1))
  if (!Number.isInteger(seat) || seat < 1) return null
  return { tableId: id.slice(0, at), seat }
}

/** Whether two seats are the same. */
export function sameSeat(a: SeatRef | null | undefined, b: SeatRef | null | undefined): boolean {
  if (a == null || b == null) return false
  return a.tableId === b.tableId && a.seat === b.seat
}

/** A point turned clockwise by quarter turns about the origin (y grows downwards). */
function turn(point: { x: number; y: number }, rotation: FloorRotation | undefined) {
  switch (rotation) {
    case 90:
      return { x: -point.y, y: point.x }
    case 180:
      return { x: -point.x, y: -point.y }
    case 270:
      return { x: point.y, y: -point.x }
    default:
      return point
  }
}

/**
 * The centres of a table's seats, in plan units, seat 1 first, clockwise.
 * - **Round:** evenly round the table, seat 1 at the top.
 * - **Rectangular:** along the long sides — seat 1 at the start of the first long side — and,
 *   when the number is odd, one at the far end; four seats round a square table, one on each
 *   side. A table taller than wide has its long sides left and right.
 * The table's rotation turns the whole ring (a half turn starts it on the other side). `size`
 * is a seat's diameter, `gap` the room between the table and its seats.
 */
export function seatCentres(
  table: Pick<SeatingTable, 'shape' | 'x' | 'y' | 'width' | 'height' | 'rotation' | 'seats'>,
  size: number,
  gap: number,
): { seat: number; x: number; y: number }[] {
  const count = Math.max(0, Math.floor(table.seats))
  const box = footprint({ id: '', ...table })
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const reach = gap + size / 2
  let points: { x: number; y: number }[] = []
  if (count === 0) {
    points = []
  } else if (table.shape === 'round') {
    const radius = Math.max(table.width, table.height) / 2 + reach
    points = Array.from({ length: count }, (_, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count
      return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
    })
  } else if (count === 4 && table.width === table.height) {
    const half = table.width / 2 + reach
    points = [
      { x: 0, y: -half },
      { x: half, y: 0 },
      { x: 0, y: half },
      { x: -half, y: 0 },
    ]
  } else {
    const wide = table.width >= table.height
    const long = wide ? table.width : table.height
    const short = wide ? table.height : table.width
    const end = count % 2
    const perSide = (count - end) / 2
    const along = (index: number, of: number) => -long / 2 + ((index + 0.5) * long) / of
    const top = Array.from({ length: perSide }, (_, index) => ({
      x: along(index, perSide),
      y: -short / 2 - reach,
    }))
    const bottom = Array.from({ length: perSide }, (_, index) => ({
      x: along(perSide - 1 - index, perSide),
      y: short / 2 + reach,
    }))
    const far = end === 1 ? [{ x: long / 2 + reach, y: 0 }] : []
    const laid = perSide === 0 ? [{ x: 0, y: -short / 2 - reach }] : [...top, ...far, ...bottom]
    // Laid out wide; a table taller than wide has its long sides on the right and left.
    points = wide ? laid : laid.map((point) => turn(point, 90))
  }
  return points.map((point, index) => {
    const turned = turn(point, table.rotation)
    return { seat: index + 1, x: cx + turned.x, y: cy + turned.y }
  })
}

/** Who sits on a seat, if anyone. */
export function guestAt<Guest extends SeatingGuest>(
  guests: readonly Guest[],
  ref: SeatRef,
): Guest | undefined {
  return guests.find((guest) => sameSeat(guest.seat, ref))
}

/** How many guests are seated, of all. */
export function seatingCounts(guests: readonly SeatingGuest[]): { seated: number; total: number } {
  return { seated: guests.filter((guest) => guest.seat != null).length, total: guests.length }
}

/** The seats of a table no guest sits on, in order. */
export function freeSeats(table: SeatingTable, guests: readonly SeatingGuest[]): number[] {
  return Array.from({ length: Math.max(0, table.seats) }, (_, index) => index + 1).filter(
    (seat) => guestAt(guests, { tableId: table.id, seat }) === undefined,
  )
}

/**
 * Whether a guest matches the search: the words typed, each found in the name, the group or a
 * note, without case in the page's locale. An empty search matches everyone.
 */
export function guestMatches(guest: SeatingGuest, query: string, locale: string): boolean {
  const words = query.trim().toLocaleLowerCase(locale).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const text = [guest.name, guest.group ?? '', ...(guest.notes ?? [])]
    .join(' ')
    .toLocaleLowerCase(locale)
  return words.every((word) => text.includes(word))
}

/** A group of the guest list: the guests not seated, or a table's guests in seat order. */
export interface GuestGroup<Guest> {
  /** '' for the guests not seated, else the table's id. */
  id: string
  table?: SeatingTable
  guests: Guest[]
}

/**
 * The guest list: the guests not seated first (in the application's order), then each table's
 * guests by seat number, the tables in the application's order. Guests on a table the chart does
 * not know count as not seated. Empty groups are left out.
 */
export function guestGroups<Guest extends SeatingGuest>(
  guests: readonly Guest[],
  tables: readonly SeatingTable[],
): GuestGroup<Guest>[] {
  const known = new Set(tables.map((table) => table.id))
  const unseated = guests.filter((guest) => guest.seat == null || !known.has(guest.seat.tableId))
  const groups: GuestGroup<Guest>[] = [{ id: '', guests: unseated }]
  for (const table of tables) {
    const seated = guests
      .filter((guest) => guest.seat?.tableId === table.id)
      .sort((a, b) => (a.seat?.seat ?? 0) - (b.seat?.seat ?? 0))
    groups.push({ id: table.id, table, guests: seated })
  }
  return groups.filter((group) => group.guests.length > 0)
}

/** One guest's seat before and after (a seating plan's pending changes). */
export interface SeatingChange {
  guestId: string
  /** The seat saved; null when the guest was not seated. */
  from: SeatRef | null
  /** The seat now; null when the guest is unseated. */
  to: SeatRef | null
}

/**
 * The changes between the seating saved and the seating now, in the order of `now`: every guest
 * whose seat differs (seated, moved or unseated). A seating plan edited in several steps keeps
 * them pending and saves them together through one confirmation (ChangeConfirmDialog).
 */
export function seatingChanges(
  saved: readonly SeatingGuest[],
  now: readonly SeatingGuest[],
): SeatingChange[] {
  const before = new Map(saved.map((guest) => [guest.id, guest.seat ?? null]))
  return now.flatMap((guest) => {
    const from = before.get(guest.id) ?? null
    const to = guest.seat ?? null
    if (from === null && to === null) return []
    if (sameSeat(from, to)) return []
    return [{ guestId: guest.id, from, to }]
  })
}
