import { useLayoutEffect, useState } from 'react'
import { TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Tooltip } from './popover'

/**
 * A short label on one line that never breaks inside a word (P5.94 item 4): where its box is too
 * narrow it ends in "…", and only then the whole label shows in the library's Tooltip on hover.
 * The text stays whole in the DOM, so the accessible name is never cut. Internal: a button's or a
 * choice's label where the room is tight (the ways to pay); body text wraps between words instead.
 */
export function FittedLabel({ text, className }: { text: string; className?: string }) {
  // A callback ref: the span is a new element once it stands inside the Tooltip.
  const [element, setElement] = useState<HTMLSpanElement | null>(null)
  const [cut, setCut] = useState(false)
  useLayoutEffect(() => {
    if (element === null) return
    const measure = () => {
      setCut(element.scrollWidth > element.clientWidth + 1)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [element, text])
  const label = (
    <span
      ref={setElement}
      data-slot="fitted-label"
      className={cn('block min-w-0 truncate', TEXT_ISOLATE, className)}
    >
      {text}
    </span>
  )
  return cut ? <Tooltip label={text}>{label}</Tooltip> : label
}
