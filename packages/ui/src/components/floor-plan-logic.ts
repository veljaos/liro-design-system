/*
 * The logic of FloorPlan (P5.25), apart from the markup so it can be unit-tested (AGENTS.md C7):
 * an item's footprint after a rotation, the item an arrow key goes to, a move by the keys,
 * snapping and keeping inside the plan, resizing a turned item, the zoom steps, overlapping items
 * and the groups of the list view.
 *
 * Geometry is in plan units, the application's own (centimetres, grid squares): whole numbers the
 * plan draws and moves. They are positions, not figures: the plan never adds them into a total
 * (D4 is about amounts and quantities, which stay decimal strings).
 *
 * The plan is a physical place: x grows to the right and y downwards in every writing direction.
 * A right-to-left page does not mirror it (the room does not turn round), so ArrowRight always
 * moves to the right on the plan.
 */

/**
 * What an item is; the application names it (`label`). Fixtures are drawn, not chosen. `place`
 * is any other place to choose (P5.25a): a storage bin, a bed, a desk, a parking space.
 *
 * P5.28 item 23 (the owner: "walls, doors and windows confuse; simplicity first"): there are no
 * walls, doors or windows. A plan is its areas (plain labelled regions) and the things people
 * choose or choose around (tables, seats, rooms, places, the bar, a counter, a stage); a real
 * building plan, when the application has one, is the `background` image (P5.25a).
 */
export type FloorItemKind = 'table' | 'seat' | 'room' | 'place' | 'bar' | 'counter' | 'stage'

/**
 * The kinds drawn as labelled furniture people choose around (a stage, a counter): drawn, chosen
 * only in edit mode.
 */
export const FIXTURE_KINDS: readonly FloorItemKind[] = ['stage', 'counter']

/** Quarter turns, clockwise. */
export type FloorRotation = 0 | 90 | 180 | 270

/** A box on the plan, in plan units: its top-left corner and its size. */
export interface FloorBox {
  x: number
  y: number
  width: number
  height: number
}

/** What the geometry needs of an item. */
export interface FloorGeometry extends FloorBox {
  id: string
  rotation?: FloorRotation
}

/** Whether an item is a fixture (a stage, a counter). */
export function isFixture(item: { kind: FloorItemKind }): boolean {
  return FIXTURE_KINDS.includes(item.kind)
}

/**
 * The box an item covers once turned: a quarter turn (90° or 270°) swaps its width and height
 * around the same centre; a half turn covers the same box (it turns what is drawn in it: the
 * order of the seats round a table).
 */
export function footprint(item: FloorGeometry): FloorBox {
  const quarter = item.rotation === 90 || item.rotation === 270
  if (!quarter) return { x: item.x, y: item.y, width: item.width, height: item.height }
  const cx = item.x + item.width / 2
  const cy = item.y + item.height / 2
  return { x: cx - item.height / 2, y: cy - item.width / 2, width: item.height, height: item.width }
}

/** The next quarter turn, clockwise. */
export function nextRotation(rotation: FloorRotation | undefined): FloorRotation {
  return (((rotation ?? 0) + 90) % 360) as FloorRotation
}

