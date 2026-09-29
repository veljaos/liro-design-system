/*
 * The logic of ActionGroup, kept apart from the markup so it can be unit-tested (AGENTS.md C7):
 * how many actions stay visible when the row is too narrow. The main action is last and always
 * visible; the others move into the "More" menu from the start (the least important first).
 */

/**
 * How many actions, counted from the end, stay visible: all of them when they fit; otherwise the
 * last (main) one and as many before it as fit beside the "More" button.
 *
 * @param widths The width of each action, in order (main last).
 * @param moreWidth The width of the "More" button.
 * @param gap The space between two buttons.
 * @param available The width of the row.
 */
export function visibleActions(
  widths: readonly number[],
  moreWidth: number,
  gap: number,
  available: number,
): number {
  const count = widths.length
  if (count === 0) return 0
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * (count - 1)
  if (total <= available) return count
  let used = (widths[count - 1] ?? 0) + gap + moreWidth
  let visible = 1
  for (let index = count - 2; index >= 0; index -= 1) {
    const width = (widths[index] ?? 0) + gap
    if (used + width > available) break
    used += width
    visible += 1
  }
  return visible
}
