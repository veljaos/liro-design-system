/*
 * The logic of Launchpad, kept apart from the markup so it can be unit-tested (AGENTS.md C7):
 * where the arrow keys move in the grid, which module a digit opens, and how a move reorders.
 */

/** The card the focus moves to from `index`, or null when the key does not move. */
export function launchpadArrowTarget(
  key: string,
  index: number,
  count: number,
  columns: number,
  direction: 'ltr' | 'rtl',
): number | null {
  // ArrowRight goes forward in reading order in left-to-right and backward in right-to-left
  // (Appendix B.7: movement measures from the leading edge).
  const forward = direction === 'ltr' ? 'ArrowRight' : 'ArrowLeft'
  const backward = direction === 'ltr' ? 'ArrowLeft' : 'ArrowRight'
  let target: number
  switch (key) {
    case forward:
      target = index + 1
      break
    case backward:
      target = index - 1
      break
    case 'ArrowDown':
      target = index + columns
      break
    case 'ArrowUp':
      target = index - columns
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
  return target >= 0 && target < count ? target : null
}

/** The module a digit key opens: "1" the first … "9" the ninth; null otherwise. */
export function launchpadDigitTarget(key: string, count: number): number | null {
  if (!/^[1-9]$/.test(key)) return null
  const index = Number(key) - 1
  return index < count ? index : null
}

/** The ids after moving one by `offset` places (−1 earlier, +1 later); unchanged at an end. */
export function moveModule(ids: readonly string[], id: string, offset: number): string[] {
  const from = ids.indexOf(id)
  const to = from + offset
  if (from === -1 || to < 0 || to >= ids.length) return [...ids]
  const next = [...ids]
  next.splice(from, 1)
  next.splice(to, 0, id)
  return next
}

/** The ids after dropping `id` on the place of `target` (dragging in editing mode). */
export function dropModule(ids: readonly string[], id: string, target: string): string[] {
  const from = ids.indexOf(id)
  const to = ids.indexOf(target)
  if (from === -1 || to === -1 || from === to) return [...ids]
  return moveModule(ids, id, to - from)
}

/** Whether a key press comes from a place where typing a digit means text. */
export function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.closest('input, textarea, select, [role="combobox"], [role="textbox"]') !== null
  )
}

/** A card's place in the grid while dragging, measured from the list's top-left corner. */
export interface CardSlot {
  x: number
  y: number
  width: number
  height: number
}

/**
 * The place a dragged card would take: the slot whose centre is nearest to the dragged card's
 * centre. Measured on the laid-out slots, so it holds in both directions (Appendix B.7: the grid
 * already runs from the leading edge, and the slots are where the cards really stand).
 */
export function dragTargetIndex(
  slots: readonly CardSlot[],
  centre: { x: number; y: number },
): number {
  let best = 0
  let bestDistance = Number.POSITIVE_INFINITY
  slots.forEach((slot, index) => {
    const dx = slot.x + slot.width / 2 - centre.x
    const dy = slot.y + slot.height / 2 - centre.y
    const distance = dx * dx + dy * dy
    if (distance < bestDistance) {
      best = index
      bestDistance = distance
    }
  })
  return best
}

/** The ids with `id` moved to the place `index` (the order shown while dragging). */
export function moveModuleTo(ids: readonly string[], id: string, index: number): string[] {
  const from = ids.indexOf(id)
  if (from === -1) return [...ids]
  return moveModule(ids, id, Math.max(0, Math.min(ids.length - 1, index)) - from)
}

/** How far a card moves (x, y) from its own slot to the slot it takes in the shown order. */
export function slotShift(
  slots: readonly CardSlot[],
  from: number,
  to: number,
): { x: number; y: number } {
  const a = slots[from]
  const b = slots[to]
  if (a === undefined || b === undefined) return { x: 0, y: 0 }
  return { x: b.x - a.x, y: b.y - a.y }
}
