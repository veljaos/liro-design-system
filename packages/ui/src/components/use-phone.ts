import { useSyncExternalStore } from 'react'

/** Phones are narrower than the sm breakpoint (48em): DataTable, KeyValueList, FilterBar (owner). */
const WIDE_QUERY = '(min-width: 48em)'

/**
 * Milliseconds the viewport must stay on the other side of 48em before the layout changes. A
 * resize or a rotated tablet switches a moment later; a viewport that crosses 48em only for an
 * instant (Playwright's full-page screenshot sets it to 1 × 1px for about 100–200ms) renders
 * nothing anew, so no focus, typed text or pending dot is disturbed.
 */
export const LAYOUT_SETTLE = 300

/**
 * A settled "narrower than" answer for one media query, shared by every component that asks it:
 * undefined until first read, then changed only LAYOUT_SETTLE after the viewport last crossed.
 */
function createNarrowStore(wideQuery: string) {
  let settled: boolean | undefined
  let query: MediaQueryList | undefined
  let timer: number | undefined
  const listeners = new Set<() => void>()

  const live = () => !window.matchMedia(wideQuery).matches

  const read = (): boolean => {
    settled ??= live()
    return settled
  }

  /** After LAYOUT_SETTLE without another change, the live answer becomes the settled one. */
  const scheduleSettle = () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      const next = live()
      if (next === settled) return
      settled = next
      listeners.forEach((listener) => {
        listener()
      })
    }, LAYOUT_SETTLE)
  }

  const subscribe = (onChange: () => void) => {
    if (query === undefined) {
      query = window.matchMedia(wideQuery)
      query.addEventListener('change', scheduleSettle)
    }
    // The viewport may have changed between the first read and this subscription.
    if (live() !== read()) scheduleSettle()
    listeners.add(onChange)
    return () => {
      listeners.delete(onChange)
    }
  }

  return { subscribe, read }
}

const phone = createNarrowStore(WIDE_QUERY)

/** Narrower than md (62em): the WorklistPage stacks its list and detail (owner, P4.3). */
const belowMd = createNarrowStore('(min-width: 62em)')

/** The store behind usePhone, for its tests (not exported from the package). */
export const phoneStore = phone

/**
 * Whether the viewport is a phone's, for components that render a different layout there (real
 * branching, Appendix B.5). It changes only after the viewport has stayed across 48em for
 * LAYOUT_SETTLE. On the server: not.
 */
export function usePhone(): boolean {
  return useSyncExternalStore(phone.subscribe, phone.read, () => false)
}

/** Whether the viewport is narrower than md (62em), settled as usePhone. On the server: not. */
export function useBelowMd(): boolean {
  return useSyncExternalStore(belowMd.subscribe, belowMd.read, () => false)
}
