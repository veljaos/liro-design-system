/*
 * Group N's example data (P5.25a): floor plans of three more places, on Tuesday 6 October 2026.
 * Fictitious; English interface text, Serbian data. Not part of the package. No classes here.
 * - Magacin Novi Sad, the warehouse of group I's handheld (P5.11): zones, racks of bins and a
 *   bulk yard; each bin's stock, how full it is (the warehouse system's percentage) and its state.
 *   The bins of pick list PL-2026-0418 hold its items, and A-02-03 holds what count CC-2026-0031
 *   expects there.
 * - Interno odeljenje 3 of Opšta bolnica „Dunavski kej“: rooms (two of them polygons) and beds,
 *   free, occupied, needing cleaning or blocked; a patient's name is health data, shown only for a
 *   reason (MaskedValue, P5.14).
 * - Kvadrat Gradnja's office, floor 2: bookable desks over the architect's drawing of the floor;
 *   who sits where on each of the next five working days.
 * The plans' drawings are SVG built from wall lines (`drawingUri`), passed as `data:` URIs.
 */
import { Ban, BedSingle, ClipboardList, Package, PackageCheck, PackageMinus } from 'lucide-react'
import { Armchair, CircleCheck, Sparkles, UserRound, Wrench } from 'lucide-react'
import type { FloorArea, FloorItem, FloorState } from '@veljaos/ui'
import {
  drawingUri,
  type PlanDrawing,
} from '../../../../packages/ui/src/components/floor-plan-places-story-data'
import { COUNT, COUNT_RECORDS, PICK_LINES, PICKING } from './data-I'

export const N_ROUTES = {
  /** The warehouse's plan. */
  warehouse: '/warehouse/plan',
  /** Bin A-02-03, where count CC-2026-0031 is open, in its drawer. */
  warehouseBin: '/warehouse/plan?bin=A-02-03',
  /** Bin B-03-04, the next pick of PL-2026-0418, in its drawer. */
  warehousePick: '/warehouse/plan?bin=B-03-04',
  /** The ward's beds. */
  ward: '/ward/interno-3',
  /** Bed 9 in its drawer: the patient's name masked. */
  wardBed: '/ward/interno-3?bed=b9',
  /** Bed 9: "Transfer patient" with the free beds by room (P5.28 item 18). */
  wardTransfer: '/ward/interno-3?bed=b9&transfer',
  /** Free bed 2: "Admit patient" with the patients waiting (P5.28 item 18). */
  wardAdmit: '/ward/interno-3?bed=b2&admit',
  /** The office's desks today. */
  office: '/office/desks',
  /** Desk 7, free today, chosen. */
  officeDesk: '/office/desks?desk=d7',
  /** Milica's own desk today, chosen. */
  officeOwn: '/office/desks?desk=d3',
}

// ── The warehouse ─────────────────────────────────────────────────────────────────────────────

export const WAREHOUSE = {
  companyId: 'magacin-ns',
  company: 'Magacin Novi Sad d.o.o.',
  name: PICKING.warehouse,
  address: 'Industrijska 14, Novi Sad',
  manager: { name: 'Jelena Marković', email: 'jelena.markovic@magacinns.rs' },
}

/** The bins' states: the warehouse system's map. */
export const BIN_STATES: FloorState[] = [
  { id: 'stock', label: 'In stock', tone: 'success', icon: PackageCheck },
  { id: 'low', label: 'Low', tone: 'warning', icon: PackageMinus },
  { id: 'empty', label: 'Empty', tone: 'neutral', icon: Package },
  { id: 'count', label: 'Count open', tone: 'premium', icon: ClipboardList },
  { id: 'blocked', label: 'Blocked', tone: 'danger', icon: Ban },
]

/** The hall: 2400 × 1400 units (centimetres: 24 × 14 m). */
export const WAREHOUSE_SIZE = { width: 2400, height: 1400 }

