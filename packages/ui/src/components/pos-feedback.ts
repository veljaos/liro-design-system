import { useEffect, useRef, useState } from 'react'
import { compareDecimal } from './quantity-logic'

/*
 * Immediate feedback on every tap of a till ("ease sells"): a waiter with fifty
 * guests at the door must see at once that a tap counted, or they tap again out of doubt. A line
 * that appears in the order, or whose quantity goes up, is highlighted briefly (the neutral
 * selection surface, never blue; a colour change, not a movement, so it stays with reduced
 * motion — only the fade is dropped); a pressed product tile does the same, and a device that can
 * vibrate gives a short pulse. Nothing flashes when the screen first appears: only a change does.
 */

/** How long a highlighted line or tile stays highlighted, in milliseconds. */
export const FLASH_DURATION = 700

/** How long a tap's vibration lasts, in milliseconds. */
export const TAP_VIBRATION = 12

/** The quantity of each line by its id. */
export function quantitiesOf(
  lines: readonly { id: string; quantity: string }[],
): ReadonlyMap<string, string> {
  return new Map(lines.map((line) => [line.id, line.quantity]))
}

/**
 * The lines that are new or whose quantity went up since `before`; none on the first render
 * (`before` null), so a restored order does not flash. A quantity that is not a decimal string
 * (being typed) counts as unchanged.
 */
export function grownLines(
  before: ReadonlyMap<string, string> | null,
  lines: readonly { id: string; quantity: string }[],
): string[] {
  if (before === null) return []
  return lines
    .filter((line) => {
      const previous = before.get(line.id)
      if (previous === undefined) return true
      try {
        return compareDecimal(line.quantity, previous) > 0
      } catch {
        return false
      }
    })
    .map((line) => line.id)
}

/** A device's vibration, where it has one: the part of `navigator` this needs. */
interface Vibrating {
  vibrate?: (pattern: number) => boolean
}

/**
 * A short vibration on a touch device that can vibrate; nothing elsewhere (desktop browsers,
 * iOS Safari have no `navigator.vibrate`). Returns whether the device was asked to vibrate.
 */
export function tapFeedback(
  device: Vibrating | undefined = typeof navigator === 'undefined' ? undefined : navigator,
): boolean {
  if (device === undefined || typeof device.vibrate !== 'function') return false
  try {
    return device.vibrate(TAP_VIBRATION)
  } catch {
    // A browser may refuse a vibration before the first user gesture: the tap still counts.
    return false
  }
}

/** The ids highlighted now; each id is highlighted for FLASH_DURATION after `flash(ids)`. */
export function useFlash(): [ReadonlySet<string>, (ids: readonly string[]) => void] {
  const [flashing, setFlashing] = useState<ReadonlySet<string>>(() => new Set())
  const timers = useRef(new Map<string, number>())
  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending.values()) window.clearTimeout(timer)
    }
  }, [])
  const flash = (ids: readonly string[]) => {
    if (ids.length === 0) return
    setFlashing((current) => new Set([...current, ...ids]))
    for (const id of ids) {
      const running = timers.current.get(id)
      if (running !== undefined) window.clearTimeout(running)
      timers.current.set(
        id,
        window.setTimeout(() => {
          timers.current.delete(id)
          setFlashing((current) => {
            const next = new Set(current)
            next.delete(id)
            return next
          })
        }, FLASH_DURATION),
      )
    }
  }
  return [flashing, flash]
}

/**
 * The lines highlighted because they are new or grew since the last render (`grownLines`): the
 * order a till shows after each tap.
 */
export function useGrowingLines(
  lines: readonly { id: string; quantity: string }[],
): ReadonlySet<string> {
  const [flashing, flash] = useFlash()
  const before = useRef<ReadonlyMap<string, string> | null>(null)
  useEffect(() => {
    const grown = grownLines(before.current, lines)
    before.current = quantitiesOf(lines)
    flash(grown)
    // Runs after every render with new lines; an unchanged order finds nothing grown.
  }, [lines, flash])
  return flashing
}

/** The classes of a highlighted line or tile: the neutral selection, fading back. */
export const FLASH_CLASS = 'bg-surface-selected'
export const FLASH_TRANSITION =
  'transition-colors duration-500 ease-standard motion-reduce:transition-none'
