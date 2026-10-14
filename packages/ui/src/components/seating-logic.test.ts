import { describe, expect, it } from 'vitest'
import {
  freeSeats,
  guestAt,
  guestGroups,
  guestMatches,
  parseSeatId,
  sameSeat,
  seatCentres,
  seatId,
  seatingChanges,
  seatingCounts,
  type SeatingGuest,
  type SeatingTable,
} from './seating-logic'

/** Rounded to tenths, so the trigonometry compares cleanly. */
function rounded(points: { seat: number; x: number; y: number }[]) {
  return points.map((point) => ({
    seat: point.seat,
    x: Math.round(point.x * 10) / 10 + 0,
    y: Math.round(point.y * 10) / 10 + 0,
  }))
}

const ROUND: SeatingTable = {
  id: 't1',
  label: 'Table 1',
  shape: 'round',
  x: 100,
  y: 100,
  width: 80,
  height: 80,
  seats: 4,
}

const LONG: SeatingTable = {
  id: 'head',
  label: 'Head table',
  shape: 'rect',
  x: 0,
  y: 0,
  width: 200,
  height: 60,
  seats: 4,
}

describe('seat ids', () => {
  it('writes and reads a seat', () => {
    expect(seatId({ tableId: 't1', seat: 4 })).toBe('t1#4')
    expect(parseSeatId('t1#4')).toEqual({ tableId: 't1', seat: 4 })
    expect(parseSeatId('hall#a#12')).toEqual({ tableId: 'hall#a', seat: 12 })
  })

  it('reads nothing else as a seat', () => {
    expect(parseSeatId('t1')).toBeNull()
    expect(parseSeatId('#4')).toBeNull()
    expect(parseSeatId('t1#0')).toBeNull()
    expect(parseSeatId('t1#x')).toBeNull()
  })

  it('compares seats', () => {
    expect(sameSeat({ tableId: 'a', seat: 1 }, { tableId: 'a', seat: 1 })).toBe(true)
    expect(sameSeat({ tableId: 'a', seat: 1 }, { tableId: 'a', seat: 2 })).toBe(false)
    expect(sameSeat(null, { tableId: 'a', seat: 1 })).toBe(false)
    expect(sameSeat(undefined, undefined)).toBe(false)
  })
})

describe('seatCentres', () => {
  it('puts the seats of a round table evenly round it, seat 1 at the top, clockwise', () => {
    // Centre (140, 140); radius 40 + 6 + 15 = 61.
    expect(rounded(seatCentres(ROUND, 30, 6))).toEqual([
      { seat: 1, x: 140, y: 79 },
      { seat: 2, x: 201, y: 140 },
      { seat: 3, x: 140, y: 201 },
      { seat: 4, x: 79, y: 140 },
    ])
  })

  it('puts the seats of a rectangular table along its long sides, clockwise', () => {
    // Centre (100, 30); the sides 30 + 5 + 10 = 45 above and below the centre.
    expect(rounded(seatCentres(LONG, 20, 5))).toEqual([
      { seat: 1, x: 50, y: -15 },
      { seat: 2, x: 150, y: -15 },
      { seat: 3, x: 150, y: 75 },
      { seat: 4, x: 50, y: 75 },
    ])
  })

  it('puts an odd seat at the far end', () => {
    const seats = rounded(seatCentres({ ...LONG, seats: 5 }, 20, 5))
    expect(seats[2]).toEqual({ seat: 3, x: 215, y: 30 })
    expect(seats).toHaveLength(5)
  })

  it('puts four seats round a square table, one on each side', () => {
    const square = { ...LONG, width: 80, height: 80 }
    expect(rounded(seatCentres(square, 20, 5))).toEqual([
      { seat: 1, x: 40, y: -15 },
      { seat: 2, x: 95, y: 40 },
      { seat: 3, x: 40, y: 95 },
      { seat: 4, x: -15, y: 40 },
    ])
  })

  it('puts the long sides right and left on a table taller than wide', () => {
    const tall = { ...LONG, width: 60, height: 200 }
    expect(rounded(seatCentres(tall, 20, 5))).toEqual([
      { seat: 1, x: 75, y: 50 },
      { seat: 2, x: 75, y: 150 },
      { seat: 3, x: -15, y: 150 },
      { seat: 4, x: -15, y: 50 },
    ])
  })

  it('turns the ring with the table', () => {
    // A half turn starts on the other side; a quarter turn makes the table upright.
    expect(rounded(seatCentres({ ...LONG, rotation: 180 }, 20, 5))[0]).toEqual({
      seat: 1,
      x: 150,
      y: 75,
    })
    const upright = rounded(seatCentres({ ...LONG, rotation: 90 }, 20, 5))
    expect(upright[0]).toEqual({ seat: 1, x: 145, y: -20 })
  })

  it('puts a single seat at the top and none for no seats', () => {
    expect(rounded(seatCentres({ ...LONG, seats: 1 }, 20, 5))).toEqual([
      { seat: 1, x: 100, y: -15 },
    ])
    expect(seatCentres({ ...LONG, seats: 0 }, 20, 5)).toEqual([])
  })
})