export const WAREHOUSE_AREAS: FloorArea[] = [
  { id: 'za', label: 'Zone A', x: 0, y: 0, width: 1180, height: 560 },
  { id: 'zb', label: 'Zone B', x: 1220, y: 0, width: 1180, height: 560 },
  { id: 'zc', label: 'Zone C', x: 0, y: 600, width: 760, height: 520 },
  { id: 'zd', label: 'Zone D', x: 800, y: 600, width: 760, height: 520 },
  {
    id: 'ze',
    label: 'Bulk yard E',
    points: [
      { x: 1600, y: 600 },
      { x: 2400, y: 600 },
      { x: 2400, y: 1400 },
      { x: 1960, y: 1400 },
      { x: 1960, y: 1120 },
      { x: 1600, y: 1120 },
    ],
    labelAt: { x: 1720, y: 624 },
  },
  { id: 'receiving', label: 'Receiving', x: 0, y: 1160, width: 760, height: 240 },
  { id: 'dispatch', label: 'Dispatch', x: 800, y: 1160, width: 1120, height: 240 },
]

/** A rack: its code ("A-02"), its zone, where its first bin stands, how many shelves. */
interface Rack {
  code: string
  zone: string
  x: number
  y: number
  shelves: number
}

const RACKS: readonly Rack[] = [
  { code: 'A-01', zone: 'za', x: 80, y: 100, shelves: 6 },
  { code: 'A-02', zone: 'za', x: 640, y: 100, shelves: 6 },
  { code: 'A-03', zone: 'za', x: 80, y: 340, shelves: 6 },
  { code: 'A-04', zone: 'za', x: 640, y: 340, shelves: 6 },
  { code: 'B-01', zone: 'zb', x: 1300, y: 60, shelves: 6 },
  { code: 'B-02', zone: 'zb', x: 1860, y: 60, shelves: 6 },
  { code: 'B-03', zone: 'zb', x: 1300, y: 240, shelves: 6 },
  { code: 'B-04', zone: 'zb', x: 1860, y: 240, shelves: 6 },
  { code: 'B-05', zone: 'zb', x: 1300, y: 420, shelves: 6 },
  { code: 'C-01', zone: 'zc', x: 80, y: 700, shelves: 6 },
  { code: 'C-02', zone: 'zc', x: 80, y: 900, shelves: 6 },
  { code: 'D-01', zone: 'zd', x: 880, y: 700, shelves: 6 },
  { code: 'D-02', zone: 'zd', x: 880, y: 900, shelves: 6 },
]

/** The bulk yard's bays, 200 × 200 units. */
const BAYS: readonly { code: string; x: number; y: number }[] = [
  { code: 'E-01-01', x: 1660, y: 660 },
  { code: 'E-01-02', x: 1900, y: 660 },
  { code: 'E-02-01', x: 2140, y: 660 },
  { code: 'E-02-02', x: 1660, y: 890 },
  { code: 'E-03-01', x: 1900, y: 890 },
  { code: 'E-03-02', x: 2100, y: 1160 },
]

/** One line of a bin's stock: the item, its code, the quantity (a decimal string) and unit. */
export interface StockLine {
  item: string
  itemCode: string
  quantity: string
  unit: string
}

/** A bin as the warehouse system keeps it. */
export interface Bin {
  code: string
  /** "Rack A2, shelf 3", "Bulk yard, bay 1-1". */
  name: string
  zone: string
  x: number
  y: number
  size: number
  /** How full, the system's percentage (decimal string). */
  percent: string
  state: string
  stock: StockLine[]
  note?: string
}

/** The stock the pick list's bins hold now (after lines 1–3 were picked), and the count's bin. */
const KNOWN_STOCK: Record<
  string,
  { percent: string; state?: string; stock: StockLine[]; note?: string }
