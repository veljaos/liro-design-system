import {
  BadgeCheck,
  Ban,
  BedDouble,
  Brush,
  DoorOpen,
  LogIn,
  LogOut,
  Sparkles,
  Timer,
} from 'lucide-react'
import type { RackFloor, RackRoom, RackState } from './room-rack'

/*
 * Story data of RoomRack (P5.25): Garni hotel Tvrđava, Petrovaradin (fictitious), three floors of
 * rooms on Tuesday 06.10.2026 (EXAMPLE_TODAY). The states and their tones are the application's
 * data; a front desk names them so.
 */

export const RACK_TODAY = '2026-10-06'

export const OCCUPANCY_STATES: RackState[] = [
  { id: 'vacant', label: 'Vacant', tone: 'neutral', icon: DoorOpen },
  { id: 'occupied', label: 'Occupied', tone: 'info', icon: BedDouble },
  { id: 'arriving', label: 'Arriving today', tone: 'success', icon: LogIn },
  { id: 'departing', label: 'Departing today', tone: 'warning', icon: LogOut },
  { id: 'out', label: 'Out of order', tone: 'danger', icon: Ban },
]

export const HOUSEKEEPING_STATES: RackState[] = [
  { id: 'clean', label: 'Clean', tone: 'success', icon: Sparkles },
  { id: 'inspected', label: 'Inspected', tone: 'premium', icon: BadgeCheck },
  { id: 'progress', label: 'Cleaning', tone: 'neutral', icon: Timer },
  { id: 'dirty', label: 'Dirty', tone: 'warning', icon: Brush },
]

const room = (
  id: string,
  type: string,
  occupancy: string,
  housekeeping: string,
  more: Partial<RackRoom> = {},
): RackRoom => ({ id, number: id, type, occupancy, housekeeping, ...more })

export const RACK_FLOORS: RackFloor[] = [
  {
    id: 'f1',
    label: 'Floor 1',
    description: '6 rooms',
    rooms: [
      room('101', 'DBL', 'occupied', 'clean', {
        guest: 'Marko Ilić',
        arrival: '2026-10-04',
        departure: '2026-10-08',
      }),
      room('102', 'TWN', 'departing', 'dirty', {
        guest: 'Ana Petrović',
        arrival: '2026-10-03',
        departure: '2026-10-06',
        notes: [{ label: 'Late check-out 14:00', tone: 'warning' }],
      }),
      room('103', 'SGL', 'vacant', 'inspected'),
      room('104', 'DBL', 'arriving', 'clean', {
        guest: 'Jelena Stojanović',
        arrival: '2026-10-06',
        departure: '2026-10-09',
        notes: [{ label: 'VIP', tone: 'premium' }],
      }),
      room('105', 'DBL', 'vacant', 'dirty'),
      room('106', 'SGL', 'out', 'dirty', { notes: [{ label: 'Water leak' }] }),
    ],
  },
  {
    id: 'f2',
    label: 'Floor 2',
    description: '5 rooms',
    rooms: [
      room('201', 'SUI', 'occupied', 'progress', {
        guest: 'Thomas Becker',
        arrival: '2026-10-05',
        departure: '2026-10-10',
      }),
      room('202', 'DBL', 'arriving', 'inspected', {
        guest: 'Milica Jovanović',
        arrival: '2026-10-06',
        departure: '2026-10-07',
      }),
      room('203', 'DBL', 'occupied', 'clean', {
        guest: 'Nikola Marković',
        arrival: '2026-10-01',
        departure: '2026-10-12',
        notes: [{ label: 'Allergy: feathers' }],
      }),
      room('204', 'TWN', 'departing', 'dirty', {
        guest: 'Sofia Rossi',
        arrival: '2026-10-02',
        departure: '2026-10-06',
      }),
      room('205', 'SGL', 'vacant', 'clean'),
    ],
  },
  {
    id: 'f3',
    label: 'Floor 3',
    description: '4 rooms',
    rooms: [
      room('301', 'APT', 'occupied', 'clean', {
        guest: 'Đorđe Vasić',
        arrival: '2026-10-06',
        departure: '2026-10-13',
      }),
      room('302', 'DBL', 'vacant', 'inspected'),
      room('303', 'DBL', 'vacant', 'progress'),
      room('304', 'TWN', 'arriving', 'dirty', {
        guest: 'Ivana Kovač',
        arrival: '2026-10-06',
        departure: '2026-10-08',
      }),
    ],
  },
]

/**
 * A large hotel for the compact density: twelve floors of twenty rooms, the states in a fixed
 * pattern (no randomness: the picture never changes).
 */
export const LARGE_FLOORS: RackFloor[] = Array.from({ length: 12 }, (_, floorIndex) => {
  const floor = floorIndex + 1
  return {
    id: `l${String(floor)}`,
    label: `Floor ${String(floor)}`,
    description: '20 rooms',
    rooms: Array.from({ length: 20 }, (_, index) => {
      const number = `${String(floor)}${String(index + 1).padStart(2, '0')}`
      const pattern = (floor * 7 + index * 3) % 10
      const occupancy =
        pattern < 5
          ? 'occupied'
          : pattern < 7
            ? 'vacant'
            : pattern === 7
              ? 'arriving'
              : pattern === 8
                ? 'departing'
                : floor % 5 === 0
                  ? 'out'
                  : 'vacant'
      const housekeeping = ['clean', 'inspected', 'dirty', 'progress'][(floor + index) % 4] ?? ''
      return {
        id: number,
        number,
        type: index % 3 === 0 ? 'TWN' : 'DBL',
        occupancy,
        housekeeping,
        ...(index % 9 === 0 ? { notes: [{ label: 'VIP', tone: 'premium' as const }] } : {}),
      }
    }),
  }
})