/** The centre of an item's footprint. */
export function centreOf(item: FloorGeometry): { x: number; y: number } {
  const box = footprint(item)
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

/**
 * The items in reading order of the plan: by rows from the top, then from the left (on the
 * plan, never mirrored). Two items whose centres are less than `rowTolerance` units apart
 * vertically stand in one row.
 */
export function readingOrder<Item extends FloorGeometry>(
  items: readonly Item[],
  rowTolerance = 20,
): Item[] {
  return [...items].sort((a, b) => {
    const ca = centreOf(a)
    const cb = centreOf(b)
    if (Math.abs(ca.y - cb.y) >= rowTolerance) return ca.y - cb.y
    return ca.x - cb.x
  })
}

/** The four arrow keys. */
export type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

export function isArrowKey(key: string): key is ArrowKey {
  return key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight'
}

/**
 * The item an arrow key goes to from `fromId`: among the items whose centre lies in that
 * physical direction, the nearest — the distance along the arrow plus twice the distance across
 * it, so an item straight ahead wins over a closer one far to the side. Null when nothing lies
 * that way.
 */
export function nearestItem(
  items: readonly FloorGeometry[],
  fromId: string,
  key: ArrowKey,
): string | null {
  const from = items.find((item) => item.id === fromId)
  if (from === undefined) return null
  const origin = centreOf(from)
  let best: { id: string; score: number } | null = null
  for (const item of items) {
    if (item.id === fromId) continue
    const centre = centreOf(item)
    const dx = centre.x - origin.x
    const dy = centre.y - origin.y
    const along =
      key === 'ArrowRight' ? dx : key === 'ArrowLeft' ? -dx : key === 'ArrowDown' ? dy : -dy
    const across = key === 'ArrowRight' || key === 'ArrowLeft' ? Math.abs(dy) : Math.abs(dx)
    if (along <= 0) continue
    const score = along + 2 * across
    if (best === null || score < best.score) best = { id: item.id, score }
  }
  return best?.id ?? null
}

/** How far one arrow press moves a picked-up item: 1 unit, with Shift 5. */
export const NUDGE = 1
export const NUDGE_LARGE = 5

/**
 * Where an arrow key moves a picked-up item (physical directions), kept inside the plan.
 * Null for any other key.
 */
export function nudge(
  item: FloorGeometry,
  key: string,
  large: boolean,
  plan: { width: number; height: number },
): { x: number; y: number } | null {
  if (!isArrowKey(key)) return null
  const step = large ? NUDGE_LARGE : NUDGE
  const dx = key === 'ArrowRight' ? step : key === 'ArrowLeft' ? -step : 0
  const dy = key === 'ArrowDown' ? step : key === 'ArrowUp' ? -step : 0
  return keepInside(item, item.x + dx, item.y + dy, plan)
}

/** A value on the grid: the nearest multiple of `grid` (no grid: the nearest whole unit). */
export function snap(value: number, grid: number | undefined): number {
  if (grid === undefined || grid <= 0) return Math.round(value)
  return Math.round(value / grid) * grid
}

/**
 * The position (`x`, `y`: the item's own box, unturned) that keeps the item's footprint inside
 * the plan, as close as possible to the one asked for.
 */
export function keepInside(
  item: FloorGeometry,
  x: number,
  y: number,
  plan: { width: number; height: number },
): { x: number; y: number } {
  const box = footprint({ ...item, x, y })
  const offsetX = box.x - x
  const offsetY = box.y - y
  const boxX = Math.min(Math.max(box.x, 0), Math.max(0, plan.width - box.width))
  const boxY = Math.min(Math.max(box.y, 0), Math.max(0, plan.height - box.height))
  return { x: boxX - offsetX, y: boxY - offsetY }
}

/**
 * The position after dragging the item by (`dx`, `dy`) plan units: its footprint's corner snapped
 * to the grid, kept inside the plan.
 */
export function dragPosition(
  item: FloorGeometry,
  dx: number,
  dy: number,
  grid: number | undefined,
  plan: { width: number; height: number },
): { x: number; y: number } {
  const box = footprint(item)
  const offsetX = box.x - item.x
  const offsetY = box.y - item.y
  const x = snap(box.x + dx, grid) - offsetX
  const y = snap(box.y + dy, grid) - offsetY
  return keepInside(item, x, y, plan)
}

/** The smallest an item can be made, in plan units. */
export const MIN_ITEM_SIZE = 5

/**
 * The item's own box for a footprint of `width` × `height` whose top-left corner stays where it
 * is: a quarter-turned item has its width and height swapped, and its own corner moves so the
 * turned footprint keeps its corner. Each side at least MIN_ITEM_SIZE, snapped to the grid.
 */
export function resizeFootprint(
  item: FloorGeometry,
  width: number,
  height: number,
  grid: number | undefined,
): FloorBox {
  const w = Math.max(MIN_ITEM_SIZE, snap(width, grid))
  const h = Math.max(MIN_ITEM_SIZE, snap(height, grid))
  const corner = footprint(item)
  const quarter = item.rotation === 90 || item.rotation === 270
  if (!quarter) return { x: item.x, y: item.y, width: w, height: h }
  // A quarter-turned item of width h and height w covers w × h around its centre.
  return { x: corner.x + w / 2 - h / 2, y: corner.y + h / 2 - w / 2, width: h, height: w }
}

/** Whether two boxes share some area (touching edges do not overlap). */
export function boxesOverlap(a: FloorBox, b: FloorBox): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

/**
 * The pairs of items whose footprints overlap, for the application's warnings (the plan allows
 * overlapping items and shows the warnings it is given). Each pair once, in the items' order.
 */
export function overlappingItems(items: readonly FloorGeometry[]): [string, string][] {
  const pairs: [string, string][] = []
  items.forEach((a, index) => {
    for (const b of items.slice(index + 1)) {
      if (boxesOverlap(footprint(a), footprint(b))) pairs.push([a.id, b.id])
    }
  })
  return pairs
}

/** The smallest a chosen target may be drawn, in pixels (WCAG 2.5.8). */
export const MIN_TARGET = 24

/**
 * The width in pixels below which the plan would draw its smallest target under 24px: the plan
 * scrolls sideways inside its box instead of shrinking further (a phone's plan view).
 */
export function minimumPlanWidth(
  targets: readonly FloorGeometry[],
  planWidth: number,
  minTarget = MIN_TARGET,
): number {
  let smallest = Number.POSITIVE_INFINITY
  for (const item of targets) {
    const box = footprint(item)
    smallest = Math.min(smallest, box.width, box.height)
  }
  if (!Number.isFinite(smallest) || smallest <= 0) return 0
  return Math.ceil((planWidth * minTarget) / smallest)
}

/** The zoom steps: 1 is the plan fitted to its width. */
export const PLAN_ZOOM_STEPS: readonly number[] = [1, 1.5, 2, 3]

/** The next zoom step in (+1) or out (−1); the same one at either end. */
export function planZoomStep(zoom: number, change: 1 | -1): number {
  const index = PLAN_ZOOM_STEPS.findIndex((step) => step >= zoom - 1e-9)
  const at = index === -1 ? PLAN_ZOOM_STEPS.length - 1 : index
  const next = Math.min(PLAN_ZOOM_STEPS.length - 1, Math.max(0, at + change))
  return PLAN_ZOOM_STEPS[next] ?? 1
}

/** A group of the list view: an area (or the application's own group) and its items in order. */
export interface FloorListGroup<Item> {
  id: string
  label: string
  items: Item[]
}

/**
 * The list view's groups: by area in the areas' order, the items of each in reading order; items
 * of no known area last, under `otherLabel`. Empty groups are left out.
 */
export function listGroups<Item extends FloorGeometry & { areaId?: string | undefined }>(
  items: readonly Item[],
  areas: readonly { id: string; label: string }[],
  otherLabel: string,
): FloorListGroup<Item>[] {
  const known = new Set(areas.map((area) => area.id))
  const groups: FloorListGroup<Item>[] = areas.map((area) => ({
    id: area.id,
    label: area.label,
    items: readingOrder(items.filter((item) => item.areaId === area.id)),
  }))
  groups.push({
    id: '',
    label: otherLabel,
    items: readingOrder(
      items.filter((item) => item.areaId === undefined || !known.has(item.areaId)),
    ),
  })
  return groups.filter((group) => group.items.length > 0)
}

/**
 * A box as percentages of the part of the plan drawn (the whole plan, or one area's `frame` with
 * its own corner, P5.28), for drawing: the plan scales to its width.
 */
export function percentBox(
  box: FloorBox,
  plan: { x?: number; y?: number; width: number; height: number },
): { left: string; top: string; width: string; height: string } {
  const percent = (value: number, of: number) => `${String((value / of) * 100)}%`
  return {
    left: percent(box.x - (plan.x ?? 0), plan.width),
    top: percent(box.y - (plan.y ?? 0), plan.height),
    width: percent(box.width, plan.width),
    height: percent(box.height, plan.height),
  }
}

// ── Items and changes ────────────────────────────────────────────────────────────────────────

/** An item on the plan, from the application. */
export interface FloorItem extends FloorGeometry {
  kind: FloorItemKind
  /** Round or rectangular (tables, rooms). Seats are round. Default: rectangular. */
  shape?: 'round' | 'rect'
  /** The item's name ("Table 7", "Room 204"): its accessible name starts with it. */
  label: string
  /** What is written on the plan when the name is long ("7"). Default: `label`. */
  shortLabel?: string
  /**
   * A line from the application about the item now ("19:30 · 4 guests"): in the list and the
   * item's name. Not written on the plan (P5.28 item 24: a label on the plan is never cut).
   */
  detail?: string
  /**
   * The short second line written on the plan under the name and state (P5.28 item 24: the
   * guests, "4 guests"). Never cut: where the item is too small for it, the plan leaves it out
   * (the list and the name say `detail`). Default none.
   */
  planDetail?: string
  /** How many people it takes; shown with its noun ("4 seats"). */
  capacity?: number
  /** The area it stands in (an id of `areas`). */
  areaId?: string
  /** Its state (an id of `states`): the tone, the icon and the words. */
  stateId?: string
  /** A note from the application ("By the window"), in the list and the name. */
  note?: string
  /** How full it is (P5.25a): a percentage from the application, shown in words and a bar. */
  level?: FloorLevel
}

/**
 * How full an item is (a storage bin, a car park): `percent` is the application's percentage as a
 * decimal string ("62.5"), never computed by the plan; the words default to
 * `floorPlan.level` ("62,5% full"), or the application's own `label`.
 */
export interface FloorLevel {
  percent: string
  label?: string
}

/** A new item: everything but the id, which the application gives. */
export type FloorItemDraft = Omit<FloorItem, 'id'>

/**
 * A change made in edit mode, reported to the application (which applies it, or not): an item
 * added (without an id), moved, resized (a quarter-turned item's corner moves with its size),
 * turned (kept inside the plan, so its position may change too) or removed.
 */
export type FloorChange =
  | { type: 'add'; item: FloorItemDraft }
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'resize'; id: string; x: number; y: number; width: number; height: number }
  | { type: 'rotate'; id: string; rotation: FloorRotation; x: number; y: number }
  | { type: 'remove'; id: string }

