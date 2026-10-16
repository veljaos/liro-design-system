/*
 * Group AP's example data (P5.47, fixed assets): Kvadrat Gradnja d.o.o.'s register of fixed assets
 * on 14 October 2026 at 09:40, its books kept by Knjigovodstvo Jelić. Fourteen assets — the office
 * floor, machines, vehicles, tools, IT, furniture —, one disposed (July) and one sold (30.09.2026);
 * the September 2026 depreciation run waits for review. Every figure is the application's: the
 * monthly depreciation (straight line, the group's rate), the accumulated depreciation, the book
 * values, the run's totals — decimal strings, never computed by the screens (D4). The depreciation
 * groups, their rates and the accounts are illustrative; every name, number and amount is
 * invented. OS-0047 and OS-0112 are the assets sold on the draft of group D1 (their book values
 * the same). The mini excavator OS-0142 was bought with loan KR-2025-004 (group AS). Not part of
 * the package. No classes here.
 */
import type { Tone } from '@veljaos/ui'

export const AP_TODAY = '2026-10-14'

/** The featured asset: the mini excavator on Site Liman 4. */
export const FEATURED_ASSET = 'OS-0142'
/** The asset sold on 30.09.2026. */
export const SOLD_ASSET = 'OS-0098'

export const AP_ROUTES = {
  register: '/accounting/fixed-assets',
  /** The register's "Disposed and sold" view. */
  disposed: '/accounting/fixed-assets?view=disposed',
  asset: (number: string) => `/accounting/fixed-assets/${number}`,
  featured: `/accounting/fixed-assets/${FEATURED_ASSET}`,
  /** The asset card with "Dispose…" asked. */
  dispose: `/accounting/fixed-assets/${FEATURED_ASSET}?ask=dispose`,
  /** The asset card with "Sell…" asked. */
  sell: `/accounting/fixed-assets/${FEATURED_ASSET}?ask=sell`,
  sold: `/accounting/fixed-assets/${SOLD_ASSET}`,
  run: '/accounting/fixed-assets/depreciation/2026-09',
  /** The run being calculated again after a rerun asked with a reason. */
  runRerun: '/accounting/fixed-assets/depreciation/2026-09?rerun',
} as const

// ── Depreciation groups (illustrative rates) ──────────────────────────────────────────────────

export type GroupId = 'buildings' | 'machinery' | 'vehicles' | 'it' | 'furniture' | 'tools'

export interface DepreciationGroup {
  id: GroupId
  label: string
  /** The yearly rate, straight line, a percentage. */
  rate: string
  /** Useful life in the application's words. */
  life: string
  /** The asset account of the illustrative chart of accounts. */
  account: string
}

export const GROUPS: Record<GroupId, DepreciationGroup> = {
  buildings: {
    id: 'buildings',
    label: 'Buildings',
    rate: '2.5',
    life: '40 years',
    account: '0220',
  },
  machinery: {
    id: 'machinery',
    label: 'Construction machinery',
    rate: '10',
    life: '10 years',
    account: '0230',
  },
  vehicles: { id: 'vehicles', label: 'Vehicles', rate: '12.5', life: '8 years', account: '0231' },
  it: {
    id: 'it',
    label: 'Measuring and IT equipment',
    rate: '20',
    life: '5 years',
    account: '0232',
  },
  furniture: {
    id: 'furniture',
    label: 'Furniture and office equipment',
    rate: '12.5',
    life: '8 years',
    account: '0233',
  },
  tools: {
    id: 'tools',
    label: 'Tools and site equipment',
    rate: '12.5',
    life: '8 years',
    account: '0234',
  },
}

// ── The register ──────────────────────────────────────────────────────────────────────────────

export type AssetState = 'In use' | 'Not yet in use' | 'Fully depreciated' | 'Disposed' | 'Sold'

export const ASSET_TONES: Record<AssetState, Tone> = {
  'In use': 'success',
  'Not yet in use': 'neutral',
  'Fully depreciated': 'neutral',
  Disposed: 'neutral',
  Sold: 'neutral',
}

export interface FixedAsset {
  number: string
  name: string
  group: GroupId
  /** Where it is and the cost centre it is charged to. */
  location: string
  costCentre: string
  responsible: string
  /** The responsible person's role, from the HR records. */
  role: string
  acquired: string
  /** Put into use; null while not yet in use. */
  inUse: string | null
  supplier: string
  /** The supplier's document the asset was acquired with. */
  document: string
  serial?: string
  /** Acquisition value, without VAT. */
  value: string
  /** After the last posted depreciation (August 2026; at the disposal or sale for those). */
  accumulated: string
  book: string
  /** The monthly depreciation at the group's rate (the application's). */
  monthly: string
  /** When it is fully depreciated, in the application's words; null when not depreciated. */
  depreciatedBy: string | null
  state: AssetState
  /** Disposed or sold: when, why or to whom, the document. */
  disposal?: {
    date: string
    text: string
    /** The book value written off or the sale's price and its result, in the application's words. */
    detail: string
    /** The sales invoice, for a sale. */
    invoice?: string
  }
  /** Financed by a loan or a lease (group AS). */
  financing?: string
}

