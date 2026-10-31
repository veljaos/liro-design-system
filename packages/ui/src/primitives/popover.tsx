import { Popover as PopoverPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { usePortalContainer } from '../provider/portal'
import { usePhone } from '../components/use-phone'
import { useCollision } from '../provider/screen'
import { FLOATING, FLOATING_MOTION } from './classes'
import { cn } from './cn'

/*
 * A popover (shadcn/ui popover, adapted; Mantine Popover.css and defaults): 8px from its target,
 * padding 12px by 16px, the floating surface, fading in 150ms. No arrow (Mantine's withArrow is
 * false by default). It keeps 8px inside the screen (the viewport, or a phone frame) and is never
 * wider than the room there; on a phone it always moves to stay on the screen, even where a
 * component chose a fixed side for a stable picture (`avoidCollisions={false}`).
 */

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverAnchor = PopoverPrimitive.Anchor
export const PopoverClose = PopoverPrimitive.Close

export function PopoverContent({
  className,
  sideOffset = 8,
  avoidCollisions,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  const container = usePortalContainer()
  const collision = useCollision()
  const phone = usePhone()
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        sideOffset={sideOffset}
        {...collision}
        avoidCollisions={phone || (avoidCollisions ?? true)}
        className={cn(
          FLOATING,
          FLOATING_MOTION,
          'max-w-(--radix-popover-content-available-width) px-4 py-3 text-sm',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
