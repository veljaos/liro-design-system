import { useVirtualizer, type Range } from '@tanstack/react-virtual'
import { useCallback, type RefObject } from 'react'
import { keepFocusedRow, overscanRows } from './virtual-rows'

/*
 * The row window of TreeView and TreeTable (P5.9): TanStack Virtual (docs/decisions.md "TanStack
 * Virtual for every list"), with the shared rules of `virtual-rows.ts` — 600px drawn above and
 * below the view, the focused row kept drawn with its neighbours, spacers between drawn rows that
 * are not next to each other. Rows are measured once drawn (a description or a reason makes a
 * row taller). The only file of the tree that calls `useVirtualizer`.
 */

/** The estimated height of a tree row before it is measured: one 32px line (44px on phones). */
export const TREE_ROW_HEIGHT = 32
export const TREE_PHONE_ROW_HEIGHT = 44

/** The window over `count` rows that scroll inside `scroller`; off when not `enabled`. */
export function useTreeWindow({
  count,
  scroller,
  rowHeight,
  enabled,
  focusIndex,
  getKey,
}: {
  count: number
  scroller: RefObject<HTMLElement | null>
  rowHeight: number
  enabled: boolean
  /** The index of the row that holds the roving focus, kept drawn; null for none. */
  focusIndex: number | null
  getKey: (index: number) => string
}) {
  const rangeExtractor = useCallback(
    (range: Range) => keepFocusedRow(range, focusIndex),
    [focusIndex],
  )
  return useVirtualizer({
    count,
    getScrollElement: () => scroller.current,
    estimateSize: () => rowHeight,
    overscan: overscanRows(rowHeight),
    rangeExtractor,
    getItemKey: getKey,
    enabled,
    // Before the scroll area is measured, assume a screen's height, so the first rows are drawn
    // at once (as DataTable).
    initialRect: { width: 0, height: 720 },
  })
}