const asset = (fields: FixedAsset): FixedAsset => fields

export const ASSETS: readonly FixedAsset[] = [
  asset({
    number: 'OS-0012',
    name: 'Office floor, Bulevar oslobođenja 102',
    group: 'buildings',
    location: 'Head office, Novi Sad',
    costCentre: '100 Administration',
    responsible: 'Milica Petrović',
    role: 'Head of finance and administration',
    acquired: '2016-05-20',
    inUse: '2016-05-20',
    supplier: 'Gradnja Invest d.o.o.',
    document: 'Sale contract 114/2016',
    value: '48600000.00',
    accumulated: '12453750.00',
    book: '36146250.00',
    monthly: '101250.00',
    depreciatedBy: 'May 2056',
    state: 'In use',
  }),
  asset({
    number: 'OS-0031',
    name: 'Laptop HP ProBook 450',
    group: 'it',
    location: 'Head office, Novi Sad',
    costCentre: '100 Administration',
    responsible: 'Ivana Stojanović',
    role: 'Accountant',
    acquired: '2021-08-10',
    inUse: '2021-08-10',
    supplier: 'Elektro Sistem d.o.o.',
    document: 'Invoice ES-2021-0711',
    serial: '5CD1284QXT',
    value: '96000.00',
    accumulated: '96000.00',
    book: '0.00',
    monthly: '1600.00',
    depreciatedBy: 'August 2026',
    state: 'Fully depreciated',
  }),
  asset({
    number: 'OS-0047',
    name: 'Savijačica armature Sima CEL-32',
    group: 'tools',
    location: 'Central warehouse, Novi Sad',
    costCentre: '400 Machinery pool',
    responsible: 'Zoran Bojović',
    role: 'Warehouse keeper',
    acquired: '2019-06-12',
    inUse: '2019-06-12',
    supplier: 'Građevinska oprema Sima d.o.o.',
    document: 'Invoice GS-2019-0332',
    serial: 'CEL32-19-0457',
    value: '396677.71',
    accumulated: '355357.16',
    book: '41320.55',
    monthly: '4132.06',
    depreciatedBy: 'June 2027',
    state: 'In use',
  }),
  asset({
    number: 'OS-0088',
    name: 'Vibratory plate Wacker DPU 2550',
    group: 'tools',
    location: 'Site Bulevar Evrope 24',
    costCentre: '320 Bulevar Evrope 24',
    responsible: 'Dragan Marković',
    role: 'Site foreman',
    acquired: '2020-06-15',
    inUse: '2020-06-15',
    supplier: 'Građevinska oprema Sima d.o.o.',
    document: 'Invoice GS-2020-0518',
    serial: 'DPU2550-20-1183',
    value: '540000.00',
    accumulated: '410625.00',
    book: '0.00',
    monthly: '5625.00',
    depreciatedBy: null,
    state: 'Disposed',
    disposal: {
      date: '2026-07-14',
      text: 'Damaged beyond repair',
      detail: 'Book value of 129.375,00 RSD written off.',
    },
  }),
  asset({
    number: 'OS-0098',
    name: 'Van Fiat Ducato NS-482-KG',
    group: 'vehicles',
    location: 'Central warehouse, Novi Sad',
    costCentre: '400 Machinery pool',
    responsible: 'Marko Đorđević',
    role: 'Procurement and warehouse manager',
    acquired: '2020-02-18',
    inUse: '2020-02-18',
    supplier: 'Auto Centar Novi Sad d.o.o.',
    document: 'Invoice ACN-2020-0144',
    serial: 'ZFA25000002K81944',
    value: '3250000.00',
    accumulated: '2674479.43',
    book: '0.00',
    monthly: '33854.17',
    depreciatedBy: null,
    state: 'Sold',
    disposal: {
      date: '2026-09-30',
      text: 'Sold to Stanogradnja Plus d.o.o.',
      detail:
        'Sold for 1.150.000,00 RSD without VAT; book value 575.520,57 RSD; gain 574.479,43 RSD.',
      invoice: 'F-2026-0430',
    },
  }),
  asset({
    number: 'OS-0112',
    name: 'Mešalica za beton 350 l',
    group: 'tools',
    location: 'Site Liman 4',
    costCentre: '310 Residential building Liman 4',
    responsible: 'Marko Ilić',
    role: 'Foreman, crew Ilić',
    acquired: '2021-03-15',
    inUse: '2021-03-15',
    supplier: 'Građevinska oprema Sima d.o.o.',
    document: 'Invoice GS-2021-0207',
    value: '90302.25',
    accumulated: '61142.25',
    book: '29160.00',
    monthly: '940.65',
    depreciatedBy: 'March 2029',
    state: 'In use',
  }),
  asset({
    number: 'OS-0118',
    name: 'Tower crane Liebherr 81 K',
    group: 'machinery',
    location: 'Site Liman 4',
    costCentre: '310 Residential building Liman 4',
    responsible: 'Snežana Popović',
    role: 'Site manager',
    acquired: '2022-04-04',
    inUse: '2022-04-11',
    supplier: 'Kranovi Bačka d.o.o.',
    document: 'Invoice KB-2022-0061',
    serial: '81K-2022-30455',
    value: '14200000.00',
    accumulated: '6153333.16',
    book: '8046666.84',
    monthly: '118333.33',
    depreciatedBy: 'April 2032',
    state: 'In use',
  }),
  asset({
    number: 'OS-0127',
    name: 'Scaffolding set, 1.200 m²',
    group: 'tools',
    location: 'Site Liman 4',
    costCentre: '310 Residential building Liman 4',
    responsible: 'Marko Ilić',
    role: 'Foreman, crew Ilić',
    acquired: '2023-06-01',
    inUse: '2023-06-05',
    supplier: 'Skele Sistem d.o.o.',
    document: 'Invoice SS-2023-0412',
    value: '2880000.00',
    accumulated: '1140000.00',
    book: '1740000.00',
    monthly: '30000.00',
    depreciatedBy: 'June 2031',
    state: 'In use',
  }),
  asset({
    number: 'OS-0133',
    name: 'Pickup Toyota Hilux NS-911-LM',
    group: 'vehicles',
    location: 'Site Bulevar Evrope 24',
    costCentre: '320 Bulevar Evrope 24',
    responsible: 'Stefan Nikolić',
    role: 'Site manager',
    acquired: '2024-02-12',
    inUse: '2024-02-12',
    supplier: 'Lizing Plus d.o.o.',
    document: 'Finance lease LZ-2024-012',
    serial: 'AHTKB3CD802981446',
    value: '5160000.00',
    accumulated: '1612500.00',
    book: '3547500.00',
    monthly: '53750.00',
    depreciatedBy: 'February 2032',
    state: 'In use',
    financing: 'LZ-2024-012',
  }),
  asset({
    number: 'OS-0139',
    name: 'Total station Leica TS07',
    group: 'it',
    location: 'Site Liman 4',
    costCentre: '310 Residential building Liman 4',
    responsible: 'Jelena Stojković',
    role: 'Planning engineer',
    acquired: '2024-11-05',
    inUse: '2024-11-05',
    supplier: 'Geo Oprema d.o.o.',
    document: 'Invoice GO-2024-0388',
    serial: 'TS07-1873301',
    value: '1380000.00',
    accumulated: '483000.00',
    book: '897000.00',
    monthly: '23000.00',
    depreciatedBy: 'November 2029',
    state: 'In use',
  }),
  asset({
    number: 'OS-0142',
    name: 'Mini excavator 3.5 t',
    group: 'machinery',
    location: 'Site Liman 4',
    costCentre: '310 Residential building Liman 4',
    responsible: 'Snežana Popović',
    role: 'Site manager',
    acquired: '2025-03-14',
    inUse: '2025-03-17',
    supplier: 'Mehanizacija Bačka d.o.o.',
    document: 'Invoice MB-2025-0219',
    serial: 'MX35-2025-11872',
    value: '6840000.00',
    accumulated: '969000.00',
    book: '5871000.00',
    monthly: '57000.00',
    depreciatedBy: 'March 2035',
    state: 'In use',
    financing: 'KR-2025-004',
  }),
  asset({
    number: 'OS-0146',
    name: 'Generator set 60 kVA',
    group: 'machinery',
    location: 'Site Hall B extension',
    costCentre: '330 Hall B extension',
    responsible: 'Vuk Radić',
    role: 'Site manager',
    acquired: '2025-11-20',
    inUse: '2025-11-24',
    supplier: 'Elektro Sistem d.o.o.',
    document: 'Invoice ES-2025-0874',
    serial: 'GS60-2025-0219',
    value: '1920000.00',
    accumulated: '144000.00',
    book: '1776000.00',
    monthly: '16000.00',
    depreciatedBy: 'November 2035',
    state: 'In use',
  }),
  asset({
    number: 'OS-0149',
    name: 'Meeting room furniture',
    group: 'furniture',
    location: 'Head office, Novi Sad',
    costCentre: '100 Administration',
    responsible: 'Ana Marić',
    role: 'Assistant to the director',
    acquired: '2026-03-02',
    inUse: '2026-03-09',
    supplier: 'Enterijer Lux d.o.o.',
    document: 'Invoice EL-2026-0091',
    value: '684000.00',
    accumulated: '35625.00',
    book: '648375.00',
    monthly: '7125.00',
    depreciatedBy: 'March 2034',
    state: 'In use',
  }),
  asset({
    number: 'OS-0151',
    name: 'Laptop Dell Latitude 5550',
    group: 'it',
    location: 'Head office, Novi Sad',
    costCentre: '100 Administration',
    responsible: 'Tamara Simić',
    role: 'Payroll and invoicing clerk',
    acquired: '2026-09-22',
    inUse: null,
    supplier: 'Elektro Sistem d.o.o.',
    document: 'Invoice ES-2026-0802',
    serial: '7JQ4DX3',
    value: '168000.00',
    accumulated: '0.00',
    book: '168000.00',
    monthly: '2800.00',
    depreciatedBy: null,
    state: 'Not yet in use',
  }),
]

