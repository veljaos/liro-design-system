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

/** What an item is; the application names it (`label`). Fixtures are drawn, not chosen. */
export type FloorItemKind =
  'table' | 'seat' | 'room' | 'bar' | 'counter' | 'stage' | 'wall' | 'door' | 'window'

/** The kinds that are part of the building or the room: drawn, chosen only in edit mode. */
export const FIXTURE_KINDS: readonly FloorItemKind[] = [
  'wall',
  'door',
  'window',
  'stage',
  'counter',
]

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

/** Whether an item is a fixture (a wall, a door, a stage …). */
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

/** A box as percentages of the plan, for drawing (the plan scales to its width). */
export function percentBox(
  box: FloorBox,
  plan: { width: number; height: number },
): { left: string; top: string; width: string; height: string } {
  const percent = (value: number, of: number) => `${String((value / of) * 100)}%`
  return {
    left: percent(box.x, plan.width),
    top: percent(box.y, plan.height),
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
  /** A short line from the application under the name ("19:30 · 4 guests"). */
  detail?: string
  /** How many people it takes; shown with its noun ("4 seats"). */
  capacity?: number
  /** The area it stands in (an id of `areas`). */
  areaId?: string
  /** Its state (an id of `states`): the tone, the icon and the words. */
  stateId?: string
  /** A note from the application ("By the window"), in the list and the name. */
  note?: string
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
