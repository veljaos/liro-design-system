/*
 * Group BQ's example data (P5.76, property management): Kvadrat Nekretnine d.o.o. — the Kvadrat
 * group's company for the sale and rental of flats (data-AJ), PIB 111985302 — lets the units of
 * two residential buildings Kvadrat Gradnja d.o.o. built: Residential building Liman 2 (finished
 * 2021) and Residential building Grbavica 7 (finished 2023), both in Novi Sad. Vesna Tomić, its
 * property manager, sees them on 14.10.2026 at 09:40: 24 units (20 let, 2 vacant, 2 under
 * repair), their tenants and leases, the November 2026 rent run and the maintenance requests; Ivana
 * Radović, the tenant of flat L2-3.2, sees her lease, invoices and requests in the tenants' portal.
 * Every rent, charge, VAT amount, total, count, date and reminder is the application's, written
 * here as decimal strings and words (D4): the screens add and count nothing. Invented; addresses,
 * PIBs and the national ID illustrative; e-mail addresses at example.com. The leaking sink's work
 * order SN-2026-0087 is group C's field service (route `/service/work-orders/<number>`). Not part
 * of the package.
 */
import type { RackFloor, RackNote, RackState, Tone } from '@veljaos/ui'
import { viewer } from '../../../../packages/ui/src/components/document-frame-story-data'

export const BQ_TODAY = '2026-10-14'
export const BQ_NOW = '2026-10-14T09:40:00+02:00'

export const FEATURED_UNIT = 'L2-3.2'
export const FEATURED_LEASE = 'UZ-2024-041'
export const FEATURED_TENANT = 'radovic'
export const FEATURED_REQUEST = 'MR-2026-0047'
export const NEW_REQUEST = 'MR-2026-0049'

/** A field-service work order (group C, P5.74): the agreed route; the screen is theirs. */
export const workOrderRoute = (number: string) => `/service/work-orders/${number}`

export const BQ_ROUTES = {
  units: '/property/units',
  unitsList: '/property/units?view=list',
  /** The rack with a unit open in its drawer. */
  unit: (id: string) => `/property/units?unit=${id}`,
  tenants: '/property/tenants',
  tenant: (id: string) => `/property/tenants/${id}`,
  leases: '/property/leases',
  lease: (number: string) => `/property/leases/${number}`,
  /** The featured lease with Renew… open, as the application restores it. */
  leaseRenew: `/property/leases/${FEATURED_LEASE}?renew=1`,
  leaseDocument: (number: string) => `/property/leases/${number}/document`,
  run: '/property/rent/2026-11',
  /** The run with the featured unit's invoice open in the preview. */
  runPreview: `/property/rent/2026-11?preview=${FEATURED_UNIT}`,
  /** The run after Issue. */
  runIssued: '/property/rent/2026-11?issued=1',
  requests: '/property/maintenance',
  /** The list with one request open in its drawer. */
  request: (number: string) => `/property/maintenance?request=${number}`,
  portal: '/my-home',
  portalRequests: '/my-home/requests',
  portalNew: '/my-home/requests/new',
  portalRequest: (number: string) => `/my-home/requests/${number}`,
  portalInvoices: '/my-home/invoices',
} as const

export const MANAGER = {
  company: 'Kvadrat Nekretnine d.o.o.',
  companyId: 'nekretnine',
  taxId: '111985302',
  name: 'Vesna Tomić',
  role: 'Property manager',
  email: 'vesna.tomic@example.com',
  address: 'Bulevar oslobođenja 100, 21000 Novi Sad (illustrative)',
  account: '160-0000000123456-89 (illustrative)',
  phone: '+381 21 555 0100',
}

// ── Buildings and units ───────────────────────────────────────────────────────────────────────

export interface Building {
  id: 'L2' | 'G7'
  name: string
  short: string
  address: string
  built: string
}

export const BUILDINGS: Building[] = [
  {
    id: 'L2',
    name: 'Residential building Liman 2',
    short: 'Liman 2',
    address: 'Bulevar cara Lazara 2, Novi Sad (illustrative)',
    built: 'Built by Kvadrat Gradnja d.o.o. in 2021',
  },
  {
    id: 'G7',
    name: 'Residential building Grbavica 7',
    short: 'Grbavica 7',
    address: 'Grbavička 7, Novi Sad (illustrative)',
    built: 'Built by Kvadrat Gradnja d.o.o. in 2023',
  },
]

export type UnitState = 'let' | 'vacant' | 'repair'
export type RentState = 'paid' | 'overdue'

export const UNIT_STATE_WORDS: Record<UnitState, string> = {
  let: 'Let',
  vacant: 'Vacant',
  repair: 'Under repair',
}

export const UNIT_TONES: Record<UnitState, Tone> = {
  let: 'success',
  vacant: 'warning',
  repair: 'neutral',
}

/** The rack's chips: the occupancy and the rent; the rack counts the units it is given. */
export const UNIT_STATES: RackState[] = [
  { id: 'let', label: 'Let', tone: 'success' },
  { id: 'vacant', label: 'Vacant', tone: 'warning' },
  { id: 'repair', label: 'Under repair', tone: 'neutral' },
]

export const RENT_STATES: RackState[] = [
  { id: 'paid', label: 'Rent paid', tone: 'success' },
  { id: 'overdue', label: 'Rent overdue', tone: 'danger' },
]

export interface Unit {
  id: string
  building: Building['id']
  /** 0 is the ground floor. */
  floor: number
  /** "Flat", "Shop", "Office". */
  kind: string
  /** The short type on the rack: rooms as written in Serbia ("2.0"), or the kind. */
  type: string
  /** m², a decimal string. */
  area: string
  state: UnitState
  rent?: RentState
  /** The tenant's id (TENANTS). */
  tenant?: string
  lease?: string
  /** Monthly rent and common charges without VAT, from the lease; the asking rent when vacant. */
  monthlyRent: string
  commonCharges: string
  /** The application's words for the unit's situation. */
  situation?: string
  notes?: RackNote[]
  request?: string
}