/**
 * The items after the changes, for an application that keeps its plan as the list of items
 * (KanbanBoard's `moveCard` is the same help): an added item takes the id `newId` gives it and
 * goes last; unknown ids change nothing.
 */
export function applyFloorChanges(
  items: readonly FloorItem[],
  changes: readonly FloorChange[],
  newId: (item: FloorItemDraft, index: number) => string,
): FloorItem[] {
  let result = [...items]
  changes.forEach((change, index) => {
    switch (change.type) {
      case 'add':
        result.push({ ...change.item, id: newId(change.item, index) })
        break
      case 'remove':
        result = result.filter((item) => item.id !== change.id)
        break
      case 'move':
        result = result.map((item) =>
          item.id === change.id ? { ...item, x: change.x, y: change.y } : item,
        )
        break
      case 'resize':
        result = result.map((item) =>
          item.id === change.id
            ? { ...item, x: change.x, y: change.y, width: change.width, height: change.height }
            : item,
        )
        break
      case 'rotate':
        result = result.map((item) =>
          item.id === change.id
            ? { ...item, rotation: change.rotation, x: change.x, y: change.y }
            : item,
        )
        break
    }
  })
  return result
}

/** The item turned a quarter clockwise, kept inside the plan. */
export function rotateChange(
  item: FloorGeometry,
  plan: { width: number; height: number },
): { rotation: FloorRotation; x: number; y: number } {
  const rotation = nextRotation(item.rotation)
  const position = keepInside({ ...item, rotation }, item.x, item.y, plan)
  return { rotation, ...position }
}

