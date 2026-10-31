import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import {
  dropLineOffset,
  dropMoves,
  listDropTarget,
  type DropPlace,
  type DropZoneGeometry,
} from './list-drag-logic'

/*
 * Dragging an item between lists, on the dragging rule: pointer events, never the browser's drag
 * and drop; a mouse or pen drag starts after 4px, a touch after a 250ms press without moving more
 * than 8px (a swipe still scrolls, and once a touch drag has started the page does not scroll under
 * it). The lists are the container's elements marked `data-drop-zone="<id>"`, their items `data-drop-item="<id>"`; both are measured
 * when the drag starts. The component draws the lifted item (`dx`, `dy`), the list it would land
 * in and the line at `line` pixels from that list's top — neutral, never blue. Releasing
 * reports the place (`onDrop`) when it changes anything; Escape or a cancelled pointer puts it
 * back. Dragging is a shortcut: every component that uses it has a menu (and so a keyboard) way.
 */

export interface ListDragState {
  itemId: string
  from: DropPlace
  target: DropPlace
  /** The pointer's movement since the press, for the lifted item's transform. */
  dx: number
  dy: number
  /** The landing line, in pixels from the target list's top. */
  line: number
}

export interface ListDragOptions {
  container: RefObject<HTMLElement | null>
  /** Whether the item may land in the list. Default: any list. */
  accepts?: (itemId: string, zone: string) => boolean
  onDrop: (itemId: string, from: DropPlace, to: DropPlace) => void
  /** Escape or a cancelled pointer put the item back. */
  onCancel?: (itemId: string) => void
}

/** The lists and their items, measured from the container's top-left corner. */
function measure(container: HTMLElement): DropZoneGeometry[] {
  const box = container.getBoundingClientRect()
  return Array.from(container.querySelectorAll<HTMLElement>('[data-drop-zone]')).map((zone) => {
    const rect = zone.getBoundingClientRect()
    return {
      id: zone.dataset.dropZone ?? '',
      x: rect.left - box.left,
      y: rect.top - box.top,
      width: rect.width,
      height: rect.height,
      items: Array.from(zone.querySelectorAll<HTMLElement>('[data-drop-item]'))
        .filter((item) => item.parentElement?.closest('[data-drop-zone]') === zone)
        .map((item) => {
          const itemRect = item.getBoundingClientRect()
          return {
            id: item.dataset.dropItem ?? '',
            y: itemRect.top - box.top,
            height: itemRect.height,
          }
        }),
    }
  })
}

/** The live drag of items between lists: its state and the handler for an item's pointerdown. */
export function useListDrag(options: ListDragOptions): {
  drag: ListDragState | null
  startDrag: (event: PointerEvent<HTMLElement>, itemId: string) => void
} {
  const [drag, setDrag] = useState<ListDragState | null>(null)
  const latest = useRef(options)
  useEffect(() => {
    latest.current = options
  })

  const startDrag = (event: PointerEvent<HTMLElement>, itemId: string) => {
    const container = latest.current.container.current
    if (container === null || event.button !== 0 || drag !== null) return
    const touch = event.pointerType === 'touch'
    const startX = event.clientX
    const startY = event.clientY
    let active = false
    let geometry: DropZoneGeometry[] = []
    let current: ListDragState | null = null
    const activate = (): boolean => {
      geometry = measure(container)
      const zone = geometry.find((each) => each.items.some((item) => item.id === itemId))
      if (zone === undefined) return false
      const from = { zone: zone.id, index: zone.items.findIndex((item) => item.id === itemId) }
      active = true
      current = {
        itemId,
        from,
        target: from,
        dx: 0,
        dy: 0,
        line: dropLineOffset(zone, itemId, from.index),
      }
      setDrag(current)
      return true
    }
    const timer = touch
      ? window.setTimeout(() => {
          activate()
        }, 250)
      : undefined
    const finish = (commit: boolean) => {
      window.clearTimeout(timer)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('touchmove', onTouchMove)
      const ended: ListDragState | null = current
      setDrag(null)
      if (!active || ended === null) return
      if (commit && dropMoves(ended.from, ended.target)) {
        latest.current.onDrop(itemId, ended.from, ended.target)
      } else if (!commit) {
        latest.current.onCancel?.(itemId)
      }
    }
    const onMove = (move: globalThis.PointerEvent) => {
      const distance = Math.hypot(move.clientX - startX, move.clientY - startY)
      if (!active) {
        if (touch) {
          if (distance > 8) finish(false)
          return
        }
        if (distance < 4) return
        if (!activate()) return
      }
      if (current === null) return
      const box = container.getBoundingClientRect()
      const accepts = latest.current.accepts
      const target =
        listDropTarget(
          geometry,
          itemId,
          { x: move.clientX - box.left, y: move.clientY - box.top },
          accepts === undefined ? undefined : (zone) => accepts(itemId, zone),
        ) ?? current.from
      const zone = geometry.find((each) => each.id === target.zone)
      current = {
        ...current,
        target,
        dx: move.clientX - startX,
        dy: move.clientY - startY,
        line: zone === undefined ? 0 : dropLineOffset(zone, itemId, target.index),
      }
      setDrag(current)
    }
    const onUp = () => {
      finish(true)
    }
    const onCancel = () => {
      finish(false)
    }
    const onKey = (key: KeyboardEvent) => {
      if (key.key !== 'Escape' || !active) return
      key.preventDefault()
      key.stopPropagation()
      finish(false)
    }
    const onTouchMove = (touchMove: TouchEvent) => {
      if (active) touchMove.preventDefault()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
  }

  return { drag, startDrag }
}

/** The lifted item's look while it is dragged (shadow lg, border.strong, the raised layer). */
export const LIFTED = 'relative z-(--liro-layer-raised) cursor-grabbing border-strong shadow-lg'

/** The list it would land in: the neutral selection, never blue. */
export const DROP_ZONE_ACTIVE = 'bg-surface-selected'

/** The landing line inside the list (position it with `top`): 2px border.strong, neutral. */
export const DROP_LINE =
  'pointer-events-none absolute inset-x-1 z-(--liro-layer-raised) h-0 -translate-y-px border-0 border-t-2 border-solid border-strong'
