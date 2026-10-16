/*
 * Group BP's example data (P5.75, fleet): Kvadrat Gradnja d.o.o.'s vehicles on 14 October 2026 at
 * 09:40, kept by Milica Petrović (head of finance and administration). The pickup NS-911-LM is
 * the fixed asset OS-0133 on the finance lease LZ-2024-012 (groups AP and AS) and the company
 * vehicle of the travel orders (group AQ); the site van NS-123-AB is the one whose fuel the cash
 * book pays (group AK: CP-2026-0210 and CP-2026-0214); the van Fiat Ducato NS-482-KG was sold on
 * 30.09.2026 (OS-0098, F-2026-0429); the truck NS-377-ZK is rented (group AQ). The other cars are
 * on operating leases, so they are not fixed assets. The drivers are group AJ's people.
 * Every figure is the application's: mileage, litres, costs, the consumption, what is due and by
 * how much — decimal strings and words, never computed by the screens (D4). Insurers, policies
 * and rules (winter tyres) are illustrative; every name, number and amount is invented. Not part
 * of the package. No classes here.
 */
import type { Tone } from '@veljaos/ui'
import { AM_ROUTES } from './data-AM'
import { AP_ROUTES } from './data-AP'

export const BP_TODAY = '2026-10-14'

/** The van whose registration, insurance and service are all due. */
export const FEATURED_VEHICLE = 'NS-123-AB'

const VEHICLE_PATH = (plate: string) => `/fleet/vehicles/${plate}`

export const BP_ROUTES = {
  vehicles: '/fleet/vehicles',
  /** The list's "Sold and returned" view. */
  gone: '/fleet/vehicles?view=gone',
  vehicle: VEHICLE_PATH,
  featured: VEHICLE_PATH(FEATURED_VEHICLE),
  /** The van with "Add fuel entry" asked. */
  addFuel: `${VEHICLE_PATH(FEATURED_VEHICLE)}?ask=fuel`,
  reminders: '/fleet/reminders',
  /** The reminders with "Mark as done…" asked for the van's registration. */
  remindersDone: '/fleet/reminders?ask=r-reg-123',
} as const

// ── Vehicles ──────────────────────────────────────────────────────────────────────────────────

export type VehicleState = 'In use' | 'In the workshop' | 'Rented' | 'Sold'

export const VEHICLE_TONES: Record<VehicleState, Tone> = {
  'In use': 'success',
  'In the workshop': 'warning',
  Rented: 'neutral',
  Sold: 'neutral',
}

/** A date or a reading that falls due, with the application's words and tone. */
export interface Due {
  /** YYYY-MM-DD, when the due point is a date. */
  date?: string
  /** The due point in words, when it is a reading ("At 140.000 km"). */
  text?: string
  /** How far it is, in the application's words ("Expires in 5 days", "Overdue by 2.880 km"). */
  words: string
  tone: Tone
}

export interface Vehicle {
  plate: string
  model: string
  kind: 'Van' | 'Pickup' | 'Car' | 'Truck'
  year: string
  vin: string
  fuel: string
  /** How the company holds it, in the application's words. */
  ownership: string
  /** A link for the ownership: the fixed asset, the lease. */
  ownershipHref?: string
  driver: string
  driverRole: string
  costCentre: string
  /** Kilometres, the last reading. */
  mileage: string
  mileageAt: string
  registration: Due | null
  service: Due | null
  state: VehicleState
  /** The state's detail ("At Auto Centar Novi Sad d.o.o. since 12.10.2026: brakes"). */
  note?: string
}

const vehicle = (fields: Vehicle): Vehicle => fields