/** A copy of the item one grid step (else 10 units) down and to the right, inside the plan. */
export function duplicateDraft(
  item: FloorItem,
  grid: number | undefined,
  plan: { width: number; height: number },
): FloorItemDraft {
  const draft: FloorItemDraft & { id?: string } = { ...item }
  delete draft.id
  const step = grid !== undefined && grid > 0 ? grid : 10
  return { ...draft, ...keepInside(item, item.x + step, item.y + step, plan) }
}

/** Where an item added from the palette goes: the plan's centre, on the grid. */
export function addedPosition(
  size: { width: number; height: number },
  grid: number | undefined,
  plan: { width: number; height: number },
): { x: number; y: number } {
  const item = { id: '', x: 0, y: 0, ...size }
  return keepInside(
    item,
    snap((plan.width - size.width) / 2, grid),
    snap((plan.height - size.height) / 2, grid),
    plan,
  )
}

// ── P5.25a: polygon areas, the level ─────────────────────────────────────────────────────────

/** A point on the plan, in plan units. */
export interface FloorPoint {
  x: number
  y: number
}

interface FloorAreaCommon {
  id: string
  /** The area's name, written on the plan and heading its group in the list. */
  label: string
}

/** A rectangular area: its box in plan units; its name in its top-start corner. */
export interface FloorRectArea extends FloorAreaCommon, FloorBox {
  points?: undefined
  labelAt?: undefined
}

