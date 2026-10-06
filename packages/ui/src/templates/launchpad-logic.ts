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
