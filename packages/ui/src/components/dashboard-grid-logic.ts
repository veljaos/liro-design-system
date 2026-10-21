/*
 * The logic of DashboardGrid (P5.81), kept apart from the markup so it can be unit-tested
 * (AGENTS.md C7): how a card moves, how it is resized or removed, how many columns a size takes,
 * where each card stands in the grid (the browser's own placement, for the arrow keys), and
 * where the arrow keys move a card picked up by the keyboard. Nothing here measures or renders.
 */

/** One card of a dashboard's layout, in the user's order: its id and the id of its size. */
export interface DashboardLayoutItem {
  id: string
  size: string
}

/** A size the application offers ("Small", "Medium", "Large", "Full width"). */
export interface DashboardCardSize {
  id: string
  /** The size's name, from the application. */
  label: string
  /** How many of the grid's columns the card takes on a wide screen (1 … `columns`). */
  columns: number
}

/** What changed in the layout, reported with the new layout. */
export type DashboardLayoutChange =
  | { kind: 'move'; id: string; from: number; to: number }
  | { kind: 'resize'; id: string; size: string }
  | { kind: 'remove'; id: string }

/** The layout with the card `id` moved to the place `index` (clamped to the ends). */
export function moveCardTo(
  layout: readonly DashboardLayoutItem[],
  id: string,
  index: number,
): DashboardLayoutItem[] {
  const from = layout.findIndex((item) => item.id === id)
  const item = layout[from]
  if (item === undefined) return [...layout]
  const to = Math.max(0, Math.min(layout.length - 1, index))
  const next = layout.filter((each) => each.id !== id)
  next.splice(to, 0, item)
  return next
}

/** The layout with the card moved by `offset` places (−1 earlier, +1 later); unchanged at an end. */
export function moveCardBy(
  layout: readonly DashboardLayoutItem[],
  id: string,
  offset: number,
): DashboardLayoutItem[] {
  const from = layout.findIndex((item) => item.id === id)
  const to = from + offset
  if (from === -1 || to < 0 || to >= layout.length) return [...layout]
  return moveCardTo(layout, id, to)
}

/** The layout with the card's size changed. */
export function resizeCard(
  layout: readonly DashboardLayoutItem[],
  id: string,
  size: string,
): DashboardLayoutItem[] {
  return layout.map((item) => (item.id === id ? { ...item, size } : item))
}

/** The layout without the card. */
export function removeCard(
  layout: readonly DashboardLayoutItem[],
  id: string,
): DashboardLayoutItem[] {
  return layout.filter((item) => item.id !== id)
}

/**
 * The layout with a card added from the application's catalogue: at the end, or at `index`. A
 * card already on the dashboard is not added twice.
 */
export function addCard(
  layout: readonly DashboardLayoutItem[],
  item: DashboardLayoutItem,
  index?: number,
): DashboardLayoutItem[] {
  if (layout.some((each) => each.id === item.id)) return [...layout]
  const next = [...layout]
  next.splice(index ?? next.length, 0, item)
  return next
}

/** The layout of the cards as they stand (their ids and sizes, in order). */
export function layoutOf(cards: readonly DashboardLayoutItem[]): DashboardLayoutItem[] {
  return cards.map((card) => ({ id: card.id, size: card.size }))
}

/**
 * How many columns a card takes in a grid of `columns`: its size's columns, at least one and
 * never more than the grid has (a size of four columns takes two in a two-column grid). An
 * unknown size takes one column.
 */
export function cardSpan(
  size: string,
  sizes: readonly DashboardCardSize[],
  columns: number,
): number {
  const wanted = sizes.find((each) => each.id === size)?.columns ?? 1
  return Math.max(1, Math.min(Math.max(1, columns), Math.floor(wanted)))
}

/** The sizes a card may take: the ones it names, in the application's order; all by default. */
export function allowedSizes(
  sizes: readonly DashboardCardSize[],
  only?: readonly string[],
): DashboardCardSize[] {
  if (only === undefined) return [...sizes]
  return sizes.filter((size) => only.includes(size.id))
}

/** Where a card stands in the grid: its row, its first column (0 at the start) and its span. */
export interface GridPlace {
  row: number
  column: number
  span: number
}

/**
 * Where each card stands when the browser places them in order (CSS grid auto-placement, not
 * dense): each card goes after the previous one on its row, and starts a new row when its span
 * does not fit in what is left. Columns count from the start edge, so the same places hold in
 * right-to-left.
 */
export function gridPlacement(spans: readonly number[], columns: number): GridPlace[] {
  const width = Math.max(1, columns)
  let row = 0
  let column = 0
  return spans.map((wanted) => {
    const span = Math.max(1, Math.min(width, wanted))
    if (column + span > width) {
      row += 1
      column = 0
    }
    const place = { row, column, span }
    column += span
    if (column >= width) {
      row += 1
      column = 0
    }
    return place
  })
}

/** Whether two places share a column. */
function overlaps(a: GridPlace, b: GridPlace): boolean {
  return a.column < b.column + b.span && b.column < a.column + a.span
}

/**
 * The card on the row above or below `index` that a card picked up there moves to: the one on
 * that row that shares the most columns with it, else the nearest by its start column. Null on
 * the first or last row.
 */
function verticalTarget(places: readonly GridPlace[], index: number, step: 1 | -1): number | null {
  const current = places[index]
  if (current === undefined) return null
  const row = current.row + step
  const candidates = places
    .map((place, at) => ({ place, at }))
    .filter((each) => each.place.row === row)
  if (candidates.length === 0) return null
  const shared = (place: GridPlace) =>
    Math.min(place.column + place.span, current.column + current.span) -
    Math.max(place.column, current.column)
  const touching = candidates.filter((each) => overlaps(each.place, current))
  const pool = touching.length > 0 ? touching : candidates
  let best = pool[0]
  for (const each of pool) {
    if (best === undefined) break
    const better =
      touching.length > 0
        ? shared(each.place) > shared(best.place)
        : Math.abs(each.place.column - current.column) <
          Math.abs(best.place.column - current.column)
    if (better) best = each
  }
  return best?.at ?? null
}

/**
 * Where a card picked up by the keyboard moves, as a new index in the order, or null when the
 * key does not move it. The forward arrow of the reading direction (ArrowRight in left-to-right,
 * ArrowLeft in right-to-left, Appendix B.7) moves it one place later, the other one place
 * earlier; ArrowUp and ArrowDown move it to the place of the card above or below it in the grid
 * as laid out (`places`, from `gridPlacement`); Home and End to the start and the end.
 */
export function dashboardKeyTarget(
  key: string,
  index: number,
  places: readonly GridPlace[],
  direction: 'ltr' | 'rtl',
): number | null {
  const count = places.length
  const forward = direction === 'ltr' ? 'ArrowRight' : 'ArrowLeft'
  const backward = direction === 'ltr' ? 'ArrowLeft' : 'ArrowRight'
  let target: number | null
  switch (key) {
    case forward:
      target = index + 1
      break
    case backward:
      target = index - 1
      break
    case 'ArrowDown':
      target = verticalTarget(places, index, 1)
      break
    case 'ArrowUp':
      target = verticalTarget(places, index, -1)
      break
    case 'Home':
      target = 0
      break
    case 'End':
      target = count - 1
      break
    default:
      return null
  }
  if (target === null || target < 0 || target >= count || target === index) return null
  return target
}
