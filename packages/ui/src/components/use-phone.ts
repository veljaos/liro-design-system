import { useSyncExternalStore } from 'react'

/** Phones are narrower than the sm breakpoint (48em): DataTable, KeyValueList, FilterBar (owner). */
const WIDE_QUERY = '(min-width: 48em)'

function subscribeToWidth(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY)
  query.addEventListener('change', onChange)
  return () => {
    query.removeEventListener('change', onChange)
  }
}

/**
 * Whether the viewport is a phone's, for components that render a different layout there (real
 * branching, Appendix B.5). On the server: not.
 */
export function usePhone(): boolean {
  return useSyncExternalStore(
    subscribeToWidth,
    () => !window.matchMedia(WIDE_QUERY).matches,
    () => false,
  )
}
