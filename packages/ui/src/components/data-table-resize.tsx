import { ChevronsLeftRight, ChevronsRightLeft } from 'lucide-react'
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Popover, PopoverAnchor, PopoverContent } from '../primitives/popover'
import { useLiro } from '../provider/liro-provider'
import { CompactIconButton } from './button'
import {
  clampWidth,
  MAX_COLUMN_WIDTH,
  RESIZE_STEP_LARGE,
  widthAfterDrag,
  widthAfterKey,
} from './data-table-logic'

/*
 * The column-resize handle (BUILD-PLAN P3.2), the previous Design System's, carried over (the
 * owner, 2026-09-30, docs/decisions.md "Table"):
 * - an invisible 9px strip on the header cell's end edge (inset-inline-end -4px), the header's
 *   full height, col-resize cursor, no text selection, no touch scrolling;
 * - inside it a 3px, fully rounded line, 64% of the header's height, from 18% down, 3px from the
 *   strip's start; transparent, border.default while the pointer is anywhere over the header,
 *   brand.solid while the pointer is on the strip, it has keyboard focus or a drag runs; colour
 *   transition base / standard;
 * - a separator with aria-valuenow / min / max: arrows change the width by 10px (Shift 40px), the
 *   arrow that widens points in the reading direction;
 * - dragging measures from the leading edge (Appendix B.7);
 * - a press without moving opens a popover with "Narrower" and "Wider" (−40px / +40px), the
 *   alternative to dragging (WCAG 2.5.7; the owner's deliberate addition, 2026-09-30).
 */

/** A pointer that moves less than this between press and release has not dragged. */
const CLICK_SLOP = 3

export interface ResizeHandleProps {
  /** The column's name, for the handle's and the buttons' accessible names. */
  label: string
  width: number
  /** The column's own minimum. */
  min: number
  /** Called with every new width while resizing. */
  onResize: (width: number) => void
  /** Called once when a resize ends (drag released, key, button), to report the widths. */
  onResizeEnd: () => void
}

/** The resize handle of one header cell. The header cell must be positioned and a group/header. */
export function ResizeHandle({ label, width, min, onResize, onResizeEnd }: ResizeHandleProps) {
  const { messages, direction } = useLiro()
  const strip = useRef<HTMLDivElement>(null)
  const drag = useRef<{ startX: number; startWidth: number; moved: boolean } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [open, setOpen] = useState(false)

  const change = (next: number) => {
    onResize(next)
    onResizeEnd()
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { startX: event.clientX, startWidth: width, moved: false }
    setDragging(true)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current
    if (current === null) return
    if (Math.abs(event.clientX - current.startX) >= CLICK_SLOP) current.moved = true
    if (current.moved) {
      onResize(widthAfterDrag(current.startWidth, current.startX, event.clientX, direction, min))
    }
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current
    drag.current = null
    setDragging(false)
    if (current === null) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (current.moved) onResizeEnd()
    else {
      strip.current?.focus()
      setOpen(true)
    }
  }
  const onPointerCancel = () => {
    drag.current = null
    setDragging(false)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = widthAfterKey(width, event.key, event.shiftKey, direction, min)
    if (next === null) return
    event.preventDefault()
    change(next)
  }

  const narrower = clampWidth(width - RESIZE_STEP_LARGE, min)
  const wider = clampWidth(width + RESIZE_STEP_LARGE, min)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          ref={strip}
          role="separator"
          aria-orientation="vertical"
          aria-label={messages['table.resizeColumn'](label)}
          aria-valuenow={width}
          aria-valuemin={min}
          aria-valuemax={MAX_COLUMN_WIDTH}
          tabIndex={0}
          data-resizing={dragging ? '' : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onKeyDown={onKeyDown}
          className="group/handle absolute inset-y-0 -end-1 z-10 w-[9px] cursor-col-resize touch-none outline-none select-none"
        >
          <span
            aria-hidden="true"
            className={
              // The line is drawn by its 3px start border on a zero-width box: grey (border.default)
              // over the header, brand.solid as a background under a transparent border on the
              // strip. The strip rules stack on the header rule, so they are more specific and win.
              'absolute start-[3px] top-[18%] box-border h-[64%] w-0 rounded-full border-0 border-s-[3px] border-solid border-transparent bg-transparent transition-colors duration-(--liro-duration-base) ease-standard ' +
              'group-hover/header:border-default ' +
              'group-hover/handle:bg-brand-solid group-hover/header:group-hover/handle:border-transparent ' +
              'group-focus-visible/handle:bg-brand-solid group-focus-visible/handle:border-transparent group-hover/header:group-focus-visible/handle:border-transparent ' +
              'group-data-resizing/handle:bg-brand-solid group-data-resizing/handle:border-transparent group-hover/header:group-data-resizing/handle:border-transparent'
            }
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="center"
        aria-label={messages['table.resizeColumn'](label)}
        onCloseAutoFocus={(event) => {
          // Back to the handle, which is an anchor, not a trigger Radix would return to.
          event.preventDefault()
          strip.current?.focus()
        }}
        className="flex w-auto gap-4"
      >
        <CompactIconButton
          icon={ChevronsRightLeft}
          label={messages['table.narrower'](label)}
          disabled={narrower === width}
          onClick={() => {
            change(narrower)
          }}
        />
        <CompactIconButton
          icon={ChevronsLeftRight}
          label={messages['table.wider'](label)}
          disabled={wider === width}
          onClick={() => {
            change(wider)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
