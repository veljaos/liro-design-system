import { useLayoutEffect, type RefObject } from 'react'

/*
 * Table headers that stay in view below the shell (P5.28 item 4; P5.90 item 8). A wide grid
 * scrolls sideways in its own region (`overflow-x: auto`), and such a region is a scroll
 * container: a `position: sticky` header inside it sticks to the region, never to the page, so on
 * a long page it would scroll away under the AppShell's header.
 *
 * The rule, for every table, grid and schedule with a header row:
 * - The header group (thead, or the header row's element) carries `STICKY_HEAD` and a background:
 *   one band on one layer, sticky at the top of its own region (when the region scrolls down
 *   itself, inside `maxHeight` or virtualized), and moved down while the region's top is above the
 *   page's sticky edge — the bottom of the shell's sticky top (`--liro-shell-top`). The header
 *   never leaves its region: it stops at the region's last row. Its cells are not layers of their
 *   own (P5.90 item 1): adjacent layers at fractional positions left hairline gaps, white stripes
 *   on the grey header; the group's background fills any such gap with the header's colour.
 * - The move is pure CSS (styles.css, "Sticky table headers"): a scroll-driven animation on the
 *   region's view timeline, inset by the shell's height. It runs with the scrolling itself (on the
 *   compositor), so the header is glued at any speed, and no script runs on scroll.
 *   `useStickyHead` names the region (`data-sticky-region`) and measures, on resize only, the
 *   header's height, the room it may move in and the first column's width. A browser without
 *   scroll-driven animations keeps the header at its region's top.
 * - The header group carries `data-sticky-head`, so its height is known; the corner cell carries
 *   `data-sticky-start`, so the first column's width is (with a selection column before it, both
 *   carry it: the cover runs to the farthest end).
 * - The region carries `STICKY_CLEARANCE`, so a cell the keyboard reaches is scrolled clear of
 *   the shell, the header and the first column.
 * - The first column (the row headers: names, people, resources) is `STICKY_START` inside the
 *   region, on an opaque surface, above the body cells; the corner cell is sticky at the start
 *   inside the sticky header group, above the other header cells. Layers: body cells 0, the first
 *   column 5, the header group 10, the corner 20 inside it (all inside the region, under the
 *   shell's layers).
 * - No ancestor between the region and the page's scroller may be `overflow: hidden`: such a box is
 *   a scroll container that never scrolls, and it would own the region's timeline. Cards clip with
 *   `overflow: clip` instead.
 */

/**
 * The header group (thead, or the header row's element): sticky at its region's top and moved by
 * the page's scroll (`liro-sticky-head` in styles.css). Always one layer of its own
 * (`will-change-transform`): Chromium otherwise decides from frame to frame whether it gets one,
 * and its text was drawn with one antialiasing or the other — the same story gave two pictures
 * (P5.28). The group needs a background (its cells' colour), so nothing shows between its cells.
 */
export const STICKY_HEAD = 'liro-sticky-head sticky top-0 will-change-transform'

/**
 * A first column's cells (and the corner): sticky at the region's start, always on a layer of
 * their own for the same reason as `STICKY_HEAD` — without it the statutory grid's labels were
 * antialiased one way or the other from run to run (P5.29). The layer is a 3D transform, not
 * `will-change`: a `will-change` layer kept its row's fractional position, and where the next
 * row's cell rounded the other way its background covered the row's line (rows are fractional:
 * the 1.45 line height). A `translateZ(0)` layer is placed on whole pixels, so every row's line
 * shows in the first column as in the others (P5.91).
 */
export const STICKY_START = 'sticky start-0 [transform:translateZ(0)]'

/** The first column after DataTable's 48px selection column. */
export const STICKY_START_AFTER_SELECT = 'sticky start-12 [transform:translateZ(0)]'

/**
 * On the region: a cell reached by the keyboard is scrolled clear of the shell, the header and the
 * sticky first column (focus never hidden, WCAG 2.4.11). The hook keeps `--liro-head-height` (the
 * header's height) and `--liro-start-width` (the width of the cell marked `data-sticky-start`, the
 * corner).
 */