const u = (
  id: string,
  kind: string,
  type: string,
  area: string,
  state: UnitState,
  monthlyRent: string,
  commonCharges: string,
  extra: Partial<Unit> = {},
): Unit => ({
  id,
  building: id.slice(0, 2) as Building['id'],
  floor: id.charAt(3) === 'P' ? 0 : Number(id.charAt(3)),
  kind,
  type,
  area,
  state,
  monthlyRent,
  commonCharges,
  ...extra,
})

export const UNITS: Unit[] = [
  // Liman 2
  u('L2-P.1', 'Shop', 'Shop', '64.50', 'let', '145000.00', '6000.00', {
    tenant: 'apoteka',
    lease: 'UZ-2024-006',
    rent: 'paid',
  }),
  u('L2-P.2', 'Office', 'Office', '48.00', 'vacant', '98000.00', '4500.00', {
    situation: 'Vacant since 01.09.2026. Asking rent 98.000,00 RSD a month without VAT.',
    notes: [{ label: 'Viewing 16.10.' }],
  }),
  u('L2-1.1', 'Flat', '2.0', '52.30', 'let', '62000.00', '3200.00', {
    tenant: 'jovanovic',
    lease: 'UZ-2025-012',
    rent: 'paid',
  }),
  u('L2-1.2', 'Flat', '1.0', '34.80', 'let', '45000.00', '2400.00', {
    tenant: 'ilic',
    lease: 'UZ-2026-003',
    rent: 'paid',
  }),
  u('L2-1.3', 'Flat', '2.5', '61.20', 'let', '70000.00', '3600.00', {
    tenant: 'kovac',
    lease: 'UZ-2025-019',
    rent: 'overdue',
  }),
  u('L2-2.1', 'Flat', '2.0', '52.30', 'repair', '63000.00', '3200.00', {
    situation: 'Renovation between tenants until 31.10.2026 (MR-2026-0041).',
    notes: [{ label: 'Until 31.10.2026' }],
    request: 'MR-2026-0041',
  }),
  u('L2-2.2', 'Flat', '1.0', '34.80', 'let', '45000.00', '2400.00', {
    tenant: 'stevic',
    lease: 'UZ-2025-024',
    rent: 'paid',
  }),
  u('L2-2.3', 'Flat', '2.5', '61.20', 'let', '72000.00', '3600.00', {
    tenant: 'milic',
    lease: 'UZ-2026-020',
    rent: 'paid',
  }),
  u('L2-3.1', 'Flat', '2.0', '52.30', 'let', '63000.00', '3200.00', {
    tenant: 'maric',
    lease: 'UZ-2026-008',
    rent: 'paid',
  }),
  u('L2-3.2', 'Flat', '2.0', '54.10', 'let', '64000.00', '3200.00', {
    tenant: 'radovic',
    lease: 'UZ-2024-041',
    rent: 'paid',
    notes: [{ label: 'Lease ends 31.12.2026', tone: 'warning' }],
    request: 'MR-2026-0047',
  }),
  u('L2-3.3', 'Flat', '2.5', '61.20', 'let', '71000.00', '3600.00', {
    tenant: 'pavlovic',
    lease: 'UZ-2025-030',
    rent: 'paid',
  }),
  u('L2-4.1', 'Flat', '3.0', '74.60', 'let', '88000.00', '4200.00', {
    tenant: 'djordjevic',
    lease: 'UZ-2025-006',
    rent: 'overdue',
  }),
  u('L2-4.2', 'Flat', '1.5', '41.90', 'vacant', '55000.00', '2800.00', {
    situation: 'Vacant since 01.10.2026. Let from 01.11.2026: lease UZ-2026-019 is signed.',
    notes: [{ label: 'Let from 01.11.2026' }],
    lease: 'UZ-2026-019',
    tenant: 'milosavljevic',
  }),
  u('L2-4.3', 'Flat', '3.0', '74.60', 'let', '90000.00', '4200.00', {
    tenant: 'kvadrat',
    lease: 'UZ-2025-015',
    rent: 'paid',
  }),
  // Grbavica 7
  u('G7-P.1', 'Shop', 'Shop', '82.00', 'let', '168000.00', '7000.00', {
    tenant: 'pekara',
    lease: 'UZ-2023-011',
    rent: 'paid',
  }),
  u('G7-1.1', 'Flat', '2.0', '55.40', 'let', '66000.00', '3300.00', {
    tenant: 'nikolic',
    lease: 'UZ-2024-018',
    rent: 'paid',
  }),
  u('G7-1.2', 'Flat', '1.5', '43.10', 'let', '52000.00', '2600.00', {
    tenant: 'ristic',
    lease: 'UZ-2025-027',
    rent: 'paid',
  }),
  u('G7-1.3', 'Flat', '2.5', '63.80', 'let', '76000.00', '3800.00', {
    tenant: 'lazarevic',
    lease: 'UZ-2024-009',
    rent: 'paid',
    notes: [{ label: 'Notice given, leaves 30.11.2026', tone: 'warning' }],
  }),
  u('G7-2.1', 'Flat', '2.0', '55.40', 'let', '66000.00', '3300.00', {
    tenant: 'simic',
    lease: 'UZ-2023-020',
    rent: 'paid',
    request: 'MR-2026-0045',
  }),
  u('G7-2.2', 'Flat', '1.5', '43.10', 'repair', '52000.00', '2600.00', {
    situation:
      'Water damage after a leak from the flat above; repair until 15.11.2026 (MR-2026-0042).',
    notes: [{ label: 'Until 15.11.2026' }],
    request: 'MR-2026-0042',
  }),
  u('G7-2.3', 'Flat', '2.5', '63.80', 'let', '76000.00', '3800.00', {
    tenant: 'vasic',
    lease: 'UZ-2025-002',
    rent: 'paid',
  }),
  u('G7-3.1', 'Flat', '2.0', '55.40', 'let', '67000.00', '3300.00', {
    tenant: 'tomic',
    lease: 'UZ-2024-025',
    rent: 'paid',
  }),
  u('G7-3.2', 'Flat', '1.5', '43.10', 'let', '53000.00', '2600.00', {
    tenant: 'babic',
    lease: 'UZ-2025-033',
    rent: 'overdue',
  }),
  u('G7-3.3', 'Flat', '2.5', '63.80', 'let', '77000.00', '3800.00', {
    tenant: 'stankovic',
    lease: 'UZ-2026-011',
    rent: 'paid',
    request: 'MR-2026-0048',
  }),
]