export const VEHICLES: readonly Vehicle[] = [
  vehicle({
    plate: 'NS-123-AB',
    model: 'Renault Master 2.3 dCi',
    kind: 'Van',
    year: '2021',
    vin: 'VF1MA000966412873',
    fuel: 'Diesel',
    ownership: 'Operating lease OL-2023-007, Lizing Plus d.o.o.',
    driver: 'Marko Ilić',
    driverRole: 'Foreman, crew Ilić',
    costCentre: '310 Residential building Liman 4',
    mileage: '142880',
    mileageAt: '2026-10-14',
    registration: { date: '2026-10-19', words: 'Expires in 5 days', tone: 'warning' },
    service: { text: 'At 140.000 km', words: 'Overdue by 2.880 km', tone: 'danger' },
    state: 'In use',
  }),
  vehicle({
    plate: 'NS-911-LM',
    model: 'Toyota Hilux 2.4 D-4D',
    kind: 'Pickup',
    year: '2024',
    vin: 'AHTKB3CD802981446',
    fuel: 'Diesel',
    ownership: 'Fixed asset OS-0133, finance lease LZ-2024-012',
    ownershipHref: AP_ROUTES.asset('OS-0133'),
    driver: 'Stefan Nikolić',
    driverRole: 'Site manager, Bulevar Evrope 24',
    costCentre: '320 Bulevar Evrope 24',
    mileage: '68420',
    mileageAt: '2026-10-13',
    registration: { date: '2027-02-11', words: 'Valid for 4 months', tone: 'neutral' },
    service: { text: 'At 75.000 km or by 12.02.2027.', words: 'In 6.580 km', tone: 'neutral' },
    state: 'In use',
  }),
  vehicle({
    plate: 'NS-204-KG',
    model: 'Škoda Octavia 2.0 TDI',
    kind: 'Car',
    year: '2024',
    vin: 'TMBJR7NX4RY012557',
    fuel: 'Diesel',
    ownership: 'Operating lease OL-2024-002, Lizing Plus d.o.o.',
    driver: 'Nenad Kovačević',
    driverRole: 'Director',
    costCentre: '100 Administration',
    mileage: '41230',
    mileageAt: '2026-10-10',
    registration: { date: '2027-04-03', words: 'Valid for 5 months', tone: 'neutral' },
    service: { text: 'At 45.000 km', words: 'Due soon: in 3.770 km', tone: 'warning' },
    state: 'In use',
  }),
  vehicle({
    plate: 'NS-318-KG',
    model: 'Dacia Duster 1.5 dCi 4x4',
    kind: 'Car',
    year: '2023',
    vin: 'UU1HSDCV570551209',
    fuel: 'Diesel',
    ownership: 'Operating lease OL-2023-011, Lizing Plus d.o.o.',
    driver: 'Goran Medić',
    driverRole: 'Head of construction',
    costCentre: '100 Administration',
    mileage: '87610',
    mileageAt: '2026-10-12',
    registration: { date: '2026-11-28', words: 'Expires in 45 days', tone: 'neutral' },
    service: { text: 'At 96.000 km', words: 'In 8.390 km', tone: 'neutral' },
    state: 'In use',
  }),
  vehicle({
    plate: 'NS-552-KG',
    model: 'Fiat Doblò Cargo 1.6',
    kind: 'Van',
    year: '2022',
    vin: 'ZFA26300006M41877',
    fuel: 'Diesel',
    ownership: 'Operating lease OL-2022-019, Lizing Plus d.o.o.',
    driver: 'Zoran Bojović',
    driverRole: 'Warehouse keeper',
    costCentre: '400 Machinery pool',
    mileage: '93415',
    mileageAt: '2026-10-12',
    registration: { date: '2027-06-15', words: 'Valid for 8 months', tone: 'neutral' },
    service: { text: 'In the workshop', words: 'Brakes, since 12.10.2026.', tone: 'neutral' },
    state: 'In the workshop',
    note: 'At Auto Centar Novi Sad d.o.o. since 12.10.2026.: front brakes; back on 15.10.2026.',
  }),
  vehicle({
    plate: 'NS-640-KG',
    model: 'Škoda Fabia 1.0 TSI',
    kind: 'Car',
    year: '2025',
    vin: 'TMBEP6NJ3SZ104488',
    fuel: 'Petrol',
    ownership: 'Operating lease OL-2025-004, Lizing Plus d.o.o.',
    driver: 'Pool car',
    driverRole: 'Head office, booked by the day',
    costCentre: '100 Administration',
    mileage: '18950',
    mileageAt: '2026-10-09',
    registration: { date: '2027-01-20', words: 'Valid for 3 months', tone: 'neutral' },
    service: { text: 'At 30.000 km or by 20.01.2027.', words: 'In 3 months', tone: 'neutral' },
    state: 'In use',
  }),
  vehicle({
    plate: 'NS-377-ZK',
    model: 'MAN TGL 12.250 tipper',
    kind: 'Truck',
    year: '2020',
    vin: 'WMAN08ZZ7LY401226',
    fuel: 'Diesel',
    ownership: 'Rented from Transport Bačka d.o.o. until 31.10.2026.',
    driver: 'Petar Jovanović',
    driverRole: 'Mason, crew Ilić (category C)',
    costCentre: '310 Residential building Liman 4',
    mileage: '214300',
    mileageAt: '2026-10-01',
    registration: null,
    service: null,
    state: 'Rented',
    note: 'Registration, insurance and service are the rental company’s.',
  }),
  vehicle({
    plate: 'NS-482-KG',
    model: 'Fiat Ducato 2.3 Multijet',
    kind: 'Van',
    year: '2020',
    vin: 'ZFA25000002K81944',
    fuel: 'Diesel',
    ownership: 'Fixed asset OS-0098, sold to Stanogradnja Plus d.o.o. (F-2026-0429)',
    ownershipHref: AP_ROUTES.sold,
    driver: '—',
    driverRole: 'No driver',
    costCentre: '400 Machinery pool',
    mileage: '187240',
    mileageAt: '2026-09-30',
    registration: null,
    service: null,
    state: 'Sold',
    note: 'Sold on 30.09.2026.',
  }),
]

