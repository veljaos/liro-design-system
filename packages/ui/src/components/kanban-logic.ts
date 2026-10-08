/*
 * The logic of KanbanBoard (P5.7), kept apart from the markup so it can be unit-tested (AGENTS.md
 * C7): where a card goes with the keys, where a dragged card would land, how the other cards make
 * room, and the order after a move.
 */

/** A place on the board: a column and the card's index in it (0 = the top). */
export interface KanbanPlace {
  column: string
  index: number
}

/** What the logic needs of a column: its id and its cards' ids, in order. */
export interface KanbanColumnIds {
  id: string
  cards: readonly { id: string }[]
}

/** Where a card stands, or null when no column holds it. */
export function placeOf(columns: readonly KanbanColumnIds[], cardId: string): KanbanPlace | null {
  for (const column of columns) {
    const index = column.cards.findIndex((card) => card.id === cardId)
    if (index !== -1) return { column: column.id, index }
  }
  return null
}

/**
 * The columns after moving a card to `to` (its index counted without the card itself). The
 * columns and the other cards keep their order; an unknown card or column changes nothing.
 */
export function moveCard<Column extends KanbanColumnIds>(
  columns: readonly Column[],
  cardId: string,
  to: KanbanPlace,
): Column[] {
  const from = placeOf(columns, cardId)
  if (from === null || !columns.some((column) => column.id === to.column)) return [...columns]
  const card = columns.find((column) => column.id === from.column)?.cards[from.index]
  if (card === undefined) return [...columns]
  return columns.map((column) => {
    const others = column.cards.filter((each) => each.id !== cardId)
    if (column.id !== to.column) {
      return others.length === column.cards.length ? column : { ...column, cards: others }
    }
    const index = Math.max(0, Math.min(others.length, to.index))
    return { ...column, cards: [...others.slice(0, index), card, ...others.slice(index)] }
  })
}

/**
 * The place a card lifted with the keyboard moves to (P5.7): up and down within its column,
 * forward and back between columns — the arrow that points forward in the reading direction goes
 * to the next column (Appendix B.7: from the leading edge), keeping the card's height in the list
 * as far as the other column allows. Null when the key does not move it.
 */
export function kanbanKeyTarget(
  key: string,
  place: KanbanPlace,
  columns: readonly KanbanColumnIds[],
  cardId: string,
  direction: 'ltr' | 'rtl',
): KanbanPlace | null {
  const columnIndex = columns.findIndex((column) => column.id === place.column)
  const column = columns[columnIndex]
  if (column === undefined) return null
  const others = (each: KanbanColumnIds) => each.cards.filter((card) => card.id !== cardId).length
  const forward = direction === 'ltr' ? 'ArrowRight' : 'ArrowLeft'
  const backward = direction === 'ltr' ? 'ArrowLeft' : 'ArrowRight'
  switch (key) {
    case 'ArrowUp':
      return place.index > 0 ? { column: column.id, index: place.index - 1 } : null
    case 'ArrowDown':
      return place.index < others(column) ? { column: column.id, index: place.index + 1 } : null
    case forward:
    case backward: {
      const next = columns[columnIndex + (key === forward ? 1 : -1)]
      if (next === undefined) return null
      return { column: next.id, index: Math.min(place.index, others(next)) }
    }
    default:
      return null
  }
}

/** A column as laid out when a drag starts, measured from the board's top-left corner. */
export interface ColumnGeometry {
  id: string
  /** The column's start and width on the x axis. */
  x: number
  width: number
  /** Where its first card stands (the list's top). */
  top: number
  cards: readonly { id: string; y: number; height: number }[]
}

/**
 * Where a dragged card would land: the column under the card's centre (else the nearest one),
 * and in it the place after every other card whose centre is above the dragged card's centre.
 * Measured on the laid-out columns, so it holds in both directions (B.7: the columns already run
 * from the leading edge, and the slots are where the cards really stand).
 */
export function dropTarget(
  geometry: readonly ColumnGeometry[],
  cardId: string,
  centre: { x: number; y: number },
): KanbanPlace | null {
  let column: ColumnGeometry | undefined = geometry.find(
    (each) => centre.x >= each.x && centre.x < each.x + each.width,
  )
  if (column === undefined) {
    let best = Number.POSITIVE_INFINITY
    for (const each of geometry) {
      const distance = Math.abs(each.x + each.width / 2 - centre.x)
      if (distance < best) {
        best = distance
        column = each
      }
    }
  }
  if (column === undefined) return null
  const index = column.cards.filter(
    (card) => card.id !== cardId && card.y + card.height / 2 < centre.y,
  ).length
  return { column: column.id, index }
}

/**
 * How the board looks while a card is dragged to `target`: every other card's vertical shift from
 * its own place (the cards after the gap it left move up, the cards after the target move down),
 * and the placeholder's top and height in its column. Cards stand `gap` pixels apart.
 */
export function dragLayout(
  geometry: readonly ColumnGeometry[],
  cardId: string,
  target: KanbanPlace,
  gap: number,
): { shifts: Record<string, number>; placeholder: { column: string; y: number; height: number } } {
  const dragged = geometry.flatMap((column) => column.cards).find((card) => card.id === cardId)
  const height = dragged?.height ?? 0
  const shifts: Record<string, number> = {}
  let placeholder = { column: target.column, y: 0, height }
  for (const column of geometry) {
    let cursor = column.top
    const others = column.cards.filter((card) => card.id !== cardId)
    const index = column.id === target.column ? Math.min(target.index, others.length) : -1
    others.forEach((card, position) => {
      if (position === index) {
        placeholder = { column: column.id, y: cursor - column.top, height }
        cursor += height + gap
      }
      shifts[card.id] = cursor - card.y
      cursor += card.height + gap
    })
    if (index === others.length) placeholder = { column: column.id, y: cursor - column.top, height }
  }
  return { shifts, placeholder }
}