export const FLOOR_NAMES = ['Ground floor', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4']

/** The application's line beside each floor of the rack. */
const FLOOR_LINES: Record<string, string> = {
  'L2-0': '2 units · 1 vacant',
  'L2-1': '3 flats · 1 rent overdue',
  'L2-2': '3 flats · 1 under repair',
  'L2-3': '3 flats · all let',
  'L2-4': '3 flats · 1 vacant',
  'G7-0': '1 unit · let',
  'G7-1': '3 flats · all let',
  'G7-2': '3 flats · 1 under repair',
  'G7-3': '3 flats · 1 rent overdue',
}

/** A record the dataset must have (a typo fails the examples at once). */
export function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`data-BQ: ${what} is missing`)
  return value
}

export function findUnit(id: string): Unit | undefined {
  return UNITS.find((unit) => unit.id === id)
}

export function buildingOf(unit: Unit): Building {
  return must(
    BUILDINGS.find((building) => building.id === unit.building),
    unit.building,
  )
}

/** "Liman 2 · Floor 3": where a unit is, in words. */
export function unitPlace(unit: Unit): string {
  return `${buildingOf(unit).short} · ${FLOOR_NAMES[unit.floor] ?? ''}`
}

/** The rack's floors of one building or of both, as the application gives them. */
export function rackFloors(building: Building['id'] | 'all'): RackFloor[] {
  return BUILDINGS.filter((each) => building === 'all' || each.id === building).flatMap((each) =>
    [0, 1, 2, 3, 4]
      .map((floor) => ({
        id: `${each.id}-${String(floor)}`,
        label: `${each.short} · ${FLOOR_NAMES[floor] ?? ''}`,
        description: FLOOR_LINES[`${each.id}-${String(floor)}`] ?? '',
        rooms: UNITS.filter((unit) => unit.building === each.id && unit.floor === floor).map(
          (unit) => {
            const tenant = unit.state === 'let' ? findTenant(unit.tenant ?? '') : undefined
            const lease = unit.state === 'let' ? findLease(unit.lease ?? '') : undefined
            return {
              id: unit.id,
              number: unit.id,
              type: unit.type,
              occupancy: unit.state,
              ...(unit.rent === undefined ? {} : { housekeeping: unit.rent }),
              ...(tenant === undefined ? {} : { guest: tenant.name }),
              ...(lease === undefined ? {} : { arrival: lease.start, departure: lease.end }),
              ...(unit.notes === undefined ? {} : { notes: unit.notes }),
            }
          },
        ),
      }))
      .filter((floor) => floor.rooms.length > 0),
  )
}

/** The rack's figures, the application's. */
export const UNIT_FIGURES = {
  units: '24',
  let: '20',
  vacant: '2',
  repair: '2',
  /** Rent and common charges of the let units this month, without VAT. */
  monthly: '1589100.00',
  overdue: '221400.00',
}

// ── Tenants ───────────────────────────────────────────────────────────────────────────────────

export type TenantState = 'Active' | 'Rent overdue' | 'Notice given' | 'Lease ending' | 'Starts'

export const TENANT_TONES: Record<TenantState, Tone> = {
  Active: 'success',
  'Rent overdue': 'danger',
  'Notice given': 'warning',
  'Lease ending': 'warning',
  Starts: 'neutral',
}

export interface PropertyTenant {
  id: string
  name: string
  kind: 'Private person' | 'Company'
  state: TenantState
  unit: string
  phone: string
  email: string | null
  /** A company's PIB. */
  taxId?: string
  /** A person's national ID (JMBG), shown masked. */
  nationalId?: string
  since: string
  /** What the tenant owes now, the application's figure. */
  overdue: string
  /** The application's words for the balance. */
  balance: string
  portal: string
}

const t = (
  id: string,
  name: string,
  unit: string,
  since: string,
  extra: Partial<PropertyTenant> = {},
): PropertyTenant => ({
  id,
  name,
  kind: 'Private person',
  state: 'Active',
  unit,
  phone: '+381 6x xxx xxxx',
  email: `${id}@example.com`,
  since,
  overdue: '0.00',
  balance: 'Nothing overdue',
  portal: 'Uses the tenants’ portal',
  ...extra,
})