export function vehicleByPlate(plate: string): Vehicle | undefined {
  return VEHICLES.find((each) => each.plate === plate)
}

export type VehiclesView = 'active' | 'gone' | 'all'

export const VEHICLE_VIEWS: { id: VehiclesView; label: string }[] = [
  { id: 'active', label: 'In the fleet' },
  { id: 'gone', label: 'Sold and returned' },
  { id: 'all', label: 'All' },
]

export function inVehiclesView(each: Vehicle, view: VehiclesView): boolean {
  if (view === 'all') return true
  return view === 'gone' ? each.state === 'Sold' : each.state !== 'Sold'
}

export const KIND_OPTIONS = [
  { value: 'Van', label: 'Van' },
  { value: 'Pickup', label: 'Pickup' },
  { value: 'Car', label: 'Car' },
  { value: 'Truck', label: 'Truck' },
]

// ── The van: registration and insurance, services, fuel ───────────────────────────────────────

export interface Paper {
  id: string
  kind: string
  /** The policy or the document, with who issued it. */
  detail: string
  /** Valid until, YYYY-MM-DD. */
  until: string
  words: string
  tone: Tone
}

export const PAPERS: readonly Paper[] = [
  {
    id: 'reg',
    kind: 'Registration',
    detail: 'Registration certificate, MUP Novi Sad',
    until: '2026-10-19',
    words: 'Expires in 5 days',
    tone: 'warning',
  },
  {
    id: 'inspection',
    kind: 'Technical inspection',
    detail: 'Passed on 12.10.2026. at Tehnički pregled Liman',
    until: '2026-10-19',
    words: 'Done for the renewal',
    tone: 'success',
  },
  {
    id: 'compulsory',
    kind: 'Compulsory motor insurance',
    detail: 'Policy AO-2025-448812, Illustrative Osiguranje a.d.',
    until: '2026-10-19',
    words: 'Expires in 5 days; renewal asked on 10.10.2026.',
    tone: 'warning',
  },
  {
    id: 'comprehensive',
    kind: 'Comprehensive insurance',
    detail: 'Policy KA-2026-0193, Illustrative Osiguranje a.d.',
    until: '2027-03-31',
    words: 'Valid for 5 months',
    tone: 'neutral',
  },
]

export interface ServiceEntry {
  id: string
  date: string
  mileage: string
  workshop: string
  work: string
  cost: string
  /** The supplier's invoice. */
  document: string
}