export const STICKY_CLEARANCE =
  '[&_:is([role=gridcell],[role=rowheader],td,th[scope=row],tr[tabindex],[data-cell])]:scroll-mt-[calc(var(--liro-shell-top,0px)+var(--liro-head-height,0px))] [&_:is([role=gridcell],td,[data-cell])]:scroll-ms-[var(--liro-start-width,0px)]'

/**
 * Where the header moves (P5.90 item 8), px, as the CSS variables the scroll-driven animation
 * reads: it starts once the region's top (its border edge) is `start` px above the sticky edge —
 * the header stands inside the region's top border — and moves at most `room` px, the region's
 * inner height less the header's, so it stops at the last row.
 */
export function headTrack(
  borderTop: number,
  innerHeight: number,
  headHeight: number,
): { start: number; room: number } {
  return { start: Math.max(0, borderTop), room: Math.max(0, innerHeight - headHeight) }
}

/**
 * How much of the region's start the sticky first column covers, px: from the region's inner start
 * edge (`start`: its left inside the border, or its right in right to left) to the farthest end of
 * the cells marked `data-sticky-start` (the corner; with a selection column before it, both).
 */
export function startCover(
  start: number,
  cells: readonly { left: number; right: number }[],
  rtl: boolean,
): number {
  let width = 0
  for (const cell of cells) {
    width = Math.max(width, Math.round(rtl ? start - cell.left : cell.right - start))
  }
  return width
}

/** `startCover` measured: borders on both sides are the same; a vertical scrollbar stands at the end. */
function startWidth(region: HTMLElement): number {
  const cells = [...region.querySelectorAll<HTMLElement>('[data-sticky-start]')]
  if (cells.length === 0) return 0
  const box = region.getBoundingClientRect()
  const rtl = getComputedStyle(region).direction === 'rtl'
  const start = rtl ? box.right - region.clientLeft : box.left + region.clientLeft
  return startCover(
    start,
    cells.map((cell) => cell.getBoundingClientRect()),
    rtl,
  )
}

/** The CSS variables `useStickyHead` writes on its region. */
export const STICKY_VARIABLES = [
  '--liro-head-height',
  '--liro-head-start',
  '--liro-head-room',
  '--liro-start-width',
] as const

/**
 * Makes a region's header group (`STICKY_HEAD`) stay below the shell while the page scrolls (P5.28
 * item 4, P5.90 item 8): names the region for the CSS (`data-sticky-region`) and measures, when
 * the region, its header or its corner changes size, `--liro-head-height`, `--liro-head-start`,
 * `--liro-head-room` and `--liro-start-width`. Nothing runs on scroll: the header moves with the
 * scrolling itself.
 */
export function useStickyHead(region: RefObject<HTMLElement | null>, enabled = true): void {
  useLayoutEffect(() => {
    const element = region.current
    if (!enabled || element === null) return
    // Written only when it changes: every cell inherits these properties, so a write restyles the
    // whole grid.
    const write = (name: (typeof STICKY_VARIABLES)[number], px: number) => {
      const value = `${String(px)}px`
      if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value)
    }
    let head: Element | null = null
    let corner: Element | null = null
    const observer = new ResizeObserver(() => {
      measure()
    })
    // A header or corner drawn later (after loading) is observed from then on.
    const follow = (previous: Element | null, next: Element | null) => {
      if (previous === next) return
      if (previous !== null) observer.unobserve(previous)
      if (next !== null) observer.observe(next)
    }
    const measure = () => {
      const nextHead = element.querySelector<HTMLElement>('[data-sticky-head]')
      const nextCorner = element.querySelector('[data-sticky-start]')
      follow(head, nextHead)
      follow(corner, nextCorner)
      head = nextHead
      corner = nextCorner
      const height = nextHead?.offsetHeight ?? 0
      const track = headTrack(element.clientTop, element.clientHeight, height)
      write('--liro-head-height', height)
      write('--liro-head-start', track.start)
      write('--liro-head-room', track.room)
      write('--liro-start-width', startWidth(element))
    }
    element.setAttribute('data-sticky-region', '')
    measure()
    observer.observe(element)
    return () => {
      observer.disconnect()
      element.removeAttribute('data-sticky-region')
      for (const name of STICKY_VARIABLES) element.style.removeProperty(name)
    }
  }, [region, enabled])
}