export const TENANTS: PropertyTenant[] = [
  t('apoteka', 'Apoteka Liman d.o.o.', 'L2-P.1', '2024-03-01', {
    kind: 'Company',
    taxId: '110236985',
    phone: '+381 21 555 0161',
    email: 'office@apoteka-liman.example.com',
  }),
  t('jovanovic', 'Marko Jovanović', 'L2-1.1', '2025-02-01', { phone: '+381 63 555 0111' }),
  t('ilic', 'Teodora Ilić', 'L2-1.2', '2026-03-01', { phone: '+381 64 555 0112' }),
  t('kovac', 'Nemanja Kovač', 'L2-1.3', '2025-06-01', {
    state: 'Rent overdue',
    phone: '+381 65 555 0113',
    overdue: '73600.00',
    balance: 'October’s rent overdue since 05.10.2026',
  }),
  t('stevic', 'Luka Stević', 'L2-2.2', '2025-09-01', {
    phone: '+381 60 555 0122',
    email: null,
    portal: 'Not invited: no e-mail address',
  }),
  t('milic', 'Bojana Milić', 'L2-2.3', '2024-10-01', { phone: '+381 64 555 0123' }),
  t('maric', 'Stefan Marić', 'L2-3.1', '2026-04-01', { phone: '+381 62 555 0131' }),
  t('radovic', 'Ivana Radović', 'L2-3.2', '2025-01-01', {
    state: 'Lease ending',
    phone: '+381 64 555 0142',
    email: 'ivana.radovic@example.com',
    nationalId: '2304990805012',
    portal: 'Uses the tenants’ portal; last signed in 13.10.2026 at 19:08',
  }),
  t('pavlovic', 'Dušan Pavlović', 'L2-3.3', '2025-11-01', { phone: '+381 63 555 0133' }),
  t('djordjevic', 'Milan Đorđević', 'L2-4.1', '2025-04-01', {
    state: 'Rent overdue',
    phone: '+381 64 555 0141',
    overdue: '92200.00',
    balance: 'October’s rent overdue since 05.10.2026',
  }),
  t('milosavljevic', 'Đorđe Milosavljević', 'L2-4.2', '2026-11-01', {
    state: 'Starts',
    phone: '+381 65 555 0142',
    balance: 'Deposit of 110.000,00 RSD paid on 10.10.2026',
    portal: 'Invited on 10.10.2026',
  }),
  t('kvadrat', 'Kvadrat Gradnja d.o.o.', 'L2-4.3', '2025-05-01', {
    kind: 'Company',
    taxId: '108452317',
    phone: '+381 21 555 0143',
    email: 'office@kvadratgradnja.example.com',
    portal: 'Flat for the site engineers; invoices by e-invoice',
  }),
  t('pekara', 'Pekara Zlatni klas', 'G7-P.1', '2023-11-01', {
    kind: 'Company',
    taxId: '112374905',
    phone: '+381 21 555 0171',
    email: 'office@zlatniklas.example.com',
  }),
  t('nikolic', 'Jovana Nikolić', 'G7-1.1', '2024-06-01', { phone: '+381 64 555 0211' }),
  t('ristic', 'Aleksa Ristić', 'G7-1.2', '2025-08-01', { phone: '+381 63 555 0212' }),
  t('lazarevic', 'Mina Lazarević', 'G7-1.3', '2024-03-01', {
    state: 'Notice given',
    phone: '+381 64 555 0213',
    balance: 'Nothing overdue; deposit settled after the handover on 30.11.2026',
  }),
  t('simic', 'Petar Simić', 'G7-2.1', '2023-12-01', { phone: '+381 65 555 0221' }),
  t('vasic', 'Nina Vasić', 'G7-2.3', '2025-01-15', { phone: '+381 64 555 0223' }),
  t('tomic', 'Uroš Tomić', 'G7-3.1', '2024-09-01', {
    phone: '+381 60 555 0231',
    email: null,
    portal: 'Not invited: no e-mail address',
  }),
  t('babic', 'Kristina Babić', 'G7-3.2', '2025-10-01', {
    state: 'Rent overdue',
    phone: '+381 63 555 0232',
    overdue: '55600.00',
    balance: 'October’s rent overdue since 05.10.2026',
  }),
  t('stankovic', 'Vladimir Stanković', 'G7-3.3', '2026-02-01', { phone: '+381 64 555 0233' }),
]

export function findTenant(id: string): PropertyTenant | undefined {
  return TENANTS.find((tenant) => tenant.id === id)
}

export type TenantView = 'current' | 'overdue' | 'ending'

export const TENANT_VIEWS: { id: TenantView; label: string }[] = [
  { id: 'current', label: 'Current' },
  { id: 'overdue', label: 'Rent overdue' },
  { id: 'ending', label: 'Leaving or ending' },
]

export function inTenantView(tenant: PropertyTenant, view: TenantView): boolean {
  if (view === 'overdue') return tenant.state === 'Rent overdue'
  if (view === 'ending') return tenant.state === 'Notice given' || tenant.state === 'Lease ending'
  return true
}

export const REVEAL_REASONS = [
  { value: 'contract', label: 'Preparing a lease or an annex' },
  { value: 'court', label: 'Collecting overdue rent' },
  { value: 'authority', label: 'A request from an authority' },
]

// ── Leases ────────────────────────────────────────────────────────────────────────────────────

export type LeaseState = 'Active' | 'Ending' | 'Notice given' | 'Signed' | 'Ended'

export const LEASE_TONES: Record<LeaseState, Tone> = {
  Active: 'success',
  Ending: 'warning',
  'Notice given': 'warning',
  Signed: 'neutral',
  Ended: 'neutral',
}

export interface Lease {
  number: string
  unit: string
  tenant: string
  /** The tenant's name, also for ended leases whose tenant has left. */
  tenantName: string
  start: string
  end: string
  state: LeaseState
  monthlyRent: string
  commonCharges: string
  deposit: string
  /** Residential leases are exempt; shops and offices pay 20% (illustrative). */
  vat: 'exempt' | '20'
}

const l = (
  number: string,
  unit: string,
  tenant: string,
  tenantName: string,
  start: string,
  end: string,
  state: LeaseState,
  deposit: string,
): Lease => {
  const spec = findUnit(unit)
  return {
    number,
    unit,
    tenant,
    tenantName,
    start,
    end,
    state,
    monthlyRent: spec?.monthlyRent ?? '0.00',
    commonCharges: spec?.commonCharges ?? '0.00',
    deposit,
    vat: spec?.kind === 'Flat' ? 'exempt' : '20',
  }
}

