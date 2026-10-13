import { useLayoutEffect, type RefObject } from 'react'

/*
 * Table headers that stay in view below the shell (P5.28 item 4). A wide grid scrolls sideways in
 * its own region (`overflow-x: auto`), and such a region is a scroll container: a `position:
 * sticky` header inside it sticks to the region, never to the page, so on a long page it scrolled
 * away under the AppShell's header (School, gradebook: the dates row disappeared under it).
 *
 * The rule, for every table, grid and schedule with a header row:
 * - The header cells carry `STICKY_HEAD`: sticky at the top of their own region (when the region
 *   scrolls down itself, inside `maxHeight` or virtualized), then moved down by
 *   `--liro-head-shift`, which `useStickyHead` keeps equal to how far the region's top has gone
 *   above the page's sticky edge — the bottom of the shell's sticky top (`--liro-shell-top`), or
 *   the top of the scrolling container when there is no shell. The header never leaves its
 *   region: it stops at the region's last row.
 * - The header group (thead, or the header row's element) carries `data-sticky-head`, so its
 *   height is known; the corner cell carries `data-sticky-start`, so the first column's width is.
 * - The region carries `STICKY_CLEARANCE`, so a cell the keyboard reaches is scrolled clear of
 *   the shell, the header and the first column.
 * - The first column (the row headers: names, people, resources) is `sticky start-0` inside the
 *   region, on an opaque surface, above the body cells; the corner cell is both and above both.
 *   Layers: body cells 0, the first column 5, the header row 10, the corner 20 (all inside the
 *   region, under the shell's layers).
 * A header with no region of its own (a table that never scrolls sideways) may simply be
 * `sticky top-[var(--liro-shell-top,0px)]`; the hook gives the same result.
 */

/** The header cells: sticky at their region's top, then moved by the page's scroll. */
export const STICKY_HEAD = 'sticky top-0 translate-y-[var(--liro-head-shift,0px)]'

/**
 * On the region: a cell reached by the keyboard is scrolled clear of the shell, the header and the
 * sticky first column (focus never hidden, WCAG 2.4.11). The hook keeps `--liro-head-height` (the
 * header's height) and `--liro-start-width` (the width of the cell marked `data-sticky-start`, the
 * corner).
 */
export const STICKY_CLEARANCE =
  '[&_:is([role=gridcell],[role=rowheader],td,th[scope=row],tr[tabindex],[data-cell])]:scroll-mt-[calc(var(--liro-shell-top,0px)+var(--liro-head-height,0px))] [&_:is([role=gridcell],td,[data-cell])]:scroll-ms-[var(--liro-start-width,0px)]'

/**
 * How far the header moves down, px: the part of the region above the sticky edge, never less
 * than 0 and never past the region's last row (`room`: the region's height minus the header's).
 */
export function headShift(regionTop: number, edge: number, room: number): number {
  return Math.max(0, Math.min(edge - regionTop, room))
}

/** The nearest ancestor that scrolls vertically, or null for the page itself. */
function scrollingAncestor(element: HTMLElement): HTMLElement | null {
  let current = element.parentElement
  while (current !== null && current !== document.body && current !== document.documentElement) {
    const { overflowY } = getComputedStyle(current)
    if (
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      current.scrollHeight > current.clientHeight
    ) {
      return current
    }
    current = current.parentElement
  }
  return null
}

/**
 * The page's sticky edge in viewport coordinates: the top of the scrolling container (0 for the
 * page) plus the shell's sticky top when the shell scrolls in that container.
 */
function stickyEdge(element: HTMLElement): number {
  const scroller = scrollingAncestor(element)
  const top = scroller === null ? 0 : scroller.getBoundingClientRect().top + scroller.clientTop
  const shell = element.closest<HTMLElement>('[style*="--liro-shell-top"]')
  if (shell === null || (scroller !== null && !scroller.contains(shell))) return top
  return (
    top + (Number.parseFloat(getComputedStyle(element).getPropertyValue('--liro-shell-top')) || 0)
  )
}

/**
 * Keeps `--liro-head-shift` on the region (P5.28 item 4): the header cells (`STICKY_HEAD`) of a
 * region that scrolls sideways stay below the shell while the page scrolls. Updated once a frame
 * on any scroll (the page, a phone frame's page, an application's container) and on resize.
 */
export function useStickyHead(region: RefObject<HTMLElement | null>, enabled = true): void {
  useLayoutEffect(() => {
    const element = region.current
    if (!enabled || element === null) return
    let frame = 0
    // Written only when it changes: every cell inherits these properties, so a write restyles the
    // whole grid.
    const write = (name: string, px: number) => {
      const value = `${String(px)}px`
      if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value)
    }
    const update = () => {
      frame = 0
      const head = element.querySelector<HTMLElement>('[data-sticky-head]')
      const height = head?.offsetHeight ?? 0
      const rect = element.getBoundingClientRect()
      write(
        '--liro-head-shift',
        headShift(rect.top + element.clientTop, stickyEdge(element), element.clientHeight - height),
      )
      write('--liro-head-height', height)
      write(
        '--liro-start-width',
        element.querySelector<HTMLElement>('[data-sticky-start]')?.offsetWidth ?? 0,
      )
    }
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update)
    }
    update()
    document.addEventListener('scroll', schedule, { capture: true, passive: true })
    window.addEventListener('resize', schedule)
    const observer = new ResizeObserver(schedule)
    observer.observe(element)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('scroll', schedule, { capture: true })
      window.removeEventListener('resize', schedule)
      observer.disconnect()
      element.style.removeProperty('--liro-head-shift')
      element.style.removeProperty('--liro-head-height')
      element.style.removeProperty('--liro-start-width')
    }
  }, [region, enabled])
}
