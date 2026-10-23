import { useEffect, useLayoutEffect, useState, type CSSProperties } from 'react'
import { useLiro } from '../provider/liro-provider'

/*
 * One rule for every row of tabs (P5.90 item 6, the owner's review: phones' module tabs did not
 * show that they scroll): a row of tabs never wraps. When its tabs do not fit, the row scrolls
 * sideways — a finger swipes, a tab that takes the focus scrolls into view, no scrollbar — and
 * each edge with more tabs past it fades out over 32px, so the row shows that it goes on. The
 * active tab is scrolled into view when the row is first drawn and whenever it changes, clear of
 * the fade. The AppShell's module tabs, the page's Tabs, FormTabs, the PortalShell's sections, the
 * SectionBar and the ListPage's saved views all follow it (saved views keep their "More" after the fifth: that
 * is how many views a list shows, not an overflow rule).
 */

/** The width of the fade at an edge with more past it (px); the active tab stays clear of it. */
export const TAB_ROW_FADE = 32

/** The classes of a tab row's scroller: sideways scroll without a scrollbar of its own. */
export const TAB_ROW_SCROLLER = 'min-w-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none]'

/**
 * The mask that fades a scrolling row's edges where more lies past them: 32px from fully drawn to
 * gone, toward the start and the end in reading order. A mask, not a colour: the row fades into
 * whatever surface is behind it (only the mask's alpha counts, and currentcolor is opaque).
 */
export function edgeFade(
  ends: { start: boolean; end: boolean },
  direction: 'ltr' | 'rtl',
): string | undefined {
  if (!ends.start && !ends.end) return undefined
  const towards = direction === 'rtl' ? 'to left' : 'to right'
  const start = ends.start ? 'transparent, currentcolor 32px' : 'currentcolor, currentcolor'
  const end = ends.end ? 'currentcolor calc(100% - 32px), transparent' : 'currentcolor'
  return `linear-gradient(${towards}, ${start}, ${end})`
}

/**
 * How far (px, physical, as `scrollLeft` counts) a row must scroll so that a tab stands inside it
 * with `margin` to spare on each side; 0 when it already does. A tab wider than the row is
 * aligned by its start edge in reading order.
 */
export function revealDelta(
  row: { left: number; right: number },
  tab: { left: number; right: number },
  margin: number,
  direction: 'ltr' | 'rtl' = 'ltr',
): number {
  const room = row.right - row.left - 2 * margin
  if (tab.right - tab.left > room) {
    return direction === 'rtl' ? tab.right - (row.right - margin) : tab.left - (row.left + margin)
  }
  if (tab.left < row.left + margin) return tab.left - (row.left + margin)
  if (tab.right > row.right - margin) return tab.right - (row.right - margin)
  return 0
}

/** Which ends of a scrolling row have more content past them (in reading order). */
export function useOverflowEnds(element: HTMLElement | null): { start: boolean; end: boolean } {
  const [ends, setEnds] = useState({ start: false, end: false })
  useEffect(() => {
    if (element === null) return
    const measure = () => {
      // scrollLeft runs negative in right-to-left; its size from the start is what counts.
      const fromStart = Math.abs(element.scrollLeft)
      const room = element.scrollWidth - element.clientWidth
      const next = { start: fromStart > 1, end: room - fromStart > 1 }
      setEnds((last) => (last.start === next.start && last.end === next.end ? last : next))
    }
    measure()
    element.addEventListener('scroll', measure, { passive: true })
    // The row's own box keeps its width when its tabs grow, so each tab is observed; a web font
    // that arrives after the first measure changes the tabs' widths (found as a flaky baseline).
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    for (const item of element.querySelectorAll('li, [role="tab"]')) observer.observe(item)
    const fonts = typeof document === 'undefined' ? undefined : document.fonts
    fonts?.addEventListener('loadingdone', measure)
    void fonts?.ready.then(measure)
    return () => {
      element.removeEventListener('scroll', measure)
      fonts?.removeEventListener('loadingdone', measure)
      observer.disconnect()
    }
  }, [element])
  return ends
}

/** The active tab of a row: the current page's link, or the selected tab. */
const ACTIVE =
  '[aria-current="page"], [aria-current="location"], [role="tab"][aria-selected="true"], [data-active-tab]'

/** Scrolls a row sideways so its active tab stands clear of the fades; never the page. */
function revealActive(row: HTMLElement, direction: 'ltr' | 'rtl') {
  const active = row.querySelector<HTMLElement>(ACTIVE)
  if (active === null || row.scrollWidth <= row.clientWidth) return
  const delta = revealDelta(
    row.getBoundingClientRect(),
    active.getBoundingClientRect(),
    TAB_ROW_FADE,
    direction,
  )
  if (delta !== 0) row.scrollLeft += delta
}

/**
 * The tab row rule on one element: spread the result on the row's scroller (with
 * TAB_ROW_SCROLLER). `active` is the active tab's key; the row scrolls it into view when first
 * drawn and whenever it changes.
 */
export function useTabRow(active: string | undefined): {
  ref: (element: HTMLElement | null) => void
  'data-fade'?: ''
  style?: CSSProperties
} {
  const { direction } = useLiro()
  const [element, setElement] = useState<HTMLElement | null>(null)
  const mask = edgeFade(useOverflowEnds(element), direction)
  useLayoutEffect(() => {
    if (element === null) return
    revealActive(element, direction)
    // A web font that arrives later changes the tabs' widths: reveal again once it is in.
    const fonts = typeof document === 'undefined' ? undefined : document.fonts
    let live = true
    void fonts?.ready.then(() => {
      if (live) revealActive(element, direction)
    })
    return () => {
      live = false
    }
  }, [element, active, direction])
  return {
    ref: setElement,
    ...(mask === undefined ? {} : { 'data-fade': '' as const, style: { maskImage: mask } }),
  }
}