export function assetByNumber(number: string): FixedAsset | undefined {
  return ASSETS.find((each) => each.number === number)
}

export type RegisterView = 'inUse' | 'disposed' | 'all'

export const REGISTER_VIEWS: { id: RegisterView; label: string }[] = [
  { id: 'inUse', label: 'In the register' },
  { id: 'disposed', label: 'Disposed and sold' },
  { id: 'all', label: 'All' },
]

export function inRegisterView(asset: FixedAsset, view: RegisterView): boolean {
  const gone = asset.state === 'Disposed' || asset.state === 'Sold'
  return view === 'all' || (view === 'disposed' ? gone : !gone)
}

// ── An asset's value history and its 2026 depreciation ────────────────────────────────────────

export interface HistoryRow {
  id: string
  date: string
  event: string
  /** Signed: + for an acquisition, − for depreciation and write-offs; null for a move. */
  change: string | null
  accumulated: string
  book: string
}

let historyId = 0
const history = (
  date: string,
  event: string,
  change: string | null,
  accumulated: string,
  book: string,
): HistoryRow => {
  historyId += 1
  return { id: `h${String(historyId)}`, date, event, change, accumulated, book }
}

export type ScheduleState = 'Posted' | 'In review' | 'Planned'

export const SCHEDULE_TONES: Record<ScheduleState, Tone> = {
  Posted: 'success',
  'In review': 'info',
  Planned: 'neutral',
}

