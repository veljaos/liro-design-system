import { describe, expect, it } from 'vitest'
import {
  EMPTY_RACK_FILTER,
  rackCounts,
  rackFilterActive,
  rackKeyTarget,
  rackMatches,
  rackSearchText,
} from './room-rack-logic'

const ROOMS = [
  { number: '101', occupancy: 'occupied', housekeeping: 'clean', guest: 'Đorđe Petrović' },
  { number: '102', occupancy: 'vacant', housekeeping: 'dirty' },
  { number: '201', occupancy: 'occupied', housekeeping: 'dirty', guest: 'Ana Šimić' },
  { number: '202', occupancy: 'arriving', guest: 'Marko Ilić' },
]

describe('RoomRack filter', () => {
  it('compares text without case and accents', () => {
    expect(rackSearchText('  Đorđe ŠIMIĆ ')).toBe('dorde simic')
    expect(rackSearchText('Ćirić')).toBe('ciric')
  })

  it('matches the number or the guest, and both chosen states', () => {
    const shown = (filter: Partial<typeof EMPTY_RACK_FILTER>) =>
      ROOMS.filter((room) => rackMatches(room, { ...EMPTY_RACK_FILTER, ...filter })).map(
        (room) => room.number,
      )
    expect(shown({})).toEqual(['101', '102', '201', '202'])
    expect(shown({ query: '20' })).toEqual(['201', '202'])
    expect(shown({ query: 'dorde' })).toEqual(['101'])
    expect(shown({ query: 'simic' })).toEqual(['201'])
    expect(shown({ occupancy: 'occupied' })).toEqual(['101', '201'])
    expect(shown({ occupancy: 'occupied', housekeeping: 'dirty' })).toEqual(['201'])
    expect(shown({ housekeeping: 'dirty', query: '10' })).toEqual(['102'])
    expect(shown({ query: 'nobody' })).toEqual([])
  })

  it('knows when a filter hides something', () => {
    expect(rackFilterActive(EMPTY_RACK_FILTER)).toBe(false)
    expect(rackFilterActive({ ...EMPTY_RACK_FILTER, query: '   ' })).toBe(false)
    expect(rackFilterActive({ ...EMPTY_RACK_FILTER, query: '1' })).toBe(true)
    expect(rackFilterActive({ ...EMPTY_RACK_FILTER, housekeeping: 'dirty' })).toBe(true)
  })

  it('counts the rooms of each state; a room without a state is not counted', () => {
    expect(Object.fromEntries(rackCounts(ROOMS, 'occupancy'))).toEqual({
      occupied: 2,
      vacant: 1,
      arriving: 1,
    })
    expect(Object.fromEntries(rackCounts(ROOMS, 'housekeeping'))).toEqual({ clean: 1, dirty: 2 })
  })
})

describe('rackKeyTarget', () => {
  // Three floors of 6, 0 and 5 rooms (the middle floor filtered out), four tiles to a line.
  const counts = [6, 0, 5]
  const key = (name: string, floor: number, index: number, control = false) =>
    rackKeyTarget(name, { floor, index }, counts, 4, 'ltr', control)

  it('goes forward and back in reading order, on to the next floor', () => {
    expect(key('ArrowRight', 0, 1)).toEqual({ floor: 0, index: 2 })
    expect(key('ArrowRight', 0, 5)).toEqual({ floor: 2, index: 0 })
    expect(key('ArrowLeft', 2, 0)).toEqual({ floor: 0, index: 5 })
    expect(key('ArrowLeft', 0, 0)).toBeNull()
    expect(key('ArrowRight', 2, 4)).toBeNull()
  })

  it('follows the reading direction in right-to-left pages', () => {
    const rtl = (name: string) => rackKeyTarget(name, { floor: 0, index: 1 }, counts, 4, 'rtl')
    expect(rtl('ArrowLeft')).toEqual({ floor: 0, index: 2 })
    expect(rtl('ArrowRight')).toEqual({ floor: 0, index: 0 })
  })

  it('goes a line down or up in the same column, across floors', () => {
    expect(key('ArrowDown', 0, 1)).toEqual({ floor: 0, index: 5 })
    // The second line is shorter: the nearest room of it.
    expect(key('ArrowDown', 0, 3)).toEqual({ floor: 0, index: 5 })
    expect(key('ArrowDown', 0, 5)).toEqual({ floor: 2, index: 1 })
    expect(key('ArrowDown', 0, 4)).toEqual({ floor: 2, index: 0 })
    expect(key('ArrowUp', 2, 3)).toEqual({ floor: 0, index: 5 })
    expect(key('ArrowUp', 2, 0)).toEqual({ floor: 0, index: 4 })
    expect(key('ArrowUp', 0, 2)).toBeNull()
    expect(key('ArrowDown', 2, 4)).toBeNull()
    expect(key('ArrowUp', 2, 4)).toEqual({ floor: 2, index: 0 })
  })

  it('goes to the floor’s ends with Home and End, to the rack’s with Ctrl', () => {
    expect(key('Home', 2, 3)).toEqual({ floor: 2, index: 0 })
    expect(key('End', 0, 1)).toEqual({ floor: 0, index: 5 })
    expect(key('Home', 2, 3, true)).toEqual({ floor: 0, index: 0 })
    expect(key('End', 0, 1, true)).toEqual({ floor: 2, index: 4 })
    expect(key('Home', 0, 0)).toBeNull()
    expect(key('Enter', 0, 0)).toBeNull()
  })

  it('moves one room at a time in a single column (phones)', () => {
    expect(rackKeyTarget('ArrowDown', { floor: 0, index: 5 }, counts, 1, 'ltr')).toEqual({
      floor: 2,
      index: 0,
    })
    expect(rackKeyTarget('ArrowUp', { floor: 2, index: 0 }, counts, 1, 'ltr')).toEqual({
      floor: 0,
      index: 5,
    })
  })
})
