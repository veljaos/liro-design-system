/*
 * Group H's example data (P5.17, industry examples), one dataset each.
 * 4. Health: Ambulanta Liman of Dom zdravlja Novi Sad — the doctors' week of 12.–16.10.2026,
 *    the free times the patient portal offers, Jovana Nikolić's booking (Wed 14.10. at 11:30), the
 *    clinic's schedule and dr Marko Stanković's calendar with it, and her last finding.
 * 5. School: OŠ "Jovan Popović", class 7/2, 2026/27 — the timetable, Tuesday 06.10.'s attendance
 *    (lessons 1 and 2 marked, lesson 3 being marked), the mathematics gradebook and Luka
 *    Jovanović's absences as his parent sees them.
 * Counts and averages are worked out here, in whole numbers, as the application would; the
 * components add nothing. Fictitious people and numbers. No classes here.
 */
import type {
  CalendarEvent,
  FreeSlot,
  ScheduleBooking,
  ScheduleResource,
  UnavailableTime,
} from '@veljaos/ui'

// ── 4. Health: Ambulanta Liman ─────────────────────────────────────────────────────────────────

export const CLINIC = {
  companyId: 'dzns',
  company: 'Dom zdravlja Novi Sad',
  name: 'Ambulanta Liman',
  address: 'Fruškogorska 26, Novi Sad',
  phone: '021 4879 000',
  week: { start: '2026-10-12', end: '2026-10-16' },
  /** The day the schedule shows: the day of Jovana's appointment. */
  day: '2026-10-14',
  /** The clinic's clock on that day, for the "now" marker (P5.28 item 10). */
  now: '09:40',
}

export const PATIENT = {
  name: 'Jovana Nikolić',
  insurance: 'LBO 10234567891',
  born: '1979-03-22',
}

export const DOCTORS: readonly ScheduleResource[] = [
  { id: 'stankovic', name: 'dr Marko Stanković', description: 'General practice' },
  { id: 'lukic', name: 'dr Vesna Lukić', description: 'General practice' },
  { id: 'grujic', name: 'dr Nada Grujić', description: 'General practice' },
  { id: 'lab', name: 'Laboratory', description: 'Blood draw' },
]

/** Jovana's chosen doctor. */
export const CHOSEN_DOCTOR = 'stankovic'

export const SERVICES = [
  { value: 'checkup', label: 'Check-up', description: '30 minutes' },
  { value: 'pressure', label: 'Blood pressure control', description: '30 minutes' },
  { value: 'prescription', label: 'Prescription renewal', description: '30 minutes' },
  { value: 'referral', label: 'Referral to a specialist', description: '30 minutes' },
]

/** The doctors' consulting hours (the clinic's data): 07:00–13:00 in 30-minute appointments. */
const DAY_SLOTS = [
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
]

/** The break, every day, for every doctor. */
const BREAK = '10:00'

const WEEK_DAYS = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16']

/** Times still free before Jovana books (the clinic's data), per doctor and day. */
const FREE: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
  stankovic: {
    '2026-10-12': ['08:30', '12:00'],
    '2026-10-13': ['07:30', '11:00', '12:30'],
    '2026-10-14': ['09:00', '11:30'],
    '2026-10-15': ['10:30', '12:00'],
    '2026-10-16': ['07:00', '08:00', '11:30'],
  },
  grujic: {
    '2026-10-14': ['08:00', '10:30', '12:30'],
  },
}

const PATIENTS = [
  'Marko Ilić',
  'Ana Petrović',
  'Petar Đurić',
  'Dragana Nikolić',
  'Milan Savić',
  'Vera Tomić',
  'Uroš Pavlović',
  'Zorica Mitić',
  'Saša Kostić',
  'Ivana Marković',
  'Nikola Babić',
  'Jelena Simić',
  'Đorđe Lazić',
  'Branka Jovanović',
  'Stevan Popov',
  'Olivera Kis',
]

const SERVICE_CYCLE = [
  'Check-up',
  'Blood pressure control',
  'Prescription renewal',
  'Check-up',
  'Referral to a specialist',
]

/** "09:30" plus 30 minutes. */
function plus30(time: string): string {
  const [h = 0, m = 0] = time.split(':').map(Number)
  const minutes = h * 60 + m + 30
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** The doctors' appointments before Jovana books: every consulting slot that is not free. */
function doctorBookings(doctor: string, days: readonly string[]): ScheduleBooking[] {
  let n = doctor.length
  return days.flatMap((day) =>
    DAY_SLOTS.filter((slot) => slot !== BREAK && !(FREE[doctor]?.[day] ?? []).includes(slot)).map(
      (slot) => {
        n += 1
        return {
          id: `${doctor}-${day}-${slot}`,
          resourceId: doctor,
          title: PATIENTS[n % PATIENTS.length] ?? '',
          description: SERVICE_CYCLE[n % SERVICE_CYCLE.length] ?? '',
          start: `${day}T${slot}`,
          end: `${day}T${plus30(slot)}`,
        }
      },
    ),
  )
}

const LAB_BOOKINGS: ScheduleBooking[] = ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30'].map(
  (slot, index) => ({
    id: `lab-${slot}`,
    resourceId: 'lab',
    title: PATIENTS[(index * 5 + 3) % PATIENTS.length] ?? '',
    description: 'Blood count and glucose',
    start: `${CLINIC.day}T${slot}`,
    end: `${CLINIC.day}T${plus30(slot)}`,
  }),
)

