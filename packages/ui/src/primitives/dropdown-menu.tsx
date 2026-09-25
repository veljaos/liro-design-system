import { Check, ChevronRight } from 'lucide-react'
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { usePortalContainer } from '../provider/portal'
import { FLOATING, FLOATING_MOTION, MENU_ITEM } from './classes'
import { cn } from './cn'

/*
 * A menu of actions (shadcn/ui dropdown-menu, adapted; Mantine Menu.css and Popover defaults):
 * 8px from its trigger, 4px padding, the floating surface. Items: MENU_ITEM, icons 15px (the
 * Liro icon size beside text) 10px before the label. A submenu opens towards the inline end: to
 * the right in left-to-right, to the left in right-to-left (Radix reads the provider's
 * direction), and its chevron is drawn mirrored in right-to-left.
 */

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuGroup = DropdownMenuPrimitive.Group
export const DropdownMenuSub = DropdownMenuPrimitive.Sub
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const ICONS = '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-3.75'

export function DropdownMenuContent({
  className,
  sideOffset = 8,
  align = 'start',
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  const container = usePortalContainer()
  return (
    <DropdownMenuPrimitive.Portal container={container}>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        className={cn(
          FLOATING,
          FLOATING_MOTION,
          'max-h-(--radix-dropdown-menu-content-available-height) min-w-40 overflow-x-hidden overflow-y-auto p-1',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(MENU_ITEM, 'gap-2.5', ICONS, className)}
      {...props}
    />
  )
}

/** Checkbox and radio items keep a 12px column for their mark, 8px before the label (Menu.css). */
const INDICATOR = 'flex size-3 shrink-0 items-center justify-center'

export function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(MENU_ITEM, 'gap-2', ICONS, className)}
      {...props}
    >
      <span className={INDICATOR}>
        <DropdownMenuPrimitive.ItemIndicator>
          <Check aria-hidden="true" className="size-3" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(MENU_ITEM, 'gap-2', ICONS, className)}
      {...props}
    >
      <span className={INDICATOR}>
        <DropdownMenuPrimitive.ItemIndicator>
          <span className="block size-1.5 rounded-full bg-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

/** A heading inside the menu (Menu.css label): 12px, weight 600, text.secondary, 5px 12px. */
export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      className={cn('px-3 py-[5px] text-xs font-semibold text-secondary', className)}
      {...props}
    />
  )
}

/** A line between groups (Menu.css divider): 1px, 4px above and below. */
export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('-mx-1 my-1 border-t border-default', className)}
      {...props}
    />
  )
}

/** A keyboard shortcut at the end of an item. */
export function DropdownMenuShortcut({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn('ms-auto ps-2.5 text-xs text-secondary', className)}
      {...props}
    />
  )
}

export function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubTrigger>) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      className={cn(
        MENU_ITEM,
        'gap-2.5 pe-[5px] data-[state=open]:bg-surface-sunken',
        ICONS,
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight aria-hidden="true" className="ms-auto rtl:-scale-x-100" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

export function DropdownMenuSubContent({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  const container = usePortalContainer()
  return (
    <DropdownMenuPrimitive.Portal container={container}>
      <DropdownMenuPrimitive.SubContent
        data-slot="dropdown-menu-sub-content"
        className={cn(FLOATING, FLOATING_MOTION, 'min-w-40 p-1', className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}