> = {
  'A-01-02': { percent: '55', stock: [line('p1', '60')] },
  'A-01-06': { percent: '35', stock: [line('p2', '21')] },
  'A-02-03': {
    percent: '45',
    state: 'count',
    stock: COUNT_RECORDS.map((record) => ({
      item: record.item,
      itemCode: record.itemCode,
      quantity: record.expected,
      unit: record.unit,
    })),
    note: `${COUNT.title} is open: the pick of ${PICKING.list} came up short here.`,
  },
  'A-04-01': {
    percent: '20',
    state: 'blocked',
    stock: [line('p4', '9')],
    note: 'Blocked: the rolls are wet; waiting for the supplier’s inspection.',
  },
  'B-03-04': {
    percent: '65',
    stock: [line('p5', '26')],
    note: `Next pick: ${PICKING.list}, line 5, 18 packs for ${PICKING.customer}.`,
  },
  'B-05-02': { percent: '40', stock: [line('p6', '9')] },
  'C-01-02': { percent: '80', stock: [line('p7', '64')] },
  'C-01-05': { percent: '70', stock: [line('p8', '48')] },
  'C-02-01': { percent: '15', stock: [line('p9', '5')] },
  'D-02-03': { percent: '90', stock: [line('p10', '72')] },
  'E-01-01': { percent: '75', stock: [line('p11', '18.5')] },
  'E-03-02': { percent: '30', stock: [line('p12', '3')] },
}

/** A pick line's item with the quantity the bin holds. */
function line(pickId: string, quantity: string): StockLine {
  const pick = PICK_LINES.find((each) => each.id === pickId)
  return {
    item: pick?.item ?? '',
    itemCode: pick?.itemCode ?? '',
    quantity,
    unit: pick?.unit ?? 'pc',
  }
}

/** The other items in the hall, given to the other bins in turn. */
const OTHER_ITEMS: readonly Omit<StockLine, 'quantity'>[] = [
  { item: 'Opeka 25 × 12 × 6,5 cm', itemCode: '8600981000255', unit: 'pallet' },
  { item: 'Crep glineni, mediteran', itemCode: '8600981000262', unit: 'pallet' },
  { item: 'PVC cev 110 mm, 3 m', itemCode: '8600981000279', unit: 'pc' },
  { item: 'Kreč hidratisani, 25 kg', itemCode: '8600981000286', unit: 'bag' },
  { item: 'OSB ploča 18 mm, 2500 × 1250 mm', itemCode: '8600981000293', unit: 'pc' },
  { item: 'Mineralna vuna 10 cm, paket 6 m²', itemCode: '8600981000309', unit: 'pack' },
  { item: 'Ekser građevinski 100 mm, 5 kg', itemCode: '8600981000316', unit: 'box' },
  { item: 'Glet masa, 25 kg', itemCode: '8600981000323', unit: 'bag' },
]

/** How full the other bins are, in turn, with the quantity each percentage stands for. */
const OTHER_LEVELS: readonly { percent: string; quantity: string }[] = [
  { percent: '85', quantity: '34' },
  { percent: '60', quantity: '24' },
  { percent: '0', quantity: '0' },
  { percent: '100', quantity: '40' },
  { percent: '12.5', quantity: '5' },
  { percent: '50', quantity: '20' },
  { percent: '95', quantity: '38' },
  { percent: '25', quantity: '10' },
  { percent: '70', quantity: '28' },
  { percent: '8', quantity: '3' },
  { percent: '45', quantity: '18' },
]

/** The levels the warehouse calls low (its rule: under 20%). */
const LOW_LEVELS = new Set(['8', '12.5', '15'])

function binState(percent: string, given: string | undefined): string {
  if (given !== undefined) return given
  if (percent === '0') return 'empty'
  return LOW_LEVELS.has(percent) ? 'low' : 'stock'
}