/**
 * An area of any outline (P5.25a: a room that is not a rectangle, a corridor): its corners in plan
 * units, in order round it. Its name is centred on `labelAt`, else on the outline's centroid.
 */
export interface FloorPolygonArea extends FloorAreaCommon {
  points: readonly FloorPoint[]
  labelAt?: FloorPoint
}

/** A labelled region of the plan (a hall, the terrace, floor 2, a ward room), from the application. */
export type FloorArea = FloorRectArea | FloorPolygonArea

/** Whether an area is drawn by its outline. */
export function isPolygonArea(area: FloorArea): area is FloorPolygonArea {
  return area.points !== undefined
}

/** The smallest box round a polygon's corners (an empty polygon: a box of no size at 0, 0). */
export function polygonBounds(points: readonly FloorPoint[]): FloorBox {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 }
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

/**
 * The centroid of a polygon (the centre of its surface, by the shoelace formula), where its name
 * goes when the application gives no `labelAt`. A polygon of no surface (a line, one point):
 * the mean of its corners.
 */
export function polygonCentroid(points: readonly FloorPoint[]): FloorPoint {
  if (points.length === 0) return { x: 0, y: 0 }
  let twiceArea = 0
  let cx = 0
  let cy = 0
  points.forEach((a, index) => {
    const b = points[(index + 1) % points.length] ?? a
    const cross = a.x * b.y - b.x * a.y
    twiceArea += cross
    cx += (a.x + b.x) * cross
    cy += (a.y + b.y) * cross
  })
  if (Math.abs(twiceArea) < 1e-9) {
    const sum = points.reduce((total, point) => ({ x: total.x + point.x, y: total.y + point.y }), {
      x: 0,
      y: 0,
    })
    return { x: sum.x / points.length, y: sum.y / points.length }
  }
  return { x: cx / (3 * twiceArea), y: cy / (3 * twiceArea) }
}

/**
 * Whether a point lies inside a polygon (even-odd rule; a point on an edge may count either way).
 * For the application's own checks: a bed inside its room, a bin inside its zone.
 */
export function pointInPolygon(point: FloorPoint, points: readonly FloorPoint[]): boolean {
  let inside = false
  points.forEach((a, index) => {
    const b = points[(index + points.length - 1) % points.length] ?? a
    if (a.y > point.y !== b.y > point.y) {
      const x = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      if (point.x < x) inside = !inside
    }
  })
  return inside
}

/** The box an area covers: a rectangle's own, a polygon's bounds. */
export function areaBox(area: FloorArea): FloorBox {
  if (isPolygonArea(area)) return polygonBounds(area.points)
  return { x: area.x, y: area.y, width: area.width, height: area.height }
}

/** Whether an area holds a point (the application's checks; edges may count either way). */
export function areaContains(area: FloorArea, point: FloorPoint): boolean {
  if (isPolygonArea(area)) return pointInPolygon(point, area.points)
  return (
    point.x >= area.x &&
    point.x <= area.x + area.width &&
    point.y >= area.y &&
    point.y <= area.y + area.height
  )
}

/** Where a polygon area's name is centred: `labelAt`, else the centroid. */
export function areaLabelPoint(area: FloorPolygonArea): FloorPoint {
  return area.labelAt ?? polygonCentroid(area.points)
}

/** A polygon's corners for SVG's `points` attribute, in plan units ("0,0 400,0 400,300"). */
export function svgPoints(points: readonly FloorPoint[]): string {
  return points.map((point) => `${String(point.x)},${String(point.y)}`).join(' ')
}

/** A point as percentages of the part of the plan drawn (see `percentBox`), for drawing. */
export function percentPoint(
  point: FloorPoint,
  plan: { x?: number; y?: number; width: number; height: number },
): { left: string; top: string } {
  return {
    left: `${String(((point.x - (plan.x ?? 0)) / plan.width) * 100)}%`,
    top: `${String(((point.y - (plan.y ?? 0)) / plan.height) * 100)}%`,
  }
}

/** A decimal string the level bar can draw: digits with an optional fraction, optionally signed. */
const LEVEL_DECIMAL = /^[-+]?\d+(\.\d+)?$/

