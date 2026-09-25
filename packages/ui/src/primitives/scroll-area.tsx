import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { FOCUS_RING } from './classes'
import { cn } from './cn'

/*
 * A scrolling region with thin scrollbars (shadcn/ui scroll-area, adapted; Mantine ScrollArea.css
 * and defaults): scrollbars 12px with 2.4px (12 / 5) padding, shown while the pointer is over the
 * region and hidden 1000ms after it leaves; the track takes surface.hover on hover; the thumb is
 * border.control, fully rounded, with a 44px invisible grip. The vertical bar sits at the inline
 * end: on the right in left-to-right, on the left in right-to-left (Radix reads the direction).
 */

export function ScrollArea({
  className,
  children,
  type = 'hover',
  scrollHideDelay = 1000,
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      type={type}
      scrollHideDelay={scrollHideDelay}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      {/* Focusable, so the region can be scrolled with the keyboard (WCAG 2.1.1). */}
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        tabIndex={0}
        className={cn('size-full rounded-[inherit]', FOCUS_RING)}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation="vertical" />
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner className="bg-surface-hover" />
    </ScrollAreaPrimitive.Root>
  )
}

export function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.Scrollbar>) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'flex touch-none p-[2.4px] transition-colors duration-(--liro-duration-base) ease-standard select-none hover:bg-surface-hover',
        'data-[orientation=vertical]:h-full data-[orientation=vertical]:w-3',
        'data-[orientation=horizontal]:h-3 data-[orientation=horizontal]:flex-col',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-control before:absolute before:top-1/2 before:start-1/2 before:size-full before:min-h-11 before:min-w-11 before:-translate-y-1/2 before:-translate-x-1/2 rtl:before:translate-x-1/2"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}