/** Every bin of the hall, rack by rack, then the bulk yard. */
export const BINS: readonly Bin[] = (() => {
  const bins: Bin[] = []
  let other = 0
  const add = (code: string, name: string, zone: string, x: number, y: number, size: number) => {
    const known = KNOWN_STOCK[code]
    if (known !== undefined) {
      bins.push({
        code,
        name,
        zone,
        x,
        y,
        size,
        percent: known.percent,
        state: binState(known.percent, known.state),
        stock: known.stock,
        ...(known.note === undefined ? {} : { note: known.note }),
      })
      return
    }
    const level = OTHER_LEVELS[other % OTHER_LEVELS.length] ?? { percent: '0', quantity: '0' }
    const item = OTHER_ITEMS[other % OTHER_ITEMS.length]
    other += 1
    bins.push({
      code,
      name,
      zone,
      x,
      y,
      size,
      percent: level.percent,
      state: binState(level.percent, undefined),
      stock:
        level.quantity === '0' || item === undefined ? [] : [{ ...item, quantity: level.quantity }],
    })
  }
  for (const rack of RACKS) {
    const [aisle = '', number = ''] = rack.code.split('-')
    for (let shelf = 1; shelf <= rack.shelves; shelf += 1) {
      const code = `${rack.code}-${String(shelf).padStart(2, '0')}`
      add(
        code,
        `Rack ${aisle}${String(Number(number))}, shelf ${String(shelf)}`,
        rack.zone,
        rack.x + (shelf - 1) * 80,
        rack.y,
        80,
      )
    }
  }
  for (const bay of BAYS) {
    const [, row = '', place = ''] = bay.code.split('-')
    add(
      bay.code,
      `Bulk yard, bay ${String(Number(row))}-${String(Number(place))}`,
      'ze',
      bay.x,
      bay.y,
      200,
    )
  }
  return bins
})()

/** The rack a bin belongs to ("A-02"), the bulk yard's bays under "E". */
export function rackOf(code: string): string {
  return code.split('-').slice(0, 2).join('-')
}

/** The bins as the plan draws them: the code, the shelf on the plan, how full, the state. */
export function binItems(bins: readonly Bin[]): FloorItem[] {
  return bins.map((bin) => ({
    id: bin.code,
    kind: 'place',
    label: bin.code,
    shortLabel: bin.size > 80 ? bin.code.slice(2) : bin.code.slice(-2),
    x: bin.x,
    y: bin.y,
    width: bin.size,
    height: bin.size,
    areaId: bin.zone,
    stateId: bin.state,
    level: { percent: bin.percent },
    ...(bin.note === undefined ? {} : { note: bin.note }),
  }))
}

/**
 * Each rack's sign at its start ("A2"): drawn, not chosen. No dock doors (P5.28 item 23: no
 * walls, doors or windows): Receiving and Dispatch are the areas along the docks.
 */
export const WAREHOUSE_FIXTURES: FloorItem[] = [
  ...RACKS.map((rack): FloorItem => {
    const [aisle = '', number = ''] = rack.code.split('-')
    const name = `${aisle}${String(Number(number))}`
    return {
      id: `sign-${rack.code}`,
      kind: 'counter',
      label: `Rack ${name}`,
      shortLabel: name,
      x: rack.x - 64,
      y: rack.y + 10,
      width: 56,
      height: 60,
    }
  }),
]

// ── The hospital ward ─────────────────────────────────────────────────────────────────────────

export const HOSPITAL = {
  companyId: 'ob-dk',
  company: 'Opšta bolnica „Dunavski kej“',
  ward: 'Interno odeljenje 3',
  address: 'Dunavski kej 7, Novi Sad',
  nurse: { name: 'Marija Đorđević', email: 'marija.djordjevic@obdk.rs' },
}

