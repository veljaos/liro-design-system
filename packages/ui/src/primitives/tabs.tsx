import { Tabs as TabsPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { BUTTON_RESET, FOCUS_RING } from './classes'
import { cn } from './cn'

/*
 * Tabs (shadcn/ui tabs, adapted; Mantine Tabs.css, variant 'default'). The list has a 2px line
 * in border.default under it (at the inline end when vertical); each tab has a 2px edge on that
 * side, border.brand when active, border.default and surface.hover on hover. Tab: 13px, line
 * height 1, padding 10px by 16px, rounded (radius md) away from the line. Arrow keys follow the
 * provider's direction (Radix).
 */

export function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col data-[orientation=vertical]:flex-row', className)}
      {...props}
    />
  )
}

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'relative flex flex-wrap before:absolute before:border before:border-solid before:border-default',
        'data-[orientation=horizontal]:before:inset-x-0 data-[orientation=horizontal]:before:bottom-0',
        'data-[orientation=vertical]:flex-col data-[orientation=vertical]:before:inset-y-0 data-[orientation=vertical]:before:end-0',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        BUTTON_RESET,
        'relative z-0 flex cursor-pointer items-center gap-2.5 border-transparent px-4 py-2.5 font-sans text-sm leading-none whitespace-nowrap text-primary select-none focus:z-(--liro-layer-raised)',
        'data-[orientation=horizontal]:rounded-t-md data-[orientation=horizontal]:border-b-2',
        'data-[orientation=vertical]:rounded-s-md data-[orientation=vertical]:border-e-2',
        'enabled:hover:border-default enabled:hover:bg-surface-hover data-[state=active]:border-brand data-[state=active]:hover:border-brand',
        'disabled:cursor-not-allowed disabled:text-disabled',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('grow outline-none', FOCUS_RING, className)}
      {...props}
    />
  )
}