export const LEASES: Lease[] = [
  l(
    'UZ-2024-006',
    'L2-P.1',
    'apoteka',
    'Apoteka Liman d.o.o.',
    '2024-03-01',
    '2029-02-28',
    'Active',
    '435000.00',
  ),
  l(
    'UZ-2025-012',
    'L2-1.1',
    'jovanovic',
    'Marko Jovanović',
    '2025-02-01',
    '2027-01-31',
    'Active',
    '124000.00',
  ),
  l(
    'UZ-2026-003',
    'L2-1.2',
    'ilic',
    'Teodora Ilić',
    '2026-03-01',
    '2027-02-28',
    'Active',
    '90000.00',
  ),
  l(
    'UZ-2025-019',
    'L2-1.3',
    'kovac',
    'Nemanja Kovač',
    '2025-06-01',
    '2027-05-31',
    'Active',
    '140000.00',
  ),
  l(
    'UZ-2025-024',
    'L2-2.2',
    'stevic',
    'Luka Stević',
    '2025-09-01',
    '2027-08-31',
    'Active',
    '90000.00',
  ),
  l(
    'UZ-2024-033',
    'L2-2.3',
    'milic',
    'Bojana Milić',
    '2024-10-01',
    '2026-09-30',
    'Ended',
    '144000.00',
  ),
  l(
    'UZ-2026-020',
    'L2-2.3',
    'milic',
    'Bojana Milić',
    '2026-10-01',
    '2028-09-30',
    'Active',
    '144000.00',
  ),
  l(
    'UZ-2026-008',
    'L2-3.1',
    'maric',
    'Stefan Marić',
    '2026-04-01',
    '2027-03-31',
    'Active',
    '126000.00',
  ),
  l(
    'UZ-2024-041',
    'L2-3.2',
    'radovic',
    'Ivana Radović',
    '2025-01-01',
    '2026-12-31',
    'Ending',
    '124000.00',
  ),
  l(
    'UZ-2025-030',
    'L2-3.3',
    'pavlovic',
    'Dušan Pavlović',
    '2025-11-01',
    '2027-10-31',
    'Active',
    '142000.00',
  ),
  l(
    'UZ-2025-006',
    'L2-4.1',
    'djordjevic',
    'Milan Đorđević',
    '2025-04-01',
    '2027-03-31',
    'Active',
    '176000.00',
  ),
  l(
    'UZ-2026-019',
    'L2-4.2',
    'milosavljevic',
    'Đorđe Milosavljević',
    '2026-11-01',
    '2027-10-31',
    'Signed',
    '110000.00',
  ),
  l(
    'UZ-2025-015',
    'L2-4.3',
    'kvadrat',
    'Kvadrat Gradnja d.o.o.',
    '2025-05-01',
    '2027-04-30',
    'Active',
    '180000.00',
  ),
  l(
    'UZ-2023-011',
    'G7-P.1',
    'pekara',
    'Pekara Zlatni klas',
    '2023-11-01',
    '2028-10-31',
    'Active',
    '504000.00',
  ),
  l(
    'UZ-2024-018',
    'G7-1.1',
    'nikolic',
    'Jovana Nikolić',
    '2024-06-01',
    '2027-05-31',
    'Active',
    '132000.00',
  ),
  l(
    'UZ-2025-027',
    'G7-1.2',
    'ristic',
    'Aleksa Ristić',
    '2025-08-01',
    '2027-07-31',
    'Active',
    '104000.00',
  ),
  l(
    'UZ-2024-009',
    'G7-1.3',
    'lazarevic',
    'Mina Lazarević',
    '2024-03-01',
    '2026-11-30',
    'Notice given',
    '152000.00',
  ),
  l(
    'UZ-2023-020',
    'G7-2.1',
    'simic',
    'Petar Simić',
    '2023-12-01',
    '2026-11-30',
    'Active',
    '132000.00',
  ),
  l(
    'UZ-2025-002',
    'G7-2.3',
    'vasic',
    'Nina Vasić',
    '2025-01-15',
    '2027-01-14',
    'Active',
    '152000.00',
  ),
  l(
    'UZ-2024-025',
    'G7-3.1',
    'tomic',
    'Uroš Tomić',
    '2024-09-01',
    '2027-08-31',
    'Active',
    '134000.00',
  ),
  l(
    'UZ-2025-033',
    'G7-3.2',
    'babic',
    'Kristina Babić',
    '2025-10-01',
    '2027-09-30',
    'Active',
    '106000.00',
  ),
  l(
    'UZ-2026-011',
    'G7-3.3',
    'stankovic',
    'Vladimir Stanković',
    '2026-02-01',
    '2028-01-31',
    'Active',
    '154000.00',
  ),
  l(
    'UZ-2024-012',
    'L2-2.1',
    'former-1',
    'Zoran Lukić',
    '2024-09-01',
    '2026-08-31',
    'Ended',
    '120000.00',
  ),
  l(
    'UZ-2023-004',
    'L2-P.2',
    'former-2',
    'Studio Dizajn d.o.o.',
    '2023-09-01',
    '2026-08-31',
    'Ended',
    '270000.00',
  ),
  l(
    'UZ-2024-022',
    'L2-4.2',
    'former-3',
    'Ana Bogdanović',
    '2024-10-01',
    '2026-09-30',
    'Ended',
    '106000.00',
  ),
  l(
    'UZ-2023-017',
    'G7-2.2',
    'former-4',
    'Filip Jakovljević',
    '2023-10-01',
    '2026-09-30',
    'Ended',
    '100000.00',
  ),
]

export function findLease(number: string): Lease | undefined {
  return LEASES.find((lease) => lease.number === number)
}

export type LeaseView = 'active' | 'ending' | 'ended' | 'all'

export const LEASE_VIEWS: { id: LeaseView; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'ending', label: 'Ending within 90 days' },
  { id: 'ended', label: 'Ended' },
  { id: 'all', label: 'All' },
]

/** Which view a lease belongs to: the application's grouping (ending = within 90 days). */
const ENDING_SOON = new Set(['UZ-2024-041', 'UZ-2024-009', 'UZ-2023-020'])

export function inLeaseView(lease: Lease, view: LeaseView): boolean {
  if (view === 'all') return true
  if (view === 'ended') return lease.state === 'Ended'
  if (view === 'ending') return ENDING_SOON.has(lease.number)
  return lease.state !== 'Ended'
}

/** The application's words beside a lease's end in the list. */
export const LEASE_END_NOTES: Record<string, string> = {
  'UZ-2024-041': 'In 78 days · renewal offered',
  'UZ-2024-009': 'In 47 days · notice given',
  'UZ-2023-020': 'In 47 days · renews by itself for a year',
  'UZ-2026-019': 'Starts 01.11.2026',
}

/** The featured lease's facts beyond the list, the application's words. */
export const FEATURED_LEASE_FACTS = {
  signed: '2024-12-15',
  term: '2 years',
  notice: '60 days, in writing',
  renewal: 'By an annex, agreed by both sides',
  dueDay: 'By the 5th of the month, for the month ahead',
  indexation: 'Every 1 January, by consumer prices (illustrative)',
  depositState: 'Held since 20.12.2024',
  depositAccount: 'Deposits, 160-0000000123477-02 (illustrative)',
  /** The application's reminders. */
  ending: 'The lease ends on 31.12.2026, in 78 days.',
  offer:
    'Renewal offered on 01.10.2026: two more years from 01.01.2027 at 66.500,00 RSD a month (indexed by 3,9%, illustrative). Ivana Radović has not answered yet.',
  noticeBy: 'To end the lease, notice must be given by 01.11.2026 (60 days).',
  renewalRent: '66500.00',
  renewalEnd: '2028-12-31',
  annex: 'Annex 2',
}

