/*
 * Story data of FloorPlan's follow-up (P5.25a): fictitious. A hospital ward's floor drawn under
 * the plan (the building's own drawing as an image), with rooms as rectangles and polygons, beds
 * in their states; and a store room's bins with how full each is. The states, their words, tones
 * and icons are the application's map. Not part of the package: nothing in src/index.ts imports
 * this file. No classes here: Storybook compiles classes only from *.stories.tsx files.
 *
 * The drawings are SVG built here and passed as `data:` URIs, so a picture never waits for the
 * network and is the same every time. Their lines are `currentColor` (black in an image); the
 * dark version sets the colour to white on its root.
 */
import {
  Ban,
  BedSingle,
  Package,
  PackageCheck,
  PackageMinus,
  Sparkles,
  UserRound,
} from 'lucide-react'
import type { FloorBackground, FloorState } from './floor-plan'
import type { FloorArea, FloorItem } from './floor-plan-logic'

// ── A building's drawing ─────────────────────────────────────────────────────────────────────

/** A wall from one point to another, in plan units. */
export type WallLine = readonly [x1: number, y1: number, x2: number, y2: number]

/** A building's drawing: its outer wall, inner walls (doors are the gaps) and fittings. */
export interface PlanDrawing {
  width: number
  height: number
  /** Inner walls, drawn 6 units thick. */
  walls: readonly WallLine[]
  /** Fittings (a sink, a counter, a column), drawn as thin rectangles: x, y, width, height. */
  fittings?: readonly (readonly [number, number, number, number])[]
  /** Windows in the outer wall, as thin double lines: x1, y1, x2, y2. */
  windows?: readonly WallLine[]
}

/**
 * The drawing as an SVG `data:` URI. `light` draws white lines (an application's own image for
 * the dark theme); otherwise black lines on nothing (transparent), as an architect's plan.
 */
export function drawingUri(drawing: PlanDrawing, light = false): string {
  const line = ([x1, y1, x2, y2]: WallLine, width: number) =>
    `<line x1="${String(x1)}" y1="${String(y1)}" x2="${String(x2)}" y2="${String(y2)}" stroke-width="${String(width)}"/>`
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(drawing.width)} ${String(drawing.height)}" width="${String(drawing.width)}" height="${String(drawing.height)}"${light ? ' color="white"' : ''}>`,
    '<g fill="none" stroke="currentColor" stroke-linecap="square">',
    `<rect x="5" y="5" width="${String(drawing.width - 10)}" height="${String(drawing.height - 10)}" stroke-width="10"/>`,
    ...drawing.walls.map((wall) => line(wall, 6)),
    ...(drawing.fittings ?? []).map(
      ([x, y, width, height]) =>
        `<rect x="${String(x)}" y="${String(y)}" width="${String(width)}" height="${String(height)}" stroke-width="2"/>`,
    ),
    '</g>',
    '<g fill="none" stroke="currentColor" stroke-width="2">',
    ...(drawing.windows ?? []).flatMap(([x1, y1, x2, y2]) => {
      const vertical = x1 === x2
      return [
        line(vertical ? [x1 - 4, y1, x2 - 4, y2] : [x1, y1 - 4, x2, y2 - 4], 2),
        line(vertical ? [x1 + 4, y1, x2 + 4, y2] : [x1, y1 + 4, x2, y2 + 4], 2),
      ]
    }),
    '</g>',
    '</svg>',
  ]
  return `data:image/svg+xml,${encodeURIComponent(parts.join(''))}`
}

// ── Ward 3B: rooms and beds over the building's drawing ──────────────────────────────────────

/** The beds' states, as the hospital's application maps them. */
export const WARD_STATES: FloorState[] = [
  { id: 'free', label: 'Free', tone: 'success', icon: BedSingle },
  { id: 'occupied', label: 'Occupied', tone: 'neutral', icon: UserRound },
  { id: 'cleaning', label: 'Needs cleaning', tone: 'warning', icon: Sparkles },
  { id: 'blocked', label: 'Blocked', tone: 'danger', icon: Ban },
]

