import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { BUTTON_RESET, FOCUS_RING } from './classes'
import { cn } from './cn'

/*
 * A row of toggles, one or several pressed (shadcn/ui toggle-group, adapted). Mantine's equivalent
 * is SegmentedControl (SegmentedControl.css, size 'sm', withItemsBorders): a track with 4px
 * padding and radius md on surface.sunken; items 13px, weight 600, padding 3px 10px, radius 4px
 * (md − 4px), text.secondary, text.primary on hover and when pressed; a pressed item sits on the
 * raised surface with shadow xs; a 1px border.default line between items. Arrow keys follow the
 * provider's direction (Radix). shadcn/ui's separate toggle is not needed: the group renders its
 * own items.
 */

export function ToggleGroup({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn(
        'inline-flex w-auto items-stretch overflow-hidden rounded-md bg-surface-sunken p-1 font-sans data-[orientation=vertical]:flex-col',
        className,
      )}
      {...props}
    />
  )
}

export function ToggleGroupItem({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        BUTTON_RESET,
        'relative flex-1 cursor-pointer rounded-sm px-2.5 py-[3px] text-center text-sm font-semibold whitespace-nowrap text-secondary transition-colors duration-(--liro-duration-base) ease-standard select-none',
        'enabled:hover:text-primary data-[state=on]:bg-surface-raised data-[state=on]:text-primary data-[state=on]:shadow-xs',
        'before:absolute before:inset-y-0 before:start-0 before:w-0 before:border-s before:border-default first:before:hidden data-[state=on]:before:hidden [[data-state=on]+&]:before:hidden',
        'disabled:cursor-not-allowed disabled:text-disabled',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  )
}
