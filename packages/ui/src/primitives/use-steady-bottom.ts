import { useLayoutEffect, useRef, type RefObject } from 'react'

/*
 * A steady bottom (P5.23, the owner's review of the bank statement): when the content of a
 * scrolling area shrinks while the area is scrolled to (or near) its end, the browser clamps the
 * scroll position and everything in view moves down by what was removed — a line of a result
 * that disappears as a second item is unticked made the whole detail jump under the pointer.
 * CSS scroll anchoring does not cover it (it keeps content above the view steady, not a clamp at
 * the end). The rule (docs/decisions.md): content that changes as the user works never moves
 * what is in view. Here, a spacer after the content holds the space the content gave up, so the
 * scroll position stays; it gives the space back as the user scrolls up (only space under the
 * view goes, so nothing moves), and it is cleared when the area shows something else (`key`).
 */

/**
 * The spacer's height, in px, so that the view keeps its position: the part of the view's bottom
 * that the content (from `contentTop`, `contentHeight` high) no longer reaches. 0 when it does,
 * and never more than the scroll position it holds: at the top there is nothing to hold, so a
 * content shorter than the view leaves no space after it.
 */
export function steadySpacer(
  scrollTop: number,
  viewHeight: number,
  contentTop: number,
  contentHeight: number,
): number {
  const missing = Math.ceil(scrollTop + viewHeight - (contentTop + contentHeight))
  return Math.max(0, Math.min(missing, Math.ceil(scrollTop)))
}

/** The nearest ancestor that scrolls vertically, or the document's scrolling element. */
function scrollerOf(element: HTMLElement): HTMLElement {
  for (let parent = element.parentElement; parent !== null; parent = parent.parentElement) {
    const overflow = getComputedStyle(parent).overflowY
    if (overflow === 'auto' || overflow === 'scroll') return parent
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement
}

/**
 * Keeps the view of the scrolling area around `content` steady when the content shrinks.
 * Render the returned ref on an empty element placed right after the content, inside the same
 * scrolling area. `key` names what the area shows (the item); a new key clears the spacer.
 */
export function useSteadyBottom(
  content: RefObject<HTMLElement | null>,
  key: unknown,
): RefObject<HTMLDivElement | null> {
  const spacer = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const inner = content.current
    const hold = spacer.current
    if (inner === null || hold === null) return
    hold.style.height = '0px'
    const box = scrollerOf(inner)
    const isDocument = box === document.scrollingElement
    const target: HTMLElement | Window = isDocument ? window : box
    const viewHeight = () => (isDocument ? window.innerHeight : box.clientHeight)
    const contentTop = () =>
      inner.getBoundingClientRect().top -
      (isDocument ? 0 : box.getBoundingClientRect().top) +
      box.scrollTop
    let last = box.scrollTop
    const fit = (scrollTop: number) => {
      const height = steadySpacer(scrollTop, viewHeight(), contentTop(), inner.offsetHeight)
      hold.style.height = `${String(height)}px`
    }
    // The content changed size: the layout may already have clamped the position (the scroll
    // event comes in the next frame), so the spacer is sized for the position before it, and the
    // position put back, before the frame is painted.
    const observer = new ResizeObserver(() => {
      fit(last)
      if (box.scrollTop !== last) box.scrollTop = last
    })
    observer.observe(inner)
    const scrolled = () => {
      last = box.scrollTop
      if (hold.style.height !== '0px') fit(last)
    }
    target.addEventListener('scroll', scrolled, { passive: true })
    return () => {
      observer.disconnect()
      target.removeEventListener('scroll', scrolled)
      hold.style.height = '0px'
    }
  }, [content, key])
  return spacer
}