export const LEASE_FILES = [
  { id: 'lease', name: 'Lease agreement UZ-2024-041.pdf', sizeText: '412 KB' },
  { id: 'handover', name: 'Handover record L2-3.2, 01.01.2025.pdf', sizeText: '1,8 MB' },
  { id: 'annex-1', name: 'Annex 1, rent from 01.01.2026.pdf', sizeText: '96 KB' },
  { id: 'offer', name: 'Renewal offer, 01.10.2026.pdf', sizeText: '88 KB' },
]

/** The lease as the application's viewer shows it (a stand-in viewer, invented text). */
export const LEASE_VIEWER = viewer({
  title: 'Lease agreement UZ-2024-041',
  lang: 'en',
  pages: [
    `<h1>Lease agreement No. UZ-2024-041 (illustrative)</h1>
     <p>Made in Novi Sad on 15.12.2024 between the landlord Kvadrat Nekretnine d.o.o., Novi Sad, PIB 111985302, represented by its director Ana Marić, and the tenant Ivana Radović.</p>
     <h2>Article 1. The flat</h2>
     <p>The landlord lets the two-room flat L2-3.2 of 54,10 m² on the third floor of Residential building Liman 2, Bulevar cara Lazara 2, Novi Sad, with its kitchen appliances listed in the handover record.</p>
     <h2>Article 2. Term</h2>
     <p>The lease runs from 01.01.2025 to 31.12.2026. Either side may end it with 60 days’ notice in writing.</p>`,
    `<h2>Article 3. Rent and charges</h2>
     <p>The rent is 62.000,00 RSD a month, with common charges of 3.200,00 RSD, paid by the 5th of each month for the month ahead. The rent is indexed every 1 January by consumer prices.</p>
     <h2>Article 4. Deposit</h2>
     <p>The tenant pays a deposit of 124.000,00 RSD, returned within 15 days of the handover, less any damage recorded in the handover record.</p>`,
    `<h2>Article 5. Repairs</h2>
     <p>The tenant reports defects through the tenants’ portal; the landlord repairs what is not caused by the tenant.</p>
     <p>Landlord: Ana Marić, director</p>
     <p>Tenant: Ivana Radović</p>`,
  ],
})

// ── Rent invoices ─────────────────────────────────────────────────────────────────────────────

export type InvoiceState = 'Paid' | 'Overdue' | 'Issued'

export const INVOICE_TONES: Record<InvoiceState, Tone> = {
  Paid: 'success',
  Overdue: 'danger',
  Issued: 'neutral',
}

export interface RentInvoice {
  number: string
  month: string
  issued: string
  due: string
  total: string
  state: InvoiceState
  paid?: string
}

/** The featured tenant's invoices (Ivana Radović), newest first. */
export const RADOVIC_INVOICES: RentInvoice[] = [
  {
    number: 'RZ-2026-0268',
    month: '2026-10',
    issued: '2026-09-25',
    due: '2026-10-05',
    total: '67200.00',
    state: 'Paid',
    paid: '2026-10-03',
  },
  {
    number: 'RZ-2026-0248',
    month: '2026-09',
    issued: '2026-08-25',
    due: '2026-09-05',
    total: '67200.00',
    state: 'Paid',
    paid: '2026-09-04',
  },
  {
    number: 'RZ-2026-0228',
    month: '2026-08',
    issued: '2026-07-25',
    due: '2026-08-05',
    total: '67200.00',
    state: 'Paid',
    paid: '2026-08-05',
  },
  {
    number: 'RZ-2026-0208',
    month: '2026-07',
    issued: '2026-06-25',
    due: '2026-07-05',
    total: '67200.00',
    state: 'Paid',
    paid: '2026-07-02',
  },
]

/** An overdue tenant's October invoice, for their record. */
export const OVERDUE_INVOICES: Record<string, RentInvoice[]> = {
  kovac: [
    {
      number: 'RZ-2026-0264',
      month: '2026-10',
      issued: '2026-09-25',
      due: '2026-10-05',
      total: '73600.00',
      state: 'Overdue',
    },
  ],
  djordjevic: [
    {
      number: 'RZ-2026-0270',
      month: '2026-10',
      issued: '2026-09-25',
      due: '2026-10-05',
      total: '92200.00',
      state: 'Overdue',
    },
  ],
  babic: [
    {
      number: 'RZ-2026-0279',
      month: '2026-10',
      issued: '2026-09-25',
      due: '2026-10-05',
      total: '55600.00',
      state: 'Overdue',
    },
  ],
}

export const RUN_PERIOD = 'November 2026'

export const RUN_STEPS = [
  { key: 'prepare', label: 'Prepare', description: 'Leases, starts and endings' },
  { key: 'calculate', label: 'Calculate' },
  { key: 'review', label: 'Review' },
  { key: 'issue', label: 'Issue' },
  { key: 'send', label: 'Send' },
] as const

/** One invoice of the run: the application's figures. */
export interface RunInvoice {
  unit: string
  tenant: string
  lease: string
  rent: string
  common: string
  /** VAT 20% on shops and offices; null where residential rent is exempt. */
  vat: string | null
  total: string
  delivery: 'E-mail' | 'Post' | 'E-invoice'
  /** The number given on Issue. */
  number: string
}

const r = (
  unit: string,
  vat: string | null,
  total: string,
  delivery: RunInvoice['delivery'],
  number: string,
): RunInvoice => {
  const spec = findUnit(unit)
  return {
    unit,
    tenant: spec?.tenant ?? '',
    lease: spec?.lease ?? '',
    rent: spec?.monthlyRent ?? '0.00',
    common: spec?.commonCharges ?? '0.00',
    vat,
    total,
    delivery,
    number,
  }
}

