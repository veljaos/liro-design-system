/*
 * A hotel of 200 rooms for ResourceSchedule's phone lists: fictitious guests,
 * generated the same way every time. Today is the stories' Wednesday 14 October 2026. Which stay
 * is an arrival, a departure or in house is the application's data: computed here, in the
 * story's application, never by the component. Not part of the package. No classes here:
 * Storybook compiles classes only from *.stories.tsx files.
 */

import type { ScheduleBooking, ScheduleResource } from './resource-schedule'
import type { SchedulePhoneList } from './schedule-phone-lists'

const TODAY = '2026-10-14'

const KINDS = ['Double', 'Twin', 'Single', 'Double', 'Suite'] as const

/** Five floors of forty rooms: 101–140 … 501–540. */
export const HOTEL_ROOMS: readonly ScheduleResource[] = Array.from({ length: 200 }, (_, index) => {
  const floor = Math.floor(index / 40) + 1
  const number = floor * 100 + (index % 40) + 1
  return {
    id: `room-${String(number)}`,
    name: `Room ${String(number)}`,
    description: KINDS[index % KINDS.length] ?? 'Double',
  }
})

const FIRST = [
  'Marko',
  'Ana',
  'Thomas',
  'Sofia',
  'Jelena',
  'Nikola',
  'Milica',
  'Luca',
  'Emma',
  'Stefan',
  'Ivana',
  'Lukas',
  'Teodora',
  'Hiroshi',
  'Layla',
  'Vuk',
  'Marta',
  'Omar',
]
const LAST = [
  'Ilić',
  'Petrović',
  'Becker',
  'Rossi',
  'Stojanović',
  'Đorđević',
  'Jovanović',
  'Bianchi',
  'Müller',
  'Kovačević',
  'Novak',
  'Tanaka',
  'Haddad',
  'Marković',
  'Šuljić',
]
const NOTES = [
  '2 adults',
  '2 adults, 1 child',
  '1 adult',
  '2 adults · Booking.com',
  'Late arrival',
  'Group: Konferencija Liro 2026',
]

/** The day `offset` days from today, YYYY-MM-DD (October and November 2026). */
function dayFrom(offset: number): string {
  const date = new Date(Date.UTC(2026, 9, 14 + offset))
  return date.toISOString().slice(0, 10)
}

/**
 * One stay a room for 171 of the 200 rooms: started up to ten days ago or today, ending today or
 * up to nine days later. The other rooms are empty.
 */
export const HOTEL_STAYS: readonly ScheduleBooking[] = HOTEL_ROOMS.flatMap((room, index) => {
  if (index % 7 === 3) return []
  const startOffset = -((index * 3) % 11)
  const length = 1 + ((index * 5) % 9)
  const ends = startOffset + length
  const end = ends < 0 ? ends + 9 : ends
  return [
    {
      id: `stay-${String(index + 1)}`,
      resourceId: room.id,
      title: `${FIRST[index % FIRST.length] ?? ''} ${LAST[(index * 7) % LAST.length] ?? ''}`,
      description: NOTES[index % NOTES.length] ?? '',
      start: dayFrom(startOffset),
      end: dayFrom(end),
      ...(index % 11 === 0 ? { tone: 'premium' as const } : {}),
      ...(index % 13 === 5 ? { tone: 'warning' as const } : {}),
    },
  ]
})

/** The application's lists of the day: who arrives, who leaves, who stays tonight. */
export function hotelLists(stays: readonly ScheduleBooking[]): SchedulePhoneList[] {
  return [
    {
      id: 'arrivals',
      label: 'Arrivals',
      bookings: stays.filter((stay) => stay.start === TODAY),
      emptyText: 'No arrivals today',
    },
    {
      id: 'departures',
      label: 'Departures',
      bookings: stays.filter((stay) => stay.end === TODAY),
      emptyText: 'No departures today',
    },
    {
      id: 'in-house',
      label: 'In house',
      bookings: stays.filter((stay) => stay.start < TODAY && stay.end > TODAY),
      emptyText: 'No guests in house',
    },
  ]
}

export const HOTEL_LISTS = hotelLists(HOTEL_STAYS)