export interface ScheduleRow {
  /** YYYY-MM. */
  month: string
  depreciation: string
  accumulated: string
  book: string
  state: ScheduleState
}

const row = (
  month: string,
  depreciation: string,
  accumulated: string,
  book: string,
  state: ScheduleState,
): ScheduleRow => ({ month, depreciation, accumulated, book, state })

/** The year's total of each schedule (the application's), by asset. */
export const HISTORIES: Record<string, readonly HistoryRow[]> = {
  'OS-0012': [
    history('2016-05-20', 'Acquisition', '48600000.00', '0.00', '48600000.00'),
    history(
      '2025-12-31',
      'Depreciation to 31.12.2025',
      '-11643750.00',
      '11643750.00',
      '36956250.00',
    ),
    history(
      '2026-08-31',
      'Depreciation January–August 2026',
      '-810000.00',
      '12453750.00',
      '36146250.00',
    ),
  ],
  'OS-0031': [
    history('2021-08-10', 'Acquisition', '96000.00', '0.00', '96000.00'),
    history('2025-12-31', 'Depreciation to 31.12.2025', '-83200.00', '83200.00', '12800.00'),
    history(
      '2026-08-31',
      'Depreciation January–August 2026, fully depreciated',
      '-12800.00',
      '96000.00',
      '0.00',
    ),
  ],
  'OS-0047': [
    history('2019-06-12', 'Acquisition', '396677.71', '0.00', '396677.71'),
    history('2025-12-31', 'Depreciation to 31.12.2025', '-322300.68', '322300.68', '74377.03'),
    history('2026-08-31', 'Depreciation January–August 2026', '-33056.48', '355357.16', '41320.55'),
  ],
  'OS-0088': [
    history('2020-06-15', 'Acquisition', '540000.00', '0.00', '540000.00'),
    history('2025-12-31', 'Depreciation to 31.12.2025', '-371250.00', '371250.00', '168750.00'),
    history('2026-07-14', 'Depreciation January–July 2026', '-39375.00', '410625.00', '129375.00'),
    history('2026-07-14', 'Disposed: damaged beyond repair', '-129375.00', '410625.00', '0.00'),
  ],
  'OS-0098': [
    history('2020-02-18', 'Acquisition', '3250000.00', '0.00', '3250000.00'),
    history('2025-12-31', 'Depreciation to 31.12.2025', '-2369791.90', '2369791.90', '880208.10'),
    history(
      '2026-08-31',
      'Depreciation January–August 2026',
      '-270833.36',
      '2640625.26',
      '609374.74',
    ),
    history(
      '2026-09-30',
      'Depreciation September 2026 (in review)',
      '-33854.17',
      '2674479.43',
      '575520.57',
    ),
    history('2026-09-30', 'Sold to Stanogradnja Plus d.o.o.', '-575520.57', '2674479.43', '0.00'),
  ],
  'OS-0112': [
    history('2021-03-15', 'Acquisition', '90302.25', '0.00', '90302.25'),
    history('2025-12-31', 'Depreciation to 31.12.2025', '-53617.05', '53617.05', '36685.20'),
    history('2026-08-31', 'Depreciation January–August 2026', '-7525.20', '61142.25', '29160.00'),
  ],
  'OS-0118': [
    history('2022-04-04', 'Acquisition', '14200000.00', '0.00', '14200000.00'),
    history('2025-12-31', 'Depreciation to 31.12.2025', '-5206666.52', '5206666.52', '8993333.48'),
    history(
      '2026-08-31',
      'Depreciation January–August 2026',
      '-946666.64',
      '6153333.16',
      '8046666.84',
    ),
  ],
  'OS-0127': [
    history('2023-06-01', 'Acquisition', '2880000.00', '0.00', '2880000.00'),
    history('2025-12-31', 'Depreciation to 31.12.2025', '-900000.00', '900000.00', '1980000.00'),
    history(
      '2026-08-31',
      'Depreciation January–August 2026',
      '-240000.00',
      '1140000.00',
      '1740000.00',
    ),
  ],
  'OS-0133': [
    history('2024-02-12', 'Acquisition', '5160000.00', '0.00', '5160000.00'),
    history('2025-12-31', 'Depreciation to 31.12.2025', '-1182500.00', '1182500.00', '3977500.00'),
    history(
      '2026-08-31',
      'Depreciation January–August 2026',
      '-430000.00',
      '1612500.00',
      '3547500.00',
    ),
  ],
  'OS-0139': [
    history('2024-11-05', 'Acquisition', '1380000.00', '0.00', '1380000.00'),
    history('2025-12-31', 'Depreciation to 31.12.2025', '-299000.00', '299000.00', '1081000.00'),
    history(
      '2026-08-31',
      'Depreciation January–August 2026',
      '-184000.00',
      '483000.00',
      '897000.00',
    ),
  ],
  'OS-0142': [
    history('2025-03-14', 'Acquisition', '6840000.00', '0.00', '6840000.00'),
    history('2025-12-31', 'Depreciation to 31.12.2025', '-513000.00', '513000.00', '6327000.00'),
    history(
      '2026-02-02',
      'Moved from Central warehouse to Site Liman 4',
      null,
      '513000.00',
      '6327000.00',
    ),
    history(
      '2026-08-31',
      'Depreciation January–August 2026',
      '-456000.00',
      '969000.00',
      '5871000.00',
    ),
  ],
  'OS-0146': [
    history('2025-11-20', 'Acquisition', '1920000.00', '0.00', '1920000.00'),
    history('2025-12-31', 'Depreciation to 31.12.2025', '-16000.00', '16000.00', '1904000.00'),
    history(
      '2026-08-31',
      'Depreciation January–August 2026',
      '-128000.00',
      '144000.00',
      '1776000.00',
    ),
  ],
  'OS-0149': [
    history('2026-03-02', 'Acquisition', '684000.00', '0.00', '684000.00'),
    history('2026-08-31', 'Depreciation April–August 2026', '-35625.00', '35625.00', '648375.00'),
  ],
  'OS-0151': [history('2026-09-22', 'Acquisition', '168000.00', '0.00', '168000.00')],
}
export const SCHEDULES: Record<string, readonly ScheduleRow[]> = {
  'OS-0012': [
    row('2026-01', '101250.00', '11745000.00', '36855000.00', 'Posted'),
    row('2026-02', '101250.00', '11846250.00', '36753750.00', 'Posted'),
    row('2026-03', '101250.00', '11947500.00', '36652500.00', 'Posted'),
    row('2026-04', '101250.00', '12048750.00', '36551250.00', 'Posted'),
    row('2026-05', '101250.00', '12150000.00', '36450000.00', 'Posted'),
    row('2026-06', '101250.00', '12251250.00', '36348750.00', 'Posted'),
    row('2026-07', '101250.00', '12352500.00', '36247500.00', 'Posted'),
    row('2026-08', '101250.00', '12453750.00', '36146250.00', 'Posted'),
    row('2026-09', '101250.00', '12555000.00', '36045000.00', 'In review'),
    row('2026-10', '101250.00', '12656250.00', '35943750.00', 'Planned'),
    row('2026-11', '101250.00', '12757500.00', '35842500.00', 'Planned'),
    row('2026-12', '101250.00', '12858750.00', '35741250.00', 'Planned'),
  ],
  'OS-0031': [
    row('2026-01', '1600.00', '84800.00', '11200.00', 'Posted'),
    row('2026-02', '1600.00', '86400.00', '9600.00', 'Posted'),
    row('2026-03', '1600.00', '88000.00', '8000.00', 'Posted'),
    row('2026-04', '1600.00', '89600.00', '6400.00', 'Posted'),
    row('2026-05', '1600.00', '91200.00', '4800.00', 'Posted'),
    row('2026-06', '1600.00', '92800.00', '3200.00', 'Posted'),
    row('2026-07', '1600.00', '94400.00', '1600.00', 'Posted'),
    row('2026-08', '1600.00', '96000.00', '0.00', 'Posted'),
  ],
  'OS-0047': [
    row('2026-01', '4132.06', '326432.74', '70244.97', 'Posted'),
    row('2026-02', '4132.06', '330564.80', '66112.91', 'Posted'),
    row('2026-03', '4132.06', '334696.86', '61980.85', 'Posted'),
    row('2026-04', '4132.06', '338828.92', '57848.79', 'Posted'),
    row('2026-05', '4132.06', '342960.98', '53716.73', 'Posted'),
    row('2026-06', '4132.06', '347093.04', '49584.67', 'Posted'),
    row('2026-07', '4132.06', '351225.10', '45452.61', 'Posted'),
    row('2026-08', '4132.06', '355357.16', '41320.55', 'Posted'),
    row('2026-09', '4132.06', '359489.22', '37188.49', 'In review'),
    row('2026-10', '4132.06', '363621.28', '33056.43', 'Planned'),
    row('2026-11', '4132.06', '367753.34', '28924.37', 'Planned'),
    row('2026-12', '4132.06', '371885.40', '24792.31', 'Planned'),
  ],
  'OS-0088': [
    row('2026-01', '5625.00', '376875.00', '163125.00', 'Posted'),
    row('2026-02', '5625.00', '382500.00', '157500.00', 'Posted'),
    row('2026-03', '5625.00', '388125.00', '151875.00', 'Posted'),
    row('2026-04', '5625.00', '393750.00', '146250.00', 'Posted'),
    row('2026-05', '5625.00', '399375.00', '140625.00', 'Posted'),
    row('2026-06', '5625.00', '405000.00', '135000.00', 'Posted'),
    row('2026-07', '5625.00', '410625.00', '129375.00', 'Posted'),
  ],
  'OS-0098': [
    row('2026-01', '33854.17', '2403646.07', '846353.93', 'Posted'),
    row('2026-02', '33854.17', '2437500.24', '812499.76', 'Posted'),
    row('2026-03', '33854.17', '2471354.41', '778645.59', 'Posted'),
    row('2026-04', '33854.17', '2505208.58', '744791.42', 'Posted'),
    row('2026-05', '33854.17', '2539062.75', '710937.25', 'Posted'),
    row('2026-06', '33854.17', '2572916.92', '677083.08', 'Posted'),
    row('2026-07', '33854.17', '2606771.09', '643228.91', 'Posted'),
    row('2026-08', '33854.17', '2640625.26', '609374.74', 'Posted'),
    row('2026-09', '33854.17', '2674479.43', '575520.57', 'In review'),
  ],
  'OS-0112': [
    row('2026-01', '940.65', '54557.70', '35744.55', 'Posted'),
    row('2026-02', '940.65', '55498.35', '34803.90', 'Posted'),
    row('2026-03', '940.65', '56439.00', '33863.25', 'Posted'),
    row('2026-04', '940.65', '57379.65', '32922.60', 'Posted'),
    row('2026-05', '940.65', '58320.30', '31981.95', 'Posted'),
    row('2026-06', '940.65', '59260.95', '31041.30', 'Posted'),
    row('2026-07', '940.65', '60201.60', '30100.65', 'Posted'),
    row('2026-08', '940.65', '61142.25', '29160.00', 'Posted'),
    row('2026-09', '940.65', '62082.90', '28219.35', 'In review'),
    row('2026-10', '940.65', '63023.55', '27278.70', 'Planned'),
    row('2026-11', '940.65', '63964.20', '26338.05', 'Planned'),
    row('2026-12', '940.65', '64904.85', '25397.40', 'Planned'),
  ],
  'OS-0118': [
    row('2026-01', '118333.33', '5324999.85', '8875000.15', 'Posted'),
    row('2026-02', '118333.33', '5443333.18', '8756666.82', 'Posted'),
    row('2026-03', '118333.33', '5561666.51', '8638333.49', 'Posted'),
    row('2026-04', '118333.33', '5679999.84', '8520000.16', 'Posted'),
    row('2026-05', '118333.33', '5798333.17', '8401666.83', 'Posted'),
    row('2026-06', '118333.33', '5916666.50', '8283333.50', 'Posted'),
    row('2026-07', '118333.33', '6034999.83', '8165000.17', 'Posted'),
    row('2026-08', '118333.33', '6153333.16', '8046666.84', 'Posted'),
    row('2026-09', '118333.33', '6271666.49', '7928333.51', 'In review'),
    row('2026-10', '118333.33', '6389999.82', '7810000.18', 'Planned'),
    row('2026-11', '118333.33', '6508333.15', '7691666.85', 'Planned'),
    row('2026-12', '118333.33', '6626666.48', '7573333.52', 'Planned'),
  ],
  'OS-0127': [
    row('2026-01', '30000.00', '930000.00', '1950000.00', 'Posted'),
    row('2026-02', '30000.00', '960000.00', '1920000.00', 'Posted'),
    row('2026-03', '30000.00', '990000.00', '1890000.00', 'Posted'),
    row('2026-04', '30000.00', '1020000.00', '1860000.00', 'Posted'),
    row('2026-05', '30000.00', '1050000.00', '1830000.00', 'Posted'),
    row('2026-06', '30000.00', '1080000.00', '1800000.00', 'Posted'),
    row('2026-07', '30000.00', '1110000.00', '1770000.00', 'Posted'),
    row('2026-08', '30000.00', '1140000.00', '1740000.00', 'Posted'),
    row('2026-09', '30000.00', '1170000.00', '1710000.00', 'In review'),
    row('2026-10', '30000.00', '1200000.00', '1680000.00', 'Planned'),
    row('2026-11', '30000.00', '1230000.00', '1650000.00', 'Planned'),
    row('2026-12', '30000.00', '1260000.00', '1620000.00', 'Planned'),
  ],
  'OS-0133': [
    row('2026-01', '53750.00', '1236250.00', '3923750.00', 'Posted'),
    row('2026-02', '53750.00', '1290000.00', '3870000.00', 'Posted'),
    row('2026-03', '53750.00', '1343750.00', '3816250.00', 'Posted'),
    row('2026-04', '53750.00', '1397500.00', '3762500.00', 'Posted'),
    row('2026-05', '53750.00', '1451250.00', '3708750.00', 'Posted'),
    row('2026-06', '53750.00', '1505000.00', '3655000.00', 'Posted'),
    row('2026-07', '53750.00', '1558750.00', '3601250.00', 'Posted'),
    row('2026-08', '53750.00', '1612500.00', '3547500.00', 'Posted'),
    row('2026-09', '53750.00', '1666250.00', '3493750.00', 'In review'),
    row('2026-10', '53750.00', '1720000.00', '3440000.00', 'Planned'),
    row('2026-11', '53750.00', '1773750.00', '3386250.00', 'Planned'),
    row('2026-12', '53750.00', '1827500.00', '3332500.00', 'Planned'),
  ],
  'OS-0139': [
    row('2026-01', '23000.00', '322000.00', '1058000.00', 'Posted'),
    row('2026-02', '23000.00', '345000.00', '1035000.00', 'Posted'),
    row('2026-03', '23000.00', '368000.00', '1012000.00', 'Posted'),
    row('2026-04', '23000.00', '391000.00', '989000.00', 'Posted'),
    row('2026-05', '23000.00', '414000.00', '966000.00', 'Posted'),
    row('2026-06', '23000.00', '437000.00', '943000.00', 'Posted'),
    row('2026-07', '23000.00', '460000.00', '920000.00', 'Posted'),
    row('2026-08', '23000.00', '483000.00', '897000.00', 'Posted'),
    row('2026-09', '23000.00', '506000.00', '874000.00', 'In review'),
    row('2026-10', '23000.00', '529000.00', '851000.00', 'Planned'),
    row('2026-11', '23000.00', '552000.00', '828000.00', 'Planned'),
    row('2026-12', '23000.00', '575000.00', '805000.00', 'Planned'),
  ],
  'OS-0142': [
    row('2026-01', '57000.00', '570000.00', '6270000.00', 'Posted'),
    row('2026-02', '57000.00', '627000.00', '6213000.00', 'Posted'),
    row('2026-03', '57000.00', '684000.00', '6156000.00', 'Posted'),
    row('2026-04', '57000.00', '741000.00', '6099000.00', 'Posted'),
    row('2026-05', '57000.00', '798000.00', '6042000.00', 'Posted'),
    row('2026-06', '57000.00', '855000.00', '5985000.00', 'Posted'),
    row('2026-07', '57000.00', '912000.00', '5928000.00', 'Posted'),
    row('2026-08', '57000.00', '969000.00', '5871000.00', 'Posted'),
    row('2026-09', '57000.00', '1026000.00', '5814000.00', 'In review'),
    row('2026-10', '57000.00', '1083000.00', '5757000.00', 'Planned'),
    row('2026-11', '57000.00', '1140000.00', '5700000.00', 'Planned'),
    row('2026-12', '57000.00', '1197000.00', '5643000.00', 'Planned'),
  ],
  'OS-0146': [
    row('2026-01', '16000.00', '32000.00', '1888000.00', 'Posted'),
    row('2026-02', '16000.00', '48000.00', '1872000.00', 'Posted'),
    row('2026-03', '16000.00', '64000.00', '1856000.00', 'Posted'),
    row('2026-04', '16000.00', '80000.00', '1840000.00', 'Posted'),
    row('2026-05', '16000.00', '96000.00', '1824000.00', 'Posted'),
    row('2026-06', '16000.00', '112000.00', '1808000.00', 'Posted'),
    row('2026-07', '16000.00', '128000.00', '1792000.00', 'Posted'),
    row('2026-08', '16000.00', '144000.00', '1776000.00', 'Posted'),
    row('2026-09', '16000.00', '160000.00', '1760000.00', 'In review'),
    row('2026-10', '16000.00', '176000.00', '1744000.00', 'Planned'),
    row('2026-11', '16000.00', '192000.00', '1728000.00', 'Planned'),
    row('2026-12', '16000.00', '208000.00', '1712000.00', 'Planned'),
  ],
  'OS-0149': [
    row('2026-04', '7125.00', '7125.00', '676875.00', 'Posted'),
    row('2026-05', '7125.00', '14250.00', '669750.00', 'Posted'),
    row('2026-06', '7125.00', '21375.00', '662625.00', 'Posted'),
    row('2026-07', '7125.00', '28500.00', '655500.00', 'Posted'),
    row('2026-08', '7125.00', '35625.00', '648375.00', 'Posted'),
    row('2026-09', '7125.00', '42750.00', '641250.00', 'In review'),
    row('2026-10', '7125.00', '49875.00', '634125.00', 'Planned'),
    row('2026-11', '7125.00', '57000.00', '627000.00', 'Planned'),
    row('2026-12', '7125.00', '64125.00', '619875.00', 'Planned'),
  ],
  'OS-0151': [],
}
export const SCHEDULE_TOTALS: Record<string, string> = {
  'OS-0012': '1215000.00',
  'OS-0031': '12800.00',
  'OS-0047': '49584.72',
  'OS-0088': '39375.00',
  'OS-0098': '304687.53',
  'OS-0112': '11287.80',
  'OS-0118': '1419999.96',
  'OS-0127': '360000.00',
  'OS-0133': '645000.00',
  'OS-0139': '276000.00',
  'OS-0142': '684000.00',
  'OS-0146': '192000.00',
  'OS-0149': '64125.00',
  'OS-0151': '0.00',
}

