/*
 * The logic of RoomRack (BUILD-PLAN P5.25), kept apart from the markup so it can be unit-tested
 * (AGENTS.md C7): which rooms a filter shows, how many rooms each state has, and where the arrow
 * keys move between the tiles. Counting rooms is the only arithmetic here; no amount is involved.
 */

/** The filter of a rack: one occupancy state, one housekeeping state and a search text. */
export interface RackFilter {
  /** A state id of `occupancyStates`, or null for every state. */
  occupancy: string | null
  /** A state id of `housekeepingStates`, or null for every state. */
  housekeeping: string | null
  /** Matches the room's number or the guest's name; empty for every room. */
  query: string
}

export const EMPTY_RACK_FILTER: RackFilter = { occupancy: null, housekeeping: null, query: '' }

/** What the filter reads of a room. */
export interface RackSearchable {
  number: string
  occupancy: string
  housekeeping?: string
  guest?: string
}

/**
 * Text as a search compares it: lower case, without accents ("Đorđević" and "dordevic" match),
 * spaces at the ends dropped.
 */
export function rackSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase()
    .trim()
}

/** Whether a room passes the filter: both states (when chosen) and the search text. */
export function rackMatches(room: RackSearchable, filter: RackFilter): boolean {
  if (filter.occupancy !== null && room.occupancy !== filter.occupancy) return false
  if (filter.housekeeping !== null && room.housekeeping !== filter.housekeeping) return false
  const query = rackSearchText(filter.query)
  if (query === '') return true
  return (
    rackSearchText(room.number).includes(query) ||
    (room.guest !== undefined && rackSearchText(room.guest).includes(query))
  )
}

/** Whether the filter hides anything. */
export function rackFilterActive(filter: RackFilter): boolean {
  return filter.occupancy !== null || filter.housekeeping !== null || filter.query.trim() !== ''
}

/** How many rooms have each state of one kind ('occupancy' or 'housekeeping'). */
export function rackCounts(
  rooms: readonly RackSearchable[],
  kind: 'occupancy' | 'housekeeping',
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const room of rooms) {
    const state = room[kind]
    if (state === undefined) continue
    counts.set(state, (counts.get(state) ?? 0) + 1)
  }
  return counts
}

/** A tile's place: its floor (of the floors shown) and its index on that floor. */
export interface RackPlace {
  floor: number
  index: number
}

/**
 * Where a key moves the focus from `at`, or null. `counts` are the tiles of each floor shown, in
 * order; `columns` the tiles in one line of a floor (every floor's grid has the same columns; 1 on
 * phones). The rack is a list of rooms in reading order, not a map of the building, so the
 * arrows follow the reading direction (Appendix B.7): the forward arrow (ArrowRight in
 * left-to-right, ArrowLeft in right-to-left) goes to the next room, on to the next floor's first;
 * ArrowDown and ArrowUp go a line down or up in the same column, into the next or previous floor
 * when the floor ends (the nearest room of that line when it is shorter). Home and End go to the
 * floor's first and last room; with Ctrl (or Cmd) to the rack's.
 */
export function rackKeyTarget(
  key: string,
  at: RackPlace,
  counts: readonly number[],
  columns: number,
  direction: 'ltr' | 'rtl',
  control = false,
): RackPlace | null {
  const width = Math.max(1, columns)
  const count = counts[at.floor] ?? 0
  if (count === 0) return null
  const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
  const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
  const next = (floor: number, step: 1 | -1): number | null => {
    for (let each = floor + step; each >= 0 && each < counts.length; each += step) {
      if ((counts[each] ?? 0) > 0) return each
    }
    return null
  }
  const lastOf = (floor: number) => (counts[floor] ?? 1) - 1
  let target: RackPlace | null = null
  if (key === forward) {
    if (at.index + 1 < count) target = { floor: at.floor, index: at.index + 1 }
    else {
      const floor = next(at.floor, 1)
      target = floor === null ? null : { floor, index: 0 }
    }
  } else if (key === backward) {
    if (at.index > 0) target = { floor: at.floor, index: at.index - 1 }
    else {
      const floor = next(at.floor, -1)
      target = floor === null ? null : { floor, index: lastOf(floor) }
    }
  } else if (key === 'ArrowDown') {
    const line = Math.floor(at.index / width)
    const lastLine = Math.floor((count - 1) / width)
    if (line < lastLine) {
      target = { floor: at.floor, index: Math.min(at.index + width, count - 1) }
    } else {
      const floor = next(at.floor, 1)
      target = floor === null ? null : { floor, index: Math.min(at.index % width, lastOf(floor)) }
    }
  } else if (key === 'ArrowUp') {
    if (at.index >= width) target = { floor: at.floor, index: at.index - width }
    else {
      const floor = next(at.floor, -1)
      if (floor !== null) {
        const lastLineStart = Math.floor(lastOf(floor) / width) * width
        target = { floor, index: Math.min(lastLineStart + (at.index % width), lastOf(floor)) }
      }
    }
  } else if (key === 'Home') {
    if (control) {
      const floor = (counts[0] ?? 0) > 0 ? 0 : next(0, 1)
      target = floor === null ? null : { floor, index: 0 }
    } else target = { floor: at.floor, index: 0 }
  } else if (key === 'End') {
    if (control) {
      const last = counts.length - 1
      const floor = (counts[last] ?? 0) > 0 ? last : next(last, -1)
      target = floor === null ? null : { floor, index: lastOf(floor) }
    } else target = { floor: at.floor, index: count - 1 }
  } else return null
  if (target === null || (target.floor === at.floor && target.index === at.index)) return null
  return target
}