/** The beds' states: the hospital's map. */
export const BED_STATES: FloorState[] = [
  { id: 'free', label: 'Free', tone: 'success', icon: BedSingle },
  { id: 'occupied', label: 'Occupied', tone: 'neutral', icon: UserRound },
  { id: 'cleaning', label: 'Needs cleaning', tone: 'warning', icon: Sparkles },
  { id: 'blocked', label: 'Blocked', tone: 'danger', icon: Ban },
]

/** The ward: 1600 × 800 units. */
export const WARD_SIZE = { width: 1600, height: 800 }

export const WARD_AREAS: FloorArea[] = [
  { id: 's1', label: 'Room 1', x: 0, y: 0, width: 320, height: 330 },
  { id: 's2', label: 'Room 2', x: 320, y: 0, width: 320, height: 330 },
  { id: 's3', label: 'Room 3', x: 640, y: 0, width: 320, height: 330 },
  { id: 's4', label: 'Room 4', x: 960, y: 0, width: 320, height: 330 },
  { id: 'station', label: 'Nurses’ station', x: 1280, y: 0, width: 320, height: 330 },
  {
    id: 'corridor',
    label: 'Corridor',
    points: [
      { x: 0, y: 330 },
      { x: 1600, y: 330 },
      { x: 1600, y: 450 },
      { x: 900, y: 450 },
      { x: 900, y: 560 },
      { x: 700, y: 560 },
      { x: 700, y: 450 },
      { x: 0, y: 450 },
    ],
    labelAt: { x: 350, y: 390 },
  },
  { id: 's5', label: 'Room 5', x: 0, y: 450, width: 400, height: 350 },
  { id: 's6', label: 'Room 6', x: 400, y: 450, width: 300, height: 350 },
  {
    id: 's7',
    label: 'Room 7',
    points: [
      { x: 700, y: 560 },
      { x: 900, y: 560 },
      { x: 900, y: 450 },
      { x: 1250, y: 450 },
      { x: 1250, y: 800 },
      { x: 700, y: 800 },
    ],
    labelAt: { x: 1075, y: 490 },
  },
  { id: 'ante', label: 'Anteroom', x: 1250, y: 450, width: 150, height: 110 },
  {
    id: 's8',
    label: 'Isolation',
    points: [
      { x: 1400, y: 450 },
      { x: 1600, y: 450 },
      { x: 1600, y: 800 },
      { x: 1250, y: 800 },
      { x: 1250, y: 560 },
      { x: 1400, y: 560 },
    ],
    labelAt: { x: 1500, y: 490 },
  },
]

/** The ward's walls (doors are the gaps), sinks, the station's desk, the windows. */
export const WARD_DRAWING: PlanDrawing = {
  ...WARD_SIZE,
  walls: [
    [320, 0, 320, 330],
    [640, 0, 640, 330],
    [960, 0, 960, 330],
    [1280, 0, 1280, 330],
    [0, 330, 220, 330],
    [290, 330, 540, 330],
    [610, 330, 860, 330],
    [930, 330, 1180, 330],
    [1250, 330, 1360, 330],
    [0, 450, 300, 450],
    [370, 450, 600, 450],
    [670, 450, 700, 450],
    [400, 450, 400, 800],
    [700, 450, 700, 800],
    [700, 560, 760, 560],
    [840, 560, 900, 560],
    [900, 450, 900, 560],
    [900, 450, 1290, 450],
    [1360, 450, 1600, 450],
    [1250, 450, 1250, 800],
    [1250, 560, 1300, 560],
    [1370, 560, 1400, 560],
    [1400, 450, 1400, 560],
  ],
  fittings: [
    [260, 270, 44, 34],
    [580, 270, 44, 34],
    [900, 270, 44, 34],
    [1220, 270, 44, 34],
    [1320, 120, 240, 60],
    [20, 470, 44, 34],
    [420, 470, 44, 34],
    [1540, 700, 44, 60],
  ],
  windows: [
    [40, 5, 280, 5],
    [360, 5, 600, 5],
    [680, 5, 920, 5],
    [1000, 5, 1240, 5],
    [5, 500, 5, 760],
    [1595, 500, 1595, 760],
    [760, 795, 1200, 795],
  ],
}