/** Every booking of the week before Jovana's. */
export const BOOKINGS_BEFORE: readonly ScheduleBooking[] = [
  ...doctorBookings('stankovic', WEEK_DAYS),
  ...doctorBookings('grujic', [CLINIC.day]),
  ...LAB_BOOKINGS,
]

/** The free times the portal offers for her chosen doctor (the application's search). */
export const FREE_SLOTS: readonly FreeSlot[] = WEEK_DAYS.flatMap((day) =>
  (FREE.stankovic?.[day] ?? []).map((slot) => ({
    id: `stankovic-${day}-${slot}`,
    start: `${day}T${slot}`,
    end: `${day}T${plus30(slot)}`,
    resourceId: 'stankovic',
  })),
)

/** Jovana's booking: Wednesday 14.10.2026 at 11:30, a check-up with dr Marko Stanković. */
export const JOVANA_SLOT = 'stankovic-2026-10-14-11:30'
export const JOVANA_BOOKING: ScheduleBooking = {
  id: 'jovana',
  resourceId: 'stankovic',
  title: PATIENT.name,
  description: 'Check-up · booked online',
  start: '2026-10-14T11:30',
  end: '2026-10-14T12:00',
}

/** Every booking after hers: the clinic's schedule and the doctor's calendar. */
export const BOOKINGS: readonly ScheduleBooking[] = [...BOOKINGS_BEFORE, JOVANA_BOOKING]

/** dr Marko Stanković's week as calendar events: the patient first, then the service. */
export const DOCTOR_EVENTS: readonly CalendarEvent[] = [
  ...BOOKINGS.filter((each) => each.resourceId === CHOSEN_DOCTOR).map((each) => ({
    id: each.id,
    title: `${each.title}, ${each.description?.split(' · ')[0] ?? ''}`,
    start: each.start,
    end: each.end,
  })),
  {
    id: 'meeting',
    title: 'Team meeting',
    start: '2026-10-15T13:00',
    end: '2026-10-15T14:00',
    tone: 'premium' as const,
    description: 'Room 2, ground floor',
  },
]

/** Her last finding: the diagnosis and the finding are sensitive (MaskedValue). */
export const FINDING = {
  number: 'IZ-2026-03417',
  date: '2026-09-14',
  doctor: 'dr Marko Stanković',
  kind: 'Check-up, general practice',
  diagnosis: 'I10 Essential (primary) hypertension',
  text: 'Blood pressure 150/95 mmHg in two measurements. Less salt, a walk every day; a control in a month with the readings from home.',
  next: '2026-10-14T11:30',
}

// ── 5. School: OŠ "Jovan Popović", class 7/2 ───────────────────────────────────────────────────

export const SCHOOL = {
  companyId: 'jovan-popovic',
  name: 'OŠ „Jovan Popović“ Novi Sad',
  className: '7/2',
  year: '2026/27',
  /** Today in the examples: Tuesday 06.10.2026, during lesson 3. */
  day: '2026-10-06',
  now: '10:05',
  teacher: 'Dragana Simić',
}

// ── The mathematics gradebook ─────────────────────────────────────────────────────────────────

// ── The parent portal: Luka Jovanović's absences ───────────────────────────────────────────────

// ── P5.28 screens ──────────────────────────────────────────────────────────────────────────────

/**
 * A move of Jovana's appointment proposed on the schedule (a drag to dr Nada Grujić's free 12:30):
 * the confirmation open on it, as the reception would see it before anything changes.
 */
export const JOVANA_MOVE = {
  id: JOVANA_BOOKING.id,
  resourceId: 'grujic',
  start: `${CLINIC.day}T12:30`,
  end: `${CLINIC.day}T13:00`,
}

/** dr Vesna Lukić is on annual leave on 14.10. (the clinic's data). */
export const UNAVAILABLE: readonly UnavailableTime[] = [
  ...['stankovic', 'grujic'].map((resourceId) => ({
    resourceId,
    start: `${CLINIC.day}T${BREAK}`,
    end: `${CLINIC.day}T10:30`,
    reason: 'Break',
  })),
  {
    resourceId: 'lukic',
    start: `${CLINIC.day}T07:00`,
    end: `${CLINIC.day}T13:00`,
    reason: 'Annual leave',
  },
  {
    resourceId: 'lab',
    start: `${CLINIC.day}T10:00`,
    end: `${CLINIC.day}T13:00`,
    reason: 'Samples go to the laboratory',
  },
]
