import { Switch as SwitchPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { BUTTON_RESET, FOCUS_RING } from './classes'
import { cn } from './cn'

/**
 * An on/off switch (shadcn/ui switch, adapted; Mantine Switch.css, size 'sm'): a 38×20px track,
 * fully rounded, with a 14px white thumb 2.5px from the edge. Off: the track is filled with
 * border.control (owner's decision: Mantine's gray-3 did not meet 3:1); on: brand.solid.
 * Disabled: surface.disabled. The thumb carries a dot 40% of its size in the track's colour
 * (withThumbIndicator, on by default; added in P2.2a). The thumb moves along the inline axis, so it starts at the
 * leading edge in both directions (150ms). An invisible 2px margin makes the target 24px high.
 */
export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        BUTTON_RESET,
        'peer relative inline-flex h-5 w-9.5 shrink-0 cursor-pointer items-center rounded-full bg-control transition-colors duration-(--liro-duration-base) ease-standard after:absolute after:-inset-y-0.5 after:inset-x-0',
        'data-[state=checked]:not-disabled:bg-brand-solid disabled:cursor-not-allowed disabled:bg-surface-disabled',
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none absolute start-[2.5px] block size-3.5 rounded-full bg-current text-on-accent transition-[inset-inline-start] duration-(--liro-duration-base) ease-standard before:absolute before:inset-0 before:m-auto before:size-[40%] before:rounded-full before:bg-control data-[state=checked]:start-[21.5px] data-[state=checked]:not-data-disabled:before:bg-brand-solid data-disabled:before:bg-surface-disabled"
      />
    </SwitchPrimitive.Root>
  )
}