export const RUN_INVOICES: RunInvoice[] = [
  r('L2-P.1', '30200.00', '181200.00', 'E-invoice', 'RZ-2026-0281'),
  r('L2-1.1', null, '65200.00', 'E-mail', 'RZ-2026-0282'),
  r('L2-1.2', null, '47400.00', 'E-mail', 'RZ-2026-0283'),
  r('L2-1.3', null, '73600.00', 'E-mail', 'RZ-2026-0284'),
  r('L2-2.2', null, '47400.00', 'Post', 'RZ-2026-0285'),
  r('L2-2.3', null, '75600.00', 'E-mail', 'RZ-2026-0286'),
  r('L2-3.1', null, '66200.00', 'E-mail', 'RZ-2026-0287'),
  r('L2-3.2', null, '67200.00', 'E-mail', 'RZ-2026-0288'),
  r('L2-3.3', null, '74600.00', 'E-mail', 'RZ-2026-0289'),
  r('L2-4.1', null, '92200.00', 'E-mail', 'RZ-2026-0290'),
  r('L2-4.2', null, '57800.00', 'E-mail', 'RZ-2026-0291'),
  r('L2-4.3', null, '94200.00', 'E-invoice', 'RZ-2026-0292'),
  r('G7-P.1', '35000.00', '210000.00', 'E-invoice', 'RZ-2026-0293'),
  r('G7-1.1', null, '69300.00', 'E-mail', 'RZ-2026-0294'),
  r('G7-1.2', null, '54600.00', 'E-mail', 'RZ-2026-0295'),
  r('G7-1.3', null, '79800.00', 'E-mail', 'RZ-2026-0296'),
  r('G7-2.1', null, '69300.00', 'E-mail', 'RZ-2026-0297'),
  r('G7-2.3', null, '79800.00', 'E-mail', 'RZ-2026-0298'),
  r('G7-3.1', null, '70300.00', 'Post', 'RZ-2026-0299'),
  r('G7-3.2', null, '55600.00', 'E-mail', 'RZ-2026-0300'),
  r('G7-3.3', null, '80800.00', 'E-mail', 'RZ-2026-0301'),
]

export const RUN_TOTALS = {
  invoices: '21',
  leases: '21',
  rent: '1571000.00',
  common: '75900.00',
  vat: '65200.00',
  total: '1712100.00',
  issueDate: '2026-10-25',
  dueDate: '2026-11-05',
  first: 'RZ-2026-0281',
  last: 'RZ-2026-0301',
}

export const RERUN_REASONS = [
  { value: 'lease', label: 'A lease was signed or changed' },
  { value: 'charges', label: 'The common charges changed' },
  { value: 'indexation', label: 'An indexation was corrected' },
]

// ── Maintenance requests ──────────────────────────────────────────────────────────────────────

export type RequestState = 'New' | 'Assigned' | 'In progress' | 'Waiting for parts' | 'Done'

export const REQUEST_TONES: Record<RequestState, Tone> = {
  New: 'warning',
  Assigned: 'neutral',
  'In progress': 'info',
  'Waiting for parts': 'neutral',
  Done: 'success',
}

export const REQUEST_STEPS = ['Reported', 'Assigned', 'In progress', 'Done'] as const

export interface Handler {
  value: string
  label: string
}

export const HANDLERS: Handler[] = [
  { value: 'petkovic', label: 'Saša Petković, service team of Kvadrat Gradnja d.o.o.' },
  { value: 'finishes', label: 'Finishes crew of Kvadrat Gradnja d.o.o.' },
  { value: 'elektro', label: 'Elektro Sistem d.o.o.' },
  { value: 'lift', label: 'Lift Servis NS d.o.o. (illustrative)' },
]

export interface MaintenanceRequest {
  number: string
  what: string
  category: string
  /** A unit's id, or a common area in words. */
  unit?: string
  area?: string
  building: Building['id']
  /** The room inside the flat, in the tenant's words. */
  room?: string
  description: string
  reportedBy: string
  reportedAt: string
  /** Through the portal, by phone, by the manager. */
  channel: string
  state: RequestState
  handler?: string
  workOrder?: string
  /** The application's next step in words. */
  next?: string
  access?: string
  photos: { id: string; name: string; sizeText: string }[]
  /** When each step was reached (REQUEST_STEPS), the application's. */
  times: (string | undefined)[]
  done?: string
}