// ── The September 2026 depreciation run ───────────────────────────────────────────────────────

export const RUN_PERIOD = 'September 2026'

/** The run's steps, as the application names them. */
export const RUN_STEPS = [
  { key: 'prepare', label: 'Prepare', description: 'Acquisitions and disposals' },
  { key: 'calculate', label: 'Calculate' },
  { key: 'review', label: 'Review' },
  { key: 'post', label: 'Post' },
] as const

/** One asset's line of the run: the month's depreciation and the values after it. */
export interface RunLine {
  number: string
  depreciation: string
  accumulated: string
  book: string
}

const runLine = (
  number: string,
  depreciation: string,
  accumulated: string,
  book: string,
): RunLine => ({ number, depreciation, accumulated, book })

export const RUN_LINES: readonly RunLine[] = [
  runLine('OS-0012', '101250.00', '12555000.00', '36045000.00'),
  runLine('OS-0047', '4132.06', '359489.22', '37188.49'),
  runLine('OS-0098', '33854.17', '2674479.43', '575520.57'),
  runLine('OS-0112', '940.65', '62082.90', '28219.35'),
  runLine('OS-0118', '118333.33', '6271666.49', '7928333.51'),
  runLine('OS-0127', '30000.00', '1170000.00', '1710000.00'),
  runLine('OS-0133', '53750.00', '1666250.00', '3493750.00'),
  runLine('OS-0139', '23000.00', '506000.00', '874000.00'),
  runLine('OS-0142', '57000.00', '1026000.00', '5814000.00'),
  runLine('OS-0146', '16000.00', '160000.00', '1760000.00'),
  runLine('OS-0149', '7125.00', '42750.00', '641250.00'),
]

