/*
 * The logic of dragging an item between (or within) lists stacked on a page: a pivot field's
 * chip between the zones Rows / Columns / Values / Filters, a rule's condition or action within
 * its list. Pure, measured on the laid-out lists when a drag starts, so right-to-left needs no
 * mirroring: a list's items
 * stand top to bottom in both directions.
 */

/** A list as laid out when a drag starts, measured from the container's top-left corner. */
export interface DropZoneGeometry {
  id: string
  x: number
  y: number
  width: number
  height: number
  /** The list's items, top to bottom: their top (from the container) and height. */
  items: readonly { id: string; y: number; height: number }[]
}

/** Where a dragged item would land: a list and the index counted without the item itself. */
export interface DropPlace {
  zone: string
  index: number
}

/**
 * Where an item dragged to `point` lands: the list under the point among those that take it (else
 * the nearest of them), and in it the place after every other item whose centre is above the
 * point. Null when no list takes it.
 */
export function listDropTarget(
  geometry: readonly DropZoneGeometry[],
  itemId: string,
  point: { x: number; y: number },
  accepts: (zone: string) => boolean = () => true,
): DropPlace | null {
  const open = geometry.filter((zone) => accepts(zone.id))
  let zone = open.find(
    (each) =>
      point.x >= each.x &&
      point.x < each.x + each.width &&
      point.y >= each.y &&
      point.y < each.y + each.height,
  )
  if (zone === undefined) {
    let best = Number.POSITIVE_INFINITY
    for (const each of open) {
      const dx = Math.max(each.x - point.x, 0, point.x - (each.x + each.width))
      const dy = Math.max(each.y - point.y, 0, point.y - (each.y + each.height))
      const distance = Math.hypot(dx, dy)
      if (distance < best) {
        best = distance
        zone = each
      }
    }
  }
  if (zone === undefined) return null
  const index = zone.items.filter(
    (item) => item.id !== itemId && item.y + item.height / 2 < point.y,
  ).length
  return { zone: zone.id, index }
}

/**
 * Where the line that marks the landing place stands in its list, in pixels from the list's top:
 * halfway between the item before and the item after, just above the first or below the last,
 * at the top of an empty list.
 */
export function dropLineOffset(zone: DropZoneGeometry, itemId: string, index: number): number {
  const others = zone.items.filter((item) => item.id !== itemId)
  const before = others[index - 1]
  const after = others[index]
  if (before === undefined) return after === undefined ? 0 : Math.max(0, after.y - zone.y - 2)
  if (after === undefined) return before.y + before.height - zone.y + 2
  return (before.y + before.height + after.y) / 2 - zone.y
}

/** Whether a drop changes anything: another list, or another index in the same one. */
export function dropMoves(from: DropPlace, to: DropPlace): boolean {
  return from.zone !== to.zone || from.index !== to.index
}
