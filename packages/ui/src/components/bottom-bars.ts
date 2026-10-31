import { useLayoutEffect } from 'react'

/*
 * Sticky bottom bars and the toasts ("toasts never block"). A bar stuck to the
 * bottom of the page — a form's bottom bar, a wizard's Back / Next row on phones, an application's
 * own — registers itself here; the heights of the bars of one provider are added up and published
 * as --liro-bottom-bars on the provider's root (the closest [data-liro-theme]), which the Toaster
 * adds to the shell's own bottom bar (--liro-shell-bottom). Toasts then stand above every bar and
 * never cover its actions.
 *
 * A separate variable from --liro-shell-bottom on purpose: the bars position themselves above the
 * shell's bar with --liro-shell-bottom, so they must not read their own height back.
 */

const bars = new Map<HTMLElement, Set<HTMLElement>>()

/** The sum of the heights of the registered bars of `owner`, in whole pixels; for the test. */
export function bottomBarsHeight(heights: readonly number[]): number {
  return Math.round(heights.reduce((sum, height) => sum + Math.max(0, height), 0))
}

function publish(owner: HTMLElement) {
  const registered = bars.get(owner)
  const total = bottomBarsHeight([...(registered ?? [])].map((bar) => bar.offsetHeight))
  if (total === 0) owner.style.removeProperty('--liro-bottom-bars')
  else owner.style.setProperty('--liro-bottom-bars', `${String(total)}px`)
}

/**
 * Registers a bar stuck to the bottom of the page while it is mounted (and `active`), so the
 * toasts stand above it. Pass the bar's element (a callback ref's state).
 */
export function useBottomBar(element: HTMLElement | null, active = true) {
  useLayoutEffect(() => {
    if (element === null || !active) return
    const owner = element.closest<HTMLElement>('[data-liro-theme]') ?? document.documentElement
    const registered = bars.get(owner) ?? new Set<HTMLElement>()
    registered.add(element)
    bars.set(owner, registered)
    publish(owner)
    const observer = new ResizeObserver(() => {
      publish(owner)
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
      registered.delete(element)
      if (registered.size === 0) bars.delete(owner)
      publish(owner)
    }
  }, [element, active])
}