/** The run's totals (the application's). */
export const RUN_TOTALS = {
  /** Assets depreciated this month, of those in the register in September. */
  depreciated: '11',
  inRegister: '13',
  depreciation: '445385.21',
  accumulated: '26493718.04',
  book: '58907261.92',
  /** The journal entry the run will post (a draft until then). */
  entry: 'NK-2026-0951',
}

export const RERUN_REASONS = [
  { value: 'acquisition', label: 'An acquisition was added' },
  { value: 'group', label: 'A depreciation group was corrected' },
  { value: 'disposal', label: 'A disposal or sale was recorded' },
]

// ── Disposal and sale ─────────────────────────────────────────────────────────────────────────

export const DISPOSAL_REASONS = [
  { value: 'damaged', label: 'Damaged beyond repair' },
  { value: 'stolen', label: 'Stolen' },
  { value: 'obsolete', label: 'Obsolete' },
]

/** The customers an asset can be sold to (the application's catalog). */
export const BUYERS = [
  { value: 'stanogradnja', label: 'Stanogradnja Plus d.o.o.' },
  { value: 'toplana', label: 'Gradska toplana Novi Sad' },
  { value: 'kvadrat-beton', label: 'Kvadrat Beton d.o.o.' },
]

/** The draft sales invoice the application makes for a sale of OS-0142. */
export const SALE_INVOICE = 'F-2026-0437'
