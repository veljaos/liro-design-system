import { Tooltip as TooltipPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { usePortalContainer } from '../provider/portal'
import { cn } from './cn'

/*
 * A tooltip (shadcn/ui tooltip, adapted). The previous Design System's tooltip (owner's decision,
 * 2026-09-25): inverted colours (surface.inverse, text.onInverse), radius sm (4px), 12px text, an
 * arrow, opening after 300ms. From Mantine Tooltip.css and defaults: padding 5px 10px, 5px from
 * its target, a 4px arrow, no wrapping, fading in 100ms. A tooltip is never the only place
 * important information lives (BUILD-PLAN P2.4).
 */

/** Wrap an area that has tooltips once; the delay applies to all of them. */
export function TooltipProvider({
  delayDuration = 300,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
}

export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export function TooltipContent({
  className,
  sideOffset = 5,
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  const container = usePortalContainer()
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'z-(--liro-layer-tooltip) rounded-sm bg-surface-inverse px-2.5 py-[5px] font-sans text-xs whitespace-nowrap text-on-inverse data-[state=closed]:animate-liro-tooltip-out data-[state=delayed-open]:animate-liro-tooltip-in data-[state=instant-open]:animate-liro-tooltip-in',
          className,
        )}
        {...props}
      >
        {children}
        {/* Mantine's 4px arrow is a square turned 45°: a triangle 5.66px wide and 2.83px high. */}
        <TooltipPrimitive.Arrow
          width={4 * Math.SQRT2}
          height={2 * Math.SQRT2}
          className="fill-(--liro-surface-inverse)"
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}