export const WARD_DRAWING_URI = drawingUri(WARD_DRAWING)

/** A patient in a bed; the name is health data (masked until a reason is given). */
export interface Patient {
  name: string
  admitted: string
  doctor: string
}

/** A bed as the ward's system keeps it. */
export interface Bed {
  id: string
  number: number
  room: string
  x: number
  y: number
  state: string
  patient?: Patient
  note?: string
}

export const BEDS: readonly Bed[] = [
  bedAt(1, 's1', 40, 40, 'occupied', patient('Dragan Kovačević', '2026-10-02', 'dr Ivana Lukić')),
  bedAt(2, 's1', 200, 40, 'free'),
  bedAt(3, 's2', 360, 40, 'occupied', patient('Zorka Milić', '2026-10-04', 'dr Ivana Lukić')),
  bedAt(4, 's2', 520, 40, 'occupied', patient('Ljiljana Pavlov', '2026-10-05', 'dr Petar Ristić')),
  bedAt(5, 's3', 680, 40, 'cleaning', undefined, 'Discharged at 10:20'),
  bedAt(6, 's3', 840, 40, 'occupied', patient('Milan Tadić', '2026-09-30', 'dr Petar Ristić')),
  bedAt(7, 's4', 1000, 40, 'free'),
  bedAt(
    8,
    's4',
    1160,
    40,
    'blocked',
    undefined,
    'Oxygen outlet faulty; maintenance on 07.10.2026.',
  ),
  bedAt(9, 's5', 30, 600, 'occupied', patient('Vesna Radović', '2026-10-03', 'dr Ivana Lukić')),
  bedAt(10, 's5', 160, 600, 'occupied', patient('Stevan Jakšić', '2026-10-05', 'dr Petar Ristić')),
  bedAt(11, 's5', 290, 600, 'free'),
  bedAt(12, 's6', 450, 600, 'occupied', patient('Gordana Ilić', '2026-10-01', 'dr Ivana Lukić')),
  bedAt(13, 's6', 580, 600, 'cleaning'),
  bedAt(14, 's7', 760, 610, 'occupied', patient('Nikola Vuković', '2026-10-06', 'dr Petar Ristić')),
  bedAt(15, 's7', 960, 610, 'free'),
  bedAt(16, 's7', 1100, 610, 'occupied', patient('Ana Bogdanović', '2026-10-04', 'dr Ivana Lukić')),
  bedAt(
    17,
    's8',
    1450,
    600,
    'occupied',
    patient('Radomir Šećerov', '2026-10-05', 'dr Petar Ristić'),
    'Contact precautions: gown and gloves in the anteroom',
  ),
]

function patient(name: string, admitted: string, doctor: string): Patient {
  return { name, admitted, doctor }
}

function bedAt(
  number: number,
  room: string,
  x: number,
  y: number,
  state: string,
  who?: Patient,
  note?: string,
): Bed {
  return {
    id: `b${String(number)}`,
    number,
    room,
    x,
    y,
    state,
    ...(who === undefined ? {} : { patient: who }),
    ...(note === undefined ? {} : { note }),
  }
}

/** The beds on the plan: "Bed 9", its number, its state and note — never the patient. */
export function bedItems(beds: readonly Bed[]): FloorItem[] {
  return beds.map((bed) => ({
    id: bed.id,
    kind: 'place',
    label: `Bed ${String(bed.number)}`,
    shortLabel: String(bed.number),
    x: bed.x,
    y: bed.y,
    width: 80,
    height: 170,
    areaId: bed.room,
    stateId: bed.state,
    ...(bed.note === undefined ? {} : { note: bed.note }),
  }))
}

/**
 * The patients waiting for a bed on the ward (the admissions office's list): by case number, where
 * they come from and their doctor; the name is health data, written in the bed once admitted.
 */