const GUESTS: SeatingGuest[] = [
  { id: 'ana', name: 'Ana Petrović', group: 'Family Petrović', seat: { tableId: 't1', seat: 2 } },
  {
    id: 'marko',
    name: 'Marko Petrović',
    group: 'Family Petrović',
    seat: { tableId: 't1', seat: 1 },
  },
  { id: 'jelena', name: 'Jelena Ilić', notes: ['Vegetarian'] },
  { id: 'ivan', name: 'Ivan Kovač', group: 'Liro team', seat: { tableId: 'head', seat: 3 } },
  { id: 'lost', name: 'Lost Guest', seat: { tableId: 'gone', seat: 1 } },
  { id: 'mila', name: 'Mila Đorđević', notes: ['Gluten-free', 'Wheelchair'], seat: null },
]

describe('who sits where', () => {
  it('finds the guest on a seat', () => {
    expect(guestAt(GUESTS, { tableId: 't1', seat: 2 })?.id).toBe('ana')
    expect(guestAt(GUESTS, { tableId: 't1', seat: 3 })).toBeUndefined()
  })

  it('counts the seated guests of all', () => {
    expect(seatingCounts(GUESTS)).toEqual({ seated: 4, total: 6 })
  })

  it('lists a table’s free seats', () => {
    expect(freeSeats(ROUND, GUESTS)).toEqual([3, 4])
    expect(freeSeats({ ...ROUND, seats: 2 }, GUESTS)).toEqual([])
  })
})

describe('the guest list', () => {
  it('finds guests by name, group or note, every word, without case', () => {
    const found = (query: string) =>
      GUESTS.filter((guest) => guestMatches(guest, query, 'sr-Latn')).map((guest) => guest.id)
    expect(found('')).toHaveLength(6)
    expect(found('petrović')).toEqual(['ana', 'marko'])
    expect(found('family ana')).toEqual(['ana'])
    expect(found('VEGETARIAN')).toEqual(['jelena'])
    expect(found('wheelchair gluten')).toEqual(['mila'])
    expect(found('nobody')).toEqual([])
  })

  it('puts the guests not seated first, then each table’s guests by seat', () => {
    const groups = guestGroups(GUESTS, [ROUND, LONG, { ...ROUND, id: 'empty' }])
    expect(groups.map((group) => [group.id, group.guests.map((guest) => guest.id)])).toEqual([
      ['', ['jelena', 'lost', 'mila']],
      ['t1', ['marko', 'ana']],
      ['head', ['ivan']],
    ])
    expect(groups[1]?.table?.label).toBe('Table 1')
  })

  it('leaves out an empty group of guests not seated', () => {
    const seated = GUESTS.filter((guest) => guest.seat?.tableId === 't1')
    expect(guestGroups(seated, [ROUND]).map((group) => group.id)).toEqual(['t1'])
  })
})

describe('seatingChanges (P5.28 item 9)', () => {
  const SAVED: SeatingGuest[] = [
    { id: 'a', name: 'Ana', seat: { tableId: 't1', seat: 1 } },
    { id: 'b', name: 'Ivan', seat: null },
    { id: 'c', name: 'Mila', seat: { tableId: 't2', seat: 3 } },
    { id: 'd', name: 'Uroš', seat: { tableId: 't2', seat: 4 } },
  ]

  it('lists every guest seated, moved or unseated since the plan was saved', () => {
    const now: SeatingGuest[] = [
      { id: 'a', name: 'Ana', seat: { tableId: 't3', seat: 2 } },
      { id: 'b', name: 'Ivan', seat: { tableId: 't1', seat: 1 } },
      { id: 'c', name: 'Mila', seat: null },
      { id: 'd', name: 'Uroš', seat: { tableId: 't2', seat: 4 } },
    ]
    expect(seatingChanges(SAVED, now)).toEqual([
      { guestId: 'a', from: { tableId: 't1', seat: 1 }, to: { tableId: 't3', seat: 2 } },
      { guestId: 'b', from: null, to: { tableId: 't1', seat: 1 } },
      { guestId: 'c', from: { tableId: 't2', seat: 3 }, to: null },
    ])
  })

  it('is empty when nothing changed, and counts a new guest as seated', () => {
    expect(seatingChanges(SAVED, SAVED)).toEqual([])
    expect(
      seatingChanges(SAVED, [{ id: 'e', name: 'Vuk', seat: { tableId: 't4', seat: 1 } }]),
    ).toEqual([{ guestId: 'e', from: null, to: { tableId: 't4', seat: 1 } }])
  })
})
