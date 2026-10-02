import { Check } from 'lucide-react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import { createContext, useContext, type ComponentProps } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from './classes'
import { cn } from './cn'

/*
 * A row of toggles, one or several pressed (shadcn/ui toggle-group, adapted). Arrow keys follow the
 * provider's direction (Radix). shadcn/ui's separate toggle is not needed: the group renders its
 * own items.
 *
 * One pressed (`type="single"`, e.g. Month / Quarter / Year): Mantine's SegmentedControl
 * (SegmentedControl.css, size 'sm', withItemsBorders): a track with 4px padding and radius md on
 * surface.sunken; items 13px, weight 600, padding 3px 10px, radius 4px (md − 4px), text.secondary,
 * text.primary on hover and when pressed; a pressed item sits on the raised surface with shadow
 * xs; a 1px border.default line between items.
 *
 * Several pressed (`type="multiple"`; P3.6, owner: the segmented look is only for one choice):
 * separate toggles, Mantine's Chip (Chip.css, size 'sm', variant outline) with the old system's
 * radius sm (4px) — pills are kept for removable filters: 28px high, 13px, padding 20px; the
 * raised surface with a 1px border.default border, surface.hover on hover. Pressed: a 12px check
 * in a 20px slot (12 + 12 / 1.5) at the start, padding 10px, and the neutral selection —
 * surface.selected with a border.selected border — never blue. 8px (xs) between toggles.
 */

const TypeContext = createContext<'single' | 'multiple'>('single')

export function ToggleGroup({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <TypeContext.Provider value={props.type}>
      <ToggleGroupPrimitive.Root
        data-slot="toggle-group"
        className={cn(
          props.type === 'multiple'
            ? 'inline-flex flex-wrap items-center gap-2 font-sans data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start'
            : 'inline-flex w-auto items-stretch overflow-hidden rounded-md bg-surface-sunken p-1 font-sans data-[orientation=vertical]:flex-col',
          className,
        )}
        {...props}
      />
    </TypeContext.Provider>
  )
}

export function ToggleGroupItem({
  className,
  children,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  const type = useContext(TypeContext)
  if (type === 'multiple') {
    return (
      <ToggleGroupPrimitive.Item
        data-slot="toggle-group-item"
        className={cn(
          BUTTON_RESET,
          'group inline-flex h-7 cursor-pointer items-center rounded-sm border border-solid border-default bg-surface-raised px-5 text-sm whitespace-nowrap text-primary transition-colors duration-(--liro-duration-base) ease-standard select-none',
          'enabled:hover:bg-surface-hover data-[state=on]:border-selected data-[state=on]:bg-surface-selected data-[state=on]:px-2.5 data-[state=on]:enabled:hover:bg-surface-selected',
          'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-disabled disabled:text-disabled',
          FOCUS_RING,
          className,
        )}
        {...props}
      >
        <span aria-hidden="true" className="hidden w-5 shrink-0 group-data-[state=on]:flex">
          <Check className="size-3" />
        </span>
        <span className={TEXT_DIRECTION}>{children}</span>
      </ToggleGroupPrimitive.Item>
    )
  }
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        BUTTON_RESET,
        'relative flex-1 cursor-pointer rounded-sm px-2.5 py-[3px] text-center text-sm font-semibold whitespace-nowrap text-secondary transition-colors duration-(--liro-duration-base) ease-standard select-none',
        'enabled:hover:text-primary data-[state=on]:bg-surface-raised data-[state=on]:text-primary data-[state=on]:shadow-xs',
        'before:absolute before:inset-y-0 before:start-0 before:w-0 before:border-s before:border-default first:before:hidden data-[state=on]:before:hidden [[data-state=on]+&]:before:hidden',
        'disabled:cursor-not-allowed disabled:text-disabled',
        TEXT_DIRECTION,
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}