/** The ward: 1200 × 700 units (centimetres would make it 12 × 7 m; the units are the plan's). */
export const WARD_SIZE = { width: 1200, height: 700 }

/** The rooms: four rectangles, the corridor with its lobby and room 5 round it as polygons. */
export const WARD_AREAS: FloorArea[] = [
  { id: 'r1', label: 'Room 1', x: 0, y: 0, width: 300, height: 300 },
  { id: 'r2', label: 'Room 2', x: 300, y: 0, width: 300, height: 300 },
  { id: 'r3', label: 'Room 3', x: 600, y: 0, width: 300, height: 300 },
  { id: 'station', label: 'Nurses’ station', x: 900, y: 0, width: 300, height: 300 },
  {
    id: 'corridor',
    label: 'Corridor',
    points: [
      { x: 0, y: 300 },
      { x: 1200, y: 300 },
      { x: 1200, y: 400 },
      { x: 700, y: 400 },
      { x: 700, y: 520 },
      { x: 500, y: 520 },
      { x: 500, y: 400 },
      { x: 0, y: 400 },
    ],
  },
  { id: 'r4', label: 'Room 4', x: 0, y: 400, width: 500, height: 300 },
  {
    id: 'r5',
    label: 'Room 5',
    points: [
      { x: 500, y: 520 },
      { x: 700, y: 520 },
      { x: 700, y: 400 },
      { x: 1000, y: 400 },
      { x: 1000, y: 700 },
      { x: 500, y: 700 },
    ],
    labelAt: { x: 850, y: 440 },
  },
  { id: 'r6', label: 'Isolation', x: 1000, y: 400, width: 200, height: 300 },
]

/** The ward's walls: the rooms' walls with their doors as gaps. */
export const WARD_DRAWING: PlanDrawing = {
  ...WARD_SIZE,
  walls: [
    [300, 0, 300, 300],
    [600, 0, 600, 300],
    [900, 0, 900, 300],
    [0, 300, 200, 300],
    [260, 300, 500, 300],
    [560, 300, 800, 300],
    [860, 300, 1000, 300],
    [1060, 300, 1200, 300],
    [0, 400, 380, 400],
    [440, 400, 500, 400],
    [500, 400, 500, 700],
    [500, 520, 600, 520],
    [660, 520, 700, 520],
    [700, 400, 700, 520],
    [700, 400, 1000, 400],
    [1000, 400, 1000, 700],
    [1000, 400, 1080, 400],
    [1140, 400, 1200, 400],
  ],
  fittings: [
    [240, 240, 40, 30],
    [540, 240, 40, 30],
    [840, 240, 40, 30],
    [940, 120, 220, 50],
    [20, 420, 40, 30],
    [1140, 620, 40, 50],
  ],
  windows: [
    [40, 5, 260, 5],
    [340, 5, 560, 5],
    [640, 5, 860, 5],
    [5, 440, 5, 660],
    [1195, 440, 1195, 660],
  ],
}

/** The drawing under the ward's plan; `srcDark` only in the story that shows it. */
export const WARD_BACKGROUND: FloorBackground = { src: drawingUri(WARD_DRAWING) }
export const WARD_BACKGROUND_DARK = drawingUri(WARD_DRAWING, true)

/** A bed: 70 × 140 units, named "Bed 7" and "7" on the plan. */
function bed(
  number: number,
  x: number,
  y: number,
  areaId: string,
  stateId: string,
  extra: Partial<FloorItem> = {},
): FloorItem {
  return {
    id: `b${String(number)}`,
    kind: 'place',
    label: `Bed ${String(number)}`,
    shortLabel: String(number),
    x,
    y,
    width: 70,
    height: 140,
    areaId,
    stateId,
    ...extra,
  }
}