/**
 * The width of a level's bar as CSS: the percentage kept between 0% and 100% by CSS itself
 * (`clamp(0%, 62.5%, 100%)`), so the plan never turns the application's decimal string into a
 * number (D4). Null when the value is not a decimal string: then only the words show.
 */
export function levelWidth(percent: string): string | null {
  const value = percent.trim()
  if (!LEVEL_DECIMAL.test(value)) return null
  return `clamp(0%, ${value.replace(/^\+/, '')}%, 100%)`
}

/**
 * A level in words: the application's `label`, else `words` of the formatted percentage
 * (`floorPlan.level`: "62,5% full").
 */
export function levelText(
  level: FloorLevel,
  percent: (value: string) => string,
  words: (percentText: string) => string,
): string {
  return level.label ?? words(percent(level.percent))
}

// ── P5.28: one area at a time ────────────────────────────────────────────────────────────────

/**
 * Up to this many areas the area switcher is a segmented control (All + each area); more, or
 * more than two on a phone, a select (searched by typing from 11 options, SelectField's rule).
 */
export const AREA_SEGMENTS_UP_TO = 4

/** How the area switcher is drawn for `count` areas: 'segmented' or 'select'. */
export function areaSwitchKind(count: number, phone: boolean): 'segmented' | 'select' {
  return count <= (phone ? 2 : AREA_SEGMENTS_UP_TO) ? 'segmented' : 'select'
}

/**
 * The areas the switcher offers: `choices` (the application's ids, in its order) when given,
 * else every area that holds an item (a corridor or a nurses' station without items is drawn,
 * not offered).
 */
export function switchableAreas<Area extends { id: string }>(
  areas: readonly Area[],
  items: readonly { areaId?: string | undefined }[],
  choices?: readonly string[],
): Area[] {
  if (choices !== undefined) {
    return choices.flatMap((id) => areas.filter((area) => area.id === id))
  }
  return areas.filter((area) => items.some((item) => item.areaId === area.id))
}

/** The part of the plan drawn: the whole plan, or one area's box kept inside the plan. */
export function planFrame(area: FloorArea | undefined, plan: { width: number; height: number }) {
  if (area === undefined) return { x: 0, y: 0, width: plan.width, height: plan.height }
  const box = areaBox(area)
  const x = Math.max(0, box.x)
  const y = Math.max(0, box.y)
  const width = Math.max(1, Math.min(plan.width, box.x + box.width) - x)
  const height = Math.max(1, Math.min(plan.height, box.y + box.height) - y)
  return { x, y, width, height }
}

/**
 * Whether an item is shown when one area is: it stands in that area (`areaId`), or, with no
 * known area of its own, its centre lies inside it (a stage, a counter, a bin of no zone).
 */
export function inArea(
  item: FloorGeometry & { areaId?: string | undefined },
  area: FloorArea,
  areas: readonly { id: string }[],
): boolean {
  if (item.areaId !== undefined && areas.some((each) => each.id === item.areaId)) {
    return item.areaId === area.id
  }
  return areaContains(area, centreOf(item))
}

/** How much of a label fits on its item: both lines, the name with its state icon, the number, none. */
export type LabelFit = 'all' | 'name' | 'number' | 'none'

/** A width and a height, in pixels. */
export interface LabelSize {
  width: number
  height: number
}

/**
 * The room a label has inside an item of `width` × `height` pixels: 2px of padding each side, a
 * round item's inner square (about 78% of its box), less the level bar's 10px at the bottom.
 */
export function labelRoom(width: number, height: number, round: boolean, bar: boolean): LabelSize {
  const factor = round ? 0.78 : 1
  return {
    width: Math.max(0, width * factor - 4),
    height: Math.max(0, height * factor - 4 - (bar ? 10 : 0)),
  }
}

/**
 * How much of an item's label is written on the plan (P5.28 item 24: never cut): both lines
 * when they fit, else the name line (state icon and name), else the name alone, else nothing —
 * the list and the item's name always say everything.
 */
export function labelFit(
  room: LabelSize,
  name: LabelSize,
  number: LabelSize,
  detail: LabelSize | null,
): LabelFit {
  const fits = (size: LabelSize) => size.width <= room.width && size.height <= room.height
  if (
    detail !== null &&
    fits({ width: Math.max(name.width, detail.width), height: name.height + detail.height })
  ) {
    return 'all'
  }
  if (fits(name)) return 'name'
  if (fits(number)) return 'number'
  return 'none'
}