export const SERVICES: readonly ServiceEntry[] = [
  {
    id: 's1',
    date: '2026-04-21',
    mileage: '128650',
    workshop: 'Vulkanizer Liman',
    work: 'Summer tyres fitted',
    cost: '3600.00',
    document: 'UF-2026-0441',
  },
  {
    id: 's2',
    date: '2026-03-18',
    mileage: '120400',
    workshop: 'Auto Centar Novi Sad d.o.o.',
    work: 'Service at 120.000 km: oil, filters, front brake pads',
    cost: '48600.00',
    document: 'UF-2026-0388',
  },
  {
    id: 's3',
    date: '2025-11-04',
    mileage: '109720',
    workshop: 'Vulkanizer Liman',
    work: 'Winter tyres fitted',
    cost: '3600.00',
    document: 'UF-2025-1290',
  },
  {
    id: 's4',
    date: '2025-09-02',
    mileage: '101950',
    workshop: 'Auto Centar Novi Sad d.o.o.',
    work: 'Service at 100.000 km: oil, filters, timing belt and water pump',
    cost: '96200.00',
    document: 'UF-2025-1043',
  },
]

export const SERVICES_TOTAL = '152000.00'

export interface FuelEntry {
  id: string
  date: string
  station: string
  litres: string
  amount: string
  mileage: string
  /** Litres per 100 km since the fill before, the application's; null until it can say. */
  consumption: string | null
  /** How it was paid, with the document. */
  paid: string
  paidHref?: string
}

export const FUEL: readonly FuelEntry[] = [
  {
    id: 'f1',
    date: '2026-10-14',
    station: 'NIS Petrol, Novi Sad',
    litres: '25.40',
    amount: '4800.00',
    mileage: '142880',
    consumption: '10.6',
    paid: 'Cash, CP-2026-0214',
    paidHref: AM_ROUTES.book,
  },
  {
    id: 'f2',
    date: '2026-10-12',
    station: 'NIS Petrol, Novi Sad',
    litres: '32.80',
    amount: '6200.00',
    mileage: '142640',
    consumption: '10.3',
    paid: 'Cash, CP-2026-0210',
    paidHref: AM_ROUTES.book,
  },
  {
    id: 'f3',
    date: '2026-10-07',
    station: 'OMV, Temerinski put',
    litres: '61.20',
    amount: '11560.00',
    mileage: '142320',
    consumption: '10.6',
    paid: 'Fuel card ending 4471',
  },
  {
    id: 'f4',
    date: '2026-10-01',
    station: 'NIS Petrol, Novi Sad',
    litres: '58.90',
    amount: '11130.00',
    mileage: '141740',
    consumption: '10.2',
    paid: 'Fuel card ending 4471',
  },
]

export const FUEL_TOTALS = { litres: '178.30', amount: '33690.00' }

/** The van's figures, the application's. */
export const VAN_FIGURES = {
  consumption: '10.4',
  consumptionWords: 'l/100 km, average of October',
  fuelYear: '412860.00',
}

/** The fill the application proposes in "Add fuel entry" (the receipt read at the pump). */
export const NEW_FUEL = {
  date: '2026-10-14',
  station: 'NIS Petrol, Novi Sad',
  litres: '40.10',
  amount: '7580.00',
  mileage: '143260',
  paid: 'card',
  /** What the application answers for these figures (40,10 l over 380 km). */
  consumption: '10.6',
}

export const PAID_OPTIONS = [
  { value: 'card', label: 'Fuel card ending 4471' },
  { value: 'cash', label: 'Cash, from the main cash desk' },
  { value: 'own', label: 'Paid by the driver, to refund' },
]

// ── Reminders ─────────────────────────────────────────────────────────────────────────────────

export type ReminderState = 'Overdue' | 'Due soon' | 'Planned' | 'Done'

export const REMINDER_TONES: Record<ReminderState, Tone> = {
  Overdue: 'danger',
  'Due soon': 'warning',
  Planned: 'neutral',
  Done: 'success',
}

export type ReminderKind = 'Registration' | 'Insurance' | 'Service' | 'Tyres'