export const WARD_ITEMS: FloorItem[] = [
  bed(1, 40, 40, 'r1', 'occupied'),
  bed(2, 190, 40, 'r1', 'free'),
  bed(3, 340, 40, 'r2', 'occupied'),
  bed(4, 490, 40, 'r2', 'occupied'),
  bed(5, 640, 40, 'r3', 'cleaning', { note: 'Discharged at 10:20' }),
  bed(6, 790, 40, 'r3', 'occupied'),
  bed(7, 40, 540, 'r4', 'free'),
  bed(8, 150, 540, 'r4', 'occupied'),
  bed(9, 260, 540, 'r4', 'occupied'),
  bed(10, 370, 540, 'r4', 'blocked', { note: 'Oxygen outlet faulty; maintenance on 07.10.' }),
  bed(11, 560, 545, 'r5', 'free'),
  bed(12, 740, 545, 'r5', 'occupied'),
  bed(13, 860, 545, 'r5', 'cleaning'),
  bed(14, 1065, 520, 'r6', 'occupied', { note: 'Contact precautions' }),
]

// ── A store room: bins and how full they are ─────────────────────────────────────────────────

/** The bins' states: the store's map, worked out by its application from the stock. */
export const BIN_STATES: FloorState[] = [
  { id: 'stock', label: 'In stock', tone: 'success', icon: PackageCheck },
  { id: 'low', label: 'Low', tone: 'warning', icon: PackageMinus },
  { id: 'empty', label: 'Empty', tone: 'neutral', icon: Package },
  { id: 'blocked', label: 'Blocked', tone: 'danger', icon: Ban },
]

export const BIN_SIZE = { width: 1000, height: 500 }

/** Zone A a rectangle, zone B an L round the bulk bay. */
export const BIN_AREAS: FloorArea[] = [
  { id: 'za', label: 'Zone A', x: 0, y: 0, width: 480, height: 500 },
  {
    id: 'zb',
    label: 'Zone B',
    points: [
      { x: 500, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 500 },
      { x: 760, y: 500 },
      { x: 760, y: 260 },
      { x: 500, y: 260 },
    ],
    labelAt: { x: 560, y: 24 },
  },
]

/** How full each bin is, in the order of the bins (the application's percentages). */
const LEVELS = ['85', '60', '15', '0', '100', '42.5', '70', '8', '95', '55', '30', '0']

/** The levels the store calls low (its own rule: under 20%). */
const LOW = ['15', '8']

/** A rack's six bins in a row, 70 × 70 units each: "A-01-03", how full, its state. */
function rack(rack: string, x: number, y: number, areaId: string, offset: number): FloorItem[] {
  return Array.from({ length: 6 }, (_, index) => {
    const code = `${rack}-${String(index + 1).padStart(2, '0')}`
    const percent = LEVELS[(offset + index) % LEVELS.length] ?? '0'
    const stateId = percent === '0' ? 'empty' : LOW.includes(percent) ? 'low' : 'stock'
    return {
      id: code,
      kind: 'place',
      label: code,
      shortLabel: String(index + 1).padStart(2, '0'),
      x: x + index * 70,
      y,
      width: 70,
      height: 70,
      areaId,
      stateId,
      level: { percent },
    }
  })
}

export const BIN_ITEMS: FloorItem[] = [
  ...rack('A-01', 40, 60, 'za', 0),
  ...rack('A-02', 40, 200, 'za', 3),
  ...rack('A-03', 40, 340, 'za', 6),
  ...rack('B-01', 540, 60, 'zb', 2),
  ...rack('B-02', 540, 160, 'zb', 7).map((item) =>
    item.id === 'B-02-04'
      ? {
          ...item,
          stateId: 'blocked',
          level: { percent: '40', label: 'About 40% full' },
          note: 'Shelf damaged by a forklift',
        }
      : item,
  ),
  {
    id: 'B-BULK',
    kind: 'place',
    label: 'Bulk bay B',
    shortLabel: 'Bulk',
    x: 800,
    y: 300,
    width: 160,
    height: 160,
    areaId: 'zb',
    stateId: 'stock',
    level: { percent: '62.5' },
    detail: '4 pallets',
  },
]