export const REQUESTS: MaintenanceRequest[] = [
  {
    number: 'MR-2026-0048',
    what: 'Mould on the bathroom ceiling',
    category: 'Damp and mould',
    unit: 'G7-3.3',
    building: 'G7',
    room: 'Bathroom',
    description:
      'A grey patch of mould has grown over the shower in the last two weeks. The fan runs, but the ceiling stays wet.',
    reportedBy: 'Vladimir Stanković',
    reportedAt: '2026-10-14T08:52:00+02:00',
    channel: 'Tenants’ portal',
    state: 'New',
    access: 'Call me first',
    photos: [{ id: 'p1', name: 'Bathroom ceiling.jpg', sizeText: '2,4 MB' }],
    times: ['2026-10-14T08:52:00+02:00'],
  },
  {
    number: 'MR-2026-0047',
    what: 'Water leaking under the kitchen sink',
    category: 'Plumbing',
    unit: 'L2-3.2',
    building: 'L2',
    room: 'Kitchen',
    description:
      'Water drips from the pipe under the sink when the tap runs. I put a bowl under it and closed the valve under the sink.',
    reportedBy: 'Ivana Radović',
    reportedAt: '2026-10-13T19:12:00+02:00',
    channel: 'Tenants’ portal',
    state: 'Assigned',
    handler: 'petkovic',
    workOrder: 'SN-2026-0087',
    next: 'Saša Petković comes on 15.10.2026 between 10:00 and 12:00.',
    access: 'You may enter when I am not at home',
    photos: [
      { id: 'p1', name: 'Under the sink.jpg', sizeText: '3,1 MB' },
      { id: 'p2', name: 'The pipe joint.jpg', sizeText: '2,7 MB' },
    ],
    times: ['2026-10-13T19:12:00+02:00', '2026-10-14T08:05:00+02:00'],
  },
  {
    number: 'MR-2026-0046',
    what: 'The intercom does not open the entrance door',
    category: 'Electrical',
    area: 'Entrance',
    building: 'G7',
    description: 'Pressing the key on the handset does nothing; the door must be opened by hand.',
    reportedBy: 'Nina Vasić',
    reportedAt: '2026-10-10T17:40:00+02:00',
    channel: 'Tenants’ portal',
    state: 'In progress',
    handler: 'elektro',
    next: 'Elektro Sistem d.o.o. replaces the door’s lock on 16.10.2026.',
    photos: [],
    times: ['2026-10-10T17:40:00+02:00', '2026-10-11T09:10:00+02:00', '2026-10-13T11:30:00+02:00'],
  },
  {
    number: 'MR-2026-0045',
    what: 'The balcony door does not close',
    category: 'Doors and windows',
    unit: 'G7-2.1',
    building: 'G7',
    room: 'Living room',
    description: 'The balcony door drops on its hinges and does not lock.',
    reportedBy: 'Petar Simić',
    reportedAt: '2026-10-06T09:15:00+02:00',
    channel: 'By phone',
    state: 'Waiting for parts',
    handler: 'petkovic',
    workOrder: 'SN-2026-0081',
    next: 'A new hinge is ordered; expected on 20.10.2026.',
    access: 'Call me first',
    photos: [{ id: 'p1', name: 'Balcony door.jpg', sizeText: '2,2 MB' }],
    times: ['2026-10-06T09:15:00+02:00', '2026-10-06T10:02:00+02:00', '2026-10-07T13:20:00+02:00'],
  },
  {
    number: 'MR-2026-0044',
    what: 'The bedroom radiator stays cold',
    category: 'Heating',
    unit: 'L2-1.3',
    building: 'L2',
    room: 'Bedroom',
    description: 'The radiator in the bedroom stays cold since the heating started.',
    reportedBy: 'Nemanja Kovač',
    reportedAt: '2026-10-02T07:48:00+02:00',
    channel: 'Tenants’ portal',
    state: 'Done',
    handler: 'petkovic',
    workOrder: 'SN-2026-0079',
    photos: [],
    times: [
      '2026-10-02T07:48:00+02:00',
      '2026-10-02T08:30:00+02:00',
      '2026-10-03T09:00:00+02:00',
      '2026-10-03T10:15:00+02:00',
    ],
    done: 'The radiator was bled; it heats again.',
  },
  {
    number: 'MR-2026-0043',
    what: 'The lift stopped between floors 2 and 3',
    category: 'Lift',
    area: 'Lift',
    building: 'L2',
    description: 'The lift stopped with nobody inside; it does not answer the call buttons.',
    reportedBy: 'Bojana Milić',
    reportedAt: '2026-09-28T18:05:00+02:00',
    channel: 'By phone',
    state: 'Done',
    handler: 'lift',
    photos: [],
    times: [
      '2026-09-28T18:05:00+02:00',
      '2026-09-28T18:12:00+02:00',
      '2026-09-28T19:30:00+02:00',
      '2026-09-28T20:10:00+02:00',
    ],
    done: 'A door contact was replaced; the lift was inspected and runs.',
  },
  {
    number: 'MR-2026-0042',
    what: 'Water damage on the floor and walls',
    category: 'Repair of a unit',
    unit: 'G7-2.2',
    building: 'G7',
    description:
      'After the leak from G7-3.2 on 21.09.2026, the parquet and the plaster are replaced.',
    reportedBy: 'Vesna Tomić',
    reportedAt: '2026-09-22T08:30:00+02:00',
    channel: 'By the manager',
    state: 'In progress',
    handler: 'finishes',
    workOrder: 'SN-2026-0074',
    next: 'Works until 15.11.2026; the flat is let again after them.',
    photos: [
      { id: 'p1', name: 'Living room floor.jpg', sizeText: '3,4 MB' },
      { id: 'p2', name: 'Bedroom wall.jpg', sizeText: '2,9 MB' },
    ],
    times: ['2026-09-22T08:30:00+02:00', '2026-09-22T09:00:00+02:00', '2026-09-29T07:00:00+02:00'],
  },
  {
    number: 'MR-2026-0041',
    what: 'Renovation between tenants',
    category: 'Repair of a unit',
    unit: 'L2-2.1',
    building: 'L2',
    description: 'Painting, new kitchen worktop and bathroom silicone before the next tenant.',
    reportedBy: 'Vesna Tomić',
    reportedAt: '2026-09-01T08:00:00+02:00',
    channel: 'By the manager',
    state: 'In progress',
    handler: 'finishes',
    workOrder: 'SN-2026-0070',
    next: 'Works until 31.10.2026.',
    photos: [],
    times: ['2026-09-01T08:00:00+02:00', '2026-09-01T08:20:00+02:00', '2026-09-07T07:00:00+02:00'],
  },
  {
    number: 'MR-2026-0012',
    what: 'The bathroom tap drips',
    category: 'Plumbing',
    unit: 'L2-3.2',
    building: 'L2',
    room: 'Bathroom',
    description: 'The basin tap drips even when it is closed.',
    reportedBy: 'Ivana Radović',
    reportedAt: '2026-03-09T20:31:00+01:00',
    channel: 'Tenants’ portal',
    state: 'Done',
    handler: 'petkovic',
    workOrder: 'SN-2026-0019',
    access: 'Call me first',
    photos: [],
    times: [
      '2026-03-09T20:31:00+01:00',
      '2026-03-10T08:10:00+01:00',
      '2026-03-11T09:30:00+01:00',
      '2026-03-11T10:05:00+01:00',
    ],
    done: 'The tap’s cartridge was replaced.',
  },
]

export function findRequest(number: string): MaintenanceRequest | undefined {
  return REQUESTS.find((request) => request.number === number)
}

export type RequestView = 'open' | 'new' | 'done' | 'all'

export const REQUEST_VIEWS: { id: RequestView; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'new', label: 'New' },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'All' },
]

export function inRequestView(request: MaintenanceRequest, view: RequestView): boolean {
  if (view === 'all') return true
  if (view === 'new') return request.state === 'New'
  if (view === 'done') return request.state === 'Done'
  return request.state !== 'Done'
}

/** What the tenant reports: the application's lists. */
export const REQUEST_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Heating',
  'Doors and windows',
  'Appliances',
  'Damp and mould',
  'Something else',
].map((label) => ({ value: label, label }))

export const ROOMS = [
  'Kitchen',
  'Bathroom',
  'Living room',
  'Bedroom',
  'Hall',
  'Balcony',
  'Outside the flat (stairs, lift, entrance)',
].map((label) => ({ value: label, label }))

export const ACCESS_OPTIONS = [
  { value: 'call', label: 'Call me first' },
  { value: 'enter', label: 'You may enter when I am not at home' },
]
