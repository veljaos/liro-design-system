/*
 * Group H's example data (P5.17, industry examples): Ambulanta Liman of Dom zdravlja Novi Sad —
 * the doctors' week of 12.–16.10.2026, the free times the patient portal offers, Jovana Nikolić's
 * booking (Wed 14.10. at 11:30) and dr Marko Stanković's calendar with it. Counts are worked out
 * here, in whole numbers, as the application would; the components add nothing. Fictitious
 * people and numbers. No classes here.
 */
import type {
  CalendarEvent,
  CatalogCategory,
  CatalogFilter,
  CatalogItem,
  CatalogSection,
  FreeSlot,
  ScheduleBooking,
  ScheduleResource,
  UnavailableTime,
} from '@veljaos/ui'

// ── Ambulanta Liman ───────────────────────────────────────────────────────────────────────────

export const CLINIC = {
  companyId: 'dzns',
  company: 'Dom zdravlja Novi Sad',
  name: 'Ambulanta Liman',
  address: 'Fruškogorska 26, Novi Sad',
  phone: '021 4879 000',
  week: { start: '2026-10-12', end: '2026-10-16' },
  /** The day the calendar opens on: the day of Jovana's appointment. */
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

// ── The catalogue of services (P5.90 item 14) ───────────────────────────────────────────────────

/**
 * Dom zdravlja Novi Sad's services as the patient portal offers them: 62 services in levels
 * (general practice; specialist exams by specialty; the laboratory's blood draw and other
 * samples; imaging; dental care; physical therapy; vaccination). Who performs each, how long it
 * takes, whether health insurance covers it or its price (and a discount), all the clinic's data;
 * the portal shows them in a CatalogPicker. Fictitious doctors and prices.
 */
export const SERVICE_LEVELS: CatalogCategory[] = [
  { id: 'gp', label: 'General practice', description: 'Your chosen doctor at Ambulanta Liman' },
  { id: 'specialist', label: 'Specialist exam', description: 'With a referral, or paid' },
  { id: 'cardio', label: 'Cardiology', parentId: 'specialist' },
  { id: 'derma', label: 'Dermatology', parentId: 'specialist' },
  { id: 'eye', label: 'Ophthalmology', parentId: 'specialist' },
  { id: 'ent', label: 'Ear, nose and throat', parentId: 'specialist' },
  { id: 'gyn', label: 'Gynaecology', parentId: 'specialist' },
  { id: 'endo', label: 'Endocrinology', parentId: 'specialist' },
  { id: 'ortho', label: 'Orthopaedics', parentId: 'specialist' },
  { id: 'lab', label: 'Laboratory', description: 'Samples taken 07–10 h' },
  { id: 'blood', label: 'Blood draw', parentId: 'lab', description: 'Come fasting' },
  { id: 'samples', label: 'Urine and swabs', parentId: 'lab' },
  { id: 'imaging', label: 'Imaging', description: 'Ultrasound, X-ray, ECG' },
  { id: 'dental', label: 'Dental care' },
  { id: 'physio', label: 'Physical therapy' },
  { id: 'vaccines', label: 'Vaccination' },
]

/**
 * Said once, in the catalogue's description and as a filter (P5.93 item 12): a covered service
 * shows no price; only the ones the patient pays show theirs.
 */
export const COVERED = 'Covered by health insurance'

function service(
  id: string,
  name: string,
  categoryId: string,
  detail: string,
  provider: string,
  price?: string,
  extra: Partial<CatalogItem> = {},
): CatalogItem {
  return {
    id,
    name,
    categoryId,
    detail,
    provider,
    ...(price === undefined ? {} : { price }),
    ...extra,
  }
}

const GP = 'Your chosen doctor'

export const SERVICES: CatalogItem[] = [
  // General practice: the patient's chosen doctor, covered.
  service('checkup', 'Check-up', 'gp', '30 min', GP),
  service('pressure', 'Blood pressure control', 'gp', '30 min', GP),
  service('prescription', 'Prescription renewal', 'gp', '15 min', GP),
  service('referral', 'Referral to a specialist', 'gp', '15 min', GP),
  service('sick-leave', 'Sick-leave certificate', 'gp', '15 min', GP),
  service('diabetes', 'Diabetes control', 'gp', '30 min', GP),
  service('driving', 'Certificate for a driving licence', 'gp', '45 min', GP, '4500.00'),
  service('sports', 'Certificate for sports', 'gp', '30 min', GP, '2800.00'),
  service('preventive-40', 'Preventive check-up 40+', 'gp', '45 min', GP, '3200.00', {
    originalPrice: '4000.00',
    discount: '−20% in October, preventive month',
  }),
  // Specialist exams.
  service('cardio-exam', 'Cardiology exam', 'cardio', '30 min', 'dr Ana Jović', undefined, {
    keywords: 'heart',
  }),
  service('cardio-ecg-holter', 'Holter ECG, 24 h', 'cardio', '24 h', 'dr Ana Jović', '6800.00'),
  service('cardio-echo', 'Heart ultrasound', 'cardio', '40 min', 'dr Ana Jović', '7500.00'),
  service('cardio-stress', 'Stress test', 'cardio', '1 h', 'dr Petar Ilić', '6200.00'),
  service('derma-exam', 'Dermatology exam', 'derma', '20 min', 'dr Mira Kostić'),
  service(
    'derma-moles',
    'Mole check with dermoscopy',
    'derma',
    '30 min',
    'dr Mira Kostić',
    '4200.00',
    {
      originalPrice: '5250.00',
      discount: '−20% until 31.10.',
    },
  ),
  service(
    'derma-removal',
    'Removal of a skin change',
    'derma',
    '45 min',
    'dr Mira Kostić',
    '8900.00',
  ),
  service('eye-exam', 'Eye exam', 'eye', '30 min', 'dr Vladimir Đurić'),
  service('eye-glasses', 'Eye test for glasses', 'eye', '20 min', 'dr Vladimir Đurić', '2500.00'),
  service(
    'eye-pressure',
    'Eye pressure measurement',
    'eye',
    '15 min',
    'dr Vladimir Đurić',
    '1500.00',
  ),
  service('ent-exam', 'Ear, nose and throat exam', 'ent', '20 min', 'dr Lazar Nikolić'),
  service('ent-hearing', 'Hearing test', 'ent', '30 min', 'dr Lazar Nikolić', '3000.00'),
  service('ent-wax', 'Ear wax removal', 'ent', '15 min', 'dr Lazar Nikolić', '1800.00'),
  service('gyn-exam', 'Gynaecology exam', 'gyn', '30 min', 'dr Jelena Popov'),
  service('gyn-pap', 'Pap test', 'gyn', '15 min', 'dr Jelena Popov'),
  service(
    'gyn-ultrasound',
    'Gynaecological ultrasound',
    'gyn',
    '20 min',
    'dr Jelena Popov',
    '3500.00',
  ),
  service('endo-exam', 'Endocrinology exam', 'endo', '30 min', 'dr Nevena Marić'),
  service('endo-thyroid', 'Thyroid ultrasound', 'endo', '20 min', 'dr Nevena Marić', '3800.00'),
  service('ortho-exam', 'Orthopaedic exam', 'ortho', '20 min', 'dr Bojan Savić'),
  service('ortho-injection', 'Joint injection', 'ortho', '20 min', 'dr Bojan Savić', '5500.00'),
  // The laboratory.
  service('blood-count', 'Complete blood count', 'blood', '5 min', 'Laboratory'),
  service('glucose', 'Blood glucose', 'blood', '5 min', 'Laboratory'),
  service('lipids', 'Lipid profile', 'blood', '5 min', 'Laboratory', undefined, {
    keywords: 'cholesterol triglycerides',
  }),
  service('liver', 'Liver tests', 'blood', '5 min', 'Laboratory'),
  service('kidney', 'Kidney tests', 'blood', '5 min', 'Laboratory', undefined, {
    keywords: 'creatinine urea',
  }),
  service('tsh', 'Thyroid hormones (TSH, FT4)', 'blood', '5 min', 'Laboratory', '2400.00'),
  service('hba1c', 'HbA1c', 'blood', '5 min', 'Laboratory'),
  service('vitamin-d', 'Vitamin D', 'blood', '5 min', 'Laboratory', '2900.00'),
  service('iron', 'Iron and ferritin', 'blood', '5 min', 'Laboratory', '1900.00'),
  service('psa', 'PSA', 'blood', '5 min', 'Laboratory', '1600.00'),
  service('crp', 'CRP', 'blood', '5 min', 'Laboratory'),
  service('urine', 'Urine test', 'samples', 'Bring the first morning urine', 'Laboratory'),
  service('throat-swab', 'Throat swab', 'samples', '5 min', 'Laboratory'),
  service('nose-swab', 'Nose swab', 'samples', '5 min', 'Laboratory'),
  service('stool', 'Stool test', 'samples', 'Bring the sample', 'Laboratory', '1200.00'),
  // Imaging.
  service('ecg', 'ECG', 'imaging', '15 min', 'Imaging unit'),
  service('us-abdomen', 'Abdominal ultrasound', 'imaging', '20 min', 'dr Goran Tomić'),
  service('us-breast', 'Breast ultrasound', 'imaging', '20 min', 'dr Goran Tomić', '3600.00'),
  service('xray-chest', 'Chest X-ray', 'imaging', '10 min', 'Imaging unit'),
  service('xray-spine', 'Spine X-ray', 'imaging', '15 min', 'Imaging unit'),
  service('mammography', 'Mammography', 'imaging', '20 min', 'Imaging unit', undefined, {
    unavailableReason: 'No free times this month; the next ones open on 01.11.',
  }),
  // Dental care.
  service('dental-exam', 'Dental exam', 'dental', '20 min', 'dr Ivana Lukić'),
  service('dental-cleaning', 'Teeth cleaning', 'dental', '40 min', 'dr Ivana Lukić', '3500.00'),
  service('dental-filling', 'Filling', 'dental', '45 min', 'dr Ivana Lukić', '4800.00'),
  service('dental-xray', 'Dental X-ray', 'dental', '10 min', 'dr Ivana Lukić', '1200.00'),
  // Physical therapy.
  service('physio-exam', 'Physiatrist exam', 'physio', '30 min', 'dr Sava Petrović'),
  service(
    'physio-back',
    'Therapy for back pain, 10 sessions',
    'physio',
    '10 × 45 min',
    'Physiotherapy',
    '18000.00',
  ),
  service('physio-massage', 'Therapeutic massage', 'physio', '30 min', 'Physiotherapy', '2500.00'),
  // Vaccination.
  service('flu', 'Flu vaccine', 'vaccines', '10 min', 'Vaccination point'),
  service('tetanus', 'Tetanus vaccine', 'vaccines', '10 min', 'Vaccination point'),
  service('hpv', 'HPV vaccine', 'vaccines', '10 min', 'Vaccination point', '9500.00'),
  service(
    'hepatitis-b',
    'Hepatitis B vaccine',
    'vaccines',
    '10 min',
    'Vaccination point',
    '3200.00',
  ),
]

/** What the portal shows first (the clinic's data): most chosen, Jovana's recent, for her age. */
export const SERVICE_SECTIONS: CatalogSection[] = [
  { id: 'top', label: 'Most chosen', itemIds: ['checkup', 'blood-count', 'prescription', 'flu'] },
  { id: 'recent', label: 'Your recent', itemIds: ['pressure', 'lipids'] },
  { id: 'recommended', label: 'Recommended for you', itemIds: ['preventive-40', 'mammography'] },
  { id: 'discount', label: 'On discount', itemIds: ['preventive-40', 'derma-moles'] },
]

export const SERVICE_FILTERS: CatalogFilter[] = [
  { id: 'covered', label: COVERED, matches: (each) => each.price === undefined },
  { id: 'gp', label: 'With your chosen doctor', matches: (each) => each.provider === GP },
]

/** The service a booking opens with (Jovana's usual). */
export const DEFAULT_SERVICE = 'checkup'

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

/** Every booking after hers: the doctor's calendar counts his. */
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