export interface Admission {
  id: string
  number: string
  from: string
  since: string
  patient: Patient
}

export const ADMISSIONS: readonly Admission[] = [
  {
    id: 'p1187',
    number: 'P-2026-1187',
    from: 'Emergency',
    since: '09:40',
    patient: patient('Milena Babić', '2026-10-06', 'dr Petar Ristić'),
  },
  {
    id: 'p1192',
    number: 'P-2026-1192',
    from: 'Cardiology outpatients',
    since: '11:15',
    patient: patient('Đorđe Lazić', '2026-10-06', 'dr Ivana Lukić'),
  },
]

/** The reasons a nurse may give to see a patient's name (the hospital's list). */
export const NAME_REASONS = [
  { value: 'care', label: 'I am caring for this patient on my shift' },
  { value: 'handover', label: 'Shift handover' },
  { value: 'transfer', label: 'Preparing a transfer the doctor asked for' },
]

// ── The office ────────────────────────────────────────────────────────────────────────────────

export const OFFICE = {
  name: 'Kvadrat Gradnja d.o.o.',
  floor: 'Bulevar oslobođenja 88, floor 2',
  me: 'Milica Petrović',
}

/** The desks' states on a day: the office's map. */
export const DESK_STATES: FloorState[] = [
  { id: 'free', label: 'Free', tone: 'success', icon: CircleCheck },
  { id: 'booked', label: 'Booked', tone: 'neutral', icon: UserRound },
  { id: 'mine', label: 'Your booking', tone: 'premium', icon: Armchair },
  { id: 'out', label: 'Out of use', tone: 'danger', icon: Wrench },
]

/** The floor: 1400 × 800 units. */
export const OFFICE_SIZE = { width: 1400, height: 800 }

export const OFFICE_AREAS: FloorArea[] = [
  {
    id: 'open',
    label: 'Open space',
    points: [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 420 },
      { x: 700, y: 420 },
      { x: 700, y: 800 },
      { x: 0, y: 800 },
    ],
    labelAt: { x: 90, y: 30 },
  },
  { id: 'dunav', label: 'Meeting room Dunav', x: 1000, y: 0, width: 400, height: 300 },
  { id: 'quiet', label: 'Quiet room', x: 1000, y: 300, width: 400, height: 240 },
  { id: 'kitchen', label: 'Kitchen', x: 700, y: 420, width: 300, height: 380 },
  { id: 'tisa', label: 'Meeting room Tisa', x: 1000, y: 540, width: 400, height: 260 },
]

/** The office's walls (doors are the gaps), columns, the kitchen counter, the windows. */
export const OFFICE_DRAWING: PlanDrawing = {
  ...OFFICE_SIZE,
  walls: [
    [1000, 0, 1000, 180],
    [1000, 250, 1000, 380],
    [1000, 450, 1000, 640],
    [1000, 710, 1000, 800],
    [1000, 300, 1400, 300],
    [1000, 540, 1400, 540],
    [700, 420, 1000, 420],
    [700, 420, 700, 560],
    [700, 640, 700, 800],
  ],
  fittings: [
    [340, 380, 30, 30],
    [660, 120, 30, 30],
    [740, 720, 240, 56],
    [1080, 100, 240, 100],
    [1080, 620, 240, 100],
  ],
  windows: [
    [60, 5, 940, 5],
    [1060, 5, 1340, 5],
    [1395, 60, 1395, 740],
    [5, 60, 5, 740],
  ],
}

export const OFFICE_DRAWING_URI = drawingUri(OFFICE_DRAWING)

/** A desk: its number, where it stands, what it has, and whether it is out of use. */
export interface Desk {
  id: string
  number: number
  area: string
  x: number
  y: number
  equipment: string
  outOfUse?: string
}

