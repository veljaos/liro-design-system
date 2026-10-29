import { useVirtualizer, useWindowVirtualizer, type Range } from '@tanstack/react-virtual'
import { useCallback, useLayoutEffect, useState, type RefObject } from 'react'
import { keepFocusedRow, overscanRows } from './virtual-rows'

/*
 * The row window of TreeView and TreeTable (P5.9), also used by WorklistPage's queue (P5.94 item
 * 19, `useTreeWindow` from 62em and `usePageWindow` below it): TanStack Virtual (docs/decisions.md "TanStack
 * Virtual for every list"), with the shared rules of `virtual-rows.ts` — 600px drawn above and
 * below the view, the focused row kept drawn with its neighbours, spacers between drawn rows that
 * are not next to each other. Rows are measured once drawn (a description or a reason makes a
 * row taller). The only file of the tree and of the worklist that calls `useVirtualizer`.
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

/** The closest ancestor that scrolls vertically, or the window (the page's own scroll). */
function pageScrollerOf(element: HTMLElement): HTMLElement | 'window' {
  for (let node = element.parentElement; node !== null; node = node.parentElement) {
    if (node === document.body || node === document.documentElement) break
    if (/(auto|scroll|overlay)/.test(getComputedStyle(node).overflowY)) return node
  }
  return 'window'
}

/**
 * A row window over `count` rows that flow with the page (P5.94 item 19: WorklistPage's queue
 * below 62em, where no box scrolls on its own, D19): against the closest scrolling ancestor (a
 * story's phone frame, an application's scrolling layout) or the window, the list's offset in it
 * being the scroll margin, as DataTable's phone cards (P5.90). The items' `start` and `end`
 * include that margin; `getTotalSize()` does not. Off when not `enabled`.
 */
export function usePageWindow({
  count,
  list,
  rowHeight,
  enabled,
  focusIndex,
  getKey,
}: {
  count: number
  /** The list element (its offset in the scroller is measured). */
  list: RefObject<HTMLElement | null>
  rowHeight: number
  enabled: boolean
  focusIndex: number | null
  getKey: (index: number) => string
}) {
  const [scroller, setScroller] = useState<HTMLElement | 'window' | null>(null)
  const [margin, setMargin] = useState(0)
  useLayoutEffect(() => {
    const element = list.current
    if (!enabled || element === null) return
    const measure = () => {
      const found = pageScrollerOf(element)
      setScroller((last) => (last === found ? last : found))
      const top = element.getBoundingClientRect().top
      const offset =
        found === 'window'
          ? top + window.scrollY
          : top - found.getBoundingClientRect().top + found.scrollTop
      setMargin((last) => (Math.abs(last - offset) < 1 ? last : Math.round(offset)))
    }
    measure()
    // What stands above the list can change its offset (a summary, the filters, a bulk bar).
    const observer = new ResizeObserver(measure)
    const found = pageScrollerOf(element)
    observer.observe(found === 'window' ? document.body : (found.firstElementChild ?? found))
    return () => {
      observer.disconnect()
    }
  }, [enabled, count, list])
  const rangeExtractor = useCallback(
    (range: Range) => keepFocusedRow(range, focusIndex),
    [focusIndex],
  )
  const inElement = useVirtualizer({
    count,
    getScrollElement: () => (scroller instanceof HTMLElement ? scroller : null),
    estimateSize: () => rowHeight,
    overscan: overscanRows(rowHeight),
    rangeExtractor,
    getItemKey: getKey,
    enabled: enabled && scroller instanceof HTMLElement,
    scrollMargin: margin,
    initialRect: { width: 0, height: 720 },
  })
  const inWindow = useWindowVirtualizer({
    count,
    estimateSize: () => rowHeight,
    overscan: overscanRows(rowHeight),
    rangeExtractor,
    getItemKey: getKey,
    enabled: enabled && scroller === 'window',
    scrollMargin: margin,
    initialRect: { width: 0, height: 720 },
  })
  return scroller === 'window' ? inWindow : inElement
}
