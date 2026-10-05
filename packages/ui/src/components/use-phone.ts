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

/** The settled answer, shared by every component; undefined until first read. */
let settled: boolean | undefined
let query: MediaQueryList | undefined
let timer: number | undefined
const listeners = new Set<() => void>()

function livePhone(): boolean {
  return !window.matchMedia(WIDE_QUERY).matches
}

function readSettled(): boolean {
  settled ??= livePhone()
  return settled
}

/** After LAYOUT_SETTLE without another change, the live answer becomes the settled one. */
function scheduleSettle() {
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    const next = livePhone()
    if (next === settled) return
    settled = next
    listeners.forEach((listener) => {
      listener()
    })
  }, LAYOUT_SETTLE)
}

function subscribeToWidth(onChange: () => void) {
  if (query === undefined) {
    query = window.matchMedia(WIDE_QUERY)
    query.addEventListener('change', scheduleSettle)
  }
  // The viewport may have changed between the first read and this subscription.
  if (livePhone() !== readSettled()) scheduleSettle()
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

/** The store behind usePhone, for its tests (not exported from the package). */
export const phoneStore = { subscribe: subscribeToWidth, read: readSettled }

/**
 * Whether the viewport is a phone's, for components that render a different layout there (real
 * branching, Appendix B.5). It changes only after the viewport has stayed across 48em for
 * LAYOUT_SETTLE. On the server: not.
 */
export function usePhone(): boolean {
  return useSyncExternalStore(subscribeToWidth, readSettled, () => false)
}
