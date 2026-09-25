import { Dialog as SheetPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { usePortalContainer } from '../provider/portal'
import { BACKDROP } from './classes'
import { cn } from './cn'

/*
 * A side sheet (shadcn/ui sheet, adapted; Mantine Drawer.css, DrawerRoot and ModalBase): 440px
 * wide (size 'md') and full height, or full width and 440px high at the top or bottom; the
 * overlay surface, shadow xl, no radius; it slides in from its side with a fade in 200ms. The
 * header, title, body, footer and close button are the Dialog's.
 *
 * The side is logical: 'start' is the left in left-to-right and the right in right-to-left, and
 * it slides from that side, as Mantine's drawer does. shadcn/ui's sheet uses physical left and
 * right, which stay on the same side of the screen in right-to-left (P2.1 finding).
 */

export const Sheet = SheetPrimitive.Root
export const SheetTrigger = SheetPrimitive.Trigger
export const SheetClose = SheetPrimitive.Close

export type SheetSide = 'start' | 'end' | 'top' | 'bottom'

const SIDES: Record<SheetSide, string> = {
  start:
    'inset-y-0 start-0 h-full w-110 max-w-full [--liro-slide-from:translateX(-100%)] rtl:[--liro-slide-from:translateX(100%)]',
  end: 'inset-y-0 end-0 h-full w-110 max-w-full [--liro-slide-from:translateX(100%)] rtl:[--liro-slide-from:translateX(-100%)]',
  top: 'inset-x-0 top-0 h-110 max-h-full w-full [--liro-slide-from:translateY(-100%)]',
  bottom: 'inset-x-0 bottom-0 h-110 max-h-full w-full [--liro-slide-from:translateY(100%)]',
}

export function SheetContent({
  side = 'start',
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & {
  /** Default: 'start', as Mantine's drawer ('left', which follows the direction). */
  side?: SheetSide
}) {
  const container = usePortalContainer()
  return (
    <SheetPrimitive.Portal container={container}>
      <SheetPrimitive.Overlay data-slot="sheet-overlay" className={BACKDROP} />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          'fixed z-(--liro-layer-modal) flex flex-col overflow-y-auto bg-surface-overlay font-sans text-primary shadow-xl outline-none',
          'data-[state=open]:animate-liro-slide-in data-[state=closed]:animate-liro-slide-out motion-reduce:animate-none',
          SIDES[side],
          className,
        )}
        {...props}
      />
    </SheetPrimitive.Portal>
  )
}