/** Two rows of desks facing each other, 120 × 70 units each. */
function cluster(first: number, x: number, y: number, equipment: readonly string[]): Desk[] {
  return [0, 1, 2, 3].map((index) => ({
    id: `d${String(first + index)}`,
    number: first + index,
    area: 'open',
    x: x + (index % 2) * 120,
    y: y + Math.floor(index / 2) * 70,
    equipment: equipment[index % equipment.length] ?? '',
  }))
}

const MONITORS = ['Two monitors, docking station', 'One monitor, docking station']

export const DESKS: readonly Desk[] = [
  ...cluster(1, 80, 90, MONITORS),
  ...cluster(5, 420, 90, MONITORS),
  ...cluster(9, 80, 290, MONITORS),
  ...cluster(13, 420, 520, MONITORS).map((desk) =>
    desk.number === 14
      ? { ...desk, outOfUse: 'The chair is broken; a new one comes on Thursday.' }
      : desk,
  ),
  ...cluster(17, 80, 560, ['Standing desk, one monitor']),
  { id: 'd21', number: 21, area: 'quiet', x: 1060, y: 360, equipment: 'One monitor, no calls' },
  { id: 'd22', number: 22, area: 'quiet', x: 1240, y: 360, equipment: 'One monitor, no calls' },
]

/** Who booked which desk on which day (the office's bookings), Milica's marked as hers. */
export const DESK_BOOKINGS: Record<string, Record<string, string>> = {
  // Today, Tuesday.
  '2026-10-06': {
    d1: 'Stefan Nikolić',
    d2: 'Jovana Lazić',
    d3: OFFICE.me,
    d4: 'Marko Simić',
    d5: 'Ivana Đurić',
    d6: 'Petar Vasić',
    d9: 'Tamara Kostić',
    d10: 'Nemanja Pešić',
    d13: 'Dejan Matić',
    d17: 'Sanja Babić',
    d18: 'Aleksandar Popović',
    d21: 'Katarina Ivanović',
  },
  '2026-10-07': {
    d1: 'Stefan Nikolić',
    d5: 'Ivana Đurić',
    d9: 'Tamara Kostić',
    d17: 'Sanja Babić',
  },
  '2026-10-08': {
    d2: 'Jovana Lazić',
    d3: OFFICE.me,
    d6: 'Petar Vasić',
    d10: 'Nemanja Pešić',
    d11: 'Milan Stojanović',
    d22: 'Katarina Ivanović',
  },
  '2026-10-09': { d4: 'Marko Simić', d18: 'Aleksandar Popović' },
  '2026-10-12': {
    d1: 'Stefan Nikolić',
    d2: 'Jovana Lazić',
    d3: OFFICE.me,
    d5: 'Ivana Đurić',
    d9: 'Tamara Kostić',
  },
}

/** "Stefan N.": a colleague's name as it fits on a desk. */
export function shortName(name: string): string {
  const [first = '', ...rest] = name.split(' ')
  const last = rest.at(-1)
  return last === undefined ? first : `${first} ${last.slice(0, 1)}.`
}

/** The desks on a day, as the plan draws them. */
export function deskItems(
  desks: readonly Desk[],
  booked: Readonly<Record<string, string>>,
): FloorItem[] {
  return desks.map((desk) => {
    const who = booked[desk.id]
    const state =
      desk.outOfUse !== undefined
        ? 'out'
        : who === undefined
          ? 'free'
          : who === OFFICE.me
            ? 'mine'
            : 'booked'
    return {
      id: desk.id,
      kind: 'place',
      label: `Desk ${String(desk.number)}`,
      shortLabel: String(desk.number),
      x: desk.x,
      y: desk.y,
      width: 120,
      height: 70,
      areaId: desk.area,
      stateId: state,
      ...(who === undefined || who === OFFICE.me ? {} : { detail: shortName(who) }),
      ...(desk.outOfUse === undefined ? {} : { note: desk.outOfUse }),
    }
  })
}