export interface Reminder {
  id: string
  kind: ReminderKind
  /** What exactly, in the application's words. */
  title: string
  plate: string
  due: { date: string } | { text: string }
  state: ReminderState
  words: string
}

const reminder = (fields: Reminder): Reminder => fields

export const REMINDERS: readonly Reminder[] = [
  reminder({
    id: 'r-srv-123',
    kind: 'Service',
    title: 'Service at 140.000 km',
    plate: 'NS-123-AB',
    due: { text: 'At 140.000 km' },
    state: 'Overdue',
    words: 'Overdue by 2.880 km',
  }),
  reminder({
    id: 'r-reg-123',
    kind: 'Registration',
    title: 'Renew the registration',
    plate: 'NS-123-AB',
    due: { date: '2026-10-19' },
    state: 'Due soon',
    words: 'In 5 days',
  }),
  reminder({
    id: 'r-ins-123',
    kind: 'Insurance',
    title: 'Compulsory motor insurance',
    plate: 'NS-123-AB',
    due: { date: '2026-10-19' },
    state: 'Due soon',
    words: 'In 5 days',
  }),
  reminder({
    id: 'r-kasko-318',
    kind: 'Insurance',
    title: 'Comprehensive insurance',
    plate: 'NS-318-KG',
    due: { date: '2026-10-22' },
    state: 'Due soon',
    words: 'In 8 days',
  }),
  reminder({
    id: 'r-srv-204',
    kind: 'Service',
    title: 'Service at 45.000 km',
    plate: 'NS-204-KG',
    due: { text: 'At 45.000 km' },
    state: 'Due soon',
    words: 'In 3.770 km',
  }),
  reminder({
    id: 'r-tyre-123',
    kind: 'Tyres',
    title: 'Winter tyres (illustrative rule: from 1 November)',
    plate: 'NS-123-AB',
    due: { date: '2026-11-01' },
    state: 'Planned',
    words: 'In 18 days',
  }),
  reminder({
    id: 'r-tyre-318',
    kind: 'Tyres',
    title: 'Winter tyres (illustrative rule: from 1 November)',
    plate: 'NS-318-KG',
    due: { date: '2026-11-01' },
    state: 'Planned',
    words: 'In 18 days',
  }),
  reminder({
    id: 'r-tyre-640',
    kind: 'Tyres',
    title: 'Winter tyres (illustrative rule: from 1 November)',
    plate: 'NS-640-KG',
    due: { date: '2026-11-01' },
    state: 'Planned',
    words: 'In 18 days',
  }),
  reminder({
    id: 'r-reg-318',
    kind: 'Registration',
    title: 'Renew the registration',
    plate: 'NS-318-KG',
    due: { date: '2026-11-28' },
    state: 'Planned',
    words: 'In 45 days',
  }),
  reminder({
    id: 'r-tyre-911',
    kind: 'Tyres',
    title: 'Winter tyres (illustrative rule: from 1 November)',
    plate: 'NS-911-LM',
    due: { date: '2026-11-01' },
    state: 'Done',
    words: 'Fitted on 10.10.2026.',
  }),
  reminder({
    id: 'r-srv-640',
    kind: 'Service',
    title: 'Service at 15.000 km',
    plate: 'NS-640-KG',
    due: { text: 'At 15.000 km' },
    state: 'Done',
    words: 'Done on 02.06.2026. at 14.880 km',
  }),
]

export type RemindersView = 'due' | 'planned' | 'done' | 'all'

export const REMINDER_VIEWS: { id: RemindersView; label: string }[] = [
  { id: 'due', label: 'Overdue and due soon' },
  { id: 'planned', label: 'Planned' },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'All' },
]

export function inRemindersView(each: Reminder, view: RemindersView): boolean {
  if (view === 'all') return true
  if (view === 'done') return each.state === 'Done'
  if (view === 'planned') return each.state === 'Planned'
  return each.state === 'Overdue' || each.state === 'Due soon'
}

export const REMINDER_KINDS = [
  { value: 'Registration', label: 'Registration' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Service', label: 'Service' },
  { value: 'Tyres', label: 'Tyres' },
]
