/*
 * The logic of MatchingView (BUILD-PLAN P5.21), kept apart so it can be tested without a page:
 * the keys of a list, the selection and when a list is virtualised. Nothing here adds amounts:
 * what is matched and what is left come from the application.
 */

/** What a key does in one of MatchingView's lists. */
export type MatchingKeyAction =
  { type: 'move'; to: number } | { type: 'toggle' } | { type: 'match' } | { type: 'clear' }

/** PageUp / PageDown move this many items. */
export const MATCHING_PAGE = 10

/** From this many items a list draws only the rows in view (P4.9 rule 12). */
export const MATCHING_VIRTUALIZE_FROM = 100

/** The height of a row when the list is virtualised: two lines of text and 12px around them. */
export const MATCHING_ROW_HEIGHT = 64

/**
 * The keys of a list (a multi-select listbox; the focus stays on the list and the active item is
 * its `aria-activedescendant`):
 * - ArrowDown / ArrowUp: the next / previous item (no wrapping: a long list has an end);
 * - Home / End: the first / last item; PageDown / PageUp: ten items on;
 * - Space: selects or deselects the active item;
 * - Enter: matches the selection of both lists;
 * - Escape: clears the selection of both lists.
 * Tab leaves the list for the next one (the browser's order): each list is one tab stop.
 * Keys with Ctrl, Cmd or Alt are left to the browser. `active` is -1 when no item is active.
 */
export function matchingKeyAction(
  key: string,
  active: number,
  count: number,
  modifiers: { ctrl?: boolean; meta?: boolean; alt?: boolean } = {},
): MatchingKeyAction | null {
  if (modifiers.ctrl === true || modifiers.meta === true || modifiers.alt === true) return null
  const last = count - 1
  const clamp = (index: number) => Math.min(Math.max(index, 0), last)
  switch (key) {
    case 'ArrowDown':
      return count === 0 ? null : { type: 'move', to: clamp(active < 0 ? 0 : active + 1) }
    case 'ArrowUp':
      return count === 0 ? null : { type: 'move', to: clamp(active < 0 ? 0 : active - 1) }
    case 'Home':
      return count === 0 ? null : { type: 'move', to: 0 }
    case 'End':
      return count === 0 ? null : { type: 'move', to: last }
    case 'PageDown':
      return count === 0 ? null : { type: 'move', to: clamp(active + MATCHING_PAGE) }
    case 'PageUp':
      return count === 0 ? null : { type: 'move', to: clamp(active - MATCHING_PAGE) }
    case ' ':
      return active < 0 || active > last ? null : { type: 'toggle' }
    case 'Enter':
      return { type: 'match' }
    case 'Escape':
      return { type: 'clear' }
    default:
      return null
  }
}

/** The selection with `id` added, or removed when it was there; the order of choosing is kept. */
export function toggleSelection(selected: readonly string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((each) => each !== id) : [...selected, id]
}

/** A match needs at least one item on each side. */
export function canMatch(left: readonly string[], right: readonly string[]): boolean {
  return left.length > 0 && right.length > 0
}

/** The active index after the list changed: the same item if still there, else the nearest. */
export function nextActive(
  previousId: string | undefined,
  previousIndex: number,
  ids: readonly string[],
): number {
  if (ids.length === 0) return -1
  if (previousId !== undefined) {
    const same = ids.indexOf(previousId)
    if (same >= 0) return same
  }
  if (previousIndex < 0) return -1
  return Math.min(previousIndex, ids.length - 1)
}
